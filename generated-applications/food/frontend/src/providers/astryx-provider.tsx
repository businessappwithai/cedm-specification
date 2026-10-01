'use client';

/**
 * Astryx theme + link plumbing, with runtime theme switching.
 *
 * All seven published Astryx themes ship in the generated app and any of them
 * can be selected at runtime. That works because each theme's stylesheet is
 * `@scope`-d to `[data-astryx-theme="<name>"]`, so the seven can coexist
 * without fighting; `<Theme>` sets that attribute, and swapping the theme
 * object is the whole switch. No rebuild, no reload.
 *
 * `LinkProvider` is how Astryx components render router-aware links — without
 * it, anything Astryx renders as an anchor triggers a full page load instead of
 * a client-side navigation.
 *
 * Generated: 2026-10-01T05:17:59.075Z
 * Project: food
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Link } from '@tanstack/react-router';

import { butterTheme } from '@astryxdesign/theme-butter/built';
import { chocolateTheme } from '@astryxdesign/theme-chocolate/built';
import { gothicTheme } from '@astryxdesign/theme-gothic/built';
import { matchaTheme } from '@astryxdesign/theme-matcha/built';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { stoneTheme } from '@astryxdesign/theme-stone/built';
import { y2kTheme } from '@astryxdesign/theme-y2k/built';

/** The seven themes Astryx actually publishes. */
export const THEMES = {
  neutral: { label: 'Neutral', theme: neutralTheme },
  butter: { label: 'Butter', theme: butterTheme },
  chocolate: { label: 'Chocolate', theme: chocolateTheme },
  matcha: { label: 'Matcha', theme: matchaTheme },
  stone: { label: 'Stone', theme: stoneTheme },
  gothic: { label: 'Gothic', theme: gothicTheme },
  y2k: { label: 'Y2K', theme: y2kTheme },
} as const;

export type ThemeName = keyof typeof THEMES;

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

/** The theme this project was generated with; the starting point until a user chooses. */
export const DEFAULT_THEME: ThemeName = 'neutral';

const STORAGE_KEY = 'food:astryx-theme';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Read the persisted choice. Any unknown value falls back to the default. */
function readStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && stored in THEMES ? (stored as ThemeName) : DEFAULT_THEME;
  } catch {
    // Private browsing and some kiosk configurations throw on localStorage.
    return DEFAULT_THEME;
  }
}

export function AstryxProvider({ children }: { children: ReactNode }) {
  // Deliberately NOT seeded from localStorage: this component renders on the
  // server too, and starting from a stored value would make the first client
  // render disagree with the server HTML. The stored choice is applied in the
  // effect below, after hydration.
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    setThemeState(readStoredTheme());
  }, []);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeState(name);
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // Not being able to persist is not a reason to refuse the switch.
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <Theme theme={THEMES[theme].theme}>
        <LinkProvider component={Link}>{children}</LinkProvider>
      </Theme>
    </ThemeContext.Provider>
  );
}

/** Read and change the active theme. Throws outside the provider, which is a bug. */
export function useAstryxTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAstryxTheme must be used inside <AstryxProvider>');
  }
  return context;
}
