/* eslint-disable @typescript-eslint/no-explicit-any -- template context objects are dynamically shaped */
/**
 * TanStack Start frontend structure generator.
 *
 * Two-phase:
 * 1. Scaffold with the TanStack Start CLI (`bun create tanstack-start`).
 * 2. Overlay the bundled templates.
 *
 * Produces the routes, contexts, hooks, i18n and API layer. It deliberately
 * stops short of the design system: `AstryxFrontendGenerator` runs after this
 * and supplies `components/ui/*`, the provider and the stylesheet. Keeping the
 * split means the structural half — file-based routing, entity pages, admin
 * screens — stays one concern and this file stays readable.
 *
 * Generated from templates in tanstack-astryx-loco/frontend/.
 */

import {
  declaredEntityNames,
  type Entity,
  entityToBusEntity,
  type Relationship,
} from "@appwithai/core/types";
import { kebabCase } from "@appwithai/core/utils";
import * as fs from "fs/promises";
import * as path from "path";
import { BaseGenerator } from "../base.generator";

/**
 * Resolve template directory path, handling both dev and bundled environments
 */
function resolveTemplateDir(subpath: string): string {
  const cwd = process.cwd();
  const possiblePaths = [
    // Dev mode: running from project root
    path.join(cwd, "packages/generator/templates", subpath),
    // Bundled mode: running from anywhere, find generator package
    path.join(cwd, "../../../packages/generator/templates", subpath),
    path.join(cwd, "../../packages/generator/templates", subpath),
    // Fallback: current __dirname relative
    path.join(__dirname, "../../../templates", subpath),
  ];

  for (const possiblePath of possiblePaths) {
    try {
      const stat = require("fs").statSync(possiblePath);
      if (stat.isDirectory()) {
        return possiblePath;
      }
    } catch {
      // Continue to next path
    }
  }

  // If no path found, return the __dirname relative path and let it fail with a clear error
  const fallbackPath = path.join(__dirname, "../../../templates", subpath);
  console.error(`Template directory not found. Tried paths:`);
  for (const p of possiblePaths) {
    console.error(`  - ${p}`);
  }
  console.error(`Using fallback: ${fallbackPath}`);
  return fallbackPath;
}

export interface TanStackStartFrontendOptions {
  projectName: string;
  projectVersion: string;
  projectDescription: string;
  apiBaseUrl: string;
  /** Port the dev/preview server binds to. Defaults to the API port + 1. */
  frontendPort?: number;
  enableDarkMode: boolean;
  /**
   * Retained as a single-valued field rather than deleted: the templates
   * still branch on it in a few places, and a one-member union documents that
   * there is now exactly one stack without silently changing those branches.
   */
  stackOption?: "tanstack-astryx-loco";
  /**
   * Skip the network CLI scaffolding step (`bun create tanstack-start`) and
   * generate the project purely from the bundled templates. Useful for offline
   * / CI generation where the scaffolding CLI is unavailable.
   */
  skipCliScaffold?: boolean;
  /**
   * Whether the project root declares a `tests` workspace beside `frontend`.
   * The root manifest lists it unless tests were skipped, and `bun install`
   * refuses a workspace it cannot find — so the frontend Dockerfile has to
   * copy `tests/package.json` into its install layer exactly when this is set.
   */
  testsWorkspace?: boolean;
}

/** File names TanStack Router's file convention gives a meaning to, wherever they appear. */
const ROUTER_CONVENTION_SLUGS = new Set(["route", "index", "__root", "lazy"]);

/**
 * Whether an entity's slug cannot be written as a top-level route file.
 *
 * Two rules, neither a list somebody has to remember to extend: the router's
 * own convention (`route`, `index`, `__root`, `lazy`, and any name opening with
 * `_`, `-`, `(`, `$` or holding a `.`, which the file convention reads as
 * layout, ignore, group, param or nesting), and every top-level name the
 * template already routes (`admin`, `auth`, `api`, `ask`, `dashboard`,
 * `reports`, ...), read from the template directory itself so a route added
 * there is protected the day it lands. Such an entity is served by `$entity`.
 */
