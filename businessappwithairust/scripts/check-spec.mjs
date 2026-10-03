/**
 * check-spec.mjs — verify the published protocol documents against the
 * published validator.
 *
 * Two claims the specification makes about itself, both mechanical:
 *
 *   1. "Every complete example in this document is a model that the validator
 *      accepts with zero errors and zero warnings" (the file's own header).
 *   2. Every type alias, flag, cardinality pair, hook event, action type, step
 *      contract, state-machine code, access rule and dictionary derivation it
 *      documents behaves the way it says (sections 3 to 8).
 *
 * No dependencies, no build step: it imports guide/model-yaml.js, which is the
 * same reader, schema, checker and fixer the command line runs, and for the
 * dictionary claims assets/js/appwithai-loco.js, the platform's own generator
 * bundled for the browser — the one the deployable download runs.
 *
 * A probe is built as data and serialised as JSON, which is a YAML document the
 * reader accepts as it stands — so each one states exactly the construct under
 * test and nothing a hand-written string could get subtly wrong.
 *
 *   node scripts/check-spec.mjs
 */
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validate, fix, LANGUAGE_VERSION } from "../guide/model-yaml.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const validatorSource = readFileSync(root + "guide/model-yaml.js", "utf8");

/* The fixer's own set, read out of the published module rather than restated:
   the module does not export it, and a list written here would be a second
   statement of a fact the module already makes. */
const fixableMatch = /var AUTO_FIXABLE_CODES = new Set\(\[([^\]]*)\]\)/.exec(validatorSource);
if (!fixableMatch) throw new Error("model-yaml.js no longer declares AUTO_FIXABLE_CODES");
const AUTO_FIXABLE = [...fixableMatch[1].matchAll(/"(EML\d{3})"/g)].map((m) => m[1]);

/* ---------------------------------------------- 1. the document's examples */

const specText = readFileSync(root + "llms-full.txt", "utf8");
const spec = specText.split("\n");

/** Every ```yaml fence that states a complete model — one that opens `eml:`. */
function completeModels(text) {
  const out = [];
  const fence = /```yaml\n([\s\S]*?)```/g;
  for (let m = fence.exec(text); m; m = fence.exec(text)) {
    if (/^eml:\s*"1\.0"/m.test(m[1])) out.push({ line: text.slice(0, m.index).split("\n").length + 1, src: m[1] });
  }
  return out;
}

/* The interactive protocol's Phase 3 seed declares every entity before any
   field has been walked; its text says to expect one EML125 per relationship
   and nothing else, so that is what it is held to. Recognised by its first
   line, never by position. */
const SEED = "# Phase 3 seed:";

let exampleFailures = 0;
let exampleCount = 0;
for (const [file, text] of [
  ["llms-full.txt", specText],
  ["llmdetailed.txt", readFileSync(root + "llmdetailed.txt", "utf8")],
  ["llmtextenhancement.txt", readFileSync(root + "llmtextenhancement.txt", "utf8")],
  ["llmdetailedenhancement.txt", readFileSync(root + "llmdetailedenhancement.txt", "utf8")],
]) {
  for (const block of completeModels(text)) {
    exampleCount++;
    const result = validate(block.src);
    const codes = result.diagnostics.map((d) => d.code);
    const relationships = result.document?.relationships?.length ?? 0;
    const clean = block.src.startsWith(SEED)
      ? result.ok && relationships > 0 && codes.length === relationships && codes.every((c) => c === "EML125")
      : result.ok && codes.length === 0;
    if (!clean) {
      exampleFailures++;
      console.log(`FAIL  ${file}: model at line ${block.line}`);
      for (const d of result.diagnostics) console.log(`        ${d.severity} ${d.code} ${d.line}:${d.column} — ${d.message}`);
    }
  }
}
console.log(`${exampleCount} complete models across the four documents, ${exampleFailures} not clean`);

/* ------------------------------------------- 2. the claims it makes in prose */
let pass = 0, fail = 0;

/*
 * The probes below are synthetic, built to ask one question each: does
 * `varchar` alias to `string`, is `beforeUpdate` a hook event, is
 * `zero-or-one`/`zero-or-more` a pair the language defines. They carry no help
 * text, so EML151-EML153 fire on every one of them and say nothing about the
 * claim being tested. They are excluded here and nowhere else: the authored
 * examples above are still held to zero diagnostics, help included, because
 * those are what a reader copies.
 */
const HELP_CODES = new Set(["EML151", "EML152", "EML153"]);
const substantive = (diagnostics) => diagnostics.filter((d) => !HELP_CODES.has(d.code));

/** A probe: `expect` is "clean", or the code that must be reported. */
const t = (name, doc, expect = "clean") => {
  const r = validate(typeof doc === "string" ? doc : JSON.stringify(doc, null, 2));
  const found = substantive(r.diagnostics);
  const bad = expect === "clean"
    ? !r.ok || found.some((d) => d.severity !== "info")
    : !r.diagnostics.some((d) => d.code === expect);
  if (bad) {
    fail++;
    console.log(`FAIL ${name} -> ${r.diagnostics.map((d) => `${d.severity} ${d.code}: ${d.message}`).slice(0, 3).join(" | ")}`);
  } else pass++;
};
const say = (cond, label) => { if (cond) pass++; else { fail++; console.log("FAIL  " + label); } };

const key = { name: "id", type: "uuid", pk: true };
const thing = (...attributes) => ({ name: "Thing", attributes: [key, ...attributes] });
const model = (parts) => ({ eml: "1.0", name: "Audit", ...parts });

// --- 1. version and auto-fixable list (header + §8.3) -----------------------
const expectedFixable = ["EML001", "EML103", "EML112", "EML114", "EML117", "EML287", "EML421", "EML422"];
say(LANGUAGE_VERSION === "2.0.0", `the validator reports language version 2.0.0 (it says ${LANGUAGE_VERSION})`);
say(specText.includes(`**Language version**: ${LANGUAGE_VERSION}`),
  `the header states the language version the validator reports (${LANGUAGE_VERSION})`);
say(AUTO_FIXABLE.join(",") === expectedFixable.join(","),
  `section 8.3 lists every auto-repair (the fixer says ${AUTO_FIXABLE.join(", ")})`);
/* The heading counts them in words, so it goes stale silently otherwise. */
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const countWord = NUMBER_WORDS[AUTO_FIXABLE.length] ?? String(AUTO_FIXABLE.length);
say(specText.includes(`### 8.3 The ${countWord} auto-repairs`),
  `section 8.3's heading names the right number (expected "${countWord}")`);
for (const code of AUTO_FIXABLE)
  say(new RegExp(`^\\| \`${code}\` \\|.*\\|$`, "m").test(specText), `section 8.3's table carries a row for ${code}`);

