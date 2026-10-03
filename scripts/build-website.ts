#!/usr/bin/env bun
/**
 * Build the documentation website of one or more generated applications.
 *
 *   bun scripts/build-website.ts sales            # website/sales/
 *   bun scripts/build-website.ts --all
 *   bun scripts/build-website.ts --plan sales     # the screenshot plan, as JSON
 *
 * Reads `generated-applications/<d>/model/model.eml.yaml` (the model every
 * application ships), the domain catalogs, and the screenshots already under
 * `website/<d>/static/img`, and writes the Docusaurus project. `docs/` is
 * rewritten from scratch each run so a page for an entity the model no longer
 * has does not linger; `static/` is only ever added to.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { kebabCase } from "@appwithai/core/utils";
import { parseModelYaml } from "../packages/generator/src/model-yaml";
import { manualDictionary } from "../packages/generator/src/manual";
import { ADMIN_PAGES, renderSite, type SiteCapability } from "../packages/generator/src/website";

const root = path.resolve(import.meta.dir, "..");
// `yaml` is the generator package's dependency, not the root's.
const { parse } = createRequire(path.join(root, "packages/generator/package.json"))("yaml") as {
  parse: (text: string) => any;
};
const REFERENCE_DATA = "Reference Data";

function listShots(dir: string): Set<string> {
  const found = new Set<string>();
  const walk = (current: string) => {
    if (!existsSync(current)) return;
    for (const name of readdirSync(current)) {
      const full = path.join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else found.add(path.relative(path.join(dir), full).split(path.sep).join("/"));
    }
  };
  walk(path.join(dir, "img"));
  return found;
}

const catalog = parse(readFileSync(path.join(root, "domains/catalog.yaml"), "utf8"));
const applicationCatalog = parse(readFileSync(path.join(root, "domains/application-catalog.yaml"), "utf8"));
const capabilityCatalog = parse(readFileSync(path.join(root, "domains/capability-catalog.yaml"), "utf8"));

function domainsInfo(domain: string) {
  const domains: any[] = catalog?.catalog?.domains ?? catalog?.domains ?? [];
  const entry = domains.find((candidate) => candidate.id === domain);
  const applications: any[] = applicationCatalog?.catalog?.applications ?? [];
  const application = applications.find((candidate) => candidate.domain === domain);
  const capabilityList: any[] = capabilityCatalog?.capabilities ?? capabilityCatalog?.catalog?.capabilities ?? [];
  const wanted: string[] = application?.capabilities ?? [];
  const capabilities: SiteCapability[] = wanted
    .map((id) => capabilityList.find((capability) => capability.id === id))
    .filter(Boolean)
    .map((capability) => ({
      name: capability.name ?? capability.id,
      entities: capability.entities ?? [],
      processes: capability.processes ?? [],
    }));
  return { entry, capabilities };
}

function load(domain: string) {
  const modelPath = path.join(root, "generated-applications", domain, "model", "model.eml.yaml");
  const { model, document } = parseModelYaml(readFileSync(modelPath, "utf8"), { source: modelPath });
  return { model, document };
}

function plan(domain: string) {
  const { model } = load(domain);
  const dictionary = manualDictionary(model);
  const category = (entity: string) =>
    model.categories.find((candidate) => candidate.entities.includes(entity))?.name ?? "General";
  return {
    domain,
    entities: model.entities.map((entity) => ({
      name: entity.name,
      slug: kebabCase(entity.name),
      window: dictionary.get(entity.name)?.window ?? entity.name,
      isReference: category(entity.name) === REFERENCE_DATA,
      isLine: Boolean(entity.parentEntity),
      hasLifecycle: model.workflows.some((workflow) => workflow.entity === entity.name),
    })),
    lifecycles: model.workflows.map((workflow) => ({
      entity: workflow.entity,
      slug: kebabCase(workflow.entity),
      initial: workflow.initial ?? null,
      move: workflow.transitions.find((transition) => transition.from === workflow.initial)?.to ?? null,
    })),
    rules: model.rules.map((rule) => ({ name: rule.name, slug: kebabCase(rule.name), entity: rule.entity })),
    sagas: model.sagas.map((saga) => ({ name: saga.name, slug: kebabCase(saga.name) })),
    admin: ADMIN_PAGES,
  };
}

function build(domain: string): { pages: number } {
  const { model, document } = load(domain);
  const siteDir = path.join(root, "website", domain);
  const { entry, capabilities } = domainsInfo(domain);
  const files = renderSite(model, {
    domain,
    title: document.name ?? domain,
    description: model.description ?? document.description ?? `${document.name} application`,
    domainName: entry?.name,
    domainCapabilities: entry?.capabilities,
    capabilities,
    shots: listShots(path.join(siteDir, "static")),
    version: document.version,
  });

  rmSync(path.join(siteDir, "docs"), { recursive: true, force: true });
  for (const [relative, content] of files) {
    const target = path.join(siteDir, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  mkdirSync(path.join(siteDir, "static", "img"), { recursive: true });
  return { pages: [...files.keys()].filter((file) => file.endsWith(".md")).length };
}

const args = process.argv.slice(2);
if (args[0] === "--plan") {
  console.log(JSON.stringify(plan(args[1] as string), null, 2));
} else {
  const domains = args.includes("--all")
    ? readdirSync(path.join(root, "generated-applications"))
        .filter((name) => existsSync(path.join(root, "generated-applications", name, "model", "model.eml.yaml")))
        .filter((name) => name !== "screenshots")
    : args;
  for (const domain of domains) {
    const { pages } = build(domain);
    console.log(`  ok   ${domain}: ${pages} pages`);
  }
}
