"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
  applyDesignTheme,
  DEFAULT_DESIGN_THEME,
  DESIGN_THEME_STORAGE_KEY,
  type DesignThemeMeta,
  getDesignTheme,
  isDesignThemeId,
} from "./design-themes";

interface DesignThemeContextValue {
  designTheme: DesignThemeMeta;
  setDesignTheme: (id: string) => void;
}

const DesignThemeContext = createContext<DesignThemeContextValue | null>(null);

function readStored(): string {
  try {
    const stored = localStorage.getItem(DESIGN_THEME_STORAGE_KEY);
    return isDesignThemeId(stored) ? stored : DEFAULT_DESIGN_THEME;
  } catch {
    return DEFAULT_DESIGN_THEME;
  }
}

/**
 * Holds the selected design theme (Tremor or one of the Astryx themes).
 *
 * The server renders the default; `ThemeScript` has already put the stored
 * choice on `<html>` before paint, and this picks it up on mount, so the first
 * client render matches the server and nothing flashes.
 */
export function DesignThemeProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string>(DEFAULT_DESIGN_THEME);

  useEffect(() => {
    setId(readStored());
    // Another tab changed it — follow, as next-themes does for the mode.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DESIGN_THEME_STORAGE_KEY) return;
      const next = isDesignThemeId(e.newValue) ? e.newValue : DEFAULT_DESIGN_THEME;
      applyDesignTheme(next);
      setId(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setDesignTheme = useCallback((next: string) => {
    if (!isDesignThemeId(next)) return;
    try {
      if (next === DEFAULT_DESIGN_THEME) localStorage.removeItem(DESIGN_THEME_STORAGE_KEY);
      else localStorage.setItem(DESIGN_THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still applies for this page view.
    }
    applyDesignTheme(next);
    setId(next);
  }, []);

  return (
    <DesignThemeContext.Provider value={{ designTheme: getDesignTheme(id), setDesignTheme }}>
      {children}
    </DesignThemeContext.Provider>
  );
}

const FALLBACK: DesignThemeContextValue = {
  designTheme: getDesignTheme(DEFAULT_DESIGN_THEME),
  setDesignTheme: () => {},
};

/** Outside `ThemeProvider` (an isolated render or test) this is the Tremor default. */
export function useDesignTheme(): DesignThemeContextValue {
  return useContext(DesignThemeContext) ?? FALLBACK;
}
