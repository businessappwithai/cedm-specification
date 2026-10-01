import { DESIGN_THEME_BOOT, DESIGN_THEME_STORAGE_KEY, FONT_LINK_ID } from "./design-themes";
import { THEME_CONFIG } from "./theme-config";

/**
 * Theme initialization script that runs before first paint
 * Prevents flash of unstyled content (FOUC) on page load
 *
 * Applies both theme axes: the mode (light/dark, as `next-themes` stores it)
 * and the design theme (`data-design-theme` plus its web fonts). A dark-only
 * design theme forces dark, matching `ThemeProvider`'s `forcedTheme`.
 *
 * This uses dangerouslySetInnerHTML with hardcoded trusted script
 * to prevent FOUC - security is ensured as the script is not user-controlled:
 * the only interpolations are constants serialised with JSON.stringify.
 */
export function ThemeScript() {
  const themeScript = `(function() {
    var MODE_KEY = ${JSON.stringify(THEME_CONFIG.storageKey)};
    var DESIGN_KEY = ${JSON.stringify(DESIGN_THEME_STORAGE_KEY)};
    var DESIGNS = ${JSON.stringify(DESIGN_THEME_BOOT)};
    var FONT_LINK_ID = ${JSON.stringify(FONT_LINK_ID)};

    function read(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    var html = document.documentElement;
    var designId = read(DESIGN_KEY);
    var design = designId && Object.prototype.hasOwnProperty.call(DESIGNS, designId) ? DESIGNS[designId] : null;

    if (design) {
      html.setAttribute('data-design-theme', designId);
      var link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      link.href = design.font;
      document.head.appendChild(link);
    }

    function getTheme() {
      if (design && design.darkOnly) return 'dark';
      var stored = read(MODE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
      html.classList.remove('light', 'dark');
      html.classList.add(theme);
      html.setAttribute('data-theme', theme);
    }

    applyTheme(getTheme());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      var stored = read(MODE_KEY);
      if ((!stored || stored === 'system') && !(design && design.darkOnly)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  })();`;

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: the script is a hardcoded literal above, never user input, and must run inline before first paint to prevent FOUC
    <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
  );
}
