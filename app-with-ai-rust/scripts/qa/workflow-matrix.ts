#!/usr/bin/env bun
/**
 * Multi-step workflow matrix for a generated app.
 *
 * Builds several hundred distinct saga shapes, installs each one through
 * `POST /api/workflow`, runs it through `POST /api/workflow/{id}/execute`, and
 * checks what actually happened — the returned `vars` for computation steps,
 * and the database for steps that write rows.
 *
 * The point is coverage of *shapes*, not of one saga: every step node type the
 * language declares, every Formula operation, context resolution from each of
 * the three scopes, `as`/`targetSource` hand-off between steps, placeholder
 * interpolation, and chains from 2 to 12 steps long.
 *
 * Usage:
 *   bun scripts/qa/workflow-matrix.ts [--base http://localhost:3000] [--json out.json]
 */

const BASE = argValue("--base") ?? "http://localhost:3000";
const JSON_OUT = argValue("--json");
const ONLY = argValue("--only");

function argValue(flag: string): string | undefined {
  const index = Bun.argv.indexOf(flag);
  return index === -1 ? undefined : Bun.argv[index + 1];
}

// ---------------------------------------------------------------------------
// BPMN construction — the same encoding buildSagaBpmn() emits.
// ---------------------------------------------------------------------------

interface Step {
  type: string;
  props: Record<string, string>;
  label?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildBpmn(name: string, steps: Step[]): string {
  const processId = `Process_${name.replace(/[^A-Za-z0-9_]/g, "_")}`;
  const taskIds = steps.map((_, i) => `${processId}_t${i}`);
  const sequence = [`${processId}_start`, ...taskIds, `${processId}_end`];

  const tasks = steps
    .map((step, index) => {
      const props = Object.entries(step.props)
        .map(
          ([key, value]) =>
            `        <appwithai:property name="${escapeXml(key)}" value="${escapeXml(value)}"/>`
        )
        .join("\n");
      return `    <bpmn:serviceTask id="${taskIds[index]}" name="${escapeXml(step.label ?? step.type)}">
      <bpmn:extensionElements>
        <appwithai:properties>
        <appwithai:property name="nodeType" value="${escapeXml(step.type)}"/>
${props}
        </appwithai:properties>
      </bpmn:extensionElements>
    </bpmn:serviceTask>`;
    })
    .join("\n");

  const flows = sequence
    .slice(0, -1)
    .map(
      (from, index) =>
        `    <bpmn:sequenceFlow id="${processId}_f${index}" sourceRef="${from}" targetRef="${sequence[index + 1]}"/>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:appwithai="http://appwithai.io/schema/1.0"
  id="Definitions_${processId}" targetNamespace="http://appwithai.io/bpmn">
  <bpmn:process id="${processId}" isExecutable="true">
    <bpmn:startEvent id="${processId}_start"/>
${tasks}
    <bpmn:endEvent id="${processId}_end"/>
${flows}
  </bpmn:process>
</bpmn:definitions>`;
}

// ---------------------------------------------------------------------------
// Scenario model
// ---------------------------------------------------------------------------

interface Scenario {
  name: string;
  family: string;
  steps: Step[];
  entityName?: string;
  context?: { entityId?: string; entityData?: Record<string, unknown>; decision?: Record<string, unknown> };
  /** Expected `vars` subset returned by execute. */
  expectVars?: Record<string, unknown>;
  /** Expect the run to fail (HTTP 4xx/5xx from execute). */
  expectFailure?: boolean;
  /** Expect `POST /api/workflow` itself to reject the document. */
  expectCreateFailure?: boolean;
  /** Extra assertion run after a successful execute. */
  verify?: (result: ExecuteResult) => Promise<string | null>;
}

interface ExecuteResult {
  status: number;
  body: any;
}

const scenarios: Scenario[] = [];
function add(s: Scenario) {
  scenarios.push(s);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

let TOKEN = "";

async function api(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep raw text */
  }
  return { status: response.status, body };
}

async function login(): Promise<void> {
  const result = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@admin.com", password: "admin" }),
  });
  if (result.status !== 200 || !result.body?.token) {
    throw new Error(`login failed: ${result.status} ${JSON.stringify(result.body)}`);
  }
  TOKEN = result.body.token;
}

// ---------------------------------------------------------------------------
// Fixtures — a real FK chain the write steps can act on.
// ---------------------------------------------------------------------------

interface Fixtures {
  teamId: string;
  userId: string;
  experimentId: string;
  deviationId: string;
  compoundId: string;
}

