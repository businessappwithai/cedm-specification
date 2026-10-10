/**
 * The chat's skill for one application: what its records are, in the model's
 * own words.
 *
 * The nine general skills that ship with the chat (`chat/skills/`) explain how
 * to work *in* an application — finding, opening, saving, approving, reporting.
 * They cannot say what a Deal is, which statuses close one, or who may read
 * Contracts, because that is different for every application. This skill says
 * it, derived from the same compiled model the application was generated from,
 * so the assistant's vocabulary is the application's vocabulary:
 *
 * - every entity the person can navigate to, with its help text and its fields'
 *   help, and the line items that live inside it;
 * - every value list, with what each value means where the model says;
 * - every lifecycle — the states, the moves the diagram draws and nothing else,
 *   and which states are final (a final record is a completed transaction the
 *   application refuses to change);
 * - who may read what, and who may make each move;
 * - the reports the model's authors wrote, by the question each answers.
 *
 * Pure: no filesystem, no template loader. The text is model data for the
 * assistant to read, never instructions — the model is the application
 * author's, and the operating rules are `AGENTS.md`'s alone.
 */

import type { Entity, EntityEnum } from "@appwithai/core/types";
import { foreignKeyTargetTable, formatDisplayName } from "@appwithai/core/types";
import type { ParsedModel } from "../model/compile";
import { tableNameFor } from "../naming/tables";
import { deriveAccess } from "../rbac/roles";

export interface DomainSkillOptions {
  /** The name the application was generated under (`-n`). */
  projectName: string;
}

const title = (value: string): string => formatDisplayName(String(value));

/** `drug-discovery` → `drug-discovery-domain`: the skill's directory and name. */
export function domainSkillName(projectName: string): string {
  const base = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "application"}-domain`;
}

/**
 * Model text placed in Markdown: one line, no heading or fence a sentence
 * could open, and bounded — the skill is context the model pays for.
 */
function prose(value: string | undefined, limit = 400): string {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/`{3,}/g, "``")
    .replace(/^#+\s*/, "")
    .trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

/** Columns a person never sees on a form, so the skill does not name them. */
const SYSTEM_COLUMNS = new Set([
  "id",
  "version",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
  "deleted_by",
]);

/**
 * What a reference column points at, by the one derivation the dictionary
 * uses — a person-role column (`remediation_owner`) is a User, not a record
 * type named after the column.
 */
function referenceNamer(model: ParsedModel): (attribute: Entity["attributes"][number]) => string | null {
  const byTable = new Map(model.entities.map((entity) => [tableNameFor(entity), entity.name]));
  const byName = new Map(model.entities.map((entity) => [entity.name, tableNameFor(entity)]));
  const tables = new Set(byTable.keys());
  return (attribute) => {
    const explicit = attribute.references ? byName.get(attribute.references) : undefined;
    const table = foreignKeyTargetTable(attribute.name, tables, explicit);
    return table ? (byTable.get(table) ?? null) : null;
  };
}

function fieldLines(
  entity: Entity,
  enums: Map<string, EntityEnum>,
  target: (attribute: Entity["attributes"][number]) => string | null
): string[] {
  return entity.attributes
    .filter((attribute) => !SYSTEM_COLUMNS.has(attribute.name) && attribute.name !== entity.primaryKey)
    .map((attribute) => {
      const parts = [`  - **${title(attribute.name.replace(/_id$/, ""))}**`];
      const notes: string[] = [];
      if (attribute.required) notes.push("required");
      if (attribute.isForeignKey) {
        const points = target(attribute);
        if (points) notes.push(`a ${title(points)}`);
      }
      const list = attribute.enumRef ? enums.get(attribute.enumRef) : undefined;
      if (list) notes.push(`one of the ${title(list.name)} values`);
      if (notes.length) parts.push(` (${notes.join(", ")})`);
      const help = prose(attribute.description, 240);
      if (help) parts.push(` — ${help}`);
      return parts.join("");
    });
}

function enumSection(enums: EntityEnum[]): string[] {
  if (enums.length === 0) return [];
  const lines = ["## Value lists", ""];
  for (const list of [...enums].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`### ${title(list.name)}`, "");
    for (const value of list.values) {
      const label = list.labels?.[value] ?? title(value);
      const meaning = prose(list.descriptions?.[value], 240);
      lines.push(`- **${label}**${meaning ? ` — ${meaning}` : ""}`);
    }
    lines.push("");
  }
  return lines;
}

