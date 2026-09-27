#!/usr/bin/env node
/**
 * Run the Rust generator compiled to WebAssembly — the CLI-WASM target.
 *
 * `crates/appwithai-gen` builds for `wasm32-wasip1` unchanged: the same clap
 * CLI, the same YAML reader and JSON Schema, the same record compilers, the
 * same Handlebars emission. This file is the host. It gives the module the
 * filesystem (preopened at `/`, so every host path means what it means to the
 * native binary), the arguments and the environment, with `PWD` set to the
 * directory it was run from — WASI starts a process in `/`, and the generator
 * adopts `PWD` so that a relative `--input` is not read from the root.
 *
 * Why Node rather than Bun: Bun's `node:wasi` joins a guest's absolute path
 * onto the host's working directory instead of onto the preopen, and the
 * module then traps with "Out of bounds call_indirect". Node's implementation
 * runs it correctly, so this one file is a Node program; it is still started
 * through `bun run wasm` like every other script here.
 *
 * Two things a WASI guest cannot do are done here instead, so the output is
 * the native CLI's output:
 *   - it cannot start processes, so `loco new` is unavailable, and this runner
 *     adds `--skip-cli-scaffold` to `generate` when it is absent;
 *   - for the same reason it cannot run `cargo fmt`, so after a `generate` the
 *     runner formats the emitted backend on the host when cargo is installed —
 *     the step the native CLI takes itself.
 *
 *   bun run build:wasm                                      # cargo build --target wasm32-wasip1
 *   bun run wasm -- generate -i model.eml.yaml -o out -n app
 *   APPWITHAI_WASM=path/to/appwithai.wasm bun run wasm -- info -i model.eml.yaml
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WASI } from "node:wasi";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MODULE = path.join(ROOT, "target/wasm32-wasip1/release/appwithai.wasm");

function modulePath() {
  const configured = process.env.APPWITHAI_WASM;
  const file = configured ? path.resolve(configured) : DEFAULT_MODULE;
  if (!existsSync(file)) {
    throw new Error(
      `No generator module at ${file}. Build it with \`bun run build:wasm\`` +
        (configured ? "." : ", or set APPWITHAI_WASM to a built appwithai.wasm.")
    );
  }
  return file;
}

/** The value of `--flag value` / `-f value` / `--flag=value`, if given. */
function flagValue(args, long, short) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === long || (short && arg === short)) return args[i + 1];
    if (arg.startsWith(`${long}=`)) return arg.slice(long.length + 1);
  }
  return undefined;
}

/**
 * Run the generator module with `args`, as the native `appwithai` would be run
 * from `cwd`. Resolves to its exit status.
 */
export async function runWasmGenerator(args, cwd = process.cwd()) {
  const guestArgs = [...args];
  const command = guestArgs.find((arg) => !arg.startsWith("-"));
  if (command === "generate" && !guestArgs.includes("--skip-cli-scaffold")) {
    guestArgs.push("--skip-cli-scaffold");
  }

  const env = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => typeof value === "string")
  );
  const wasi = new WASI({
    version: "preview1",
    args: ["appwithai", ...guestArgs],
    env: {
      ...env,
      PWD: cwd,
      TEMPLATE_DIR: env.TEMPLATE_DIR ?? path.join(ROOT, "packages/generator/templates"),
      APPWITHAI_LANGUAGE_FILE:
        env.APPWITHAI_LANGUAGE_FILE ?? path.join(ROOT, "language/appwithai-language.json"),
    },
    preopens: { "/": "/" },
    returnOnExit: true,
  });

  const module = await WebAssembly.compile(readFileSync(modulePath()));
  const instance = await WebAssembly.instantiate(module, wasi.getImportObject());
  const status = wasi.start(instance);
  if (status !== 0 || command !== "generate") return status;

  const output = flagValue(guestArgs, "--output", "-o");
  const backend = output ? path.resolve(cwd, output, "backend") : undefined;
  if (backend && existsSync(path.join(backend, "Cargo.toml"))) {
    const cargo = spawnSync("cargo", ["--version"], { stdio: "ignore" });
    if (cargo.status === 0) {
      const formatted = spawnSync("cargo", ["fmt"], { cwd: backend, stdio: "inherit" });
      if (formatted.status !== 0) {
        console.error(`  ⚠️  cargo fmt on the host exited with ${formatted.status}`);
      }
    }
  }
  return status;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.removeAllListeners("warning");
  runWasmGenerator(process.argv.slice(2))
    .then((status) => {
      process.exitCode = status;
    })
    .catch((error) => {
      console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    });
}