// --- 2. §3.2 types: every alias the document lists is accepted --------------
const ALIASES = {
  string: ["string", "varchar", "char", "uuid", "guid", "id", "email", "url", "phone", "password", "color"],
  text: ["text", "longtext"],
  integer: ["int", "integer", "bigint", "smallint"],
  decimal: ["number", "decimal", "float", "double", "money", "amount"],
  boolean: ["bool", "boolean"],
  date: ["date"],
  datetime: ["datetime", "timestamp", "time"],
  json: ["json", "jsonb", "object", "array"],
};
for (const [canon, aliases] of Object.entries(ALIASES)) {
  for (const alias of aliases) {
    t(`type alias ${alias} (${canon})`, model({ entities: [thing({ name: "col_a", type: alias })] }));
    say(new RegExp(`\\|[^\\n]*\`${alias}\``).test(specText), `section 3.2 lists the alias ${alias}`);
  }
}
t("a length follows the type", model({ entities: [thing({ name: "col_a", type: "string(120)" })] }));
t("an unknown type is EML115", model({ entities: [thing({ name: "col_a", type: "varchr" })] }), "EML115");

// --- 3. §3.3 flags ----------------------------------------------------------
t("flags pk, fk, unique and optional", model({
  entities: [
    { name: "Other", attributes: [key] },
    thing({ name: "other_id", type: "uuid", fk: true }, { name: "code", type: "string", unique: true },
      { name: "note", type: "string", optional: true }),
  ],
  relationships: [{ from: "Other", fromCardinality: "exactly-one", to: "Thing", toCardinality: "zero-or-more" }],
}));
t("a flag the language does not have is refused by the schema",
  model({ entities: [thing({ name: "col_a", type: "string", uniqe: true })] }), "SCHEMA");
t("two primary keys are EML113", model({ entities: [thing({ name: "code", type: "string", pk: true })] }), "EML113");

// --- 4. §3.4 the eight cardinality pairs ------------------------------------
const PAIRS = [
  ["exactly-one", "exactly-one"], ["zero-or-one", "zero-or-one"], ["exactly-one", "zero-or-more"],
  ["exactly-one", "one-or-more"], ["zero-or-more", "exactly-one"], ["one-or-more", "exactly-one"],
  ["zero-or-more", "zero-or-more"], ["one-or-more", "one-or-more"],
];
const related = (from, to) => model({
  entities: [{ name: "Alpha", attributes: [key] },
    { name: "Beta", attributes: [key, { name: "alpha_id", type: "uuid", fk: true }] }],
  relationships: [{ from: "Alpha", fromCardinality: from, to: "Beta", toCardinality: to }],
});
for (const [from, to] of PAIRS) {
  const r = validate(JSON.stringify(related(from, to)));
  say(r.ok && !r.diagnostics.some((d) => d.code === "SCHEMA"), `cardinality pair ${from}/${to} is a relationship`);
  say(new RegExp(`\\| \`${from}\` \\| \`${to}\` \\|`).test(specText), `section 3.4 tabulates ${from}/${to}`);
}
t("a pair outside those eight is refused by the schema", related("zero-or-one", "zero-or-more"), "SCHEMA");

// --- 5. §5.1 the thirteen hook events ---------------------------------------
const HOOKS = ["beforeCreate", "afterCreate", "beforeUpdate", "afterUpdate", "beforeDelete", "afterDelete",
  "beforeRead", "afterRead", "beforeList", "afterList", "beforeQuery", "afterQuery", "customValidate"];
for (const event of HOOKS) {
  t(`hook event ${event}`, model({
    entities: [thing({ name: "name", type: "string" })],
    hooks: [{ entity: "Thing", event, handler: "handlerName", fields: ["name"] }],
  }));
  say(specText.includes(`\`${event}\``), `section 5.1 names the hook event ${event}`);
}
t("a hook event outside the thirteen is refused", model({
  entities: [thing({ name: "name", type: "string" })],
  hooks: [{ entity: "Thing", event: "beforeSave", handler: "handlerName" }],
}), "SCHEMA");

// --- 6. §4 the three action types --------------------------------------------
const ruleWith = (action, sagas = []) => model({
  entities: [thing({ name: "name", type: "string" })],
  rules: [{
    name: "auditRule", entity: "Thing", event: "beforeCreate", priority: 10,
    nodes: [
      { id: "A", label: "Start", type: "start" },
      { id: "B", label: 'name == "x"?', type: "decision" },
      { id: "C", label: "Do it", type: "expression" },
      { id: "Z", label: "End", type: "end" },
    ],
    edges: [{ from: "A", to: "B" }, { from: "B", to: "C", label: "Yes" }, { from: "B", to: "Z", label: "No" }, { from: "C", to: "Z" }],
    actions: [action],
  }],
  sagas,
});
const stampSaga = [{ name: "AuditSaga", entity: "Thing", trigger: "rule",
  steps: [{ id: "U", type: "UpdateEntity", label: "Stamp it", properties: { field: "name", value: "stamped" } }] }];
t("action trigger-workflow", ruleWith({ name: "doIt", type: "trigger-workflow", when: 'name == "x"', props: { workflow: "AuditSaga", message: "go" } }, stampSaga));
t("action validation-error", ruleWith({ name: "doIt", type: "validation-error", when: 'name == "x"', props: { message: "nope" } }));
t("action transform", ruleWith({ name: "doIt", type: "transform", when: 'name == "x"', props: { field: "name", value: "y", message: "ok" } }));
for (const type of ["trigger-workflow", "validation-error", "transform"])
  say(specText.includes(`\`${type}\``), `section 4 names the action type ${type}`);
t("a camelCase condition is EML287", ruleWith({ name: "doIt", type: "validation-error", when: 'fullName == "x"', props: { message: "nope" } }), "EML287");
t("a rule-triggered saga no rule names is EML286", model({ entities: [thing({ name: "name", type: "string" })], sagas: stampSaga }), "EML286");

// --- 7. §5.3 the saga step types --------------------------------------------
const saga = (step) => model({
  entities: [
    thing({ name: "name", type: "string" }, { name: "qty", type: "integer" }),
    { name: "Other", attributes: [key, { name: "thing_id", type: "uuid", fk: true }, { name: "name", type: "string" }] },
  ],
  relationships: [{ from: "Thing", fromCardinality: "exactly-one", to: "Other", toCardinality: "zero-or-more" }],
  sagas: [{ name: "AuditSaga", entity: "Thing", steps: Array.isArray(step) ? step : [step] }],
});
const step = (type, properties, id = "B") => ({ id, type, label: type, properties });
t("step CreateEntity", saga(step("CreateEntity", { entity: "Other", as: "newOtherId", fields: '{"thing_id":"id","name":"name"}' })));
t("step UpdateEntity", saga(step("UpdateEntity", { field: "name", value: "stamped" })));
t("step DeleteEntity", saga(step("DeleteEntity", { entity: "Other", targetField: "thing_id" })));
t("step Formula multiply", saga(step("Formula", { target: "doubled", source: "qty", operation: "multiply", operand: "2" })));
t("step Formula set", saga(step("Formula", { target: "label", operation: "set", value: "hello" })));
t("step Formula copy", saga(step("Formula", { target: "copied", operation: "copy", source: "name" })));
t("step Decision with an inline table", saga(step("Decision", { decisionTable:
  '{"hitPolicy":"first","inputs":[{"id":"i1","name":"Qty","field":"qty"}],"outputs":[{"id":"o1","name":"Band","field":"band"}],"rules":[{"_id":"hi","i1":"> 10","o1":"\'high\'"},{"_id":"rest","i1":"","o1":"\'low\'"}]}' })));
