import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

/** Where a project keeps its model — the file generation reads. */
const MODEL_YAML_PATH = "model/model.eml.yaml";

/**
 * Which generator produced an application: a hash of the bundle this process
 * loaded, so two generations can be told apart even at the same version.
 */
async function generatorRevision(): Promise<string> {
  try {
    const entry = createRequire(import.meta.url).resolve("@appwithai/generator");
    return createHash("sha256")
      .update(await fs.readFile(entry))
      .digest("hex");
  } catch {
    return "unknown";
  }
}

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const { projectId, stackType, stackOption, erdCode } = body;

        console.log("Generate API received:", {
          projectId: projectId ? "SET" : "MISSING",
          stackType: stackType ? stackType : "MISSING",
          stackOption: stackOption ? stackOption : "MISSING",
          erdCode: erdCode ? `SET (${erdCode.length} chars)` : "MISSING",
        });

        /*
         * The project comes from the body, not the path, so there is no `$id`
         * segment for a route-level guard to key on — but generating writes a
         * whole application into someone's project directory, which is the most
         * consequential thing this API does. Checked before the stream opens:
         * a 401 or 404 is a plain response, and once the SSE stream starts the
         * only way to report a refusal is as a `data:` line the client has to
         * remember to look at.
         */
        const { requireProjectAccess } = await import("@/lib/project-access");
        const access = await requireProjectAccess(request, String(projectId ?? ""), "read_write");
        if (access.response) return access.response;

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            const sendLog = (level: string, message: string) => {
              const data = `data: ${JSON.stringify({ log: message, level })}\n\n`;
              controller.enqueue(encoder.encode(data));
            };

            const sendComplete = (outputPath: string, result: Record<string, unknown>) => {
              const data = `data: ${JSON.stringify({
                complete: true,
                path: outputPath,
                model: path.join(outputPath, ".appwithai/generated-model.eml.yaml"),
                ...result,
              })}\n\n`;
              controller.enqueue(encoder.encode(data));
            };

            const sendError = (error: string) => {
              const data = `data: ${JSON.stringify({ error })}\n\n`;
              controller.enqueue(encoder.encode(data));
            };

            let stagingRoot: string | undefined;
            try {
              if (!projectId) {
                sendError("Missing required field: projectId");
                controller.close();
                return;
              }

              const { prepareGeneration, publishGeneration } = await import(
                "@/lib/server/project-repository"
              );
              const { projectDb } = await import("@appwithai/core/services");
              const { generateApplication } = await import("@appwithai/generator");
              const { ModelYamlError, parseModelYaml } = await import(
                "@appwithai/generator/model-yaml"
              );

              sendLog("info", "Loading project details...");
              const project = await projectDb.findById(projectId);
              if (!project) {
                sendError("Project not found in database");
                controller.close();
                return;
              }

              /*
               * Generation reads a saved model, never an unsaved one: the input
               * is committed to the project's local Git history first, so the
               * application can always be traced back to the model that
               * produced it (`.appwithai/generation.json` records the commit).
               */
              const prepared = await prepareGeneration(projectId, access.user.id, {
                model: erdCode || project.erdCode,
                requestId: body.requestId ? `${body.requestId}-model` : undefined,
                expectedCommit: body.expectedCommit,
              });
              const finalErdCode = prepared.model;
              if (!finalErdCode) {
                sendError("No ERD code found. Please create an ERD diagram first.");
                controller.close();
                return;
              }

              const requestedStack =
                stackOption || stackType || project.stackType || "tanstack-astryx-loco";
              // Only known stacks reach the generator; anything else falls back
              // rather than being passed through to a template lookup that
              // would fail with a confusing path error.
              const supportedStacks = ["tanstack-astryx-loco", "tanstack-astryx-loco"];
              const finalStackType = supportedStacks.includes(requestedStack)
                ? requestedStack
                : "tanstack-astryx-loco";
              if (finalStackType !== requestedStack) {
                sendLog(
                  "warning",
                  `Unknown stack "${requestedStack}", falling back to ${finalStackType}`
                );
              }
              const finalStackOption = finalStackType;

              sendLog("info", `Initializing generator for stack: ${finalStackType}`);

              /*
               * The saved YAML is the model; the Mermaid is the drawing of it.
               * It is validated here exactly as the CLI validates a model file,
               * so a model the generator would misread is refused with the line
               * that is wrong rather than generated.
               */
              sendLog("info", `Reading the saved model (${MODEL_YAML_PATH})...`);
              let parsed: ReturnType<typeof parseModelYaml>;
              try {
                parsed = parseModelYaml(prepared.modelYaml, {
                  source: MODEL_YAML_PATH,
                  warn: (message) => sendLog("warning", message),
                });
              } catch (error) {
                if (error instanceof ModelYamlError) {
                  for (const diagnostic of error.diagnostics.filter(
                    (d) => d.severity === "error"
                  )) {
                    sendLog(
                      "error",
                      `${MODEL_YAML_PATH}:${diagnostic.line}:${diagnostic.column} ${diagnostic.code} ${diagnostic.message}`
                    );
                  }
                }
                throw error;
              }
              for (const diagnostic of parsed.diagnostics.filter((d) => d.severity === "warning")) {
                sendLog(
                  "warning",
                  `${MODEL_YAML_PATH}:${diagnostic.line}:${diagnostic.column} ${diagnostic.code} ${diagnostic.message}`
                );
              }
              const { model, document } = parsed;
              const { entities, relationships } = model;
              sendLog(
                "success",
                `Parsed ${entities.length} entities and ${relationships.length} relationships`
              );
              if (model.categories.length > 0) {
                sendLog("info", `Categories: ${model.categories.map((c) => c.name).join(", ")}`);
              }
              if (model.enums.length > 0) {
                sendLog("info", `Enums: ${model.enums.map((e) => e.name).join(", ")}`);
              }
              if (model.sagas.length > 0) {
                sendLog("info", `Sagas: ${model.sagas.map((s) => s.name).join(", ")}`);
              }

              /*
               * Generated into a staging directory beside the project, then
               * merged into it by `publishGeneration`: a file someone edited in
               * the generated application since the last run is kept rather
               * than overwritten, and the result is one commit.
               */
              const outputDir = prepared.directory;
              stagingRoot = await fs.mkdtemp(path.join(path.dirname(outputDir), ".generation-"));
              const stageOutput = path.join(stagingRoot, "application");
              sendLog("info", `Generating from saved model ${prepared.modelCommit.slice(0, 8)}`);

              sendLog(
                "info",
                `Generating ${entities.length} entities (${relationships.length} relationships)...`
              );
              /*
               * Through the pipeline, not a hand-built options object.
               *
               * This route used to construct `FullStackGeneratorOptions` itself
               * with six fields, so an application generated from the UI lost
               * every `%%category`, every `%%enum` dropdown and every saga the
               * model declared — and said "Generated successfully" anyway.
               */
              await generateApplication({
                document,
                model,
                stackOption: finalStackOption,
                projectName: project.name || `Project ${projectId}`,
                projectVersion: "1.0.0",
                projectDescription:
                  project.description || `Generated ${finalStackType} application`,
                outputDir: stageOutput,
                port: project.port || 4000,
                manifest: { input: { projectId } },
              });
              sendLog("success", `Generated ${entities.length} entities successfully`);

              // `publishGeneration` records `generated_path` and the
              // deployment status in the same transaction as the commit.
              const result = await publishGeneration(
                projectId,
                access.user.id,
                prepared,
                stageOutput,
                {
                  stack: finalStackType,
                  port: project.port || 4000,
                  database: "postgresql",
                  generator: "@appwithai/generator",
                  generatorRevision: await generatorRevision(),
                },
                body.requestId
              );
              sendLog("success", `Code saved to local Git ${result.commit.slice(0, 8)}`);
              if (result.stale)
                sendLog(
                  "warn",
                  "The saved model changed during generation. This output is linked to its original input."
                );

              sendLog("success", "Code generation complete");
              sendComplete(outputDir, result);
              controller.close();
            } catch (error) {
              console.error("Generation error:", error);
              sendError(error instanceof Error ? error.message : "Generation failed");
              controller.close();
            } finally {
              if (stagingRoot) await fs.rm(stagingRoot, { recursive: true, force: true });
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
