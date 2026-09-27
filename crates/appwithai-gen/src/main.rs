//! `appwithai` — generate a full-stack Loco.rs application from a model.
//!
//! The pipeline, in order:
//!
//!   1. read the model (`*.eml.yaml`), hold it to the language's schema, and
//!      read it into model records, which every compiler below works on;
//!   2. scaffold the backend with `loco new`, then prune what this
//!      architecture replaces;
//!   3. overlay the Handlebars templates, which write everything that carries
//!      logic;
//!   4. emit `seed/dictionary.sql` — without it every `/api/bus/*` route 404s,
//!      because the dictionary is what tells the generic controller which
//!      tables exist.

mod backend;
mod bus;
mod business;
mod category;
mod cli;
mod context;
mod dictionary;
mod dictionary_help;
mod hooks;
mod language;
mod logging;
mod model;
mod naming;
mod rbac;
mod records;
mod reports;
mod rules;
mod saga;
mod scaffold;
mod system;
mod templates;
mod workflows;
mod yaml_model;

use std::path::Path;

use anyhow::{bail, Context, Result};
use clap::Parser;

use cli::{Cli, Command, GenerateArgs};
use language::Language;

fn main() {
    #[cfg(target_os = "wasi")]
    adopt_host_working_directory();
    if let Err(error) = run() {
        eprintln!("\n❌ {error:#}");
        std::process::exit(1);
    }
}

/// Under WASI a process starts in `/`, whatever directory it was run from, so a
/// relative `--input` would name a file at the root of the host. The runner
/// (`scripts/appwithai-wasm.ts`) passes the host's working directory as `PWD`
/// and preopens the filesystem; adopting it makes relative paths mean what they
/// mean to the native CLI.
#[cfg(target_os = "wasi")]
fn adopt_host_working_directory() {
    if let Some(pwd) = std::env::var_os("PWD") {
        if let Err(error) = std::env::set_current_dir(&pwd) {
            eprintln!(
                "warning: cannot enter {}: {error}",
                std::path::Path::new(&pwd).display()
            );
        }
    }
}

fn run() -> Result<()> {
    match Cli::parse().command {
        Command::List => {
            list_stacks();
            Ok(())
        }
        Command::Info(args) => info(&args.input),
        Command::Generate(args) => generate(&args),
    }
}

fn list_stacks() {
    println!("Stacks:");
    println!("  tanstack-astryx-loco   TanStack Start + Astryx on a Loco.rs backend");
    println!("\nAstryx themes (all seven ship in every generated app):");
    println!("  neutral  butter  chocolate  matcha  stone  gothic  y2k");
}

/// Read a model file into records, refusing a path that is not a model.
fn read_model(path: &Path) -> Result<records::ModelRecords> {
    if !yaml_model::is_model_yaml_path(path) {
        bail!(
            "\"{}\" is not a model. A model is a YAML document (*.eml.yaml); see language/yaml/README.md.",
            path.display()
        );
    }
    if !path.exists() {
        bail!("model file not found: {}", path.display());
    }
    let text =
        std::fs::read_to_string(path).with_context(|| format!("reading {}", path.display()))?;
    yaml_model::read_model_yaml(&text).with_context(|| format!("reading {}", path.display()))
}

fn info(input: &Path) -> Result<()> {
    let lang = Language::load()?;
    let records = read_model(input)?;
    let parsed = model::compile_erd(&records.erd, &lang);
    let names: Vec<String> = parsed.entities.iter().map(|e| e.name.clone()).collect();
    let categories = category::resolve_category_declarations(&records.categories, &names);

    println!("📄 {}", input.display());
    println!(
        "   {} entities, {} relationships",
        parsed.entities.len(),
        parsed.relationships.len()
    );

    println!("\n📊 Entities:");
    for entity in &parsed.entities {
        println!(
            "   • {} → {} ({} attributes)",
            entity.name,
            entity.bus_table(),
            entity.attributes.len()
        );
    }

    println!("\n🗂️  Categories ({}):", categories.len());
    let mut sorted = categories.clone();
    sorted.sort_by(|a, b| a.name.cmp(&b.name));
    for category in &sorted {
        let flag = if category.is_default {
            " (default)"
        } else {
            ""
        };
        println!(
            "   • {}{} — {} entities",
            category.name,
            flag,
            category.entities.len()
        );
    }

    Ok(())
}

