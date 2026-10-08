/**
 * EML CLI — validate a model (`*.eml.yaml`) and generate enterprise reporting
 * code from it.
 *
 * The model is read by the language's own reader at the root of this
 * repository (`language/cli/src/document.ts`), so every command sees the same
 * findings `appwithai validate` reports, at the same YAML lines. The generators
 * are this platform's own. Runs under Bun; `eml.ts` is the thin executable shim.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { loadLanguageDefinition } from "../../../../app-with-ai-rust/language/index.ts";
import { generateApp } from "./generate/app.ts";
import { generateCiWorkflow } from "./generate/ci.ts";
import { generateDocker } from "./generate/docker.ts";
import { publishToGithub } from "./generate/github.ts";
import { generateJdm } from "./generate/jdm.ts";
import { generateEnterpriseReporting } from "./generate/enterprise-reporting.ts";
import type { ModelDocument } from "../../../../app-with-ai-rust/language/yaml/document.ts";
import {
  isModelPath,
  readModel,
  toEmlModel,
} from "../../../../app-with-ai-rust/language/cli/src/document.ts";
import type { Diagnostic, EmlModel } from "./model.ts";

const STACKS = ["enterprise-reporting", "node-rest"] as const;
const STACK_ALIASES: Record<string, (typeof STACKS)[number]> = {
  "enterprise-reporting": "enterprise-reporting",
  "enterprise-report": "enterprise-reporting",
  enterprise: "enterprise-reporting",
  reporting: "enterprise-reporting",
  "tanstack-start": "enterprise-reporting",
  tanstack: "enterprise-reporting",
  "node-rest": "node-rest",
  node: "node-rest",
  rest: "node-rest",
};

const CLI_VERSION = "2.0.0";

// --- Tiny ANSI helpers (respect NO_COLOR) ----------------------------------
const useColor = !process.env.NO_COLOR && process.stdout.isTTY;
const c = {
  dim: (s: string) => (useColor ? `\x1b[2m${s}\x1b[0m` : s),
  red: (s: string) => (useColor ? `\x1b[31m${s}\x1b[0m` : s),
  green: (s: string) => (useColor ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s: string) => (useColor ? `\x1b[33m${s}\x1b[0m` : s),
  cyan: (s: string) => (useColor ? `\x1b[36m${s}\x1b[0m` : s),
  bold: (s: string) => (useColor ? `\x1b[1m${s}\x1b[0m` : s),
};

interface Flags {
  _: string[];
  input?: string;
  output?: string;
  name?: string;
  stack: string;
  docker: boolean;
  github?: string;
  githubToken?: string;
  private?: boolean;
  autofix: boolean;
  force: boolean;
  json: boolean;
  help: boolean;
  version: boolean;
}

class CliError extends Error {
  constructor(
    message: string,
    readonly code = 1
  ) {
    super(message);
  }
}

// --- Argument parsing -------------------------------------------------------
function parseArgs(argv: string[]): Flags {
  const f: Flags = {
    _: [],
    stack: "enterprise-reporting",
    docker: false,
    autofix: true,
    force: false,
    json: false,
    help: false,
    version: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new CliError(`Missing value for ${a}`);
      return v;
    };
    switch (a) {
      case "-i":
      case "--input":
        f.input = next();
        break;
      case "-o":
      case "--output":
        f.output = next();
        break;
      case "-n":
      case "--name":
        f.name = next();
        break;
      case "--stack":
        f.stack = next();
        break;
      case "--docker":
        f.docker = true;
        break;
      case "--github":
        f.github = next();
        break;
      case "--github-token":
        f.githubToken = next();
        break;
      case "--private":
        f.private = true;
        break;
      case "--public":
        f.private = false;
        break;
      case "--no-autofix":
        f.autofix = false;
        break;
      case "--force":
        f.force = true;
        break;
      case "--json":
        f.json = true;
        break;
      case "-h":
      case "--help":
        f.help = true;
        break;
      case "-v":
      case "--version":
        f.version = true;
        break;
      default:
        if (!a) break;
        if (a.startsWith("-")) throw new CliError(`Unknown option: ${a}`);
        f._.push(a);
    }
  }
  return f;
}

// --- Help text --------------------------------------------------------------
const HELP = `${c.bold("eml")} — build enterprise reporting applications from a model (.eml.yaml)

${c.bold("USAGE")}
  eml <command> [options]

${c.bold("COMMANDS")}
  generate   Validate (with self-correction) and generate an app
  validate   Validate a model; report every finding at its YAML line
  info       Print a summary of the model
  help       Show this help

${c.bold("OPTIONS")}
  -i, --input <file>        Model file (.eml.yaml); or first positional arg
  -o, --output <dir>        Output directory for the generated app
  -n, --name <name>         Application name (default: derived from the model)
      --stack <stack>       Target stack: enterprise-reporting (default) | node-rest
      --docker              Also emit Dockerfile + docker-compose.yml (node-rest only)
      --github <owner/repo> Publish the generated app to a GitHub repository
      --github-token <tok>  GitHub token (else GITHUB_TOKEN / GH_TOKEN)
      --private             Create the GitHub repo private (default)
      --public              Create the GitHub repo public
      --no-autofix          Do not correct mechanically fixable findings before generating
      --force               Overwrite a non-empty output directory
      --json                Machine-readable output (validate/info)
  -h, --help                Show help
  -v, --version             Show version

${c.bold("STACKS")}
  ${c.bold("enterprise-reporting")} (default)
    Generates TanStack Start + Kysely + PostgreSQL code for the enterprise
    reporting repository: server functions (.inputValidator()), list/detail
    route components (shadcn/ui + TanStack Table), and a Kysely migration.

  ${c.bold("node-rest")}
    A self-contained, dependency-free Node app (node:http + JSON-file
    datastore). Useful for quick prototyping without the full stack.

${c.bold("EXAMPLES")}
  eml validate -i model.eml.yaml
  eml generate -i model.eml.yaml -o ./out
  eml generate -i model.eml.yaml -o ./out --stack enterprise-reporting
  eml generate -i model.eml.yaml -o ./out --stack node-rest --docker
  eml generate -i model.eml.yaml -o ./out --github me/my-app --public
`;

// --- Commands ---------------------------------------------------------------

/**
 * Write machine-readable output and wait until it has been handed to the OS.
 *
 * `console.log` under Bun does not wait for a pipe to drain, so a `--json`
 * document larger than the pipe's buffer came out cut short whenever the
 * reader was slower than the writer — invalid JSON, intermittently, which is
 * the worst way for a machine-readable format to fail.
 */
