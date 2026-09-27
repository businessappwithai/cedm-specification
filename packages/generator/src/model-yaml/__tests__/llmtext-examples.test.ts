/**
 * The YAML the llmtext specifications teach is a model the generator accepts.
 *
 * `website/llmtext/*.txt` are what a language model reads before it writes a
 * model for someone. Each carries §3.0, the YAML model language, with a
 * complete example that the text calls "valid, zero errors and zero warnings".
 * A document that teaches by example teaches its mistakes too, so every
 * `yaml` block that states a complete model (it opens with `eml:`) is read
 * here by the same reader `appwithai validate` runs, and held to exactly that
 * claim.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readModelYaml } from "../index";

const LLMTEXT = path.resolve(__dirname, "../../../../../website/llmtext");

function yamlModels(text: string): string[] {
  const blocks: string[] = [];
  const fence = /```yaml\n([\s\S]*?)```/g;
  for (let match = fence.exec(text); match; match = fence.exec(text)) {
    const body = match[1] ?? "";
    if (/^eml:\s*"1\.0"/m.test(body)) blocks.push(body);
  }
  return blocks;
}

describe("the llmtext specifications teach valid YAML models", () => {
  const files = readdirSync(LLMTEXT).filter((file) => file.endsWith(".txt"));

  it("every edition carries §3.0 and its example", () => {
    expect(files.length).toBe(4);
    for (const file of files) {
      const text = readFileSync(path.join(LLMTEXT, file), "utf8");
      expect(text, file).toContain("### 3.0 The YAML model language — what you write");
      expect(yamlModels(text).length, file).toBeGreaterThan(0);
    }
  });

  for (const file of files) {
    it(`${file}: each complete model validates with no diagnostics`, () => {
      const text = readFileSync(path.join(LLMTEXT, file), "utf8");
      for (const model of yamlModels(text)) {
        const result = readModelYaml(model);
        expect(
          result.diagnostics.map((d) => `${d.code} ${d.line}:${d.column} ${d.message}`),
          file
        ).toEqual([]);
        expect(result.ok, file).toBe(true);
      }
    });
  }
});
