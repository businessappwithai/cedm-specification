'use client';

/**
 * Theme selector — switches the app between the seven Astryx themes at runtime.
 *
 * Mounted once in the root layout (`routes/__root.tsx`), so it is present on
 * every page. It deliberately does *not* live in a header: each route in this
 * app builds its own header inline, and `components/layout/header.tsx` is not
 * rendered by any of them — putting the switcher there made it invisible
 * everywhere while looking, in the source, like it worked.
 *
 * `variant="floating"` is the app-wide control: a fixed, self-contained pill in
 * the bottom-left corner. `variant="inline"` is the same dropdown with no
 * positioning, for dropping into a settings page or a header that wants one.
 *
 * The change applies immediately across the whole app and persists, because the
 * provider writes the choice to localStorage.
 *
 * Generated: 2026-10-09T15:29:55.343Z
 * Project: procurement
 */

import { useEffect, useState } from 'react';
import { Selector } from '@astryxdesign/core/Selector';

import { isEmbedded } from '@/lib/embed';
import { THEME_NAMES, useAstryxTheme, type ThemeName } from '@/providers/astryx-provider';

export interface ThemeSelectorProps {
  /**
   * `floating` fixes the control to the bottom-left of the viewport;
   * `inline` renders it in flow. Defaults to `inline` so dropping it into a
   * page does not surprise you with fixed positioning.
   */
  variant?: 'floating' | 'inline';
  /** Hide the visible label (it stays in the accessibility tree). */
  isLabelHidden?: boolean;
  className?: string;
}

/**
 * Bottom-*left*: the toast region is top-right and the router devtools sit
 * bottom-right, so this is the one corner nothing else claims.
 *
 * Hoisted to module scope because a `style={ {…} }` literal inside a
 * Handlebars template is a parse error — two braces open an expression.
 */
const FLOATING_STYLE = {
  position: 'fixed' as const,
  bottom: '1rem',
  left: '1rem',
  zIndex: 50,
};

export function ThemeSelector({
  variant = 'inline',
  isLabelHidden,
  className,
}: ThemeSelectorProps) {
  const { theme, setTheme, themes } = useAstryxTheme();
  // Inside the chat's frame the screen is a card in a conversation: a control
  // floating over it would cover the form. Read after mount, like the shell.
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    setEmbedded(isEmbedded());
  }, []);

  const options = THEME_NAMES.map((name) => ({
    value: name,
    label: themes[name].label,
  }));

  const selector = (
    <Selector
      label="Theme"
      isLabelHidden={isLabelHidden ?? variant === 'floating'}
      options={options}
      value={theme}
      size="sm"
      width={160}
      // Astryx's default is a selected-item overlay clamped to the viewport,
      // which for a control pinned to the bottom edge lands the option list on
      // top of its own trigger — after one or two switches the trigger is no
      // longer clickable. `above` is what their docs prescribe for exactly this
      // case (a bottom-fixed toolbar).
      placement={variant === 'floating' ? 'above' : undefined}
      className={className}
      data-testid="theme-selector"
      onChange={(next: string) => setTheme(next as ThemeName)}
    />
  );

  if (variant !== 'floating') return selector;
  if (embedded) return null;

  return (
    <div style={FLOATING_STYLE} data-testid="theme-selector-floating">
      {selector}
    </div>
  );
}

export default ThemeSelector;
