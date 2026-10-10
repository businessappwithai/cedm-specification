#!/usr/bin/env bun
/**
 * Write each entity's executable business logic into its file.
 *
 * specification/business-logic.yaml says what an entity states: a `lifecycle` (the
 * states of its status attribute and the moves between them) and invariants that
 * carry a `violatedWhen` condition, which a generated application enforces. The
 * library's prose invariants and `help.lifecycle` text describe these but cannot
 * be run; this tool derives the executable form from what the entity already says
 * about itself — its status values, its paired dates, its quantities — and inserts
 * it as text, so the file's own style and every line an author wrote stay as they
 * were. An entity that already states a `lifecycle`, and invariants already
 * present, are never touched. A re-run changes nothing; `--check` exits 1 when a
 * file would change.
 *
 *     bun tools/derive-business-logic.ts [--check]
 */

import "./lib/cli";
import { readFileSync, writeFileSync } from "node:fs";
import { cap, lowerWords, words } from "./lib/dictionary";
import { entityPaths, idPrefix, snake } from "./lib/library";
import { applySpans, indentOf, type Span, topBlockEnd, topKey } from "./lib/lines";
import { jsonAscii, str } from "./lib/text";
import { parseYaml, type Spec } from "./lib/yaml";

/* ---- lifecycle ------------------------------------------------------------ */

const INITIAL_ORDER = [
  "DRAFT",
  "NEW",
  "CANDIDATE",
  "IDENTIFIED",
  "DEVELOPMENT",
  "RESEARCH",
  "FUTURE",
  "EXPECTED",
  "REQUESTED",
  "REPORTED",
  "RECORDED",
  "PROPOSED",
  "QUOTED",
  "PLANNED",
  "PENDING",
  "EMPTY",
];
/** Detours a record leaves and returns from. */
const SIDE = new Set([
  "SUSPENDED",
  "ON_HOLD",
  "HELD",
  "BLOCKED",
  "LOCKED",
  "FROZEN",
  "QUARANTINED",
  "MAINTENANCE",
  "UNDER_MAINTENANCE",
  "OUT_OF_SERVICE",
  "EXCEPTION",
  "ON_LEAVE",
  "INACTIVE",
  "CLEANING",
  "GROUNDED",
  "DISABLED",
  "INSPECTION_PENDING",
  "CONTAINED",
  "OVERDUE",
  "NEGOTIATION",
]);
/** Ends of the road that mean the thing did not go through, or is no longer in use. */
const NEGATIVE = new Set([
  "CANCELLED",
  "REJECTED",
  "FAILED",
  "EXPIRED",
  "TERMINATED",
  "VOID",
  "REVERSED",
  "DISCONTINUED",
  "RETIRED",
  "WITHDRAWN",
  "LOST",
  "DISPOSED",
  "SCRAPPED",
  "DENIED",
  "REVOKED",
  "OBSOLETE",
  "SUPERSEDED",
  "DECOMMISSIONED",
  "NO_SHOW",
  "BREACHED",
  "MATERIALIZED",
  "WAIVED",
  "REFUNDED",
  "SOLD",
]);
/** Ends of the road that mean it ran its course. */
const POSITIVE = new Set([
  "COMPLETED",
  "CLOSED",
  "ARCHIVED",
  "FULFILLED",
  "DELIVERED",
  "PAID",
  "SETTLED",
  "RESOLVED",
  "CONSUMED",
  "FULLY_APPLIED",
  "PASSED",
  "FILLED",
  "INSTALLED",
  "RETURNED",
  "SOFT_CLOSED",
  "CLEARED",
  "EXECUTED",
  "DISPOSITIONED",
  "AWARDED",
]);
const POSITIVE_ORDER = [
  "COMPLETED",
  "FULFILLED",
  "DELIVERED",
  "PAID",
  "SETTLED",
  "RESOLVED",
  "SOFT_CLOSED",
  "CLOSED",
  "ARCHIVED",
];
/** A negative end that only makes sense after the thing happened. */
const AFTER_THE_FACT = new Set(["REVERSED", "REFUNDED", "RETURNED"]);
/** A negative end that only makes sense once it has begun. */
const NOT_AT_THE_START = new Set([
  "FAILED",
  "EXPIRED",
  "TERMINATED",
  "BREACHED",
  "NO_SHOW",
  "LOST",
  "DISPOSED",
  "SCRAPPED",
]);
/** Ends a record reaches even after it ran its course. */
const RETIREMENT = new Set([
  "RETIRED",
  "DISCONTINUED",
  "OBSOLETE",
  "DECOMMISSIONED",
  "TERMINATED",
  "SUPERSEDED",
]);

