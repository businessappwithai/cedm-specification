/**
 * TanStack Start + Astryx Frontend Generator
 *
 * Astryx replaces the *presentation* layer only — shadcn-style primitives,
 * Radix, Tailwind utility styling. TanStack Start / Router / Query / Table /
 * Form all stay, because Astryx is a component library and theming system, not
 * an application framework: its own README says it "does not include routing or
 * data fetching" (MIGRATION-LOCO-ASTRYX.md §2.1).
 *
 * So this generator does not fork the 166-file frontend tree. It delegates to
 * `TanStackStartFrontendGenerator` for structure and then applies the Astryx
 * overlay from §7.3:
 *
 *   1. React 18 → 19 (Astryx requires ≥19) and Astryx dependencies.
 *   2. `globals.css` rewritten onto Astryx imports + the Tailwind bridge.
 *   3. An `AstryxProvider` (Theme + LinkProvider), mounted in `providers/`.
 *
 * Tailwind stays installed on purpose during Phase A: the bridge maps Astryx
 * tokens onto Tailwind utility names so the existing `className` sites keep
 * rendering while components are swapped one at a time. Phase C removes it.
 */

import type { Entity, Relationship } from "@appwithai/core/types";
import * as fs from "fs/promises";
import * as path from "path";
import { BaseGenerator } from "../base.generator";
import {
  TanStackStartFrontendGenerator,
  type TanStackStartFrontendOptions,
} from "./tanstack-start-frontend.generator";

function resolveTemplateDir(subpath: string): string {
  // TEMPLATE_DIR names the templates root outright. The browser build sets it
  // to its in-memory volume, where no working directory leads anywhere.
  const configured = process.env.TEMPLATE_DIR;
  if (configured) return path.join(configured, subpath);
  const cwd = process.cwd();
  const possiblePaths = [
    path.join(cwd, "packages/generator/templates", subpath),
    path.join(cwd, "templates", subpath),
    path.join(cwd, "../../../packages/generator/templates", subpath),
    path.join(cwd, "../../packages/generator/templates", subpath),
    path.join(__dirname, "../../../templates", subpath),
  ];
  for (const possiblePath of possiblePaths) {
    try {
      if (require("fs").statSync(possiblePath).isDirectory()) return possiblePath;
    } catch {
      // Continue.
    }
  }
  return path.join(__dirname, "../../../templates", subpath);
}

/**
 * The Astryx themes that actually exist on npm as `@astryxdesign/theme-*`.
 *
 * The design document's §12 D8 lists ten (adding `default`, `daily` and
 * `brutalist`); those three have no published package, and generating a
 * dependency on one produces a project that cannot install. Verified against
 * the registry — see the implementation log.
 */
export type AstryxTheme =
  | "neutral"
  | "butter"
  | "chocolate"
  | "matcha"
  | "stone"
  | "gothic"
  | "y2k";

/** Every theme ships in the generated app so the selector can switch at runtime. */
export const ASTRYX_THEMES: readonly AstryxTheme[] = [
  "neutral",
  "butter",
  "chocolate",
  "matcha",
  "stone",
  "gothic",
  "y2k",
] as const;

export interface AstryxFrontendOptions
  extends Omit<TanStackStartFrontendOptions, "stackOption"> {
  /** Which Astryx theme the generated app ships with. Defaults to `neutral`. */
  astryxTheme?: AstryxTheme;
}

/** Exact pins — Astryx is pre-1.0, so a caret range is not safe here (risk R8). */
const ASTRYX_VERSION = "0.2.0";

export class AstryxFrontendGenerator extends BaseGenerator {
  private options: AstryxFrontendOptions;

  constructor(options: AstryxFrontendOptions) {
    super(resolveTemplateDir("tanstack-astryx-loco/frontend"));
    this.options = options;
  }

