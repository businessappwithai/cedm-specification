/**
 * Every secret the gateway derives, seals or signs.
 *
 * - **Keys** come from `CHAT_AUTH_SECRET` by HKDF, one per purpose, so a key
 *   leaked from one use opens nothing else.
 * - **Record references** are what the model sees instead of a record id:
 *   AES-256-GCM over `{entity, id}` bound to the person's user id as associated
 *   data. The model cannot read the id out of one, cannot forge one, and a ref
 *   minted for one person does not open for another.
 * - **Stored credentials** — the person's application token and reporting
 *   session token — are sealed the same way before they touch the database.
 * - **Reporting assertions** are Ed25519-signed, sixty seconds long and single
 *   use; the reporting platform verifies them with the public half.
 */

import {
  createCipheriv,
  createDecipheriv,
  createPrivateKey,
  hkdfSync,
  randomBytes,
  randomUUID,
  sign,
  timingSafeEqual,
} from "node:crypto";

const IV_BYTES = 12;
const TAG_BYTES = 16;

export type KeyPurpose = "record-ref" | "stored-credential" | "view-id";

export function deriveKey(secret: string, purpose: KeyPurpose): Buffer {
  return Buffer.from(hkdfSync("sha256", Buffer.from(secret, "utf8"), Buffer.alloc(0), `appwithai-chat/${purpose}`, 32));
}

/** AES-256-GCM, `iv ‖ tag ‖ ciphertext`, base64url. */
export function seal(key: Buffer, plaintext: string, associated: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(associated, "utf8"));
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

/** The inverse of {@link seal}; `null` for anything that was not sealed with this key for this subject. */
export function open(key: Buffer, sealed: string, associated: string): string | null {
  let raw: Buffer;
  try {
    raw = Buffer.from(sealed, "base64url");
  } catch {
    return null;
  }
  if (raw.length <= IV_BYTES + TAG_BYTES) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, IV_BYTES));
    decipher.setAAD(Buffer.from(associated, "utf8"));
    decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export interface RecordTarget {
  /** The bus table, e.g. `bus_account`. */
  table: string;
  id: string;
}

const REF_PREFIX = "rec_";

export function sealRecordRef(key: Buffer, userId: string, target: RecordTarget): string {
  return REF_PREFIX + seal(key, JSON.stringify([target.table, target.id]), `ref:${userId}`);
}

export function openRecordRef(key: Buffer, userId: string, ref: string): RecordTarget | null {
  if (typeof ref !== "string" || !ref.startsWith(REF_PREFIX)) return null;
  const plain = open(key, ref.slice(REF_PREFIX.length), `ref:${userId}`);
  if (plain === null) return null;
  try {
    const [table, id] = JSON.parse(plain) as unknown[];
    if (typeof table !== "string" || typeof id !== "string") return null;
    return { table, id };
  } catch {
    return null;
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Constant-time string equality for secrets of any length. */
export function secretEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export interface Assertion {
  iss: "appwithai-chat";
  aud: "report";
  sub: string;
  name: string;
  roles: string[];
  master: boolean;
  jti: string;
  iat: number;
  exp: number;
}

/**
 * A sixty-second, single-use statement that `sub` is signed in with these roles,
 * as `base64url(payload).base64url(signature)`.
 */
export function signAssertion(
  privateKeyPem: string,
  subject: { email: string; name: string; roles: string[]; master: boolean },
  now = Date.now()
): string {
  const iat = Math.floor(now / 1000);
  const payload: Assertion = {
    iss: "appwithai-chat",
    aud: "report",
    sub: subject.email.toLowerCase(),
    name: subject.name,
    roles: subject.roles,
    master: subject.master,
    jti: randomUUID(),
    iat,
    exp: iat + 60,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(null, Buffer.from(encoded, "utf8"), createPrivateKey(privateKeyPem));
  return `${encoded}.${signature.toString("base64url")}`;
}
