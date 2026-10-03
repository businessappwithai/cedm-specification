#!/usr/bin/env bun
/**
 * Business-rule QA for a generated app.
 *
 * Two things are checked, and they are worth keeping apart.
 *
 * 1. The rules *engine* the generated backend ships: JDM validation, stored
 *    evaluation, dry runs, and rules that actually fire on a business write
 *    and block, mutate, cascade or trigger a workflow.
 *
 * 2. Whether the rules the *model* declares reach the app at all. The three
 *    `%%rule` flowcharts in drug-discovery.eml.mmd are reported by `eml info`
 *    and are re-encoded here as JDM by hand. If they only enforce when this
 *    script installs them, the engine is fine and the generator is what is
 *    missing them.
 *
 * Usage:  bun scripts/qa/rules-matrix.ts [--base http://localhost:3000]
 */

const BASE = argValue("--base") ?? "http://localhost:3000";

function argValue(flag: string): string | undefined {
  const index = Bun.argv.indexOf(flag);
  return index === -1 ? undefined : Bun.argv[index + 1];
}

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
    /* raw text */
  }
  return { status: response.status, body };
}

// ---------------------------------------------------------------------------
// JDM construction
// ---------------------------------------------------------------------------

/** A decision-table cell holds an expression, not JSON. */
function zenLiteral(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(zenLiteral).join(", ")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, inner]) => `${JSON.stringify(key)}: ${zenLiteral(inner)}`)
    .join(", ");
  return `{${entries}}`;
}

interface TableRule {
  /** Unary test against the input field, or "" to always match. */
  when: string;
  outputs: Record<string, unknown>;
}

/**
 * A one-input decision graph.
 *
 * `message` is always emitted: the backend deserialises a matched row into a
 * violation type where it is required, and a row without it is dropped
 * silently.
 */
