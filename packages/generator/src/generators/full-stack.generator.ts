/**
 * Full Stack Generator
 *
 * Orchestrates generation of a complete application: a Loco.rs (Rust) backend
 * and a TanStack Start frontend on the Astryx design system, both driven by the
 * Application Dictionary.
 *
 * There used to be a second stack here — NestJS + shadcn/Radix/Tailwind. It is
 * gone: `tanstack-astryx-loco` reached parity and carrying two backends meant
 * writing every feature twice. `StackOption` survives as a one-member union
 * rather than being deleted outright, because it is persisted in
 * `projects.stack_option` and named in the web app's API; keeping the type lets
 * those keep working and leaves a place for a future stack to be added back.
 */

import type { Entity, EntityEnum, Relationship } from "@appwithai/core/types";
import * as fs from "fs/promises";
import * as path from "path";
import type { EntityCategory } from "../model/categories";
import type { CompiledRbac } from "../rbac";
import type { CompiledReport } from "../reports";
import type { CompiledRule } from "../rules";
import type { SagaWorkflow } from "../workflows/saga";
import type { CompiledWorkflow } from "../workflows/state-machine";
import type { CompiledHook } from "../hooks";
import {
  AstryxFrontendGenerator,
  type AstryxTheme,
  type DatabaseTarget,
  LocoBackendGenerator,
  type TanStackStartFrontendOptions,
} from "./tanstack-astryx-loco";
import { BunE2ETestGenerator } from "./tests/bun-e2e.generator";

/**
 * Loco.rs (Rust) backend + TanStack Start with the Astryx design system.
 *
 * The only stack. See docs/MIGRATION-LOCO-ASTRYX.md for how it replaced the
 * NestJS one.
 */
export type StackOption = "tanstack-astryx-loco";
export type AIAddonOption = "none" | "basic" | "advanced";

/**
 * True for the Rust-backend stack.
 *
 * Now vacuously true for every value, and kept because callers outside this
 * package still branch on it and because a second stack would need it again.
 */
export function isLocoStack(stack: StackOption): boolean {
  return stack === "tanstack-astryx-loco";
}

export interface FullStackGeneratorOptions {
  stackOption: StackOption;
  projectName: string;
  /**
   * Which Postgres the generated backend targets. Both use the same driver and
   * the same SQL; Neon differs only in having no localhost default and
   * requiring TLS. Defaults to `postgres`.
   */
  database?: DatabaseTarget;
  projectVersion: string;
  projectDescription: string;
  outputDir: string;
  port: number;
  frontendPort?: number;

  // AI Natural Language Add-on (optional)
  aiNlAddon?: AIAddonOption;
  aiNlProvider?: "anthropic" | "openai";
  aiNlModel?: string;

  // Skip network CLI scaffolding; generate purely from bundled templates.
  skipCliScaffold?: boolean;

  /** Frontend structure options passed through to the TanStack generator. */
  tanstackStartNestjs?: {
    frontend: Partial<TanStackStartFrontendOptions>;
  };

  skipFrontend?: boolean;
  skipBackend?: boolean;

  /** Skip generation of the bun:test E2E suite in <outputDir>/tests. */
  skipTests?: boolean;
  /**
   * Application Dictionary entity categories parsed from the model's
   * The model's `categories`. Falls back to a single "General" default.
   */
  categories?: EntityCategory[];

  /**
   * Enums bound to a column by its `enum` key, with their ids.
   *
   * Reaches the dictionary seed, which defines the list references that
   * `sys_column.sys_reference_id` already points at.
   */
  modelEnums?: EntityEnum[];

