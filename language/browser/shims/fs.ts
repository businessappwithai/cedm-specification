/**
 * An in-memory filesystem with exactly the surface the generation pipeline
 * calls, so `generateApplication` runs unchanged in a browser.
 *
 * The browser build of the Loco generator (`loco-generator.entry.ts`) aliases
 * `node:fs`, `fs`, `node:fs/promises` and `fs/promises` to this module. Nothing
 * here is a general-purpose filesystem: each function exists because the
 * pipeline calls it, and a call the pipeline does not make is deliberately
 * absent, so a new dependency on the disk fails the bundle build (a missing
 * export) instead of quietly misbehaving at run time.
 *
 * Paths are POSIX and absolute; relative paths resolve against `/`, which is
 * what the `process.cwd()` shim returns. Contents are kept as strings when
 * written as strings and as bytes otherwise, and are returned in whichever form
 * the caller asks for, so a byte-for-byte comparison with the CLI's output is
 * meaningful.
 */

type Contents = string | Uint8Array;

const files = new Map<string, Contents>();
const directories = new Set<string>(["/"]);
/** Permission bits a caller set with `chmod`; a file with none is 0644. */
const modes = new Map<string, number>();
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function normalize(input: string | URL): string {
  const raw = typeof input === "string" ? input : input.pathname;
  const absolute = raw.startsWith("/") ? raw : `/${raw}`;
  const parts: string[] = [];
  for (const part of absolute.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return `/${parts.join("/")}`;
}

function parent(path: string): string {
  const at = path.lastIndexOf("/");
  return at <= 0 ? "/" : path.slice(0, at);
}

function fail(code: "ENOENT" | "EEXIST" | "ENOTDIR" | "EISDIR", syscall: string, path: string): never {
  const error = new Error(`${code}: ${syscall} '${path}'`) as Error & {
    code: string;
    syscall: string;
    path: string;
  };
  error.code = code;
  error.syscall = syscall;
  error.path = path;
  throw error;
}

function ensureDirectory(path: string): void {
  if (directories.has(path)) return;
  if (files.has(path)) fail("ENOTDIR", "mkdir", path);
  ensureDirectory(parent(path));
  directories.add(path);
}

function asText(contents: Contents): string {
  return typeof contents === "string" ? contents : decoder.decode(contents);
}

function asBytes(contents: Contents): Uint8Array {
  return typeof contents === "string" ? encoder.encode(contents) : contents;
}

function encodingOf(options: unknown): string | undefined {
  if (typeof options === "string") return options;
  if (options && typeof options === "object" && "encoding" in options) {
    return (options as { encoding?: string }).encoding ?? undefined;
  }
  return undefined;
}

function read(path: string, options: unknown): string | Uint8Array {
  const at = normalize(path);
  const contents = files.get(at);
  if (contents === undefined) {
    if (directories.has(at)) fail("EISDIR", "read", at);
    fail("ENOENT", "open", at);
  }
  return encodingOf(options) ? asText(contents) : asBytes(contents);
}

function write(path: string, data: unknown): void {
  const at = normalize(path);
  if (directories.has(at)) fail("EISDIR", "open", at);
  if (!directories.has(parent(at))) fail("ENOENT", "open", at);
  files.set(at, typeof data === "string" ? data : new Uint8Array(data as ArrayBufferLike));
}

interface Entry {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
  isSymbolicLink(): boolean;
}

function list(path: string, options: unknown): string[] | Entry[] {
  const at = normalize(path);
  if (!directories.has(at)) fail(files.has(at) ? "ENOTDIR" : "ENOENT", "scandir", at);
  const prefix = at === "/" ? "/" : `${at}/`;
  const names = new Set<string>();
  for (const key of [...files.keys(), ...directories]) {
    if (key === at || !key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    if (rest && !rest.includes("/")) names.add(rest);
  }
  const sorted = [...names].sort();
  if (options && typeof options === "object" && (options as { withFileTypes?: boolean }).withFileTypes) {
    return sorted.map((name) => {
      const directory = directories.has(`${prefix}${name}`);
      return {
        name,
        isDirectory: () => directory,
        isFile: () => !directory,
        isSymbolicLink: () => false,
      };
    });
  }
  return sorted;
}

const EPOCH = new Date(0);

function status(path: string) {
  const at = normalize(path);
  const contents = files.get(at);
  const directory = directories.has(at);
  if (contents === undefined && !directory) fail("ENOENT", "stat", at);
  return {
    size: contents === undefined ? 0 : asBytes(contents).byteLength,
    mtime: EPOCH,
    mtimeMs: 0,
    isDirectory: () => directory,
    isFile: () => !directory,
    isSymbolicLink: () => false,
  };
}

function remove(path: string, options: unknown): void {
  const at = normalize(path);
  const recursive = !!(options && typeof options === "object" && (options as { recursive?: boolean }).recursive);
  const force = !!(options && typeof options === "object" && (options as { force?: boolean }).force);
  if (files.delete(at)) {
    modes.delete(at);
    return;
  }
  if (!directories.has(at)) {
    if (force) return;
    fail("ENOENT", "rm", at);
  }
  if (!recursive) fail("EISDIR", "rm", at);
  const prefix = `${at}/`;
  for (const key of [...files.keys()]) if (key.startsWith(prefix)) files.delete(key);
  for (const key of [...modes.keys()]) if (key.startsWith(prefix)) modes.delete(key);
  for (const key of [...directories]) if (key === at || key.startsWith(prefix)) directories.delete(key);
}

function copyTree(from: string, to: string): void {
  const source = normalize(from);
  const target = normalize(to);
  if (files.has(source)) {
    ensureDirectory(parent(target));
    files.set(target, files.get(source) as Contents);
    return;
  }
  if (!directories.has(source)) fail("ENOENT", "cp", source);
  ensureDirectory(target);
  for (const name of list(source, undefined) as string[]) {
    copyTree(`${source}/${name}`, `${target}/${name}`);
  }
}

let temporaries = 0;

// ── node:fs ──────────────────────────────────────────────────────────────────

export function existsSync(path: string | URL): boolean {
  const at = normalize(path);
  return files.has(at) || directories.has(at);
}

export function readFileSync(path: string | URL, options?: unknown): string | Uint8Array {
  return read(typeof path === "string" ? path : path.pathname, options);
}

export function writeFileSync(path: string, data: unknown): void {
  write(path, data);
}

export function mkdirSync(path: string, options?: { recursive?: boolean }): void {
  const at = normalize(path);
  if (options?.recursive) ensureDirectory(at);
  else {
    if (existsSync(at)) fail("EEXIST", "mkdir", at);
    if (!directories.has(parent(at))) fail("ENOENT", "mkdir", at);
    directories.add(at);
  }
}

export function readdirSync(path: string, options?: unknown): string[] | Entry[] {
  return list(path, options);
}

export function statSync(path: string) {
  return status(path);
}

export function rmSync(path: string, options?: unknown): void {
  remove(path, options);
}

export function chmodSync(path: string, mode: number): void {
  const at = normalize(path);
  if (!files.has(at)) fail("ENOENT", "chmod", at);
  modes.set(at, mode);
}

// ── node:fs/promises ─────────────────────────────────────────────────────────

export const promises = {
  async readFile(path: string, options?: unknown) {
    return read(path, options);
  },
  async writeFile(path: string, data: unknown) {
    write(path, data);
  },
  async mkdir(path: string, options?: { recursive?: boolean }) {
    mkdirSync(path, options);
  },
  async readdir(path: string, options?: unknown) {
    return list(path, options);
  },
  async stat(path: string) {
    return status(path);
  },
  async access(path: string) {
    if (!existsSync(path)) fail("ENOENT", "access", normalize(path));
  },
  async copyFile(from: string, to: string) {
    const source = normalize(from);
    const contents = files.get(source);
    if (contents === undefined) fail("ENOENT", "copyfile", source);
    write(to, contents);
  },
  async cp(from: string, to: string) {
    copyTree(from, to);
  },
  async rm(path: string, options?: unknown) {
    remove(path, options);
  },
  async chmod(path: string, mode: number) {
    chmodSync(path, mode);
  },
  async mkdtemp(prefix: string) {
    temporaries += 1;
    const at = normalize(`${prefix}${temporaries.toString(36).padStart(6, "0")}`);
    ensureDirectory(at);
    return at;
  },
};

export const { readFile, writeFile, mkdir, readdir, stat, access, copyFile, cp, rm, chmod, mkdtemp } =
  promises;

export default {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  rmSync,
  chmodSync,
  promises,
};

// ── The volume, for the entry that owns it ───────────────────────────────────

/** Place files at absolute paths, creating their directories. */
export function mount(entries: Record<string, Contents>): void {
  for (const [path, contents] of Object.entries(entries)) {
    const at = normalize(path);
    ensureDirectory(parent(at));
    files.set(at, contents);
  }
}

/** Every file under `root`, keyed by its path relative to `root`, in path order. */
export function snapshot(root: string): Map<string, Contents> {
  const at = normalize(root);
  const prefix = `${at}/`;
  const out = new Map<string, Contents>();
  for (const key of [...files.keys()].sort()) {
    if (key.startsWith(prefix)) out.set(key.slice(prefix.length), files.get(key) as Contents);
  }
  return out;
}

/** The files under `root` a caller made executable, relative to `root`. */
export function executables(root: string): Set<string> {
  const prefix = `${normalize(root)}/`;
  const out = new Set<string>();
  for (const [key, mode] of modes) if (key.startsWith(prefix) && mode & 0o111) out.add(key.slice(prefix.length));
  return out;
}

/** Forget everything under `root`. */
export function unmount(root: string): void {
  remove(root, { recursive: true, force: true });
}
