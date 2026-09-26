/**
 * The Mermaid view of a YAML model document.
 *
 * The YAML document is the model; this is how it is drawn. The output is an
 * EML document — every diagram Mermaid renders, every annotation a `%%` line —
 * so the existing viewers, the ERD designer and the checker all read it as they
 * always have. Nothing generates from it.
 *
 * Every emitted line carries the document path it came from. That is what lets
 * a diagnostic the checker raises against the view be reported against the
 * YAML the author actually edits.
 *
 * Layout is chosen so the view reads back to the same document:
 *
 * - Directives that apply to the whole model (`%%hook`, `%%rbac`, `%%report`,
 *   `%%entity`, `%%field`, `%%index`) sit before the first section, never inside
 *   one, where they would read as part of that section's diagram.
 * - Rules come before workflows, and sagas last: a saga's block runs to the next
 *   `%%workflow` line, so anything drawn after it would be read as its nodes.
 * - A saga states its trigger and operation on its `%%workflow` line, the
 *   language's own spelling, so no reader has to fall back on a default.
 * - A state machine's lines are interleaved so its states first appear in the
 *   order the document lists them — which is the order EML compiles states in.
 */

import { RELATIONSHIP_GLYPHS, type RuleNodeShape } from "../model/records";
import type {
  AttributeDocument,
  EntityDocument,
  ModelDocument,
  StateMachineDocument,
} from "./document";

/** A path into the document: keys and array indexes. */
export type DocumentPath = Array<string | number>;

export interface RenderedView {
  text: string;
  /** `lineMap[i]` is the document path line `i + 1` of `text` was rendered from. */
  lineMap: DocumentPath[];
}

const BANNER = `%% ${"=".repeat(74)}`;

const SHAPES: Record<RuleNodeShape, [string, string]> = {
  stadium: ["([", "])"],
  diamond: ["{", "}"],
  rect: ["[", "]"],
  circle: ["((", "))"],
  round: ["(", ")"],
};

class ViewWriter {
  readonly lines: string[] = [];
  readonly lineMap: DocumentPath[] = [];

  add(line: string, path: DocumentPath): void {
    this.lines.push(line);
    this.lineMap.push(path);
  }

  blank(): void {
    if (this.lines.length && this.lines[this.lines.length - 1] !== "") this.add("", []);
  }
}

function attributeLine(attribute: AttributeDocument): string {
  const flags = [
    attribute.pk ? "PK" : null,
    attribute.fk ? "FK" : null,
    attribute.unique ? "UK" : null,
    attribute.optional ? "OPTIONAL" : null,
  ].filter(Boolean);
  const comment = attribute.comment ? ` "${attribute.comment}"` : "";
  return `    ${attribute.type} ${attribute.name}${flags.length ? ` ${flags.join(" ")}` : ""}${comment}`;
}

function writeEntity(view: ViewWriter, entity: EntityDocument, index: number): void {
  const path: DocumentPath = ["entities", index];
  view.add(`  ${entity.name} {`, path);
  entity.attributes.forEach((attribute, position) => {
    view.add(`  ${attributeLine(attribute)}`, [...path, "attributes", position]);
  });
  view.add("  }", path);
}

function writeAnnotations(view: ViewWriter, document: ModelDocument): void {
  document.entities.forEach((entity, index) => {
    const path: DocumentPath = ["entities", index];
    if (entity.help !== undefined) {
      view.add(`%%entity ${entity.name} help: ${entity.help}`, [...path, "help"]);
    }
    if (entity.icon !== undefined) {
      view.add(`%%entity ${entity.name} icon: ${entity.icon}`, [...path, "icon"]);
    }
    if (entity.parent !== undefined) {
      view.add(`%%entity ${entity.name} parent: ${entity.parent}`, [...path, "parent"]);
    }
    entity.attributes.forEach((attribute, position) => {
      const at: DocumentPath = [...path, "attributes", position];
      if (attribute.enum !== undefined) {
        view.add(`%%field ${entity.name}.${attribute.name} enum: ${attribute.enum}`, [
          ...at,
          "enum",
        ]);
      }
      if (attribute.help !== undefined) {
        view.add(`%%field ${entity.name}.${attribute.name} help: ${attribute.help}`, [
          ...at,
          "help",
        ]);
      }
    });
    (entity.indexes ?? []).forEach((index, position) => {
      view.add(
        `%%index ${entity.name}(${index.columns.join(", ")})${index.unique ? " unique" : ""}`,
        [...path, "indexes", position]
      );
    });
  });
}

function sectionHeader(
  view: ViewWriter,
  path: DocumentPath,
  title: string,
  kind: "rules" | "workflow",
  directive: string
): void {
  view.blank();
  view.add(`%%meta name: ${title}`, [...path, "title"]);
  view.add(`%%meta kind: ${kind}`, path);
  view.add(directive, path);
}

