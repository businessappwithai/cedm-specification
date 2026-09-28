export * from "./generators";
/** The model's compiled form: what the templates and the web app consume. */
export * from "./model/categories";
export * from "./model/compile";
export * from "./model/compile-erd";
export type * from "./model/records";
/**
 * The one generation path. Both the CLI and the web app's `/api/generate` go
 * through `generateApplication` — see `pipeline/generate-application.ts` for
 * what happened when they did not.
 */
export * from "./pipeline";
export * from "./templates";
