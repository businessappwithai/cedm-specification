#!/usr/bin/env bun
/**
 * Derive a reporting pack from a model (`*.eml.yaml`).
 *
 *   bun build/reporting-pack.ts -i <model.eml.yaml> -o <pack.json> --database <db>
 *
 * The reporting platform stores reports, charts and dashboards as definitions
 * over saved SQL queries, and holds roles deciding which of a data source's
 * tables a reporting user may read. A pack is exactly those definitions, so a
 * generated application arrives with a reporting layer built for *its* entities
 * rather than an empty workspace and a SQL editor.
 *
 * ## This file derives nothing
 *
 * The derivation is the generator's — `buildReportingPack` in
 * `packages/generator/src/reporting/pack.ts` at the root of this repository,
 * whose table names come from the same rule the Loco `m0002_bus_tables`
 * migration renders — and this is a CLI over it. The generated application's
 * browser build and the deployable project both ship the same pack; one
 * derivation is what keeps the products agreeing about what reports a model has.
 *
 * The model is read by the language's one reader (`parseModelYaml`: YAML
 * syntax, the JSON Schema, the full checker) and compiled by its one compiler.
 * A model with errors is refused with each finding at its YAML line.
 *
 * Every derived query is still traceable to something the model declares — an
 * entity earns a register, an enum-bound column a breakdown, `created_at` a
 * volume line, a state machine a lifecycle, numeric columns a measures report,
 * a one-to-many relationship children-per-parent, and a `reports` entry the
 * question its author wrote. `scripts/check-reporting-pack.ts` is what runs
 * the result against a real PostgreSQL.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ModelYamlError, parseModelYaml } from "../../../../packages/generator/src/model-yaml/index.ts";
import {
  buildReportingPack,
  type ReportingPack,
} from "../../../../packages/generator/src/reporting/pack.ts";

export type {
  AccessRoleSpec,
  AccessSpec,
  ChartSpec,
  DashboardSpec,
  DashboardWidgetSpec,
  ReportingPack,
  ReportSpec,
  SavedQuerySpec,
} from "../../../../packages/generator/src/reporting/pack.ts";

/**
 * Build a pack for one model.
 *
 * @param source       the model document (YAML text)
 * @param modelPath    where it came from, recorded in the pack
 * @param databaseName the database its queries will run against
 * @param projectName  the name the application was generated under —
 *   `generate -n`, and **not** the model's `name`. `start.sh` passes the model
 *   file's basename, so `crm.eml.yaml` generates an application whose seeded
 *   accounts are `sales.manager@crm.example.com`; deriving them from the
 *   model's `name` instead produced `sales.manager@enterprise-crm.example.com`,
 *   addresses belonging to no account anywhere and printed on the front door as
 *   the way in. Defaults to the basename so a caller that omits it agrees with
 *   `start.sh` anyway.
 */
export function buildPack(
  source: string,
  modelPath: string,
  databaseName: string,
  projectName?: string
): ReportingPack {
  let read: ReturnType<typeof parseModelYaml>;
  try {
    read = parseModelYaml(source, { source: path.basename(modelPath), warn: () => {} });
  } catch (error) {
    if (error instanceof ModelYamlError) {
      throw new Error(`Model has errors; run \`eml validate\` for the full report:\n${error.message}`);
    }
    throw error;
  }
  const { model, document } = read;
  if (model.entities.length === 0) throw new Error("Model declares no entities.");

  const basename = path.basename(modelPath).replace(/\.eml\.yaml$|\.ya?ml$/, "");

  return buildReportingPack(model, {
    projectName: projectName ?? basename,
    // What the reports are *called* after, which the model's `name` is for.
    // The accounts above stay on the generate-time name; only the titles move.
    applicationName: document.name ?? basename,
    projectDescription: document.description,
    databaseName,
    modelFileName: path.basename(modelPath),
    // Recorded here and nowhere else. The generator omits it so that its own
    // output can be compared byte for byte; a pack written by this CLI is a
    // build artefact and saying when it was built costs nothing.
    generatedAt: new Date().toISOString(),
  });
}

function main(): number {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const input = flag("-i") ?? flag("--input");
  const output = flag("-o") ?? flag("--output") ?? "reporting-pack.json";
  const database = flag("--database") ?? "appdb";
  const appName = flag("--app-name");

  if (!input) {
    console.error(
      "usage: reporting-pack.ts -i <model.eml.yaml> [-o pack.json] [--database name] [--app-name name]"
    );
    return 2;
  }
  if (!existsSync(input)) {
    console.error(`Model not found: ${input}`);
    return 2;
  }

  const pack = buildPack(readFileSync(input, "utf8"), input, database, appName);
  mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  writeFileSync(output, `${JSON.stringify(pack, null, 2)}\n`);

  console.log(`  ${pack.application.name}`);
  console.log(
    `  ${pack.queries.length} queries · ${pack.reports.length} reports · ${pack.charts.length} charts · ${pack.dashboards.length} dashboard(s)`
  );
  console.log(
    `  ${pack.access.roles.length} reporting role(s)${pack.access.scoped ? ", scoped to what each may read" : ""}`
  );
  console.log(`  → ${output}`);
  return 0;
}

if (import.meta.main) process.exit(main());
