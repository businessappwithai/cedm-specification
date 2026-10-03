/** Types for `eml.js`, the Mermaid (EML) model reader of 18f5792. See README.md. */

export interface LegacyConversionIssue {
  /** What the issue concerns, e.g. `%%field Order.status enum`. */
  construct: string;
  message: string;
  /** `dropped`: compiled to nothing. `resolved`: said twice; the effective one is kept. */
  kind: "dropped" | "resolved";
}

export interface LegacyUncarriedLine {
  line: number;
  text: string;
  reason: "uncompiled-directive" | "comment";
}

/**
 * The model document of 18f5792 — the current one except that a rule's nodes
 * carry a Mermaid `shape` and its `direction` is a Mermaid direction, and a
 * hook flow is a Mermaid `hookDiagrams` entry. `upgrade.ts` takes it the rest
 * of the way.
 */
export type LegacyModelDocument = Record<string, unknown> & {
  entities: Array<Record<string, unknown> & { name: string; attributes: Array<Record<string, unknown>> }>;
};

export function emlToModelDocument(source: string): {
  document: LegacyModelDocument;
  issues: LegacyConversionIssue[];
  uncarried: LegacyUncarriedLine[];
};
