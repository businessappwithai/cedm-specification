/**
 * Regenerate rust/migration/help-articles.json from src/lib/db/help-seed.ts.
 *
 * The help articles are the one seed `bootstrapSchema()` writes that is data
 * rather than accounts, and the Rust boot seeds the same rows
 * (`src/bootstrap.rs`). Like the baseline DDL they are extracted rather than
 * retyped, so the two backends cannot come to disagree about what the help
 * panel says. Run it whenever help-seed.ts changes:
 *
 *     bun rust/parity/extract-help-articles.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { HELP_ARTICLES } from "../../src/lib/db/help-seed";

const out = join(import.meta.dir, "..", "migration", "help-articles.json");
writeFileSync(out, `${JSON.stringify(HELP_ARTICLES, null, 2)}\n`);
console.log(`wrote ${out} (${HELP_ARTICLES.length} articles)`);
