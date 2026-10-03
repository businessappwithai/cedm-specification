/**
 * E5 — the published sites' browser generators and model viewers.
 *
 * Each site vendors `appwithai-wasm.js`, the generator of the application that
 * runs in the tab. It used to compile a model from the old text format; the
 * converted copy takes a model compiled from YAML by `appwithai-model.js`
 * (`language/browser/browser-generator.entry.ts`). The website also carries
 * `appwithai-loco.js`, the deployable Loco + Astryx application its download
 * button writes. Per site and per published model:
 *
 * 1. **The compiled model.** What `compileForBrowser` builds from the YAML
 *    equals, byte for byte and key order included, what the original bundle
 *    compiled from the original model.
 * 2. **The application in the tab.** The original `generateFromSource` and the
 *    converted `generateFromModel` write the same files with the same contents,
 *    apart from the model file itself, the text the patch changes (each pair in
 *    `REPLACEMENTS`, applied to the original's output first), and timestamps.
 * 3. **The deployable application** (the website): the download writes exactly
 *    what `appwithai generate --skip-cli-scaffold` writes for the same model
 *    (`loco-equivalence.ts`).
 * 4. **What the viewers draw** (the website carries the viewers' original
 *    reader): `readModelForViewer` equals the original reader's model apart
 *    from the three differences `viewerDifferenceAccepted` names.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compileForBrowser, readModelForViewer } from "../../language/browser/browser-generator.entry";
import { REPLACEMENTS } from "../sites/patch-vendored-generators";
import { compareLocoWithCli, LOCO_ASSETS, LOCO_BUNDLE } from "./loco-equivalence";
import { type Check, ROOT, differences } from "./lib";

interface Site {
  name: string;
  wasm: string;
  /** The site ships the deployable application's generator. */
  loco?: boolean;
  models: string;
  published: string[];
  viewer?: string;
}

const SITES: Site[] = [
  {
    name: "businessappwithairust",
    wasm: "assets/js/appwithai-wasm.js",
    loco: true,
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
    wasm: "common/html/assets/appwithai-wasm.js",
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
  const log = console.log;
  console.warn = () => {};
  console.log = () => {};
  try {
    return run();
  } finally {
    console.warn = warn;
    console.log = log;
  }
}

/**
 * The original side's file, taken through exactly the patch's text changes as
 * they read in generated output: a template literal renders `\\`` as a backtick.
 */
function asPatched(text: string): string {
  let out = text;
  for (const [from, to] of REPLACEMENTS) {
    const rendered = (value: string) => value.replaceAll("\\`", "`");
    out = out.replaceAll(rendered(from), rendered(to));
  }
  // The reporting pack's default model file name, and the manifest's input.
  return out
    .replace(/("model": ?"[\w-]+)\.eml\.mmd"/g, '$1.eml.yaml"')
    .replace(/"model\.eml\.mmd"/g, '"model.eml.yaml"');
}

/** When a run happened, which is all two runs of one generator differ in. */
function withoutTimestamps(text: string): string {
  return text
    .replace(/"generatedAt": "[^"]+"/g, '"generatedAt": "<t>"')
    .replace(/<time datetime="[^"]+">[^<]+<\/time>/g, "<time>…</time>")
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g, "<t>");
}

/**
 * The viewers' differences that are not the model's: the wording of a derived
 * role's description, a rule node drawn rounded (a `function` to the old
 * viewer's reader and an `expression` to the generator), and a saga title equal
 * to its own name, which the YAML does not repeat (the viewer shows the name
 * either way).
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

/** The bundle's own FNV-1a fingerprint, as `buildModelBundle` computes it. */
function fingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(36).padStart(7, "0").slice(0, 7);
}

/**
 * `project.dataKey` names the tab's IndexedDB database, and is the project slug
 * plus a fingerprint of the business schema and the entity names, so that a
 * changed schema opens a fresh database. The schema's own comments are part of
 * what is fingerprinted, so the rewording that `asPatched` names moves the key.
 * The key is therefore checked against the run that produced it — each side's
 * must be the fingerprint of the `schema.bus.sql` that side wrote — and only
 * then set aside. A key that is not its own run's derivation is a failure.
 */
