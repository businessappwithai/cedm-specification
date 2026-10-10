import { describe, expect, it } from "bun:test";
import { generateKeyPairSync, verify } from "node:crypto";
import { deriveKey, open, openRecordRef, seal, sealRecordRef, secretEquals, signAssertion } from "../../gateway/crypto";

const SECRET = "a-test-secret-that-is-at-least-thirty-two-characters";

describe("record references", () => {
  const key = deriveKey(SECRET, "record-ref");

  it("round-trip for the person they were issued to", () => {
    const ref = sealRecordRef(key, "user-1", { table: "bus_account", id: "8b9d" });
    expect(openRecordRef(key, "user-1", ref)).toEqual({ table: "bus_account", id: "8b9d" });
  });

  it("do not open for another person", () => {
    const ref = sealRecordRef(key, "user-1", { table: "bus_account", id: "8b9d" });
    expect(openRecordRef(key, "user-2", ref)).toBeNull();
  });

  it("do not carry the id in readable form", () => {
    const ref = sealRecordRef(key, "user-1", { table: "bus_account", id: "0e4c2f1a-1111-4222-8333-944455556666" });
    expect(ref).not.toContain("0e4c2f1a");
    expect(ref).not.toContain("bus_account");
  });

  it("refuse a tampered or foreign ref", () => {
    const ref = sealRecordRef(key, "user-1", { table: "bus_account", id: "8b9d" });
    const flipped = ref.slice(0, -2) + (ref.endsWith("A") ? "B" : "A") + ref.slice(-1);
    expect(openRecordRef(key, "user-1", flipped)).toBeNull();
    expect(openRecordRef(key, "user-1", "rec_not-a-ref")).toBeNull();
    expect(openRecordRef(deriveKey(SECRET, "view-id"), "user-1", ref)).toBeNull();
  });
});

describe("sealed credentials", () => {
  it("bind to the subject they were sealed for", () => {
    const key = deriveKey(SECRET, "stored-credential");
    const sealed = seal(key, "app-token", "session:s1");
    expect(open(key, sealed, "session:s1")).toBe("app-token");
    expect(open(key, sealed, "session:s2")).toBeNull();
  });
});

describe("reporting assertions", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

  it("verify with the public key, for sixty seconds, for the reporting audience", () => {
    const now = Date.UTC(2026, 9, 4, 12, 0, 0);
    const token = signAssertion(pem, { email: "Sales.Manager@Example.com", name: "S", roles: ["sales_manager"], master: false }, now);
    const [payload, signature] = token.split(".");
    expect(verify(null, Buffer.from(payload!, "utf8"), publicKey, Buffer.from(signature!, "base64url"))).toBe(true);
    const claims = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"));
    expect(claims.aud).toBe("report");
    expect(claims.sub).toBe("sales.manager@example.com");
    expect(claims.exp - claims.iat).toBe(60);
    expect(typeof claims.jti).toBe("string");
  });

  it("fail verification when the payload is altered", () => {
    const token = signAssertion(pem, { email: "a@b.c", name: "A", roles: [], master: false });
    const [payload, signature] = token.split(".");
    const altered = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(payload!, "base64url").toString()), master: true }),
      "utf8"
    ).toString("base64url");
    expect(verify(null, Buffer.from(altered, "utf8"), publicKey, Buffer.from(signature!, "base64url"))).toBe(false);
  });
});

describe("secretEquals", () => {
  it("compares exactly", () => {
    expect(secretEquals("abc", "abc")).toBe(true);
    expect(secretEquals("abc", "abd")).toBe(false);
    expect(secretEquals("abc", "abcd")).toBe(false);
  });
});
