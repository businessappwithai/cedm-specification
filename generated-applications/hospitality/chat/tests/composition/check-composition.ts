#!/usr/bin/env bun
/**
 * The composition gate: the agent's tools are the business tools and `skill`,
 * and nothing else, measured two ways.
 *
 * 1. **Statically.** Compose `profile/business.patch.yml` over the shipped Web
 *    bundles (`dsh --dump-config`), walk every row that is not disabled — the
 *    top level and each agent preset's own plugin list — and fail on any
 *    package outside {@link ALLOWED_PACKAGES}, and on any of
 *    {@link FORBIDDEN_PACKAGES} that is enabled anywhere.
 * 2. **At run time.** Prepare a host exactly as the gateway does
 *    (`HostManager.prepareHome`), start it against the Messages recorder,
 *    send one message through the real Web client in Chromium, and compare the
 *    `tools` array of the request the host built with {@link EXPECTED_TOOLS}.
 *    The second request of a turn — the session title — must carry none.
 *
 * The static half catches a row added to a bundle in a Harness upgrade; the
 * run-time half catches anything the static half cannot see, such as a tool a
 * permitted plugin registers.
 *
 *   bun tests/composition/check-composition.ts
 *
 * Exit 0 when both hold; 1 with every violation listed.
 */

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { parse } from "yaml";
import { TOOL_NAMES } from "../../plugins/business-tools/index.js";
import type { GatewayConfig } from "../../gateway/config";
import { HostManager } from "../../gateway/hosts";
import { startMessagesRecorder } from "../support/messages-recorder";

const PACKAGE_DIR = resolve(import.meta.dir, "../..");
const DSH_BIN = join(PACKAGE_DIR, "node_modules/@deepseek-ai/dsh/lib/bin.js");
const PATCH = join(PACKAGE_DIR, "profile/business.patch.yml");
const CHROMIUM = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export const EXPECTED_TOOLS = [...TOOL_NAMES, "skill"].sort();

/** Packages that give the agent or the browser a way off the business surface. */
const FORBIDDEN_PACKAGES = [
  "@deepseek-ai/dsh-tool-bash",
  "@deepseek-ai/dsh-tool-bash-persistent",
  "@deepseek-ai/dsh-tool-pwsh",
  "@deepseek-ai/dsh-tool-pwsh-persistent",
  "@deepseek-ai/dsh-tool-fs",
  "@deepseek-ai/dsh-tool-fs-search",
  "@deepseek-ai/dsh-tool-jobs",
  "@deepseek-ai/dsh-tool-web",
  "@deepseek-ai/dsh-tool-workflow",
  "@deepseek-ai/dsh-tool-ralph",
  "@deepseek-ai/dsh-tool-subagent",
  "@deepseek-ai/dsh-tool-subagent-control",
  "@deepseek-ai/dsh-tool-cordis",
  "@deepseek-ai/dsh-tool-present",
  "@deepseek-ai/dsh-plugin-manager",
  "@deepseek-ai/dsh-subprocess-local",
  "@deepseek-ai/dsh-sandbox-local",
  "@deepseek-ai/dsh-bash-sandbox",
  "@deepseek-ai/dsh-pwsh-sandbox",
  "@deepseek-ai/dsh-terminal",
  "@deepseek-ai/dsh-terminal-bash",
  "@deepseek-ai/dsh-ptc-runtime-node",
  "@deepseek-ai/dsh-workflow-ptc",
  "@deepseek-ai/dsh-api-terminal-controller",
  "@deepseek-ai/dsh-api-workspace-files",
  "@deepseek-ai/dsh-api-job-controller",
  "@deepseek-ai/dsh-cordis-host-runner",
  "@deepseek-ai/dsh-cordis-client-runner",
  "@deepseek-ai/dsh-host-directory-picker-auto",
  "@deepseek-ai/dsh-host-open-in-app",
  "@deepseek-ai/dsh-mcp-resources",
  "@deepseek-ai/dsh-mcp-client",
  "@deepseek-ai/dsh-web",
  "@deepseek-ai/dsh-web-fetch-http",
  "@deepseek-ai/dsh-web-search-deepseek",
  "@deepseek-ai/dsh-otel",
  "@deepseek-ai/dsh-session-telemetry-otel",
  "@deepseek-ai/dsh-llm-pi-ai",
];