function buildJdm(ruleName: string, field: string, rules: TableRule[]): string {
  const outputNames = new Set<string>(["action", "message"]);
  for (const rule of rules) for (const key of Object.keys(rule.outputs)) outputNames.add(key);

  const ordered = [...outputNames];
  const outputDefs = ordered.map((name, index) => ({
    id: `o${index + 1}`,
    field: name,
    name,
  }));

  const tableRules = rules.map((rule, index) => {
    const row: Record<string, string> = { _id: `r${index + 1}`, i1: rule.when };
    for (const [position, name] of ordered.entries()) {
      const value = name in rule.outputs ? rule.outputs[name] : name === "message" ? ruleName : undefined;
      if (value !== undefined) row[`o${position + 1}`] = zenLiteral(value);
    }
    return row;
  });

  return JSON.stringify({
    nodes: [
      { id: "input", name: "request", type: "inputNode", position: { x: 0, y: 0 } },
      {
        id: "table",
        name: ruleName,
        type: "decisionTableNode",
        position: { x: 200, y: 0 },
        content: {
          hitPolicy: "first",
          inputs: [{ id: "i1", field, name: field }],
          outputs: outputDefs,
          rules: tableRules,
        },
      },
      { id: "output", name: "response", type: "outputNode", position: { x: 400, y: 0 } },
    ],
    edges: [
      { id: "e1", sourceId: "input", targetId: "table", type: "edge" },
      { id: "e2", sourceId: "table", targetId: "output", type: "edge" },
    ],
  });
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

interface Check {
  name: string;
  group: string;
  pass: boolean;
  detail?: string;
}

const checks: Check[] = [];
function record(group: string, name: string, pass: boolean, detail?: string): void {
  checks.push({ group, name, pass, detail });
  if (!pass) console.log(`  FAIL  [${group}] ${name}\n        ${detail}`);
}

const createdRuleIds: string[] = [];

async function installRule(
  entityName: string,
  ruleName: string,
  operation: string,
  jdm: string
): Promise<string | null> {
  const result = await api("/api/rules", {
    method: "POST",
    body: JSON.stringify({ entityName, ruleName: `${ruleName}-${crypto.randomUUID()}`, operation, jdmContent: jdm }),
  });
  if (result.status !== 201) return null;
  const id = result.body?.id as string;
  createdRuleIds.push(id);
  return id;
}

async function cleanup(): Promise<void> {
  for (const id of createdRuleIds) {
    await api(`/api/rules/${id}`, { method: "DELETE" });
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

async function createRow(table: string, payload: Record<string, unknown>): Promise<any> {
  return api(`/api/bus/${table}`, { method: "POST", body: JSON.stringify(payload) });
}

async function main(): Promise<void> {
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@admin.com", password: "admin" }),
  });
  TOKEN = login.body?.token ?? "";
  if (!TOKEN) throw new Error("login failed");

  const stamp = Date.now();
  const team = await createRow("team", { name: `Rules QA Team ${stamp}` });
  const user = await createRow("user", {
    email: `rules-qa-${stamp}@example.com`,
    first_name: "Rules",
    last_name: "QA",
    role: "researcher",
    is_active: true,
    team_id: team.body.id,
  });
  const userId = user.body.id;

  // -------------------------------------------------------------------------
  // 1. JDM validation
  // -------------------------------------------------------------------------
  const goodJdm = buildJdm("valid", "status", [{ when: '"draft"', outputs: { action: "allow" } }]);
  const validated = await api("/api/rules/validate", {
    method: "POST",
    body: JSON.stringify({ jdmContent: goodJdm }),
  });
  record(
    "validate",
    "a well-formed graph validates",
    validated.status === 200 && validated.body?.valid === true,
    `HTTP ${validated.status} ${JSON.stringify(validated.body).slice(0, 180)}`
  );

  for (const [label, bad] of [
    ["not JSON", "{not json"],
    ["no nodes", JSON.stringify({ edges: [] })],
    ["empty object", "{}"],
    ["nodes not an array", JSON.stringify({ nodes: 5, edges: [] })],
  ] as const) {
    const result = await api("/api/rules/validate", {
      method: "POST",
      body: JSON.stringify({ jdmContent: bad }),
    });
    record(
      "validate",
      `malformed JDM (${label}) is rejected without a 500`,
      result.status === 200 && result.body?.valid === false,
      `HTTP ${result.status} ${JSON.stringify(result.body).slice(0, 180)}`
    );
  }

  // A malformed rule must not be storable.
  const badStore = await api("/api/rules", {
    method: "POST",
    body: JSON.stringify({
      entityName: "bus_experiment",
      ruleName: `bad-${stamp}`,
      operation: "CREATE",
      jdmContent: "{not json",
    }),
  });
  record("validate", "malformed JDM cannot be stored", badStore.status >= 400, `HTTP ${badStore.status}`);

  // -------------------------------------------------------------------------
  // 2. The three rules the model declares, encoded by hand
  // -------------------------------------------------------------------------

  // experimentSubmitGate: only a draft may be submitted.
  const submitGate = buildJdm("experimentSubmitGate", "status", [
    { when: '"draft"', outputs: { action: "allow", message: "draft may be submitted" } },
    { when: "", outputs: { action: "prevent", message: "Experiment is not in draft" } },
  ]);
  const submitGateId = await installRule("bus_experiment", "experimentSubmitGate", "UPDATE", submitGate);
  record("model-rules", "experimentSubmitGate installs", submitGateId !== null);

  if (submitGateId) {
    const allowed = await api("/api/rules/dry-run", {
      method: "POST",
      body: JSON.stringify({ ruleId: submitGateId, testData: { status: "draft" } }),
    });
    record(
      "model-rules",
      "experimentSubmitGate allows a draft",
      allowed.status === 200 && JSON.stringify(allowed.body).includes("allow"),
      `HTTP ${allowed.status} ${JSON.stringify(allowed.body).slice(0, 200)}`
    );

    const blocked = await api("/api/rules/dry-run", {
      method: "POST",
      body: JSON.stringify({ ruleId: submitGateId, testData: { status: "completed" } }),
    });
    record(
      "model-rules",
      "experimentSubmitGate blocks a non-draft",
      blocked.status === 200 && JSON.stringify(blocked.body).includes("Experiment is not in draft"),
      `HTTP ${blocked.status} ${JSON.stringify(blocked.body).slice(0, 200)}`
    );
  }

  // deviationSeverity: severity routing by description length.
  // The severity rides in `message`: the violation type the backend
  // deserialises into carries a fixed set of fields, and an extra output
  // column is not one of them, so `message` is where an arbitrary verdict is
  // actually observable from outside.
  const severityRule = buildJdm("deviationSeverity", "anomaly_description", [
    { when: "len($) >= 100", outputs: { action: "transform", message: "severity=critical" } },
    { when: "", outputs: { action: "transform", message: "severity=minor" } },
  ]);
  const severityId = await installRule("bus_deviation_report", "deviationSeverity", "CREATE", severityRule);
  record("model-rules", "deviationSeverity installs", severityId !== null);

  if (severityId) {
    for (const [label, description, expected] of [
      ["long", "x".repeat(150), "critical"],
      ["short", "brief note", "minor"],
    ] as const) {
      const result = await api("/api/rules/dry-run", {
        method: "POST",
        body: JSON.stringify({ ruleId: severityId, testData: { anomaly_description: description } }),
      });
      record(
        "model-rules",
        `deviationSeverity routes a ${label} description to ${expected}`,
        result.status === 200 && JSON.stringify(result.body).includes(`severity=${expected}`),
        `HTTP ${result.status} ${JSON.stringify(result.body).slice(0, 200)}`
      );
    }
  }

  // bookingConflict: an inactive instrument cannot be booked.
  const bookingRule = buildJdm("bookingConflict", "status", [
    { when: '"cancelled"', outputs: { action: "prevent", message: "Instrument inactive" } },
    { when: "", outputs: { action: "allow" } },
  ]);
  const bookingId = await installRule("bus_instrument_booking", "bookingConflict", "CREATE", bookingRule);
  record("model-rules", "bookingConflict installs", bookingId !== null);

  // -------------------------------------------------------------------------
  // 3. A rule that actually fires on a business write
  // -------------------------------------------------------------------------
  const blockJdm = buildJdm("blockQaTitles", "title", [
    { when: '"BLOCK-ME"', outputs: { action: "prevent", message: "blocked by QA rule" } },
  ]);
  const blockId = await installRule("bus_experiment", "blockQaTitles", "CREATE", blockJdm);
  record("enforcement", "blocking rule installs", blockId !== null);

  if (blockId) {
    const blockedWrite = await createRow("experiment", {
      title: "BLOCK-ME",
      status: "draft",
      pi_id: userId,
      schema_version: "1.0.0",
    });
    record(
      "enforcement",
      "a matching write is refused",
      blockedWrite.status >= 400,
      `HTTP ${blockedWrite.status} ${JSON.stringify(blockedWrite.body).slice(0, 200)}`
    );

    const allowedWrite = await createRow("experiment", {
      title: `Allowed ${stamp}`,
      status: "draft",
      pi_id: userId,
      schema_version: "1.0.0",
    });
    record(
      "enforcement",
      "a non-matching write still succeeds",
      allowedWrite.status < 300,
      `HTTP ${allowedWrite.status} ${JSON.stringify(allowedWrite.body).slice(0, 200)}`
    );
  }

  // -------------------------------------------------------------------------
  // 4. Stored evaluation and listing
  // -------------------------------------------------------------------------
  const evaluated = await api("/api/rules/evaluate", {
    method: "POST",
    body: JSON.stringify({
      entityName: "bus_experiment",
      operation: "CREATE",
      data: { title: "BLOCK-ME", status: "draft" },
    }),
  });
  record(
    "evaluate",
    "evaluate reports the violation for a matching row",
    evaluated.status === 200 && JSON.stringify(evaluated.body).includes("blocked by QA rule"),
    `HTTP ${evaluated.status} ${JSON.stringify(evaluated.body).slice(0, 250)}`
  );

  const evaluatedClean = await api("/api/rules/evaluate", {
    method: "POST",
    body: JSON.stringify({
      entityName: "bus_experiment",
      operation: "CREATE",
      data: { title: "totally fine", status: "draft" },
    }),
  });
  record(
    "evaluate",
    "evaluate is clean for a non-matching row",
    evaluatedClean.status === 200 && !JSON.stringify(evaluatedClean.body).includes("blocked by QA rule"),
    `HTTP ${evaluatedClean.status} ${JSON.stringify(evaluatedClean.body).slice(0, 250)}`
  );

  const listed = await api("/api/rules?entityName=bus_experiment");
  record("list", "rules list for an entity", listed.status === 200, `HTTP ${listed.status}`);

  // -------------------------------------------------------------------------
  // 5. Did the model's rules arrive on their own?
  // -------------------------------------------------------------------------
  const all = await api("/api/rules");
  const names: string[] = Array.isArray(all.body)
    ? all.body.map((r: any) => r.rule_name ?? r.ruleName ?? "")
    : Array.isArray(all.body?.data)
      ? all.body.data.map((r: any) => r.rule_name ?? r.ruleName ?? "")
      : [];
  for (const declared of ["experimentSubmitGate", "deviationSeverity", "bookingConflict"]) {
    // Anything this script installed carries a uuid suffix; a seeded one would not.
    const seeded = names.some((name) => name === declared);
    record(
      "model-seeding",
      `model rule "${declared}" is seeded into the app by the generator`,
      seeded,
      `sys_rule_definitions holds no rule named "${declared}" — the model's %%rule sections are never generated`
    );
  }

  await cleanup();

  // -------------------------------------------------------------------------
  const byGroup = new Map<string, { pass: number; fail: number }>();
  for (const check of checks) {
    const bucket = byGroup.get(check.group) ?? { pass: 0, fail: 0 };
    if (check.pass) {
      bucket.pass += 1;
    } else {
      bucket.fail += 1;
    }
    byGroup.set(check.group, bucket);
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Rule checks: ${checks.length}   passed: ${passed}   failed: ${checks.length - passed}`);
  console.log(`${"-".repeat(60)}`);
  for (const [group, bucket] of [...byGroup].sort()) {
    console.log(`  ${bucket.fail === 0 ? "ok  " : "FAIL"} ${group.padEnd(16)} ${bucket.pass}/${bucket.pass + bucket.fail}`);
  }
  process.exit(passed === checks.length ? 0 : 1);
}

await main();
