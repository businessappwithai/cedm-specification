#!/usr/bin/env bun
/**
 * Write one CEDM application per domain, and the common module they share.
 *
 *   bun scripts/build-domain-applications.ts          # write applications/
 *   bun scripts/build-domain-applications.ts --check  # exit 1 if any file is stale
 *
 * The source is `domains/application-catalog.yaml`: the common foundation's
 * entities, and for each domain the capabilities (`domains/capability-catalog.yaml`)
 * and entities it is made of. Names and descriptions come from
 * `domains/catalog.yaml`. An entity a capability names but the library does
 * not define is left out and listed in the file's header, so the application
 * gains it the day the library does.
 *
 * Every application imports `common`; its dashboard has one category per
 * capability, one for the domain's own records, and the foundation as the
 * default that collects everything an import brought in besides.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
// Bun parses YAML itself; the repository root declares no yaml dependency.
const parse = (text: string): any => Bun.YAML.parse(text);
import { serializeCedmDocument } from "../packages/generator/src/model-cedm/canonical";
import { type CedmLibrary, type CedmModelDocument, resolveCedmImports } from "../language/cedm";
import { createFileLibrary } from "../packages/generator/src/model-cedm/library";

const ROOT = path.resolve(import.meta.dir, "..");
const check = process.argv.includes("--check");

interface CatalogApplication {
  domain: string;
  icon?: string;
  capabilities?: string[];
  entities?: string[];
}

const catalog = parse(readFileSync(path.join(ROOT, "domains/application-catalog.yaml"), "utf-8"))
  .catalog as {
  common: { name: string; description: string; entities: string[] };
  applications: CatalogApplication[];
};
const capabilities = new Map<string, { name: string; entities: string[] }>(
  (
    parse(readFileSync(path.join(ROOT, "domains/capability-catalog.yaml"), "utf-8")).catalog
      .capabilities as Array<{ id: string; name: string; entities?: string[] }>
  ).map((capability) => [
    capability.id,
    { name: capability.name, entities: capability.entities ?? [] },
  ])
);
const domains = new Map<string, { name: string; capabilities?: string[] }>(
  (
    parse(readFileSync(path.join(ROOT, "domains/catalog.yaml"), "utf-8")).catalog.domains as Array<{
      id: string;
      name: string;
      capabilities?: string[];
    }>
  ).map((domain) => [domain.id, domain])
);

const library = new Set<string>();
/** Value objects are embedded in the entities that hold them, never imported on their own. */
const valueObjects = new Set<string>();
/** member → its aggregate root, from the roots' `ownership: aggregate` collections. */
const aggregateRoots = new Map<string, string[]>();
for (const file of readdirSync(path.join(ROOT, "domain/entities"))) {
  if (!file.endsWith(".yaml") || file === "index.yaml") continue;
  const entity = parse(readFileSync(path.join(ROOT, "domain/entities", file), "utf-8"))?.entity;
  if (!entity?.name) continue;
  library.add(entity.name);
  if (entity.kind === "value_object") valueObjects.add(entity.name);
  for (const relationship of entity.relationships ?? []) {
    const many = /\.\.\*$/.test(String(relationship.cardinality));
    if (relationship.ownership === "aggregate" && many && relationship.target !== entity.name) {
      aggregateRoots.set(relationship.target, [
        ...(aggregateRoots.get(relationship.target) ?? []),
        entity.name,
      ]);
    }
  }
}

/**
 * A line item has no window of its own — it is a tab inside its root's — so
 * it is not a dashboard card either, and listing it in a category is what the
 * checker's EML150 reports. Only roots the application contains count.
 */
const isLineItem = (name: string, contained: Set<string>) =>
  (aggregateRoots.get(name) ?? []).some((root) => contained.has(root));

const FOUNDATION = "Foundation";
const header = (lines: string[]) => ` ${lines.join("\n ")}`;
const stale: string[] = [];
const built = new Map<string, CedmModelDocument>();

function write(file: string, document: CedmModelDocument, lines: string[]): void {
  built.set(file.replace(/\.cedm\.yaml$/, ""), document);
  const text = serializeCedmDocument(document, header(lines));
  const target = path.join(ROOT, "applications", file);
  if (check) {
    if (!existsSync(target) || readFileSync(target, "utf-8") !== text) stale.push(file);
    return;
  }
  writeFileSync(target, text, "utf-8");
}