/**
 * Everything the business composition may run. A package appearing that is not
 * here fails the gate until someone decides, in this file, that it belongs.
 */
const ALLOWED_PACKAGES = new Set([
  // Ours.
  "@appwithai/chat-business-tools",
  "@appwithai/chat-business-nodes",
  // Settings, for reading only: the client's display preferences come through
  // them. The gateway refuses every write method (`REMOTE_ALLOWLIST.settings`),
  // which is what makes them safe to run — a write could repoint the model
  // endpoint the server's key is sent to.
  "@deepseek-ai/dsh-settings",
  "@deepseek-ai/dsh-api-settings-controller",
  "@deepseek-ai/dsh-config-editor",
  // Loader and runtime.
  "@deepseek-ai/cordis-plugin-timer",
  "cordis:group",
  "@deepseek-ai/dsh-llm",
  "@deepseek-ai/dsh-llm-deepseek-api-key",
  "@deepseek-ai/dsh-deepseek-llm-api-extensions",
  "@deepseek-ai/dsh-llm-retry",
  "@deepseek-ai/dsh-agent",
  "@deepseek-ai/dsh-agent-default-model",
  "@deepseek-ai/dsh-agent-loop",
  "@deepseek-ai/dsh-agent-preset",
  "@deepseek-ai/dsh-agent-preset-registry",
  "@deepseek-ai/dsh-agent-instructions",
  "@deepseek-ai/dsh-persona",
  "@deepseek-ai/dsh-system-prompt",
  "@deepseek-ai/dsh-tools",
  "@deepseek-ai/dsh-tool-call-timeout-policy",
  "@deepseek-ai/dsh-repeat-tool-reminder",
  "@deepseek-ai/dsh-user-questions",
  "@deepseek-ai/dsh-user-approval",
  "@deepseek-ai/dsh-authorization",
  "@deepseek-ai/dsh-credentials-local",
  "@deepseek-ai/dsh-plugin-package-inventory-deepseek",
  "@deepseek-ai/dsh-typert-registry",
  "@deepseek-ai/dsh-typert-loader",
  "@deepseek-ai/dsh-api-gateway",
  // Sessions and their storage.
  "@deepseek-ai/dsh-session",
  "@deepseek-ai/dsh-session-log-deepseek",
  "@deepseek-ai/dsh-session-title",
  "@deepseek-ai/dsh-session-title-first-prompt-llm",
  "@deepseek-ai/dsh-session-persistence-jsonl",
  "@deepseek-ai/dsh-session-query-sqlite",
  "@deepseek-ai/dsh-session-projection",
  "@deepseek-ai/dsh-session-projection-cache",
  "@deepseek-ai/dsh-session-checkpoint-policy",
  "@deepseek-ai/dsh-session-reference",
  "@deepseek-ai/dsh-session-stats",
  "@deepseek-ai/dsh-session-turn-outline",
  "@deepseek-ai/dsh-session-log-export",
  "@deepseek-ai/dsh-storage",
  "@deepseek-ai/dsh-storage-json",
  "@deepseek-ai/dsh-storage-domain",
  "@deepseek-ai/dsh-attachment-local",
  "@deepseek-ai/dsh-spill-local",
  "@deepseek-ai/dsh-spill-policy",
  "@deepseek-ai/dsh-token-meter",
  "@deepseek-ai/dsh-commands",
  "@deepseek-ai/dsh-command-feedback",
  "@deepseek-ai/dsh-compaction-basic",
  "@deepseek-ai/dsh-compaction-tool-result-pruner",
  "@deepseek-ai/dsh-compaction-image-offload",
  "@deepseek-ai/dsh-skill",
  "@deepseek-ai/dsh-skill-filesystem",
  "@deepseek-ai/dsh-tool-skill",
  "@deepseek-ai/dsh-skill-badge",
  // The filesystem provider the session API requires, under its policy; no
  // agent tool and no browser route over it is mounted.
  "@deepseek-ai/dsh-fs-sandbox",
  "@deepseek-ai/dsh-fs-observation-policy",
  "@deepseek-ai/dsh-sandbox-policy",
  "@deepseek-ai/dsh-workspace",
  "@deepseek-ai/dsh-api-workspace-controller",
  "@deepseek-ai/dsh-api-session-controller",
  "@deepseek-ai/dsh-shell-env",
  // The Web surface.
  "@deepseek-ai/dsh-web-app",
  "@deepseek-ai/dsh-web-app/startup",
  "@deepseek-ai/dsh-host-webserver",
  "@deepseek-ai/dsh-host-product-telemetry-otel",
  "@deepseek-ai/dsh-client-product-analytics",
  "@deepseek-ai/dsh-client-hmr",
  "@deepseek-ai/dsh-client-modules",
  "@deepseek-ai/dsh-client-connection",
  "@deepseek-ai/dsh-client-file-upload",
  "@deepseek-ai/dsh-api-remotes",
  "@deepseek-ai/dsh-client-ui-theme",
  "@deepseek-ai/dsh-client-locale",
  "@deepseek-ai/dsh-client-shortcuts",
  "@deepseek-ai/dsh-client-ui-shortcuts",
  "@deepseek-ai/dsh-client-ui-layout",
  "@deepseek-ai/dsh-client-ui-renderer",
  "@deepseek-ai/dsh-client-ui-session",
  "@deepseek-ai/dsh-client-resources",
  "@deepseek-ai/dsh-client-ui-sidebar",
  "@deepseek-ai/dsh-client-ui-sidebar-right",
  "@deepseek-ai/dsh-client-ui-settings",
  "@deepseek-ai/dsh-client-ui-settings-general",
  "@deepseek-ai/dsh-client-ui-conversation",
  "@deepseek-ai/dsh-client-ui-approval",
  "@deepseek-ai/dsh-client-ui-chat",
  "@deepseek-ai/dsh-client-ui-brand-official",
  "@deepseek-ai/dsh-client-ui-attachment",
  "@deepseek-ai/dsh-client-ui-tool",
  "@deepseek-ai/dsh-client-ui-workspace",
  "@deepseek-ai/dsh-client-ui-workflow-run",
  "@deepseek-ai/dsh-client-ui-input-trigger",
  "@deepseek-ai/dsh-client-ui-commands",
  "@deepseek-ai/dsh-client-ui-skill",
  "@deepseek-ai/dsh-client-ui-reference",
  "@deepseek-ai/dsh-client-ui-user-questions",
]);

