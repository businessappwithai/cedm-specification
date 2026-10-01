/**
 * The published sites' in-browser generator, and their model viewers.
 *
 * Each site vendors `appwithai-wasm.js`, which used to compile a Mermaid model
 * itself. Its pages now compile a YAML model with `appwithai-model.js`
 * (`language/browser/browser-generator.entry.ts`) and hand the result to the
 * bundle's `generateFromModel`, added by `scripts/patch-vendored-generators.ts`.
 *
 * Three things are compared, per site and per published model:
 *
 * 1. **The compiled model.** The model built from YAML must equal, byte for
 *    byte and key order included, the one the original bundle compiled from
 *    the Mermaid model.
 * 2. **The generated application.** The original bundle's `generateFromSource`
 *    over the Mermaid model and the patched bundle's `generateFromModel` over
 *    the YAML must write the same files with the same contents, except: the
 *    model file itself (`model/model.eml.mmd` became `model/model.eml.yaml`),
 *    the text the patch changes (each named in `REPLACEMENTS`, applied to the
 *    Mermaid side before comparing), and the generation timestamp.
 * 3. **What the viewers draw** (the website only carries the viewers' original
 *    reader). `readModelForViewer` must equal the original reader's model,
 *    except for the three differences named in `viewerDifferenceAccepted`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  compileForBrowser,
  readModelForViewer,
} from "../../language/browser/browser-generator.entry";
import { REPLACEMENTS } from "../../scripts/patch-vendored-generators";
import { type Check, YAML_ROOT, differences } from "./lib";

interface Site {
  name: string;
  /** The vendored bundle, relative to the repository's copy. */
  bundle: string;
  models: string;
  published: string[];
  viewer?: string;
}

const SITES: Site[] = [
  {
    name: "businessappwithairust",
    bundle: "assets/js/appwithai-wasm.js",
    models: "guide/models",
    published: [
      "crm",
      "dance-studio",
      "drug-discovery",
      "education-management-system",
      "hospital-management-system",
      "investment-planning-wealth-management-system",
    ],
    viewer: "viewers/eml-model.js",
  },
  {
    name: "app-and-report-with-ai-rust",
    bundle: "common/html/assets/appwithai-wasm.js",
    models: "common/html/models",
    published: ["crm", "drug-discovery", "investment-planning-wealth-management-system"],
  },
];

const OPTIONS = {
  name: "Verification App",
  adminEmail: "admin@admin.com",
  adminPassword: "admin",
  adminName: "admin",
  sampleRecords: 10,
  sampleSeed: "Verification App",
};

function quietly<T>(run: () => T): T {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return run();
  } finally {
    console.warn = warn;
  }
}

/**
 * The Mermaid side's file, taken through exactly the patch's text changes, as
 * they read in the generated output: a template literal in the bundle renders
 * `\\`` as a backtick.
 */
function asPatched(text: string): string {
  let out = text;
  for (const [from, to] of REPLACEMENTS) {
    const rendered = (value: string) => value.replaceAll("\\`", "`");
    out = out.replaceAll(rendered(from), rendered(to));
  }
  // The reporting pack's default model file name, as it lands in app/model.json.
  return out.replace(/("model": "[\w-]+)\.eml\.mmd"/g, '$1.eml.yaml"');
}

/** When a run happened, which is all two runs of the same generator differ in. */
function withoutTimestamps(text: string): string {
  return text
    .replace(/"generatedAt": "[^"]+"/g, '"generatedAt": "<t>"')
    .replace(/<time datetime="[^"]+">[^<]+<\/time>/g, "<time>…</time>");
}

/**
 * The viewers' differences that are not the model's: the wording of a derived
 * role's description, a rule node drawn rounded (a `function` to the old
 * viewer's reader and an `expression` to the generator), and a saga title equal
 * to its own name, which the conversion does not repeat (the viewer shows the
 * name either way).
 */
function viewerDifferenceAccepted(line: string): boolean {
  return (
    /^\.access\.roles\.\d+\.description: mermaid "Declared by %%rbac as (\w+)" ≠ yaml "Declared by the model's access rules as \1"$/.test(
      line
    ) ||
    /^\.rules\.\d+\.nodes\.\d+\.role: mermaid "compute" ≠ yaml "action"$/.test(line) ||
    /^\.sagas\.\d+\.title: mermaid "[^"]+" ≠ yaml undefined$/.test(line)
  );
}

