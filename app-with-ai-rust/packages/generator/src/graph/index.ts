/**
 * The model graph: a project's EML model stored and queried as a graph.
 *
 * A barrel, so consumers import `@appwithai/generator/graph` rather than four
 * separate subpaths — every one of which would need publishing in the package
 * manifest, and would fail at run time if it were missed.
 */

export * from "./model-graph";
export * from "./age-store";
export * from "./queries";
