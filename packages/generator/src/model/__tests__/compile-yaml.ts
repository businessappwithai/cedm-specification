/**
 * Compile a model written inline in a test, the way generation compiles one.
 *
 * The document is held to the schema first, so a fixture that is not a model
 * fails at the fixture rather than somewhere inside a compiler. The language
 * checker is not run: many fixtures are deliberately incomplete models whose
 * compilation is the thing under test.
 */

import type { ModelDocument } from "../../model-yaml/document";
import { compileModelDocument, readModelYaml } from "../../model-yaml/index";
import type { ParsedModel } from "../compile";

export function readYamlFixture(text: string): ModelDocument {
  const result = readModelYaml(text, { check: false });
  if (!result.document) {
    const problems = result.diagnostics
      .map((diagnostic) => `${diagnostic.line}:${diagnostic.column} ${diagnostic.message}`)
      .join("\n");
    throw new Error(`fixture is not a model document:\n${problems}`);
  }
  return result.document;
}

export function compileYaml(text: string): ParsedModel {
  return compileModelDocument(readYamlFixture(text));
}