const VERB: Record<string, string> = {
  ACTIVE: "activate",
  APPROVED: "approve",
  SUBMITTED: "submit",
  CANCELLED: "cancel",
  REJECTED: "reject",
  COMPLETED: "complete",
  CLOSED: "close",
  RETIRED: "retire",
  SUSPENDED: "suspend",
  BLOCKED: "block",
  INACTIVE: "deactivate",
  IN_PROGRESS: "start",
  RELEASED: "release",
  POSTED: "post",
  REVERSED: "reverse",
  EXPIRED: "expire",
  FAILED: "fail",
  VOID: "void",
  ARCHIVED: "archive",
  PLANNED: "plan",
  PENDING: "submit",
  ON_HOLD: "hold",
  ASSIGNED: "assign",
  OPEN: "open",
  ISSUED: "issue",
  ACCEPTED: "accept",
  RECEIVED: "receive",
  DELIVERED: "deliver",
  SHIPPED: "ship",
  PAID: "pay",
  TERMINATED: "terminate",
  WITHDRAWN: "withdraw",
  DENIED: "deny",
  REVOKED: "revoke",
  DISCONTINUED: "discontinue",
  FULFILLED: "fulfil",
  RESOLVED: "resolve",
  CONFIRMED: "confirm",
  UNDER_REVIEW: "review",
  PUBLISHED: "publish",
  LOCKED: "lock",
  DISABLED: "disable",
  QUARANTINED: "quarantine",
  CONSUMED: "consume",
  REFUNDED: "refund",
  SETTLED: "settle",
  AUTHORIZED: "authorize",
  BOOKED: "book",
  RESERVED: "reserve",
  VERIFIED: "verify",
};
const RETURN_VERB: Record<string, string> = {
  SUSPENDED: "resume",
  ON_HOLD: "resume",
  HELD: "resume",
  BLOCKED: "unblock",
  INACTIVE: "reactivate",
  LOCKED: "unlock",
  QUARANTINED: "release",
  FROZEN: "unfreeze",
  MAINTENANCE: "return_to_service",
  UNDER_MAINTENANCE: "return_to_service",
  OUT_OF_SERVICE: "return_to_service",
  EXCEPTION: "resolve_exception",
  GROUNDED: "return_to_service",
  DISABLED: "enable",
  CLEANING: "finish_cleaning",
  ON_LEAVE: "return_from_leave",
};

const verb = (target: string) => VERB[target] ?? `mark_${target.toLowerCase()}`;

interface Plan {
  states: string[];
  initial: string;
  terminal: string[];
  transitions: Array<[string, string, string]>;
}

