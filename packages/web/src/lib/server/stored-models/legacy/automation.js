// Vendored from 18f5792 by build.ts — do not edit; see README.md.
// packages/web/src/lib/workflow/step-types.ts
var STEP_TYPES = [
  "UpdateEntity",
  "CreateEntity",
  "DeleteEntity",
  "Decision",
  "Formula",
  "REST"
];
// packages/web/src/lib/automation/model.ts
var TRIGGER_LABELS = {
  created: "is created",
  beforeCreated: "is about to be created",
  updated: "is updated",
  beforeUpdated: "is about to be updated",
  deleted: "is deleted",
  beforeDeleted: "is about to be deleted"
};
var TRIGGER_HOOKS = {
  created: "afterCreate",
  beforeCreated: "beforeCreate",
  updated: "afterUpdate",
  beforeUpdated: "beforeUpdate",
  deleted: "afterDelete",
  beforeDeleted: "beforeDelete"
};
var HOOK_TO_EVENT = {
  afterCreate: "created",
  beforeCreate: "beforeCreated",
  afterUpdate: "updated",
  beforeUpdate: "beforeUpdated",
  afterDelete: "deleted",
  beforeDelete: "beforeDeleted"
};
var OPERATORS = [
  { id: "eq", label: "is", arity: 1 },
  { id: "neq", label: "is not", arity: 1 },
  { id: "gt", label: "is greater than", arity: 1 },
  { id: "gte", label: "is greater than or equal to", arity: 1 },
  { id: "lt", label: "is less than", arity: 1 },
  { id: "lte", label: "is less than or equal to", arity: 1 },
  { id: "contains", label: "contains", arity: 1 },
  { id: "startsWith", label: "starts with", arity: 1 },
  { id: "isEmpty", label: "is empty", arity: 0 },
  { id: "isNotEmpty", label: "is not empty", arity: 0 },
  { id: "changed", label: "changed", arity: 0 }
];
function operatorLabel(id) {
  return OPERATORS.find((o) => o.id === id)?.label ?? id;
}
function operatorArity(id) {
  return OPERATORS.find((o) => o.id === id)?.arity ?? 1;
}
var STEP_LABELS = {
  Decision: "Look up a rule table",
  CreateEntity: "Create a record",
  UpdateEntity: "Update a field",
  DeleteEntity: "Delete a record",
  Formula: "Work out a value",
  REST: "Call a web service"
};
function loopsOf(automation) {
  return automation.loops ?? [];
}
function stepsInLoop(automation, loopId) {
  return automation.steps.filter((step) => step.loopId === loopId);
}
function newHook(event = "beforeCreate") {
  return { id: newId("hook"), event, handler: "", field: "" };
}
var seq = 0;
function newId(prefix) {
  seq += 1;
  return `${prefix}_${seq.toString(36)}${Date.now().toString(36)}`;
}
function emptyAutomation(entity, kind = "automation") {
  return {
    id: newId("auto"),
    name: kind === "hook" ? "Untitled process" : kind === "saga" ? "Untitled process" : "Untitled automation",
    kind,
    trigger: { entity, event: "created" },
    conditions: [],
    loops: [],
    steps: [],
    hooks: kind === "hook" ? [newHook()] : [],
    ...kind === "saga" ? { sagaTrigger: "rule", sagaOperation: "CREATE" } : {},
    status: "draft"
  };
}
function describeLoop(loop) {
  const check = loop.condition.field ? describeCondition(loop.condition) : "a check that is not set yet";
  return `Repeat while ${check}`;
}
function describeCondition(c) {
  const op = operatorLabel(c.operator);
  return operatorArity(c.operator) === 0 ? `${c.field || "a field"} ${op}` : `${c.field || "a field"} ${op} ${c.value || "…"}`;
}
function describeStep(s) {
  const p = s.props;
  switch (s.type) {
    case "Decision":
      return `Look up ${p.ruleTable || "a rule table"}${s.resultName ? ` → ${s.resultName}` : ""}`;
    case "CreateEntity":
      return `Create ${article(p.entity || "record")} ${p.entity || "record"}${s.resultName ? ` → ${s.resultName}` : ""}`;
    case "UpdateEntity":
      return `Set ${p.entity && p.field ? `${p.entity}.${p.field}` : p.field || "a field"} to ${p.value || "…"}`;
    case "DeleteEntity":
      return `Delete ${article(p.entity || "record")} ${p.entity || "record"}`;
    case "Formula":
      return `${p.operation || "Set"} ${p.left || "…"}${p.right ? ` and ${p.right}` : ""}${s.resultName ? ` → ${s.resultName}` : ""}`;
    case "REST":
      return `${p.method || "POST"} to ${p.url || "a URL"}${s.resultName ? ` → ${s.resultName}` : ""}`;
    default:
      return STEP_LABELS[s.type] ?? s.type;
  }
}
function article(word) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}
function stepDirectives(step, nodeId) {
  const out = [
    `%%step ${nodeId} type: ${step.type}${step.resultName ? ` as: ${step.resultName}` : ""}`
  ];
  for (const [k, v] of Object.entries(step.props)) {
    if (v)
      out.push(`%%step ${nodeId} ${k}: ${v}`);
  }
  if (step.table)
    out.push(`%%step ${nodeId} table: ${JSON.stringify(step.table)}`);
  if (step.loopId)
    out.push(`%%step ${nodeId} in: ${step.loopId}`);
  return out;
}
function serializeHookWorkflow(a) {
  const entity = a.trigger.entity || "Record";
  const lines = ["flowchart TD", `    request[Request] --> validate[Validate ${entity}]`];
  let previous = "validate";
  a.hooks.forEach((hook, index) => {
    const id = `hook${index + 1}`;
    lines.push(`    ${previous} --> ${id}[${hook.event}: ${hook.handler}]`);
    previous = id;
  });
  a.steps.forEach((step, index) => {
    const id = `s${index + 1}`;
    lines.push(`    ${previous} --> ${id}[${describeStep(step)}]`);
    previous = id;
  });
  lines.push(`    ${previous} --> done[Response]`, "");
  for (const hook of a.hooks) {
    lines.push(`    %%hook ${hook.event} ${hook.handler} on ${entity}` + (hook.field ? `[field: ${hook.field}]` : ""));
  }
  for (const c of a.conditions) {
    lines.push(`    %%guard ${c.field} ${c.operator} ${JSON.stringify(c.value)}`);
  }
  for (const loop of loopsOf(a)) {
    if (stepsInLoop(a, loop.id).length === 0)
      continue;
    const c = loop.condition;
    lines.push(`    %%loop ${loop.id} while: ${c.field} ${c.operator} ${JSON.stringify(c.value)} max: ${loop.maxPasses}`);
  }
  a.steps.forEach((step, index) => {
    for (const line of stepDirectives(step, `s${index + 1}`))
      lines.push(`    ${line}`);
  });
  return lines.join(`
`);
}
function pascalName(value) {
  const cleaned = value.replace(/[^A-Za-z0-9]+/g, " ").trim();
  if (!cleaned)
    return "Workflow";
  return cleaned.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}
