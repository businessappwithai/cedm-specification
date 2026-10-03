/**
 * Step 2 — the model.
 *
 * The model is a YAML document, and this page edits it: the YAML on one side,
 * diagrams drawn from it on the other (`ModelViewer`), every finding of the
 * generator's own reader at its line. The assistant writes a new model from a
 * description or revises this one; what it returns is checked before it is
 * shown, and nothing is saved until the author saves it.
 *
 * Every save is a commit in the project's local Git history. A draft may be
 * unfinished; a named version must pass the model checker.
 */

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  History,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { DbOperationsModal } from "@/components/DbOperationsModal";
import { JourneyArc } from "@/components/JourneyArc";
import { ModelViewer, type ModelReadState, type ModelViewerHandle } from "@/components/model/ModelViewer";
import { ProgressStepper } from "@/components/ProgressStepper";
import { ProjectGitHistory } from "@/components/project/ProjectGitHistory";
import { WizardStepHeader } from "@/components/WizardStepHeader";
import { useModelAssistant } from "@/hooks/useModelAssistant";
import { type ERDVersion, erdVersionsApi } from "@/lib/api/projects";
import { useProjectStore } from "@/store/projectStore";
import type { LibraryModel } from "@/types/project";

export const Route = createFileRoute("/projects/$id/design")({
  component: DesignRoute,
});

// CopilotProvider must sit above the component that calls the Copilot hooks.
function DesignRoute() {
  return (
    <CopilotProvider>
      <DesignPage />
    </CopilotProvider>
  );
}

interface AssistantResult {
  model: string;
  ok: boolean;
  attempts: number;
  dropped: string[];
  diagnostics: Array<{ severity: string; line: number; column: number; code: string; message: string }>;
}

/** Read a server-sent event stream, calling `onEvent` for each `data:` line. */
async function readEvents(response: Response, onEvent: (data: Record<string, unknown>) => void) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The response has no body");
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) onEvent(JSON.parse(line.slice(6)));
    }
  }
}

/** A file name someone can find again, from the project's own name. */
function fileNameFor(name: string, version: number): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "model";
  return `${slug}-v${version}.eml.yaml`;
}

