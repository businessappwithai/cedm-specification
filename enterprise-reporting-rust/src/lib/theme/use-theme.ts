/**
 * Hook to use the theme context
 * Provides access to current theme and theme switching function
 *
 * Example:
 * const { theme, setTheme, systemTheme } = useTheme();
 * setTheme('dark'); // 'light' | 'dark' | 'system'
 *
 * `resolvedTheme` here includes a forced mode. next-themes reports the stored
 * preference even while `forcedTheme` overrides it — which a dark-only design
 * theme does — so a consumer reading next-themes directly would paint a light
 * editor or chart inside a dark page. Read the mode through this hook.
 */

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useTheme() {
  const ctx = useNextTheme();
  return { ...ctx, resolvedTheme: ctx.forcedTheme ?? ctx.resolvedTheme };
}

export type Theme = "light" | "dark" | "system";

/**
 * Whether dark mode is showing, safe to render from: `false` until mounted.
 * The server cannot know the mode, so anything painted from it must wait for
 * the client or hydration mismatches (inline swatch colours, for one).
 */
export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && resolvedTheme === "dark";
}
