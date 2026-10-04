/**
 * The application inside a conversation.
 *
 * The chat (`chat/`, generated beside this front end) opens this application's
 * own screens in a frame, so the person creates, edits and moves records here —
 * under this application's validation, rules, permissions and optimistic
 * locking — and never through the assistant. Three things make that work, and
 * all three live in this file so there is one statement of the contract:
 *
 * - **`?embed=1` drops the chrome.** The frame is a card in a scrolling
 *   conversation; a sidebar and header inside it would be a second application
 *   nested in the first. The flag is remembered for the frame's session, so a
 *   save that navigates from `/new` to the record it created stays chromeless.
 * - **`?edit=1` and `?transition=<state>` say what the screen was opened for.**
 *   An update form opens in edit mode; an approval opens with the move the
 *   assistant proposed marked — the person still presses it.
 * - **Every accepted write is reported to the frame's parent** as a
 *   `record-saved` message, posted to this application's own origin only. The
 *   chat validates the source, the origin and the shape, reads the record back
 *   through its own session, and only then tells the assistant — so the
 *   assistant's "saved" is the server's, never the frame's.
 *
 * Outside a frame none of this changes anything: `isEmbedded()` is false and
 * `notifySaved` posts nothing.
 */
import type { TransactionStatus } from "@/lib/concurrency";

const STORAGE_KEY = "appwithai.embed";

/** The message the chat listens for. Versioned: the chat refuses any other `v`. */
export interface RecordSavedMessage {
  source: "appwithai-app";
  v: 1;
  type: "record-saved";
  operation: "create" | "update" | "transition" | "delete";
  id: string;
  version: number | null;
  transactionStatus: TransactionStatus | null;
}

function searchParams(): URLSearchParams | null {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
}

function framed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.parent !== window;
  } catch {
    // A cross-origin parent throws on access: still a frame, and not ours to
    // report to, which `notifySaved` handles by posting to our own origin only.
    return true;
  }
}

/** True when this page is the chat's embedded view of a screen. */
export function isEmbedded(): boolean {
  if (!framed()) return false;
  const params = searchParams();
  try {
    if (params?.get("embed") === "1") {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      return true;
    }
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage refused (a sandboxed frame without it): the URL alone decides.
    return params?.get("embed") === "1";
  }
}

/** What the screen was opened for: edit mode, and a proposed workflow move. */
export function embedIntent(): { edit: boolean; transition: string | null } {
  const params = searchParams();
  if (!params || !isEmbedded()) return { edit: false, transition: null };
  const transition = params.get("transition");
  return {
    edit: params.get("edit") === "1",
    transition: transition && /^[A-Za-z0-9_.-]{1,64}$/.test(transition) ? transition : null,
  };
}

/**
 * Tell the conversation a write was accepted.
 *
 * Posted with this application's own origin as the target, so a frame that is
 * not the chat — anything else that framed this page — receives nothing.
 */
export function notifySaved(
  operation: RecordSavedMessage["operation"],
  record: Record<string, unknown> | null,
  id: string
): void {
  if (!isEmbedded()) return;
  const version = record && typeof record.version === "number" ? record.version : null;
  const status = record?.transactionStatus;
  const message: RecordSavedMessage = {
    source: "appwithai-app",
    v: 1,
    type: "record-saved",
    operation,
    id,
    version,
    transactionStatus:
      status && typeof status === "object" ? (status as TransactionStatus) : null,
  };
  try {
    window.parent.postMessage(message, window.location.origin);
  } catch {
    // A parent on another origin rejects the post; nothing to report to.
  }
}
