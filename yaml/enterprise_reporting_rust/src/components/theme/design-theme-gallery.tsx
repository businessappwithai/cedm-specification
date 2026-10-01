"use client";

import { Check } from "lucide-react";
import { useDesignTheme } from "@/lib/theme/design-theme-context";
import { DESIGN_THEMES, type DesignThemeMeta } from "@/lib/theme/design-themes";
import { ASTRYX_VERSION } from "@/lib/theme/astryx-themes.generated";
import { useIsDark } from "@/lib/theme/use-theme";

/** First family in a CSS font stack, unquoted — for labelling only. */
function primaryFont(stack: string): string {
  return stack.split(",")[0].replace(/["']/g, "").trim();
}

function ThemeCard({
  theme,
  dark,
  selected,
  onSelect,
}: {
  theme: DesignThemeMeta;
  dark: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const mode = dark || theme.darkOnly ? theme.dark : theme.light;
  const s = mode.swatch;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex flex-col overflow-hidden rounded-tremor-default border text-left transition-shadow hover:shadow-tremor-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected ? "border-tremor-brand ring-2 ring-tremor-brand" : "border-tremor-border"
      }`}
    >
      {/* A miniature page drawn in the theme's own colours, whatever is active. */}
      <div className="flex h-24 gap-2 p-3" style={{ background: s.background }}>
        <div
          className="flex flex-1 flex-col gap-1.5 rounded-md p-2"
          style={{ background: s.surface }}
        >
          <div className="h-1.5 w-2/3 rounded-full" style={{ background: s.text }} />
          <div className="h-1.5 w-1/2 rounded-full opacity-40" style={{ background: s.text }} />
          <div className="mt-auto flex items-end gap-1">
            {mode.chart.slice(0, 5).map((c, i) => (
              <div
                key={c}
                className="w-2 rounded-sm"
                style={{ background: c, height: `${10 + ((i * 7) % 16)}px` }}
              />
            ))}
          </div>
        </div>
        <div className="flex w-10 flex-col justify-end">
          <div className="h-4 rounded-full" style={{ background: s.accent }} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 bg-tremor-background p-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-tremor-content-strong">{theme.label}</span>
          {theme.family === "tremor" && (
            <span className="text-tremor-label text-tremor-content">default</span>
          )}
          {theme.darkOnly && (
            <span className="text-tremor-label text-tremor-content">dark only</span>
          )}
          {selected && <Check className="ml-auto h-4 w-4 text-tremor-brand" aria-hidden />}
        </div>
        <p className="line-clamp-2 text-tremor-label text-tremor-content">{theme.description}</p>
        <p className="mt-auto pt-1 text-tremor-label text-tremor-content-subtle">
          {primaryFont(theme.fonts.body)}
          {primaryFont(theme.fonts.heading) !== primaryFont(theme.fonts.body) &&
            ` · ${primaryFont(theme.fonts.heading)}`}
        </p>
      </div>
    </button>
  );
}

/** Every design theme as a clickable preview; picking one applies it at once. */
export function DesignThemeGallery() {
  const { designTheme, setDesignTheme } = useDesignTheme();
  const dark = useIsDark();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DESIGN_THEMES.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            dark={dark}
            selected={t.id === designTheme.id}
            onSelect={() => setDesignTheme(t.id)}
          />
        ))}
      </div>
      <p className="text-tremor-label text-tremor-content">
        Astryx themes from{" "}
        <a
          className="underline underline-offset-2"
          href="https://github.com/facebook/astryx"
          target="_blank"
          rel="noreferrer"
        >
          facebook/astryx
        </a>{" "}
        {ASTRYX_VERSION}. Your choice is saved in this browser.
      </p>
    </div>
  );
}