function serializeAutomation(a, options = {}) {
  if (a.kind === "hook")
    return serializeHookWorkflow(a);
  const header = options.header ?? true;
  const lines = [];
  lines.push("flowchart TD");
  if (header)
    lines.push(`%%meta kind: workflow`);
  if (!header) {} else if (a.kind === "saga") {
    const trigger = a.sagaTrigger === "rule" ? " trigger: rule" : "";
    const operation = a.sagaOperation && a.sagaOperation !== "CREATE" ? ` operation: ${a.sagaOperation}` : "";
    lines.push(`%%workflow ${pascalName(a.name)} entity: ${a.trigger.entity} kind: saga${trigger}${operation}`);
  } else {
    lines.push(`%%workflow name: ${a.name}`);
    lines.push(`%%hook ${TRIGGER_HOOKS[a.trigger.event]} on ${a.trigger.entity}`);
  }
  for (const c of a.conditions) {
    lines.push(`%%guard ${c.field} ${c.operator} ${JSON.stringify(c.value)}`);
  }
  for (const loop of loopsOf(a)) {
    if (stepsInLoop(a, loop.id).length === 0)
      continue;
    const c = loop.condition;
    lines.push(`%%loop ${loop.id} while: ${c.field} ${c.operator} ${JSON.stringify(c.value)} max: ${loop.maxPasses}`);
  }
  const ids = ["start"];
  const startLabel = a.kind === "saga" ? a.sagaTrigger === "rule" ? `${a.trigger.entity} — a rule decides` : `${a.trigger.entity} ${SAGA_OPERATION_LABELS[a.sagaOperation ?? "CREATE"]}` : `${a.trigger.entity} ${TRIGGER_LABELS[a.trigger.event]}`;
  lines.push(`  start([${startLabel}])`);
  if (a.conditions.length > 0) {
    ids.push("guard");
    lines.push(`  guard{${a.conditions.map(describeCondition).join(" and ")}}`);
  }
  const directives = [];
  const emit = (step, nodeId) => {
    directives.push(...stepDirectives(step, nodeId));
  };
  let openLoop = null;
  a.steps.forEach((step, i) => {
    const nodeId = `s${i + 1}`;
    if (step.loopId !== openLoop) {
      if (openLoop)
        lines.push("  end");
      openLoop = step.loopId ?? null;
      if (openLoop) {
        const loop = loopsOf(a).find((l) => l.id === openLoop);
        lines.push(`  subgraph ${openLoop}[${loop ? describeLoop(loop) : "Repeat"}]`);
        ids.push(openLoop);
      }
    }
    lines.push(`  ${openLoop ? "  " : ""}${nodeId}[${describeStep(step)}]`);
    if (!openLoop)
      ids.push(nodeId);
    emit(step, nodeId);
  });
  if (openLoop)
    lines.push("  end");
  lines.push(...directives);
  ids.push("done");
  lines.push("  done([Done])");
  for (let i = 0;i < ids.length - 1; i++) {
    lines.push(`  ${ids[i]} --> ${ids[i + 1]}`);
  }
  return lines.join(`
`);
}
var SAGA_OPERATION_LABELS = {
  CREATE: "is created",
  UPDATE: "is updated",
  DELETE: "is deleted",
  ALL: "is written"
};
var SAGA_OPERATION_EVENTS = {
  CREATE: "created",
  UPDATE: "updated",
  DELETE: "deleted"
};
function parseSagaProps(rest) {
  const props = {};
  for (const part of rest.trim().split(/\s+(?=[A-Za-z_]\w*:)/)) {
    const match = part.match(/^([A-Za-z_]\w*):\s*(.*)$/s);
    if (match?.[1])
      props[match[1]] = (match[2] ?? "").trim();
  }
  return props;
}
function applySagaProps(entry, props) {
  const take = (key) => {
    const value = props[key];
    delete props[key];
    return value;
  };
  const as = take("as");
  if (as)
    entry.resultName = as;
  if (entry.type === "Decision") {
    const table = take("decisionTable");
    if (table) {
      try {
        entry.table = JSON.parse(table);
      } catch {}
    }
  } else if (entry.type === "Formula") {
    const target = take("target");
    if (target && !entry.resultName)
      entry.resultName = target;
    const source = take("source");
    const value = take("value");
    if (source)
      entry.props.left = `{{${source}}}`;
    else if (value !== undefined)
      entry.props.left = value;
    const operand = take("operand");
    if (operand !== undefined)
      entry.props.right = operand;
  } else if (entry.type === "CreateEntity") {
    const fields = take("fields");
    if (fields !== undefined)
      entry.props.values = fields;
  } else if (entry.type === "UpdateEntity") {
    const source = take("source");
    if (source)
      entry.props.value = `{{${source}}}`;
    const targetSource = take("targetSource");
    if (targetSource)
      entry.props.target = `{{${targetSource}}}`;
  } else if (entry.type === "DeleteEntity") {
    const targetSource = take("targetSource");
    const targetField = take("targetField");
    if (targetSource)
      entry.props.target = `{{${targetSource}}}`;
    else if (targetField)
      entry.props.target = targetField;
  } else if (entry.type === "REST") {
    const body = take("bodyTemplate");
    if (body !== undefined)
      entry.props.body = body;
  }
  for (const [key, value] of Object.entries(props)) {
    if (value)
      entry.props[key] ??= value;
  }
}
function parseAutomation(source, fallbackEntity = "Record") {
  const a = emptyAutomation(fallbackEntity);
  const stepsById = new Map;
  const order = [];
  for (const raw of source.split(`
`)) {
    const line = raw.trim();
    const name = line.match(/^%%workflow\s+name:\s*(.+)$/);
    if (name?.[1]) {
      a.name = name[1].trim();
      continue;
    }
    const saga = line.match(/^%%workflow\s+(\w+)\s+entity:\s*(\w+)(.*)$/);
    if (saga?.[1] && saga[2]) {
      a.name = saga[1];
      const rest = saga[3] ?? "";
      const operation = rest.match(/operation:\s*(\w+)/)?.[1]?.toUpperCase();
      const trigger = rest.match(/trigger:\s*(\w+)/)?.[1];
      a.trigger = { entity: saga[2], event: SAGA_OPERATION_EVENTS[operation ?? ""] ?? "created" };
      if (/kind:\s*saga\b/.test(rest)) {
        a.kind = "saga";
        a.sagaTrigger = trigger === "rule" ? "rule" : "automatic";
        a.sagaOperation = operation === "UPDATE" || operation === "DELETE" || operation === "ALL" ? operation : "CREATE";
      }
      continue;
    }
    const handlerHook = line.match(/^%%hook\s+(\w+)\s+(\w+)\s+on\s+(\w+)(?:\[\s*field:\s*([^\]]+)\])?/);
    if (handlerHook?.[1] && handlerHook[2] && handlerHook[3]) {
      a.kind = "hook";
      a.trigger = { ...a.trigger, entity: handlerHook[3] };
      a.hooks.push({
        id: newId("hook"),
        event: handlerHook[1],
        handler: handlerHook[2],
        field: handlerHook[4]?.trim() || undefined
      });
      continue;
    }
    const hook = line.match(/^%%hook\s+(\w+)\s+on\s+(\w+)/);
    if (hook?.[1] && hook[2]) {
      a.trigger = { entity: hook[2], event: HOOK_TO_EVENT[hook[1]] ?? "created" };
      continue;
    }
    const loop = line.match(/^%%loop\s+(\w+)\s+while:\s*(\S+)\s+(\S+)\s*(.*)$/);
    if (loop?.[1] && loop[2] && loop[3]) {
      let rest = (loop[4] ?? "").trim();
      const maxMatch = rest.match(/\s*max:\s*(\S+)\s*$/);
      const maxPasses = maxMatch?.[1] ?? "";
      if (maxMatch)
        rest = rest.slice(0, rest.length - maxMatch[0].length);
      let value = rest.trim();
      try {
        if (value.startsWith('"'))
          value = JSON.parse(value);
      } catch {}
      a.loops.push({
        id: loop[1],
        condition: { id: newId("cond"), field: loop[2], operator: loop[3], value },
        maxPasses
      });
      continue;
    }
    if (/^%%guard\s+role:\S+\s+on\s+\w+\.\w+\s*$/.test(line))
      continue;
    const guard = line.match(/^%%guard\s+(\S+)\s+(\S+)\s*(.*)$/);
    if (guard?.[1] && guard[2]) {
      let value = (guard[3] ?? "").trim();
      try {
        if (value.startsWith('"'))
          value = JSON.parse(value);
      } catch {}
      a.conditions.push({
        id: newId("cond"),
        field: guard[1],
        operator: guard[2],
        value
      });
      continue;
    }
    const sagaStep = line.match(/^%%step\s+(\S+)\s+([A-Za-z]\w*)\s+(.*)$/);
    if (sagaStep?.[2] && STEP_TYPES.includes(sagaStep[2])) {
      const [, nodeId = "", typeName = "", rest = ""] = sagaStep;
      let entry = stepsById.get(nodeId);
      if (!entry) {
        entry = { id: newId("step"), type: "Formula", resultName: "", props: {} };
        stepsById.set(nodeId, entry);
        order.push(nodeId);
      }
      entry.type = typeName;
      applySagaProps(entry, parseSagaProps(rest));
      continue;
    }
    const step = line.match(/^%%step\s+(\S+)\s+(\w+):\s*(.*)$/);
    if (step?.[1] && step[2]) {
      const [, nodeId, key, rest = ""] = step;
      let entry = stepsById.get(nodeId);
      if (!entry) {
        entry = { id: newId("step"), type: "Formula", resultName: "", props: {} };
        stepsById.set(nodeId, entry);
        order.push(nodeId);
      }
      const value = rest.trim();
      if (key === "type") {
        const [typeName = "", ...tail] = value.split(/\s+as:\s*/);
        if (STEP_TYPES.includes(typeName.trim())) {
          entry.type = typeName.trim();
        }
        if (tail[0])
          entry.resultName = tail[0].trim();
      } else if (key === "as") {
        entry.resultName = value;
      } else if (key === "table") {
        try {
          entry.table = JSON.parse(value);
        } catch {}
      } else if (key === "in") {
        entry.loopId = value;
      } else {
        entry.props[key] = value;
      }
    }
  }
  a.steps = order.map((id) => stepsById.get(id)).filter((s) => Boolean(s));
  const declared = new Set(loopsOf(a).map((loop) => loop.id));
  for (const step of a.steps) {
    if (step.loopId && !declared.has(step.loopId))
      step.loopId = undefined;
  }
  a.loops = loopsOf(a).filter((loop) => a.steps.some((step) => step.loopId === loop.id));
  return a;
}
export {
  serializeAutomation,
  parseAutomation,
  emptyAutomation
};