function writeJson(value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`, (error) =>
      error ? reject(error) : resolve()
    );
  });
}
interface Input {
  file: string;
  /** The model text as validated: the file, or the file with its corrections applied. */
  text: string;
  diagnostics: Diagnostic[];
  fixes: Diagnostic[];
  ok: boolean;
  document?: ModelDocument;
}

async function readInput(f: Flags, autofix: boolean): Promise<Input> {
  const file = f.input ?? f._[1]; // allow `eml generate model.eml.yaml`
  if (!file) throw new CliError("No input file. Use -i <file> or pass it as an argument.");
  if (!existsSync(file)) throw new CliError(`Input file not found: ${file}`);
  if (!isModelPath(file)) {
    throw new CliError(`${file} is not a model. A model is a YAML document (*.eml.yaml).`);
  }
  const read = await readModel(readFileSync(file, "utf8"), { autofix });
  return { file, ...read };
}

/** A model that did not validate cannot be read further. */
function requireValid(input: Input): { document: ModelDocument; model: EmlModel } {
  if (input.ok && input.document) return { document: input.document, model: toEmlModel(input.document) };
  console.log(c.bold(`\n${input.file}`));
  printDiagnostics(input.diagnostics);
  const errors = input.diagnostics.filter((d) => d.severity === "error").length;
  throw new CliError(`${input.file} has ${errors} error(s); \`eml validate\` lists them.`);
}

function printDiagnostics(diags: Diagnostic[]): void {
  for (const d of diags) {
    const loc = d.line ? c.dim(`:${d.line}${d.column ? `:${d.column}` : ""}`) : "";
    const tag =
      d.severity === "error"
        ? c.red("error")
        : d.severity === "warning"
          ? c.yellow("warn ")
          : c.cyan("info ");
    const fix = d.fix ? c.dim(` → ${d.fix}`) : "";
    console.log(`  ${tag} ${c.dim(d.code)}${loc}  ${d.message}${fix}`);
  }
}

