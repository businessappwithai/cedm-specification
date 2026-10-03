/**
 * The CEDM specification every generated application carries.
 *
 * Each domain is its own application, and all of them rest on one common
 * specification: the CEDM vocabulary and semantics (`specification/`), the
 * entity schema (`schema/`) and the domain catalogs (`domains/`). Every
 * generated project ships that common layer under `cedm/`, so the application
 * documents the contract it was built against and an administrator extending it
 * reads the same definitions the model's author did. A model written in CEDM
 * adds the library entity definitions it used (`cedm/entities/`) and the
 * application modules it imported (`cedm/applications/`).
 *
 * The bundle is documentation and provenance, not input: nothing in the
 * generated application reads it at run time. A failure to write it is not
 * fatal, the same as the manual and the manifest.
 */

import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { type CedmSource, locateCedmRoot } from "../model-cedm/library";

/** The common layer, bundled into every application. */
export const COMMON_CEDM_DIRECTORIES = ["specification", "schema", "domains"] as const;

async function copyYamlDirectory(from: string, to: string): Promise<string[]> {
  if (!existsSync(from)) return [];
  const copied: string[] = [];
  await fs.mkdir(to, { recursive: true });
  for (const entry of (await fs.readdir(from)).sort()) {
    if (!/\.ya?ml$/.test(entry)) continue;
    await fs.copyFile(path.join(from, entry), path.join(to, entry));
    copied.push(entry);
  }
  return copied;
}

const README = (sections: string[]) => `# CEDM specification

This application was generated from a model built on CEDM, the Common
Enterprise Domain Model. The files here are the specification it was built
against, bundled into every generated application so the contract travels
with the code:

${sections.join("\n")}

Nothing in the application reads these files at run time. The model itself is
in \`../model/\`.
`;

/** Write `cedm/` into a generated project. Returns the files written, relative to it. */
export async function writeCedmBundle(
  outputDir: string,
  source: CedmSource | undefined
): Promise<string[]> {
  const root = source?.root ?? locateCedmRoot();
  if (!root) return [];
  const target = path.join(outputDir, "cedm");
  const written: string[] = [];
  try {
    await fs.rm(target, { recursive: true, force: true });
    const sections: string[] = [];
    for (const directory of COMMON_CEDM_DIRECTORIES) {
      const files = await copyYamlDirectory(
        path.join(root, directory),
        path.join(target, directory)
      );
      written.push(...files.map((file) => path.join(directory, file)));
    }
    sections.push(
      "- `specification/` — vocabulary, lifecycle, business-rule, authorization, reporting and generation semantics, and the application profile",
      "- `schema/` — the shape of a CEDM entity",
      "- `domains/` — the domain and capability catalogs"
    );

    if (source?.libraryFiles.length) {
      await fs.mkdir(path.join(target, "entities"), { recursive: true });
      for (const file of [...source.libraryFiles].sort()) {
        const name = path.basename(file);
        await fs.copyFile(path.join(root, file), path.join(target, "entities", name));
        written.push(path.join("entities", name));
      }
      sections.push("- `entities/` — the library entity definitions this application imports");
    }
    if (source?.moduleFiles.length) {
      await fs.mkdir(path.join(target, "applications"), { recursive: true });
      for (const file of [...source.moduleFiles].sort()) {
        const name = path.basename(file);
        await fs.copyFile(file, path.join(target, "applications", name));
        written.push(path.join("applications", name));
      }
      sections.push("- `applications/` — the application modules the model imports");
    }

    await fs.writeFile(path.join(target, "README.md"), README(sections), "utf-8");
    written.push("README.md");
  } catch {
    // Non-fatal, like the manual and the manifest.
  }
  return written;
}