t("step REST", saga(step("REST", { method: "POST", url: "https://hooks.example.com/notify" })));
t("step Agent with an agentId", saga(step("Agent", { agentId: "triage-v1" })));
t("step Agent without an agentId is EML262", saga(step("Agent", {})), "EML262");
for (const type of ["CreateEntity", "UpdateEntity", "DeleteEntity", "Formula", "Decision", "REST", "Agent"])
  say(specText.includes(`\`${type}\``), `section 5.3 names the step type ${type}`);

// §5.3 — UpdateEntity naming another entity must say which row (EML265).
const created = step("CreateEntity", { entity: "Other", as: "newOtherId", fields: '{"thing_id":"id","name":"name"}' });
t("UpdateEntity on another entity with no target is EML265", saga([created, step("UpdateEntity", { entity: "Other", field: "name", value: "x" }, "C")]), "EML265");
t("UpdateEntity reading back an earlier step's id", saga([created, step("UpdateEntity", { entity: "Other", targetSource: "newOtherId", field: "name", value: "x" }, "C")]));
t("UpdateEntity matching a foreign key", saga([created, step("UpdateEntity", { entity: "Other", targetField: "thing_id", field: "name", value: "x" }, "C")]));
t("UpdateEntity on the triggering record names no entity", saga([created, step("UpdateEntity", { field: "name", value: "x" }, "C")]));

// --- 8. §5.2 state machines --------------------------------------------------
const lifecycle = (machine, values = ["draft", "live", "done"], column = "status") => model({
  enums: values ? [{ name: "ThingStatus", values }] : undefined,
  entities: [thing({ name: column, type: "string", ...(values ? { enum: "ThingStatus" } : {}) })],
  stateMachines: [{ name: "ThingLifecycle", entity: "Thing", ...machine }],
});
const edges = [{ from: "draft", to: "live", trigger: "publish" }, { from: "live", to: "done", trigger: "finish" }];
t("a state machine with its enum, an initial and a final state",
  lifecycle({ states: ["draft", "live", "done"], initial: "draft", final: ["done"], transitions: edges }));
t("no initial state is EML421", lifecycle({ states: ["draft", "live", "done"], final: ["done"], transitions: edges }), "EML421");
t("no final state is EML422", lifecycle({ states: ["draft", "live", "done"], initial: "draft", transitions: edges }), "EML422");
const archived = { states: ["draft", "live", "archived"], initial: "draft", final: ["archived"],
  transitions: [{ from: "draft", to: "live", trigger: "publish" }, { from: "live", to: "archived", trigger: "archive" }] };
t("a state missing from the bound enum is EML426", lifecycle(archived), "EML426");
t("an enum value no state uses is EML427", lifecycle(archived), "EML427");
t("a machine whose column has no enum is EML428",
  lifecycle({ states: ["draft", "live", "done"], initial: "draft", final: ["done"], transitions: edges }, null), "EML428");
t("a lifecycle column called approval_status is EML500",
  lifecycle({ states: ["draft", "live", "done"], initial: "draft", final: ["done"], transitions: edges }, ["draft", "live", "done"], "approval_status"), "EML500");

// --- 9. §6 access control -----------------------------------------------------
const governed = (rbac) => ({ ...lifecycle({ states: ["draft", "live", "done"], initial: "draft", final: ["done"], transitions: edges }), rbac });
t("rbac on a transition", governed([{ entity: "Thing", action: "publish", roles: ["editor", "admin"] }]));
t("rbac on a CRUD operation", governed([{ entity: "Thing", action: "read", roles: ["editor"] }]));
t("rbac on an action the entity does not have is EML214", governed([{ entity: "Thing", action: "teleport", roles: ["editor"] }]), "EML214");
t("rbac naming an undeclared entity is EML213", governed([{ entity: "Nowhere", action: "read", roles: ["editor"] }]), "EML213");

// --- 10. §3.6 enums, indexes and categories --------------------------------
t("enum, binding, index and category", model({
  enums: [{ name: "ThingStatus", values: ["draft", "live"] }],
  categories: [{ name: "Core", description: "The things", icon: "box", entities: ["Thing"] }],
  entities: [{ ...thing({ name: "status", type: "string", enum: "ThingStatus" }, { name: "code", type: "string" }),
    indexes: [{ columns: ["status"] }, { columns: ["code"], unique: true }] }],
}));
t("a column naming an undeclared enum is EML144",
  model({ entities: [thing({ name: "status", type: "string", enum: "Nowhere" })] }), "EML144");
t("an index on a column the entity lacks is EML155",
  model({ entities: [{ ...thing({ name: "code", type: "string" }), indexes: [{ columns: ["missing"] }] }] }), "EML155");

// --- 11. §3.5 foreign keys and person columns -------------------------------
const person = (column, related = true) => model({
  entities: [
    { name: "User", attributes: [key, { name: "full_name", type: "string" }] },
    thing({ name: column, type: "uuid", fk: true }, { name: "name", type: "string" }),
  ],
  relationships: related ? [{ from: "User", fromCardinality: "exactly-one", to: "Thing", toCardinality: "zero-or-more" }] : [],
});
for (const column of ["approved_by_id", "created_by_id", "owner_id", "user_id", "manager_id"])
  t(`person column ${column} resolves to User`, person(column));
t("an fk column not ending _id is EML114", person("assigned_to"), "EML114");
t("a reference with no relationship behind it is EML502", person("approver_id", false), "EML502");
t("a one-to-many with no foreign key on its many side is EML125", model({
  entities: [{ name: "Alpha", attributes: [key] }, { name: "Beta", attributes: [key] }],
  relationships: [{ from: "Alpha", fromCardinality: "exactly-one", to: "Beta", toCardinality: "zero-or-more" }],
}), "EML125");

// --- 12. §3.5.1 line items --------------------------------------------------
const invoice = (child, categories) => model({
  entities: [{ name: "Invoice", attributes: [key, { name: "number", type: "string" }] },
    { name: "InvoiceLine", ...child, attributes: [key, { name: "invoice_id", type: "uuid", fk: true }, { name: "amount", type: "money" }] }],
  relationships: [{ from: "Invoice", fromCardinality: "exactly-one", to: "InvoiceLine", toCardinality: "one-or-more" }],
  categories,
});
t("a line item declared with parent", invoice({ parent: "Invoice" }));
t("a line-item shape with no parent is EML149", invoice({}), "EML149");
t("a declared child in a category is EML150", invoice({ parent: "Invoice" }, [{ name: "Billing", entities: ["Invoice", "InvoiceLine"] }]), "EML150");
t("a parent the model does not declare is EML147", invoice({ parent: "Receipt" }), "EML147");

// --- 13. §2 the document --------------------------------------------------------
t("a paragraph is not a model", "The application manages orders and their lines, from draft to closed.\n", "SCHEMA");
t("a model with no entities is refused", 'eml: "1.0"\nname: Orders\n', "SCHEMA");
t("Markdown is not YAML", "## Entities\n- Order: the customer's order. Fields: id, status, total.\n\n## Lifecycle\ndraft → submitted\n", "YAML");
t("a model with no name is EML001", { eml: "1.0", entities: [thing({ name: "name", type: "string" })] }, "EML001");
t("a key the language does not have is refused", { ...model({ entities: [thing()] }), diagram: "Thing" }, "SCHEMA");

