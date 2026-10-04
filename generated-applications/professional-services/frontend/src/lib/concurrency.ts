/**
 * Optimistic locking, as the screens see it.
 *
 * Every record the API returns carries its `version`, and every save names the
 * version it was read at (`If-Match: "v<n>"`). When someone else has saved the
 * record since, the API refuses with 409 and a `conflict` describing the record
 * as it now stands — who changed it, when, which fields, and where its
 * transaction stands — so the screen can offer to refresh or to overwrite
 * without a second request. A record in a final state of its lifecycle is a
 * completed transaction: the API refuses every save to it, and the only choice
 * offered is to refresh.
 *
 * The backend's half is `services/concurrency.rs`; the shapes below are its
 * response, field for field.
 */

/** Where a record's transaction stands. Present only on tables with a lifecycle. */
export interface TransactionStatus {
  field: string;
  value: string | null;
  label: string | null;
  isFinal: boolean;
}

/** The `conflict` a 409 carries. */
export interface VersionConflict {
  yourVersion: number | null;
  currentVersion: number | null;
  changedBy: string | null;
  changedAt: string | null;
  changedFields: string[];
  current: Record<string, unknown>;
  status: TransactionStatus | null;
  /** False for a record in a final state: refresh is the only way forward. */
  overwritable: boolean;
}

/** The two refusals, by the code the API puts in `error`. */
export type ConcurrencyCode = "VERSION_CONFLICT" | "RECORD_FINAL";

export interface ConcurrencyError {
  statusCode: 409;
  error: ConcurrencyCode;
  message: string;
  conflict: VersionConflict;
}

/** Whether an error thrown by the API client is a concurrency refusal. */
export function isConcurrencyError(error: unknown): error is ConcurrencyError {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as Partial<ConcurrencyError>;
  return (
    candidate.statusCode === 409 &&
    (candidate.error === "VERSION_CONFLICT" || candidate.error === "RECORD_FINAL") &&
    typeof candidate.conflict === "object" &&
    candidate.conflict !== null
  );
}

/** The record's version, when it has one. */
export function versionOf(record: Record<string, unknown> | null | undefined): number | null {
  const version = record?.version;
  return typeof version === "number" && Number.isFinite(version) ? version : null;
}

/**
 * The `If-Match` header a save of `record` sends: the version it was read at.
 *
 * A record with no version — one the API never returned, so there is nothing
 * it could have been read at — sends no header, and an optimistic table then
 * answers 428 rather than letting the save overwrite blind.
 */
export function ifMatch(record: Record<string, unknown> | null | undefined): Record<string, string> {
  const version = versionOf(record);
  return version === null ? {} : { "If-Match": `"v${version}"` };
}

/** `Closed Won` — or `Closed Won (final)` — for a status line. */
export function describeStatus(status: TransactionStatus | null | undefined): string | null {
  if (!status || status.value === null) return null;
  const label = status.label ?? status.value;
  return status.isFinal ? `${label} (final)` : label;
}

/** The transaction status a save's response carries, if its table has a lifecycle. */
export function transactionStatusOf(response: unknown): TransactionStatus | null {
  if (typeof response !== "object" || response === null) return null;
  const status = (response as { transactionStatus?: unknown }).transactionStatus;
  if (typeof status !== "object" || status === null) return null;
  const candidate = status as Partial<TransactionStatus>;
  return typeof candidate.field === "string" && typeof candidate.isFinal === "boolean"
    ? (candidate as TransactionStatus)
    : null;
}

/** Keys a response carries that are not columns, and so are never saved back. */
export const RESPONSE_ONLY_KEYS = ["promotion", "transactionStatus"] as const;

/** `record` without the response-only keys. */
export function withoutResponseKeys(record: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...record };
  for (const key of RESPONSE_ONLY_KEYS) delete copy[key];
  return copy;
}
