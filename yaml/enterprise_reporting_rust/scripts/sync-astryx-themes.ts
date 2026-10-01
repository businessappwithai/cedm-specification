/**
 * Regenerates the Astryx design themes from the published packages.
 *
 *   bun scripts/sync-astryx-themes.ts            # latest published version
 *   ASTRYX_VERSION=0.6.3 bun scripts/sync-astryx-themes.ts
 *
 * Astryx (https://github.com/facebook/astryx) ships seven themes, each a set of
 * CSS custom-property overrides for its own component library. This platform
 * does not use those components — it is shadcn/ui over the Tremor token layer
 * in `src/styles/globals.css` — so a theme is *translated* rather than imported:
 * each Astryx token is mapped onto the `--tremor-*` / shadcn variable it plays
 * the part of, and written out as the HSL triplets Tailwind's
 * `hsl(var(--x) / <alpha-value>)` expects.
 *
 * The packages are installed into a throwaway directory rather than into this
 * project's dependencies: only their token values are needed, and only here.
 *
 * Outputs (both generated — edit this script, not them):
 *   src/styles/astryx-themes.css               per-theme variable overrides
 *   src/lib/theme/astryx-themes.generated.ts   metadata for the picker, fonts, charts
 */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const VERSION = process.env.ASTRYX_VERSION ?? "latest";
const ROOT = resolve(import.meta.dir, "..");

/** Theme packages, in the order the picker lists them. */
const THEMES = ["neutral", "butter", "chocolate", "matcha", "stone", "gothic", "y2k"] as const;

/** Fonts a theme names but whose package README gives no Google Fonts URL for. */
const FALLBACK_FONT_URLS: Record<string, string> = {
  neutral: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap",
  butter:
    "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
};

// ── Colour maths ────────────────────────────────────────────────────────────

type RGBA = { r: number; g: number; b: number; a: number };

const NAMED: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  transparent: "#00000000",
};

function parseHex(input: string): RGBA {
  const value = NAMED[input.trim().toLowerCase()] ?? input.trim();
  const m = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (!m) throw new Error(`not a hex colour: ${input}`);
  let hex = m[1];
  if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("");
  if (hex.length !== 6 && hex.length !== 8) throw new Error(`bad hex length: ${input}`);
  const n = (i: number) => Number.parseInt(hex.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
}

/** Flattens a translucent colour onto an opaque base — Tailwind needs opaque triplets. */
function over(top: RGBA, base: RGBA): RGBA {
  const a = top.a;
  return {
    r: top.r * a + base.r * (1 - a),
    g: top.g * a + base.g * (1 - a),
    b: top.b * a + base.b * (1 - a),
    a: 1,
  };
}

function mix(a: RGBA, b: RGBA, weightOfA: number): RGBA {
  return over({ ...a, a: weightOfA }, b);
}

function toHex({ r, g, b }: RGBA): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function toHslTriplet({ r, g, b }: RGBA): string {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
  }
  const f = (v: number) => Number(v.toFixed(1));
  return `${f(h)} ${f(s * 100)}% ${f(l * 100)}%`;
}

// ── Token resolution ────────────────────────────────────────────────────────

type Mode = "light" | "dark";
type TokenMap = Record<string, unknown>;

/** Splits a top-level comma list, respecting parentheses. */
function splitArgs(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Replaces every `light-dark(a, b)` in a value with the side for `mode`. */
function pickMode(value: string, mode: Mode): string {
  let out = "";
  let i = 0;
  while (i < value.length) {
    const at = value.indexOf("light-dark(", i);
    if (at < 0) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, at);
    let depth = 0;
    let j = at + "light-dark".length;
    for (; j < value.length; j++) {
      if (value[j] === "(") depth++;
      if (value[j] === ")" && --depth === 0) break;
    }
    const [light, dark] = splitArgs(value.slice(at + "light-dark(".length, j));
    out += pickMode(mode === "light" ? light : dark, mode);
    i = j + 1;
  }
  return out;
}

function makeResolver(tokens: TokenMap, mode: Mode) {
  const raw = (name: string): string => {
    const v = tokens[name];
    if (typeof v !== "string") throw new Error(`token ${name} is missing`);
    let value = pickMode(v, mode).trim();
    for (let guard = 0; value.startsWith("var("); guard++) {
      if (guard > 10) throw new Error(`var() cycle at ${name}`);
      const inner = splitArgs(value.slice(4, -1));
      const next = tokens[inner[0]];
      value = typeof next === "string" ? pickMode(next, mode).trim() : (inner[1] ?? "");
      if (!value) throw new Error(`unresolvable ${name} → ${inner[0]}`);
    }
    return value;
  };
  return {
    raw,
    color: (name: string): RGBA => parseHex(raw(name)),
  };
}

// ── Mapping ─────────────────────────────────────────────────────────────────

const DATA_PALETTE = [
  "blue",
  "orange",
  "purple",
  "green",
  "pink",
  "cyan",
  "red",
  "teal",
  "brown",
] as const;

