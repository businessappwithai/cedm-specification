"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDesignTheme } from "@/lib/theme/design-theme-context";
import { useTheme } from "@/lib/theme/use-theme";
import { DesignThemeSelector } from "./design-theme-selector";

/**
 * Theme Selector Component
 * Switches between light, dark and system themes.
 *
 * "System" is a real option here: the provider runs with `enableSystem`, so an
 * unset preference follows `prefers-color-scheme`. Bind to `theme` (the stored
 * preference) rather than `resolvedTheme`, or picking "System" would immediately
 * display as Light or Dark instead.
 *
 * Beside it sits the design-theme picker (Tremor or an Astryx theme). A design
 * that Astryx ships dark-only locks this one to Dark while it is selected; the
 * stored preference is kept and comes back when another design is picked.
 */
export function ThemeSelector() {
  return (
    <div className="flex items-center gap-2">
      <DesignThemeSelector />
      <ModeSelector />
    </div>
  );
}

function ModeSelector() {
  const { theme, setTheme } = useTheme();
  const { designTheme } = useDesignTheme();
  const locked = designTheme.darkOnly;

  return (
    <Select
      value={locked ? "dark" : (theme ?? "system")}
      onValueChange={setTheme}
      disabled={locked}
    >
      <SelectTrigger
        className="w-36"
        aria-label="Colour mode"
        title={locked ? `${designTheme.label} is a dark-only theme` : undefined}
      >
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
