/**
 * A scratch copy of the specification, for running a tool against a library
 * with one defect planted in it (`CEDM_ROOT` points the tool there).
 */

import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const REPO = path.resolve(import.meta.dir, "..", "..");

export interface Scratch {
  root: string;
  /** A file's text, relative to the root. */
  read(file: string): string;
  write(file: string, text: string): void;
  /** Replace the first occurrence of `from` in a file; throws when it is absent. */
  edit(file: string, from: string, to: string): void;
  /** Run a tool (`tools/validate.ts`, …) against this copy. */
  run(tool: string, ...args: string[]): { code: number; out: string };
  remove(): void;
}

export function scratch(): Scratch {
  const root = mkdtempSync(path.join(tmpdir(), "cedm-tools-"));
  for (const dir of ["domain", "specification", "schema", "domains", "applications"]) {
    cpSync(path.join(REPO, dir), path.join(root, dir), { recursive: true });
  }
  for (const file of readdirSync(REPO).filter((f) => f.endsWith(".yaml"))) {
    cpSync(path.join(REPO, file), path.join(root, file));
  }
  mkdirSync(path.join(root, "tools"));
  for (const file of ["lucide-icons.txt", "help-legacy-shapes.txt"]) {
    cpSync(path.join(REPO, "tools", file), path.join(root, "tools", file));
  }
  mkdirSync(path.join(root, "language"));
  cpSync(
    path.join(REPO, "language", "appwithai-language.json"),
    path.join(root, "language", "appwithai-language.json")
  );
  const at = (file: string) => path.join(root, file);
  return {
    root,
    read: (file) => readFileSync(at(file), "utf-8"),
    write: (file, text) => writeFileSync(at(file), text),
    edit(file, from, to) {
      const text = readFileSync(at(file), "utf-8");
      if (!text.includes(from)) throw new Error(`${file} does not contain ${JSON.stringify(from)}`);
      writeFileSync(at(file), text.replace(from, to));
    },
    run(tool, ...args) {
      const result = Bun.spawnSync(["bun", path.join(REPO, tool), ...args], {
        env: { ...process.env, CEDM_ROOT: root },
        stdout: "pipe",
        stderr: "pipe",
      });
      return {
        code: result.exitCode ?? -1,
        out: result.stdout.toString() + result.stderr.toString(),
      };
    },
    remove: () => rmSync(root, { recursive: true, force: true }),
  };
}
