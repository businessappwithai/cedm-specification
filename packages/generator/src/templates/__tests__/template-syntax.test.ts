/**
 * Every `.hbs` template must parse.
 *
 * The motivating failure: `${BACKEND_PORT:-{{config.port}}}` in
 * `docker-compose.yml.hbs`. A shell expansion closing immediately after a
 * Handlebars expression leaves three consecutive braces; Handlebars reads the
 * first two as its terminator and throws on the third. It is the same
 * two-braces trap as an inline `style={ {...} }` object in a `.tsx` template.
 *
 * That one shipped because nothing parsed the templates until generation ran,
 * and generation swallowed the error. Both of those are fixed; this is the
 * guard that keeps a new one from reaching a user at all.
 */

import Handlebars from "handlebars";
import { readdirSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

const TEMPLATE_ROOT = path.resolve(__dirname, "../../../templates");

function templateFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...templateFiles(full));
    else if (entry.endsWith(".hbs")) found.push(full);
  }
  return found;
}

const templates = templateFiles(TEMPLATE_ROOT);

describe("Handlebars templates", () => {
  it("finds the template tree", () => {
    expect(templates.length).toBeGreaterThan(100);
  });

  it.each(templates.map((file) => [path.relative(TEMPLATE_ROOT, file), file]))(
    "%s parses",
    (_name, file) => {
      const source = readFileSync(file, "utf-8");
      expect(() => Handlebars.precompile(source)).not.toThrow();
    }
  );

  /**
   * A parse check alone would not have caught this: the trap is only a parse
   * error when the third brace lands on a `}}` terminator, so a near-miss can
   * lurk until someone edits the line next to it. Name the shape directly.
   */
  it.each(templates.map((file) => [path.relative(TEMPLATE_ROOT, file), file]))(
    "%s writes shell expansions through the helpers",
    (name, file) => {
      const offenders = readFileSync(file, "utf-8")
        .split("\n")
        .map((line, index) => ({ line, number: index + 1 }))
        // `${VAR:-` or `${VAR:?` on the same line as a Handlebars expression.
        .filter(({ line }) => /\$\{[A-Za-z_][A-Za-z0-9_]*:[-?]/.test(line) && line.includes("{{"))
        .map(({ line, number }) => `${name}:${number}: ${line.trim()}`);

      expect(
        offenders,
        "use {{shellDefault \"VAR\" fallback}} / {{shellRequired \"VAR\"}} instead — " +
          "an inline ${VAR:-{{x}}} ends in three braces and will not parse"
      ).toEqual([]);
    }
  );

  /**
   * Loco's config loader rewrites the *whole* config file — comments included —
   * before Tera renders it, so neither of its delimiters may be written out in
   * prose there. Both halves fail, and neither is visible until the app boots:
   *
   *   - a doubled brace is the legacy form. It earns a deprecation warning on
   *     every `cargo loco` command, and, because a brace opens a flow mapping,
   *     leaves the file invalid YAML at rest — a formatter that reads it as
   *     YAML respaces the braces and the app stops starting.
   *   - a complete YAML-safe tag is translated to the Tera form and then
   *     *evaluated*, so an illustrative `... ` inside one is parsed as an
   *     expression and boot fails outright. That is how this test was earned.
   *
   * Only `config/*.yaml.hbs` is checked: a doubled brace elsewhere in the
   * template tree is ordinary Handlebars.
   */
  const configTemplates = templates.filter((file) =>
    /[\\/]config[\\/][^\\/]+\.yaml\.hbs$/.test(file)
  );

  it("finds the Loco config templates", () => {
    expect(configTemplates.length).toBeGreaterThan(0);
  });

  it.each(configTemplates.map((file) => [path.relative(TEMPLATE_ROOT, file), file]))(
    "%s writes no template delimiter inside a comment",
    (name, file) => {
      const offenders = readFileSync(file, "utf-8")
        .split("\n")
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => /^\s*#/.test(line))
        // A plain `{{x}}` here is Handlebars and is consumed at generation, so
        // it never reaches Loco. An *escaped* one survives into the output as a
        // literal doubled brace, and a YAML-safe tag is passed through whole.
        .filter(({ line }) => line.includes("\\{{") || /<%.*%>/.test(line))
        .map(({ line, number }) => `${name}:${number}: ${line.trim()}`);

      expect(
        offenders,
        "Loco rewrites comments too: describe the delimiters in words rather " +
          "than writing one out, or the generated app fails to load its config"
      ).toEqual([]);
    }
  );

  /**
   * And the values themselves must use the YAML-safe form, so the file parses
   * as YAML before rendering and survives a formatter untouched.
   */
  it.each(configTemplates.map((file) => [path.relative(TEMPLATE_ROOT, file), file]))(
    "%s reads the environment through YAML-safe tags",
    (name, file) => {
      const offenders = readFileSync(file, "utf-8")
        .split("\n")
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => /\\?\{\{\s*get_env\(/.test(line))
        .map(({ line, number }) => `${name}:${number}: ${line.trim()}`);

      expect(
        offenders,
        "write get_env(...) in Loco's YAML-safe delimiters, not Tera's native " +
          "doubled braces — see https://github.com/loco-rs/loco/issues/1727"
      ).toEqual([]);
    }
  );
});
