import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // `src/**` as well as `test/**`: the parser suite lives beside the code it
    // covers, in `src/parsers/__tests__/`, and with only the `test/**` glob
    // `bun run test:generator` found no files at all and exited 1 — a suite that
    // has never run reads exactly like a suite that passes.
    include: ["test/**/*.{test,spec}.{js,ts}", "src/**/*.{test,spec}.{js,ts}"],
    // `test/e2e/**` has its own config: it compiles the generated Rust crate
    // and stands the application up, which is minutes rather than seconds and
    // is not what `bun run test:generator` is for. Run it with `test:e2e`.
    exclude: ["node_modules", "dist", "templates", "test/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "test/",
        "**/*.config.*",
        "**/*.d.ts",
        "**/types/**",
        "templates/**",
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    /*
     * Source, not `dist`.
     *
     * These pointed at `../core/dist`, so the suite ran against whatever build
     * of core happened to be lying around: edit `bus-entity.types.ts`, run the
     * tests, and they pass against the previous version without a word. A test
     * that cannot see the change it is testing is worse than no test, because
     * it reports success. `packages/web/vitest.config.ts` already resolves core
     * from source; this now matches it.
     */
    alias: {
      "@appwithai/core": path.resolve(__dirname, "../core/src"),
      "@appwithai/core/types": path.resolve(__dirname, "../core/src/types"),
      "@appwithai/core/utils": path.resolve(__dirname, "../core/src/utils"),
    },
  },
});