/** States, initial, terminal and transitions for a status attribute's values. */
export function lifecycleOf(values: string[]): Plan | null {
  if (values.length < 2) return null;
  let side = values.filter((v) => SIDE.has(v));
  let negative = values.filter((v) => NEGATIVE.has(v) && !SIDE.has(v));
  let positive = values.filter((v) => POSITIVE.has(v) && !NEGATIVE.has(v));
  const rank = (v: string) => (POSITIVE_ORDER.includes(v) ? POSITIVE_ORDER.indexOf(v) : 50);
  positive = [...positive].sort((a, b) => rank(a) - rank(b));
  const taken = new Set([...side, ...negative, ...positive]);
  // Progress runs from the state a record starts in, and otherwise as declared.
  let progress = values.filter((v) => !taken.has(v));
  const known = progress
    .filter((v) => INITIAL_ORDER.includes(v))
    .sort((a, b) => INITIAL_ORDER.indexOf(a) - INITIAL_ORDER.indexOf(b));
  const rest = progress
    .filter((v) => !INITIAL_ORDER.includes(v))
    .sort((a, b) => values.indexOf(a) - values.indexOf(b));
  progress = [...known, ...rest];

  if (!progress.length) {
    // Nothing but detours and ends: the first declared value is where it starts.
    const first = values[0] as string;
    progress = [first];
    side = side.filter((v) => v !== first);
    negative = negative.filter((v) => v !== first);
    positive = positive.filter((v) => v !== first);
  }

  let transitions: Array<[string, string, string]> = [];
  const edge = (a: string, b: string, action: string) => {
    if (a !== b && !transitions.some(([x, y]) => x === a && y === b))
      transitions.push([a, b, action]);
  };
  for (let i = 0; i + 1 < progress.length; i++)
    edge(progress[i] as string, progress[i + 1] as string, verb(progress[i + 1] as string));
  const last = progress.at(-1) as string;
  if (positive.length) {
    edge(last, positive[0] as string, verb(positive[0] as string));
    for (let i = 0; i + 1 < positive.length; i++)
      edge(positive[i] as string, positive[i + 1] as string, verb(positive[i + 1] as string));
  }
  const live = progress.length > 1 ? progress.slice(1) : progress;
  for (const s of side) {
    for (const p of live) {
      edge(p, s, verb(s));
      edge(s, p, RETURN_VERB[s] ?? "resume");
    }
  }
  const ends = positive.slice(-1);
  for (const n of negative) {
    let sources: string[];
    if (AFTER_THE_FACT.has(n)) sources = [last, ...positive];
    else if (NOT_AT_THE_START.has(n) && progress.length > 1)
      sources = [...progress.slice(1), ...side];
    else sources = [...progress, ...side, ...(RETIREMENT.has(n) ? positive : [])];
    for (const s of sources) edge(s, n, verb(n));
  }
  // A model that never ends has no terminal state: that is stated, not assumed.
  const terminal = [...ends, ...negative];
  // A terminal state has no outgoing moves (LIFE-003).
  transitions = transitions.filter(([from]) => !terminal.includes(from));
  return { states: values, initial: progress[0] as string, terminal, transitions };
}

function renderLifecycle(entity: string, attr: string, plan: Plan): string[] {
  const lines = [
    "  lifecycle:",
    `    title: ${words(entity)} Lifecycle`,
    `    attribute: ${attr}`,
    `    states: [${plan.states.join(", ")}]`,
    `    initial: ${plan.initial}`,
  ];
  if (plan.terminal.length) lines.push(`    terminal: [${plan.terminal.join(", ")}]`);
  lines.push("    transitions:");
  for (const [a, b, action] of plan.transitions)
    lines.push(`      - {from: ${a}, to: ${b}, action: ${action}}`);
  return lines;
}

/* ---- executable invariants ------------------------------------------------ */

const END: Record<string, string> = {
  Start: "End",
  From: "To",
  Begin: "End",
  Effective: "Expiry",
  Valid: "Expiry",
};
const DATE_TYPES = new Set(["date", "datetime"]);
const NON_NEGATIVE =
  /(quantity|qty|amount|price|cost|total|subtotal|count|duration|weight|volume|capacity|fee|charge|tax|rate)$/i;
const SIGNED =
  /(adjust|variance|delta|balance|net|gain|loss|credit|debit|offset|difference|change|temperature|latitude|longitude|score|exchange|interest|growth|margin|profit|drift|bias|signed)/i;
/** Entities whose amounts are signed by convention (debits and credits, movements both ways). */
const SIGNED_ENTITIES =
  /(Journal|Ledger|Adjustment|BankTransaction|Reconciliation|Variance|Valuation|Posting|CashFlow|Forecast|Movement|Statement)/;
const REASONS: Array<[string, string[]]> = [
  ["CANCELLED", ["cancellationReason", "cancelReason", "reasonForCancellation"]],
  ["REJECTED", ["rejectionReason", "rejectReason"]],
  ["ON_HOLD", ["holdReason"]],
  ["SUSPENDED", ["suspensionReason"]],
  ["BLOCKED", ["blockReason", "blockedReason"]],
  ["FAILED", ["failureReason"]],
  ["REVERSED", ["reversalReason"]],
  ["VOID", ["voidReason"]],
  ["DENIED", ["denialReason"]],
  ["TERMINATED", ["terminationReason"]],
  ["WITHDRAWN", ["withdrawalReason"]],
];
const STAMPS: Array<[string, string[]]> = [
  ["COMPLETED", ["completedAt", "completedOn", "completionDate"]],
  ["CLOSED", ["closedAt", "closedOn", "closedDate"]],
  ["APPROVED", ["approvedAt", "approvedOn", "approvalDate"]],
  ["POSTED", ["postedAt", "postingDate"]],
  ["CANCELLED", ["cancelledAt", "cancelledOn", "cancellationDate"]],
  ["SHIPPED", ["shippedAt", "shipDate"]],
  ["DELIVERED", ["deliveredAt", "deliveryDate"]],
  ["RETIRED", ["retiredAt", "retiredOn", "retirementDate"]],
];

