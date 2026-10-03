/**
 * Cross-check the Rust AES-256-GCM implementation against Node's
 * (MIGRATION_PLAN.md §4.3).
 *
 *   bun rust/parity/crypto-roundtrip.ts            # writes the Node fixture the Rust test decrypts
 *   bun rust/parity/crypto-roundtrip.ts <cipher>   # decrypts a Rust-produced ciphertext in Node
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

process.env.ENCRYPTION_KEY = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
const { encrypt, decrypt } = await import("../../src/lib/security/encryption");

const arg = process.argv[2];
if (arg) {
  console.log(decrypt(arg));
} else {
  const out = join(import.meta.dir, "fixtures", "node-ciphertext.txt");
  writeFileSync(out, `${encrypt('{"host":"localhost"}')}\n`);
  console.log(`wrote ${out}`);
}