export async function verifyBrowser(mermaidRoot: string): Promise<Check[]> {
  const checks: Check[] = [];
  for (const site of SITES) {
    const original = await import(join(mermaidRoot, site.name, site.bundle));
    const patched = await import(join(YAML_ROOT, site.name, site.bundle));
    const viewer = site.viewer ? await import(join(mermaidRoot, site.name, site.viewer)) : undefined;

    for (const name of site.published) {
      const mermaid = readFileSync(join(mermaidRoot, site.name, site.models, `${name}.eml.mmd`), "utf8");
      const yaml = readFileSync(join(YAML_ROOT, site.name, site.models, `${name}.eml.yaml`), "utf8");
      const subject = `${site.name}: ${name}`;

      // 1. The compiled model.
      const reference = JSON.stringify(quietly(() => original.parseModel(mermaid)));
      const compiled = compileForBrowser(yaml);
      const same = compiled.ok && JSON.stringify(compiled.model) === reference;
      checks.push({
        section: "browser",
        subject: `${subject} — compiled model`,
        ok: same,
        detail: same
          ? ["identical to the bundle's own compile of the Mermaid, key order included"]
          : differences(JSON.parse(reference), compiled.model ?? {}),
      });

      // 2. The generated application.
      const before = quietly(() => original.generateFromSource({ ...OPTIONS, source: mermaid }))
        .files as Record<string, string>;
      const after = patched.generateFromModel({
        ...OPTIONS,
        model: compiled.model,
        modelText: yaml,
      }).files as Record<string, string>;
      const failures: string[] = [];
      let identical = 0;
      let explained = 0;
      const names = new Set([...Object.keys(before), ...Object.keys(after)]);
      names.delete("model/model.eml.mmd");
      names.delete("model/model.eml.yaml");
      if (before["model/model.eml.mmd"] !== mermaid) failures.push("the Mermaid run did not ship its model");
      if (after["model/model.eml.yaml"] !== yaml) failures.push("the YAML run did not ship its model");
      for (const file of names) {
        const a = before[file];
        const b = after[file];
        if (a === undefined || b === undefined) {
          failures.push(`${file}: only in the ${a === undefined ? "YAML" : "Mermaid"} run`);
          continue;
        }
        if (a === b) {
          identical++;
          continue;
        }
        const left = withoutTimestamps(asPatched(a));
        const right = withoutTimestamps(b);
        if (left === right) explained++;
        else failures.push(`${file}: contents differ`);
      }
      checks.push({
        section: "browser",
        subject: `${subject} — generated application`,
        ok: failures.length === 0,
        detail: failures.length
          ? failures
          : [
              `${identical} file(s) byte-identical, ${explained} identical after the patch's named text changes and the timestamps`,
              "model/model.eml.mmd → model/model.eml.yaml, carrying the model text",
            ],
      });

      // 3. The viewers.
      if (viewer) {
        const drawn = JSON.parse(JSON.stringify(quietly(() => viewer.readModel(mermaid))));
        const yamlDrawn = JSON.parse(JSON.stringify(readModelForViewer(yaml).model));
        const diff = differences(drawn, yamlDrawn, 400);
        const unexplained = diff.filter((line) => !viewerDifferenceAccepted(line));
        checks.push({
          section: "browser",
          subject: `${subject} — viewer model`,
          ok: unexplained.length === 0,
          detail: unexplained.length
            ? unexplained
            : [`identical apart from ${diff.length} named difference(s): role wording, rounded nodes, repeated titles`],
        });
      }
    }
  }
  return checks;
}