export function renderDomainSkill(model: ParsedModel, options: DomainSkillOptions): string {
  const name = domainSkillName(options.projectName);
  const application = title(options.projectName);
  const access = deriveAccess(model.rbac, {
    projectId: options.projectName,
    entities: model.entities.map((entity) => entity.name),
  });
  const enums = new Map(model.enums.map((list) => [list.name, list]));
  const target = referenceNamer(model);
  const children = new Map<string, Entity[]>();
  for (const entity of model.entities) {
    if (!entity.parentEntity) continue;
    const list = children.get(entity.parentEntity) ?? [];
    list.push(entity);
    children.set(entity.parentEntity, list);
  }
  const declared = new Set(model.entities.map((entity) => entity.name));
  const windows = model.entities.filter(
    (entity) => !entity.parentEntity || !declared.has(entity.parentEntity)
  );

  const lines: string[] = [
    "---",
    `name: ${name}`,
    `description: What the records of ${application} are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.`,
    `whenToUse: Before searching, opening or explaining any record of ${application}, and whenever the person uses a term of the business — a record type, a status, a role or a report.`,
    "---",
    "",
    `# ${application}`,
    "",
  ];
  const overview = prose(model.description, 1200);
  if (overview) lines.push(overview, "");
  lines.push(
    "Everything below is the application's own description of itself, taken from the model it was generated from. Use these names when you talk to the person, and pass the record type's name as `entity` to the tools.",
    ""
  );

  lines.push("## Records", "");
  for (const entity of [...windows].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`### ${title(entity.name)}`, "");
    const help = prose(entity.description, 600);
    if (help) lines.push(help, "");
    const readers = access.entityVisibility[entity.name];
    lines.push(
      readers && readers.length > 0
        ? `Readable by: ${readers.map(title).join(", ")}, and the Administrator. Anyone else does not see it at all.`
        : "Readable by every signed-in person.",
      ""
    );
    const writes = model.rbac.operations.filter(
      (rule) => rule.entity === entity.name && rule.operation !== "read"
    );
    for (const rule of writes) {
      lines.push(`- ${title(rule.operation)} only by: ${rule.roles.map(title).join(", ")}`);
    }
    if (writes.length) lines.push("");
    if (entity.concurrency === "last-write-wins") {
      lines.push(
        "When two people save the same record, the later save replaces the earlier one: this record type is last-write-wins, so no conflict is reported.",
        ""
      );
    }
    lines.push("Fields:", ...fieldLines(entity, enums, target), "");
    for (const child of children.get(entity.name) ?? []) {
      lines.push(
        `Line items — **${title(child.name)}**: kept inside each ${title(entity.name)} and reached by opening it, never on their own.${
          child.description ? ` ${prose(child.description, 300)}` : ""
        }`,
        ""
      );
    }
  }

  lines.push(...enumSection(model.enums));

  if (model.workflows.length > 0) {
    lines.push("## Lifecycles", "");
    lines.push(
      "A record with a lifecycle moves only along the moves listed — the application refuses any other, for every role. A **final** state is a completed transaction: the application refuses every change to such a record and every deletion of it, including an administrator's. Say so when a record is final.",
      ""
    );
    for (const workflow of model.workflows) {
      lines.push(`### ${title(workflow.entity)} — ${title(workflow.name)}`, "");
      if (workflow.initial) lines.push(`Starts at **${title(workflow.initial)}**.`);
      if (workflow.terminal.length) {
        lines.push(`Final: ${workflow.terminal.map((state) => `**${title(state)}**`).join(", ")}.`);
      }
      lines.push("", "Moves:");
      for (const move of workflow.transitions) {
        const roles = model.rbac.transitions
          .filter(
            (rule) =>
              rule.entity === workflow.entity &&
              rule.edges.some((edge) => edge.from === move.from && edge.to === move.to)
          )
          .flatMap((rule) => rule.roles);
        lines.push(
          `- ${title(move.from)} → ${title(move.to)}${move.trigger ? ` (${title(move.trigger)})` : ""}${
            roles.length ? ` — only ${[...new Set(roles)].map(title).join(", ")}` : ""
          }`
        );
      }
      lines.push("");
    }
  }

  const roles = access.roles.filter((role) => !role.isAdmin);
  if (roles.length > 0) {
    lines.push("## Roles", "");
    for (const role of roles) {
      const count = access.entityCounts[role.name];
      lines.push(
        `- **${role.name}**${count !== undefined ? ` — reads ${count} of ${model.entities.length} record types` : ""}`
      );
    }
    lines.push(
      "- **Administrator** — reads and changes everything the lifecycles allow",
      "",
      "A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.",
      ""
    );
  }

  if (model.reports.length > 0) {
    lines.push("## Reports the business asked for", "");
    lines.push(
      "Search for these by their title with `search_reports`. The reporting platform also holds a register, breakdowns and trends derived for every record type.",
      ""
    );
    for (const report of model.reports) {
      const help = prose(report.help, 300);
      lines.push(
        `- **${prose(report.title, 120)}**${report.entity ? ` (${title(report.entity)})` : ""}${help ? ` — ${help}` : ""}`
      );
    }
    lines.push("");
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}