function summarize(model: EmlModel): Record<string, unknown> {
  return {
    name: model.meta.name,
    entities: model.entities.length,
    relationships: model.relationships.length,
    enums: model.enums.length,
    indexes: model.indexes.length,
    rules: model.rules.length,
    reports: model.reports.length,
    workflows: model.workflows.length,
    hooks: model.hooks.length,
    accessRules: model.guards.length,
    triggers: model.triggers.length,
  };
}

async function cmdValidate(f: Flags): Promise<number> {
  // Validation reports the model as written: correcting it first would hide
  // the findings the author came here to read.
  const input = await readInput(f, false);
  const { file, diagnostics, ok } = input;
  const errors = diagnostics.filter((d) => d.severity === "error").length;
  if (f.json) {
    const summary = ok && input.document ? summarize(toEmlModel(input.document)) : undefined;
    await writeJson({ file, ok, summary, diagnostics });
    return ok ? 0 : 1;
  }
  console.log(c.bold(`\nValidating ${file}`));
  if (diagnostics.length) printDiagnostics(diagnostics);
  else console.log(c.green("  no issues"));
  const warnings = diagnostics.filter((d) => d.severity === "warning").length;
  console.log(
    `\n${errors ? c.red(`${errors} error(s)`) : c.green("0 errors")}, ${warnings} warning(s)`
  );
  return ok ? 0 : 1;
}

async function cmdInfo(f: Flags): Promise<number> {
  const input = await readInput(f, false);
  const { model } = requireValid(input);
  const { file } = input;
  const summary = summarize(model);

  if (f.json) {
    await writeJson({ file, summary, model });
    return 0;
  }

  console.log(c.bold(`\n${model.meta.name ?? "EML model"}`), c.dim(`(${file})`));
  console.log(c.dim("─".repeat(48)));
  for (const [k, v] of Object.entries(summary)) {
    if (k === "name") continue;
    console.log(`  ${k.padEnd(16)} ${v}`);
  }
  if (model.entities.length) {
    console.log(c.bold("\nEntities"));
    for (const e of model.entities) {
      console.log(
        `  ${e.name} ${c.dim(
          `→ /_authed/${e.tableName?.replace(/_/g, "-") ?? e.name.toLowerCase()} (${e.attributes.length} fields${
            e.concurrency === "last-write-wins" ? ", last-write-wins" : ""
          })`
        )}`
      );
    }
  }
  if (model.rules.length) {
    console.log(c.bold("\nBusiness rules"));
    for (const r of model.rules)
      console.log(`  ${r.name} ${c.dim(`on ${r.entity} (${r.event ?? "-"})`)}`);
  }
  if (model.workflows.length) {
    console.log(c.bold("\nWorkflows"));
    for (const w of model.workflows)
      console.log(
        `  ${w.name} ${c.dim(
          `(${w.kind}) on ${w.entity ?? "-"}${
            w.kind === "state" && w.final?.length ? `; final, closed: ${w.final.join(", ")}` : ""
          }`
        )}`
      );
  }
  console.log();
  return 0;
}