interface Invariant {
  id: string;
  rule: string;
  violatedWhen: string;
  message: string;
}

/** Conditions the entity's own structure implies, as `violatedWhen` invariants. */
export function executableInvariants(entity: Spec): Invariant[] {
  const name: string = entity.name;
  const attrs = new Map<string, Spec>((entity.attributes ?? []).map((a: Spec) => [a.name, a]));
  const out: Invariant[] = [];
  const prefix = idPrefix(name);
  const add = (rule: string, violatedWhen: string, message: string) =>
    out.push({
      id: `${prefix}-EXE-${String(out.length + 1).padStart(3, "0")}`,
      rule,
      violatedWhen,
      message,
    });
  const isDate = (a: string) => DATE_TYPES.has(str(attrs.get(a)?.type));
  const state = (s: string) => s.toLowerCase().replaceAll("_", " ");

  // Start and end: a thing does not finish before it starts.
  const done = new Set<string>();
  for (const a of attrs.keys()) {
    const m = /^(.*?)(Start|From|Begin|Effective|Valid)(Date|Time|At|On|DateTime)?$/.exec(
      // `startDate` is `Start` + `Date` with nothing in front: the name's first
      // word is lower case, so it is read with that word capitalised.
      a.slice(0, 1).toUpperCase() + a.slice(1)
    );
    if (!m || !isDate(a)) continue;
    const stem = m[1] as string;
    const key = m[2] as string;
    const tail = m[3] ?? "";
    // Back to an attribute's casing: camelCase, so a bare `start` pairs with `end`.
    const own = (name: string) => name.slice(0, 1).toLowerCase() + name.slice(1);
    const candidates = [
      own(`${stem}${END[key]}${tail}`),
      own(`${stem}${END[key]}Date`),
      ...(["Effective", "Valid"].includes(key) ? [own(`${stem}To${tail}`)] : []),
    ];
    for (const other of candidates) {
      if (attrs.has(other) && isDate(other) && !done.has(`${a}\u0000${other}`)) {
        done.add(`${a}\u0000${other}`);
        const s = snake(a);
        const e = snake(other);
        add(
          `${cap(words(other))} must not be earlier than ${lowerWords(a)}.`,
          `${s} != null and ${e} != null and ${e} < ${s}`,
          `${cap(words(other))} cannot be earlier than ${lowerWords(a)}.`
        );
        break;
      }
    }
  }

  // Quantities and amounts are not negative; a percentage runs from 0 to 100.
  for (const [a, spec] of attrs) {
    const t = str(spec.type).toLowerCase();
    if (
      !["decimal", "integer", "money"].includes(t) ||
      SIGNED.test(a) ||
      SIGNED_ENTITIES.test(name)
    )
      continue;
    const c = snake(a);
    if (/(percent|percentage|pct)$/i.test(a)) {
      add(
        `${cap(words(a))} is a percentage between 0 and 100.`,
        `${c} != null and (${c} < 0 or ${c} > 100)`,
        `${cap(words(a))} must be between 0 and 100.`
      );
    } else if (NON_NEGATIVE.test(a) && spec.minimum !== undefined && spec.minimum !== null) {
      // The attribute states its own floor.
    } else if (NON_NEGATIVE.test(a)) {
      add(
        `${cap(words(a))} cannot be negative.`,
        `${c} != null and ${c} < 0`,
        `${cap(words(a))} cannot be negative.`
      );
    }
  }

  // A move to a state that needs an explanation carries one.
  const status = attrs.get("status");
  const values: string[] = (status?.values ?? []).map(str);
  if (status !== undefined) {
    for (const [s, names] of REASONS) {
      if (!values.includes(s)) continue;
      const r = names.find((n) => attrs.has(n));
      if (r) {
        add(
          `A ${lowerWords(name)} that is ${state(s)} states ${lowerWords(r)}.`,
          `status == "${s}" and ${snake(r)} == null`,
          `Give the ${lowerWords(r)} before the ${lowerWords(name)} is ${state(s)}.`
        );
      }
    }
    for (const [s, names] of STAMPS) {
      if (!values.includes(s)) continue;
      const r = names.find((n) => attrs.has(n) && isDate(n));
      if (r) {
        add(
          `A ${lowerWords(name)} that is ${state(s)} states when (${lowerWords(r)}).`,
          `status == "${s}" and ${snake(r)} == null`,
          `Record ${lowerWords(r)} when the ${lowerWords(name)} is ${state(s)}.`
        );
      }
    }
  }
  return out;
}