  async generate(
    entities: Entity[],
    relationships: Relationship[],
    outputDir: string
  ): Promise<void> {
    console.log("\n📦 Phase 1: Generating TanStack Start frontend...");
    const base = new TanStackStartFrontendGenerator({
      ...this.options,
      stackOption: "tanstack-astryx-loco",
    });
    await base.generate(entities, relationships, outputDir);

    console.log("\n🎨 Phase 2: Applying the Astryx overlay...");
    const context = this.prepareContext();

    await this.rewriteDependencies(outputDir);
    await this.writeRendered("src/styles/globals.css.hbs", "src/styles/globals.css", outputDir, context);
    await this.writeRendered(
      "src/providers/astryx-provider.tsx.hbs",
      "src/providers/astryx-provider.tsx",
      outputDir,
      context
    );
    await this.writeRendered(
      "src/components/theme-selector.tsx.hbs",
      "src/components/theme-selector.tsx",
      outputDir,
      context
    );
    await this.writeUiAdapters(outputDir, context);
    await this.mountAstryxProvider(outputDir);

    console.log("\n✅ Astryx frontend generation complete!");
  }

  /**
   * Overwrite the shadcn primitives with Astryx-backed adapters that keep the
   * same prop surface (frontend Phase B).
   *
   * This is now every primitive the TanStack frontend ships, so no
   * `components/ui/*` module imports Radix or lucide-for-styling any more. The
   * `components/admin/*` screens above them are unchanged and still compose
   * through the Tailwind bridge — that is Phase C's job, and the phased plan
   * works precisely because the two layers can be swapped independently.
   */
  private async writeUiAdapters(
    outputDir: string,
    context: Record<string, unknown>
  ): Promise<void> {
    const adapters = [
      "alert-dialog",
      "avatar",
      "badge",
      "breadcrumb",
      "button",
      "card",
      "checkbox",
      "dialog",
      "dropdown-menu",
      "empty-state",
      "icon",
      "input",
      "label",
      // The layout/typography contract the shared screens compose. Both stacks
      // ship one; this is the Astryx rendering of it.
      "layout",
      "mobile-sidebar",
      "scroll-area",
      "select",
      "separator",
      "skeleton",
      "slider",
      "switch",
      "table",
      "tabs",
      "textarea",
      "toast",
      "tooltip",
    ];
    for (const name of adapters) {
      await this.writeRendered(
        `src/components/ui/${name}.tsx.hbs`,
        `src/components/ui/${name}.tsx`,
        outputDir,
        context
      );
    }
    // The README explains the adapter strategy to whoever opens the generated
    // project; it is content, not scaffolding, so it ships with them.
    const readme = path.join(
      resolveTemplateDir("tanstack-astryx-loco/frontend"),
      "src/components/ui/README.md"
    );
    try {
      await fs.copyFile(readme, path.join(outputDir, "src/components/ui/README.md"));
    } catch {
      // Non-fatal: the adapters are what matter.
    }
    console.log(`  ✓ components/ui: ${adapters.length} Astryx adapters`);
  }

  private prepareContext(): Record<string, unknown> {
    const theme = this.options.astryxTheme ?? "neutral";
    return {
      project: {
        name: this.options.projectName,
        version: this.options.projectVersion,
        description: this.options.projectDescription,
      },
      astryxThemeName: theme,
      // `neutralTheme`, `butterTheme`, … — the named export from the theme package.
      astryxTheme: theme,
      projectKebab: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      now: new Date().toISOString(),
    };
  }

  private async writeRendered(
    tpl: string,
    out: string,
    outputDir: string,
    context: Record<string, unknown>
  ): Promise<void> {
    const content = await this.renderTemplate(tpl, context);
    const target = path.join(outputDir, out);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }

  /**
   * React 19 + Astryx packages, and drop what Phase B made dead.
   *
   * Radix goes: with every `components/ui/*` primitive now an Astryx adapter,
   * no generated file imports `@radix-ui/*` at all, so shipping twelve of them
   * would put an unused component library in every generated app's install and
   * bundle. `class-variance-authority` goes for the same reason — it existed to
   * build the shadcn variant strings the adapters no longer produce.
   *
   * `lucide-react` and the Tailwind toolchain stay. Lucide is not decoration
   * here: `ui/icon.tsx` resolves the arbitrary icon *names* the dictionary
   * stores (`sys_table.icon`), which Astryx's 26 semantic names cannot cover.
   * Tailwind still styles `components/admin/*`, which is Phase C's scope —
   * removing it now would unstyle every unconverted screen at once.
   */
  private async rewriteDependencies(outputDir: string): Promise<void> {
    const pkgPath = path.join(outputDir, "package.json");
    let pkg: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    try {
      pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
    } catch (error) {
      console.warn(
        `  ⚠️  Could not read generated package.json, skipping dependency rewrite: ${(error as Error).message}`
      );
      return;
    }

    pkg.dependencies = {
      ...pkg.dependencies,
      // Non-negotiable: Astryx peer-depends on React >= 19.
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "@astryxdesign/core": ASTRYX_VERSION,
      // All seven, not just the default: the theme selector switches between
      // them at runtime, which needs every theme object and stylesheet present.
      // They coexist safely because each stylesheet is @scope'd to its own
      // [data-astryx-theme] value.
      ...Object.fromEntries(
        ASTRYX_THEMES.map((name) => [`@astryxdesign/theme-${name}`, ASTRYX_VERSION])
      ),
      // Required, despite §7.2's "no build plugin" note. The *StyleX compiler*
      // is indeed unnecessary — Astryx ships pre-built CSS — but the stylex
      // runtime is a declared peer dependency and 247 files in the shipped
      // `dist` import it. Omitting it leaves the app importing a module that
      // is not installed.
      "@stylexjs/stylex": "^0.19.0",
    };
    pkg.devDependencies = {
      ...pkg.devDependencies,
      "@astryxdesign/cli": ASTRYX_VERSION,
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
    };

    // Dead once every primitive is an Astryx adapter. Verified by generation:
    // `grep -rl "@radix-ui" src/` returns nothing.
    const removed: string[] = [];
    for (const name of Object.keys(pkg.dependencies)) {
      if (name.startsWith("@radix-ui/") || name === "class-variance-authority") {
        delete pkg.dependencies[name];
        removed.push(name);
      }
    }

    await fs.writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log(
      `  ✓ package.json: React 19 + Astryx, ${removed.length} unused Radix/CVA deps removed`
    );
  }

  /**
   * Wrap the existing provider tree in `AstryxProvider`.
   *
   * `providers/index.tsx` is the single composition point the root route
   * renders, so this is a targeted edit rather than a rewrite — it keeps
   * whatever provider stack the base generator produced. If the expected
   * anchor is missing (because that template changed), the edit is skipped
   * loudly rather than silently producing an app with no theme.
   */
  private async mountAstryxProvider(outputDir: string): Promise<void> {
    const providersPath = path.join(outputDir, "src/providers/index.tsx");
    let source: string;
    try {
      source = await fs.readFile(providersPath, "utf-8");
    } catch {
      console.warn("  ⚠️  src/providers/index.tsx not found — mount AstryxProvider manually");
      return;
    }

    if (source.includes("AstryxProvider")) return;

    const openTag = "    <QueryProvider>";
    const closeTag = "    </QueryProvider>";
    if (!source.includes(openTag) || !source.includes(closeTag)) {
      console.warn(
        "  ⚠️  Could not find the QueryProvider anchor in src/providers/index.tsx — " +
          "wrap the provider tree in <AstryxProvider> manually"
      );
      return;
    }

    const withImport = source.replace(
      "import { QueryProvider } from './query-provider';",
      "import { QueryProvider } from './query-provider';\nimport { AstryxProvider } from './astryx-provider';"
    );

    // AstryxProvider goes outermost: theme tokens must be in context before
    // anything that renders an Astryx component mounts.
    const lines = withImport.split("\n");
    const openIndex = lines.findIndex((line) => line === openTag);
    const closeIndex = lines.findIndex((line, i) => i > openIndex && line === closeTag);
    if (openIndex === -1 || closeIndex === -1) {
      console.warn("  ⚠️  Provider tree shape not recognised — mount <AstryxProvider> manually");
      return;
    }

    // Indent the wrapped block so the emitted JSX is properly nested rather
    // than merely valid.
    const inner = lines
      .slice(openIndex, closeIndex + 1)
      .map((line) => (line.trim() === "" ? line : `  ${line}`));

    const wrapped = [
      ...lines.slice(0, openIndex),
      "    <AstryxProvider>",
      ...inner,
      "    </AstryxProvider>",
      ...lines.slice(closeIndex + 1),
    ].join("\n");

    await fs.writeFile(providersPath, wrapped);
    console.log("  ✓ Mounted AstryxProvider in the provider tree");
  }
}

export default AstryxFrontendGenerator;