/**
 * Order a state machine's lines so each state first appears where the
 * document lists it.
 *
 * The initial marker, the transitions and the terminal markers are three
 * queues whose internal order is meaning (the compiled transition list, the
 * terminal list); only how they interleave is free. At each step the head that
 * introduces the earliest-listed unseen state goes next, and a head that
 * introduces nothing new goes immediately.
 */
function stateLines(machine: StateMachineDocument, path: DocumentPath) {
  type Line = { text: string; states: string[]; path: DocumentPath };
  const queues: Line[][] = [
    machine.initial !== undefined
      ? [
          {
            text: `[*] --> ${machine.initial}`,
            states: [machine.initial],
            path: [...path, "initial"],
          },
        ]
      : [],
    machine.transitions.map((transition, index) => ({
      text: `${transition.from} --> ${transition.to}${
        transition.trigger !== undefined ? ` : ${transition.trigger}` : ""
      }`,
      states: [transition.from, transition.to],
      path: [...path, "transitions", index],
    })),
    (machine.final ?? []).map((state, index) => ({
      text: `${state} --> [*]`,
      states: [state],
      path: [...path, "final", index],
    })),
  ];

  const rank = new Map(machine.states.map((state, index) => [state, index]));
  const seen = new Set<string>();
  const ordered: Line[] = [];

  while (queues.some((queue) => queue.length)) {
    let best = -1;
    let bestRank = Number.POSITIVE_INFINITY;
    queues.forEach((queue, index) => {
      const head = queue[0];
      if (!head) return;
      const unseen = head.states.filter((state) => !seen.has(state));
      const first = unseen.length
        ? Math.min(...unseen.map((state) => rank.get(state) ?? Number.MAX_SAFE_INTEGER))
        : -1;
      if (first < bestRank) {
        best = index;
        bestRank = first;
      }
    });
    const line = queues[best]!.shift()!;
    for (const state of line.states) seen.add(state);
    ordered.push(line);
  }

  return ordered;
}