interface ModeOutput {
  vars: Record<string, string>;
  echarts: {
    content: string;
    emphasis: string;
    strong: string;
    border: string;
    surface: string;
    fontFamily: string;
  };
  chart: string[];
  swatch: { background: string; surface: string; accent: string; text: string };
}

function mapMode(tokens: TokenMap, mode: Mode): ModeOutput {
  const t = makeResolver(tokens, mode);
  const surface = t.color("--color-background-surface");
  const body = over(t.color("--color-background-body"), surface);
  const on = (name: string, base = surface) => over(t.color(name), base);
  const hsl = (c: RGBA) => toHslTriplet(c);

  const accent = on("--color-accent");
  const onAccent = on("--color-on-accent", accent);
  const card = on("--color-background-card");
  const popover = on("--color-background-popover");
  const muted = on("--color-background-muted");
  const border = on("--color-border");
  const borderStrong = on("--color-border-emphasized");
  const text = on("--color-text-primary");
  const textSecondary = on("--color-text-secondary");
  const textDisabled = on("--color-text-disabled");
  const textAccent = on("--color-text-accent");
  const inverted = tokens["--color-background-inverted"] ? on("--color-background-inverted") : text;

  const status = (name: "success" | "warning" | "error") => {
    const fill = on(`--color-${name}`);
    return [hsl(fill), hsl(on(`--color-on-${name}`, fill))];
  };
  const [success, successFg] = status("success");
  const [warning, warningFg] = status("warning");
  const [error, errorFg] = status("error");
  const info = on("--color-icon-blue");

  const chart = DATA_PALETTE.map((hue) => on(`--color-data-categorical-${hue}`));

  const vars: Record<string, string> = {
    // Tremor layer — every shadcn alias in globals.css reads through these.
    "--tremor-brand-faint": hsl(mix(accent, surface, 0.08)),
    "--tremor-brand-muted": hsl(mix(accent, surface, 0.25)),
    "--tremor-brand-subtle": hsl(mix(accent, surface, 0.6)),
    "--tremor-brand": hsl(accent),
    "--tremor-brand-emphasis": hsl(textAccent),
    "--tremor-brand-inverted": hsl(onAccent),
    "--tremor-background-muted": hsl(body),
    "--tremor-background-subtle": hsl(muted),
    "--tremor-background": hsl(surface),
    "--tremor-background-emphasis": hsl(inverted),
    "--tremor-border": hsl(border),
    "--tremor-ring": hsl(borderStrong),
    "--tremor-content-subtle": hsl(textDisabled),
    "--tremor-content": hsl(textSecondary),
    "--tremor-content-emphasis": hsl(text),
    "--tremor-content-strong": hsl(text),
    "--tremor-content-inverted": hsl(surface),

    // Astryx separates card and popover surfaces from the page surface.
    "--card": hsl(card),
    "--popover": hsl(popover),
    "--input": hsl(borderStrong),
    "--ring": hsl(mix(accent, surface, 0.45)),
    "--destructive": error,
    "--destructive-foreground": errorFg,

    "--color-info": hsl(info),
    "--color-info-foreground": hsl(surface),
    "--color-success": success,
    "--color-success-foreground": successFg,
    "--color-warning": warning,
    "--color-warning-foreground": warningFg,
    "--color-error": error,
    "--color-error-foreground": errorFg,

    "--sidebar-primary": hsl(mix(accent, surface, 0.1)),
    "--sidebar-primary-foreground": hsl(textAccent),

    "--shadow-tremor-input": t.raw("--shadow-low"),
    "--shadow-tremor-card": t.raw("--shadow-low"),
    "--shadow-tremor-dropdown": t.raw("--shadow-med"),
  };
  chart.forEach((c, i) => {
    vars[`--chart-${i + 1}`] = hsl(c);
  });

  return {
    vars,
    echarts: {
      content: toHex(textSecondary),
      emphasis: toHex(text),
      strong: toHex(text),
      border: toHex(border),
      surface: toHex(popover),
      fontFamily: t.raw("--font-family-body"),
    },
    chart: chart.map(toHex),
    swatch: {
      background: toHex(body),
      surface: toHex(card),
      accent: toHex(accent),
      text: toHex(text),
    },
  };
}

/** Values that are the same in both modes. */
function mapShared(tokens: TokenMap): Record<string, string> {
  const t = makeResolver(tokens, "light");
  return {
    "--radius": t.raw("--radius-element"),
    "--radius-sm": t.raw("--radius-inner"),
    "--radius-md": t.raw("--radius-element"),
    "--radius-lg": t.raw("--radius-container"),
    "--radius-xl": t.raw("--radius-container"),
    "--radius-tremor-small": t.raw("--radius-inner"),
    "--radius-tremor-default": t.raw("--radius-element"),
    "--font-sans": t.raw("--font-family-body"),
    "--font-heading": t.raw("--font-family-heading"),
    "--font-mono": t.raw("--font-family-code"),
  };
}