  /** The model's sagas, compiled — the source of `seed/workflows.sql`. */
  sagas?: SagaWorkflow[];
  /**
   * The model's access rules (`rbac`), compiled: which roles may perform which operation,
   * and which may cross which state-machine edge.
   *
   * Reaches `seed/access.sql` and the role accounts the backend seeds, so an
   * application can demonstrate the access control its model declared.
   */
  compiledRbac?: CompiledRbac;
  /**
   * Decision graphs compiled from the model's `rules`.
   *
   * Reaches `seed/rules.sql`, which is what puts a row in
   * `sys_rule_definitions` — the table the generated app reads on every
   * business write, and which nothing used to populate.
   */
  compiledRules?: CompiledRule[];
  /** Questions from the model's `reports`, for `seed/reports.sql` and `/api/reports`. */
  compiledReports?: CompiledReport[];
  /**
   * Status machines from the model's `stateMachines`.
   *
   * Reaches `seed/transitions.sql`, which is what the update guard refuses a
   * status write against and what the transitions endpoint offers a form.
   */
  compiledWorkflows?: CompiledWorkflow[];
  /**
   * Lifecycle handlers from the model's `hooks`.
   *
   * Reaches `backend/src/hooks/`, which the bus controller calls around every
   * CRUD operation — the step that turns a declared hook into one that runs.
   */
  compiledHooks?: CompiledHook[];
  /** Records the bulk-seed suite creates per entity (default 1000). */
  recordsPerEntity?: number;
  /**
   * Astryx theme for the `tanstack-astryx-loco` stack (decision D8).
   * Ignored by the NestJS stack. Defaults to `neutral`.
   */
  astryxTheme?: AstryxTheme;
}

export class FullStackGenerator {
  private options: FullStackGeneratorOptions;

  constructor(options: FullStackGeneratorOptions) {
    this.options = options;
  }

  /**
   * Generate complete full-stack application
   */
  async generate(entities: Entity[], relationships: Relationship[]): Promise<void> {
    const outputDir = this.options.outputDir;

    // Create root directory
    await fs.mkdir(outputDir, { recursive: true });

    await this.generateTanStackAstryxLoco(entities, relationships, outputDir);

    // Generate shared files
    await this.generateSharedFiles(outputDir);

    console.log(`\n✅ Full-stack application generated at: ${outputDir}`);
    console.log(`   Stack: ${this.getStackDescription()}`);
    console.log(`   Entities: ${entities.length}`);
    console.log(`   Relationships: ${relationships.length}`);
    if (this.options.aiNlAddon && this.options.aiNlAddon !== "none") {
      console.log(
        `   AI NL Add-on: ${this.options.aiNlAddon} (${this.options.aiNlProvider || "anthropic"})`
      );
    }

    // Run mandatory linting checks
    console.log("\n🔍 Running mandatory linting checks...");
    await this.runLintingChecks(outputDir);
  }

  /**
   * Generate tanstack-astryx-loco: TanStack Start + Astryx over a Loco.rs backend.
   *
   * The bun:test E2E suite speaks HTTP and knows nothing about the backend
   * language. That was what made it the cross-stack parity oracle while there
   * were two stacks; with one it is simply a black-box API suite, and keeping it
   * language-agnostic is still worth it — it is the contract test.
   */
  private async generateTanStackAstryxLoco(
    entities: Entity[],
    relationships: Relationship[],
    outputDir: string
  ): Promise<void> {
    const backendDir = path.join(outputDir, "backend");
    const frontendDir = path.join(outputDir, "frontend");
    const frontendPort = this.options.frontendPort ?? this.options.port + 1;

    if (!this.options.skipBackend) {
      console.log("📦 Generating Loco.rs backend...");
      const backendGenerator = new LocoBackendGenerator({
        projectName: this.options.projectName,
        projectVersion: this.options.projectVersion,
        projectDescription: this.options.projectDescription,
        port: this.options.port,
        frontendPort,
        skipCliScaffold: this.options.skipCliScaffold,
        categories: this.options.categories,
        modelEnums: this.options.modelEnums,
        sagas: this.options.sagas,
        compiledRbac: this.options.compiledRbac,
        compiledRules: this.options.compiledRules,
        compiledReports: this.options.compiledReports,
        compiledWorkflows: this.options.compiledWorkflows,
        compiledHooks: this.options.compiledHooks,
        database: this.options.database,
      });
      await backendGenerator.generate(entities, relationships, backendDir);
    }

    if (!this.options.skipFrontend) {
      console.log("📦 Generating TanStack Start + Astryx frontend...");
      const frontendGenerator = new AstryxFrontendGenerator({
        projectName: this.options.projectName,
        projectVersion: this.options.projectVersion,
        projectDescription: this.options.projectDescription,
        apiBaseUrl: `http://localhost:${this.options.port}`,
        frontendPort,
        enableDarkMode: false,
        skipCliScaffold: this.options.skipCliScaffold,
        astryxTheme: this.options.astryxTheme,
        // The root package.json below lists `tests` as a workspace exactly
        // when tests are generated; the frontend image has to agree.
        testsWorkspace: !this.options.skipTests,
        ...this.options.tanstackStartNestjs?.frontend,
      });
      await frontendGenerator.generate(entities, relationships, frontendDir);
    }

    if (!this.options.skipTests) {
      console.log("🧪 Generating bun:test E2E suite (stack-agnostic parity oracle)...");
      const testGenerator = new BunE2ETestGenerator({
        projectName: this.options.projectName,
        projectVersion: this.options.projectVersion,
        projectDescription: this.options.projectDescription,
        port: this.options.port,
        frontendPort,
        recordsPerEntity: this.options.recordsPerEntity,
        modelEnums: this.options.modelEnums,
        compiledWorkflows: this.options.compiledWorkflows,
      });
      await testGenerator.generate(entities, relationships, outputDir);
    }
  }

