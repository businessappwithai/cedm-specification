import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The repo root — where `.env` actually lives.
 *
 * `bun run dev` is `bun --filter @appwithai/web dev`, so both bun and Vite
 * start with their working directory here in `packages/web` and look for
 * `.env` beside this file, where there has never been one. The documented
 * location is the repo root: that is what `.env.example` sits next to, and
 * what `bun run seed:admin` reads.
 */
const repoRoot = path.resolve(__dirname, "../..");

/**
 * Load the root `.env` into `process.env` for the server handlers.
 *
 * `envDir` alone is not enough. It feeds Vite's `import.meta.env`, which
 * carries only `VITE_`-prefixed values to the client — while every server
 * handler reads `process.env.DATABASE_URL`, `SESSION_SECRET` and the rest
 * through `@appwithai/core`. Nothing was putting those there.
 *
 * The failure was invisible rather than loud, which is what made it worth
 * fixing here. `seed:admin` runs from the repo root, so it read `DATABASE_URL`,
 * migrated, and reported a working database; the dev server then fell through
 * to the `PG*` branch of `db.config.ts` with `user: undefined`, and
 * registration died with `no PostgreSQL user name specified in startup
 * packet` — a Postgres wire-protocol error that names nothing about env files
 * and sends you looking at Postgres.
 *
 * A real environment variable wins: only keys absent from `process.env` are
 * filled in, so `DATABASE_URL=… bun run dev` and CI's injected secrets still
 * override the file.
 */
for (const [key, value] of Object.entries(loadEnv("development", repoRoot, ""))) {
  if (process.env[key] === undefined) process.env[key] = value;
}

const config = defineConfig({
  envDir: repoRoot,
  server: {
    watch: {
      // /api/generate writes the generated app under
      // packages/web/generated-projects/<projectId> (see .gitignore). That is
      // inside Vite's watch root, so finishing a generation dropped hundreds of
      // files at once and triggered a full-page reload — which unmounted the
      // Generate step mid-run and threw away its logs and completion state.
      ignored: ["**/generated-projects/**"],
    },
  },
  optimizeDeps: {
    // Native .node binaries and Node-only drivers can't be bundled by Rolldown — exclude them
    exclude: [
      "@mastra/fastembed",
      "@anush008/tokenizers",
      "@anush008/tokenizers-darwin-universal",
      "pg",
      "@appwithai/core",
    ],
    // CJS interop: pre-bundle elkjs bundled JS so Vite handles it as ESM
    include: ["elkjs/lib/elk.bundled.js"],
  },
  ssr: {
    // Treat workspace packages as Node.js externals so their dist/index.js
    // files are used directly instead of being re-processed by Vite SSR.
    // Without this, Vite SSR fails to resolve named exports (e.g. entityToBusEntity)
    // from subpath exports like @appwithai/core/types.
    external: ["@appwithai/core", "@appwithai/generator", "@appwithai/ai"],
  },
  resolve: {
    tsconfigPaths: true,
    alias: [
      // Replace @tanstack/start-api-routes@1.120 (Vinxi-based) with a Vite-compatible shim.
      // The original imports 'vinxi/routes' which doesn't exist in @tanstack/react-start@1.167+.
      // The shim also adds .update() to Route objects so routeTree.gen.ts works without error.
      {
        find: /^@tanstack\/start-api-routes$/,
        replacement: path.resolve(__dirname, "src/lib/start-api-routes-compat.js"),
      },
      { find: "#", replacement: path.resolve(__dirname, "src") },
      { find: "@", replacement: path.resolve(__dirname, "src") },
      // `@appwithai/generator` is externalised for SSR and resolved from its
      // built `dist/index.js` for the client, which has no subpaths. The web
      // tsconfig only maps `@/*`, so a subpath import of the generator's pure
      // modules (the rules compiler, used by the enhance page) does not resolve
      // at runtime. Point it at the source, which is browser-safe.
      {
        find: /^@appwithai\/generator\/(.*)$/,
        replacement: path.resolve(__dirname, "../generator/src/$1"),
      },
    ],
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      tsr: {
        // Exclude API routes from the router tree — they're handled by TanStack Start's
        // API routing system separately and don't export a Route with .update().
        routeFileIgnorePattern: "^api",
      },
    }),
    viteReact(),
  ],
});

export default config;
