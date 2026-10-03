/**
 * E6 — the reporting pack. For every model the orchestrator carries, the pack
 * its `build/reporting-pack.ts` derives from the YAML model is the pack it
 * derives from the original model (read as `models.ts` reads it): the same
 * queries, reports, charts, dashboards and reporting roles, field for field.
 * Only when it was built (`generatedAt`) may differ.
 *
 * Whether those queries run is the orchestrator's own `check:pack:ci`, which
 * executes every one against the schema the generator emits.
 */
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { type Check, ROOT, differences, modelPairs } from "./lib";
import { convertOriginal } from "./models";

export async function verifyPacks(mermaidDir: string): Promise<Check[]> {
  const { buildPack } = await import(join(ROOT, "app-and-report-with-ai-rust/common/build/reporting-pack.ts"));
  const checks: Check[] = [];
  for (const pair of modelPairs(mermaidDir, ["app-and-report-with-ai-rust"])) {
    if (!pair.yaml || !pair.yaml.includes("/common/examples/")) continue;
    const name = basename(pair.yaml).replace(/\.eml\.yaml$/, "");
    const yaml = readFileSync(pair.yaml, "utf8");
    const original = convertOriginal(readFileSync(pair.mermaid, "utf8"));
    if (!original.yaml) {
      checks.push({ section: "pack", subject: pair.key, ok: false, detail: [original.error ?? ""] });
      continue;
    }
    const build = (text: string) => {
      try {
        const pack = buildPack(text, `${name}.eml.yaml`, "appdb", name);
        delete pack.application.generatedAt;
        return { pack };
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    };
    const left = build(original.yaml);
    const right = build(yaml);
    if (!left.pack || !right.pack) {
      // A model with no entities has no pack either way; both must refuse it alike.
      const same = !left.pack && !right.pack && left.error === right.error;
      checks.push({ section: "pack", subject: pair.key, ok: same, detail: [left.error ?? "", right.error ?? ""].filter(Boolean) });
      continue;
    }
    const diff = differences(left.pack, right.pack, 30);
    checks.push({
      section: "pack",
      subject: pair.key,
      ok: diff.length === 0,
      detail: diff.length
        ? diff
        : [`${right.pack.queries.length} queries, ${right.pack.reports.length} reports, ${right.pack.access.roles.length} reporting roles — identical`],
    });
  }
  return checks;
}
