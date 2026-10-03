/**
 * Design themes — the second axis of theming, beside light/dark/system.
 *
 * The mode (light, dark, system) is `next-themes` and the `.dark` class, as it
 * always was. The *design* — palette, radius, typography, elevation — is picked
 * here and applied as `<html data-design-theme="…">`:
 *
 * - `tremor` is the default and has no attribute value of its own: globals.css
 *   applies unchanged, so nobody who never opens the picker sees a difference.
 * - The seven Astryx themes (https://github.com/facebook/astryx) are generated
 *   by `scripts/sync-astryx-themes.ts` into `src/styles/astryx-themes.css` and
 *   `astryx-themes.generated.ts`. Rerun that script to pick up a newer Astryx.
 *
 * The choice is stored per browser under `DESIGN_THEME_STORAGE_KEY` and applied
 * before first paint by `ThemeScript`, the same way the mode is.
 */

import { ASTRYX_THEMES } from "./astryx-themes.generated";
import { TREMOR_CHART_COLORS, TREMOR_DARK, TREMOR_LIGHT } from "./tremor-colors";

export interface ThemeModeMeta {
  /** Resolved hex values for canvas renderers (ECharts), which cannot read CSS variables. */
  echarts: {
    content: string;
    emphasis: string;
    strong: string;
    border: string;
    surface: string;
    fontFamily: string;
  };
  /** Categorical series colours, in assignment order. */
  chart: string[];
  /** Four colours the picker draws as a preview. */
  swatch: { background: string; surface: string; accent: string; text: string };
}

export interface AstryxThemeMeta {
  id: string;
  label: string;
  description: string;
  /** Astryx ships only a dark palette for this theme; light mode is not offered. */
  darkOnly: boolean;
  /** Google Fonts stylesheet with the theme's typefaces. */
  fontUrl: string;
  fonts: { body: string; heading: string; code: string };
  light: ThemeModeMeta;
  dark: ThemeModeMeta;
}

export interface DesignThemeMeta extends Omit<AstryxThemeMeta, "fontUrl"> {
  family: "tremor" | "astryx";
  fontUrl: string | null;
}

export const DESIGN_THEME_STORAGE_KEY = "design-theme";
export const DEFAULT_DESIGN_THEME = "tremor";

const TREMOR_FONT = "ui-sans-serif, system-ui, -apple-system, sans-serif";

const tremorMode = (t: typeof TREMOR_LIGHT | typeof TREMOR_DARK): ThemeModeMeta => ({
  echarts: {
    content: t.content.DEFAULT,
    emphasis: t.content.emphasis,
    strong: t.content.strong,
    border: t.border,
    surface: t.background.DEFAULT,
    fontFamily: TREMOR_FONT,
  },
  chart: [...TREMOR_CHART_COLORS],
  swatch: {
    background: t.background.muted,
    surface: t.background.DEFAULT,
    accent: t.brand.DEFAULT,
    text: t.content.strong,
  },
});

const TREMOR_THEME: DesignThemeMeta = {
  id: DEFAULT_DESIGN_THEME,
  label: "Tremor",
  description: "The platform default — blue brand on neutral grays, compact and data-dense.",
  family: "tremor",
  darkOnly: false,
  fontUrl: null,
  fonts: { body: TREMOR_FONT, heading: TREMOR_FONT, code: "ui-monospace, monospace" },
  light: tremorMode(TREMOR_LIGHT),
  dark: tremorMode(TREMOR_DARK),
};

export const DESIGN_THEMES: readonly DesignThemeMeta[] = [
  TREMOR_THEME,
  ...ASTRYX_THEMES.map((t) => ({ ...t, family: "astryx" as const })),
];

export function getDesignTheme(id: string | null | undefined): DesignThemeMeta {
  return DESIGN_THEMES.find((t) => t.id === id) ?? TREMOR_THEME;
}

export function isDesignThemeId(id: unknown): id is string {
  return typeof id === "string" && DESIGN_THEMES.some((t) => t.id === id);
}

/**
 * The subset `ThemeScript` needs before React exists, kept small because it is
 * inlined into every page.
 */
export const DESIGN_THEME_BOOT = Object.fromEntries(
  DESIGN_THEMES.filter((t) => t.family === "astryx").map((t) => [
    t.id,
    { font: t.fontUrl, darkOnly: t.darkOnly },
  ])
);

export const FONT_LINK_ID = "design-theme-fonts";

/** Applies a design theme to the document: the attribute, and its fonts. */
export function applyDesignTheme(id: string): void {
  const theme = getDesignTheme(id);
  const html = document.documentElement;
  if (theme.family === "tremor") html.removeAttribute("data-design-theme");
  else html.setAttribute("data-design-theme", theme.id);

  const existing = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!theme.fontUrl) {
    existing?.remove();
    return;
  }
  if (existing?.href === theme.fontUrl) return;
  const link = existing ?? document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  // CORS mode: the app is cross-origin isolated (COEP require-corp).
  link.crossOrigin = "anonymous";
  link.href = theme.fontUrl;
  if (!existing) document.head.appendChild(link);
}
