/**
 * `node:crypto`, as far as the generation pipeline uses it: `createHash("sha1")`
 * for the dictionary's deterministic UUIDv5 ids (`uuidv5` in
 * `dictionary-seed.ts`). WebCrypto's digest is asynchronous and the pipeline's
 * call is not, so SHA-1 is computed here, synchronously, and returned as a
 * `Buffer` exactly as Node returns it.
 */

import { Buffer } from "node:buffer";

function sha1(message: Uint8Array): Uint8Array {
  const length = message.length;
  const words = new Uint32Array((((length + 8) >> 6) + 1) * 16);
  for (let i = 0; i < length; i++) {
    words[i >> 2] = (words[i >> 2] ?? 0) | ((message[i] as number) << (24 - (i % 4) * 8));
  }
  words[length >> 2] = (words[length >> 2] ?? 0) | (0x80 << (24 - (length % 4) * 8));
  words[words.length - 1] = length * 8;
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);
  for (let block = 0; block < words.length; block += 16) {
    for (let t = 0; t < 16; t++) w[t] = words[block + t] as number;
    for (let t = 16; t < 80; t++) {
      const x = (w[t - 3] as number) ^ (w[t - 8] as number) ^ (w[t - 14] as number) ^ (w[t - 16] as number);
      w[t] = (x << 1) | (x >>> 31);
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let t = 0; t < 80; t++) {
      const f = t < 20 ? (b & c) | (~b & d) : t < 40 ? b ^ c ^ d : t < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d;
      const k = t < 20 ? 0x5a827999 : t < 40 ? 0x6ed9eba1 : t < 60 ? 0x8f1bbcdc : 0xca62c1d6;
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + (w[t] as number)) >>> 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }
  const out = new Uint8Array(20);
  [h0, h1, h2, h3, h4].forEach((h, i) => {
    out[i * 4] = h >>> 24;
    out[i * 4 + 1] = (h >>> 16) & 0xff;
    out[i * 4 + 2] = (h >>> 8) & 0xff;
    out[i * 4 + 3] = h & 0xff;
  });
  return out;
}

class Hash {
  private readonly chunks: Uint8Array[] = [];

  update(data: string | Uint8Array): Hash {
    this.chunks.push(typeof data === "string" ? new TextEncoder().encode(data) : data);
    return this;
  }

  digest(encoding?: "hex"): Buffer | string {
    const total = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const joined = new Uint8Array(total);
    let at = 0;
    for (const chunk of this.chunks) {
      joined.set(chunk, at);
      at += chunk.length;
    }
    const digest = Buffer.from(sha1(joined));
    return encoding ? digest.toString(encoding) : digest;
  }
}

export function createHash(algorithm: string): Hash {
  if (algorithm.toLowerCase() !== "sha1") {
    throw new Error(`createHash("${algorithm}") is not available in the browser build`);
  }
  return new Hash();
}

export default { createHash };
