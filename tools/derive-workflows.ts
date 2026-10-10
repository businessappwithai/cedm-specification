#!/usr/bin/env bun
/**
 * Write each entity's workflows into its file, from its lifecycle.
 *
 * specification/business-logic.yaml: an entity's `workflows` start when a record
 * meets a condition. Where an entity has a lifecycle, the moves into the states
 * that need a person — a request awaiting a decision, work that has stopped, a
 * record cancelled or rejected, a document completed — raise a Task for that
 * person, the way an SAP or Oracle workflow inbox does. The condition is
 * edge-triggered (`status != _previous_status`), so a task is raised when the
 * record *enters* the state and not on every edit made while it is there.
 *
 * An entity that already states `workflows` is never touched, and `Task` itself
 * is skipped: a task that raised a task on being blocked would never stop.
 * A re-run changes nothing; `--check` exits 1 when a file would change.
 *
 *     bun tools/derive-workflows.ts [--check]
 */

import "./lib/cli";
import { readFileSync, writeFileSync } from "node:fs";
import { cap, kindClass, lowerWords } from "./lib/dictionary";
import { entityPaths, idPrefix, snake } from "./lib/library";
import { topKey } from "./lib/lines";
import { str } from "./lib/text";
import { parseYaml, type Spec } from "./lib/yaml";

const SKIP = new Set(["Task", "Workflow", "Approval"]);
const APPROVAL = ["SUBMITTED", "PENDING_APPROVAL", "UNDER_REVIEW", "REQUESTED", "PROPOSED"];
const EXCEPTION = [
  "BLOCKED",
  "ON_HOLD",
  "HELD",
  "FAILED",
  "EXCEPTION",
  "QUARANTINED",
  "OVERDUE",
  "BREACHED",
];
const FOLLOW_UP = ["REJECTED", "CANCELLED", "VOID", "REVERSED", "DENIED"];
const COMPLETION = ["COMPLETED", "FULFILLED", "DELIVERED", "POSTED"];
const LABEL_ATTRS = ["name", "title", "fullName", "displayName", "code", "number", "reference"];

interface Step {
  id: string;
  type: string;
  label: string;
  properties: { entity: string; as: string; fields: Record<string, string> };
}
interface Workflow {
  name: string;
  title: string;
  description: string;
  when: string;
  steps: Step[];
}

/** The column a task names the record by, if it has one. */
function labelColumn(entity: Spec): string | null {
  const names: string[] = (entity.attributes ?? [])
    .filter((a: Spec) => ["string", "text"].includes(str(a.type)))
    .map((a: Spec) => a.name);
  for (const wanted of LABEL_ATTRS) if (names.includes(wanted)) return snake(wanted);
  const numbered = names.find((n) => n.endsWith("Number"));
  return numbered ? snake(numbered) : null;
}

function condition(column: string, states: string[]): string {
  if (states.length > 1) {
    return `(${states.map((s) => `${column} == "${s}"`).join(" or ")}) and ${column} != _previous_${column}`;
  }
  return `${column} == "${states[0]}" and ${column} != _previous_${column}`;
}

function taskStep(
  entity: string,
  kind: string,
  taskType: string,
  priority: string,
  heading: string,
  why: string,
  label: string | null,
  column: string
): Step {
  const words = lowerWords(entity);
  const ref = label ? `{{${label}}}` : "{{id}}";
  return {
    id: "S1",
    type: "CreateEntity",
    label: `Raise a task: ${heading.toLowerCase()}`,
    properties: {
      entity: "Task",
      as: "taskId",
      fields: {
        code: `${idPrefix(entity)}-${kind}-{{id}}`,
        name: `${heading} ${words} ${ref}`,
        description: `${cap(words)} ${ref} is now {{${column}}}. ${why}`,
        task_type: taskType,
        status: "CREATED",
        priority,
      },
    },
  };
}