function renderInvariant(item: Invariant, indent: number): string {
  return `${" ".repeat(indent)}- {id: ${item.id}, rule: ${jsonAscii(item.rule)}, violatedWhen: ${jsonAscii(item.violatedWhen)}, message: ${jsonAscii(item.message)}}`;
}

/* ---- text editing --------------------------------------------------------- */

export function deriveText(text: string): string {
  const entity = parseYaml(text).entity;
  const lines = text.split("\n");
  const attrs = new Map<string, Spec>((entity.attributes ?? []).map((a: Spec) => [a.name, a]));
  const spans: Span[] = [];
  const insert = (at: number, added: string[]) => spans.push([at, at, added]);

  // Lifecycle. A new one goes in after the invariants (below), as the library lays them out.
  let newLifecycle: Span | undefined;
  if (!("lifecycle" in entity)) {
    for (const attrName of ["status", "state", "stage"]) {
      const spec = attrs.get(attrName);
      if (spec?.values?.length) {
        const plan = lifecycleOf(spec.values.map(str));
        if (plan) {
          const at = topKey(lines, "help");
          if (at === undefined)
            throw new Error(`${entity.name}: no help block to insert a lifecycle before`);
          newLifecycle = [at, at, renderLifecycle(entity.name, attrName, plan)];
        }
        break;
      }
    }
  }

  // A lifecycle that lists its states and draws no moves is a machine with no
  // topology: every move is accepted. Draw it from the states it lists.
  const life = entity.lifecycle;
  if (life && typeof life === "object" && life.states?.length && !life.transitions?.length) {
    const plan = lifecycleOf(life.states.map(str));
    const at = topKey(lines, "lifecycle");
    if (plan && at !== undefined && lines[at]?.startsWith("  lifecycle: {")) {
      // Written inline as `lifecycle: {states: [...]}`; a block takes the moves.
      const governed = life.attribute || ["status", "state", "stage"].find((a) => attrs.has(a));
      spans.push([at, at + 1, renderLifecycle(entity.name, governed, plan)]);
    } else if (plan && at !== undefined) {
      const end = topBlockEnd(lines, at);
      const extra: string[] = [];
      // A key the block already holds empty (`terminal: []`, `initial:`) is
      // filled in place: appending a second one would be a duplicate key, which
      // YAML 1.2 readers refuse and the old Python reader silently took the last of.
      const fill = (key: string, line: string) => {
        const own = lines.slice(at + 1, end).findIndex((l) => l.startsWith(`    ${key}:`));
        if (own >= 0) spans.push([at + 1 + own, at + 2 + own, [line]]);
        else extra.push(line);
      };
      if (!life.initial) fill("initial", `    initial: ${plan.initial}`);
      if (!life.terminal?.length && plan.terminal.length)
        fill("terminal", `    terminal: [${plan.terminal.join(", ")}]`);
      extra.push("    transitions:");
      for (const [a, b, action] of plan.transitions)
        extra.push(`      - {from: ${a}, to: ${b}, action: ${action}}`);
      insert(end, extra);
    }
  }

  // Executable invariants
  const already = (entity.invariants ?? []).some((i: Spec) => str(i.id).includes("-EXE-"));
  if (!already) {
    const derived = executableInvariants(entity);
    if (derived.length) {
      const at = topKey(lines, "invariants");
      if (at === undefined) {
        const help = topKey(lines, "help");
        if (help === undefined)
          throw new Error(`${entity.name}: no help block to insert invariants before`);
        insert(help, ["  invariants:", ...derived.map((i) => renderInvariant(i, 2))]);
      } else {
        const end = topBlockEnd(lines, at);
        const body = lines.slice(at + 1, end).find((line) => line.trimStart().startsWith("- "));
        const pad = body === undefined ? 2 : indentOf(body);
        insert(
          end,
          derived.map((i) => renderInvariant(i, pad))
        );
      }
    }
  }

  if (newLifecycle) spans.push(newLifecycle);
  return applySpans(lines, spans).join("\n");
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
  console.log(`${changed.length} entity file(s) ${check ? "need" : "received"} business logic`);
  process.exit(check && changed.length ? 1 : 0);
}