/** Render a YAML model document as its EML (Mermaid) view. */
export function renderEmlView(document: ModelDocument): RenderedView {
  const view = new ViewWriter();

  view.add(BANNER, []);
  view.add(`%% ${document.name ?? "Model"}`, document.name !== undefined ? ["name"] : []);
  view.add(`%% Rendered from the YAML model. Edit the YAML; this view is regenerated.`, []);
  view.add(BANNER, []);
  if (document.name !== undefined) view.add(`%%meta name: ${document.name}`, ["name"]);
  view.add("%%meta kind: erd", []);
  if (document.version !== undefined) view.add(`%%meta version: ${document.version}`, ["version"]);
  if (document.description !== undefined) {
    view.add(`%%meta description: ${document.description}`, ["description"]);
  }

  if (document.enums?.length) {
    view.blank();
    document.enums.forEach((declared, index) => {
      view.add(`%%enum ${declared.name}: ${declared.values.join(", ")}`, ["enums", index]);
    });
  }

  if (document.categories?.length) {
    view.blank();
    document.categories.forEach((category, index) => {
      const parts = [`name: ${category.name}`];
      if (category.code !== undefined) parts.push(`code: ${category.code}`);
      if (category.description !== undefined) parts.push(`description: ${category.description}`);
      if (category.icon !== undefined) parts.push(`icon: ${category.icon}`);
      if (category.color !== undefined) parts.push(`color: ${category.color}`);
      if (category.seq !== undefined) parts.push(`seq: ${category.seq}`);
      if (category.default) parts.push("default: true");
      if (category.entities?.length) parts.push(`entities: ${category.entities.join(", ")}`);
      view.add(`%%category ${parts.join("; ")}`, ["categories", index]);
    });
  }

  view.blank();
  view.add("erDiagram", ["entities"]);
  document.entities.forEach((entity, index) => writeEntity(view, entity, index));
  (document.relationships ?? []).forEach((relationship, index) => {
    const operator = `${RELATIONSHIP_GLYPHS[relationship.fromCardinality].left}--${
      RELATIONSHIP_GLYPHS[relationship.toCardinality].right
    }`;
    const label = relationship.label !== undefined ? ` : "${relationship.label}"` : "";
    view.add(`  ${relationship.from} ${operator} ${relationship.to}${label}`, [
      "relationships",
      index,
    ]);
  });

  view.blank();
  writeAnnotations(view, document);

  if (document.hooks?.length) {
    view.blank();
    document.hooks.forEach((hook, index) => {
      const field = hook.field !== undefined ? `[field: ${hook.field}]` : "";
      view.add(`%%hook ${hook.event} ${hook.handler} on ${hook.entity}${field}`, ["hooks", index]);
    });
  }

  if (document.rbac?.length) {
    view.blank();
    document.rbac.forEach((rule, index) => {
      const roles = rule.roles.map((role) => `role:${role}`).join("|");
      view.add(`%%rbac ${roles} on ${rule.entity}.${rule.action}`, ["rbac", index]);
    });
  }

  if (document.reports?.length) {
    view.blank();
    document.reports.forEach((report, index) => {
      const keys = (["title", "entity", "chart", "x", "y", "help"] as const)
        .filter((key) => report[key] !== undefined)
        .map((key) => `${key}: ${report[key]}`);
      const sql = report.sql.replace(/\s*\n\s*/g, " ").trim();
      view.add(`%%report ${report.name}${keys.length ? ` ${keys.join(" ")}` : ""} sql: ${sql}`, [
        "reports",
        index,
      ]);
    });
  }

  if (document.rules?.length) {
    view.blank();
    view.add(BANNER, []);
    view.add("%% Business rules", []);
    view.add(BANNER, []);
    document.rules.forEach((rule, index) => {
      const path: DocumentPath = ["rules", index];
      const priority = rule.priority !== undefined ? ` priority: ${rule.priority}` : "";
      sectionHeader(
        view,
        path,
        rule.title ?? rule.name,
        "rules",
        `%%rule ${rule.name} on ${rule.entity} event: ${rule.event}${priority}`
      );
      view.add(`flowchart ${rule.direction ?? "TD"}`, path);
      rule.nodes.forEach((node, position) => {
        const [open, close] = SHAPES[node.shape];
        view.add(`    ${node.id}${open}${node.label}${close}`, [...path, "nodes", position]);
      });
      rule.edges.forEach((edge, position) => {
        const label = edge.label !== undefined ? `|${edge.label}| ` : "";
        view.add(`    ${edge.from} --> ${label}${edge.to}`, [...path, "edges", position]);
      });
      (rule.actions ?? []).forEach((action, position) => {
        const parts = [`%%action ${action.name} ${action.type}`];
        if (action.when !== undefined) parts.push(`when: ${action.when}`);
        for (const [key, value] of Object.entries(action.props ?? {})) {
          parts.push(`${key}: ${value}`);
        }
        view.add(`    ${parts.join(" ")}`, [...path, "actions", position]);
      });
      if (rule.decisionTable !== undefined) {
        view.add(`    %%decision-table ${JSON.stringify(rule.decisionTable)}`, [
          ...path,
          "decisionTable",
        ]);
      }
    });
  }

  const workflows =
    (document.stateMachines?.length ?? 0) +
    (document.hookDiagrams?.length ?? 0) +
    (document.sagas?.length ?? 0);
  if (workflows > 0) {
    view.blank();
    view.add(BANNER, []);
    view.add("%% Workflows", []);
    view.add(BANNER, []);
  }

  (document.stateMachines ?? []).forEach((machine, index) => {
    const path: DocumentPath = ["stateMachines", index];
    sectionHeader(
      view,
      path,
      machine.title ?? machine.name,
      "workflow",
      `%%workflow ${machine.name} entity: ${machine.entity} kind: state`
    );
    view.add("stateDiagram-v2", path);
    for (const line of stateLines(machine, path)) view.add(`    ${line.text}`, line.path);
  });

  (document.hookDiagrams ?? []).forEach((diagram, index) => {
    const path: DocumentPath = ["hookDiagrams", index];
    sectionHeader(
      view,
      path,
      diagram.title ?? diagram.name,
      "workflow",
      `%%workflow ${diagram.name} entity: ${diagram.entity} kind: hook`
    );
    for (const line of diagram.diagram.split("\n")) view.add(line, [...path, "diagram"]);
  });

  (document.sagas ?? []).forEach((saga, index) => {
    const path: DocumentPath = ["sagas", index];
    sectionHeader(
      view,
      path,
      saga.title ?? saga.name,
      "workflow",
      `%%workflow ${saga.name} entity: ${saga.entity} kind: saga trigger: ${
        saga.trigger ?? "automatic"
      } operation: ${saga.operation ?? "CREATE"}`
    );
    if (saga.description !== undefined) {
      view.add(`%%meta description: ${saga.description}`, [...path, "description"]);
    }
    view.add("flowchart TD", path);
    saga.steps.forEach((step, position) => {
      view.add(`    ${step.id}[${step.label ?? step.id}]`, [...path, "steps", position]);
    });
    saga.steps.slice(1).forEach((step, position) => {
      view.add(`    ${saga.steps[position]!.id} --> ${step.id}`, [...path, "steps", position + 1]);
    });
    saga.steps.forEach((step, position) => {
      const properties = Object.entries(step.properties ?? {})
        .map(([key, value]) => ` ${key}: ${value}`)
        .join("");
      view.add(`    %%step ${step.id} ${step.type}${properties}`, [...path, "steps", position]);
    });
  });

  return { text: `${view.lines.join("\n")}\n`, lineMap: view.lineMap };
}
