/**
 * The CEDM application model: a model written in CEDM, and its translation into
 * the model document the generators compile.
 *
 *   resolveCedmImports(doc, library)   imports, modules, `extends` → one model
 *   lowerCedmModel(doc)                CEDM model → model document (+ notes, source map)
 *   raiseModelDocument(doc)            model document → CEDM model
 *   cedmOrder(doc)                     the order a lowered document comes back in
 */

export * from "./document";
export * from "./imports";
export * from "./lower";
export * from "./naming";
export * from "./raise";