interface Row {
  id?: string;
  name?: string;
  disabled?: unknown;
  group?: boolean;
  config?: unknown;
}

/** `!!js` expressions are not data to this gate: parse them as their source text. */
function readDump(text: string): Row[] {
  const tagged = text.replace(/!!js\s+/g, "");
  return parse(tagged) as Row[];
}

/** A row is off only when it says `disabled: true`; an expression may turn it on, so it counts as on. */
const enabled = (row: Row) => row.disabled !== true;

function walk(rows: Row[], where: string, visit: (row: Row, where: string) => void): void {
  for (const row of rows) {
    if (!enabled(row)) continue;
    visit(row, where);
    if (row.group && Array.isArray(row.config)) walk(row.config as Row[], `${where} › ${row.id}`, visit);
    if (row.name === "@deepseek-ai/dsh-agent-preset") {
      const plugins = (row.config as { plugins?: Row[] } | undefined)?.plugins ?? [];
      walk(plugins, `${where} › preset ${row.id}`, visit);
    }
  }
}

function staticCheck(dshHome: string, workdir: string): string[] {
  const dump = spawnSync("node", [DSH_BIN, "--profile", "chat", "--patch", PATCH, "--dump-config"], {
    cwd: workdir,
    env: { ...process.env, DSH_HOME: dshHome, DSH_TELEMETRY_DISABLED: "1" },
    encoding: "utf8",
  });
  if (dump.status !== 0) return [`--dump-config failed: ${dump.stderr}`];
  const problems: string[] = [];
  if (/did not match|not found/i.test(dump.stderr)) problems.push(`a patch matched no row:\n${dump.stderr}`);
  walk(readDump(dump.stdout), "root", (row, where) => {
    const name = row.name ?? "";
    if (FORBIDDEN_PACKAGES.includes(name)) problems.push(`${where} › ${row.id}: ${name} is enabled and must not be`);
    else if (!ALLOWED_PACKAGES.has(name)) problems.push(`${where} › ${row.id}: ${name} is enabled and not on the allowlist`);
  });
  return problems;
}