export function derive(entity: Spec): Workflow[] {
  const life = entity.lifecycle;
  if (!life || typeof life !== "object" || SKIP.has(entity.name)) return [];
  const column = snake(life.attribute || "status");
  const states: string[] = (life.states ?? []).map(str);
  const label = labelColumn(entity);
  const name: string = entity.name;
  const words = lowerWords(name);
  const out: Workflow[] = [];
  const said = (hit: string[]) => hit.map((s) => s.toLowerCase().replaceAll("_", " ")).join(" or ");
  const add = (workflow: string, title: string, hit: string[], step: Step, description: string) => {
    if (hit.length)
      out.push({ name: workflow, title, description, when: condition(column, hit), steps: [step] });
  };

  let hit = APPROVAL.filter((s) => states.includes(s));
  add(
    "ApprovalRequested",
    `Ask for a decision when a ${words} is put forward`,
    hit,
    taskStep(
      name,
      "APPROVAL",
      "APPROVAL",
      "NORMAL",
      "Decide on",
      "Approve it, return it for change or reject it; the move you make is recorded on the record.",
      label,
      column
    ),
    `When a ${words} is ${said(hit)}, a task asks someone to decide on it.`
  );
  hit = EXCEPTION.filter((s) => states.includes(s));
  add(
    "ExceptionRaised",
    `Raise a task when a ${words} is stopped`,
    hit,
    taskStep(
      name,
      "EXCEPTION",
      "USER",
      "HIGH",
      "Resolve",
      "Find out why it stopped and move it on or close it.",
      label,
      column
    ),
    `When a ${words} is ${said(hit)}, a high-priority task asks someone to resolve it.`
  );
  hit = FOLLOW_UP.filter((s) => states.includes(s));
  add(
    "FollowUpRequired",
    `Follow up when a ${words} is ended`,
    hit,
    taskStep(
      name,
      "FOLLOW-UP",
      "USER",
      "NORMAL",
      "Follow up on",
      "Check the records that depended on it and tell the people affected.",
      label,
      column
    ),
    `When a ${words} is ${said(hit)}, a task asks someone to settle what depended on it.`
  );
  if (["transaction", "line"].includes(kindClass(entity.kind))) {
    hit = COMPLETION.filter((s) => states.includes(s));
    add(
      "CompletionConfirmed",
      `Confirm when a ${words} is done`,
      hit,
      taskStep(
        name,
        "COMPLETED",
        "USER",
        "LOW",
        "Confirm",
        "Check the outcome is what was agreed and close any open items.",
        label,
        column
      ),
      `When a ${words} is ${said(hit)}, a task asks someone to confirm the outcome.`
    );
  }
  return out;
}

const q = (value: string) => JSON.stringify(value);

function render(workflows: Workflow[]): string[] {
  const lines = ["  workflows:"];
  for (const w of workflows) {
    lines.push(
      `    - name: ${w.name}`,
      `      title: ${q(w.title)}`,
      `      description: ${q(w.description)}`,
      `      when: ${q(w.when)}`,
      "      steps:"
    );
    for (const s of w.steps) {
      lines.push(
        `        - id: ${s.id}`,
        `          type: ${s.type}`,
        `          label: ${q(s.label)}`,
        "          properties:",
        `            entity: ${s.properties.entity}`,
        `            as: ${s.properties.as}`,
        "            fields:"
      );
      for (const [k, v] of Object.entries(s.properties.fields))
        lines.push(`              ${k}: ${q(v)}`);
    }
  }
  return lines;
}

export function deriveText(text: string): string {
  const entity = parseYaml(text).entity;
  if ("workflows" in entity) return text;
  const workflows = derive(entity);
  if (!workflows.length) return text;
  const lines = text.split("\n");
  const at = topKey(lines, "help");
  if (at === undefined) throw new Error(`${entity.name}: no help block to insert workflows before`);
  lines.splice(at, 0, ...render(workflows));
  return lines.join("\n");
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const changed: string[] = [];
  for (const file of entityPaths()) {
    const text = readFileSync(file, "utf-8");
    const out = deriveText(text);
    if (out === text) continue;
    changed.push(file);
    if (check) continue;
    try {
      parseYaml(out); // never write what does not parse
    } catch (error) {
      console.error(
        `${file}: the derived text does not parse, nothing written: ${String(error).split("\n")[0]}`
      );
      process.exit(2);
    }
    writeFileSync(file, out);
  }
  console.log(`${changed.length} entity file(s) ${check ? "need" : "received"} workflows`);
  process.exit(check && changed.length ? 1 : 0);
}
