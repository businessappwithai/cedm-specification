/** `node:fs/promises`: the promise half of the in-memory filesystem in `fs.ts`. */
import { promises } from "./fs";
export const { readFile, writeFile, mkdir, readdir, stat, access, copyFile, cp, rm, chmod, mkdtemp } = promises;
export default promises;
