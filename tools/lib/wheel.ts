/**
 * Reading data files out of a Python wheel, which is a zip archive.
 *
 * The reference data is built from two published registries packaged as
 * wheels (pycountry, geonamescache). Reading the archive directly — central
 * directory, then each entry stored or deflated — needs nothing beyond
 * node:zlib, so building the reference data needs neither Python nor a zip
 * dependency.
 */

import { inflateRawSync } from "node:zlib";

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

export class Wheel {
  private readonly entries = new Map<string, { method: number; size: number; offset: number }>();

  constructor(private readonly bytes: Buffer) {
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
      if (bytes.readUInt32LE(i) === EOCD) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new Error("not a zip archive (no end of central directory)");
    const count = bytes.readUInt16LE(eocd + 10);
    let at = bytes.readUInt32LE(eocd + 16);
    for (let n = 0; n < count; n++) {
      if (bytes.readUInt32LE(at) !== CENTRAL) throw new Error("corrupt zip central directory");
      const method = bytes.readUInt16LE(at + 10);
      const size = bytes.readUInt32LE(at + 20);
      const nameLength = bytes.readUInt16LE(at + 28);
      const extraLength = bytes.readUInt16LE(at + 30);
      const commentLength = bytes.readUInt16LE(at + 32);
      const offset = bytes.readUInt32LE(at + 42);
      const name = bytes.toString("utf-8", at + 46, at + 46 + nameLength);
      this.entries.set(name, { method, size, offset });
      at += 46 + nameLength + extraLength + commentLength;
    }
  }

  /** An entry's contents, as text. */
  text(name: string): string {
    const entry = this.entries.get(name);
    if (!entry) throw new Error(`the wheel has no ${name}`);
    const at = entry.offset;
    if (this.bytes.readUInt32LE(at) !== LOCAL) throw new Error(`corrupt zip entry ${name}`);
    const start = at + 30 + this.bytes.readUInt16LE(at + 26) + this.bytes.readUInt16LE(at + 28);
    const data = this.bytes.subarray(start, start + entry.size);
    if (entry.method === 0) return data.toString("utf-8");
    if (entry.method === 8) return inflateRawSync(data).toString("utf-8");
    throw new Error(`${name}: unsupported zip compression method ${entry.method}`);
  }
}