fn generate(args: &GenerateArgs) -> Result<()> {
    let quiet = args.quiet;

    if !quiet {
        println!("\n🚀 AppWithAI Code Generator");
        println!("═══════════════════════════════════════════\n");
    }

    // ── Read ────────────────────────────────────────────────────────────
    let lang = Language::load()?;
    let records = read_model(&args.input)?;
    let parsed = model::compile_erd(&records.erd, &lang);

    if parsed.entities.is_empty() {
        bail!(
            "no entities found in {}. A model declares at least one entity.",
            args.input.display()
        );
    }

    let entity_names: Vec<String> = parsed.entities.iter().map(|e| e.name.clone()).collect();
    let categories = category::resolve_category_declarations(&records.categories, &entity_names);

    if !quiet {
        println!("📊 Entities found:");
        for entity in &parsed.entities {
            println!(
                "   • {} ({} attributes)",
                entity.name,
                entity.attributes.len()
            );
        }
        println!("\n🗂️  Entity categories ({}):", categories.len());
        let mut sorted = categories.clone();
        sorted.sort_by(|a, b| a.name.cmp(&b.name));
        for category in &sorted {
            let flag = if category.is_default {
                " (default)"
            } else {
                ""
            };
            println!(
                "   • {}{} — {} entities",
                category.name,
                flag,
                category.entities.len()
            );
        }
    }

    let project_name = args.resolved_name();
    let output_dir = std::path::absolute(&args.output)
        .with_context(|| format!("resolving {}", args.output.display()))?;

    if !quiet {
        println!("\n⚙️  Generation Configuration:");
        println!("   • Stack:            tanstack-astryx-loco (TanStack Start + Astryx | Loco.rs)");
        println!(
            "   • Project:          {project_name} v{}",
            args.project_version
        );
        println!("   • Database:         {:?}", args.database);
        println!("   • Theme:            {}", args.theme.as_str());
        println!("   • Backend port:     {}", args.port);
        println!("   • Frontend port:    {}", args.resolved_frontend_port());
        println!("   • API URL:          {}", args.resolved_api_url());
        println!("   • CORS origin:      {}", args.resolved_cors_origin());
        println!("   • Output:           {}", output_dir.display());
        if args.dry_run {
            println!("   • Mode:             DRY RUN (no files written)");
        }
    }

    if args.dry_run {
        println!("\n✅ Dry run complete — no files were written.");
        return Ok(());
    }

    // ── Output directory ────────────────────────────────────────────────
    if output_has_content(&output_dir) && !args.force {
        bail!(
            "Output directory \"{}\" already contains files.\n  \
             Use --force to overwrite, or choose a different --output path.",
            output_dir.display()
        );
    }
    std::fs::create_dir_all(&output_dir)
        .with_context(|| format!("creating {}", output_dir.display()))?;

    // Access rules. Compiled before the backend context is built,
    // because both the context (the demonstration accounts) and `seed/access.sql`
    // (the rules) read them, and deriving twice from two readings is how the
    // accounts and the rules would come to disagree about which roles exist.
    //
    // State machines are `&[]` until Phase 7 lands `compile_workflows`: a
    // directive naming a transition rather than a CRUD operation is reported
    // and skipped, exactly as the TypeScript generator does today.
    let entity_names: Vec<String> = parsed
        .entities
        .iter()
        .map(|entity| entity.name.clone())
        .collect();
    let warn = |message: String| {
        if !quiet {
            println!("  ⚠️  {message}");
        }
    };

    // The model's `stateMachines` say which moves a record may make.
    // Compiled before the access rules because a rule may name a *transition*
    // rather than a CRUD operation — `manager` may `close_won` a `Deal` —
    // and only the machines can say which edges that covers.
    let compiled_workflows =
        workflows::compile_state_machine_declarations(&records.state_machines, &entity_names, warn);
    let state_machines: Vec<rbac::RbacStateMachine> = compiled_workflows
        .iter()
        .map(workflows::CompiledWorkflow::as_state_machine)
        .collect();

    let compiled_rbac =
        rbac::compile_rbac_declarations(&records.rbac, &entity_names, &state_machines, warn);

    // The model's `rules` are decision graphs. Compiled here rather than in
    // the emission layer so a malformed one is reported once, at the point the
    // model is read, rather than per output file.
    let compiled_rules = rules::compile_rule_declarations(&records.rules, |message| {
        if !quiet {
            println!("  ⚠️  {message}");
        }
    });

    // A report names an analytical question and carries the SQL that answers
    // it. Compiled here, with the rules, so a malformed directive is reported
    // once at the point the model is read — and so the refusal of anything that
    // is not a single read happens before a query can reach a seed file.
    let compiled_reports =
        reports::compile_report_declarations(&records.reports, &entity_names, |message| {
            if !quiet {
                println!("  ⚠️  {message}");
            }
        });

    // ── Backend: scaffold, then overlay ─────────────────────────────────
    if !args.skip_backend {
        let backend_dir = output_dir.join("backend");
        if args.skip_cli_scaffold {
            if !quiet {
                println!("\n📦 Phase 1: Skipping CLI scaffold (template-only mode)");
            }
            std::fs::create_dir_all(&backend_dir)?;
        } else {
            if !quiet {
                println!("\n📦 Phase 1: Scaffolding Loco project…");
            }
            scaffold::scaffold(&backend_dir, quiet)?;
        }

        if !quiet {
            println!("\n🎨 Phase 2: Overlaying Rust templates…");
        }
        let context = context::BackendContext::build(
            &parsed,
            &categories,
            &context::ContextOptions {
                project_name: &project_name,
                project_version: &args.project_version,
                project_description: &args.description,
                port: args.port,
                frontend_port: args.resolved_frontend_port(),
                cors_origin: &args.resolved_cors_origin(),
                database: match args.database {
                    cli::Database::Postgres => context::DatabaseTarget::Postgres,
                    cli::Database::Neon => context::DatabaseTarget::Neon,
                },
                rbac: &compiled_rbac,
                rules: &compiled_rules,
                reports: &compiled_reports,
                workflows: &compiled_workflows,
            },
        );
        backend::emit(&backend_dir, &context, quiet)?;

        // The seeds are SQL for the same reason the migrations are, and they
        // are not optional: `src/tasks/seed_dictionary.rs` and
        // `seed_workflows.rs` embed them with `include_str!`, so the crate does
        // not compile until both exist.
        backend::write_dictionary_seed(
            &backend_dir,
            &project_name,
            &context.entities,
            &categories,
            &parsed.enums,
        )?;
        if !quiet {
            println!(
                "  ✓ Wrote seed/dictionary.sql ({} entities)",
                context.entities.len()
            );
        }

        backend::write_rules_seed(&backend_dir, &project_name, &compiled_rules)?;
        if !quiet {
            println!(
                "{}",
                if compiled_rules.is_empty() {
                    "  ✓ Wrote seed/rules.sql (no rules declared)".to_string()
                } else {
                    format!(
                        "  ✓ Wrote seed/rules.sql ({} rule(s))",
                        compiled_rules.len()
                    )
                }
            );
        }

        backend::write_transitions_seed(
            &backend_dir,
            &project_name,
            &compiled_workflows,
            &context.entities,
        )?;
        if !quiet {
            let edges: usize = compiled_workflows
                .iter()
                .map(|workflow| workflow.transitions.len())
                .sum();
            println!(
                "{}",
                if edges == 0 {
                    "  ✓ Wrote seed/transitions.sql (no state machines declared)".to_string()
                } else {
                    format!(
                        "  ✓ Wrote seed/transitions.sql ({} machine(s), {edges} edge(s))",
                        compiled_workflows.len()
                    )
                }
            );
        }

        backend::write_access_seed(
            &backend_dir,
            &project_name,
            &compiled_rbac,
            &context.entities,
        )?;
        if !quiet {
            let rules: usize = compiled_rbac
                .operations
                .iter()
                .map(|rule| rule.roles.len())
                .sum();
            let edges: usize = compiled_rbac
                .transitions
                .iter()
                .map(|rule| rule.edges.len() * rule.roles.len())
                .sum();
            println!(
                "{}",
                if rules + edges == 0 {
                    "  ✓ Wrote seed/access.sql (no access rules declared)".to_string()
                } else {
                    format!(
                        "  ✓ Wrote seed/access.sql ({rules} operation rule(s), {edges} transition rule(s))"
                    )
                }
            );
        }

        backend::write_system_seed(&backend_dir, &project_name, &args.description)?;
        if !quiet {
            println!(
                "  ✓ Wrote seed/system.sql ({} settable key(s))",
                system::SETTING_COUNT
            );
        }

        backend::write_logging_module(&backend_dir, &project_name)?;

        backend::write_business_seed(
            &backend_dir,
            &project_name,
            &context.entities,
            &parsed.relationships,
            &compiled_workflows,
            &parsed.enums,
        )?;
        if !quiet {
            println!(
                "  ✓ Wrote seed/business.sql ({} entities)",
                context.entities.len()
            );
        }

        // An entity's table name is resolved here, where both the model's names
        // and the names the schema ended up with are in hand. The generated
        // application holds only one of the two.
        let table_for_entity: std::collections::HashMap<String, String> = context
            .entities
            .iter()
            .map(|entity| (entity.name.clone(), entity.table_name.clone()))
            .collect();
        backend::write_reports_seed(
            &backend_dir,
            &project_name,
            &compiled_reports,
            &table_for_entity,
        )?;
        if !quiet {
            println!(
                "{}",
                if compiled_reports.is_empty() {
                    "  ✓ Wrote seed/reports.sql (no reports declared)".to_string()
                } else {
                    format!(
                        "  ✓ Wrote seed/reports.sql ({} report(s))",
                        compiled_reports.len()
                    )
                }
            );
        }

        let sagas = compile_sagas(&records.sagas, &context.entities, &lang);
        backend::write_workflow_seed(&backend_dir, &project_name, &sagas)?;
        if !quiet {
            let steps: usize = sagas.iter().map(|saga| saga.steps.len()).sum();
            println!(
                "{}",
                if sagas.is_empty() {
                    "  ✓ Wrote seed/workflows.sql (no sagas declared)".to_string()
                } else {
                    format!(
                        "  ✓ Wrote seed/workflows.sql ({} saga(s), {steps} steps)",
                        sagas.len()
                    )
                }
            );
        }

        // The model's `hooks`. Compiled here rather than beside the
        // other compilers above because nothing else reads them: they become
        // Rust source under `src/hooks/`, not a seed row.
        let compiled_hooks = hooks::compile_hook_declarations(&records.hooks, &entity_names, warn);
        let hook_entities = backend::write_hook_handlers(&backend_dir, &compiled_hooks)?;
        if !quiet {
            println!(
                "{}",
                if compiled_hooks.is_empty() {
                    "  ✓ Wrote src/hooks/ (no hooks declared)".to_string()
                } else {
                    format!(
                        "  ✓ Wrote src/hooks/ ({} handler(s) across {hook_entities} entity(ies))",
                        compiled_hooks.len()
                    )
                }
            );
        }

        // After the templates, because it writes into the same crate; before
        // nothing in particular, because nothing formats `.sql`.
        backend::format_sources(&backend_dir, quiet);
    }

    // `--skip-backend` is the whole run for this generator: the frontend is not
    // ported, so skipping the backend skips everything. Saying "Backend
    // generated" over an empty directory is worse than saying nothing — it is a
    // success message for work that did not happen.
    if args.skip_backend {
        println!(
            "\n⚠️  Nothing was generated.\n   \
             --skip-backend was given, and the backend is the only thing this generator\n   \
             emits — the frontend and the bun:test suite are not ported to it yet.\n   \
             Drop --skip-backend, or use `bun run generate:tanstack` for a frontend."
        );
        return Ok(());
    }

    if !quiet {
        println!("\n✅ Backend generated at {}", output_dir.display());
        println!(
            "   {} entities, {} relationships, {} categories",
            parsed.entities.len(),
            parsed.relationships.len(),
            categories.len()
        );
        // Said plainly and every run, because the gap is not visible in the
        // output: the crate looks complete and fails at `cargo build` on an
        // `include_str!` of a seed file nothing wrote.
        println!(
            "\n⚠️  Backend only. The frontend and the bun:test suite are not ported to this\n   \
             generator, and its frontend flags (--theme, --dark-mode, --skip-frontend,\n   \
             --api-url) are accepted and inert.\n\n   \
             Use `bun run generate:tanstack` for a complete application."
        );
    }

    Ok(())
}

