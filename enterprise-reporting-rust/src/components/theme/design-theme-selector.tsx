"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDesignTheme } from "@/lib/theme/design-theme-context";
import { DESIGN_THEMES, type DesignThemeMeta } from "@/lib/theme/design-themes";
import { useIsDark } from "@/lib/theme/use-theme";

/** The theme's own background, surface and accent, in whichever mode is showing. */
export function DesignThemeSwatch({ theme, dark }: { theme: DesignThemeMeta; dark: boolean }) {
  const s = (dark ? theme.dark : theme.light).swatch;
  return (
    <span
      aria-hidden
      className="inline-flex h-4 w-7 shrink-0 items-center justify-center gap-0.5 rounded-full border border-tremor-border"
      style={{ background: s.background }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: s.surface }} />
      <span className="h-2 w-2 rounded-full" style={{ background: s.accent }} />
    </span>
  );
}

/**
 * Picks the design theme — Tremor (default) or one of the Astryx themes.
 * Applies immediately, without a reload, and is remembered per browser.
 */
export function DesignThemeSelector({ className = "w-40" }: { className?: string }) {
  const { designTheme, setDesignTheme } = useDesignTheme();
  const dark = useIsDark();
  const astryx = DESIGN_THEMES.filter((t) => t.family === "astryx");
  const tremor = DESIGN_THEMES.filter((t) => t.family === "tremor");

  const item = (t: DesignThemeMeta) => (
    <SelectItem key={t.id} value={t.id}>
      <div className="flex items-center gap-2">
        <DesignThemeSwatch theme={t} dark={dark || t.darkOnly} />
        <span>{t.label}</span>
        {t.darkOnly && <span className="text-tremor-label text-tremor-content">dark</span>}
      </div>
    </SelectItem>
  );

  return (
    <Select value={designTheme.id} onValueChange={setDesignTheme}>
      <SelectTrigger className={className} aria-label="Design theme">
        <SelectValue placeholder="Design" />
      </SelectTrigger>
      <SelectContent>
        {tremor.map(item)}
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Astryx</SelectLabel>
          {astryx.map(item)}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
