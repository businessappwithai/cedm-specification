// Optimistic locking: two people, one record.
//
// Every row carries a `version` that every write advances, and every read and
// write answers with it as an ETag, `"v<n>"`. An update or a delete names the
// version it was read at in `If-Match`; one made against a version somebody
// else has since replaced is refused with 409 `VERSION_CONFLICT`, carrying the
// record as it now stands, when it changed, the columns that differ and where
// its transaction stands, so a client can offer to refresh or to overwrite
// without asking again. The body is the generated Loco backend's, field for
// field, so one client speaks to either.
//
// An entity's `concurrency` decides what a write that names no version means:
// `optimistic` (the default) refuses it with 428 — a client that never read the
// record cannot overwrite it blind — and `last-write-wins` accepts it.
//
// A record in a final state of its state machine is a completed transaction:
// every update and every delete is refused with 409 `RECORD_FINAL`, whatever the
// entity's concurrency and whatever `If-Match` says.

import { MODEL } from "./model.js";
import { HttpError } from "./validate.js";
import { stateMachines } from "./workflows.js";

/** `"v3"` for a row at version 3. */
export function etagOf(row) {
  return typeof row?.version === "number" ? `"v${row.version}"` : null;
}

/**
 * The precondition a request names.
 *
 * `{ kind: "absent" }`, `{ kind: "any" }` for `*` — a deliberate overwrite —
 * or `{ kind: "version", version }` for `"v<n>"`. Anything else is a malformed
 * precondition, refused rather than read as permission to overwrite.
 */
export function parseIfMatch(header) {
  if (header === undefined || header === null || header === "") return { kind: "absent" };
  const raw = String(header).trim();
  if (raw === "*") return { kind: "any" };
  const match = /^"?v(\d+)"?$/.exec(raw);
  if (!match) {
    throw new HttpError(400, `Malformed If-Match header: expected "v<n>", got ${raw}`);
  }
  return { kind: "version", version: Number(match[1]) };
}

function concurrencyOf(entityName) {
  const meta = (MODEL.entities ?? []).find((entity) => entity.name === entityName);
  return meta?.concurrency === "last-write-wins" ? "last-write-wins" : "optimistic";
}

/** Where a record's transaction stands, for an entity with a state machine. */
export function transactionStatus(entityName, row) {
  const machine = stateMachines[entityName];
  if (!machine || !row) return null;
  const value = row[machine.statusField] ?? null;
  return {
    field: machine.statusField,
    value,
    label: value,
    isFinal: value !== null && machine.finals.includes(value),
  };
}

function isFinal(entityName, row) {
  return transactionStatus(entityName, row)?.isFinal === true;
}

class ConcurrencyError extends HttpError {
  constructor(code, message, conflict) {
    super(409, message);
    this.code = code;
    this.conflict = conflict;
  }

  toJSON() {
    return { statusCode: 409, error: this.code, message: this.message, conflict: this.conflict };
  }
}

function refusal(entityName, code, current, yourVersion, sent) {
  const changedFields = Object.keys(sent).filter(
    (column) => JSON.stringify(current[column]) !== JSON.stringify(sent[column])
  );
  return new ConcurrencyError(
    code,
    code === "RECORD_FINAL"
      ? "This record is in a final state: its transaction is complete and it cannot be changed."
      : "This record was changed by another user since you opened it.",
    {
      yourVersion,
      currentVersion: current.version ?? null,
      changedBy: current.updated_by ?? null,
      changedAt: current.updated_at ?? null,
      changedFields,
      current,
      status: transactionStatus(entityName, current),
      overwritable: code === "VERSION_CONFLICT",
    }
  );
}

/**
 * Throw unless `current` may be written by a request naming `precondition`.
 *
 * Called immediately before the write, with nothing awaited in between, so the
 * check and the write are one step: the runtime is single-threaded, and a
 * second request cannot change the row between them.
 *
 * `operation` is `"update"` or `"delete"`; `sent` is what the request would
 * write, which decides `changedFields` (empty for a delete).
 */
export function assertWritable(entityName, current, precondition, operation, sent = {}) {
  const yourVersion = precondition.kind === "version" ? precondition.version : null;
  if (isFinal(entityName, current)) {
    throw refusal(entityName, "RECORD_FINAL", current, yourVersion, sent);
  }
  if (precondition.kind === "absent") {
    if (concurrencyOf(entityName) === "optimistic") {
      throw new HttpError(
        428,
        `${operation === "update" ? "An update" : "A delete"} of ${entityName} must name the version it was read at: send If-Match: "v<version>" from the record's ETag.`
      );
    }
    return;
  }
  if (precondition.kind === "version" && precondition.version !== current.version) {
    throw refusal(entityName, "VERSION_CONFLICT", current, yourVersion, sent);
  }
}

export { ConcurrencyError };
