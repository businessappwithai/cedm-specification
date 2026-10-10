// Per-entity CRUD services.
// Wires the full lifecycle for every entity: validation, business-rule
// evaluation, lifecycle hooks, workflow state-transition guards, and optimistic
// locking (`concurrency.js`) on every update and delete.

import { randomUUID } from "node:crypto";
import { assertWritable, transactionStatus } from "./concurrency.js";
import { all, find, insert, remove, update } from "./db.js";
import { runHooks } from "./hooks.js";
import { MODEL } from "./model.js";
import { runRules } from "./rules.js";
import { HttpError, validate } from "./validate.js";
import { canTransition, nextStates, stateMachines } from "./workflows.js";

const nowIso = () => new Date().toISOString();

/** Columns the runtime owns. A request never writes them. */
const MANAGED = ["id", "version", "created_at", "updated_at", "transactionStatus", "_rules"];

function withoutManaged(body) {
  const copy = { ...body };
  for (const key of MANAGED) delete copy[key];
  return copy;
}

/** The row as a write answers it: with where its transaction stands, when it has one. */
function answered(entityName, row, ruleTrace) {
  const status = transactionStatus(entityName, row);
  return {
    ...row,
    ...(status ? { transactionStatus: status } : {}),
    ...(ruleTrace.length ? { _rules: ruleTrace } : {}),
  };
}

export function collectionFor(entityName) {
  const meta = (MODEL.entities ?? []).find((e) => e.name === entityName);
  return meta?.collection ?? entityName.toLowerCase();
}

export function makeService(entityName) {
  const col = collectionFor(entityName);
  const sm = stateMachines[entityName];

  return {
    entity: entityName,
    collection: col,

    async list() {
      return all(col);
    },

    async get(id) {
      const row = find(col, id);
      if (row) await runHooks(entityName, "afterRead", row);
      return row;
    },

    async create(body) {
      let data = { ...body };
      data = await runHooks(entityName, "beforeCreate", data);
      data = await runHooks(entityName, "customValidate", data);
      data = validate(entityName, data, "create");

      const ruleTrace = runRules(entityName, "beforeCreate", data);

      if (sm && !data[sm.statusField]) data[sm.statusField] = sm.initial;

      const ts = nowIso();
      const row = {
        ...withoutManaged(data),
        id: typeof data.id === "string" && data.id ? data.id : randomUUID(),
        version: 1,
        created_at: ts,
        updated_at: ts,
      };
      insert(col, row);
      await runHooks(entityName, "afterCreate", row);
      return answered(entityName, row, ruleTrace);
    },

    /**
     * Update a record, naming the version it was read at.
     *
     * The precondition is checked twice: before any hook runs, so a refused
     * write does no work, and again immediately before the write with nothing
     * awaited in between, so a save that landed while the hooks ran still wins.
     */
    async update(id, rawBody, precondition) {
      const existing = find(col, id);
      if (!existing) return null;
      const body = withoutManaged(rawBody);
      assertWritable(entityName, existing, precondition, "update", body);

      let data = { ...body };
      data = await runHooks(entityName, "beforeUpdate", data);

      // Enforce workflow transition when the status field changes.
      if (sm && data[sm.statusField] && data[sm.statusField] !== existing[sm.statusField]) {
        const from = existing[sm.statusField];
        const to = data[sm.statusField];
        if (!canTransition(entityName, from, to)) {
          throw new HttpError(409, `Illegal ${entityName} transition "${from}" -> "${to}"`, {
            allowed: nextStates(entityName, from),
          });
        }
      }

      data = validate(entityName, { ...existing, ...data }, "update");
      const ruleTrace = runRules(entityName, "beforeUpdate", data);

      const current = find(col, id);
      if (!current) return null;
      assertWritable(entityName, current, precondition, "update", body);
      const row = update(col, id, {
        ...body,
        ...pickValidated(data, body),
        version: (current.version ?? 0) + 1,
        updated_at: nowIso(),
      });
      await runHooks(entityName, "afterUpdate", row);
      return answered(entityName, row, ruleTrace);
    },

    /**
     * Delete a record, naming the version it was read at. A record in a final
     * state is a completed transaction and is not deleted.
     */
    async remove(id, precondition) {
      const existing = find(col, id);
      if (!existing) return false;
      assertWritable(entityName, existing, precondition, "delete");
      await runHooks(entityName, "beforeDelete", existing);
      const current = find(col, id);
      if (!current) return false;
      assertWritable(entityName, current, precondition, "delete");
      const ok = remove(col, id);
      await runHooks(entityName, "afterDelete", existing);
      return ok;
    },
  };
}

// Only persist keys the caller actually supplied (plus any coercions on them).
function pickValidated(validated, body) {
  const out = {};
  for (const k of Object.keys(body)) if (k in validated) out[k] = validated[k];
  return out;
}

/** entityName -> service instance */
export const services = Object.fromEntries(
  (MODEL.entities ?? []).map((e) => [e.name, makeService(e.name)])
);
