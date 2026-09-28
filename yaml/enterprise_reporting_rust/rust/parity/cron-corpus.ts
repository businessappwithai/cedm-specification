/**
 * Generate the cron-matcher corpus the Rust test `monitoring::cron` replays
 * (MIGRATION_PLAN.md §4.6). The Node matcher is not exported, so its three
 * functions are lifted out of monitoring-scheduler.ts verbatim and evaluated
 * here — the corpus is what *that code* says, not a re-implementation.
 *
 *   bun rust/parity/cron-corpus.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const root = join(import.meta.dir, "..", "..");
const src = readFileSync(join(root, "src/lib/monitoring/monitoring-scheduler.ts"), "utf8");

function lift(name: string): string {
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`no function ${name}`);
  let depth = 0;
  for (let i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

const code = ts.transpile(
  [lift("matchesCronField"), lift("cronMatches"), lift("cronMatchesWithTimezone")].join("\n") +
    "\nreturn cronMatchesWithTimezone;",
  { target: ts.ScriptTarget.ES2020 }
);
const cronMatchesWithTimezone = new Function(code)() as (c: string, d: Date, tz: string) => boolean;

const expressions = [
  "* * * * *", "*/5 * * * *", "*/15 9-17 * * 1-5", "0 9 * * *", "30 8 1 * *", "0 0 * * 0",
  "0 9 23 * 3", "5/10 * * * *", "2-20/5 * * * *", "0 */2 * * *", "0 9,12,18 * * *",
  "15 14 1-7 * 1", "0 0 29 2 *", "* * * * 7", "0 12 * 1-3,10-12 *", "5abc * * * *",
  "abc * * * *", "*/0 * * * *", "0 9 * * * *", "0 25 * * *", "-5 * * * *", "3- * * * *",
];
const zones = ["UTC", "America/New_York", "Asia/Kolkata", "Australia/Lord_Howe", "Not/AZone", ""];

// Every 7th minute across two weeks spanning the US DST change, plus Feb 29.
const minutes: string[] = [];
for (let t = Date.UTC(2026, 10, 25); t < Date.UTC(2026, 11, 9); t += 7 * 60_000) {
  minutes.push(new Date(t).toISOString());
}
for (let t = Date.UTC(2028, 1, 28, 23); t < Date.UTC(2028, 2, 1, 1); t += 60_000) {
  minutes.push(new Date(t).toISOString());
}

const cases: { cron: string; tz: string; matches: number[] }[] = [];
for (const cron of expressions) {
  for (const tz of zones) {
    cases.push({
      cron,
      tz,
      matches: minutes.flatMap((m, i) => (cronMatchesWithTimezone(cron, new Date(m), tz) ? [i] : [])),
    });
  }
}
const out = join(import.meta.dir, "fixtures", "cron-corpus.json");
writeFileSync(out, JSON.stringify({ minutes, cases }));
console.log(`wrote ${out}: ${cases.length} cases × ${minutes.length} minutes`);