console.log(`${pass} claims verified, ${fail} contradicted`);

/* ------------- 3. §3.7: what the Application Dictionary makes of the model -- */

/* These claims are about the generated application, so they are tested against
   the generator that builds it: assets/js/appwithai-loco.js, the platform's own
   pipeline bundled for the browser, which is what the deployable download runs.
   The dictionary is read out of the seed it writes, backend/seed/dictionary.sql,
   the rows the running application reads. The model goes through the viewers'
   reader first, as the page's download does. */
const claimsBefore = pass;
const failuresBefore = fail;
const { compileForBrowser } = await import("../viewers/appwithai-model.js");
const { generateLocoApplication } = await import("../assets/js/appwithai-loco.js");
const locoAssets = JSON.parse(readFileSync(root + "assets/vendor/loco-assets.json", "utf8"));
const REFERENCE = { 10: "String", 12: "Amount", 13: "ID", 14: "Text", 15: "Date", 16: "DateTime",
  19: "Table Direct", 20: "Yes-No", 24: "URL", 27: "Color", 28: "JSON", 29: "Password", 30: "Email", 31: "Phone" };

/** The rows of every `INSERT INTO <table> (…) VALUES (…)` in a seed, as objects. */
function seedRows(sql, table) {
  const out = [];
  const insert = new RegExp(`INSERT INTO ${table} \\(([^)]*)\\)\\s*VALUES \\(`, "g");
  for (let m = insert.exec(sql); m; m = insert.exec(sql)) {
    const columns = m[1].split(",").map((c) => c.trim());
    const values = [];
    let current = "";
    let depth = 0;
    for (let i = insert.lastIndex; i < sql.length; i++) {
      const ch = sql[i];
      if (ch === "'" && current !== null) {
        let j = i + 1;
        let literal = "";
        for (; j < sql.length; j++) {
          if (sql[j] === "'" && sql[j + 1] === "'") { literal += "'"; j++; }
          else if (sql[j] === "'") break;
          else literal += sql[j];
        }
        values.push(literal);
        current = null;
        i = j;
        continue;
      }
      if (ch === "(") depth++;
      if (ch === ")" && depth === 0) { if (current !== null && current.trim() !== "") values.push(current.trim()); break; }
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) { if (current !== null) values.push(current.trim()); current = ""; continue; }
      if (current !== null) current += ch;
    }
    out.push(Object.fromEntries(columns.map((column, k) => [column, values[k] === "NULL" ? null : values[k]])));
  }
  return out;
}

async function generate(doc) {
  const text = JSON.stringify(doc, null, 2);
  const compiled = compileForBrowser(text);
  if (!compiled.ok) throw new Error(`probe does not compile: ${JSON.stringify(compiled.diagnostics?.slice(0, 2))}`);
  const log = console.log;
  console.log = () => {};
  let app;
  try {
    app = await generateLocoApplication({ document: compiled.document, modelText: text, name: "probe", assets: locoAssets });
  } finally {
    console.log = log;
  }
  const sql = app.files.get("backend/seed/dictionary.sql");
  const tables = seedRows(sql, "sys_table");
  const tableName = new Map(tables.map((t) => [t.sys_table_id, t.table_name]));
  return {
    tables: tables.map((t) => ({ tableName: t.table_name, description: t.description })),
    columns: seedRows(sql, "sys_column").map((c) => ({
      tableName: tableName.get(c.sys_table_id),
      columnName: c.column_name,
      referenceId: Number(c.sys_reference_id),
      isIdentifier: c.is_identifier === "TRUE",
      description: c.description,
      seqNo: Number(c.seq_no),
    })),
  };
}

const reference = async (label, attribute, expected) => {
  const built = await generate(model({
    enums: [{ name: "OrderStatus", values: ["draft", "placed", "shipped"] }],
    entities: [{ name: "Vendor", attributes: [key, { name: "name", type: "string" }] },
      { name: "Order", attributes: [key, attribute] }],
    relationships: [{ from: "Vendor", fromCardinality: "exactly-one", to: "Order", toCardinality: "zero-or-more" }],
  }));
  const got = built.columns.find((c) => c.tableName === "bus_order" && c.columnName === attribute.name)?.referenceId;
  const shown = REFERENCE[got] ?? (got >= 1000 ? "List" : got);
  if (shown === expected) pass++;
  else { fail++; console.log(`FAIL ${label} — expected ${expected}, dictionary recorded ${shown}`); }
};

await reference("fk: true on a resolving name makes a Table Direct lookup", { name: "vendor_id", type: "uuid", fk: true }, "Table Direct");
await reference("the same column without fk is downgraded to String", { name: "vendor_id", type: "uuid" }, "String");
await reference("a status column bound to an enum becomes a List", { name: "status", type: "string", enum: "OrderStatus" }, "List");
await reference("an unbound status column is free text", { name: "status", type: "string" }, "String");
await reference("the email alias reaches the dictionary", { name: "contact_email", type: "email" }, "Email");
await reference("the phone alias reaches the dictionary", { name: "contact_phone", type: "phone" }, "Phone");
await reference("the url alias reaches the dictionary", { name: "tracking_link", type: "url" }, "URL");
await reference("the password alias reaches the dictionary", { name: "portal_secret", type: "password" }, "Password");
await reference("the color alias reaches the dictionary", { name: "label_colour", type: "color" }, "Color");
/* All five normalise to `string`, so this is what proves the alias is what the
   dictionary reads and not the column's name. */
await reference("a string column named like an alias is not one", { name: "password_hint", type: "string" }, "String");
await reference("text becomes a memo", { name: "notes", type: "text" }, "Text");
await reference("boolean becomes Yes-No", { name: "is_rush", type: "boolean" }, "Yes-No");
await reference("money becomes an Amount", { name: "total", type: "money" }, "Amount");
await reference("json becomes a JSON editor", { name: "payload", type: "json" }, "JSON");

/* The two downgrades are diagnostics (EML119, EML146), warnings and not
   errors: the generator still runs, which is exactly why §3.7 calls them
   mandatory. */
const downgraded = validate(JSON.stringify(model({
  entities: [{ name: "Vendor", attributes: [key] },
    { name: "Order", attributes: [key, { name: "vendor_id", type: "uuid" }, { name: "status", type: "string" }] }],
  relationships: [{ from: "Vendor", fromCardinality: "exactly-one", to: "Order", toCardinality: "zero-or-more" }],
})));
for (const code of ["EML119", "EML146"])
  say(downgraded.diagnostics.some((d) => d.code === code && d.severity === "warning"), `the validator reports ${code} as a warning`);
say(downgraded.ok, "both downgrades leave the model accepted — the generator still runs");
for (const code of ["EML119", "EML146", "EML151", "EML152", "EML153"])
  say(new RegExp(`^\\| \`${code}\` \\|`, "m").test(specText), `section 3.7's mandatory table carries ${code}`);

