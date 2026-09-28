/**
 * The `eml` CLI's model — the one the repository's language defines.
 *
 * A model is a YAML document (`*.eml.yaml`), read and validated by the
 * language's own reader at the root of this repository and turned into this
 * shape by `language/cli/src/document.ts` there. This CLI's generators consume
 * it; nothing here reads model text.
 */
export * from "../../../../../language/cli/src/model.ts";
