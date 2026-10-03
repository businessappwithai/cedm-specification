/**
 * A generated application's documentation website, as a Docusaurus project.
 *
 * `renderSite` turns a compiled model into the files of `website/<app>/`:
 * a home page that explains the application and the domain it serves, one page
 * per business entity (what it is, how to find, create and change a record,
 * every field, the lifecycle, the rules that run, who may use it), one page per
 * list of values, and an administrator section covering the business workflows,
 * the rules, the processes, access and reports.
 *
 * Pure: no filesystem. `scripts/build-website.ts` reads the model and the
 * screenshots on disk and writes what this returns.
 *
 * ## Words, not columns
 *
 * A reader of these pages is looking at the running application, so every
 * entity is named by its window and every field by its label — the names the
 * dictionary puts on screen — never by a table or column name. The same rule
 * the screens follow (`useEntityLabel`).
 *
 * ## A screenshot is linked only if it exists
 *
 * Docusaurus fails the build on an image it cannot find, and a capture that
 * was skipped is a finding rather than a reason to break the site. `shots`
 * lists what is on disk; anything else is simply not drawn.
 */

import type { Entity, EntityAttribute } from "@appwithai/core/types";
import { kebabCase } from "@appwithai/core/utils";
import type { ParsedModel } from "../model/compile";
import {
  controlFor,
  declaredNames,
  manualDictionary,
  referenceIdFor,
  referenceTarget,
  title,
  type ManualDictionary,
} from "../manual";

export interface SiteCapability {
  name: string;
  entities: string[];
  processes: string[];
}

export interface SiteContext {
  /** The folder name and URL segment: `sales`. */
  domain: string;
  /** What the application is called: "Sales and Order Management". */
  title: string;
  description: string;
  /** The catalog domain's own name and capability list, when it has one. */
  domainName?: string;
  domainCapabilities?: string[];
  capabilities?: SiteCapability[];
  /** Paths under `static/` that exist, e.g. `img/entities/customer-list.jpg`. */
  shots: ReadonlySet<string>;
  /** Rule names that exist in the running application, by display name. */
  adminEmail?: string;
  adminPassword?: string;
  version?: string;
}

export type SiteFiles = Map<string, string>;

/** Screenshot names, shared by the capture script and the renderer. */
export const SHOT = {
  login: "img/login.jpg",
  dashboard: "img/dashboard.jpg",
  themes: "img/themes.jpg",
  entityList: (entity: string) => `img/entities/${kebabCase(entity)}-list.jpg`,
  entityNew: (entity: string) => `img/entities/${kebabCase(entity)}-new.jpg`,
  entityRecord: (entity: string) => `img/entities/${kebabCase(entity)}-record.jpg`,
  rule: (name: string) => `img/rules/${kebabCase(name)}.jpg`,
  saga: (name: string) => `img/processes/${kebabCase(name)}.jpg`,
  admin: (page: string) => `img/admin/${page}.jpg`,
} as const;

/** The administrator windows every application carries, in menu order. */
export const ADMIN_PAGES = [
  { id: "rules", route: "/admin/rules", label: "Business Rules" },
  { id: "workflow-definitions", route: "/admin/workflow-definitions", label: "Workflow Designer" },
  { id: "workflows", route: "/admin/workflows", label: "Workflow Monitor" },
  { id: "automations", route: "/admin/automations", label: "Automations" },
  { id: "audit", route: "/admin/audit", label: "Audit Log" },
  { id: "tables", route: "/admin/tables", label: "Table and Column" },
  { id: "windows", route: "/admin/windows", label: "Window, Tab and Field" },
  { id: "categories", route: "/admin/categories", label: "Entity Categories" },
  { id: "elements", route: "/admin/elements", label: "Element" },
  { id: "references", route: "/admin/references", label: "Reference" },
  { id: "fields", route: "/admin/fields", label: "Field Layout Manager" },
  { id: "reports", route: "/admin/reports", label: "Reports" },
  { id: "users", route: "/admin/users", label: "User Administration" },
  { id: "roles", route: "/admin/roles", label: "Role Administration" },
  { id: "system", route: "/admin/system", label: "System Configuration" },
] as const;

/* --------------------------------------------------------------- helpers */