  /**
   * Generate shared configuration files
   */
  private async generateSharedFiles(outputDir: string): Promise<void> {
    if (isLocoStack(this.options.stackOption)) {
      await this.generateLocoSharedFiles(outputDir);
      return;
    }
    // Root package.json for monorepo
    const rootPackageJson = {
      name: this.options.projectName,
      version: this.options.projectVersion,
      description: this.options.projectDescription,
      private: true,
      workspaces: this.options.skipTests
        ? ["backend", "frontend"]
        : ["backend", "frontend", "tests"],
      scripts: {
        dev: 'concurrently "bun run dev:backend" "bun run dev:frontend"',
        "dev:backend": "cd backend && bun run start:dev",
        "dev:frontend": "cd frontend && bun run dev",
        build: "bun run build:backend && bun run build:frontend",
        "build:backend": "cd backend && bun run build",
        "build:frontend": "cd frontend && bun run build",
        "db:migrate": "cd backend && bun run migrate",
        "db:seed": "cd backend && bun run seed",
        "db:setup": "cd backend && bun run db:setup",
        test: "bun run test:backend && bun run test:frontend",
        "test:backend": "cd backend && bun run test",
        "test:frontend": "cd frontend && bun run test",
        // End-to-end suites run on bun:test and start the backend themselves.
        "test:e2e": "cd tests && bun run test",
        "test:e2e:fast": "cd tests && bun run test:fast",
        "test:e2e:attach": "cd tests && bun run test:attach",
        "test:all": "bun run test && bun run test:e2e",
      },
      devDependencies: {
        concurrently: "^8.2.0",
      },
      overrides: {
        "@tanstack/router-generator": "1.97.1",
        "@tanstack/router-plugin": "1.97.1",
        "@tanstack/start-plugin": "1.97.19",
        "@tanstack/server-functions-plugin": "1.97.19",
        "@tanstack/react-cross-context": "1.97.18",
        "@tanstack/directive-functions-plugin": "1.97.19",
        "@tanstack/virtual-file-routes": "1.97.8",
      },
    };

    await fs.writeFile(
      path.join(outputDir, "package.json"),
      JSON.stringify(rootPackageJson, null, 2)
    );

    // README.md
    const readme = this.generateReadme();
    await fs.writeFile(path.join(outputDir, "README.md"), readme);

    // .gitignore
    const gitignore = `# Dependencies
node_modules/

# Build output
dist/
.next/
out/

# Generated by TanStack Router on dev/build — never edit or commit
frontend/src/routeTree.gen.ts

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Database
*.db
*.sqlite
`;
    await fs.writeFile(path.join(outputDir, ".gitignore"), gitignore);

    // docker-compose.yml
    try {
      const templateDir = await this.findTemplatesDir();
      const dockerComposeTpl = path.join(
        templateDir,
        "tanstack-astryx-loco/docker-compose.yml.hbs"
      );
      const tplContent = await fs.readFile(dockerComposeTpl, "utf-8");
      const backendPort = this.options.port;
      const frontendPort = this.options.frontendPort ?? this.options.port + 1;
      const projectId = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const projectSnake = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const dockerCompose = tplContent
        .replace(/\{\{project\.name\}\}/g, this.options.projectName)
        .replace(/\{\{project\.id\}\}/g, projectId)
        .replace(/\{\{project\.name \| replace '-' '_'\}\}/g, projectSnake)
        .replace(/\{\{project\.backendPort\}\}/g, String(backendPort))
        .replace(/\{\{project\.frontendPort\}\}/g, String(frontendPort));
      await fs.writeFile(path.join(outputDir, "docker-compose.yml"), dockerCompose);
    } catch (e) {
      console.warn(`docker-compose.yml generation skipped: ${(e as Error).message}`);
    }

    // Copy GitHub Actions workflows
    await this.copyGitHubWorkflows(outputDir);
  }