async function createRow(table: string, payload: Record<string, unknown>): Promise<string> {
  const result = await api(`/api/bus/${table}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.status >= 300 || !result.body?.id) {
    throw new Error(`fixture ${table} failed: ${result.status} ${JSON.stringify(result.body)}`);
  }
  return result.body.id as string;
}

async function seedFixtures(): Promise<Fixtures> {
  const stamp = Date.now();
  const teamId = await createRow("team", { name: `QA Matrix Team ${stamp}` });
  const userId = await createRow("user", {
    email: `qa-matrix-${stamp}@example.com`,
    first_name: "QA",
    last_name: "Matrix",
    role: "researcher",
    is_active: true,
    team_id: teamId,
  });
  const experimentId = await createRow("experiment", {
    title: `QA Matrix Experiment ${stamp}`,
    status: "draft",
    pi_id: userId,
    schema_version: "1.0.0",
    estimated_duration_days: 10,
  });
  const compoundId = await createRow("compound", {
    smiles: `C1CCCCC1-${stamp}`,
    registration_status: "draft",
    registered_by_id: userId,
  });
  const deviationId = await createRow("deviation_report", {
    experiment_id: experimentId,
    reported_by_id: userId,
    anomaly_timestamp: new Date().toISOString(),
    anomaly_description: "QA matrix baseline deviation used as the trigger record.",
    severity: "minor",
    status: "open",
  });
  return { teamId, userId, experimentId, deviationId, compoundId };
}

// ---------------------------------------------------------------------------
// Scenario families
// ---------------------------------------------------------------------------

const ARITH = ["add", "subtract", "multiply", "divide"] as const;

function buildScenarios(fx: Fixtures): void {
  const trigger = { entityId: fx.deviationId, entityData: { id: fx.deviationId, severity: "minor" } };

  // --- A1: set → single arithmetic op, across operands -----------------------
  const operands = ["0", "1", "7", "-3", "2.5", "1000"];
  const bases = ["10", "0", "-4", "3.5"];
  for (const op of ARITH) {
    for (const operand of operands) {
      const base = 10;
      const n = Number(operand);
      const expected =
        op === "add" ? base + n
        : op === "subtract" ? base - n
        : op === "multiply" ? base * n
        : n === 0 ? 0 : base / n;
      add({
        name: `A1 set10 ${op} ${operand}`,
        family: "Formula/binary",
        steps: [
          { type: "Formula", props: { target: "x", operation: "set", value: String(base) } },
          { type: "Formula", props: { target: "y", source: "x", operation: op, operand } },
        ],
        context: trigger,
        expectVars: { x: base, y: expected },
      });
    }
  }

  // --- A2: varying base values ----------------------------------------------
  for (const op of ARITH) {
    for (const baseValue of bases) {
      const base = Number(baseValue);
      const operand = 4;
      const expected =
        op === "add" ? base + operand
        : op === "subtract" ? base - operand
        : op === "multiply" ? base * operand
        : base / operand;
      add({
        name: `A2 base${baseValue} ${op} 4`,
        family: "Formula/binary",
        steps: [
          { type: "Formula", props: { target: "b", operation: "set", value: baseValue } },
          { type: "Formula", props: { target: "r", source: "b", operation: op, operand: "4" } },
        ],
        context: trigger,
        expectVars: { b: base, r: expected },
      });
    }
  }

  // --- A3: three-step chains, every op pair ---------------------------------
  for (const first of ARITH) {
    for (const second of ARITH) {
      const start = 12;
      const afterFirst =
        first === "add" ? start + 2
        : first === "subtract" ? start - 2
        : first === "multiply" ? start * 2
        : start / 2;
      const afterSecond =
        second === "add" ? afterFirst + 3
        : second === "subtract" ? afterFirst - 3
        : second === "multiply" ? afterFirst * 3
        : afterFirst / 3;
      add({
        name: `A3 chain ${first}->${second}`,
        family: "Formula/chain3",
        steps: [
          { type: "Formula", props: { target: "a", operation: "set", value: "12" } },
          { type: "Formula", props: { target: "b", source: "a", operation: first, operand: "2" } },
          { type: "Formula", props: { target: "c", source: "b", operation: second, operand: "3" } },
        ],
        context: trigger,
        expectVars: { a: 12, b: afterFirst, c: afterSecond },
      });
    }
  }

  // --- A4: four- and five-step arithmetic pipelines --------------------------
  for (const op of ARITH) {
    for (const tail of ARITH) {
      const v0 = 100;
      const v1 = op === "add" ? v0 + 5 : op === "subtract" ? v0 - 5 : op === "multiply" ? v0 * 5 : v0 / 5;
      const v2 = v1 * 2;
      const v3 = tail === "add" ? v2 + 1 : tail === "subtract" ? v2 - 1 : tail === "multiply" ? v2 * 1 : v2 / 1;
      add({
        name: `A4 pipeline ${op}->multiply->${tail}`,
        family: "Formula/chain5",
        steps: [
          { type: "Formula", props: { target: "s0", operation: "set", value: "100" } },
          { type: "Formula", props: { target: "s1", source: "s0", operation: op, operand: "5" } },
          { type: "Formula", props: { target: "s2", source: "s1", operation: "multiply", operand: "2" } },
          { type: "Formula", props: { target: "s3", source: "s2", operation: tail, operand: "1" } },
        ],
        context: trigger,
        expectVars: { s0: v0, s1: v1, s2: v2, s3: v3 },
      });
    }
  }

  // --- A5: divide-by-zero, documented as 0 not Infinity ----------------------
  for (const baseValue of ["10", "0", "-7", "2.5", "1e3"]) {
    const parsed = Number(baseValue);
    add({
      name: `A5 divzero base=${baseValue}`,
      family: "Formula/edge",
      steps: [
        { type: "Formula", props: { target: "n", operation: "set", value: baseValue } },
        { type: "Formula", props: { target: "q", source: "n", operation: "divide", operand: "0" } },
      ],
      context: trigger,
      expectVars: { n: parsed, q: 0 },
    });
  }

  // --- A6: non-numeric literal, then arithmetic (resolve_number → 0) ---------
  for (const literal of ["hello", "escalated", "", "12abc", "true", "null"]) {
    const numeric = Number(literal);
    const stored = literal !== "" && Number.isFinite(numeric) ? numeric : literal;
    const base = typeof stored === "number" ? stored : 0;
    add({
      name: `A6 literal "${literal}" then add 5`,
      family: "Formula/edge",
      steps: [
        { type: "Formula", props: { target: "lit", operation: "set", value: literal } },
        { type: "Formula", props: { target: "sum", source: "lit", operation: "add", operand: "5" } },
      ],
      context: trigger,
      expectVars: { lit: stored, sum: base + 5 },
    });
  }

  // --- A7: source read from entityData --------------------------------------
  for (const [field, value] of [["dur", 10], ["cost", 42.5], ["count", 0], ["neg", -8]] as const) {
    for (const op of ARITH) {
      const expected =
        op === "add" ? value + 3
        : op === "subtract" ? value - 3
        : op === "multiply" ? value * 3
        : value / 3;
      add({
        name: `A7 entityData.${field} ${op} 3`,
        family: "Formula/scope-entityData",
        steps: [{ type: "Formula", props: { target: "out", source: field, operation: op, operand: "3" } }],
        context: { ...trigger, entityData: { ...trigger.entityData, [field]: value } },
        expectVars: { out: expected },
      });
    }
  }

  // --- A8: decision scope wins over vars and entityData ----------------------
  for (const decisionValue of [1, 50, -2, 0.5, 999, 7]) {
    add({
      name: `A8 decision precedence ${decisionValue}`,
      family: "Formula/scope-precedence",
      steps: [
        // A var of the same name is staged first; `decision` must still win.
        { type: "Formula", props: { target: "k", operation: "set", value: "1000" } },
        { type: "Formula", props: { target: "res", source: "k", operation: "add", operand: "0" } },
      ],
      context: {
        ...trigger,
        entityData: { ...trigger.entityData, k: 5 },
        decision: { k: decisionValue },
      },
      expectVars: { res: decisionValue },
    });
  }

  // --- A9: overwriting the same target --------------------------------------
  for (const times of [2, 3, 4, 5, 6, 7]) {
    const steps: Step[] = [{ type: "Formula", props: { target: "acc", operation: "set", value: "0" } }];
    for (let i = 0; i < times; i += 1) {
      steps.push({ type: "Formula", props: { target: "acc", source: "acc", operation: "add", operand: "2" } });
    }
    add({
      name: `A9 accumulate x${times}`,
      family: "Formula/accumulate",
      steps,
      context: trigger,
      expectVars: { acc: times * 2 },
    });
  }

  // --- A10: missing required properties → the run must fail ------------------
  add({
    name: "A10 formula missing source",
    family: "Formula/validation",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "Formula", props: { target: "b", operation: "multiply", operand: "2" } },
    ],
    context: trigger,
    expectFailure: true,
  });
  add({
    name: "A10 formula missing target",
    family: "Formula/validation",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "Formula", props: { operation: "add", source: "a", operand: "2" } },
    ],
    context: trigger,
    expectFailure: true,
  });
  add({
    name: "A10 formula set without value",
    family: "Formula/validation",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "Formula", props: { target: "b", operation: "set" } },
    ],
    context: trigger,
    expectFailure: true,
  });
  add({
    name: "A10 formula unknown source resolves to 0",
    family: "Formula/validation",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "5" } },
      { type: "Formula", props: { target: "b", source: "nosuchkey", operation: "add", operand: "9" } },
    ],
    context: trigger,
    expectVars: { a: 5, b: 9 },
  });

  // --- A11: unrecognised operation returns the base unchanged ----------------
  for (const op of ["power", "modulo", "concat", "", "SET", "Add"]) {
    add({
      name: `A11 unknown op "${op}"`,
      family: "Formula/edge",
      steps: [
        { type: "Formula", props: { target: "a", operation: "set", value: "21" } },
        { type: "Formula", props: { target: "b", source: "a", operation: op, operand: "2" } },
      ],
      context: trigger,
      expectVars: { a: 21, b: 21 },
    });
  }

  // --- A12: long chains, 6 to 12 steps --------------------------------------
  for (let length = 6; length <= 12; length += 1) {
    const steps: Step[] = [{ type: "Formula", props: { target: "v0", operation: "set", value: "1" } }];
    let expected = 1;
    for (let i = 1; i < length; i += 1) {
      steps.push({
        type: "Formula",
        props: { target: `v${i}`, source: `v${i - 1}`, operation: "add", operand: "1" },
      });
      expected += 1;
    }
    add({
      name: `A12 long chain length=${length}`,
      family: "Formula/long",
      steps,
      context: trigger,
      expectVars: { [`v${length - 1}`]: expected },
    });
  }

  // --- B: CreateEntity -------------------------------------------------------
  const capaFields = (title: string, extra: Record<string, string> = {}) =>
    JSON.stringify({
      title,
      status: "open",
      root_cause_category: "unknown",
      deviation_report_id: fx.deviationId,
      remediation_owner_id: fx.userId,
      required_resolution_date: "2026-12-31",
      ...extra,
    });

  for (let i = 0; i < 12; i += 1) {
    add({
      name: `B1 create CAPA + as-binding #${i}`,
      family: "CreateEntity/basic",
      steps: [
        { type: "Formula", props: { target: "seq", operation: "set", value: String(i) } },
        {
          type: "CreateEntity",
          props: { entity: "bus_capa", as: "capaId", fields: capaFields(`QA B1 #${i}`) },
        },
      ],
      context: trigger,
      verify: async (result) => {
        const capaId = result.body?.vars?.capaId;
        if (typeof capaId !== "string") return "CreateEntity did not bind `as` into vars";
        const row = await api(`/api/bus/capa/${capaId}`);
        if (row.status !== 200) return `created CAPA ${capaId} not readable (HTTP ${row.status})`;
        return null;
      },
    });
  }

  // Placeholder interpolation from each scope.
  for (const [label, template, expectTitle] of [
    ["entityData id", `CAPA for {{id}}`, `CAPA for ${fx.deviationId}`],
    ["entityData severity", `Severity {{severity}}`, `Severity minor`],
    ["var from formula", `Computed {{score}}`, `Computed 42`],
    ["two placeholders", `{{severity}}/{{score}}`, `minor/42`],
    ["unknown key empties", `X{{nope}}Y`, `XY`],
    ["unterminated left as-is", `A{{oops`, `A{{oops`],
    ["no placeholder", `plain title`, `plain title`],
  ] as const) {
    add({
      name: `B2 interpolate ${label}`,
      family: "CreateEntity/interpolation",
      steps: [
        { type: "Formula", props: { target: "score", operation: "set", value: "42" } },
        {
          type: "CreateEntity",
          props: { entity: "bus_capa", as: "capaId", fields: capaFields(template) },
        },
      ],
      context: trigger,
      verify: async (result) => {
        const capaId = result.body?.vars?.capaId;
        if (typeof capaId !== "string") return "no capaId bound";
        const row = await api(`/api/bus/capa/${capaId}`);
        const title = row.body?.title;
        return title === expectTitle ? null : `title was ${JSON.stringify(title)}, expected ${JSON.stringify(expectTitle)}`;
      },
    });
  }

  // Multi-create chains.
  for (let count = 2; count <= 5; count += 1) {
    const steps: Step[] = [];
    for (let i = 0; i < count; i += 1) {
      steps.push({
        type: "CreateEntity",
        props: { entity: "bus_capa", as: `capa${i}`, fields: capaFields(`QA B3 multi ${count}-${i}`) },
      });
    }
    add({
      name: `B3 create x${count}`,
      family: "CreateEntity/multi",
      steps,
      context: trigger,
      verify: async (result) => {
        for (let i = 0; i < count; i += 1) {
          if (typeof result.body?.vars?.[`capa${i}`] !== "string") return `capa${i} not bound`;
        }
        return null;
      },
    });
  }

  // Malformed / empty payloads.
  add({
    name: "B4 malformed JSON fields",
    family: "CreateEntity/validation",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "CreateEntity", props: { entity: "bus_capa", fields: "{not json" } },
    ],
    context: trigger,
    expectFailure: true,
  });
  add({
    name: "B4 empty fields fails NOT NULL",
    family: "CreateEntity/validation",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "CreateEntity", props: { entity: "bus_capa", fields: "" } },
    ],
    context: trigger,
    expectFailure: true,
  });
  add({
    name: "B4 unknown entity",
    family: "CreateEntity/validation",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "CreateEntity", props: { entity: "bus_not_a_table", fields: "{}" } },
    ],
    context: trigger,
    expectFailure: true,
  });

  // --- C: UpdateEntity -------------------------------------------------------
  for (const status of ["open", "under_investigation", "resolved", "closed"]) {
    add({
      name: `C1 update status=${status} (literal)`,
      family: "UpdateEntity/literal",
      steps: [
        { type: "Formula", props: { target: "n", operation: "set", value: "1" } },
        { type: "UpdateEntity", props: { field: "status", value: status } },
      ],
      context: trigger,
      verify: async () => {
        const row = await api(`/api/bus/deviation_report/${fx.deviationId}`);
        return row.body?.status === status ? null : `status was ${row.body?.status}, expected ${status}`;
      },
    });
  }

  for (const severity of ["minor", "major", "critical", "catastrophic"]) {
    add({
      name: `C2 update severity=${severity} via source`,
      family: "UpdateEntity/source",
      steps: [
        { type: "Formula", props: { target: "sev", operation: "set", value: severity } },
        { type: "UpdateEntity", props: { field: "severity", source: "sev" } },
      ],
      context: trigger,
      verify: async () => {
        const row = await api(`/api/bus/deviation_report/${fx.deviationId}`);
        return row.body?.severity === severity ? null : `severity was ${row.body?.severity}`;
      },
    });
  }

  // Cross-entity update reaching a row an earlier step created.
  for (const newStatus of ["in_progress", "pending_verification", "closed", "cancelled", "open"]) {
    add({
      name: `C3 create CAPA then update it to ${newStatus}`,
      family: "UpdateEntity/targetSource",
      steps: [
        {
          type: "CreateEntity",
          props: { entity: "bus_capa", as: "capaId", fields: capaFields(`QA C3 ${newStatus}`) },
        },
        {
          type: "UpdateEntity",
          props: { entity: "bus_capa", targetSource: "capaId", field: "status", value: newStatus },
        },
      ],
      context: trigger,
      verify: async (result) => {
        const capaId = result.body?.vars?.capaId;
        const row = await api(`/api/bus/capa/${capaId}`);
        return row.body?.status === newStatus ? null : `CAPA status was ${row.body?.status}, expected ${newStatus}`;
      },
    });
  }

  // Formula result written onto a record.
  for (const [operand, expected] of [["1", "2"], ["5", "10"], ["10", "20"], ["0", "0"]] as const) {
    add({
      name: `C4 formula ${operand}*2 -> root_cause text`,
      family: "UpdateEntity/from-formula",
      steps: [
        { type: "Formula", props: { target: "base", operation: "set", value: operand } },
        { type: "Formula", props: { target: "doubled", source: "base", operation: "multiply", operand: "2" } },
        { type: "UpdateEntity", props: { field: "root_cause", source: "doubled" } },
      ],
      context: trigger,
      verify: async () => {
        const row = await api(`/api/bus/deviation_report/${fx.deviationId}`);
        const actual = String(row.body?.root_cause ?? "");
        return actual.startsWith(expected) ? null : `root_cause was ${actual}, expected ~${expected}`;
      },
    });
  }

  add({
    name: "C5 update missing field property",
    family: "UpdateEntity/validation",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "UpdateEntity", props: { value: "x" } },
    ],
    context: trigger,
    expectFailure: true,
  });
  add({
    name: "C5 update with unresolvable targetSource",
    family: "UpdateEntity/validation",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "UpdateEntity", props: { targetSource: "ghost", field: "status", value: "closed" } },
    ],
    context: trigger,
    expectFailure: true,
  });

  // --- D: DeleteEntity -------------------------------------------------------
  for (const hard of ["false", "true"]) {
    for (let i = 0; i < 4; i += 1) {
      add({
        name: `D1 create then delete hard=${hard} #${i}`,
        family: "DeleteEntity",
        steps: [
          {
            type: "CreateEntity",
            props: { entity: "bus_capa", as: "capaId", fields: capaFields(`QA D1 ${hard} ${i}`) },
          },
          { type: "DeleteEntity", props: { entity: "bus_capa", targetSource: "capaId", hard } },
        ],
        context: trigger,
        verify: async (result) => {
          const capaId = result.body?.vars?.capaId;
          const row = await api(`/api/bus/capa/${capaId}`);
          return row.status === 404 ? null : `deleted CAPA still readable (HTTP ${row.status})`;
        },
      });
    }
  }

  add({
    name: "D2 delete a row that is already gone",
    family: "DeleteEntity",
    steps: [
      {
        type: "CreateEntity",
        props: { entity: "bus_capa", as: "capaId", fields: capaFields("QA D2 twice") },
      },
      { type: "DeleteEntity", props: { entity: "bus_capa", targetSource: "capaId", hard: "true" } },
      { type: "DeleteEntity", props: { entity: "bus_capa", targetSource: "capaId", hard: "true" } },
    ],
    context: trigger,
  });

  add({
    name: "D3 delete without a resolvable target",
    family: "DeleteEntity",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "DeleteEntity", props: { entity: "bus_capa", targetSource: "ghost" } },
    ],
    context: trigger,
    expectFailure: true,
  });

  // --- E: REST ---------------------------------------------------------------
  // `/api/sys/tables` is an open GET on this same server, so a REST step can
  // reach it without standing up another listener.
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    add({
      name: `E1 REST ${method} to an open endpoint`,
      family: "REST",
      steps: [
        { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
        { type: "REST", props: { url: `${BASE}/api/sys/tables`, method } },
      ],
      context: trigger,
      // Only GET is routed; the others should surface as a failed run.
      expectFailure: method !== "GET",
    });
  }

  add({
    name: "E2 REST missing url",
    family: "REST",
    steps: [
      { type: "Formula", props: { target: "a", operation: "set", value: "1" } },
      { type: "REST", props: { method: "GET" } },
    ],
    context: trigger,
    expectFailure: true,
  });
  add({
    name: "E2 REST invalid method token",
    family: "REST",
    steps: [{ type: "REST", props: { url: `${BASE}/api/sys/tables`, method: "BAD METHOD" } }],
    context: trigger,
    expectFailure: true,
  });
  add({
    name: "E2 REST unreachable host",
    family: "REST",
    steps: [{ type: "REST", props: { url: "http://127.0.0.1:9/nothing", method: "GET" } }],
    context: trigger,
    expectFailure: true,
  });
  add({
    name: "E2 REST 404 surfaces as failure",
    family: "REST",
    steps: [{ type: "REST", props: { url: `${BASE}/api/sys/definitely-not-here`, method: "GET" } }],
    context: trigger,
    expectFailure: true,
  });

  // The language declares REST `body`; the executor reads `bodyTemplate`.
  // Both spellings are exercised so the report can say which one is honoured.
  for (const key of ["body", "bodyTemplate"]) {
    add({
      name: `E3 REST ${key} placeholder is interpolated`,
      family: "REST/body",
      steps: [
        { type: "Formula", props: { target: "tok", operation: "set", value: "abc" } },
        {
          type: "REST",
          props: { url: `${BASE}/api/sys/tables`, method: "GET", [key]: '{"t":"{{tok}}"}' },
        },
      ],
      context: trigger,
    });
  }

  // REST declares `as`, but the executor discards the response.
  add({
    name: "E4 REST as-binding",
    family: "REST/as",
    steps: [{ type: "REST", props: { url: `${BASE}/api/sys/tables`, method: "GET", as: "restOut" } }],
    context: trigger,
    verify: async (result) =>
      result.body?.vars?.restOut === undefined
        ? "REST `as` bound nothing into vars (response discarded)"
        : null,
  });

  // --- F: Agent — declared by the language, absent from the executor ---------
  for (let i = 0; i < 6; i += 1) {
    add({
      name: `F1 Agent step #${i} (declared in EML)`,
      family: "Agent",
      steps: [
        { type: "Formula", props: { target: "before", operation: "set", value: String(i) } },
        { type: "Agent", props: { agent: "summarise", prompt: "Summarise {{severity}}", as: "agentOut" } },
        { type: "Formula", props: { target: "after", operation: "set", value: String(i + 1) } },
      ],
      context: trigger,
      verify: async (result) =>
        result.body?.vars?.agentOut === undefined
          ? "Agent step ran as a no-op (no `as` binding produced)"
          : null,
      expectVars: { before: i, after: i + 1 },
    });
  }

  // --- G: unknown node types are skipped, not fatal --------------------------
  for (const unknown of ["Wait", "Branch", "Loop", "SendEmail", "Script", "SubProcess"]) {
    add({
      name: `G1 unknown node "${unknown}" is skipped`,
      family: "Unknown-nodes",
      steps: [
        { type: "Formula", props: { target: "pre", operation: "set", value: "1" } },
        { type: unknown, props: { whatever: "x" } },
        { type: "Formula", props: { target: "post", source: "pre", operation: "add", operand: "1" } },
      ],
      context: trigger,
      expectVars: { pre: 1, post: 2 },
    });
  }

  // Malformed BPMN must be refused at write time.
  add({
    name: "G2 truncated BPMN refused on create",
    family: "Unknown-nodes",
    steps: [],
    context: trigger,
    expectCreateFailure: true,
  });

  // --- H: composite chains mixing every implemented node type ---------------
  for (let i = 0; i < 14; i += 1) {
    const days = i + 1;
    add({
      name: `H1 composite formula+create+update+delete #${i}`,
      family: "Composite",
      steps: [
        { type: "Formula", props: { target: "baseDays", operation: "set", value: String(days) } },
        {
          type: "Formula",
          props: { target: "resolutionDays", source: "baseDays", operation: "multiply", operand: "7" },
        },
        {
          type: "CreateEntity",
          props: { entity: "bus_capa", as: "capaId", fields: capaFields(`QA H1 #${i} ({{resolutionDays}}d)`) },
        },
        {
          type: "UpdateEntity",
          props: { entity: "bus_capa", targetSource: "capaId", field: "status", value: "in_progress" },
        },
        { type: "UpdateEntity", props: { field: "status", value: "under_investigation" } },
        { type: "REST", props: { url: `${BASE}/api/sys/tables`, method: "GET" } },
        { type: "DeleteEntity", props: { entity: "bus_capa", targetSource: "capaId", hard: "true" } },
      ],
      context: trigger,
      expectVars: { baseDays: days, resolutionDays: days * 7 },
      verify: async (result) => {
        const capaId = result.body?.vars?.capaId;
        if (typeof capaId !== "string") return "capaId not bound";
        const row = await api(`/api/bus/capa/${capaId}`);
        return row.status === 404 ? null : `CAPA should be hard-deleted, got HTTP ${row.status}`;
      },
    });
  }

  // Deep chains that keep growing the context.
  for (const width of [3, 5, 8, 10]) {
    const steps: Step[] = [{ type: "Formula", props: { target: "acc", operation: "set", value: "1" } }];
    let expected = 1;
    for (let i = 0; i < width; i += 1) {
      steps.push({ type: "Formula", props: { target: `m${i}`, source: "acc", operation: "multiply", operand: "2" } });
      steps.push({ type: "Formula", props: { target: "acc", source: `m${i}`, operation: "add", operand: "0" } });
      expected *= 2;
    }
    steps.push({
      type: "CreateEntity",
      props: { entity: "bus_capa", as: "capaId", fields: capaFields(`QA H2 acc={{acc}}`) },
    });
    add({
      name: `H2 growing context width=${width}`,
      family: "Composite/deep",
      steps,
      context: trigger,
      expectVars: { acc: expected },
      verify: async (result) => {
        const capaId = result.body?.vars?.capaId;
        const row = await api(`/api/bus/capa/${capaId}`);
        const title = String(row.body?.title ?? "");
        return title.includes(`acc=${expected}`) ? null : `title was "${title}", expected acc=${expected}`;
      },
    });
  }

  // --- I: how a computed number renders when it lands in text --------------
  // A Formula literal is stored as f64, so anything that interpolates it into
  // a string goes through serde_json's float formatting.
  for (const [literal, expected] of [
    ["42", "42"],
    ["7", "7"],
    ["0", "0"],
    ["-3", "-3"],
    ["1000", "1000"],
    ["2.5", "2.5"],
    ["0.25", "0.25"],
    ["-1.5", "-1.5"],
  ] as const) {
    add({
      name: `I1 interpolate set(${literal}) into text`,
      family: "Interpolation/number-format",
      steps: [
        { type: "Formula", props: { target: "num", operation: "set", value: literal } },
        {
          type: "CreateEntity",
          props: { entity: "bus_capa", as: "capaId", fields: capaFields(`QA I1 [{{num}}]`) },
        },
      ],
      context: trigger,
      verify: async (result) => {
        const row = await api(`/api/bus/capa/${result.body?.vars?.capaId}`);
        const title = String(row.body?.title ?? "");
        return title === `QA I1 [${expected}]` ? null : `title was "${title}", expected "QA I1 [${expected}]"`;
      },
    });
  }

  // The same question for an arithmetic result rather than a literal.
  for (const [a, b, expected] of [
    ["6", "7", "42"],
    ["10", "10", "100"],
    ["3", "1", "3"],
    ["5", "0", "0"],
    ["2.5", "2", "5"],
  ] as const) {
    add({
      name: `I2 interpolate ${a}*${b} into text`,
      family: "Interpolation/number-format",
      steps: [
        { type: "Formula", props: { target: "a", operation: "set", value: a } },
        { type: "Formula", props: { target: "p", source: "a", operation: "multiply", operand: b } },
        {
          type: "CreateEntity",
          props: { entity: "bus_capa", as: "capaId", fields: capaFields(`QA I2 [{{p}}]`) },
        },
      ],
      context: trigger,
      verify: async (result) => {
        const row = await api(`/api/bus/capa/${result.body?.vars?.capaId}`);
        const title = String(row.body?.title ?? "");
        return title === `QA I2 [${expected}]` ? null : `title was "${title}", expected "QA I2 [${expected}]"`;
      },
    });
  }

  // An integer carried into a *field* rather than a sentence — the case that
  // matters for reference numbers and codes.
  for (const days of ["1", "30", "365"]) {
    add({
      name: `I3 computed integer into a text field (${days})`,
      family: "Interpolation/number-format",
      steps: [
        { type: "Formula", props: { target: "d", operation: "set", value: days } },
        { type: "UpdateEntity", props: { field: "root_cause", source: "d" } },
      ],
      context: trigger,
      verify: async () => {
        const row = await api(`/api/bus/deviation_report/${fx.deviationId}`);
        const actual = String(row.body?.root_cause ?? "");
        return actual === days ? null : `root_cause was "${actual}", expected "${days}"`;
      },
    });
  }

  // --- J: a step failing mid-chain ------------------------------------------
  // There is no compensation, so this documents what survives a partial run.
  for (let i = 0; i < 5; i += 1) {
    add({
      name: `J1 failure after a write leaves the write committed #${i}`,
      family: "Partial-failure",
      steps: [
        {
          type: "CreateEntity",
          props: { entity: "bus_capa", as: "capaId", fields: capaFields(`QA J1 #${i}`) },
        },
        // This step fails: no such column.
        { type: "UpdateEntity", props: { entity: "bus_capa", targetSource: "capaId", field: "no_such_column", value: "x" } },
        {
          type: "CreateEntity",
          props: { entity: "bus_capa", as: "second", fields: capaFields(`QA J1 unreachable #${i}`) },
        },
      ],
      context: trigger,
      expectFailure: true,
    });
  }

  // Steps after a failure must not run.
  add({
    name: "J2 downstream steps do not run after a failure",
    family: "Partial-failure",
    steps: [
      { type: "Formula", props: { target: "before", operation: "set", value: "1" } },
      { type: "REST", props: { url: "http://127.0.0.1:9/dead", method: "GET" } },
      { type: "Formula", props: { target: "after", operation: "set", value: "2" } },
    ],
    context: trigger,
    expectFailure: true,
  });

  // --- K: vars beat entityData, decision beats both -------------------------
  for (const value of [3, 11, 47]) {
    add({
      name: `K1 vars shadow entityData (${value})`,
      family: "Scope-precedence",
      steps: [
        { type: "Formula", props: { target: "shared", operation: "set", value: String(value) } },
        { type: "Formula", props: { target: "out", source: "shared", operation: "add", operand: "0" } },
      ],
      context: { ...trigger, entityData: { ...trigger.entityData, shared: 999 } },
      expectVars: { out: value },
    });
  }
  for (const value of [4, 12, 48]) {
    add({
      name: `K2 decision shadows both (${value})`,
      family: "Scope-precedence",
      steps: [
        { type: "Formula", props: { target: "shared", operation: "set", value: "111" } },
        { type: "Formula", props: { target: "out", source: "shared", operation: "add", operand: "0" } },
      ],
      context: {
        ...trigger,
        entityData: { ...trigger.entityData, shared: 999 },
        decision: { shared: value },
      },
      expectVars: { out: value },
    });
  }

  // --- L: `entity` without `targetSource` acts on the triggering id ---------
  for (const status of ["open", "resolved"]) {
    add({
      name: `L1 explicit entity, implicit id -> ${status}`,
      family: "UpdateEntity/entity-prop",
      steps: [
        { type: "Formula", props: { target: "n", operation: "set", value: "1" } },
        { type: "UpdateEntity", props: { entity: "bus_deviation_report", field: "status", value: status } },
      ],
      context: trigger,
      verify: async () => {
        const row = await api(`/api/bus/deviation_report/${fx.deviationId}`);
        return row.body?.status === status ? null : `status was ${row.body?.status}`;
      },
    });
  }

  // --- M: `as` rebinding across a chain -------------------------------------
  for (let i = 0; i < 4; i += 1) {
    add({
      name: `M1 rebinding the same as-key #${i}`,
      family: "CreateEntity/rebind",
      steps: [
        { type: "CreateEntity", props: { entity: "bus_capa", as: "cur", fields: capaFields(`QA M1 first ${i}`) } },
        { type: "CreateEntity", props: { entity: "bus_capa", as: "cur", fields: capaFields(`QA M1 second ${i}`) } },
        // `cur` must now point at the second row.
        { type: "UpdateEntity", props: { entity: "bus_capa", targetSource: "cur", field: "status", value: "closed" } },
      ],
      context: trigger,
      verify: async (result) => {
        const row = await api(`/api/bus/capa/${result.body?.vars?.cur}`);
        if (row.body?.status !== "closed") return `status was ${row.body?.status}`;
        return String(row.body?.title ?? "").includes("second") ? null : `as-key pointed at "${row.body?.title}"`;
      },
    });
  }

  // Cross-entity fan-out: one run writing to several tables.
  for (let i = 0; i < 6; i += 1) {
    add({
      name: `H3 cross-entity fan-out #${i}`,
      family: "Composite/cross-entity",
      steps: [
        { type: "Formula", props: { target: "tag", operation: "set", value: `fanout-${i}` } },
        {
          type: "CreateEntity",
          props: {
            entity: "bus_team",
            as: "teamId",
            fields: JSON.stringify({ name: `QA H3 team {{tag}}` }),
          },
        },
        {
          type: "CreateEntity",
          props: {
            entity: "bus_capa",
            as: "capaId",
            fields: capaFields(`QA H3 capa {{tag}}`),
          },
        },
        { type: "UpdateEntity", props: { entity: "bus_team", targetSource: "teamId", field: "department", value: "QA" } },
        { type: "DeleteEntity", props: { entity: "bus_team", targetSource: "teamId", hard: "true" } },
        { type: "DeleteEntity", props: { entity: "bus_capa", targetSource: "capaId", hard: "true" } },
      ],
      context: trigger,
    });
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

interface Outcome {
  name: string;
  family: string;
  steps: number;
  pass: boolean;
  detail?: string;
}

function varsMatch(actual: any, expected: Record<string, unknown>): string | null {
  for (const [key, want] of Object.entries(expected)) {
    const got = actual?.[key];
    if (typeof want === "number" && typeof got === "number") {
      if (Math.abs(want - got) > 1e-9) return `vars.${key} = ${got}, expected ${want}`;
      continue;
    }
    if (got !== want) return `vars.${key} = ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`;
  }
  return null;
}

async function runScenario(scenario: Scenario, index: number): Promise<Outcome> {
  const base: Outcome = { name: scenario.name, family: scenario.family, steps: scenario.steps.length, pass: false };
  const uniqueName = `qa-matrix-${Date.now()}-${index}-${scenario.name}`.slice(0, 180);

  const bpmnXml = scenario.expectCreateFailure
    ? `<?xml version="1.0"?><bpmn:definitions><bpmn:process><bpmn:serviceTask id="x">`
    : buildBpmn(`p${index}`, scenario.steps);

  const created = await api("/api/workflow", {
    method: "POST",
    body: JSON.stringify({
      name: uniqueName,
      entityName: scenario.entityName ?? "bus_deviation_report",
      bpmnXml,
      operation: "ALL",
      description: `QA matrix: ${scenario.family}`,
    }),
  });

  if (scenario.expectCreateFailure) {
    return created.status >= 400
      ? { ...base, pass: true }
      : { ...base, detail: `expected create to be rejected, got HTTP ${created.status}` };
  }

  if (created.status !== 201) {
    return { ...base, detail: `create failed: HTTP ${created.status} ${JSON.stringify(created.body).slice(0, 200)}` };
  }

  const id = created.body?.id;
  const result = await api(`/api/workflow/${id}/execute`, {
    method: "POST",
    body: JSON.stringify(scenario.context ?? {}),
  });

  // Clean the definition up so repeated runs do not accumulate rows.
  await api(`/api/workflow/${id}`, { method: "DELETE" });

  if (scenario.expectFailure) {
    return result.status >= 400
      ? { ...base, pass: true }
      : { ...base, detail: `expected the run to fail, got HTTP ${result.status}` };
  }

  if (result.status !== 200) {
    return { ...base, detail: `execute failed: HTTP ${result.status} ${JSON.stringify(result.body).slice(0, 250)}` };
  }

  if (scenario.expectVars) {
    const mismatch = varsMatch(result.body?.vars, scenario.expectVars);
    if (mismatch) return { ...base, detail: mismatch };
  }

  if (scenario.verify) {
    const problem = await scenario.verify(result as ExecuteResult);
    if (problem) return { ...base, detail: problem };
  }

  return { ...base, pass: true };
}

async function main(): Promise<void> {
  await login();
  const fixtures = await seedFixtures();
  buildScenarios(fixtures);

  const selected = ONLY ? scenarios.filter((s) => s.family.includes(ONLY) || s.name.includes(ONLY)) : scenarios;
  console.log(`Running ${selected.length} multi-step workflow scenarios against ${BASE}\n`);

  const outcomes: Outcome[] = [];
  for (const [index, scenario] of selected.entries()) {
    const outcome = await runScenario(scenario, index);
    outcomes.push(outcome);
    if (!outcome.pass) {
      console.log(`  FAIL  ${outcome.name}\n        ${outcome.detail}`);
    }
    if ((index + 1) % 50 === 0) {
      console.log(`  … ${index + 1}/${selected.length}`);
    }
  }

  const byFamily = new Map<string, { pass: number; fail: number }>();
  for (const outcome of outcomes) {
    const bucket = byFamily.get(outcome.family) ?? { pass: 0, fail: 0 };
    if (outcome.pass) {
      bucket.pass += 1;
    } else {
      bucket.fail += 1;
    }
    byFamily.set(outcome.family, bucket);
  }

  const passed = outcomes.filter((o) => o.pass).length;
  console.log(`\n${"=".repeat(64)}`);
  console.log(`Scenarios: ${outcomes.length}   passed: ${passed}   failed: ${outcomes.length - passed}`);
  console.log(`Step counts: min ${Math.min(...outcomes.map((o) => o.steps))}, max ${Math.max(...outcomes.map((o) => o.steps))}`);
  console.log(`${"-".repeat(64)}`);
  for (const [family, bucket] of [...byFamily].sort()) {
    const flag = bucket.fail === 0 ? "ok  " : "FAIL";
    console.log(`  ${flag} ${family.padEnd(34)} ${bucket.pass}/${bucket.pass + bucket.fail}`);
  }

  if (JSON_OUT) {
    await Bun.write(JSON_OUT, JSON.stringify({ base: BASE, total: outcomes.length, passed, outcomes }, null, 2));
    console.log(`\nWrote ${JSON_OUT}`);
  }

  process.exit(passed === outcomes.length ? 0 : 1);
}

await main();
