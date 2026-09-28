import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/components/workflow/__tests__/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "../core/src/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "../generator/src/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "../ai/src/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "../yamltecture/test/**/*.test.ts",
    ],
    exclude: ["node_modules", "dist", ".next"],
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@appwithai/core": path.resolve(__dirname, "../core/src"),
      "@appwithai/core/types": path.resolve(__dirname, "../core/src/types"),
      "@appwithai/core/hooks": path.resolve(__dirname, "../core/src/hooks"),
      "@appwithai/core/services": path.resolve(__dirname, "../core/src/services"),
      "@appwithai/generator": path.resolve(__dirname, "../generator/src"),
    },
  },
});
