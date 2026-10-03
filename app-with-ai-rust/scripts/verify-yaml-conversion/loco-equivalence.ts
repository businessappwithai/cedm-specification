/**
 * The deployable application: what the website's download button writes
 * (`assets/js/appwithai-loco.js`, the real pipeline over an in-memory
 * filesystem) against what `appwithai generate --skip-cli-scaffold` writes for
 * the same `.eml.yaml` with the same settings.
 *
 * Two things are held equal and nothing is excused:
 * - every file, byte for byte, apart from the moment of generation;
 * - which files are executable.
 *
 * The CLI side runs with cargo off `PATH`. With cargo present the generator
 * also runs `cargo fmt` over the backend, which a browser cannot do; the
 * comparison is of what the generator writes, and the zip's own build
 * (`cargo test`, clippy) is gated separately.
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { readModelYaml } from "../../packages/generator/src/model-yaml";
import { generateApplication } from "../../packages/generator/src/pipeline/generate-application";
import { NO_LOG } from "../../packages/generator/src/pipeline/logger-port";
import { LOCO_DEFAULTS } from "../../language/browser/loco-generator.entry";
import { ROOT } from "./lib";

const RUNNER = join(import.meta.dir, "loco-run.ts");

function withoutTimestamps(text: string): string {
  return text
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g, "<t>")
    .replace(/^(.*Generated:).*$/gm, "$1 <t>");
}

function walk(dir: string, into: Map<string, Buffer>, base = dir): Map<string, Buffer> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, into, base);
    else into.set(relative(base, path), readFileSync(path));
  }
  return into;
}

export interface LocoComparison {
  failures: string[];
  identical: number;
  total: number;
}

export async function compareLocoWithCli(
  bundle: string,
  assets: string,
  modelPath: string,
  name: string
): Promise<LocoComparison> {
  const scratch = mkdtempSync(join(tmpdir(), "loco-equivalence-"));
  try {
    const mapFile = join(scratch, "browser.json");
    const run = Bun.spawnSync(["bun", RUNNER, bundle, assets, modelPath, name, mapFile], {
      cwd: "/",
      stdout: "ignore",
      stderr: "pipe",
    });
    if (run.exitCode !== 0) return { failures: [`the browser run failed: ${run.stderr.toString().trim()}`], identical: 0, total: 0 };
    const browser = JSON.parse(readFileSync(mapFile, "utf8")) as {
      files: Record<string, string | { base64: string }>;
      executables: string[];
    };

    const modelText = readFileSync(modelPath, "utf8");
    const read = readModelYaml(modelText);
    if (!read.ok || !read.document) return { failures: [`${modelPath} does not read`], identical: 0, total: 0 };
    const outputDir = join(scratch, name);
    const path = process.env.PATH;
    const log = console.log;
    process.env.PATH = (path ?? "").split(":").filter((dir) => !dir.includes(".cargo")).join(":");
    console.log = () => {};
    try {
      await generateApplication({
        document: read.document,
        modelText,
        projectName: name,
        projectVersion: LOCO_DEFAULTS.version,
        projectDescription: read.document.description,
        outputDir,
        stackOption: "tanstack-astryx-loco",
        astryxTheme: LOCO_DEFAULTS.theme,
        database: LOCO_DEFAULTS.database,
        port: LOCO_DEFAULTS.port,
        frontendPort: LOCO_DEFAULTS.frontendPort,
        apiBaseUrl: `http://localhost:${LOCO_DEFAULTS.port}`,
        enableDarkMode: false,
        skipCliScaffold: true,
        recordsPerEntity: LOCO_DEFAULTS.recordsPerEntity,
        manifest: { input: "model.eml.yaml", packageManager: "bun" },
        logger: NO_LOG,
      });
    } finally {
      process.env.PATH = path;
      console.log = log;
    }

    const disk = walk(outputDir, new Map());
    const failures: string[] = [];
    let identical = 0;
    for (const [file, bytes] of disk) {
      const value = browser.files[file];
      if (value === undefined) {
        failures.push(`${file}: written by the CLI, not by the browser`);
        continue;
      }
      const theirs = typeof value === "string" ? Buffer.from(value, "utf8") : Buffer.from(value.base64, "base64");
      if (theirs.equals(bytes) || withoutTimestamps(theirs.toString("utf8")) === withoutTimestamps(bytes.toString("utf8"))) {
        identical += 1;
      } else failures.push(`${file}: contents differ`);
    }
    for (const file of Object.keys(browser.files)) {
      if (!disk.has(file)) failures.push(`${file}: written by the browser, not by the CLI`);
    }
    const executable = (file: string) => (statSync(join(outputDir, file)).mode & 0o111) !== 0;
    const cliExecutables = [...disk.keys()].filter(executable).sort();
    const browserExecutables = [...browser.executables].sort();
    if (JSON.stringify(cliExecutables) !== JSON.stringify(browserExecutables)) {
      failures.push(`executables differ: CLI ${cliExecutables.join(", ")} · browser ${browserExecutables.join(", ")}`);
    }
    return { failures, identical, total: disk.size };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

export const LOCO_BUNDLE = join(ROOT, "businessappwithairust/assets/js/appwithai-loco.js");
export const LOCO_ASSETS = join(ROOT, "businessappwithairust/assets/vendor/loco-assets.json");
