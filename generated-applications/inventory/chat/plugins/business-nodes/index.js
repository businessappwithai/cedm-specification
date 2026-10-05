// @ts-check
/**
 * Host half of the business cards: nothing runs here. The row exists so the
 * composition mounts the package, and its browser half (`./client`, declared
 * under `dsh.client`) is shipped to the Web client with the rest of the roster.
 * @module @appwithai/chat-business-nodes
 */
export const name = "chat-business-nodes";

/** No host-side behaviour. */
export function apply() {}