/* §3.1: the columns the generator adds are its own, and declaring one is
   reported rather than carried into a CREATE TABLE that PostgreSQL refuses. */
for (const column of ["created_at", "updated_at", "version", "deleted_by"])
  t(`declaring ${column} is EML103`, model({ entities: [thing({ name: column, type: "datetime" })] }), "EML103");
t("a column the generator does not manage stays quiet", model({ entities: [thing({ name: "started_at", type: "datetime" })] }));

/* §8.3: both duplicate faults are repaired, and the repair keeps the stronger
   declaration rather than whichever came last. */
{
  const duplicated = JSON.stringify(model({ entities: [{ name: "Course", attributes: [key,
    { name: "title", type: "string" }, { name: "title", type: "string", optional: true },
    { name: "code", type: "string", optional: true }, { name: "code", type: "string", unique: true },
    { name: "created_at", type: "datetime" }] }] }), null, 2);
  const repaired = fix(duplicated);
  say(repaired.applied.some((a) => a.code === "EML112") && repaired.applied.some((a) => a.code === "EML103"),
    "fix repairs a duplicated column and a managed one");
  const after = validate(repaired.text);
  say(after.ok && !substantive(after.diagnostics).some((d) => d.severity === "warning"),
    "the repaired document is clean, help codes aside");
  const course = after.document.entities[0].attributes;
  const titles = course.filter((a) => a.name === "title");
  const code = course.find((a) => a.name === "code");
  say(titles.length === 1, "the duplicate title is gone");
  say(titles[0] && !titles[0].optional, "title stayed required — optional did not win");
  say(code?.unique === true, "code kept the unique the second declaration promised");
  say(!course.some((a) => a.name === "created_at"), "the generator's own created_at was removed");
}
{
  /* EML117 fires only where the generator cannot add its own key: an entity that
     declares `id` or a `*_id` column and marks nothing as the key. */
  const keyless = (attributes) => fix('# the owner of the record\neml: "1.0"\nname: Audit\nentities:\n  - name: Thing\n    attributes:\n'
    + attributes.map((a) => `      - ${a}\n`).join(""));
  const added = keyless(["{ name: owner_id, type: uuid }  # who owns it", "{ name: name, type: string }"]);
  const key = validate(added.text).document.entities[0].attributes.find((a) => a.pk);
  say(added.applied.some((a) => a.code === "EML117") && key?.name === "id" && key?.type === "uuid",
    `EML117 adds id as a uuid primary key, as section 8.3 says (${JSON.stringify(key)})`);
  say(added.text.includes("# who owns it") && added.text.startsWith("# the owner of the record"),
    "fix keeps the document's comments, as section 8.1 says");
  const marked = keyless(["{ name: id, type: uuid }", "{ name: name, type: string }"]);
  const existing = validate(marked.text).document.entities[0].attributes.filter((a) => a.pk);
  say(existing.length === 1 && existing[0].name === "id", "EML117 marks an existing id column as the key rather than adding a second");
  const implied = validate('eml: "1.0"\nname: Audit\nentities:\n  - name: Thing\n    attributes:\n      - { name: name, type: string }\n');
  say(!implied.diagnostics.some((d) => d.code === "EML117"), "an entity with no id-shaped column is given the generator's own key, unreported");
}

/* §3.7: what a reference shows in place of its uuid — the dictionary's
   identifier columns. Asserted against the generator rather than the prose,
   because the table in the spec is a promise about behaviour. */
const identifiersOf = async (attributes, extraEntities = []) => {
  const built = await generate(model({
    entities: [...extraEntities, { name: "Thing", attributes: [key, ...attributes] }],
    relationships: attributes.filter((a) => a.fk).map((a) => ({
      from: a.name.replace(/_id$/, "").replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase()),
      fromCardinality: "exactly-one", to: "Thing", toCardinality: "zero-or-more" })),
  }));
  return built.columns
    .filter((column) => column.isIdentifier && column.tableName === "bus_thing")
    .sort((a, b) => a.seqNo - b.seqNo)
    .map((column) => column.columnName);
};
const s = (name, type = "string", more = {}) => ({ name, type, ...more });
const ref = (name) => ({ name, type: "uuid", fk: true });
const parents = (...names) => names.map((n) => ({ name: n, attributes: [key, s("name")] }));
const identifierCases = [
  ["a name column names the record", [s("name")], ["name"]],
  ["title is used when there is no name", [s("title")], ["title"]],
  ["a person is both their names", [s("first_name"), s("last_name")], ["first_name", "last_name"]],
  ["name wins over a code", [s("code"), s("name")], ["name"]],
  ["a code identifies when no name exists", [s("code")], ["code"]],
  ["a prefixed number identifies when nothing names the record", [s("currency"), s("order_number")], ["order_number"]],
  ["failing all of those, the first plain string column", [s("billing_city"), s("size", "integer")], ["billing_city"]],
  ["the key is never an identifier", [s("size", "integer")], []],
  ["a join entity is its two parents", [ref("campaign_id"), ref("contact_id"), s("member_status")], ["campaign_id", "contact_id"], parents("Campaign", "Contact")],
  ["only the first two parents, never three", [ref("order_id"), ref("product_id"), ref("warehouse_id")], ["order_id", "product_id"], parents("Order", "Product", "Warehouse")],
  ["an entity that names itself is not a join", [s("name"), ref("account_id"), ref("owner_id")], ["name"], parents("Account", "Owner")],
  ["a text column outranks a join", [ref("experiment_id"), ref("reporter_id"), s("summary", "text")], ["summary"], parents("Experiment", "Reporter")],
];
for (const [label, attributes, expected, extra = []] of identifierCases) {
  const got = await identifiersOf(attributes, extra);
  say(got.join(",") === expected.join(","), `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})`);
}

/* §3.1 and §3.7: help text is compiled, and reaches sys_column / sys_table. */
{
  const built = await generate(model({ entities: [{ name: "Vendor", help: "A company that supplies us.",
    attributes: [key, { name: "name", type: "string", help: "The name on the invoice, not the trading name." }] }] }));
  const table = built.tables.find((x) => x.tableName === "bus_vendor");
  const column = built.columns.find((x) => x.columnName === "name" && x.tableName === "bus_vendor");
  say(table?.description === "A company that supplies us.", `an entity's help becomes sys_table.description (${JSON.stringify(table?.description)})`);
  say(column?.description === "The name on the invoice, not the trading name.",
    `a column's help becomes sys_column.description (${JSON.stringify(column?.description)})`);
}

console.log(`${pass - claimsBefore} dictionary derivations verified, ${fail - failuresBefore} contradicted`);

/* ------------------------------- 4. the runner §8.4 tells a model to use ---- */

const runner = root + "guide/check-model.mjs";
const command = "curl -sO https://www.appwithai.org/guide/check-model.mjs\nnode check-model.mjs my-business.eml.yaml";

const scratch = mkdtempSync(join(tmpdir(), "eml-spec-"));
const clean = join(scratch, "clean.eml.yaml");
const broken = join(scratch, "broken.eml.yaml");
writeFileSync(clean, JSON.stringify(model({ entities: [thing({ name: "name", type: "string" })] }), null, 2));
writeFileSync(broken, JSON.stringify(model({ entities: [thing({ name: "name", type: "string" }), thing()] }), null, 2));