  /**
   * Root files for the Rust-backend stack.
   *
   * The generated project is bilingual by design: `cargo` owns the backend,
   * `bun` owns the frontend. The backend is therefore NOT a bun workspace
   * member — it has no package.json at all — and every backend script shells
   * out to Loco's own clap CLI rather than to a package script (§8.7).
   */
  private async generateLocoSharedFiles(outputDir: string): Promise<void> {
    const rootPackageJson = {
      name: this.options.projectName,
      version: this.options.projectVersion,
      description: this.options.projectDescription,
      private: true,
      // `backend/` is a cargo crate, not a bun workspace member.
      workspaces: this.options.skipTests ? ["frontend"] : ["frontend", "tests"],
      scripts: {
        dev: 'concurrently "bun run dev:backend" "bun run dev:frontend"',
        "dev:backend": "cd backend && cargo loco start --server-and-worker",
        "dev:frontend": "cd frontend && bun run dev",
        build: "bun run build:backend && bun run build:frontend",
        "build:backend": "cd backend && cargo build --release",
        "build:frontend": "cd frontend && bun run build",
        "db:migrate": "cd backend && cargo loco db migrate",
        "db:seed": "cd backend && cargo loco db seed",
        "db:setup": "cd backend && cargo loco db reset",
        test: "bun run test:backend && bun run test:frontend",
        "test:backend": "cd backend && cargo test",
        "test:frontend": "cd frontend && bun run test",
        // The E2E suites are the cross-stack parity oracle — identical to the
        // NestJS stack's, deliberately.
        "test:e2e": "cd tests && bun run test",
        "test:e2e:fast": "cd tests && bun run test:fast",
        "test:e2e:attach": "cd tests && bun run test:attach",
        "test:all": "bun run test && bun run test:e2e",
        lint: "cd backend && cargo clippy -- -D warnings",
        format: "cd backend && cargo fmt",
      },
      devDependencies: {
        concurrently: "^8.2.0",
      },
    };

    await fs.writeFile(
      path.join(outputDir, "package.json"),
      JSON.stringify(rootPackageJson, null, 2)
    );

    await fs.writeFile(path.join(outputDir, "README.md"), this.generateLocoReadme());
    await this.generateDockerCompose(outputDir);

    const gitignore = `# Dependencies
node_modules/

# Rust build output
backend/target/

# Frontend build output
dist/
out/

# Generated by TanStack Router on dev/build — never edit or commit
frontend/src/routeTree.gen.ts

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
`;
    await fs.writeFile(path.join(outputDir, ".gitignore"), gitignore);
  }

  /**
   * Emit the root `docker-compose.yml`.
   *
   * This used to live after an early `return` in `generateSharedFiles`, so no
   * generated project ever received one — and the template it would have used
   * described the NestJS app: `NODE_ENV` on a Rust binary, a required
   * `BETTER_AUTH_SECRET` nothing reads, a healthcheck on `/api/health` (the
   * route is `/api/me/health`), and a build of `./backend/Dockerfile`, which
   * did not exist until this change added one.
   *
   * Rendered through Handlebars rather than string replacement so it can branch
   * on the database target: the neon profile has no local `postgres` service to
   * depend on, and must take `DATABASE_URL` from the environment.
   */
  private async generateDockerCompose(outputDir: string): Promise<void> {
    const templateDir = await this.findTemplatesDir();

    const frontendPort = this.options.frontendPort ?? this.options.port + 1;
    const projectSnake = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const projectId = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const target = this.options.database ?? "postgres";

    const { TemplateLoader } = await import("../templates/loader");
    const loader = new TemplateLoader(templateDir);
    const render = await loader.load("tanstack-astryx-loco/docker-compose.yml.hbs");
    const rendered = render({
      project: { name: this.options.projectName, id: projectId, snake: projectSnake },
      config: { port: this.options.port, frontendPort },
      database: {
        name: `${projectSnake}_development`,
        target,
        isNeon: target === "neon",
      },
    });

    await fs.writeFile(path.join(outputDir, "docker-compose.yml"), rendered);
  }