async function cmdGenerate(f: Flags): Promise<number> {
  const outDir = f.output;
  if (!outDir) throw new CliError("No output directory. Use -o <dir>.");
  const stack = STACK_ALIASES[f.stack];
  if (!stack)
    throw new CliError(`Unsupported stack "${f.stack}". Available: ${STACKS.join(", ")}.`);

  // 1. Read, correct what is mechanically correctable, and validate.
  const input = await readInput(f, f.autofix);
  const { file } = input;
  console.log(c.bold(`\nGenerating from ${file}`) + c.dim(`  [stack: ${stack}]`));
  if (input.fixes.length) {
    printDiagnostics(input.fixes);
    console.log(c.cyan(`  applied ${input.fixes.length} correction(s) in memory; ${file} is unchanged`));
  }
  const { model } = requireValid(input);
  const findings = input.diagnostics.filter((d) => d.severity !== "info");
  if (findings.length) printDiagnostics(findings);

  // 3. Output dir guard.
  prepareOutDir(outDir, f.force);

  const appName = sanitizeName(
    f.name ?? model.meta.name ?? path.basename(file, path.extname(file)) ?? "eml-app"
  );

  // 4. Generate app for the selected stack.
  let runHint: string;
  if (stack === "enterprise-reporting") {
    const written = generateEnterpriseReporting(model, { outDir, appName });
    console.log(
      c.green(`  wrote ${written.length} file(s) (TanStack Start + Kysely + PostgreSQL)`)
    );
    runHint =
      `  1. Copy files into the repository\n` +
      `  2. Add types from KYSELY_TYPES.md to src/lib/db/kysely-db.ts\n` +
      `  3. Run: bun run db:migrate  (or add SQL to bootstrapSchema())`;
  } else {
    const written = generateApp(model, { outDir, appName });
    console.log(c.green(`  wrote ${written.length} file(s) (Node REST)`));
    runHint = `  cd ${outDir} && npm start   # then open http://localhost:3000`;
  }

  // 5. Business rules → GoRules JDM (the generator's converter).
  const jdmFiles = generateJdm(model, outDir);
  if (jdmFiles.length) {
    console.log(c.green(`  wrote ${jdmFiles.length} GoRules JDM file(s) → rules/`));
  }

  // 6. Docker + CI/CD (node-rest only).
  if (f.docker) {
    if (stack === "node-rest") {
      const dockerFiles = generateDocker(outDir, appName);
      console.log(c.green(`  wrote ${dockerFiles.length} docker file(s)`));
      const ciFiles = generateCiWorkflow(outDir, appName);
      console.log(c.green(`  wrote ${ciFiles.length} GitHub Actions workflow`));
    } else {
      console.log(c.yellow("  --docker is only supported for the node-rest stack; skipped"));
    }
  }

  console.log(`\n${c.green("✓")} Generated ${c.bold(appName)} → ${outDir}\n${c.dim(runHint)}`);

  // 7. GitHub (optional).
  if (f.github) {
    console.log(c.bold(`\nPublishing to GitHub (${f.github})`));
    const gh = await publishToGithub({
      target: f.github,
      token: f.githubToken,
      private: f.private ?? true,
      outDir,
    });
    for (const m of gh.messages) console.log(`  ${gh.ok ? c.dim("•") : c.red("•")} ${m}`);
    if (!gh.ok) return 1;
  }

  return 0;
}

function prepareOutDir(outDir: string, force: boolean): void {
  if (existsSync(outDir)) {
    if (!statSync(outDir).isDirectory())
      throw new CliError(`Output path exists and is not a directory: ${outDir}`);
    const entries = readdirSync(outDir);
    if (entries.length > 0 && !force) {
      throw new CliError(`Output directory "${outDir}" is not empty. Use --force to overwrite.`);
    }
  } else {
    mkdirSync(outDir, { recursive: true });
  }
}

function sanitizeName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "eml-app"
  );
}

// --- Entrypoint -------------------------------------------------------------
export async function run(argv: string[]): Promise<number> {
  let flags: Flags;
  try {
    flags = parseArgs(argv);
  } catch (err) {
    console.error(c.red(err instanceof Error ? err.message : String(err)));
    return 1;
  }

  if (flags.version) {
    const def = loadLanguageDefinition();
    console.log(`eml ${CLI_VERSION}  (EML language ${def.language.version})`);
    return 0;
  }

  const command = flags._[0] ?? (flags.help ? "help" : "");
  if (!command || command === "help" || flags.help) {
    console.log(HELP);
    return command && command !== "help" ? 1 : 0;
  }

  try {
    switch (command) {
      case "validate":
        return await cmdValidate(flags);
      case "info":
        return await cmdInfo(flags);
      case "generate":
        return await cmdGenerate(flags);
      default:
        console.error(c.red(`Unknown command: ${command}`));
        console.log(HELP);
        return 1;
    }
  } catch (err) {
    if (err instanceof CliError) {
      console.error(c.red(`\n✗ ${err.message}`));
      return err.code;
    }
    console.error(
      c.red(`\n✗ Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
    );
    if (process.env.EML_DEBUG) console.error(err);
    return 1;
  }
}