/** A cell of a Markdown table: no pipes, no line breaks. */
function cell(value: unknown): string {
  return String(value ?? "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

/** The first sentence of a paragraph, for a summary line. */
function firstSentence(text: string | undefined): string {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  const match = /^(.+?[.!?])(\s|$)/.exec(flat);
  return match?.[1] ?? flat;
}

/** `partyRoleInvariantsBeforeCreate` → "Party role invariants before create". */
export function humanize(name: string): string {
  const spaced = name
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** `SUBMITTED` / `in_review` → "Submitted" / "In review". */
function stateLabel(value: string): string {
  const spaced = value.replace(/_/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** A Mermaid-safe node id for a state or step name. */
function mid(value: string): string {
  return value.replace(/[^A-Za-z0-9_]/g, "_") || "S";
}

/** "before a Party is created" for `beforeCreate` on the Party window. */
function eventPhrase(event: string, window: string): string {
  const lower = event.toLowerCase();
  const when = lower.startsWith("after") ? "after" : "before";
  const noun = `a ${window.toLowerCase()}`;
  if (lower.includes("create")) return `${when} ${noun} is created`;
  if (lower.includes("update")) return `${when} ${noun} is changed`;
  if (lower.includes("delete")) return `${when} ${noun} is deleted`;
  return `${when} ${noun} is saved`;
}

function img(shots: ReadonlySet<string>, path: string, alt: string): string {
  return shots.has(path) ? `![${alt}](/${path})\n` : "";
}

function frontMatter(fields: Record<string, string | number>): string {
  const lines = Object.entries(fields).map(([key, value]) =>
    typeof value === "number" ? `${key}: ${value}` : `${key}: ${JSON.stringify(value)}`
  );
  return `---\n${lines.join("\n")}\n---\n\n`;
}

function categoryOf(model: ParsedModel, entity: string): string {
  return (
    model.categories.find((category) => category.entities.includes(entity))?.name ?? "General"
  );
}

const REFERENCE_DATA = "Reference Data";

/* ------------------------------------------------------- model look-ups */

interface Ctx {
  model: ParsedModel;
  site: SiteContext;
  dictionary: ManualDictionary;
  declared: Map<string, string>;
  /** Entity name → the window it opens in. */
  windowOf: (entity: string) => string;
  /** Entity name → column name → the label on screen. */
  labels: Map<string, Map<string, string>>;
}

function buildCtx(model: ParsedModel, site: SiteContext): Ctx {
  const dictionary = manualDictionary(model);
  const declared = declaredNames(model);
  const labels = new Map<string, Map<string, string>>();
  for (const entity of model.entities) {
    const layout = dictionary.get(entity.name);
    const byColumn = new Map<string, string>();
    for (const field of layout?.fields ?? []) byColumn.set(field.column, field.label);
    labels.set(entity.name, byColumn);
  }
  return {
    model,
    site,
    dictionary,
    declared,
    labels,
    windowOf: (entity) => dictionary.get(entity)?.window ?? title(entity),
  };
}

/** The site path of an entity's page. */
function entityPath(ctx: Ctx, entity: string): string {
  const category = categoryOf(ctx.model, entity);
  return category === REFERENCE_DATA
    ? `/reference-data/${kebabCase(entity)}/`
    : `/entities/${kebabCase(category)}/${kebabCase(entity)}/`;
}

function fieldLabel(ctx: Ctx, entity: string, column: string): string {
  return ctx.labels.get(entity)?.get(column) ?? title(column);
}

/** A condition written over columns, re-read over the labels the screen shows. */
function describeExpression(ctx: Ctx, entity: string, expression: string): string {
  const columns = ctx.labels.get(entity) ?? new Map<string, string>();
  return expression
    .replace(/_previous_([a-z0-9_]+)/g, (_m, column: string) => `previous “${columns.get(column) ?? title(column)}”`)
    .replace(/\b([a-z][a-z0-9_]*)\b/g, (word) => {
      const label = columns.get(word);
      return label ? `“${label}”` : word;
    })
    .replace(/\s*!=\s*null/g, " is filled in")
    .replace(/\s*==\s*null/g, " is empty")
    .replace(/\band\b/g, "and")
    .trim();
}

interface RuleLine {
  when: string;
  action: string;
  message: string;
  detail: string[];
}

/** The decision table of a compiled rule, as sentences. */
function ruleLines(ctx: Ctx, entity: string, jdm: string): RuleLine[] {
  let graph: any;
  try {
    graph = JSON.parse(jdm);
  } catch {
    return [];
  }
  const lines: RuleLine[] = [];
  for (const node of graph.nodes ?? []) {
    if (node.type !== "decisionTableNode") continue;
    const outputs: Array<{ id: string; field: string }> = node.content?.outputs ?? [];
    const inputId: string = node.content?.inputs?.[0]?.id ?? "i1";
    for (const row of node.content?.rules ?? []) {
      const value = (field: string): string => {
        const output = outputs.find((candidate) => candidate.field === field);
        const raw = output ? String(row[output.id] ?? "") : "";
        return raw.replace(/^'(.*)'$/s, "$1");
      };
      const condition = String(row[inputId] ?? "").trim();
      const detail: string[] = [];
      const target = value("targetEntity");
      if (target) detail.push(`acts on ${ctx.windowOf(ctx.declared.get(target.replace(/^bus_/, "").replace(/_/g, "")) ?? target)}`);
      const workflowName = value("workflowName");
      if (workflowName) detail.push(`starts the process “${humanize(workflowName)}”`);
      for (const field of ["updateData", "createData", "transformData"]) {
        const data = value(field);
        if (data && data !== "{}") detail.push(`${humanize(field.replace("Data", ""))} data: ${data}`);
      }
      lines.push({
        when: condition && condition !== "true" ? describeExpression(ctx, entity, condition) : "every time",
        action: value("action"),
        message: value("message"),
        detail,
      });
    }
  }
  return lines;
}

const ACTION_WORDS: Record<string, string> = {
  prevent: "Refuses the save",
  "validation-error": "Refuses the save",
  "set-field": "Sets a field",
  "update-entity": "Updates a related record",
  "create-entity": "Creates a record",
  "trigger-workflow": "Starts a process",
  notify: "Sends a notification",
  transform: "Changes the values saved",
};

/* ------------------------------------------------------------ the pages */

function attributeRows(ctx: Ctx, entity: Entity): string {
  const layout = ctx.dictionary.get(entity.name);
  const primaryKey = entity.primaryKey || "id";
  const order = new Map<string, number>();
  layout?.fields.forEach((field, index) => order.set(field.column, field.formSeq || index));
  const attributes = [...entity.attributes]
    .filter((attribute) => attribute.name !== primaryKey)
    .sort((a, b) => (order.get(a.name) ?? 9999) - (order.get(b.name) ?? 9999));

  const rows = attributes.map((attribute: EntityAttribute) => {
    const referenceId = referenceIdFor(attribute, false);
    const control = controlFor(attribute, referenceId);
    const onForm = layout?.fields.find((field) => field.column === attribute.name);
    const rules: string[] = [];
    if (attribute.required) rules.push("Required");
    if (attribute.unique) rules.push("Unique");
    if (attribute.maxLength) rules.push(`Up to ${attribute.maxLength} characters`);
    if (onForm?.readOnly) rules.push("Filled in by the application");
    if (onForm && !onForm.onForm) rules.push("Not on the form");

    const notes: string[] = [];
    if (attribute.enumValues?.length) {
      notes.push(`Choose one: ${attribute.enumValues.map((value) => stateLabel(value)).join(", ")}.`);
    }
    if (attribute.isForeignKey) {
      const target = attribute.references ?? referenceTarget(attribute.name, ctx.declared);
      if (target) {
        const real = ctx.declared.get(target.toLowerCase().replace(/[_\s]/g, "")) ?? target;
        notes.push(`Pick a record from **${ctx.windowOf(real)}**.`);
      }
      if (attribute.narrowedBy?.length) {
        notes.push(
          `The choices narrow to the ${attribute.narrowedBy
            .map((column) => `“${fieldLabel(ctx, entity.name, column)}”`)
            .join(" and ")} you have entered.`
        );
      }
    }
    return `| ${cell(fieldLabel(ctx, entity.name, attribute.name))} | ${cell(control)} | ${cell(rules.join(", ") || "Optional")} | ${cell([attribute.description ?? "", ...notes].join(" "))} |`;
  });

  return rows.length === 0
    ? "This record has no fields of its own."
    : `| Field | What you use | Rules | What to enter |\n| --- | --- | --- | --- |\n${rows.join("\n")}`;
}

function lifecycleSection(ctx: Ctx, entity: Entity): string {
  const machines = ctx.model.workflows.filter((workflow) => workflow.entity === entity.name);
  if (machines.length === 0) return "";
  return machines
    .map((machine) => {
      const diagram = machine.transitions
        .map((t) => `  ${mid(t.from)} --> ${mid(t.to)}: ${(t.trigger ?? "move").replace(/[:;]/g, " ")}`)
        .join("\n");
      const rows = machine.transitions
        .map(
          (t) =>
            `| ${cell(stateLabel(t.from))} | ${cell(stateLabel(t.to))} | ${cell(t.trigger ? humanize(t.trigger) : "—")} |`
        )
        .join("\n");
      return `## Lifecycle: ${humanize(machine.name)}

A ${ctx.windowOf(entity.name).toLowerCase()} record starts as **${stateLabel(machine.initial ?? "")}**${
        machine.terminal.length
          ? ` and ends as ${machine.terminal.map((state) => `**${stateLabel(state)}**`).join(" or ")}`
          : ""
      }. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

\`\`\`mermaid
stateDiagram-v2
  [*] --> ${mid(machine.initial ?? machine.states[0]?.name ?? "START")}
${diagram}
\`\`\`

| From | To | Move |
| --- | --- | --- |
${rows}

${img(ctx.site.shots, SHOT.entityRecord(entity.name), `A ${ctx.windowOf(entity.name)} record with its lifecycle bar`)}`;
    })
    .join("\n");
}

function rulesSection(ctx: Ctx, entity: Entity): string {
  const rules = ctx.model.rules.filter((rule) => rule.entity === entity.name);
  const sagas = ctx.model.sagas.filter((saga) => saga.entity === entity.name);
  const hooks = ctx.model.hooks.filter((hook) => hook.entity === entity.name);
  if (rules.length + sagas.length + hooks.length === 0) return "";
  const out: string[] = ["## What happens when you save"];
  if (rules.length > 0) {
    out.push(
      "Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).\n"
    );
    out.push("| Rule | When | Order |\n| --- | --- | --- |");
    for (const rule of rules) {
      out.push(`| ${cell(humanize(rule.name))} | ${cell(eventPhrase(rule.event, ctx.windowOf(entity.name)))} | ${rule.priority} |`);
    }
  }
  if (sagas.length > 0) {
    out.push(
      `\nProcesses started from this record: ${sagas
        .map((saga) => `[${humanize(saga.name)}](/administration/processes/#${kebabCase(saga.name)})`)
        .join(", ")}.`
    );
  }
  if (hooks.length > 0) {
    out.push(
      `\nCustom handlers: ${hooks.map((hook) => humanize(hook.type)).join(", ")}. Their behaviour is written by the developer of this application.`
    );
  }
  return out.join("\n");
}

function accessSection(ctx: Ctx, entity: Entity): string {
  const operations = ctx.model.rbac.operations.filter((rule) => rule.entity === entity.name);
  if (operations.length === 0) {
    return `## Who may use it

Anyone who holds a role with access to the **${ctx.windowOf(entity.name)}** window. Access is granted by role under [Roles and access](/administration/access/).`;
  }
  const rows = operations
    .map((rule) => `| ${cell(humanize(rule.operation))} | ${cell(rule.roles.map(humanize).join(", "))} |`)
    .join("\n");
  return `## Who may use it

Beyond window access, the model restricts these actions to named roles:

| Action | Permitted to |
| --- | --- |
${rows}`;
}

function relationshipsSection(ctx: Ctx, entity: Entity): string {
  const related = ctx.model.relationships.filter(
    (relationship) =>
      relationship.sourceEntity === entity.name || relationship.targetEntity === entity.name
  );
  if (related.length === 0 && !entity.parentEntity) return "";
  const lines: string[] = ["## How it connects to other records"];
  if (entity.parentEntity) {
    lines.push(
      `\nA ${ctx.windowOf(entity.name).toLowerCase()} is a line of a **${ctx.windowOf(entity.parentEntity)}**. It has no window of its own: open the ${ctx.windowOf(entity.parentEntity).toLowerCase()} and use the **${ctx.windowOf(entity.name)}** tab to see and add lines.`
    );
  }
  const seen = new Set<string>();
  for (const relationship of related) {
    const outgoing = relationship.sourceEntity === entity.name;
    const otherName = outgoing ? relationship.targetEntity : relationship.sourceEntity;
    const other = ctx.windowOf(otherName);
    let phrase: string;
    switch (relationship.cardinality) {
      case "oneToMany":
        phrase = outgoing ? `has many **${other}** records` : `belongs to one **${other}**`;
        break;
      case "manyToOne":
        phrase = outgoing ? `belongs to one **${other}**` : `has many **${other}** records`;
        break;
      case "manyToMany":
        phrase = `is linked to many **${other}** records`;
        break;
      default:
        phrase = `has one **${other}**`;
    }
    if (seen.has(phrase)) continue;
    seen.add(phrase);
    lines.push(`- A ${ctx.windowOf(entity.name).toLowerCase()} ${phrase}.`);
  }
  return lines.join("\n");
}

function gridColumns(ctx: Ctx, entity: Entity): string {
  const layout = ctx.dictionary.get(entity.name);
  const columns = (layout?.fields ?? []).filter((field) => field.inGrid).map((field) => field.label);
  return columns.length > 0 ? columns.join(", ") : "the record's main fields";
}

function requiredLabels(ctx: Ctx, entity: Entity): string[] {
  const layout = ctx.dictionary.get(entity.name);
  const primaryKey = entity.primaryKey || "id";
  return entity.attributes
    .filter((attribute) => attribute.required && attribute.name !== primaryKey)
    .filter((attribute) => layout?.fields.find((f) => f.column === attribute.name)?.onForm !== false)
    .map((attribute) => fieldLabel(ctx, entity.name, attribute.name));
}

function entityPage(ctx: Ctx, entity: Entity, position: number, isReference: boolean): string {
  const window = ctx.windowOf(entity.name);
  const shots = ctx.site.shots;
  const required = requiredLabels(ctx, entity);
  const isLine = Boolean(entity.parentEntity);
  const where = isLine
    ? `Lines are added from the parent: open a **${ctx.windowOf(entity.parentEntity as string)}** and choose the **${window}** tab.`
    : `Open **${window}** from the menu${isReference ? " (under Reference Data)" : ""} or from its card on the dashboard.`;

  const listShot = img(shots, SHOT.entityList(entity.name), `The ${window} list`);
  const newShot = img(shots, SHOT.entityNew(entity.name), `The ${window} form`);

  const parts: string[] = [
    frontMatter({
      title: window,
      sidebar_label: window,
      sidebar_position: position,
      description: firstSentence(entity.description) || `How to use ${window}.`,
    }),
    `# ${window}\n`,
    entity.description ? `${entity.description.trim()}\n` : "",
    "## Finding records\n",
    `${where}\n`,
    listShot,
    `The list shows ${gridColumns(ctx, entity)}, with the most recently changed record first. The **Help** button beside the title opens this window's help text.\n`,
    "- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.\n- **Sort**: click a column heading; click again to reverse.\n- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.\n- **Export**: **CSV** downloads the rows you are looking at.\n- **Open a record**: click a row. The line under the title, \"Showing 1 to n of N entries\", tells you how many rows match.\n",
  ];

  if (!isLine) {
    parts.push(
      "## Creating a record\n",
      `Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.\n`,
      newShot,
      "1. Fill in the fields described under [Fields](#fields).\n" +
        (required.length > 0
          ? `2. These are required and must be completed before the record can be saved: ${required.map((label) => `**${label}**`).join(", ")}.\n`
          : "2. No field is mandatory; fill in what you know.\n") +
        "3. For a dropdown that points at another window, pick the matching record; if the record you need does not exist yet, create it in its own window first. A dropdown may narrow to what you have already chosen, for example the states of the chosen country.\n4. Choose **Create** (or **Save** in the toolbar). You return to the record, and it appears at the top of the list. If something is wrong the form says which field and why, and nothing is saved.\n"
    );
  } else {
    parts.push(
      "## Adding a line\n",
      `Open the parent record, choose the **${window}** tab and use **New**. The line is tied to its parent automatically.\n`,
      newShot
    );
  }

  parts.push(
    "## Reading, changing and deleting a record\n",
    "Click a row to open the record. Above the fields are the arrows that step through the list (\"1 of 5\"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.\n\n- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.\n- **Copy Record** starts a new record from this one.\n- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.\n\nEvery change is also written to the [Audit Log](/administration/#audit-log).\n",
    "## Fields\n",
    `${attributeRows(ctx, entity)}\n`,
    relationshipsSection(ctx, entity),
    "",
    lifecycleSection(ctx, entity),
    "",
    rulesSection(ctx, entity),
    "",
    accessSection(ctx, entity)
  );
  return parts.filter((part) => part !== undefined).join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

/* ------------------------------------------------------------ the home */

function homePage(ctx: Ctx): string {
  const { site, model } = ctx;
  const business = model.entities.filter((entity) => categoryOf(model, entity.name) !== REFERENCE_DATA);
  const reference = model.entities.length - business.length;
  const categories = model.categories.filter((category) => category.entities.length > 0);

  const capabilityBlock =
    site.capabilities && site.capabilities.length > 0
      ? `## What the business can do with it

${site.capabilities
  .map((capability) => {
    const windows = capability.entities
      .filter((name) => ctx.dictionary.has(name))
      .map((name) => ctx.windowOf(name));
    const processes = capability.processes.map(humanize);
    return `- **${humanize(capability.name)}**${windows.length ? ` — ${windows.join(", ")}` : ""}${processes.length ? `. Processes: ${processes.join(", ")}` : ""}`;
  })
  .join("\n")}
`
      : "";

  const domainBlock = site.domainName
    ? `## The domain it serves

**${site.domainName}**${
        site.domainCapabilities?.length
          ? ` covers ${site.domainCapabilities.map(humanize).join(", ")}.`
          : "."
      } ${site.description}\n`
    : `## The domain it serves\n\n${site.description}\n`;

  return `${frontMatter({
    title: site.title,
    sidebar_label: "Home",
    sidebar_position: 1,
    slug: "/",
    description: site.description,
  })}# ${site.title}

${site.description}

${img(site.shots, SHOT.dashboard, `The ${site.title} dashboard`)}
${domainBlock}
${capabilityBlock}
## The main records

${keyRecords(ctx)}

${processBlock(ctx)}## What is inside

${site.title} holds **${business.length} business entities**${reference ? ` and **${reference} lists of values**` : ""}, organised into ${categories.length} categories:

${categories
  .map((category) => {
    const names = category.entities.map((name) => ctx.windowOf(name));
    return `- **${category.name}** (${names.length}): ${names.slice(0, 12).join(", ")}${names.length > 12 ? ", …" : ""}`;
  })
  .join("\n")}

It carries ${model.workflows.length} record lifecycles, ${model.rules.length} business rules and ${model.sagas.length} automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
`;
}

/** The records most connected to the rest, with one sentence each. */
function keyRecords(ctx: Ctx): string {
  const degree = new Map<string, number>();
  for (const relationship of ctx.model.relationships) {
    for (const name of [relationship.sourceEntity, relationship.targetEntity]) {
      degree.set(name, (degree.get(name) ?? 0) + 1);
    }
  }
  const candidates = ctx.model.entities
    .filter((entity) => categoryOf(ctx.model, entity.name) !== REFERENCE_DATA && !entity.parentEntity)
    .sort((a, b) => (degree.get(b.name) ?? 0) - (degree.get(a.name) ?? 0))
    .slice(0, 12);
  if (candidates.length === 0) return "";
  return `| Record | What it is |\n| --- | --- |\n${candidates
    .map(
      (entity) =>
        `| [${ctx.windowOf(entity.name)}](${entityPath(ctx, entity.name)}) | ${cell(firstSentence(entity.description))} |`
    )
    .join("\n")}\n`;
}

/** The automated processes, as the business would describe them. */
function processBlock(ctx: Ctx): string {
  const sagas = ctx.model.sagas.filter((saga) => saga.description);
  if (sagas.length === 0) return "";
  return `## What happens automatically

${sagas
  .slice(0, 8)
  .map((saga) => `- **${humanize(saga.name)}**: ${saga.description}`)
  .join("\n")}

The full list is under [Processes](/administration/processes/).

`;
}

function gettingStarted(ctx: Ctx): string {
  const { site } = ctx;
  return `${frontMatter({ title: "Getting started", sidebar_position: 2, description: "Sign in, find your way around, and learn how lists and forms work." })}# Getting started

## Signing in

Open the application in your browser and sign in with your email and password. A fresh installation has one administrator: **${site.adminEmail ?? "admin@admin.com"}** with the password **${site.adminPassword ?? "admin"}**. Change it from User Administration straight away.

${img(site.shots, SHOT.login, "The sign-in page")}
## The dashboard

After signing in you land on the dashboard. It shows a card for every window you may open, grouped by category, and an **Application Dictionary** section with the administrator windows if your role may use them. You only ever see what your role allows.

${img(site.shots, SHOT.dashboard, "The dashboard")}
## The menu and themes

The menu on the left lists the same windows and can be collapsed with the button at its top. The theme selector in the header switches between seven colour themes; each also has a dark mode.

${img(site.shots, SHOT.themes, "The theme selector")}
## How every window works

All business windows share one pattern:

1. **List.** Rows, newest change first. Search, sort, filter, refresh.
2. **Record.** Click a row to read it. **Edit** changes it, **Delete** (inside edit) removes it.
3. **New.** Opens a form on its own page; **Create** saves it.
4. **Tabs.** A record that has lines or children shows them on tabs beneath its fields.
5. **Lifecycle bar.** A record that moves through states shows the moves it may make now.

Dropdowns that point at another window offer that window's records, labelled by their main identifying fields. Some are narrowed by what you have already entered, for example the states of the country you chose.

## Where to go next

Start with the entity you will use most, or read [Administration](/administration/) if you set up access and rules.
`;
}

/* ------------------------------------------------------ administration */

function adminIndex(ctx: Ctx): string {
  const { site } = ctx;
  const rows = ADMIN_PAGES.map(
    (page) => `| **${page.label}** | \`${page.route}\` | ${adminPurpose(page.id)} |`
  ).join("\n");
  const shots = ADMIN_PAGES.map((page) => {
    const picture = img(site.shots, SHOT.admin(page.id), `${page.label} in ${site.title}`);
    return picture ? `### ${page.label}\n\n${adminPurpose(page.id)} See [the Application Dictionary manual](pathname:///application-dictionary/${page.id}/) for every control.\n\n${picture}` : "";
  })
    .filter(Boolean)
    .join("\n");

  return `${frontMatter({ title: "Administration", sidebar_position: 1, description: "The administrator windows and how they apply to this application." })}# Administration

Everything an administrator needs is on the dashboard's **Application Dictionary** section. These windows are the same in every application; what differs is the data in them. This application's own lifecycles, rules, processes, access and reports are documented in the pages that follow.

| Window | Address | What it is for |
| --- | --- | --- |
${rows}

${shots}
`;
}

function adminPurpose(id: string): string {
  switch (id) {
    case "rules":
      return "Create, edit and switch off the business rules that run when records are saved.";
    case "workflow-definitions":
      return "Design the multi-step processes the application runs.";
    case "workflows":
      return "Watch processes as they run and read what each step did.";
    case "automations":
      return "Build when-this-then-that chains without writing a process.";
    case "audit":
      return "Read the tamper-evident trail of every change and verify its chain.";
    case "tables":
      return "Add or change a business table and its columns.";
    case "windows":
      return "Arrange the windows, tabs and fields users see.";
    case "categories":
      return "Group windows on the dashboard and menu.";
    case "elements":
      return "Reusable field names, labels and help text shared across tables.";
    case "references":
      return "Maintain the field types and the lists and lookups behind the dropdowns.";
    case "fields":
      return "Arrange a window's fields into groups and columns.";
    case "reports":
      return "Run the analytical reports this application ships with.";
    case "users":
      return "Create accounts, reset passwords and grant roles.";
    case "roles":
      return "Define roles and decide which windows each may open and change.";
    default:
      return "Application-wide settings.";
  }
}

function lifecyclesPage(ctx: Ctx): string {
  const { model, site } = ctx;
  const blocks = model.workflows.map((machine) => {
    const window = ctx.windowOf(machine.entity);
    const diagram = machine.transitions
      .map((t) => `  ${mid(t.from)} --> ${mid(t.to)}: ${(t.trigger ?? "move").replace(/[:;]/g, " ")}`)
      .join("\n");
    const roleRules = model.rbac.transitions.filter((t) => t.entity === machine.entity);
    return `## ${window}: ${humanize(machine.name)}

States: ${machine.states.map((state) => `**${stateLabel(state.name)}**`).join(", ")}. A new record starts as **${stateLabel(machine.initial ?? "")}**${
      machine.terminal.length ? `; **${machine.terminal.map(stateLabel).join("**, **")}** ends the lifecycle` : ""
    }.

\`\`\`mermaid
stateDiagram-v2
  [*] --> ${mid(machine.initial ?? machine.states[0]?.name ?? "START")}
${diagram}
\`\`\`

${
  roleRules.length
    ? `Role restrictions: ${roleRules.map((t) => `${t.edges.map((edge) => `${stateLabel(edge.from)} → ${stateLabel(edge.to)}`).join(", ") || humanize(t.transition)} by ${t.roles.map(humanize).join(", ")}`).join("; ")}.\n`
    : "Any role that may change the record may make any move the diagram draws.\n"
}
${img(site.shots, SHOT.entityRecord(machine.entity), `${window} lifecycle bar`)}
See [${window}](${entityPath(ctx, machine.entity)}) for the record itself.
`;
  });
  return `${frontMatter({ title: "Record lifecycles", sidebar_position: 2, description: "Every state a record can be in and every move between states." })}# Record lifecycles

A lifecycle is the set of states a record can be in and the moves between them. The application enforces it on every write, through the screen and through the API: a move the diagram does not draw is refused for everyone, administrators included. Role restrictions narrow who may make a particular move. This application has **${model.workflows.length}** lifecycles.

${img(site.shots, SHOT.admin("workflows"), "The workflow monitor")}
${blocks.join("\n") || "This application declares no record lifecycles."}
`;
}

function processesPage(ctx: Ctx): string {
  const { model, site } = ctx;
  const blocks = model.sagas.map((saga) => {
    const window = ctx.windowOf(saga.entity);
    const steps = saga.steps
      .map((step, index) => `${index + 1}. **${humanize(step.label)}** — ${stepSentence(ctx, step)}`)
      .join("\n");
    const chart = saga.steps.map((step, index) => `  S${index}["${humanize(step.label).replace(/["\n]/g, "'")}"]`).join("\n");
    const links = saga.steps.slice(1).map((_s, index) => `  S${index} --> S${index + 1}`).join("\n");
    return `## ${humanize(saga.name)} {#${kebabCase(saga.name)}}

${saga.description ?? ""}

Runs when a **${window}** is ${operationWord(saga.operation)}${saga.trigger === "rule" ? ", started by a business rule" : " automatically"}.

\`\`\`mermaid
flowchart TD
${chart}
${links}
\`\`\`

${steps}

${img(site.shots, SHOT.saga(saga.name), `The ${humanize(saga.name)} process in the Workflow Designer`)}`;
  });
  return `${frontMatter({ title: "Processes", sidebar_position: 3, description: "The automated multi-step processes this application runs." })}# Processes

A process is a sequence of steps the application runs for you: create a task, update a record, call a service. A business rule usually starts it; you can also run one by hand from the Workflow Designer. Every run is logged step by step in the Workflow Monitor. This application has **${model.sagas.length}** processes.

${img(site.shots, SHOT.admin("workflow-definitions"), "The Workflow Designer")}
${blocks.join("\n") || "This application declares no automated processes."}
`;
}

function operationWord(operation: string): string {
  switch (operation.toUpperCase()) {
    case "CREATE":
      return "created";
    case "UPDATE":
      return "changed";
    case "DELETE":
      return "deleted";
    default:
      return "saved";
  }
}

function stepSentence(ctx: Ctx, step: { nodeType: string; properties: Record<string, string> }): string {
  const target = step.properties.entity
    ? ctx.windowOf(ctx.declared.get(step.properties.entity.replace(/^bus_/, "").replace(/_/g, "")) ?? step.properties.entity)
    : "";
  switch (step.nodeType) {
    case "CreateEntity":
      return `creates a **${target}** record.`;
    case "UpdateEntity":
      return `updates a **${target}** record.`;
    case "DeleteEntity":
      return `deletes a **${target}** record.`;
    case "Notify":
      return "sends a notification.";
    default:
      return `${humanize(step.nodeType).toLowerCase()}.`;
  }
}

function rulesIndexPage(ctx: Ctx): string {
  const { model } = ctx;
  const byEntity = new Map<string, typeof model.rules>();
  for (const rule of model.rules) {
    byEntity.set(rule.entity, [...(byEntity.get(rule.entity) ?? []), rule]);
  }
  const rows = [...byEntity.entries()]
    .map(([entity, rules]) => `| [${ctx.windowOf(entity)}](/administration/rules/${kebabCase(entity)}/) | ${rules.length} |`)
    .join("\n");
  return `${frontMatter({ title: "Business rules", sidebar_position: 1, description: "Every business rule, in plain words." })}# Business rules

A business rule runs when a record is saved. It can refuse the save with a message, fill in a field, create or update another record, or start a process. Rules are edited in **Business Rules** (\`/admin/rules\`); each page below explains the rules of one window with the screen where the rule is edited.

${img(ctx.site.shots, SHOT.admin("rules"), "The Business Rules window")}
**How to read a rule.** *When* is the condition over the record's fields, written with the labels you see on screen. *Then* is what the rule does. A rule with no condition runs on every save. Rules run in the order shown; a rule that refuses the save stops the save and nothing it would have changed is kept.

| Window | Rules |
| --- | --- |
${rows || "| — | 0 |"}
`;
}

function rulesEntityPage(ctx: Ctx, entity: string, position: number): string {
  const rules = ctx.model.rules.filter((rule) => rule.entity === entity);
  const window = ctx.windowOf(entity);
  const blocks = rules.map((rule) => {
    const lines = ruleLines(ctx, entity, rule.jdmContent);
    const body = lines
      .map((line) => {
        const action = ACTION_WORDS[line.action] ?? humanize(line.action || "does something");
        return `- **When** ${line.when}: **${action}**${line.message ? ` — “${line.message}”` : ""}${line.detail.length ? ` (${line.detail.join("; ")})` : ""}.`;
      })
      .join("\n");
    return `## ${humanize(rule.name)}

Runs ${eventPhrase(rule.event, window)}; order ${rule.priority}. In **Business Rules** it is listed as \`${rule.name}\`.

${body || "This rule is built in the decision-table editor; open it in Business Rules to read its table."}

${img(ctx.site.shots, SHOT.rule(rule.name), `The ${humanize(rule.name)} rule in the editor`)}
**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.
`;
  });
  return `${frontMatter({ title: window, sidebar_position: position, description: `The business rules that run on ${window}.` })}# Rules on ${window}

${blocks.join("\n")}
`;
}

function accessPage(ctx: Ctx): string {
  const { model } = ctx;
  const roleNames = new Set<string>();
  for (const rule of [...model.rbac.operations, ...model.rbac.transitions]) {
    for (const role of rule.roles) roleNames.add(role);
  }
  const roles = [...roleNames].sort();
  return `${frontMatter({ title: "Roles and access", sidebar_position: 4, description: "Who may open, create, change and move records." })}# Roles and access

Access is decided in three steps, and a person needs to pass all three:

1. **Window access.** A role is granted windows in **Role Administration**. A window a role does not hold is absent from its menu and refused if opened by address.
2. **Action restrictions.** The model can restrict create, change or delete on an entity to named roles. With no restriction an action is open to anyone who holds the window.
3. **Lifecycle moves.** The lifecycle decides which moves exist; role rules decide who may make them. The administrator is bound by the first, not the second.

The **Administrator** role holds every window and bypasses restrictions on actions.

${roles.length ? `## Roles this application declares\n\n${roles.map((role) => `- **${humanize(role)}** — a demonstration account with this role is created when the application is seeded (email \`${role.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@…\`; sign in with the seeded password).`).join("\n")}\n` : "This application declares no roles beyond the Administrator; create roles in Role Administration and grant them windows.\n"}
${img(ctx.site.shots, SHOT.admin("roles"), "Role Administration")}
${img(ctx.site.shots, SHOT.admin("users"), "User Administration")}
## Restrictions the model declares

${
  model.rbac.operations.length + model.rbac.transitions.length === 0
    ? "None."
    : [
        ...model.rbac.operations.map(
          (rule) => `- ${humanize(rule.operation)} **${ctx.windowOf(rule.entity)}**: ${rule.roles.map(humanize).join(", ")}`
        ),
        ...model.rbac.transitions.map(
          (rule) =>
            `- Move **${ctx.windowOf(rule.entity)}** ${rule.edges.map((edge) => `${stateLabel(edge.from)} → ${stateLabel(edge.to)}`).join(", ") || humanize(rule.transition)}: ${rule.roles.map(humanize).join(", ")}`
        ),
      ].join("\n")
}
`;
}

function reportsPage(ctx: Ctx): string {
  const { model } = ctx;
  return `${frontMatter({ title: "Reports", sidebar_position: 5, description: "The analytical reports this application ships with." })}# Reports

Reports answer a question with a table and sometimes a chart. Open **Reports** from the dashboard, choose a report and read the result. Each report is a single read-only query; none can change data.

${img(ctx.site.shots, SHOT.admin("reports"), "The Reports window")}
${
  model.reports.length
    ? model.reports.map((report) => `- **${report.title}**${report.entity ? ` — about ${ctx.windowOf(report.entity)}` : ""}`).join("\n")
    : "This application ships no pre-written reports. Administrators can add one in the Application Dictionary."
}
`;
}

function dictionaryPage(ctx: Ctx): string {
  const { model, site } = ctx;
  const columns = model.entities.reduce((sum, entity) => sum + entity.attributes.length, 0);
  return `${frontMatter({ title: "Application Dictionary", sidebar_position: 6, description: "How this application's screens are described in the Application Dictionary." })}# Application Dictionary

Every screen in ${site.title} is read from the **Application Dictionary** at run time: the windows you open, the tabs and fields on them, their labels and help text, which dropdown a field uses, and who may see it. An administrator can change the dictionary and the change appears on the next request, with no rebuild.

This application's dictionary holds **${model.entities.length} tables**, **${columns} columns**, and one window for each of the ${model.entities.filter((entity) => !entity.parentEntity).length} entities that are not lines of another.

${img(site.shots, SHOT.admin("tables"), "Table and Column")}
${img(site.shots, SHOT.admin("windows"), "Window, Tab and Field")}
The full guide, with every window and a how-to for each task, is the shared [Application Dictionary manual](pathname:///application-dictionary/).
`;
}

/* ---------------------------------------------------------- the config */

function docusaurusConfig(site: SiteContext): string {
  return `// Generated by scripts/build-website.ts — edit the generator, not this file.
// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: ${JSON.stringify(site.title)},
  tagline: ${JSON.stringify(site.description)},
  url: "https://businessappwithai.github.io",
  baseUrl: "/${site.domain}/",
  onBrokenLinks: "warn",
  markdown: {
    format: "detect",
    mermaid: true,
    hooks: { onBrokenMarkdownLinks: "warn" },
  },
  themes: ["@docusaurus/theme-mermaid"],
  presets: [
    [
      "classic",
      {
        docs: { routeBasePath: "/", sidebarPath: "./sidebars.js" },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: ${JSON.stringify(site.title)},
      items: [
        { type: "docSidebar", sidebarId: "manual", position: "left", label: "Manual" },
        { href: "pathname:///application-dictionary/", label: "Application Dictionary", position: "right" },
      ],
    },
    footer: { style: "dark", copyright: "${site.title} — generated from its CEDM model." },
    colorMode: { respectPrefersColorScheme: true },
  },
};

module.exports = config;
`;
}

function packageJson(site: SiteContext): string {
  return `${JSON.stringify(
    {
      name: `@appwithai/docs-${site.domain}`,
      version: "1.0.0",
      private: true,
      scripts: {
        start: "docusaurus start",
        build: "docusaurus build",
        serve: "docusaurus serve",
      },
      dependencies: {
        "@docusaurus/core": "3.9.2",
        "@docusaurus/preset-classic": "3.9.2",
        "@docusaurus/theme-mermaid": "3.9.2",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      // Docusaurus 3.9 validates webpack's ProgressPlugin options against the
      // schema of the webpack it was released with; a newer webpack rejects them
      // and the build dies before compiling anything.
      overrides: { webpack: "5.99.9" },
      resolutions: { webpack: "5.99.9" },
      engines: { node: ">=20" },
    },
    null,
    2
  )}\n`;
}

const SIDEBARS = `// Generated — the sidebar follows the folders under docs/.
module.exports = { manual: [{ type: "autogenerated", dirName: "." }] };
`;

const CUSTOM_CSS = `:root { --ifm-color-primary: #2563eb; --ifm-color-primary-dark: #1d4ed8; --ifm-color-primary-darker: #1e40af; --ifm-color-primary-darkest: #1e3a8a; --ifm-color-primary-light: #3b82f6; --ifm-color-primary-lighter: #60a5fa; --ifm-color-primary-lightest: #93c5fd; }
.markdown img { border: 1px solid var(--ifm-color-emphasis-300); border-radius: 6px; margin: 0.5rem 0 1rem; }
table { display: table; width: 100%; }
`;

function categoryFile(label: string, position: number): string {
  return `${JSON.stringify({ label, position }, null, 2)}\n`;
}

/* ---------------------------------------------------------------- render */

export function renderSite(model: ParsedModel, site: SiteContext): SiteFiles {
  const ctx = buildCtx(model, site);
  const files: SiteFiles = new Map();

  files.set("package.json", packageJson(site));
  files.set("docusaurus.config.js", docusaurusConfig(site));
  files.set("sidebars.js", SIDEBARS);
  files.set("src/css/custom.css", CUSTOM_CSS);
  files.set("docs/intro.md", homePage(ctx));
  files.set("docs/getting-started.md", gettingStarted(ctx));

  // Entities, one folder per category; lists of values under reference-data.
  const grouped = new Map<string, Entity[]>();
  for (const entity of model.entities) {
    const category = categoryOf(model, entity.name);
    grouped.set(category, [...(grouped.get(category) ?? []), entity]);
  }
  let categoryPosition = 3;
  const business = [...grouped.entries()].filter(([name]) => name !== REFERENCE_DATA);
  files.set("docs/entities/_category_.json", categoryFile("Entities", categoryPosition++));
  business.forEach(([name, entities], index) => {
    const folder = `docs/entities/${kebabCase(name)}`;
    files.set(`${folder}/_category_.json`, categoryFile(name, index + 1));
    const sorted = [...entities].sort((a, b) => ctx.windowOf(a.name).localeCompare(ctx.windowOf(b.name)));
    sorted.forEach((entity, position) => {
      files.set(`${folder}/${kebabCase(entity.name)}.md`, entityPage(ctx, entity, position + 1, false));
    });
  });
  const reference = grouped.get(REFERENCE_DATA) ?? [];
  if (reference.length > 0) {
    files.set("docs/reference-data/_category_.json", categoryFile("Reference data", categoryPosition++));
    files.set(
      "docs/reference-data/index.md",
      `${frontMatter({ title: "About reference data", sidebar_position: 0 })}# Reference data

Reference data are the lists of values behind the dropdowns — statuses, types, categories, countries, currencies and units. A value you add here is offered everywhere the list is used. Each page below explains one list.
`
    );
    reference
      .sort((a, b) => ctx.windowOf(a.name).localeCompare(ctx.windowOf(b.name)))
      .forEach((entity, position) => {
        const folder = "docs/reference-data";
        files.set(`${folder}/${kebabCase(entity.name)}.md`, entityPage(ctx, entity, position + 1, true));
      });
  }

  // Administration.
  files.set("docs/administration/_category_.json", categoryFile("Administration", categoryPosition++));
  files.set("docs/administration/index.md", adminIndex(ctx));
  files.set("docs/administration/lifecycles.md", lifecyclesPage(ctx));
  files.set("docs/administration/processes/index.md", processesPage(ctx));
  files.set("docs/administration/processes/_category_.json", categoryFile("Processes", 3));
  files.set("docs/administration/rules/_category_.json", categoryFile("Business rules", 4));
  files.set("docs/administration/rules/index.md", rulesIndexPage(ctx));
  const ruleEntities = [...new Set(model.rules.map((rule) => rule.entity))].sort((a, b) =>
    ctx.windowOf(a).localeCompare(ctx.windowOf(b))
  );
  ruleEntities.forEach((entity, index) => {
    files.set(`docs/administration/rules/${kebabCase(entity)}.md`, rulesEntityPage(ctx, entity, index + 2));
  });
  files.set("docs/administration/access.md", accessPage(ctx));
  files.set("docs/administration/reports.md", reportsPage(ctx));
  files.set("docs/administration/dictionary.md", dictionaryPage(ctx));

  return files;
}