  private generateLocoReadme(): string {
    return `# ${this.options.projectName}

${this.options.projectDescription}

## Tech Stack

- **Backend**: Loco.rs (Rust) + Axum + SeaORM/sqlx + PostgreSQL
- **Frontend**: TanStack Start + Astryx design system + TanStack Query/Table/Form

### This project is bilingual, on purpose

\`cargo\` owns the backend; \`bun\` owns the frontend. The backend has no
\`package.json\` — Loco's CLI is itself a clap application, so \`cargo loco\`
provides start/migrate/seed/test/task subcommands directly. That is a
deliberate simplification, not an oversight.

## Prerequisites

- **Rust** (stable) with \`cargo\`
- **Bun.js 1.1.0+**
- PostgreSQL 14+

## Getting Started

\`\`\`bash
# Frontend dependencies
bun install

# Configure the backend
cp backend/.env.example backend/.env

# Create the schema (migrations live in backend/migration/)
bun run db:migrate
bun run db:seed
\`\`\`

## Development

\`\`\`bash
bun run dev              # backend + frontend together

# or separately
bun run dev:backend      # cargo loco start --server-and-worker (:${this.options.port})
bun run dev:frontend     # :${this.options.frontendPort ?? this.options.port + 1}
\`\`\`

The HTTP tier and the job worker can also run as separate processes:

\`\`\`bash
cd backend
cargo loco start --server-and-worker   # both
cargo loco start --worker              # workers only
\`\`\`

> The first \`cargo build\` compiles the whole dependency tree and takes
> minutes. Subsequent builds are incremental.

## Project Structure

\`\`\`
${this.options.projectName}/
├── backend/           # Loco.rs API
│   ├── src/
│   │   ├── app.rs         # Hooks impl — routes, workers, tasks
│   │   ├── controllers/   # bus (generic CRUD), sys, rules, ...
│   │   ├── services/      # dictionary cache, dynamic_repo, row_json
│   │   └── models/
│   ├── migration/     # SeaORM migration crate
│   └── config/        # development/test/production YAML
├── frontend/          # TanStack Start + Astryx
├── tests/             # bun:test E2E suites (HTTP-level)
└── package.json
\`\`\`

## Runtime UI Configuration

The UI layout is driven by the \`sys_*\` Application Dictionary and can be
changed at runtime through /admin — no redeploy:

- \`seq_no\`: field order in detail forms
- \`seq_no_grid\`: field order in list/table views

## License

MIT
`;
  }

  private async findTemplatesDir(): Promise<string> {
    const cwd = process.cwd();
    const candidates = [
      // When cwd is the generator package (bun --filter mode)
      path.join(cwd, "templates"),
      // When cwd is workspace root
      path.join(cwd, "packages/generator/templates"),
      // Navigate up 3 from packages/generator to workspace root, then back
      path.join(cwd, "../../../packages/generator/templates"),
      path.join(cwd, "../../packages/generator/templates"),
      // __dirname relative (dist/cli/ → up to package root → templates)
      path.join(__dirname, "../../templates"),
      path.join(__dirname, "../../../templates"),
    ];
    for (const c of candidates) {
      try {
        const s = await fs.stat(c);
        if (s.isDirectory()) return c;
      } catch {
        /* continue */
      }
    }
    return candidates[0]!;
  }

