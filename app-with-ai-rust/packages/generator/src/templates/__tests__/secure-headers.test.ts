/**
 * No generated environment may send `Clear-Site-Data` on every response.
 *
 * Loco's `owasp` preset includes `Clear-Site-Data: "cache","cookies","storage"`,
 * and the secure-headers middleware adds it to every response it serves. That
 * header is meant for a sign-out response. On every response it deletes the
 * session as soon as one exists: the `token` cookie (cookies are not scoped by
 * port, so a front end on another port loses it too) and, wherever the front
 * end shares the backend's origin behind a proxy, the bearer token it keeps in
 * sessionStorage. Signing in worked; the next page load signed the user out.
 *
 * `overrides` can replace a preset's value but not drop a header, so the
 * production config spells the OWASP headers out over the `empty` preset. This
 * holds both halves: the header stays out, and the rest of the OWASP set stays
 * in, so the fix cannot quietly become "no secure headers at all".
 *
 * Regression: found by /qa on 2026-09-26, composing the generated app under
 * /app behind nginx (app-and-report-with-ai-rust).
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CONFIG = path.join(
  import.meta.dirname,
  "../../../templates/tanstack-astryx-loco/backend/config"
);

/** The `secure_headers:` block of a config, up to the next key at its indent. */
function secureHeadersBlock(source: string): string | null {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.trim() === "secure_headers:");
  if (start === -1) return null;
  const indent = lines[start]?.search(/\S/) ?? 0;
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() !== "" && !line.trim().startsWith("#") && line.search(/\S/) <= indent) break;
    body.push(line);
  }
  return body.join("\n");
}

const configs = readdirSync(CONFIG)
  .filter((name) => name.endsWith(".yaml.hbs"))
  .map((name) => ({ name, source: readFileSync(path.join(CONFIG, name), "utf-8") }));

describe("secure headers in the generated backend's config", () => {
  it("finds the production config", () => {
    expect(configs.map((c) => c.name)).toContain("production.yaml.hbs");
  });

  for (const { name, source } of configs) {
    it(`${name} does not send Clear-Site-Data on every response`, () => {
      const block = secureHeadersBlock(source);
      if (block === null) return;
      expect(block).not.toMatch(/^\s*preset:\s*owasp\s*$/m);
      expect(block).not.toMatch(/^\s*Clear-Site-Data\s*:/im);
    });
  }

  it("production keeps the rest of the OWASP set", () => {
    const source = configs.find((c) => c.name === "production.yaml.hbs")?.source ?? "";
    const block = secureHeadersBlock(source) ?? "";
    expect(block).toMatch(/^\s*enable:\s*true\s*$/m);
    for (const header of [
      "Content-Security-Policy",
      "Cross-Origin-Opener-Policy",
      "Referrer-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
    ]) {
      expect(block).toMatch(new RegExp(`^\\s*${header}\\s*:`, "m"));
    }
  });
});