const run = (file) => spawnSync(process.execPath, [runner, file, "--base", root + "guide/", "--quiet"], { encoding: "utf8" });
const cleanRun = run(clean);
const brokenRun = run(broken);
let runnerFail = 0;
const expect = (cond, label) => { if (cond) console.log(`ok   ${label}`); else { runnerFail++; console.log(`FAIL ${label}`); } };
expect(specText.includes("```sh\n" + command + "\n```"), "the spec carries the two-line command as a runnable block");
expect((specText.match(/check-model\.mjs/g) ?? []).length >= 4, "the command is reachable from the header, §1.3, §8.4 and §10");
expect(existsSync(runner), "guide/check-model.mjs exists at the path the spec publishes");
expect(cleanRun.status === 0, "check-model.mjs exits 0 on a clean model");
expect(new RegExp(`OK — 0 errors[^\\n]*\\(EML ${LANGUAGE_VERSION.replace(/\./g, "\\.")}\\)`).test(cleanRun.stdout),
  "check-model.mjs prints the validator's own verdict, with its version");
expect(specText.includes(`OK — 0 errors, 0 warnings, 0 notes (EML ${LANGUAGE_VERSION})`), "section 8.2 quotes that verdict line as the runner prints it");
expect(brokenRun.status === 1, "check-model.mjs exits 1 when the generator would refuse the model");
expect(spawnSync(process.execPath, [runner], { encoding: "utf8" }).status === 2, "check-model.mjs exits 2 when it cannot run");

/* §8.4 quotes a diagnostic as the runner prints it. Held to a real run, so a
   change to the runner's layout cannot leave the document showing another. */
{
  const warned = join(scratch, "warned.eml.yaml");
  writeFileSync(warned,
    'eml: "1.0"\nname: Orders\nentities:\n  - name: Order\n    help: A customer\'s request to buy goods, from draft to delivery.\n    attributes:\n      - { name: id, type: uuid, pk: true }\n      - { name: status, type: string, help: Where the order is in its lifecycle. }\n');
  const shown = spawnSync(process.execPath, [runner, warned, "--base", root + "guide/"], { encoding: "utf8" }).stdout;
  const printed = shown.split("\n").find((line) => line.startsWith("warn  EML146"));
  expect(printed !== undefined && specText.includes(printed.trimEnd().replace(/:\d+:\d+/, ":8:9")),
    `section 8.4's sample diagnostic is the runner's own layout (${JSON.stringify(printed)})`);
}

/* ------------------------------- 4b. the checklist audit §8.5 publishes ----- */
const auditor = root + "guide/audit-model.mjs";
const runAudit = (file, ...extra) =>
  spawnSync(process.execPath, [auditor, file, "--base", root + "guide/", "--quiet", ...extra], { encoding: "utf8" });

/* A bare entity list: a key, a name, a free-text status. The validator accepts
   it with 0 errors — no rbac, no state machine, no help, no enum binding — and
   that is the whole reason this runner exists. */
const bare = join(scratch, "bare-model.eml.yaml");
writeFileSync(bare, 'eml: "1.0"\nname: Bare Model\nentities:\n  - name: Thing\n    attributes:\n      - { name: id, type: uuid, pk: true }\n      - { name: name, type: string }\n      - { name: status, type: string }\n');

const finishedRun = runAudit(root + "guide/models/crm.eml.yaml");
const unfinishedRun = runAudit(bare);
const unfinishedFull = spawnSync(process.execPath, [auditor, bare, "--base", root + "guide/"], { encoding: "utf8" });
const unfinishedCheck = run(bare);

expect(existsSync(auditor), "guide/audit-model.mjs exists at the path the spec publishes");
expect(finishedRun.status === 0, "audit-model.mjs exits 0 on a finished model");
expect(unfinishedRun.status === 1, "audit-model.mjs exits 1 on a model that is valid but unfinished");
expect(unfinishedCheck.status === 0,
  "…and that same model passes check-model.mjs — which is why the audit is published, not optional");
expect(spawnSync(process.execPath, [auditor], { encoding: "utf8" }).status === 2, "audit-model.mjs exits 2 when it cannot run");

/* The header says a bare entity list fails "nine ways". A number in prose is a
   claim, and this is the run it is a claim about. */
const bareFailures = (unfinishedFull.stdout.match(/^\s+FAIL\s/gm) ?? []).length;
const wordForBare = NUMBER_WORDS[bareFailures] ?? String(bareFailures);
expect(specText.includes(`fails this ${wordForBare} ways`),
  `the header's count of a bare model's failures is the audit's own (${bareFailures})`);

/* The score is a published figure: §8.5 states it and shows the line. */
const scored = /^(\d+) passed, (\d+) failed$/m.exec(finishedRun.stdout.trim());
expect(scored !== null, "audit-model.mjs's last line is its score");
const total = scored ? Number(scored[1]) + Number(scored[2]) : 0;
expect(specText.includes(`${total} passed, 0 failed`),
  `section 8.5 quotes the score the runner actually prints (${total} checks)`);
expect(new RegExp(`\\b${total === 22 ? "twenty-two" : String(total)}\\b`).test(specText),
  "section 8.5 states how many checks there are, in words, and it is that many");

/* §8.4's no-egress row tells the reader to pass a directory, and `--base ./` is
   the form it shows. A relative path is not a URL: `fetch` and a bare
   `import()` both reject it outright, which used to read as the site being
   unreachable. Both runners resolve it as a path. */
const relative = (script) =>
  spawnSync(process.execPath, [script, "guide/models/crm.eml.yaml", "--base", "guide/", "--quiet"], { encoding: "utf8", cwd: root });
for (const [label, script] of [["check-model.mjs", runner], ["audit-model.mjs", auditor]])
  expect(relative(script).status === 0, `${label} accepts a relative --base, as §8.4 tells the reader to pass`);

const runnerSource = readFileSync(runner, "utf8");
const auditorSource = readFileSync(auditor, "utf8");
expect(!/github/i.test(runnerSource), "check-model.mjs reaches no GitHub host, as §8.4 tells the reader");
expect(!/github/i.test(auditorSource), "audit-model.mjs reaches no GitHub host either");
expect(/scorer, not a second/.test(auditorSource), "audit-model.mjs says in its own header that it originates no diagnostic");
for (const flag of ["--write", "--base", "--quiet"])
  expect(runnerSource.includes(flag) && specText.includes(flag), `section 8.4's \`${flag}\` is a flag check-model.mjs actually has`);

/* The one-file build carries the validator and both runners, or the shell that
   can reach nothing can ask only half the question. */
const standalone = readFileSync(root + "scripts/build-standalone-checker.mjs", "utf8");
for (const file of ["model-yaml.js", "check-model.mjs", "audit-model.mjs"])
  expect(new RegExp(`"${file.replace(/\./g, "\\.")}"`).test(standalone), `the one-file validator embeds ${file}`);