  /**
   * Copy GitHub Actions workflow templates to the output directory
   */
  private async copyGitHubWorkflows(outputDir: string): Promise<void> {
    const workflowsDir = path.join(outputDir, ".github", "workflows");
    await fs.mkdir(workflowsDir, { recursive: true });

    {
      console.log("📋 Setting up GitHub Actions workflows...");

      // Find the templates directory by traversing up from the dist directory
      let templatesDir = path.resolve(__dirname, "../../../templates");

      // If __dirname doesn't point to the right place, try to find the root
      if (!(await this.directoryExists(templatesDir))) {
        // Try alternate paths
        const currentDir = process.cwd();
        const possiblePaths = [
          path.join(currentDir, "packages/generator/templates"),
          path.join(currentDir, "../packages/generator/templates"),
          path.join(currentDir, "../../packages/generator/templates"),
        ];

        for (const possiblePath of possiblePaths) {
          if (await this.directoryExists(possiblePath)) {
            templatesDir = possiblePath;
            break;
          }
        }
      }

      // Copy frontend workflows
      try {
        const frontendWorkflowsSource = path.join(
          templatesDir,
          "tanstack-astryx-loco/frontend/.github/workflows"
        );

        if (await this.directoryExists(frontendWorkflowsSource)) {
          const entries = await fs.readdir(frontendWorkflowsSource);
          for (const entry of entries) {
            if (entry.endsWith(".hbs")) {
              const source = path.join(frontendWorkflowsSource, entry);
              const destName = entry.replace(".hbs", "");
              const dest = path.join(workflowsDir, destName);
              const content = await fs.readFile(source, "utf-8");
              const rendered = this.renderWorkflowTemplate(content);
              await fs.writeFile(dest, rendered);
              console.log(`   ✓ Created frontend workflow: ${destName}`);
            }
          }
        }
      } catch (e) {
        // Workflows may not exist yet
      }

      // Copy backend workflows
      try {
        const backendWorkflowsSource = path.join(
          templatesDir,
          "tanstack-astryx-loco/backend/.github/workflows"
        );

        if (await this.directoryExists(backendWorkflowsSource)) {
          const entries = await fs.readdir(backendWorkflowsSource);
          for (const entry of entries) {
            if (entry.endsWith(".hbs")) {
              const source = path.join(backendWorkflowsSource, entry);
              const destName = `backend-${entry.replace(".hbs", "")}`;
              const dest = path.join(workflowsDir, destName);
              const content = await fs.readFile(source, "utf-8");
              const rendered = this.renderWorkflowTemplate(content);
              await fs.writeFile(dest, rendered);
              console.log(`   ✓ Created backend workflow: ${destName}`);
            }
          }
        }
      } catch (e) {
        // Workflows may not exist yet
      }
    }
  }