/// Step types `services/workflow.rs` dispatches on.
///
/// Kept in step with the `match` in that template — the language declares
/// `Agent` as well, and nothing in this backend runs it.
const EXECUTABLE_STEP_TYPES: [&str; 6] = [
    "UpdateEntity",
    "CreateEntity",
    "DeleteEntity",
    "Decision",
    "Formula",
    "REST",
];

/// Parse the model's sagas, resolve their entities to physical tables, and say
/// out loud what will not work.
///
/// A saga names its entity the way the ERD does — `DeviationReport` — but
/// everything downstream resolves physical tables. Normalising here rather than
/// at run time keeps the stored definition in the same vocabulary as the
/// dictionary the executor looks the entity up in.
/// Takes no `quiet` flag on purpose: everything it prints is a warning, and
/// warnings are not progress chatter.
fn compile_sagas(
    declarations: &[records::SagaDeclaration],
    entities: &[bus::BusEntity],
    lang: &Language,
) -> Vec<saga::SagaWorkflow> {
    let parsed = saga::compile_saga_declarations(declarations, lang);
    let table_by_name: std::collections::HashMap<String, String> = entities
        .iter()
        .map(|entity| (entity.name.to_lowercase(), entity.table_name.clone()))
        .collect();

    let mut workflows = parsed.workflows;
    for workflow in &mut workflows {
        match table_by_name.get(&workflow.entity.to_lowercase()) {
            Some(table) => workflow.entity = table.clone(),
            None if !workflow.entity.is_empty() => {
                eprintln!(
                    "  ⚠️  saga {}: entity \"{}\" is not in the model",
                    workflow.name, workflow.entity
                );
            }
            None => {}
        }
    }

    for diagnostic in &parsed.diagnostics {
        let where_ = match &diagnostic.node_id {
            Some(node_id) => format!("{}.{node_id}", diagnostic.workflow),
            None => diagnostic.workflow.clone(),
        };
        eprintln!("  ⚠️  saga {where_}: {}", diagnostic.message);
    }

    // The language declares more step types than this backend executes. An
    // unimplemented one is skipped at run time with only a log line, so a saga
    // that leans on it appears to succeed while doing nothing. Say so at
    // generation time, where the author is still looking.
    //
    // Not gated on `--quiet`, and deliberately so. Every other saga warning here
    // survives quiet mode, and this is the one worth keeping most: the others
    // report something the author can see is wrong, while this one reports a
    // step that will run, log nothing useful, and do nothing. `--quiet` is for
    // progress chatter, not for warnings.
    for workflow in &workflows {
        for step in &workflow.steps {
            if !EXECUTABLE_STEP_TYPES.contains(&step.node_type.as_str()) {
                eprintln!(
                    "  ⚠️  saga {}.{}: \"{}\" steps are declared by the model but the Loco backend has \
                     no executor for them — this step will be skipped at run time.",
                    workflow.name, step.node_id, step.node_type
                );
            }
        }
    }

    workflows
}

fn output_has_content(dir: &Path) -> bool {
    std::fs::read_dir(dir)
        .map(|entries| {
            entries
                .flatten()
                .any(|entry| !entry.file_name().to_string_lossy().starts_with('.'))
        })
        .unwrap_or(false)
}