export function isReservedRouteSlug(slug: string, staticRouteNames: ReadonlySet<string>): boolean {
  return (
    ROUTER_CONVENTION_SLUGS.has(slug) ||
    /^[_\-($]|\./.test(slug) ||
    staticRouteNames.has(slug)
  );
}

/** First path segment of every route the template ships: `reports.$name.tsx` -> `reports`. */
export async function templateRouteNames(routesDir: string): Promise<Set<string>> {
  const names = new Set<string>();
  for (const entry of await fs.readdir(routesDir)) {
    const first = entry.split(".")[0] ?? "";
    if (first && !first.startsWith("$")) names.add(first);
  }
  return names;
}

export class TanStackStartFrontendGenerator extends BaseGenerator {
  private options: TanStackStartFrontendOptions;
  private resolvedTemplateDir: string;

  constructor(options: TanStackStartFrontendOptions) {
    // All frontend templates live in tanstack-start-nestjs/frontend/ as the
    // single canonical source. tanstackjs-nestjs/frontend/ is kept only for
    // legacy scaffold scaffolding differences; Electric/TanStack DB templates
    // are not duplicated there.
    const templateDir = resolveTemplateDir("tanstack-astryx-loco/frontend");
    super(templateDir);
    this.options = options;
    this.resolvedTemplateDir = templateDir;
  }

  async generate(
    entities: Entity[],
    relationships: Relationship[],
    outputDir: string
  ): Promise<void> {
    // No CLI scaffold on the frontend. `loco new` earns its place on the
    // backend by contributing the framework's own current defaults; `bun create
    // tanstack-start` contributes nothing the templates below do not write
    // themselves, and it has no working non-interactive mode — every run
    // downloaded the package, prompted for a name, hit EOF, and fell back. All
    // that was left of it was the download.
    console.log(`\n📦 Phase 1: Preparing frontend directory (templates are the source)`);
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`\n🎨 Phase 2: Overlaying custom templates...`);
    // Prepare context for templates
    const context = this.prepareContext(entities, relationships);

    // Create additional directories beyond TanStack Start scaffolding
    await this.createAdditionalDirectories(outputDir);

    // Copy static assets served from the app's own origin (self-hosted fonts)
    await this.copyPublicAssets(outputDir);

    // Generate core application files
    await this.generateCoreFiles(outputDir, context);

    // Generate API client and hooks
    await this.generateApiLayer(outputDir, context);

    // Generate UI components
    await this.generateComponents(outputDir, context);

    // Generate entity pages
    await this.generateEntityPages(outputDir, context);

    // Generate admin pages for field layout
    await this.generateAdminPages(outputDir, context);

    // Update configuration files
    await this.updateConfigFiles(outputDir, context);

    // Generate test files
    await this.generateTestFiles(outputDir, context);

    console.log(`\n✅ TanStack Start frontend generation complete!`);
  }

  /**
   * Create additional directories beyond TanStack Start scaffolding
   */
  private async createAdditionalDirectories(outputDir: string): Promise<void> {
    const dirs = [
      "src/routes",
      "src/routes/admin",
      "src/routes/auth",
      "src/components/ui",
      "src/components/admin",
      "src/components/forms",
      "src/components/tables",
      "src/components/layout",
      "src/components/skeletons",
      "src/components/reports",
      "src/components/automation",
      "src/components/ai",
      "src/lib/automation",
      "src/lib/workflow",
      "src/contexts",
      "src/hooks",
      "src/i18n",
      "src/lib",
      "src/messages",
      "src/providers",
      "src/styles",
      "src/types",
      "src/lib/queries",
      "test",
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(outputDir, dir), { recursive: true });
    }
  }

  private prepareContext(
    entities: Entity[],
    relationships: Relationship[]
  ): Record<string, unknown> {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));

    // Prepare main entities for sidebar navigation (top-level entities only)
    const mainEntities = busEntities
      .filter((e) => !e.tableName.includes("_") || e.tableName.match(/^bus_[a-z]+$/))
      .slice(0, 10) // Limit to top 10 main entities
      .map((entity) => ({
        ...entity,
        title: entity.displayName || entity.name,
        description: `Manage ${entity.displayName || entity.name}`,
        icon: this.getIconForEntity(entity.tableName),
      }));

    return {
      testsWorkspace: this.options.testsWorkspace ?? false,
      project: {
        name: this.options.projectName,
        version: this.options.projectVersion,
        description: this.options.projectDescription,
        id: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        snake: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      },
      config: {
        baseUrl: this.options.apiBaseUrl,
        backendPort: (() => {
          try {
            return new URL(this.options.apiBaseUrl || "http://localhost:3001").port || "3001";
          } catch {
            return "3001";
          }
        })(),
        // package.json's dev/start scripts pass this to vinxi. Left undefined it
        // rendered as `vinxi dev --port ` and the server picked a port at random.
        frontendPort: this.options.frontendPort ?? 3001,
        enableDarkMode: this.options.enableDarkMode,
      },
      projectName: this.options.projectName,
      projectSnake: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      projectKebab: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      entities: busEntities,
      mainEntities,
      relationships,
      now: new Date().toISOString(),
    };
  }

  private getIconForEntity(tableName: string): string {
    // Map entity table names to appropriate Lucide icons
    const iconMap: Record<string, string> = {
      bus_patient: "UserCircle",
      bus_patient_insurance: "FileCheck",
      bus_patient_document: "FileText",
      bus_patient_allergy: "Activity",
      bus_insurance_provider: "Building2",
      bus_insurance_claim: "FileCheck",
      bus_appointment: "Calendar",
      bus_admission: "ClipboardList",
      bus_prescription: "Pill",
      bus_medication: "Pill",
      bus_lab_order: "TestTube",
      bus_lab_result: "FileCheck",
      bus_radiology_order: "Activity",
      bus_radiology_report: "FileText",
      bus_department: "Building2",
      bus_staff: "Users",
      bus_customer: "Building2",
      bus_product: "Package",
      bus_order: "ShoppingCart",
      bus_sales_order: "Receipt",
    };
    return iconMap[tableName] || "FileText";
  }

  private async generateCoreFiles(outputDir: string, context: any): Promise<void> {
    const templateDir = this.resolvedTemplateDir;

    // `client.tsx` and `ssr.tsx` are deliberately not written. The
    // `tanstackStart()` Vite plugin generates both entry points itself since
    // the move off Vinxi; hand-written ones shadow it and break the build.
    // Only the router is ours.

    const routerContent = await this.renderTemplate("src/router.tsx.hbs", context);
    await fs.writeFile(path.join(outputDir, "src/router.tsx"), routerContent);

    // Root layout (__root.tsx)
    const layoutContent = await this.renderTemplate("src/routes/__root.tsx.hbs", context);
    await fs.writeFile(path.join(outputDir, "src/routes/__root.tsx"), layoutContent);

    // Index page (redirects to dashboard)
    const homePageContent = await this.renderTemplate("src/routes/index.tsx.hbs", context);
    await fs.writeFile(path.join(outputDir, "src/routes/index.tsx"), homePageContent);

    // Dashboard page (flat route file)
    const dashboardPageContent = await this.renderTemplate("src/routes/dashboard.tsx.hbs", context);
    await fs.writeFile(path.join(outputDir, "src/routes/dashboard.tsx"), dashboardPageContent);

    // Natural-language querying (decision D5). Emitted unconditionally: the
    // page explains that the add-on is off when the backend answers 503, which
    // is more discoverable than a route that silently does not exist.
    const askPageContent = await this.renderTemplate("src/routes/ask.tsx.hbs", context);
    await fs.writeFile(path.join(outputDir, "src/routes/ask.tsx"), askPageContent);

    const nlQueryPanelContent = await this.renderTemplate(
      "src/components/ai/nl-query-panel.tsx.hbs",
      context
    );
    await fs.writeFile(
      path.join(outputDir, "src/components/ai/nl-query-panel.tsx"),
      nlQueryPanelContent
    );

    // Admin layout route (guards /admin/* from non-admin users)
    try {
      const adminLayoutContent = await this.renderTemplate("src/routes/admin.tsx.hbs", context);
      await fs.writeFile(path.join(outputDir, "src/routes/admin.tsx"), adminLayoutContent);
    } catch (e) {
      console.warn("Admin layout route template not found");
    }

    // Providers index (rendered template)
    const providersContent = await this.renderTemplate("src/providers/index.tsx.hbs", context);
    await fs.writeFile(path.join(outputDir, "src/providers/index.tsx"), providersContent);

    // ElectricProvider (static file — JSX double-braces conflict with Handlebars)
    try {
      await fs.copyFile(
        path.join(this.resolvedTemplateDir, "src/providers/electric-provider.tsx"),
        path.join(outputDir, "src/providers/electric-provider.tsx")
      );
    } catch (e) {
      console.warn("electric-provider static file not found, skipping:", (e as Error).message);
    }

    // Copy provider files (only query-provider; index.tsx comes from the .hbs template)
    const providerFiles = ["src/providers/query-provider.tsx"];

    for (const file of providerFiles) {
      try {
        await fs.copyFile(path.join(templateDir, file), path.join(outputDir, file));
      } catch (e) {
        console.warn(`Provider file not found: ${file}`);
      }
    }

    // Copy contexts directory
    await fs.mkdir(path.join(outputDir, "src/contexts"), { recursive: true });
    try {
      await fs.copyFile(
        path.join(templateDir, "src/contexts/auth-context.tsx"),
        path.join(outputDir, "src/contexts/auth-context.tsx")
      );
    } catch (e) {
      console.warn("Auth context file not found");
    }

    // Global styles
    const stylesContent = await this.renderTemplate("src/styles/globals.css.hbs", context);
    await fs.writeFile(path.join(outputDir, "src/styles/globals.css"), stylesContent);

    // Auth pages (login and signup)
    try {
      const loginPageContent = await this.renderTemplate("src/routes/auth/login.tsx.hbs", context);
      await fs.writeFile(path.join(outputDir, "src/routes/auth/login.tsx"), loginPageContent);
    } catch (e) {
      console.warn("Login page template not found");
    }

    try {
      const signupPageContent = await this.renderTemplate(
        "src/routes/auth/signup.tsx.hbs",
        context
      );
      await fs.writeFile(path.join(outputDir, "src/routes/auth/signup.tsx"), signupPageContent);
    } catch (e) {
      console.warn("Signup page template not found");
    }

    // Auth lib file (static)
    try {
      await fs.copyFile(
        path.join(templateDir, "src/lib/auth.ts"),
        path.join(outputDir, "src/lib/auth.ts")
      );
    } catch (e) {
      console.warn("Auth lib file not found");
    }

    // Auth proxy API route — catches /api/auth/* and proxies to NestJS backend
    try {
      await fs.mkdir(path.join(outputDir, "src/routes/api/auth"), { recursive: true });
      const authProxyContent = await this.renderTemplate("src/routes/api/auth/$.ts.hbs", context);
      await fs.writeFile(path.join(outputDir, "src/routes/api/auth/$.ts"), authProxyContent);
    } catch (e) {
      console.warn("Auth proxy route template not found");
    }
  }

  private async generateApiLayer(outputDir: string, context: any): Promise<void> {
    const templateDir = this.resolvedTemplateDir;

    // API client (rendered template)
    const apiClientContent = await this.renderTemplate("src/lib/api-client.ts.hbs", context);
    await fs.writeFile(path.join(outputDir, "src/lib/api-client.ts"), apiClientContent);

    // Field schema with Zod validation and field type helpers
    try {
      const fieldSchemaContent = await this.renderTemplate("src/lib/field-schema.ts.hbs", context);
      await fs.writeFile(path.join(outputDir, "src/lib/field-schema.ts"), fieldSchemaContent);
    } catch (e) {
      console.warn("field-schema template not found, skipping:", (e as Error).message);
    }

    // ElectricSQL + PGlite setup (local-first sys_ entity sync)
    try {
      const electricContent = await this.renderTemplate("src/lib/electric.ts.hbs", context);
      await fs.writeFile(path.join(outputDir, "src/lib/electric.ts"), electricContent);
    } catch (e) {
      console.warn("Electric template not found, skipping:", (e as Error).message);
    }

    // TanStack DB collections backed by PGlite
    try {
      const collectionsContent = await this.renderTemplate(
        "src/lib/sys-collections.ts.hbs",
        context
      );
      await fs.writeFile(path.join(outputDir, "src/lib/sys-collections.ts"), collectionsContent);
    } catch (e) {
      console.warn("sys-collections template not found, skipping:", (e as Error).message);
    }

    // i18n translation utilities (static files, copy directly)
    const i18nFiles = [
      "src/lib/translations.tsx",
      "src/lib/i18n-fields.ts",
      "src/i18n/config.ts",
      "src/messages/en.json",
      "src/messages/de.json",
    ];

    for (const file of i18nFiles) {
      try {
        await fs.copyFile(path.join(templateDir, file), path.join(outputDir, file));
      } catch (e) {
        console.warn(`i18n file not found: ${file}`);
      }
    }

    // Entity hooks using TanStack Query
    const hooksContent = await this.renderTemplate("src/hooks/use-entities.ts.hbs", context);
    await fs.writeFile(path.join(outputDir, "src/hooks/use-entities.ts"), hooksContent);

    // Field metadata hooks (HTTP-based, kept for backwards compat)
    const fieldHooksContent = await this.renderTemplate(
      "src/hooks/use-field-metadata.ts.hbs",
      context
    );
    await fs.writeFile(path.join(outputDir, "src/hooks/use-field-metadata.ts"), fieldHooksContent);

    // Local-first sys_ hooks via TanStack DB + ElectricSQL
    try {
      const sysElectricContent = await this.renderTemplate(
        "src/hooks/use-sys-electric.ts.hbs",
        context
      );
      await fs.writeFile(path.join(outputDir, "src/hooks/use-sys-electric.ts"), sysElectricContent);
    } catch (e) {
      console.warn("use-sys-electric template not found, skipping:", (e as Error).message);
    }
  }

  private async generateComponents(outputDir: string, _context: any): Promise<void> {
    const templateDir = this.resolvedTemplateDir;

    /*
     * `components/ui/*` is not copied here.
     *
     * There used to be a list of nineteen component names copied as
     * `src/components/ui/<name>.tsx`, and **every one of them failed** — the
     * Astryx migration made each of those an adapter, so the templates are
     * `<name>.tsx.hbs` now and `astryx-frontend.generator.ts` renders all
     * twenty-six of them. The loop warned `UI component not found` nineteen
     * times on every generation and copied nothing, and the components arrived
     * anyway from the other generator, so the warnings read as noise rather
     * than as a list that had stopped being true.
     */

    /*
     * Hand-written library modules, copied verbatim.
     *
     * Nothing here is model-derived, so there is no template to render — but
     * every one is imported by a component, which means a file missed here is
     * a frontend that does not build. `frontend-lib-files.test.ts` asserts each
     * one reaches the output, because the `catch` below only warns.
     */
    const staticLibFiles = ["src/lib/utils.ts", "src/lib/csv.ts"];

    for (const file of staticLibFiles) {
      try {
        await fs.copyFile(path.join(templateDir, file), path.join(outputDir, file));
      } catch (e) {
        console.warn(`Static lib file not found: ${file}`, (e as Error).message);
      }
    }

    // Copy layout components
    await fs.mkdir(path.join(outputDir, "src/components/layout"), { recursive: true });

    // The application shell, and the two halves it mounts.
    //
    // **None of this is optional and none of it is caught.** It used to be: the
    // copy loop warned `Layout component not found` and carried on, and the
    // sidebar render fell back to copying a `sidebar.tsx` that does not exist,
    // warning twice and continuing. A warning in a generation log that runs to
    // hundreds of lines is not a failure — an application would have shipped
    // with no navigation at all and reported success. `renderTemplate` also
    // raises on a Handlebars syntax error, which that catch made
    // indistinguishable from a missing file: a typo in the sidebar would have
    // deleted the sidebar from every generated application silently.
    const staticLayoutComponents = [
      "src/components/layout/app-shell.tsx",
      "src/components/layout/header.tsx",
      "src/components/layout/index.ts",
    ];

    for (const component of staticLayoutComponents) {
      await fs.copyFile(path.join(templateDir, component), path.join(outputDir, component));
    }

    const sidebarContent = await this.renderTemplate(
      "src/components/layout/sidebar.tsx.hbs",
      _context
    );
    await fs.writeFile(path.join(outputDir, "src/components/layout/sidebar.tsx"), sidebarContent);

    // Copy static React components (these have complex JSX that doesn't work well with Handlebars)
    const staticComponents = [
      {
        src: "src/components/forms/dynamic-form.tsx",
        dest: "src/components/forms/dynamic-form.tsx",
      },
      {
        src: "src/components/forms/master-detail-tabs.tsx",
        dest: "src/components/forms/master-detail-tabs.tsx",
      },
      {
        src: "src/components/tables/dynamic-table.tsx",
        dest: "src/components/tables/dynamic-table.tsx",
      },
      {
        src: "src/components/admin/field-layout-editor.tsx",
        dest: "src/components/admin/field-layout-editor.tsx",
      },
      {
        src: "src/components/admin/field-group-manager.tsx",
        dest: "src/components/admin/field-group-manager.tsx",
      },
      // AD (Application Dictionary) components
      {
        src: "src/components/admin/ad-window-shell.tsx",
        dest: "src/components/admin/ad-window-shell.tsx",
      },
      {
        src: "src/components/admin/ad-toolbar.tsx",
        dest: "src/components/admin/ad-toolbar.tsx",
      },
      {
        src: "src/components/admin/ad-breadcrumb.tsx",
        dest: "src/components/admin/ad-breadcrumb.tsx",
      },
      {
        src: "src/components/admin/ad-record-nav.tsx",
        dest: "src/components/admin/ad-record-nav.tsx",
      },
      {
        src: "src/components/admin/ad-sidebar.tsx",
        dest: "src/components/admin/ad-sidebar.tsx",
      },
      {
        src: "src/components/admin/ad-field-definitions.ts",
        dest: "src/components/admin/ad-field-definitions.ts",
      },
      {
        src: "src/components/admin/ad-window-configs.ts",
        dest: "src/components/admin/ad-window-configs.ts",
      },
      // Hooks
      {
        // The dictionary's own lists, fetched once per session. Three hooks
        // read it; keeping it first in this list is only cosmetic, but the
        // entry is not — an unregistered file is silently never emitted, and
        // the three importers then fail to resolve it.
        src: "src/hooks/use-dictionary-lists.ts",
        dest: "src/hooks/use-dictionary-lists.ts",
      },
      {
        // The caller-scoped navigation, shared by the dashboard's cards and the
        // sidebar's links under one query key — so the sidebar costs no request
        // of its own.
        src: "src/hooks/use-dashboard.ts",
        dest: "src/hooks/use-dashboard.ts",
      },
      {
        src: "src/hooks/use-record-navigation.ts",
        dest: "src/hooks/use-record-navigation.ts",
      },
      {
        src: "src/hooks/use-window-tabs.ts",
        dest: "src/hooks/use-window-tabs.ts",
      },
      {
        src: "src/hooks/use-bus-entity-level.ts",
        dest: "src/hooks/use-bus-entity-level.ts",
      },
      // `components/ui/*` is not listed here either — see the note above the
      // Astryx adapters. Five entries (breadcrumb, separator, tooltip,
      // empty-state, mobile-sidebar) named `.tsx` files that became `.tsx.hbs`
      // adapters, so each warned `Static component not found` on every
      // generation while the component itself arrived from the other generator.
      // Skeletons
      {
        src: "src/components/skeletons/form-skeleton.tsx",
        dest: "src/components/skeletons/form-skeleton.tsx",
      },
      // Business entity level hook
      {
        src: "src/hooks/use-bus-entity-level.ts",
        dest: "src/hooks/use-bus-entity-level.ts",
      },
      // AD shell components
      {
        // Shared by every shell — the Help button and screen for a window.
        src: "src/components/admin/window-help-dialog.tsx",
        dest: "src/components/admin/window-help-dialog.tsx",
      },
      {
        src: "src/components/admin/ad-detail-shell.tsx",
        dest: "src/components/admin/ad-detail-shell.tsx",
      },
      {
        src: "src/components/admin/ad-list-shell.tsx",
        dest: "src/components/admin/ad-list-shell.tsx",
      },
      {
        src: "src/components/admin/entity-window-shell.tsx",
        dest: "src/components/admin/entity-window-shell.tsx",
      },
      {
        src: "src/components/admin/unified-field-layout.tsx",
        dest: "src/components/admin/unified-field-layout.tsx",
      },
      // Dynamic bus entity pages (for runtime-created entities)
      {
        src: "src/components/admin/bus-entity-page.tsx",
        dest: "src/components/admin/bus-entity-page.tsx",
      },
      {
        src: "src/components/admin/bus-entity-detail-page.tsx",
        dest: "src/components/admin/bus-entity-detail-page.tsx",
      },
      {
        src: "src/components/admin/bpmn-canvas.tsx",
        dest: "src/components/admin/bpmn-canvas.tsx",
      },
      // The WHEN/IF/THEN reading of a workflow, and the `{{value}}` picker it
      // uses. Both are imported by bpmn-canvas.tsx, so omitting either here
      // breaks the build of every generated app rather than degrading quietly.
      {
        src: "src/components/admin/automation-chain.tsx",
        dest: "src/components/admin/automation-chain.tsx",
      },
      {
        src: "src/components/admin/smart-value-picker.tsx",
        dest: "src/components/admin/smart-value-picker.tsx",
      },
      // Replaces the hard-coded CRM/clinic entity list the rule screens shipped.
      {
        src: "src/components/admin/use-dictionary-entities.ts",
        dest: "src/components/admin/use-dictionary-entities.ts",
      },
      {
        src: "src/components/admin/decision-table-editor.tsx",
        dest: "src/components/admin/decision-table-editor.tsx",
      },
      {
        src: "src/components/admin/doc-status-badge.tsx",
        dest: "src/components/admin/doc-status-badge.tsx",
      },
      {
        src: "src/components/admin/workflow-state-bar.tsx",
        dest: "src/components/admin/workflow-state-bar.tsx",
      },
      {
        src: "src/components/admin/use-report-designs.ts",
        dest: "src/components/admin/use-report-designs.ts",
      },
      {
        src: "src/components/reports/report-designer.tsx",
        dest: "src/components/reports/report-designer.tsx",
      },
      {
        src: "src/components/reports/report-print-modal.tsx",
        dest: "src/components/reports/report-print-modal.tsx",
      },
      // The model's reports: `sys_report`, served by `/api/reports`, which no
      // screen called — every declared report was reachable only as JSON.
      {
        src: "src/components/reports/report-chart.tsx",
        dest: "src/components/reports/report-chart.tsx",
      },
      {
        src: "src/hooks/use-reports.ts",
        dest: "src/hooks/use-reports.ts",
      },
      {
        src: "src/routes/reports.index.tsx",
        dest: "src/routes/reports.index.tsx",
      },
      {
        src: "src/routes/reports.$name.tsx",
        dest: "src/routes/reports.$name.tsx",
      },
      {
        src: "src/lib/workflow/step-types.ts",
        dest: "src/lib/workflow/step-types.ts",
      },
      {
        src: "src/lib/workflow/bpmn-model.ts",
        dest: "src/lib/workflow/bpmn-model.ts",
      },
      {
        src: "src/lib/automation/model.ts",
        dest: "src/lib/automation/model.ts",
      },
      {
        src: "src/lib/automation/rule-content.ts",
        dest: "src/lib/automation/rule-content.ts",
      },
      {
        src: "src/lib/automation/yaml.ts",
        dest: "src/lib/automation/yaml.ts",
      },
      {
        src: "src/components/automation/AutomationBuilder.tsx",
        dest: "src/components/automation/AutomationBuilder.tsx",
      },
      {
        src: "src/components/automation/AutomationHelp.tsx",
        dest: "src/components/automation/AutomationHelp.tsx",
      },
      {
        src: "src/components/automation/LadderCard.tsx",
        dest: "src/components/automation/LadderCard.tsx",
      },
      {
        src: "src/components/automation/RailList.tsx",
        dest: "src/components/automation/RailList.tsx",
      },
      {
        src: "src/components/automation/RuleTableEditor.tsx",
        dest: "src/components/automation/RuleTableEditor.tsx",
      },
      {
        src: "src/components/automation/StepInspector.tsx",
        dest: "src/components/automation/StepInspector.tsx",
      },
      // Missing provider files
      {
        src: "src/providers/browser-router-provider.tsx",
        dest: "src/providers/browser-router-provider.tsx",
      },
      // Auth query hooks
      {
        src: "src/lib/queries/use-auth.ts",
        dest: "src/lib/queries/use-auth.ts",
      },
      // Extra UI components
      // Skeleton components
      {
        src: "src/components/skeletons/dashboard-skeleton.tsx",
        dest: "src/components/skeletons/dashboard-skeleton.tsx",
      },
      {
        src: "src/components/skeletons/table-rows-skeleton.tsx",
        dest: "src/components/skeletons/table-rows-skeleton.tsx",
      },
      {
        src: "src/components/skeletons/stats-card-skeleton.tsx",
        dest: "src/components/skeletons/stats-card-skeleton.tsx",
      },
    ];

    for (const component of staticComponents) {
      try {
        await fs.copyFile(
          path.join(templateDir, component.src),
          path.join(outputDir, component.dest)
        );
      } catch (e) {
        console.warn(`Static component not found: ${component.src}`);
      }
    }

    // Copy dynamic catch-all routes for runtime-created entities
    const dynamicRoutes = ["$entity.tsx", "$entity.$id.tsx"];
    for (const routeFile of dynamicRoutes) {
      try {
        await fs.copyFile(
          path.join(templateDir, "src/routes", routeFile),
          path.join(outputDir, "src/routes", routeFile)
        );
      } catch (e) {
        console.warn(`Dynamic route not found: ${routeFile}`);
      }
    }

    // routeTree.gen.ts is deliberately NOT emitted. TanStack Router's Vite
    // plugin writes it from the route files on both `dev` and `build` (see
    // `generatedRouteTree` in vite.config.ts), so shipping a copy only creates a
    // file that is wrong until the first run — the template copy named a
    // different sample app's entities (account/contact/activity/opportunity) in
    // every generated project. It is gitignored for the same reason.
  }

  // ---------------------------------------------------------------------------
  // Single-entity generation (reused by full generator + generate:entity CLI)
  // ---------------------------------------------------------------------------

  /**
   * Generate only the route files that belong to a single entity:
   *   • src/routes/<entity-kebab>.tsx          (list page)
   *   • src/routes/<entity-kebab>.$id.tsx      (detail page)
   *
   * @param busEntity   The busEntity entry (already inside context.entities)
   * @param context     Full project context (needed for sidebar, project config, etc.)
   * @param outputDir   Frontend project root
   */
  public async generateSingleEntityRoutes(
    busEntity: any,
    context: any,
    outputDir: string
  ): Promise<void> {
    const displayName =
      busEntity.displayName ||
      busEntity.name.charAt(0).toUpperCase() +
        busEntity.name
          .slice(1)
          .toLowerCase()
          .replace(/_([a-z])/g, (_: string, c: string) => " " + c.toUpperCase());
    const entityContext = { ...context, entity: { ...busEntity, displayName } };
    await fs.mkdir(path.join(outputDir, "src/routes"), { recursive: true });

    // An entity named like a TanStack Router file convention (`Route` -> route.tsx
    // is the reserved layout file, which resolves to an empty path and breaks the
    // whole router) gets no explicit files: the `$entity` catch-all serves it.
    const staticNames = await templateRouteNames(path.join(this.resolvedTemplateDir, "src/routes"));
    if (isReservedRouteSlug(kebabCase(busEntity.name), staticNames)) return;

    const listPageFilename = `${kebabCase(busEntity.name)}.tsx`;
    const listPageContent = await this.renderTemplate(
      "src/routes/$entity/index.tsx.hbs",
      entityContext
    );
    await fs.writeFile(path.join(outputDir, "src/routes", listPageFilename), listPageContent);

    const detailPageFilename = `${kebabCase(busEntity.name)}.$id.tsx`;
    const detailPageContent = await this.renderTemplate(
      "src/routes/$entity/$id.tsx.hbs",
      entityContext
    );
    await fs.writeFile(path.join(outputDir, "src/routes", detailPageFilename), detailPageContent);
  }

  /**
   * Public entry-point for the generate:entity CLI command.
   * Builds the full project context (needed for sidebar/nav) then generates
   * the two route files for the named entity.
   */
  public async generateSingleEntity(
    entity: Entity,
    relationships: Relationship[],
    outputDir: string,
    allEntities: Entity[]
  ): Promise<void> {
    const context = this.prepareContext(allEntities, relationships);
    const busEntities = context.entities as any[];
    const busEntity =
      busEntities.find((e) => e.originalName === entity.name || e.name === entity.name) ??
      busEntities[0];

    await this.generateSingleEntityRoutes(busEntity, context, outputDir);
    const staticNames = await templateRouteNames(path.join(this.resolvedTemplateDir, "src/routes"));
    if (isReservedRouteSlug(kebabCase(entity.name), staticNames)) {
      console.log(`  ✓ ${entity.name} is served by the $entity route (reserved file name)`);
      return;
    }

    const listFile = `${kebabCase(entity.name)}.tsx`;
    const detailFile = `${kebabCase(entity.name)}.$id.tsx`;
    console.log(`  ✓ frontend/src/routes/${listFile}`);
    console.log(`  ✓ frontend/src/routes/${detailFile}`);
  }

  /**
   * Remove the per-entity route files an earlier run wrote for an entity the
   * model no longer has, or whose name has since become reserved. `--force`
   * overwrites; it never deleted, so a renamed entity left its old screen
   * behind and a newly reserved name left a file that breaks the router.
   * Only files carrying the generator's own marker are touched.
   */
  private async removeStaleEntityRoutes(outputDir: string, context: any): Promise<void> {
    const routesDir = path.join(outputDir, "src/routes");
    const staticNames = await templateRouteNames(path.join(this.resolvedTemplateDir, "src/routes"));
    const live = new Set<string>(
      (context.entities as any[])
        .map((e) => kebabCase(e.name))
        .filter((slug) => !isReservedRouteSlug(slug, staticNames))
    );
    let entries: string[];
    try {
      entries = await fs.readdir(routesDir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const match = /^([^.$]+)(\.\$id)?\.tsx$/.exec(entry);
      if (!match || live.has(match[1] as string)) continue;
      const file = path.join(routesDir, entry);
      const text = await fs.readFile(file, "utf8");
      if (text.includes("// Generated thin wrapper")) await fs.rm(file);
    }
  }

  private async generateEntityPages(outputDir: string, context: any): Promise<void> {
    await this.removeStaleEntityRoutes(outputDir, context);
    for (const busEntity of context.entities) {
      await this.generateSingleEntityRoutes(busEntity, context, outputDir);
    }
  }

  private async generateAdminPages(outputDir: string, context: any): Promise<void> {
    const adminDir = path.join(outputDir, "src/routes/admin");
    await fs.mkdir(adminDir, { recursive: true });
    const templateDir = this.resolvedTemplateDir;

    // Static AD pages (ADWindowShell-based, no Handlebars needed)
    const staticAdminPages = [
      "index.tsx",
      "tables.tsx",
      "windows.tsx",
      "references.tsx",
      "elements.tsx",
      // The settings an operator may change at run time. A static page like the
      // rest of the dictionary screens: it is the same list-and-edit shell over
      // a `sys_*` table, and nothing on it is derived from the model.
      "system.tsx",
      // The <Outlet /> layout for admin/reports/*; the pages themselves are
      // copied with the subdirectories below.
      "reports.tsx",
    ];

    for (const page of staticAdminPages) {
      try {
        await fs.copyFile(
          path.join(templateDir, "src/routes/admin", page),
          path.join(adminDir, page)
        );
      } catch (e) {
        console.warn(`Static admin page not found: ${page}`);
      }
    }

    // Field layout management - renders as /admin/fields via admin/fields.tsx
    const fieldsContent = await this.renderTemplate("src/routes/admin/fields.tsx.hbs", context);
    await fs.writeFile(path.join(adminDir, "fields.tsx"), fieldsContent);

    // Business rules management - renders as /admin/rules via admin/rules.tsx
    try {
      const rulesContent = await this.renderTemplate("src/routes/admin/rules.tsx.hbs", context);
      await fs.writeFile(path.join(adminDir, "rules.tsx"), rulesContent);
    } catch (e) {
      console.warn("Admin rules page template not found");
    }

    // Entity categories - the grouping the dashboard renders by
    try {
      const categoriesContent = await this.renderTemplate(
        "src/routes/admin/categories.tsx.hbs",
        context
      );
      await fs.writeFile(path.join(adminDir, "categories.tsx"), categoriesContent);
    } catch (e) {
      console.warn("Admin categories page template not found");
    }

    // Automations builder - renders as /admin/automations
    try {
      const automationsContent = await this.renderTemplate(
        "src/routes/admin/automations.tsx.hbs",
        context
      );
      await fs.writeFile(path.join(adminDir, "automations.tsx"), automationsContent);
    } catch (e) {
      console.warn("Admin automations page template not found");
    }

    // Workflow monitoring - renders as /admin/workflows via admin/workflows.tsx
    try {
      const workflowsContent = await this.renderTemplate(
        "src/routes/admin/workflows.tsx.hbs",
        context
      );
      await fs.writeFile(path.join(adminDir, "workflows.tsx"), workflowsContent);
    } catch (e) {
      console.warn("Admin workflows page template not found");
    }

    // Copy audit page
    try {
      await fs.copyFile(
        path.join(templateDir, "src/routes/admin/audit.tsx"),
        path.join(adminDir, "audit.tsx")
      );
    } catch (e) {
      console.warn("Admin audit page not found");
    }

    // Users page (admin/users.tsx)
    try {
      const usersContent = await this.renderTemplate("src/routes/admin/users.tsx.hbs", context);
      await fs.writeFile(path.join(adminDir, "users.tsx"), usersContent);
    } catch (e) {
      console.warn("Admin users page template not found");
    }

    // Roles page (admin/roles.tsx)
    try {
      const rolesContent = await this.renderTemplate("src/routes/admin/roles.tsx.hbs", context);
      await fs.writeFile(path.join(adminDir, "roles.tsx"), rolesContent);
    } catch (e) {
      console.warn("Admin roles page template not found");
    }

    // Recursively copy admin subdirectories (table/$tableId/, window/$windowId/, etc.)
    const adminSubdirs = [
      { src: "src/routes/admin/table", dest: "src/routes/admin/table" },
      { src: "src/routes/admin/window", dest: "src/routes/admin/window" },
      { src: "src/routes/admin/element", dest: "src/routes/admin/element" },
      { src: "src/routes/admin/reference", dest: "src/routes/admin/reference" },
      { src: "src/routes/admin/rules", dest: "src/routes/admin/rules" },
      { src: "src/routes/admin/reports", dest: "src/routes/admin/reports" },
      {
        src: "src/routes/admin/workflow-definitions",
        dest: "src/routes/admin/workflow-definitions",
      },
    ];

    for (const subdir of adminSubdirs) {
      try {
        await this.copyDirRecursive(
          path.join(templateDir, subdir.src),
          path.join(outputDir, subdir.dest)
        );
      } catch (e) {
        console.warn(`Admin subdir not found: ${subdir.src}`);
      }
    }
  }

  /**
   * Copy `public/` verbatim — everything in it is served from the app's own
   * origin. The webfonts live here rather than on a font CDN so a generated app
   * renders identically behind a corporate proxy, air-gapped, or in CI.
   */
  private async copyPublicAssets(outputDir: string): Promise<void> {
    try {
      await this.copyDirRecursive(
        path.join(this.resolvedTemplateDir, "public"),
        path.join(outputDir, "public")
      );
    } catch (e) {
      console.warn("Public assets not found, skipping:", (e as Error).message);
    }
  }

  private async copyDirRecursive(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await this.copyDirRecursive(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Update/enhance configuration files created by TanStack Start CLI
   */
  private async updateConfigFiles(outputDir: string, context: any): Promise<void> {
    // Update package.json with additional dependencies and custom config
    const packageJsonContent = await this.renderTemplate("package.json.hbs", context);
    await fs.writeFile(
      path.join(outputDir, "package.json"),
      typeof packageJsonContent === "string"
        ? packageJsonContent
        : JSON.stringify(packageJsonContent, null, 2)
    );

    // Update/generate TanStack Start config if template exists
    try {
      const viteConfigContent = await this.renderTemplate("vite.config.ts.hbs", context);
      await fs.writeFile(path.join(outputDir, "vite.config.ts"), viteConfigContent);
    } catch (e) {
      console.warn("Custom vite.config.ts template not found, keeping the scaffold default");
    }

    // No `tailwind.config.js` and no `postcss.config.js`. Tailwind v4 is
    // configured from CSS (`@theme`) and runs as a Vite plugin, so both files
    // are obsolete — and Astryx's bridge stylesheet is written against v4's
    // `@theme inline`, so v3 could never have resolved it.

    // Update tsconfig.json
    try {
      const tsconfigContent = await this.renderTemplate("tsconfig.json.hbs", context);
      await fs.writeFile(path.join(outputDir, "tsconfig.json"), tsconfigContent);
    } catch (e) {
      console.warn("Custom tsconfig template not found, keeping TanStack Start default");
    }

    // Update Biome configuration
    try {
      const biomeContent = await this.renderTemplate("biome.json.hbs", context);
      await fs.writeFile(path.join(outputDir, "biome.json"), biomeContent);
    } catch (e) {
      console.warn("Custom Biome config template not found, using defaults");
    }

    // Generate environment configuration for TanStack Start
    // VITE_API_URL points to the frontend (port 3001) so the Vite proxy
    // forwards /api/* requests to the NestJS backend, keeping cookies same-origin
    const envLocalContent = `VITE_API_URL=
VITE_BACKEND_URL=${context.config.baseUrl}
VITE_MASTRA_URL=http://localhost:4111
# Set VITE_ELECTRIC_URL to enable ElectricSQL real-time sync (requires ELECTRIC_URL on backend)
# Leave empty to use HTTP API fallback
VITE_ELECTRIC_URL=
PORT=3001
`;
    await fs.writeFile(path.join(outputDir, ".env.local"), envLocalContent);

    // Dockerfile for production container builds
    try {
      const dockerfileContent = await this.renderTemplate("Dockerfile.hbs", context);
      await fs.writeFile(path.join(outputDir, "Dockerfile"), dockerfileContent);
    } catch (e) {
      console.warn("Frontend Dockerfile template not found, skipping");
    }
  }

  private async generateTestFiles(outputDir: string, context: any): Promise<void> {
    try {
      // Test setup
      const setupContent = await this.renderTemplate("test/setup.tsx.hbs", context);
      await fs.writeFile(path.join(outputDir, "test/setup.tsx"), setupContent);

      // Component tests
      const componentsTestContent = await this.renderTemplate(
        "test/components.test.tsx.hbs",
        context
      );
      await fs.writeFile(path.join(outputDir, "test/components.test.tsx"), componentsTestContent);

      // Automations are stored as YAML; the round trip is what keeps a saved
      // automation opening as the one that was saved.
      const automationYamlTest = await this.renderTemplate(
        "test/automation-yaml.test.ts.hbs",
        context
      );
      await fs.writeFile(path.join(outputDir, "test/automation-yaml.test.ts"), automationYamlTest);

      // Vitest config
      const vitestContent = await this.renderTemplate("vitest.config.ts.hbs", context);
      await fs.writeFile(path.join(outputDir, "vitest.config.ts"), vitestContent);
    } catch (e) {
      // Test templates not found, skip test generation
      console.warn("Unit test templates not found, skipping unit test generation");
    }

    // E2E tests are NOT generated here. They live in the project-level tests/
    // directory and run on bun:test — see BunE2ETestGenerator.
  }
}
