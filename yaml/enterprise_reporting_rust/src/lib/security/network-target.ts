/**
 * Where this server is willing to open an outbound database connection.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 *
 * `POST /api/data-sources/test` takes a host and a port from the request body
 * and connects to them. A security review pointed out what that is when the
 * caller is not trusted: server-side request forgery. Any authenticated user
 * could aim the server at anything it could reach — `127.0.0.1`, another
 * container, `169.254.169.254`, a neighbour's subnet — and read the outcome,
 * because a refused connection, a TLS error and a authentication failure are
 * three distinguishable messages. That is a port scanner with the server's own
 * network position.
 *
 * The feature is legitimate: connecting to a database somebody else operates is
 * the entire product. So this is not a ban, it is a boundary — private,
 * loopback and link-local space is refused unless an operator says otherwise,
 * because those are the addresses a user has no business naming and the ones
 * worth reaching for if they do.
 *
 * ── Configuration ──────────────────────────────────────────────────────────
 *
 * `ALLOW_PRIVATE_DATA_SOURCES=1` turns the check off entirely. That is the
 * right setting for a compose file where the database is a sibling container at
 * `postgres:5432`, and the wrong one for anything reachable from outside — so
 * it is opt-in rather than a default, and the reason has to be understood
 * before it is set.
 *
 * `DATA_SOURCE_HOST_ALLOWLIST` is the narrower form: a comma-separated list of
 * hostnames that may resolve into private space anyway. Prefer it.
 *
 * ── What this cannot do ────────────────────────────────────────────────────
 *
 * DNS is checked here and the connection is made later, so a name that resolves
 * differently between the two wins. Closing that properly means resolving once
 * and connecting to the literal address, which `connection-manager.ts` already
 * does for its own reasons (`resolveIPv4`) — this check runs over the same
 * resolution, so the window is small rather than absent. It is a real
 * limitation and worth knowing before treating this as airtight.
 */

import { isIP } from "node:net";
import { promises as dns } from "node:dns";

export interface TargetDecision {
  allowed: boolean;
  reason?: string;
}

function envAllowlist(): Set<string> {
  const raw = process.env.DATA_SOURCE_HOST_ALLOWLIST ?? "";
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Loopback, private, link-local, carrier-grade NAT, and the unspecified
 * address — in both families.
 */
export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts as [number, number, number, number];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast and reserved
    return false;
  }

  if (family === 6) {
    const lower = address.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    // IPv4-mapped (::ffff:10.0.0.1) carries a v4 address that must be judged as one.
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped?.[1]) return isPrivateAddress(mapped[1]);
    return false;
  }

  return false;
}

/**
 * May this server connect to `host`?
 *
 * Resolves a hostname before judging it, so `evil.example.com A 127.0.0.1` is
 * refused rather than passing on the strength of not looking like an address.
 */
export async function checkDataSourceHost(host: string | undefined): Promise<TargetDecision> {
  if (!host?.trim()) return { allowed: true }; // a file or connection string; not ours to judge

  const hostname = host.trim().toLowerCase();

  if (process.env.ALLOW_PRIVATE_DATA_SOURCES === "1") return { allowed: true };
  if (envAllowlist().has(hostname)) return { allowed: true };

  const candidates: string[] = [];
  if (isIP(hostname)) {
    candidates.push(hostname);
  } else {
    try {
      const resolved = await dns.lookup(hostname, { all: true });
      for (const entry of resolved) candidates.push(entry.address);
    } catch {
      // A name that does not resolve cannot be connected to either. Let the
      // connection attempt produce the error, which is clearer than this one.
      return { allowed: true };
    }
  }

  const blocked = candidates.filter(isPrivateAddress);
  if (blocked.length > 0) {
    return {
      allowed: false,
      reason:
        `"${host}" resolves to a private or loopback address (${blocked[0]}), which this ` +
        "server will not connect to. If the database really is on the internal network, add " +
        "its hostname to DATA_SOURCE_HOST_ALLOWLIST, or set ALLOW_PRIVATE_DATA_SOURCES=1 " +
        "when every user of this installation is trusted with its network position.",
    };
  }

  return { allowed: true };
}