expect((specText.match(/audit-model\.mjs/g) ?? []).length >= 4, "the audit is reachable from the header, §8.4, §8.5 and §10");
expect(/^### 8\.5 /m.test(specText), "§8.5 exists — the header and §10 both cite it");

/* ------------------------------- 5. llmdetailed.txt — the interactive protocol
 *
 * llms-full.txt is assembled for this site; llmdetailed.txt is the platform's
 * system edition, copied from the generator repository. This section does not
 * re-audit its language — it holds the claims its protocol makes about *the
 * tooling it tells a model to run*, which is what goes stale when the file is
 * re-copied or when the runners change underneath it.
 */

const detailed = readFileSync(root + "llmdetailed.txt", "utf8");
const enhancements = {
  "llmtextenhancement.txt": readFileSync(root + "llmtextenhancement.txt", "utf8"),
  "llmdetailedenhancement.txt": readFileSync(root + "llmdetailedenhancement.txt", "utf8"),
};
const flat = (text) => text.replace(/\s+/g, " ");
const detailedProse = flat(detailed);
let detailedFail = 0;
const held = (cond, label) => { if (cond) console.log(`ok   ${label}`); else { detailedFail++; console.log(`FAIL ${label}`); } };

/* A diagnostic the validator cannot emit reads exactly like a real one to a
   language model. */
const emits = (code) => validatorSource.includes(`"${code}"`);
/* Codes a document cites, leaving out the band boundaries of a range table
   (`EML100`–`EML119`), which name no diagnostic. */
const citedIn = (body) =>
  [...new Set(body.replace(/EML\d{3}`?\s*[–-]\s*`?EML\d{3}/g, "").match(/EML\d{3}/g) ?? [])].sort();
const cited = citedIn(detailed);
const unknown = cited.filter((code) => !emits(code));
held(cited.length >= 20 && unknown.length === 0,
  `every diagnostic llmdetailed.txt cites exists in the validator (${cited.length} codes${unknown.length ? ", missing: " + unknown.join(", ") : ""})`);
held(AUTO_FIXABLE.every((code) => detailed.includes(`\`${code}\``)),
  `llmdetailed.txt names every auto-fixable code (${AUTO_FIXABLE.join(", ")})`);
held(/curl -sO https:\/\/www\.appwithai\.org\/guide\/check-model\.mjs/.test(detailed),
  "llmdetailed.txt carries the one-line way to run the validator without a checkout");
for (const flag of ["--write", "--base"])
  held(detailed.includes(flag) && runnerSource.includes(flag), `llmdetailed.txt's \`${flag}\` is a flag check-model.mjs actually has`);
held(/exit 0[\s\S]{0,120}exit 1[\s\S]{0,120}exit 2/.test(detailed), "llmdetailed.txt documents all three of the runner's exit codes");
held(/reach GitHub says nothing about whether the validator can run/i.test(detailedProse),
  "llmdetailed.txt states that an unreachable GitHub is not an unreachable validator");
held(/curl -sO https:\/\/www\.appwithai\.org\/guide\/audit-model\.mjs/.test(detailed),
  "llmdetailed.txt offers the checklist audit by URL, not a repository script");
for (const rung of ["guide/check-model.mjs", "guide/audit-model.mjs", "guide/model-yaml.js", "guide/11-check-a-model.html"])
  held(existsSync(root + rung) && detailed.includes(rung.replace("guide/", "")),
    `the ladder's ${rung} is published here and named in llmdetailed.txt`);

/* The viewers. The interactive protocol sends a reader to /viewers/ and names
   three of its tabs; a model following a stale instruction sends its user to a
   404 in the middle of a walkthrough. */
held(/https:\/\/www\.appwithai\.org\/viewers\//.test(detailed), "llmdetailed.txt names the model viewers by their published URL");
for (const file of ["viewers/index.html", "viewers/appwithai-model.js", "viewers/model-viewer.js", "viewers/viewers.css"])
  held(existsSync(root + file), `${file} is published here — the interactive protocol sends readers to it`);
const viewerPage = readFileSync(root + "viewers/index.html", "utf8");
const viewerTabs = [...viewerPage.matchAll(/data-tab="[^"]+">([^<]+)</g)].map((m) => m[1].trim());
for (const named of ["Workflows", "Business rules", "Access"])
  held(viewerTabs.includes(named) && detailedProse.includes(`**${named}**`), `the "${named}" tab llmdetailed.txt names exists on the viewer page`);
held(/File System Access API/.test(detailedProse) && /Watch a file/.test(detailedProse), "llmdetailed.txt says which browsers can watch a file");
held(readFileSync(root + "viewers/model-viewer.js", "utf8").includes("showOpenFilePicker"),
  "the viewers really gate watching on the File System Access API");

/* Cross-references must resolve, or a ladder sends the reader nowhere. */
const danglingIn = (body) => {
  const heads = new Set([...body.matchAll(/^#{2,4} (\d+(?:\.\d+)*)[. ]/gm)].map((m) => m[1]));
  /* `§10.1.6` is item 6 of the list in §10.1: it resolves when its section does. */
  return [...new Set([...body.matchAll(/§(\d+\.\d+(?:\.\d+)?)/g)].map((m) => m[1]))]
    .filter((r) => !heads.has(r) && !heads.has(r.split(".").slice(0, 2).join(".")));
};
for (const [file, body] of [["llms-full.txt", specText], ["llmdetailed.txt", detailed]]) {
  const dangling = danglingIn(body);
  held(dangling.length === 0, `every §N.N cross-reference in ${file} resolves to a heading${dangling.length ? " (dangling: " + dangling.join(", ") + ")" : ""}`);
}
held(/needs no specification document at all/i.test(detailedProse), "llmdetailed.txt separates fetching the spec from running the validator");
held(/Perform the validation; do not offer it/i.test(detailedProse), "llmdetailed.txt requires the run rather than offering it");
held(/every step that touches the `\.eml\.yaml`/i.test(detailedProse), "llmdetailed.txt binds the fixer-then-validator loop to every step");

/* ------------------------------- 6. the enhancement editions ---------------
 *
 * `llmtextenhancement.txt` and `llmdetailedenhancement.txt` take an existing
 * `.eml.yaml` and change it, where their base documents write one from a
 * brief. They are derived from those bases — the language reference is copied,
 * only the protocol section differs — so the first thing held is that the
 * derivation is current. The rest holds the claims that make an enhancement
 * protocol different from an authoring one, each a real failure before it was a
 * rule: starting without the user's file, rebuilding the model from memory,
 * answering with a patch, and handing back a model that validates clean and is
 * quietly smaller than the one that came in.
 */
let enhancementFail = 0;
const enh = (cond, label) => { if (cond) console.log(`ok   ${label}`); else { enhancementFail++; console.log(`FAIL ${label}`); } };

const built = spawnSync(process.execPath, [root + "scripts/build-llmtext-enhancement.mjs", "--check"], { encoding: "utf8" });
enh(built.status === 0, `both enhancement editions are current against their bases${built.status === 0 ? "" : "\n" + built.stdout}`);
const tailFrom = (body, heading) => body.slice(body.search(heading));
enh(tailFrom(enhancements["llmtextenhancement.txt"], /^## 2\. /m) === tailFrom(specText, /^## 2\. /m),
  "llmtextenhancement.txt carries llms-full.txt's language reference unchanged");
enh(tailFrom(enhancements["llmdetailedenhancement.txt"], /^## 11\. /m) === tailFrom(detailed, /^## 11\. /m),
  "llmdetailedenhancement.txt carries llmdetailed.txt's closing section unchanged");

for (const [name, body] of Object.entries(enhancements)) {
  const prose = flat(body);
  const codes = citedIn(body);
  const missing = codes.filter((code) => !emits(code));
  enh(codes.length >= 20 && missing.length === 0,
    `${name}: every diagnostic it cites exists in the validator (${codes.length} codes${missing.length ? ", missing: " + missing.join(", ") : ""})`);
  const dangling = danglingIn(body);
  enh(dangling.length === 0, `${name}: every §N.N cross-reference resolves${dangling.length ? " (dangling: " + dangling.join(", ") + ")" : ""}`);
  enh(/(load|send me) (their|your|the) `?\.eml\.yaml`?/i.test(prose), `${name}: asks the user for their .eml.yaml before anything else`);
  enh(/Never reconstruct/i.test(prose), `${name}: forbids reconstructing the model from memory or the conversation`);
  enh(/Not a patch|not a diff/i.test(prose), `${name}: says the deliverable is the whole model, not a patch or a diff`);
  enh(/one file/i.test(prose) && /\.eml\.yaml/.test(body), `${name}: still delivers exactly one .eml.yaml`);
  enh(/baseline/i.test(prose) && /inventor/i.test(prose), `${name}: baselines and inventories the model before it is edited`);
  enh(/`reports`/.test(body) && /(nothing was lost|nothing lost|regression|quietly smaller)/i.test(prose),
    `${name}: compares the result against the baseline to prove nothing was lost`);
  enh(/help text/i.test(prose) && /`rbac`/.test(body), `${name}: names help text and rbac among what an enhancement silently drops`);
  for (const sibling of ["llms-full.txt", "llmdetailed.txt", "llmtextenhancement.txt", "llmdetailedenhancement.txt"])
    if (sibling !== name) enh(body.includes(sibling), `${name}: names its companion ${sibling}`);
}

const interactive = enhancements["llmdetailedenhancement.txt"];
const interactiveProse = flat(interactive);
enh(/curl -sO https:\/\/www\.appwithai\.org\/guide\/check-model\.mjs/.test(interactive), "llmdetailedenhancement.txt carries the one-line way to run the validator");
enh(/exit 0[\s\S]{0,120}exit 1[\s\S]{0,120}exit 2/.test(interactive), "llmdetailedenhancement.txt documents all three of the runner's exit codes");
enh(AUTO_FIXABLE.every((code) => interactive.includes(`\`${code}\``)), "llmdetailedenhancement.txt names every auto-fixable code");
enh(/https:\/\/www\.appwithai\.org\/viewers\//.test(interactive), "llmdetailedenhancement.txt names the model viewers by their published URL");
enh(/Perform the validation; do not offer it/i.test(interactiveProse), "llmdetailedenhancement.txt requires the run rather than offering it");
for (const gate of ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E"])
  enh(interactive.includes(gate), `llmdetailedenhancement.txt keeps ${gate}`);
enh(/00-original\.eml\.yaml/.test(interactive), "llmdetailedenhancement.txt keeps the original untouched as the thing to compare against");

console.log(`\n${enhancementFail === 0 ? "enhancement editions hold." : enhancementFail + " enhancement claim(s) contradicted."}`);

/* ------------------------------- 7. the published host, written in full ----
 *
 * A model following these documents reported a failed validator fetch as
 * `[appwithai.org](https://www.appwithai.org)` — a Markdown link whose text is
 * a bare host. Every mention of the host must be `https://www.appwithai.org`.
 * The passages that deliberately show another form are teaching material — the
 * rule itself and the sentences contrasting the apex with `www` — so they are
 * removed before the scan rather than special-cased inside it, and then held to
 * still being there.
 */
let hostFail = 0;
const host = (cond, label) => { if (cond) console.log(`ok   ${label}`); else { hostFail++; console.log(`FAIL ${label}`); } };

const TEACHING = [
  "is a string a",
  "[appwithai.org](https://www.appwithai.org)",
  "[www.appwithai.org](https://www.appwithai.org)",
  "**The apex is not the canonical form.**",
  "`https://appwithai.org` serves the same files",
  '*"Validator retrieval failed for appwithai.org"*',
  "the apex `https://appwithai.org`",
  "The apex `https://appwithai.org`",
  "`https://appwithai.org` serves the same files, but the",
];
const MARKDOWN_COUNTER_EXAMPLES = ["[appwithai.org](https://www.appwithai.org)", "[www.appwithai.org](https://www.appwithai.org)"];

for (const [name, body] of [["llms-full.txt", specText], ["llmdetailed.txt", detailed], ...Object.entries(enhancements)]) {
  const lines = body.split("\n");
  const stray = lines
    .filter((line) => !TEACHING.some((teaching) => line.includes(teaching)))
    .filter((line) => /appwithai\.org/.test(line.replace(/https:\/\/www\.appwithai\.org/g, "")));
  host(stray.length === 0,
    `${name}: every mention of the host is https://www.appwithai.org${stray.length ? ` (${stray.length} stray, first: "${stray[0].trim().slice(0, 72)}")` : ""}`);
  host(body.includes("Write the URL in full, every time"), `${name}: carries the rule that the URL is written in full`);
  host(/Report the URL you actually requested/.test(flat(body)), `${name}: tells the reader to report the URL actually requested`);
  host(MARKDOWN_COUNTER_EXAMPLES.some((e) => body.includes(e)), `${name}: keeps the Markdown-link counter-example the rule is about`);
  for (const code of ["curl: (6)", "curl: (7)", "curl: (56)"])
    host(body.includes(code), `${name}: names \`${code}\` among the failures that never reached the site`);
  host(/never reached the site, so none of them is evidence it is down/.test(flat(body)), `${name}: says those failures are not evidence the site is down`);
  host(body.includes("https://www.appwithai.org/guide/source/"), `${name}: names the page-carried copies, for a fetcher that refuses JavaScript`);
  host(!/checker\.js|fixer\.js/.test(body), `${name}: names the published validator, not the modules it replaced`);
}

for (const name of ["index.html", "model-yaml.js.html", "check-model.mjs.html", "audit-model.mjs.html"])
  host(existsSync(root + "guide/source/" + name), `guide/source/${name} is published here — the ladder names that directory`);

for (const page of ["index.html", "try-it-yourself.html"]) {
  const markup = readFileSync(root + page, "utf8");
  const bare = [...markup.matchAll(/[^/w.]((?:www\.)?appwithai\.org)/g)].map((m) => m[1]);
  host(bare.length === 0, `${page}: names the host only as https://www.appwithai.org${bare.length ? ` (${bare.length} bare)` : ""}`);
}

console.log(`\n${hostFail === 0 ? "the published host is written in full everywhere." : hostFail + " host spelling(s) wrong."}`);

process.exit(exampleFailures + fail + runnerFail + detailedFail + enhancementFail + hostFail === 0 ? 0 : 1);
