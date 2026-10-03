import path from "path";
import { defineConfig } from "vitest/config";

/**
 * The end-to-end suite: the generator, its output, and the output *running*.
 *
 * Separate from `vitest.config.ts` because the two have opposite budgets. The
 * unit config is the fast gate a developer runs constantly; this one compiles
 * a Rust crate and migrates a database, and its specs share a single generated
 * tree and a single running server — which is why they must not run in
 * parallel processes. `singleFork` keeps the generate-once fixture honest: with
 * a fork per file, "once" would mean five times.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/e2e/**/*.e2e.test.ts"],
    globalSetup: ["test/e2e/support/global-setup.ts"],
    fileParallelism: false,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    // A cold `cargo build` of the generated backend is minutes, and the
    // performance spec deliberately creates hundreds of records.
    testTimeout: 300_000,
    hookTimeout: 900_000,
    teardownTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@appwithai/core": path.resolve(__dirname, "../core/src"),
      "@appwithai/core/types": path.resolve(__dirname, "../core/src/types"),
      "@appwithai/core/utils": path.resolve(__dirname, "../core/src/utils"),
    },
  },
});