function withDerivedDataKey(files: Record<string, string>, failures: string[], side: string): string | undefined {
  const text = files["app/model.json"];
  const schema = files["app/schema.bus.sql"];
  if (text === undefined || schema === undefined) return text;
  const model = JSON.parse(text) as { project: { slug: string; dataKey: string }; entities: Array<{ name: string }> };
  const expected = `${model.project.slug}-${fingerprint(schema + model.entities.map((e) => e.name).join(","))}`;
  if (model.project.dataKey !== expected) {
    failures.push(`app/model.json: the ${side} run's dataKey is not derived from its own schema`);
    return text;
  }
  return text.replace(/("dataKey":\s*)"[^"]+"/, '$1"<derived>"');
}

/** Two generated file maps, compared with the named differences only. */
function compareFiles(
  before: Record<string, string>,
  after: Record<string, string>,
  original: string,
  yaml: string
): { failures: string[]; identical: number; explained: number } {
  const failures: string[] = [];
  let identical = 0;
  let explained = 0;
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const prefix of ["", "app/"]) {
    names.delete(`${prefix}model/model.eml.mmd`);
    names.delete(`${prefix}model/model.eml.yaml`);
  }
  const shipped = (files: Record<string, string>, suffix: string) =>
    Object.entries(files).find(([name]) => name.endsWith(`model/model.eml.${suffix}`))?.[1];
  if (shipped(before, "mmd") !== undefined && shipped(before, "mmd") !== original)
    failures.push("the original run shipped a different model text");
  if (shipped(before, "mmd") !== undefined && shipped(after, "yaml") !== yaml)
    failures.push("the converted run did not ship its model text");
  const derived = {
    before: withDerivedDataKey(before, failures, "original"),
    after: withDerivedDataKey(after, failures, "converted"),
  };
  for (const file of names) {
    const a = file === "app/model.json" ? derived.before : before[file];
    const b = file === "app/model.json" ? derived.after : after[file];
    if (a === undefined || b === undefined) {
      failures.push(`${file}: only in the ${a === undefined ? "converted" : "original"} run`);
      continue;
    }
    if (a === b) {
      identical++;
      continue;
    }
    if (withoutTimestamps(asPatched(a)) === withoutTimestamps(b)) explained++;
    else failures.push(`${file}: contents differ`);
  }
  return { failures, identical, explained };
}

export async function verifyBrowser(mermaidRoot: string, sites: string[]): Promise<Check[]> {
  const checks: Check[] = [];
  for (const site of SITES.filter((s) => sites.includes(s.name))) {
    const original = await import(join(mermaidRoot, site.name, site.wasm));
    const converted = await import(join(ROOT, site.name, site.wasm));
    const viewer = site.viewer ? await import(join(mermaidRoot, site.name, site.viewer)) : undefined;

    for (const name of site.published) {
      const mermaid = readFileSync(join(mermaidRoot, site.name, site.models, `${name}.eml.mmd`), "utf8");
      const yaml = readFileSync(join(ROOT, site.name, site.models, `${name}.eml.yaml`), "utf8");
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
          ? ["identical to the bundle's own compile of the original, key order included"]
          : compiled.ok
            ? differences(JSON.parse(reference), compiled.model ?? {})
            : compiled.diagnostics.filter((d) => d.severity === "error").map((d) => `${d.line} ${d.code} ${d.message}`),
      });
      if (!compiled.ok) continue;

      // 2. The application that runs in the tab.
      const before = quietly(() => original.generateFromSource({ ...OPTIONS, source: mermaid })).files;
      const after = quietly(() =>
        converted.generateFromModel({ ...OPTIONS, model: compiled.model, modelText: yaml })
      ).files;
      const tab = compareFiles(before, after, mermaid, yaml);
      checks.push({
        section: "browser",
        subject: `${subject} — application in the tab`,
        ok: tab.failures.length === 0,
        detail: tab.failures.length
          ? tab.failures.slice(0, 30)
          : [`${tab.identical} file(s) byte-identical, ${tab.explained} identical after the named text changes and timestamps`],
      });

      // 3. The deployable application.
      if (site.loco) {
        const modelPath = join(ROOT, site.name, site.models, `${name}.eml.yaml`);
        const loco = existsSync(LOCO_BUNDLE)
          ? await compareLocoWithCli(LOCO_BUNDLE, LOCO_ASSETS, modelPath, name)
          : { failures: [`${LOCO_BUNDLE} is missing`], identical: 0, total: 0 };
        checks.push({
          section: "browser",
          subject: `${subject} — deployable application`,
          ok: loco.failures.length === 0,
          detail: loco.failures.length
            ? loco.failures.slice(0, 30)
            : [`${loco.identical} of ${loco.total} file(s) identical to appwithai generate's, executables included`],
        });
      }

      // 4. The viewers.
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