/** A theme with no `light-dark()` in its core colours has only a dark palette. */
function isDarkOnly(tokens: TokenMap): boolean {
  const v = tokens["--color-background-body"];
  return typeof v === "string" && !v.includes("light-dark(");
}

function labelFor(id: string): string {
  return id === "y2k" ? "Y2K" : id[0].toUpperCase() + id.slice(1);
}

// ── Main ────────────────────────────────────────────────────────────────────

const work = mkdtempSync(join(tmpdir(), "astryx-"));
try {
  writeFileSync(join(work, "package.json"), '{"name":"astryx-sync","private":true}');
  const pkgs = [
    `@astryxdesign/core@${VERSION}`,
    ...THEMES.map((t) => `@astryxdesign/theme-${t}@${VERSION}`),
  ];
  const install = Bun.spawnSync(["bun", "add", "--ignore-scripts", ...pkgs], {
    cwd: work,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (install.exitCode !== 0) throw new Error("installing the Astryx packages failed");

  const nm = join(work, "node_modules", "@astryxdesign");
  const corePkg = await Bun.file(join(nm, "core", "package.json")).json();
  const { dataTokenDefaults } = await import(
    join(nm, "core", "dist", "theme", "domainTokens", "dataTokens.js")
  );

  const css: string[] = [
    "/*",
    " * @generated by scripts/sync-astryx-themes.ts — do not edit by hand.",
    ` * Astryx ${corePkg.version} (https://github.com/facebook/astryx, MIT).`,
    " *",
    " * Each theme overrides the Tremor/shadcn variables from globals.css while",
    ' * <html data-design-theme="…"> names it. The Tremor default has no rule here:',
    " * without the attribute, globals.css applies unchanged.",
    " */",
    "",
  ];
  const meta: unknown[] = [];

  for (const id of THEMES) {
    const pkgDir = join(nm, `theme-${id}`);
    const pkg = await Bun.file(join(pkgDir, "package.json")).json();
    const mod = await import(join(pkgDir, "dist", `${id}.js`));
    const theme = mod[`${id}Theme`];
    if (!theme?.tokens) throw new Error(`${id}: no built theme export`);
    const tokens: TokenMap = {
      ...dataTokenDefaults,
      ...(theme.localTokens ?? {}),
      ...theme.tokens,
    };

    const light = mapMode(tokens, "light");
    const dark = mapMode(tokens, "dark");
    const shared = mapShared(tokens);
    const darkOnly = isDarkOnly(tokens);

    const readme = await Bun.file(join(pkgDir, "README.md")).text();
    const fontUrl =
      /https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s)]+/.exec(readme)?.[0] ??
      FALLBACK_FONT_URLS[id];
    if (!fontUrl) throw new Error(`${id}: no font URL`);

    const block = (selector: string, vars: Record<string, string>) =>
      `${selector} {\n${Object.entries(vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join("\n")}\n}\n`;
    const sel = `:root[data-design-theme="${id}"]`;
    css.push(`/* ── ${labelFor(id)} — ${pkg.description} */`);
    css.push(
      block(sel, {
        ...shared,
        ...light.vars,
        "color-scheme": darkOnly ? "dark" : "light",
      })
    );
    css.push(block(`${sel}.dark`, { ...dark.vars, "color-scheme": "dark" }));

    meta.push({
      id,
      label: labelFor(id),
      description: pkg.description,
      darkOnly,
      fontUrl,
      fonts: {
        body: shared["--font-sans"],
        heading: shared["--font-heading"],
        code: shared["--font-mono"],
      },
      light: { echarts: light.echarts, chart: light.chart, swatch: light.swatch },
      dark: { echarts: dark.echarts, chart: dark.chart, swatch: dark.swatch },
    });
  }

  const cssOut = join(ROOT, "src/styles/astryx-themes.css");
  const tsOut = join(ROOT, "src/lib/theme/astryx-themes.generated.ts");
  writeFileSync(cssOut, css.join("\n"));
  writeFileSync(
    tsOut,
    `/**
 * @generated by scripts/sync-astryx-themes.ts — do not edit by hand.
 * Astryx ${corePkg.version} (https://github.com/facebook/astryx, MIT).
 */

import type { AstryxThemeMeta } from "./design-themes";

export const ASTRYX_VERSION = ${JSON.stringify(corePkg.version)};

export const ASTRYX_THEMES: readonly AstryxThemeMeta[] = ${JSON.stringify(meta, null, 2)};
`
  );
  // Written in Biome's shape, or `format:check` fails on the next regeneration.
  Bun.spawnSync(["bunx", "biome", "format", "--write", cssOut, tsOut], {
    cwd: ROOT,
    stdout: "ignore",
    stderr: "inherit",
  });
  console.log(`Wrote ${THEMES.length} Astryx ${corePkg.version} themes.`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