async function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolvePort(port));
    });
  });
}

async function runtimeCheck(dshHome: string, documents: string, skillsDir: string): Promise<string[]> {
  const recorder = startMessagesRecorder(0);
  const port = await freePort();
  const host = spawn("node", [DSH_BIN, "--profile", "chat", "--patch", PATCH, "--no-open", "--port", String(port)], {
    cwd: documents,
    env: {
      PATH: process.env.PATH ?? "",
      HOME: documents,
      DSH_HOME: dshHome,
      DSH_TELEMETRY_DISABLED: "1",
      CHAT_GATEWAY_INTERNAL_URL: "http://127.0.0.1:9",
      CHAT_HOST_SECRET: "composition-check",
      CHAT_SKILLS_DIR: skillsDir,
      CHAT_DOCUMENTS_DIR: documents,
      DEEPSEEK_API_KEY: "composition-check",
      DEEPSEEK_BASE_URL: recorder.url,
    },
  });
  let output = "";
  host.stdout.on("data", (chunk) => (output += chunk));
  host.stderr.on("data", (chunk) => (output += chunk));
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox"] });
  try {
    const launch = await new Promise<string>((resolveUrl, reject) => {
      const timer = setInterval(() => {
        const match = /dsh web: (\S+)/.exec(output);
        if (match) {
          clearInterval(timer);
          resolveUrl(match[1]!);
        }
      }, 200);
      setTimeout(() => {
        clearInterval(timer);
        reject(new Error(`host did not start:\n${output}`));
      }, 60_000);
    });
    const page = await browser.newPage();
    await page.goto(launch);
    const chooser = page.getByText("Choose workspace");
    await page.waitForTimeout(4000);
    if (await chooser.count()) {
      await chooser.click();
      await page.getByText("Default workspace").last().click();
    }
    const composer = page.locator('[data-composer-input="true"][contenteditable="true"]');
    await composer.waitFor({ timeout: 30_000 });
    await composer.click();
    await page.keyboard.type("Which entities can I see?");
    await page.keyboard.press("Enter");
    const deadline = Date.now() + 30_000;
    while (recorder.requests.length < 1 && Date.now() < deadline) await page.waitForTimeout(250);
    await page.waitForTimeout(2000);

    const problems: string[] = [];
    const turn = recorder.requests.find((request) => request.toolNames.length > 0);
    if (!turn) return [`no model request carried tools (requests seen: ${recorder.requests.length})`];
    const actual = turn.toolNames.join(",");
    if (actual !== EXPECTED_TOOLS.join(",")) {
      problems.push(`the agent's tools are [${actual}], expected [${EXPECTED_TOOLS.join(",")}]`);
    }
    if (!turn.system.startsWith("You are the business assistant")) {
      problems.push(`the system prompt is not the business persona: ${turn.system.slice(0, 120)}…`);
    }
    return problems;
  } finally {
    await browser.close();
    host.kill("SIGTERM");
    recorder.stop();
  }
}

const scratch = mkdtempSync(join(tmpdir(), "chat-composition-"));
try {
  const config = {
    dataDir: scratch,
    pluginsDir: join(PACKAGE_DIR, "plugins"),
    agentsFile: join(PACKAGE_DIR, "AGENTS.md"),
    hostIdleMinutes: 30,
    hostHeapMb: 256,
    maxHosts: 1,
  } as GatewayConfig;
  const hosts = new HostManager(config);
  const { dshHome, documents } = await hosts.prepareHome("composition-check");
  await hosts.stopAll();

  const problems = staticCheck(dshHome, documents);
  problems.push(...(await runtimeCheck(dshHome, documents, join(PACKAGE_DIR, "skills"))));
  if (problems.length > 0) {
    console.error(`composition gate FAILED:\n  - ${problems.join("\n  - ")}`);
    process.exitCode = 1;
  } else {
    console.log(`composition gate passed: the agent's tools are exactly ${EXPECTED_TOOLS.join(", ")}`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