function DesignPage() {
  const navigate = useNavigate();
  const { id: projectId } = Route.useParams();
  const {
    getProject,
    loadProject,
    saveModelDraft,
    saveModelVersion,
    restoreModelVersion,
    setCurrentStep,
    goToNextStep,
    currentProject,
    isLoading,
  } = useProjectStore();
  const project = getProject(projectId) || currentProject;

  useEffect(() => {
    if (!getProject(projectId) && !currentProject) void loadProject(projectId);
  }, [projectId, getProject, currentProject, loadProject]);

  const saved = project?.modelYaml ?? "";
  const [model, setModel] = useState("");
  const [read, setRead] = useState<ModelReadState>({ diagnostics: [], ok: false });
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<ERDVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [gitRefresh, setGitRefresh] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [library, setLibrary] = useState<LibraryModel[]>([]);
  const [prompt, setPrompt] = useState("");
  const [assistant, setAssistant] = useState<{
    running: boolean;
    step?: string;
    message?: string;
    result?: AssistantResult;
  }>({ running: false });
  const viewer = useRef<ModelViewerHandle>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const modelRef = useRef(model);
  modelRef.current = model;

  // Load the saved model once the project is here; afterwards the editor owns it.
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!project || loadedFor.current === project.id) return;
    loadedFor.current = project.id;
    setCurrentStep("design");
    setModel(project.modelYaml ?? "");
  }, [project, setCurrentStep]);

  const dirty = model !== saved;

  useCopilotReadable({
    description:
      "The application's model: a YAML document in the AppWithAI model language (entities, relationships, rules, state machines, sagas). It is the source of truth.",
    value: modelRef.current,
  });
  useModelAssistant({ projectId, surface: "entities" });
  useCopilotAction({
    name: "updateModel",
    description:
      "Replace the model with a revised YAML document. Send the complete document; it is checked and shown to the author, who decides whether to save it.",
    parameters: [
      { name: "model", type: "string", description: "The complete revised YAML document", required: true },
    ],
    handler: ({ model: next }: { model: string }) => {
      setModel(next);
      setNotice({ tone: "info", text: "The assistant revised the model. Review it, then save." });
    },
  });

  const loadVersions = useCallback(async () => {
    setIsLoadingVersions(true);
    try {
      setVersions(await erdVersionsApi.getAll(projectId));
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not load versions" });
    } finally {
      setIsLoadingVersions(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (showVersions) void loadVersions();
  }, [showVersions, loadVersions]);

  const save = async (asVersion: boolean) => {
    setIsSaving(true);
    setNotice({ tone: "info", text: "Saving to the project's local Git history…" });
    try {
      if (asVersion) {
        await saveModelVersion(projectId, model, commitMessage || "Saved version");
        setCommitMessage("");
        await loadVersions();
      } else {
        await saveModelDraft(projectId, model);
      }
      setNotice({ tone: "info", text: asVersion ? "Version saved." : "Draft saved." });
      setGitRefresh((value) => value + 1);
      return true;
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Save failed. Your edits are still here.",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const restore = async (version: ERDVersion) => {
    if (dirty) {
      setNotice({ tone: "error", text: "Save or discard your edits before restoring a version." });
      return;
    }
    try {
      await restoreModelVersion(projectId, version.id);
      setModel(version.model_yaml);
      setGitRefresh((value) => value + 1);
      await loadVersions();
      setNotice({
        tone: "info",
        text: `Version ${version.version_number} restored in a new commit. Regenerate the application to match.`,
      });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Restore failed" });
    }
  };

  const runAssistant = async () => {
    if (!prompt.trim() || assistant.running) return;
    setAssistant({ running: true, step: "starting", message: "Sending the request…" });
    try {
      const response = await fetch("/api/ai/convert-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: prompt,
          currentModel: model.trim() ? model : undefined,
          name: project?.name,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `The assistant could not be reached (${response.status})`);
      }
      let result: AssistantResult | undefined;
      await readEvents(response, (data) => {
        if (data.step === "error") throw new Error(String(data.message));
        if (data.step === "complete") result = data as unknown as AssistantResult;
        else setAssistant((current) => ({ ...current, step: String(data.step), message: String(data.message) }));
      });
      if (!result) throw new Error("The assistant finished without a model");
      setModel(result.model);
      setPrompt("");
      setAssistant({ running: false, result });
    } catch (error) {
      setAssistant({ running: false, step: "error", message: error instanceof Error ? error.message : String(error) });
    }
  };

  const exportModel = async () => {
    if (!model.trim()) return;
    const filename = fileNameFor(project?.name ?? "model", versions.length + 1);
    const response = await fetch("/api/model-library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, filename, content: model }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setNotice({ tone: "error", text: body.error ?? "The model could not be kept in the library" });
    }
    const url = URL.createObjectURL(new Blob([model], { type: "application/yaml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openImport = async () => {
    setShowImport(true);
    const response = await fetch(`/api/model-library?projectId=${encodeURIComponent(projectId)}`);
    const body = await response.json().catch(() => ({}));
    setLibrary(response.ok ? (body.files ?? []) : []);
  };

  const importText = (text: string, from: string) => {
    setModel(text);
    setShowImport(false);
    setNotice({ tone: "info", text: `Loaded ${from}. It is not saved until you save it.` });
  };

  const continueToLogic = async () => {
    if (dirty && !(await save(false))) return;
    goToNextStep();
    navigate({ to: "/projects/$id/logic", params: { id: projectId } });
  };

  if (isLoading || (!project && !getProject(projectId))) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-muted-foreground">
        <Zap className="h-6 w-6 animate-pulse text-primary" />
        Loading project…
      </div>
    );
  }
  if (!project) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Project not found</div>;
  }

  const errors = read.diagnostics.filter((d) => d.severity === "error").length;

  return (
    <CopilotSidebar
      instructions="You help design an application's model, a YAML document in the AppWithAI model language. Read the current model from context. To change it, call updateModel with the complete revised document; the author reviews and saves it."
      defaultOpen={false}
    >
      <div className="flex min-h-screen flex-col bg-background">
        {!isFullscreen && (
          <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
            <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-2 px-6 py-3">
              <button type="button" onClick={() => setShowVersions((v) => !v)} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <History className="h-4 w-4" /> Versions{versions.length ? ` (${versions.length})` : ""}
              </button>
              <button type="button" onClick={() => setShowDbModal(true)} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Database className="h-4 w-4" /> Database
              </button>
              <button type="button" onClick={() => void openImport()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Upload className="h-4 w-4" /> Import
              </button>
              <button type="button" onClick={() => void exportModel()} disabled={!model.trim()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50">
                <Download className="h-4 w-4" /> Export
              </button>
              <button type="button" onClick={() => void save(false)} disabled={isSaving || !dirty || !model.trim()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {dirty ? "Save draft" : "Saved"}
              </button>
              <button type="button" onClick={() => setIsFullscreen(true)} className="rounded-lg border border-border p-2" aria-label="Full screen">
                <Maximize2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => void continueToLogic()} disabled={isSaving || !model.trim()} className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                <Zap className="h-4 w-4" /> Continue to Logic
              </button>
            </div>
            <div className="mx-auto max-w-[1800px] px-6 pb-3">
              <ProgressStepper currentStep="design" projectId={projectId} completedSteps={["init", "design"]} />
            </div>
          </header>
        )}

        {!isFullscreen && (
          <div className="mx-auto w-full max-w-[1800px] px-6 pt-4">
            <WizardStepHeader
              stepNumber={2}
              title="Design the model"
              description="The model is a YAML document: entities and relationships, and the rules and workflows that act on them. Edit the YAML, or describe what you need below; the diagrams are drawn from the document as it stands."
              estimatedTime="3-5 min"
            />
            <JourneyArc currentStep="design" />
          </div>
        )}

        {notice && (
          <div
            role="status"
            className={`mx-auto mt-3 flex w-full max-w-[1800px] items-start gap-2 px-6 text-sm ${notice.tone === "error" ? "text-destructive" : "text-muted-foreground"}`}
          >
            {notice.tone === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <p className="whitespace-pre-wrap">{notice.text}</p>
            <button type="button" className="ml-auto" onClick={() => setNotice(null)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <main className={isFullscreen ? "fixed inset-0 z-50 flex flex-col bg-background p-3" : "mx-auto flex w-full max-w-[1800px] flex-1 gap-3 px-6 py-4"}>
          {isFullscreen && (
            <button type="button" onClick={() => setIsFullscreen(false)} className="mb-2 flex items-center gap-2 self-end rounded-lg border border-border px-3 py-1.5 text-sm">
              <Minimize2 className="h-4 w-4" /> Exit full screen
            </button>
          )}

          {showVersions && !isFullscreen && (
            <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
              <div className="border-b border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Save a version</p>
                <div className="flex gap-2">
                  <input
                    value={commitMessage}
                    onChange={(event) => setCommitMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && commitMessage.trim()) void save(true);
                    }}
                    placeholder="What changed"
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <button type="button" onClick={() => void save(true)} disabled={!commitMessage.trim() || isSaving || errors > 0} title={errors ? "A version must pass the model checker" : "Save version"} className="rounded-md bg-primary px-2.5 text-primary-foreground disabled:opacity-50">
                    <Save className="h-4 w-4" />
                  </button>
                </div>
                {errors > 0 && <p className="mt-1.5 text-xs text-destructive">Fix the {errors} error(s) first: a version must pass the model checker.</p>}
              </div>
              <ProjectGitHistory
                projectId={projectId}
                refresh={gitRefresh}
                dirty={dirty}
                onRestored={() => {
                  loadedFor.current = null;
                  void loadProject(projectId);
                  void loadVersions();
                }}
              />
              <div className="flex-1 overflow-y-auto">
                {isLoadingVersions ? (
                  <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading versions…
                  </p>
                ) : versions.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No versions yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {versions.map((version) => (
                      <li key={version.id} className="flex items-start gap-2 p-3 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            v{version.version_number}
                            {version.is_current && <span className="ml-2 rounded bg-primary/10 px-1.5 text-xs text-primary">current</span>}
                          </p>
                          <p className="truncate text-muted-foreground">{version.description || "No description"}</p>
                          <button type="button" onClick={() => setModel(version.model_yaml)} className="mt-1 text-xs text-primary hover:underline">
                            Open in the editor
                          </button>
                        </div>
                        {!version.is_current && (
                          <button type="button" onClick={() => void restore(version)} title="Restore this version" className="rounded p-1 hover:bg-muted">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          )}

          <ModelViewer
            ref={viewer}
            value={model}
            onChange={setModel}
            onRead={setRead}
            className="min-h-[calc(100vh-360px)] flex-1"
          />
        </main>

        {!isFullscreen && (
          <footer className="border-t border-border bg-background">
            <div className="mx-auto max-w-[1800px] px-6 py-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void runAssistant();
                  }}
                  disabled={assistant.running}
                  placeholder={model.trim() ? "Describe a change to the model… (Ctrl+Enter)" : "Describe the business — what it keeps records of and how they relate… (Ctrl+Enter)"}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm"
                />
                <button type="button" onClick={() => void runAssistant()} disabled={assistant.running || !prompt.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {assistant.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {assistant.running ? "Working…" : model.trim() ? "Revise" : "Create"}
                </button>
              </div>
              {(assistant.running || assistant.step === "error") && (
                <p className={`mt-2 text-sm ${assistant.step === "error" ? "text-destructive" : "text-muted-foreground"}`}>{assistant.message}</p>
              )}
              {assistant.result && !assistant.running && (
                <div className="mt-2 text-sm">
                  {assistant.result.ok ? (
                    <p className="text-emerald-600 dark:text-emerald-400">
                      The model {model === saved ? "is unchanged" : "was updated"} and passes the checker
                      {assistant.result.attempts > 1 ? ` (after ${assistant.result.attempts} attempts)` : ""}. Review it, then save.
                    </p>
                  ) : (
                    <p className="text-destructive">
                      The assistant's model still has errors after {assistant.result.attempts} attempt(s); they are listed under the YAML. Fix them there or describe the fix.
                    </p>
                  )}
                  {assistant.result.dropped.length > 0 && (
                    <p className="text-amber-700 dark:text-amber-300">
                      Left out, because they name entities the analysis did not declare: {assistant.result.dropped.join("; ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </footer>
        )}
      </div>

      <DbOperationsModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
        projectId={projectId}
        onReverseEngineered={(next, skipped) => {
          setModel(next);
          setShowDbModal(false);
          setNotice({
            tone: skipped.length ? "error" : "info",
            text: skipped.length
              ? `Read from the database; not saved yet. Left out:\n${skipped.map((s) => `  ${s.table}${s.column ? `.${s.column}` : ""}: ${s.reason}`).join("\n")}`
              : "Read from the database; not saved yet.",
          });
        }}
      />

      <input
        ref={fileInput}
        type="file"
        accept=".yaml,.yml,application/yaml,text/yaml"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) importText(await file.text(), file.name);
        }}
      />

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Import a model">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="font-semibold">Import a model</h2>
              <button type="button" onClick={() => setShowImport(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <button type="button" onClick={() => fileInput.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm hover:bg-muted/40">
                <Upload className="h-5 w-5 text-muted-foreground" />
                Choose a .eml.yaml file
              </button>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">This project's library</p>
                {library.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing yet — Export keeps a copy here.</p>
                ) : (
                  <ul className="max-h-64 space-y-1 overflow-y-auto">
                    {library.map((file) => (
                      <li key={file.filename}>
                        <button type="button" onClick={() => importText(file.content, file.filename)} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted">
                          <span className="truncate font-mono">{file.filename}</span>
                          <span className="text-xs text-muted-foreground">{new Date(file.createdAt).toLocaleDateString()}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </CopilotSidebar>
  );
}
