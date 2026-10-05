// @ts-check
/**
 * The one way a business tool reaches data: the gateway's internal tool API,
 * on loopback, authenticated by the secret the gateway gave this host when it
 * started it.
 *
 * A Harness host is started per person, so the host *is* the person: the
 * gateway answers with that person's application and reporting sessions, and
 * the applications apply their own authorisation to every call. Nothing here
 * holds a credential, a database URL, a token or SQL, and nothing the gateway
 * returns carries one — record identifiers come back as opaque references the
 * gateway resolves again on the way in.
 */

const GATEWAY_URL_ENV = "CHAT_GATEWAY_INTERNAL_URL";
const HOST_SECRET_ENV = "CHAT_HOST_SECRET";

/** A refusal the person should hear about in words, not as a stack trace. */
export class GatewayRefusal extends Error {
  /**
   * @param {number} status - HTTP status the gateway answered with.
   * @param {string} code - stable machine code (`FORBIDDEN`, `NOT_FOUND`, `EXPIRED`, …).
   * @param {string} message - the sentence to say.
   */
  constructor(status, code, message) {
    super(message);
    this.name = "GatewayRefusal";
    this.status = status;
    this.code = code;
  }
}

/** @returns {{ url: string, secret: string }} */
function connection() {
  const url = process.env[GATEWAY_URL_ENV];
  const secret = process.env[HOST_SECRET_ENV];
  if (!url || !secret) {
    throw new Error(
      `business tools: ${GATEWAY_URL_ENV} and ${HOST_SECRET_ENV} must be set; ` +
        "this host was not started by the chat gateway"
    );
  }
  const parsed = new URL(url);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)) {
    throw new Error(`business tools: ${GATEWAY_URL_ENV} must be a loopback address`);
  }
  return { url: url.replace(/\/+$/, ""), secret };
}

/**
 * Call one tool operation on the gateway.
 * @param {string} operation - the tool's wire name.
 * @param {Record<string, unknown>} args - the validated tool arguments.
 * @param {AbortSignal | undefined} signal - the tool call's cancellation.
 * @returns {Promise<any>} the gateway's JSON answer.
 */
export async function callGateway(operation, args, signal) {
  const { url, secret } = connection();
  const response = await fetch(`${url}/internal/tools/${encodeURIComponent(operation)}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-chat-host-secret": secret },
    body: JSON.stringify(args),
    signal,
  });
  const text = await response.text();
  /** @type {any} */
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new GatewayRefusal(502, "BAD_GATEWAY", "The chat gateway answered with something that is not JSON.");
  }
  if (!response.ok) {
    throw new GatewayRefusal(
      response.status,
      typeof body?.code === "string" ? body.code : "ERROR",
      typeof body?.message === "string" ? body.message : `The chat gateway refused the request (${response.status}).`
    );
  }
  return body;
}