  /**
   * Check if a directory exists
   */
  private async directoryExists(dir: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Render template variables in workflow files
   */
  private renderWorkflowTemplate(content: string): string {
    return content
      .replace(/\{\{project\.name\}\}/g, this.options.projectName)
      .replace(
        /\{\{project\.id\}\}/g,
        this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      )
      .replace(/\{\{project\.version\}\}/g, this.options.projectVersion)
      .replace(/\{\{project\.description\}\}/g, this.options.projectDescription);
  }

  /**
   * Generate README content
   */
  private generateReadme(): string {
    const stackInfo =
      "- **Backend**: NestJS + Fastify + Kysely\n- **Frontend**: TanStack Start + Shadcn UI + TanStack Query/Table/Form";

    return `# ${this.options.projectName}

${this.options.projectDescription}

## Tech Stack

${stackInfo}

## Features

- **Compiere-style Application Dictionary**: Runtime-configurable UI via sys_field metadata
- **sys_ Tables**: System/dictionary tables for configuration
- **bus_ Tables**: Business entity tables generated from ERD
- **Dynamic UI**: Form and table layouts driven by seq_no ordering
- **Admin Interface**: Drag-drop field reordering with immediate effect
- **ETag Concurrency**: Optimistic locking for safe concurrent edits

## Getting Started

### Prerequisites

- **Bun.js 1.1.0+** (REQUIRED runtime)
- PostgreSQL 14+ (or SQLite for development)

### Installation

\`\`\`bash
# Install dependencies
bun install

# Setup environment
cp backend/.env.example backend/.env
# Edit .env with your database credentials

# Run migrations
bun run db:migrate

# Seed initial data (sys_reference, sys_table, sys_column, sys_field)
bun run db:seed
\`\`\`

### Development

\`\`\`bash
# Start both backend and frontend
bun run dev

# Or start individually
bun run dev:backend   # Backend on http://localhost:3000
bun run dev:frontend  # Frontend on http://localhost:3001
\`\`\`

### Production Build

\`\`\`bash
bun run build
\`\`\`

## Project Structure

\`\`\`
${this.options.projectName}/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── sys/   # Application Dictionary modules
│   │   │   └── bus/   # Business entity modules
│   │   └── ...
│   ├── migrations/    # Database migrations
│   └── seeds/         # Seed data
├── frontend/          # TanStack Start App
│   ├── src/routes/
│   └── ...
└── package.json       # Root workspace config
\`\`\`

## Runtime UI Configuration

The UI layout can be modified at runtime through the admin interface:

1. Navigate to /admin
2. Select an entity to configure
3. Drag and drop fields to reorder
4. Changes take effect immediately

Field ordering is controlled by:
- \`seq_no\`: Order in detail forms
- \`seq_no_grid\`: Order in list/table views

## License

MIT
`;
  }

  /**
   * Run mandatory linting checks after generation
   */
  private async runLintingChecks(outputDir: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execFileSync } = require("child_process") as typeof import("child_process");

    const runLint = (command: string, args: string[], cwd: string): boolean => {
      try {
        execFileSync(command, args, { cwd, stdio: "pipe", timeout: 60000 });
        return true;
      } catch (_error: unknown) {
        return false;
      }
    };

    /**
     * Run a gate and, when it fails, show what it said.
     *
     * `runLint` above swallows its output, which makes a failure a bare
     * "found issues" with no way to act on it. A gate you cannot read is not a
     * gate — every diagnostic here is printed.
     */
    const runGate = (
      command: string,
      args: string[],
      cwd: string
    ): { passed: boolean; output: string } => {
      try {
        execFileSync(command, args, { cwd, stdio: "pipe", timeout: 300000 });
        return { passed: true, output: "" };
      } catch (error: unknown) {
        const failure = error as { stdout?: Buffer; stderr?: Buffer };
        const output = `${failure.stdout?.toString() ?? ""}${failure.stderr?.toString() ?? ""}`;
        return { passed: false, output: output.trim() };
      }
    };

    /**
     * Typecheck the generated frontend.
     *
     * This gate exists because Vite does not typecheck: `bun run build`
     * succeeded on a frontend whose login page called endpoints the backend
     * does not serve, whose submit buttons were inert, and which referenced an
     * undefined variable in the rules editor. All three were plain `tsc`
     * errors, and all three shipped. Generating code that does not typecheck
     * is a generator bug, so it is reported here rather than discovered in a
     * browser.
     *
     * Skipped when dependencies are absent — `--no-setup` is a legitimate way
     * to run the generator, and a missing `node_modules` is not a type error.
     */
    const typecheckFrontend = async (frontendDir: string): Promise<void> => {
      console.log("\n  📋 Type-checking frontend...");

      const hasDeps = await fs
        .access(path.join(frontendDir, "node_modules"))
        .then(() => true)
        .catch(() => false);
      if (!hasDeps) {
        console.log("  ⏭️  Skipped — no node_modules (run `bun install` in frontend/)");
        return;
      }

      // `src/routeTree.gen.ts` is written by the TanStack Router vite plugin on
      // the first dev/build run, so on a freshly generated project it does not
      // exist yet. Without it every `createFileRoute` call fails to resolve and
      // tsc reports the whole router surface as broken — 79 errors on this
      // model, all of them artefacts. Type-checking that output tells the user
      // nothing except to distrust the gate, so it is skipped with a reason.
      const hasRouteTree = await fs
        .access(path.join(frontendDir, "src/routeTree.gen.ts"))
        .then(() => true)
        .catch(() => false);
      if (!hasRouteTree) {
        console.log(
          "  ⏭️  Skipped — src/routeTree.gen.ts not generated yet (run `bun run dev` or `bun run build` in frontend/, then `bun run type-check`)"
        );
        return;
      }

      const { passed, output } = runGate("bun", ["run", "type-check"], frontendDir);
      if (passed) {
        console.log("  ✅ Frontend type-check passed");
        return;
      }

      const errors = output.split("\n").filter((line) => line.includes("error TS"));
      console.warn(`  ⚠️  Frontend type-check found ${errors.length} error(s):`);
      for (const line of errors.slice(0, 20)) console.warn(`     ${line}`);
      if (errors.length > 20) console.warn(`     … and ${errors.length - 20} more`);
    };

    if (isLocoStack(this.options.stackOption)) {
      // Deliberately no cargo gate here. On a freshly generated project the
      // Loco + SeaORM + sqlx dependency tree has to compile from scratch, which
      // takes minutes — `clippy` no less than `build`. Running it inline would
      // either blow the timeout and print a misleading warning on every single
      // generation, or hold the web UI's generation stream open for minutes.
      // Compilation belongs in CI (§8.6 / risk R6); `cargo fmt` already ran
      // inside the backend generator, because that one is fast.
      if (!this.options.skipBackend) {
        console.log("\n  📋 Rust backend: skipping compile-time gates (slow on a cold tree)");
        console.log("     Run them yourself with:");
        console.log("       cd backend && cargo clippy -- -D warnings && cargo test");
      }

      if (!this.options.skipFrontend) {
        const frontendDir = path.join(outputDir, "frontend");

        console.log("\n  📋 Linting Astryx frontend...");
        // Same skip as the type-check gate below, for the same reason and one
        // more. `--no-setup` is a legitimate way to run the generator, and
        // without `frontend/node_modules` the `biome` on PATH is the *monorepo's*
        // — currently 2.x — while the generated `biome.json` targets the 1.9.4
        // the generated `package.json` pins. Biome 2 rejects that config
        // outright, so this gate reported "found issues" on every `--no-setup`
        // run no matter what the code said, and swallowed the output that would
        // have explained it.
        const frontendHasDeps = await fs
          .access(path.join(frontendDir, "node_modules"))
          .then(() => true)
          .catch(() => false);

        if (!frontendHasDeps) {
          console.log("  ⏭️  Skipped — no node_modules (run `bun install` in frontend/)");
        } else {
          const { passed, output } = runGate("bun", ["run", "lint"], frontendDir);
          if (passed) {
            console.log("  ✅ Frontend linting passed");
          } else {
            console.warn("  ⚠️  Frontend linting found issues:");
            for (const line of output.split("\n").slice(0, 20)) console.warn(`     ${line}`);
          }
        }

        await typecheckFrontend(frontendDir);
      }

      console.log("\n✨ Linting checks completed!");
      return;
    }

    try {
      if (!this.options.skipBackend) {
        console.log("\n  📋 Linting NestJS backend...");
        const backendLintPassed = runLint("npm", ["run", "lint"], path.join(outputDir, "backend"));
        if (backendLintPassed) {
          console.log("  ✅ Backend linting passed");
        } else {
          console.warn(
            '  ⚠️  Backend linting found issues (run "cd backend && npm run lint:fix" to auto-fix)'
          );
        }
      }

      if (!this.options.skipFrontend) {
        console.log("\n  📋 Linting TanStack Start frontend...");
        const frontendLintPassed = runLint(
          "npm",
          ["run", "lint"],
          path.join(outputDir, "frontend")
        );
        if (frontendLintPassed) {
          console.log("  ✅ Frontend linting passed");
        } else {
          console.warn(
            '  ⚠️  Frontend linting found issues (run "cd frontend && npm run lint:fix" to auto-fix)'
          );
        }
      }

      console.log("\n✨ Linting checks completed!");
      console.log(
        '   Tip: Run "npm run lint:fix" in backend/frontend directories to auto-fix issues'
      );
    } catch (error) {
      console.warn("  ⚠️  Linting could not be completed (dependencies not installed?)");
      console.log('   Tip: Run "bun install" first, then run linting manually');
    }
  }

  /**
   * Get human-readable stack description
   */
  private getStackDescription(): string {
    return "tanstack-astryx-loco - Rust Web (TanStack Start + Astryx | Loco.rs)";
  }
}

export default FullStackGenerator;
