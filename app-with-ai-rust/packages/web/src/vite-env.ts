/// <reference types="vite/client" />

/**
 * `import.meta.env` is Vite's, and the root `tsconfig.json` names no `types`
 * entry for it. It used to arrive by accident: the two legacy routes still
 * importing `@tanstack/start-api-routes` pulled in vinxi, which references
 * Vite's client types. Moving those routes onto `createFileRoute` removed the
 * last such import and `import.meta.env` stopped resolving in three unrelated
 * files.
 *
 * Declared here rather than in a `.d.ts` because the root config excludes
 * `**​/*.d.ts`, and an excluded declaration file is one nothing reads.
 */

export {};
