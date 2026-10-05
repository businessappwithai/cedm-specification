/**
 * The chat a generated application ships with: copied whole from
 * `chat-deepseek/`, plus the application's own domain skill and environment
 * template.
 *
 * Read against drug-discovery, the model this repository is validated on: its
 * lifecycle, its value lists and its five transition rules are what the skill
 * has to carry for the assistant to name a record's status correctly.
 */

import { existsSync, readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { compileModelDocument, readModelYaml } from "../../model-yaml/index";
import { locateChatSource, renderChatEnvExample, writeChatBundle } from "../../pipeline/chat-bundle";
import { domainSkillName, renderDomainSkill } from "../domain-skill";

const repositoryRoot = path.resolve(__dirname, "../../../../..");
const model = (() => {
  const read = readModelYaml(
    readFileSync(path.join(repositoryRoot, "examples/drug-discovery.eml.yaml"), "utf8")
  );
  if (!read.document) throw new Error("drug-discovery did not read");
  return compileModelDocument(read.document);
})();

describe("the domain skill", () => {
  const skill = renderDomainSkill(model, { projectName: "drug-discovery" });

  it("is a Harness skill: front matter with a kebab-case name, a description and when to use it", () => {
    const front = skill.split("\n---\n")[0] ?? "";
    expect(front.startsWith("---\nname: drug-discovery-domain\n")).toBe(true);
    expect(front).toMatch(/\ndescription: .+/);
    expect(front).toMatch(/\nwhenToUse: .+/);
    expect(domainSkillName("Drug Discovery!")).toBe("drug-discovery-domain");
  });

  it("names every record a person can navigate to, and no line item as one", () => {
    for (const entity of model.entities) {
      const heading = skill.includes(`### ${entity.name.replace(/([a-z])([A-Z])/g, "$1 $2")}`);
      expect(heading, entity.name).toBe(!entity.parentEntity);
    }
  });

  it("states every lifecycle's final states, which the application refuses to change", () => {
    expect(model.workflows.length).toBeGreaterThan(0);
    for (const workflow of model.workflows) {
      expect(workflow.terminal.length, workflow.name).toBeGreaterThan(0);
      const section = skill.slice(skill.indexOf(`— `, skill.indexOf("## Lifecycles")));
      expect(section).toContain("Final: ");
    }
    expect(skill).toContain("A **final** state is a completed transaction");
  });

  it("carries the model's role rules on the moves they restrict", () => {
    const restricted = model.rbac.transitions.flatMap((rule) => rule.roles);
    expect(restricted.length).toBeGreaterThan(0);
    expect(skill).toMatch(/→ .+ — only /);
  });

  it("names a reference by the record it holds, by the dictionary's own derivation", () => {
    // `remediation_owner` is a person-role column: a User, not a record type of its own.
    expect(skill).toContain("**Remediation Owner** (required, a User)");
  });

  it("speaks the application's words, never its tables or a model's markup", () => {
    expect(skill).not.toMatch(/\bbus_[a-z0-9_]+/);
    expect(skill).not.toContain("```");
  });
});

describe("chat/ in a generated project", () => {
  it("finds chat-deepseek from the generator's own location", () => {
    expect(locateChatSource()).toBe(path.join(repositoryRoot, "chat-deepseek"));
  });

  it("is the source, without installs or scratch files, plus the two rendered files", async () => {
    const out = await fs.mkdtemp("/tmp/chat-bundle-");
    const written = await writeChatBundle(out, model, {
      projectName: "drug-discovery",
      port: 3000,
      frontendPort: 3001,
    });
    const chat = path.join(out, "chat");
    for (const file of [
      "package.json",
      "bun.lock",
      "AGENTS.md",
      "gateway/server.ts",
      "profile/business.patch.yml",
      "plugins/business-tools/index.js",
      "plugins/business-nodes/client.js",
      "skills/using-the-application/SKILL.md",
      "skills/drug-discovery-domain/SKILL.md",
      ".env.example",
      "Dockerfile",
      ".dockerignore",
    ]) {
      expect(existsSync(path.join(chat, file)), file).toBe(true);
      expect(written).toContain(file);
    }
    expect(written.some((file) => file.split("/").some((part) => part === "node_modules"))).toBe(false);
    expect(written.some((file) => file.split("/").some((part) => part.startsWith(".") && part !== ".env.example" && part !== ".dockerignore"))).toBe(false);
  });

  it("keeps a project's sessions and local settings across a regeneration", async () => {
    const out = await fs.mkdtemp("/tmp/chat-bundle-");
    const options = { projectName: "drug-discovery", port: 3000, frontendPort: 3001 };
    await writeChatBundle(out, model, options);
    await fs.mkdir(path.join(out, "chat", ".data"), { recursive: true });
    await fs.writeFile(path.join(out, "chat", ".data", "kept"), "x");
    await fs.writeFile(path.join(out, "chat", ".env"), "DEEPSEEK_API_KEY=kept");
    await fs.writeFile(path.join(out, "chat", "stale.txt"), "removed");
    await writeChatBundle(out, model, options);
    expect(existsSync(path.join(out, "chat", ".data", "kept"))).toBe(true);
    expect(existsSync(path.join(out, "chat", ".env"))).toBe(true);
    expect(existsSync(path.join(out, "chat", "stale.txt"))).toBe(false);
  });

  it("is not written without a front end to embed", async () => {
    const out = await fs.mkdtemp("/tmp/chat-bundle-");
    expect(
      await writeChatBundle(out, model, { projectName: "x", port: 3000, frontendPort: 3001, skipFrontend: true })
    ).toEqual([]);
    expect(existsSync(path.join(out, "chat"))).toBe(false);
  });

  it("names every variable the gateway reads, with the project's API address", () => {
    const env = renderChatEnvExample({ projectName: "drug-discovery", port: 3000, frontendPort: 3001 });
    const config = readFileSync(path.join(repositoryRoot, "chat-deepseek/gateway/config.ts"), "utf8");
    const read = new Set([...config.matchAll(/(?:required|optional)\("([A-Z_]+)"\)/g)].map((m) => m[1]));
    expect(read.size).toBeGreaterThan(10);
    for (const name of read) expect(env, name).toMatch(new RegExp(`^${name}=`, "m"));
    expect(env).toContain("CHAT_APP_API_URL=http://localhost:3000/api");
    expect(env).toMatch(/^CHAT_DATABASE_URL=.*drug_discovery_chat$/m);
  });
});
