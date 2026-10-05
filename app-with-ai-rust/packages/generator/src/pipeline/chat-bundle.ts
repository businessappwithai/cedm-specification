/**
 * The chat every generated application ships with.
 *
 * `chat-deepseek/` at the repository root is the chat: a gateway that signs a
 * person in to the application and its reporting platform at once, runs one
 * DeepSeek Harness host per person with a business-only composition, and opens
 * the application's own screens inside the conversation. It is developed,
 * type-checked and tested there, and copied here — into `chat/` beside
 * `frontend/` — rather than templated, so the code a project ships is the code
 * that was tested.
 *
 * Two files are written for the application rather than copied:
 *
 * - `skills/<project>-domain/SKILL.md` — the application's records, value
 *   lists, lifecycles, roles and reports in the model's own words
 *   (`chat/domain-skill.ts`). The nine general skills explain how to work in
 *   *an* application; this one says what *this* one is.
 * - `.env.example` — every variable the gateway reads, with this project's
 *   ports filled in, and the secrets left empty for `start` to generate.
 *
 * The chat embeds the front end, so it is written exactly when the front end
 * is. A missing chat source is an error, not a skipped step: a project that
 * silently lacks the chat looks complete and is not what the generator
 * promises.
 */

import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { domainSkillName, renderDomainSkill } from "../chat/domain-skill";
import type { ParsedModel } from "../model/compile";

/** What `chat-deepseek/` is recognised by. */
const MARKER = path.join("gateway", "server.ts");

/** Names never copied: installs, local state, scratch files. */
function skipped(name: string): boolean {
  if (name === ".dockerignore") return false;
  return name === "node_modules" || name.startsWith(".");
}

/**
 * Find `chat-deepseek/`: `APPWITHAI_CHAT_DIR` when set, else the first
 * ancestor of this module that holds one — from source and from the bundled
 * CLI (`packages/generator/dist/cli/`) alike.
 */
export function locateChatSource(): string | null {
  const configured = process.env.APPWITHAI_CHAT_DIR;
  if (configured) return existsSync(path.join(configured, MARKER)) ? path.resolve(configured) : null;
  let directory = path.dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const candidate = path.join(directory, "chat-deepseek");
    if (existsSync(path.join(candidate, MARKER))) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

async function copyTree(from: string, to: string, written: string[], prefix = ""): Promise<void> {
  await fs.mkdir(to, { recursive: true });
  for (const entry of (await fs.readdir(from, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    if (skipped(entry.name)) continue;
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await copyTree(source, target, written, relative);
    } else if (entry.isFile()) {
      await fs.copyFile(source, target);
      written.push(relative);
    }
  }
}

export interface ChatBundleOptions {
  projectName: string;
  /** The generated backend's port; the front end is `frontendPort`. */
  port: number;
  frontendPort: number;
  skipFrontend?: boolean;
}

/** `.env.example` for the chat, with this project's addresses filled in. */
export function renderChatEnvExample(options: ChatBundleOptions): string {
  return `# The chat for ${options.projectName}. Copy to .env, or let \`docker compose\`
# pass these through. Variables marked "generated" are created once by the
# project's setup and must then never change: rotating CHAT_AUTH_SECRET ends
# every chat session, and replacing SSO_SIGNING_KEY without SSO_PUBLIC_KEY
# makes every reporting sign-in fail.

# Where the browser reaches the chat, and the path it is mounted on.
CHAT_PUBLIC_ORIGIN=http://localhost
CHAT_BASE_PATH=/chat
CHAT_HOST=0.0.0.0
CHAT_PORT=3100
CHAT_INTERNAL_PORT=3101
# Set only when a reverse proxy you control sits in front and sets X-Forwarded-For.
CHAT_TRUST_PROXY=1

# The chat's own database. NEVER the application's: the reporting platform
# reads every schema of the database it reports on, so chat sessions stored
# there would become reportable rows.
CHAT_DATABASE_URL=postgres://postgres:postgres@localhost:5432/${options.projectName.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_chat
CHAT_DATABASE_SCHEMA=chat
# generated: openssl rand -hex 32
CHAT_AUTH_SECRET=

# The application this chat belongs to, as the gateway reaches it, and where
# the browser reaches it.
CHAT_APP_API_URL=http://localhost:${options.port}/api
CHAT_APP_PUBLIC_PATH=/app

# The reporting platform. Leave CHAT_REPORT_API_URL empty to run without it.
CHAT_REPORT_API_URL=http://localhost:5150/api
CHAT_REPORT_PUBLIC_PATH=/report
# generated: an Ed25519 key pair. The private half stays here; the public half
# is the reporting platform's SSO_PUBLIC_KEY.
SSO_SIGNING_KEY=

# DeepSeek. The key is required; nothing else in the application uses it.
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/anthropic
# deepseek-flash (the default) or deepseek-v4-pro, from the DeepSeek catalogue Harness ships.
CHAT_DEEPSEEK_MODEL=deepseek-flash

# One Harness host per signed-in person. See README.md for what this costs.
# Empty means the default: node on PATH (Harness needs Node 22.19 or later),
# the installed Harness, and this directory's skills and AGENTS.md.
CHAT_NODE_BIN=
CHAT_DSH_BIN=
CHAT_SKILLS_DIR=
CHAT_AGENTS_FILE=
CHAT_HOST_START_TIMEOUT_MS=60000
CHAT_HOST_PORTS=41000-41999
CHAT_HOST_IDLE_MINUTES=30
CHAT_HOST_HEAP_MB=256
# 0 derives the ceiling from the machine's memory.
CHAT_MAX_HOSTS=0
CHAT_VIEW_TTL_SECONDS=600
CHAT_DATA_DIR=./.data
`;
}

/** Write `chat/` into a generated project. Returns the files written, relative to it. */
export async function writeChatBundle(
  outputDir: string,
  model: ParsedModel,
  options: ChatBundleOptions
): Promise<string[]> {
  if (options.skipFrontend) return [];
  const source = locateChatSource();
  if (!source) {
    throw new Error(
      "The chat (chat-deepseek/) was not found beside the generator. Set APPWITHAI_CHAT_DIR to its directory."
    );
  }
  const target = path.join(outputDir, "chat");
  const written: string[] = [];
  // Replaced whole, like `cedm/`: the chat is the generator's, not the
  // project's — a project changes it by changing the source and regenerating.
  // `.data/` (host homes and session logs) is the one thing kept.
  if (existsSync(target)) {
    for (const entry of await fs.readdir(target)) {
      if (entry === ".data" || entry === ".env" || entry === "node_modules") continue;
      await fs.rm(path.join(target, entry), { recursive: true, force: true });
    }
  }
  await copyTree(source, target, written);

  const skill = domainSkillName(options.projectName);
  const skillDirectory = path.join(target, "skills", skill);
  await fs.mkdir(skillDirectory, { recursive: true });
  await fs.writeFile(
    path.join(skillDirectory, "SKILL.md"),
    renderDomainSkill(model, { projectName: options.projectName })
  );
  written.push(`skills/${skill}/SKILL.md`);

  await fs.writeFile(path.join(target, ".env.example"), renderChatEnvExample(options));
  written.push(".env.example");
  return written;
}
