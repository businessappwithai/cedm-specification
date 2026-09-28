"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { DesignThemeProvider, useDesignTheme } from "./design-theme-context";
import { THEME_CONFIG } from "./theme-config";

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Tremor Design Theme Provider
 * Manages light/dark theme switching with system preference detection
 * Prevents FOUC (Flash of Unstyled Content) via inline script
 *
 * Configuration comes from `THEME_CONFIG` so the provider, the pre-paint
 * `ThemeScript` and the documented defaults cannot drift apart. They previously
 * did: the script honoured `prefers-color-scheme` and set `class="dark"`, then
 * this provider hydrated with `enableSystem={false}` / `defaultTheme="light"`
 * and reset the class to `light`, so system-dark users saw a dark flash and
 * then the light theme, and could only reach dark mode via the explicit toggle.
 *
 * It also carries the design theme (Tremor or an Astryx theme — see
 * `design-themes.ts`). A design with only a dark palette forces the mode to
 * dark, so `dark:` utilities and the chart/editor themes agree with it.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <DesignThemeProvider>
      <ModeProvider>{children}</ModeProvider>
    </DesignThemeProvider>
  );
}

function ModeProvider({ children }: ThemeProviderProps) {
  const { designTheme } = useDesignTheme();
  return (
    <NextThemesProvider
      attribute={THEME_CONFIG.attribute}
      defaultTheme={THEME_CONFIG.defaultTheme}
      enableSystem={THEME_CONFIG.enableSystem}
      enableColorScheme={THEME_CONFIG.enableColorScheme}
      themes={[...THEME_CONFIG.themes]}
      forcedTheme={designTheme.darkOnly ? "dark" : THEME_CONFIG.forcedTheme}
      storageKey={THEME_CONFIG.storageKey}
      disableTransitionOnChange={THEME_CONFIG.disableTransitionOnChange}
    >
      {children}
    </NextThemesProvider>
  );
}