/* ---- the common foundation --------------------------------------------- */
const common = catalog.common.entities.filter((name) => library.has(name));
write(
  "common.cedm.yaml",
  {
    cedm: "1.0",
    application: {
      name: catalog.common.name,
      description: catalog.common.description,
      enumerationTables: true,
    },
    imports: common.map((entity) => ({ entity })),
    ui: {
      categories: [
        {
          name: FOUNDATION,
          description: "Parties, places, units and reference data every domain shares",
          icon: "Library",
          default: true,
          entities: common.filter((name) => !isLineItem(name, new Set(common))),
        },
      ],
    },
  },
  [
    "The common foundation every CEDM domain application imports.",
    "Generated by scripts/build-domain-applications.ts from domains/application-catalog.yaml.",
  ]
);

/* ---- one application per domain ------------------------------------------ */
for (const application of catalog.applications) {
  const domain = domains.get(application.domain);
  if (!domain) throw new Error(`domains/catalog.yaml has no domain "${application.domain}"`);

  const placed = new Set<string>(common);
  const missing: string[] = [];
  const categories: NonNullable<NonNullable<CedmModelDocument["ui"]>["categories"]> = [];
  const imports: string[] = [];
  const take = (names: string[]): string[] => {
    const taken: string[] = [];
    for (const name of names) {
      if (!library.has(name)) {
        if (!missing.includes(name)) missing.push(name);
        continue;
      }
      if (placed.has(name)) continue;
      placed.add(name);
      imports.push(name);
      taken.push(name);
    }
    return taken;
  };

  const groups: Array<{ name: string; entities: string[] }> = [];
  for (const id of application.capabilities ?? []) {
    const capability = capabilities.get(id);
    if (!capability) throw new Error(`domains/capability-catalog.yaml has no capability "${id}"`);
    groups.push({ name: capability.name, entities: take(capability.entities) });
  }
  groups.push({
    name: application.capabilities?.length ? `${domain.name} records` : domain.name,
    entities: take(application.entities ?? []),
  });
  const contained = new Set([...common, ...imports]);
  for (const group of groups) {
    const cards = group.entities.filter((name) => !isLineItem(name, contained));
    if (!cards.length) continue;
    categories.push({
      name: group.name,
      ...(categories.length === 0 && application.icon ? { icon: application.icon } : {}),
      entities: cards,
    });
  }
  if (!imports.length) throw new Error(`${application.domain} has no library entities`);

  const lines = [
    `${domain.name} — a CEDM application.`,
    "Generated by scripts/build-domain-applications.ts from domains/application-catalog.yaml.",
    `Generate: appwithai generate -i applications/${application.domain}.cedm.yaml -o out -n ${application.domain}`,
  ];
  if (missing.length) {
    lines.push(`Named by the catalog but not yet in the library: ${missing.join(", ")}.`);
  }
  write(
    `${application.domain}.cedm.yaml`,
    {
      cedm: "1.0",
      application: {
        name: domain.name,
        version: "1.0.0",
        description: `${domain.name}, built on the CEDM common foundation.`,
        domain: application.domain,
        enumerationTables: true,
      },
      imports: [{ module: "common" }, ...imports.map((entity) => ({ entity }))],
      ui: { categories },
    },
    lines
  );
}

/* ---- every library entity reaches an application ------------------------- */
// An entity no application imports is never generated, never tested and never
// seen: Guardian, Coverage and the port and research entities sat in the
// library unreachable. The imports are resolved exactly as the generators
// resolve them, so the closure over required references counts.
const files = createFileLibrary({ root: ROOT });
const resolver: CedmLibrary = {
  entity: (name) => files.entity(name),
  module: (name) => built.get(name),
};
const reached = new Set<string>();
for (const [name, document] of built) {
  const resolved = resolveCedmImports(document, resolver);
  const errors = resolved.notes.filter((note) => note.severity === "error");
  if (errors.length) {
    throw new Error(`${name}: ${errors.map((note) => `${note.code} ${note.message}`).join("; ")}`);
  }
  for (const entity of resolved.libraryEntities) reached.add(entity);
}
const unreached = [...library].filter((name) => !reached.has(name) && !valueObjects.has(name));
if (unreached.length) {
  console.error(
    `Library entities no application reaches: ${unreached.sort().join(", ")}.\n` +
      "List each under its domain in domains/application-catalog.yaml."
  );
  process.exit(1);
}

if (check) {
  if (stale.length) {
    console.error(`Stale: ${stale.join(", ")}. Run bun scripts/build-domain-applications.ts.`);
    process.exit(1);
  }
  console.log(`applications/ is in sync (${catalog.applications.length + 1} files).`);
} else {
  console.log(`Wrote applications/: common + ${catalog.applications.length} domain applications.`);
}
