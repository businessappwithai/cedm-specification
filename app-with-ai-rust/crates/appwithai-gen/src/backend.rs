//! Phase 2 of backend generation: overlay the Handlebars templates.
//!
//! A port of the emission half of `LocoBackendGenerator`. The `.hbs` files are
//! shared with the TypeScript generator rather than duplicated — the
//! `handlebars` crate speaks the same dialect, so what had to be ported is the
//! helper set, the context, and the two lists below.
//!
//! Three kinds of file come out of here, and the distinction matters:
//!
//!   * **rendered** — `RENDERED_FILES`, one template per output path;
//!   * **copied** — `migration/sql/*.sql`, byte for byte, because the `sys_*`
//!     DDL is hand-maintained and must not be reinterpreted by Handlebars on
//!     the way through; and
//!   * **per-entity** — `tests/requests/{crud,rules}_<slug>.rs`, one pair per
//!     entity, from a single template rendered once per entity.
//!
//! Adding a template without adding it to one of those three is the mistake
//! that is easy to make and silent when made: generation succeeds and the file
//! simply is not there.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;

use anyhow::{anyhow, Context, Result};
use handlebars::Handlebars;
use serde_json::Value;

use crate::bus::BusEntity;
use crate::business::{build_business_seed_sql, BusinessSeedOptions, DEMONSTRATION_ROWS};
use crate::category::Category;
use crate::context::BackendContext;
use crate::dictionary::{build_dictionary_seed_sql, CategorySeed, DictionarySeedOptions};
use crate::hooks::{
    append_missing_handlers, build_hook_handler_module, build_hook_handlers_mod,
    build_hook_registry, handler_module, hooks_by_entity, CompiledHook,
};
use crate::language::walk_up_for;
use crate::logging::{build_generated_logging_module, COMMON_MOD_RS};
use crate::model::ModelEnum;
use crate::rbac::{build_access_seed_sql, AccessSeedOptions, CompiledRbac};
use crate::reports::{build_reports_seed_sql, CompiledReport, ReportsSeedOptions};
use crate::rules::{build_rules_seed_sql, CompiledRule, RulesSeedOptions};
use crate::saga::{build_workflow_seed_sql, SagaWorkflow};
use crate::system::{build_system_seed_sql, SystemSeedOptions};
use crate::templates;
use crate::workflows::{build_transitions_seed_sql, CompiledWorkflow, TransitionsSeedOptions};

/// Template → output path. One template per output file: a `foo.rs` and a
/// `foo.rs.hbs` both claiming the same destination means one of them is dead,
/// and editing the dead one changes nothing while looking like a fix.
const RENDERED_FILES: &[(&str, &str)] = &[
    ("Cargo.toml.hbs", "Cargo.toml"),
    // Shipped so a generated app resolves the graph it was tested against
    // rather than the crates.io index of the day.
    ("Cargo.lock.hbs", "Cargo.lock"),
    (".cargo/config.toml.hbs", ".cargo/config.toml"),
    // The scaffold writes no `.env.example`, and both the README and the CLI's
    // "next steps" told the developer to copy a file that was never there.
    (".env.example.hbs", ".env.example"),
    ("Dockerfile.hbs", "Dockerfile"),
    ("config/development.yaml.hbs", "config/development.yaml"),
    ("config/test.yaml.hbs", "config/test.yaml"),
    ("config/production.yaml.hbs", "config/production.yaml"),
    ("migration/Cargo.toml.hbs", "migration/Cargo.toml"),
    ("migration/src/lib.rs.hbs", "migration/src/lib.rs"),
    (
        "migration/src/m0000_auth_users.rs.hbs",
        "migration/src/m0000_auth_users.rs",
    ),
    (
        "migration/src/m0001_sys_tables.rs.hbs",
        "migration/src/m0001_sys_tables.rs",
    ),
    (
        "migration/src/m0002_bus_tables.rs.hbs",
        "migration/src/m0002_bus_tables.rs",
    ),
    (
        "migration/src/m0003_workflow_support.rs.hbs",
        "migration/src/m0003_workflow_support.rs",
    ),
    (
        "migration/src/m0004_workflow_definitions.rs.hbs",
        "migration/src/m0004_workflow_definitions.rs",
    ),
    (
        "migration/src/m0005_sys_category.rs.hbs",
        "migration/src/m0005_sys_category.rs",
    ),
    (
        "migration/src/m0006_audit_log.rs.hbs",
        "migration/src/m0006_audit_log.rs",
    ),
    (
        "migration/src/m0007_audit_hash_chain.rs.hbs",
        "migration/src/m0007_audit_hash_chain.rs",
    ),
    (
        "migration/src/m0008_model_managed_workflows.rs.hbs",
        "migration/src/m0008_model_managed_workflows.rs",
    ),
    (
        "migration/src/m0009_sys_access_control.rs.hbs",
        "migration/src/m0009_sys_access_control.rs",
    ),
    (
        "migration/src/m0010_dictionary_role_scope.rs.hbs",
        "migration/src/m0010_dictionary_role_scope.rs",
    ),
    (
        "migration/src/m0011_sys_report_designs.rs.hbs",
        "migration/src/m0011_sys_report_designs.rs",
    ),
    (
        "migration/src/m0012_sys_note.rs.hbs",
        "migration/src/m0012_sys_note.rs",
    ),
    (
        "migration/src/m0013_workflow_definition_source.rs.hbs",
        "migration/src/m0013_workflow_definition_source.rs",
    ),
    (
        "migration/src/m0014_sys_system.rs.hbs",
        "migration/src/m0014_sys_system.rs",
    ),
    (
        "migration/src/m0015_sys_report.rs.hbs",
        "migration/src/m0015_sys_report.rs",
    ),
    (
        "migration/src/m0016_sys_window_icon.rs.hbs",
        "migration/src/m0016_sys_window_icon.rs",
    ),
    (
        "migration/src/m0017_workflow_definition_yaml.rs.hbs",
        "migration/src/m0017_workflow_definition_yaml.rs",
    ),
    (
        "migration/src/m0018_sys_column_ref_table.rs.hbs",
        "migration/src/m0018_sys_column_ref_table.rs",
    ),
    (
        "migration/src/m0019_sys_column_narrowed_by.rs.hbs",
        "migration/src/m0019_sys_column_narrowed_by.rs",
    ),
    (
        "migration/src/m0020_workflow_states_and_concurrency.rs.hbs",
        "migration/src/m0020_workflow_states_and_concurrency.rs",
    ),
    ("src/lib.rs.hbs", "src/lib.rs"),
    ("src/bin/main.rs.hbs", "src/bin/main.rs"),
    ("src/app.rs.hbs", "src/app.rs"),
    ("src/errors.rs.hbs", "src/errors.rs"),
    ("src/openapi.rs.hbs", "src/openapi.rs"),
    ("src/controllers/mod.rs.hbs", "src/controllers/mod.rs"),
    ("src/controllers/auth.rs.hbs", "src/controllers/auth.rs"),
    ("src/controllers/bus.rs.hbs", "src/controllers/bus.rs"),
    ("src/controllers/sys.rs.hbs", "src/controllers/sys.rs"),
    ("src/controllers/audit.rs.hbs", "src/controllers/audit.rs"),
    (
        "src/controllers/electric.rs.hbs",
        "src/controllers/electric.rs",
    ),
    (
        "src/controllers/workflow.rs.hbs",
        "src/controllers/workflow.rs",
    ),
    ("src/controllers/me.rs.hbs", "src/controllers/me.rs"),
    ("src/controllers/jobs.rs.hbs", "src/controllers/jobs.rs"),
    (
        "src/controllers/records.rs.hbs",
        "src/controllers/records.rs",
    ),
    ("src/controllers/report.rs.hbs", "src/controllers/report.rs"),
    ("src/controllers/rules.rs.hbs", "src/controllers/rules.rs"),
    ("src/controllers/ai.rs.hbs", "src/controllers/ai.rs"),
    ("src/services/mod.rs.hbs", "src/services/mod.rs"),
    (
        "src/services/dictionary.rs.hbs",
        "src/services/dictionary.rs",
    ),
    (
        "src/services/dynamic_repo.rs.hbs",
        "src/services/dynamic_repo.rs",
    ),
    ("src/services/row_json.rs.hbs", "src/services/row_json.rs"),
    (
        "src/services/field_meta.rs.hbs",
        "src/services/field_meta.rs",
    ),
    (
        "src/services/rules_engine.rs.hbs",
        "src/services/rules_engine.rs",
    ),
    ("src/common/http_log.rs.hbs", "src/common/http_log.rs"),
    ("src/common/rate_limit.rs.hbs", "src/common/rate_limit.rs"),
    (
        "src/services/system_config.rs.hbs",
        "src/services/system_config.rs",
    ),
    ("src/services/audit.rs.hbs", "src/services/audit.rs"),
    (
        "src/services/concurrency.rs.hbs",
        "src/services/concurrency.rs",
    ),
    ("src/services/authz.rs.hbs", "src/services/authz.rs"),
    ("src/services/nl_query.rs.hbs", "src/services/nl_query.rs"),
    ("src/services/promotion.rs.hbs", "src/services/promotion.rs"),
    ("src/services/workflow.rs.hbs", "src/services/workflow.rs"),
    ("src/models/mod.rs.hbs", "src/models/mod.rs"),
    (
        "src/models/_entities/mod.rs.hbs",
        "src/models/_entities/mod.rs",
    ),
    (
        "src/models/_entities/users.rs.hbs",
        "src/models/_entities/users.rs",
    ),
    ("src/models/users.rs.hbs", "src/models/users.rs"),
    ("src/tasks/mod.rs.hbs", "src/tasks/mod.rs"),
    (
        "src/tasks/seed_dictionary.rs.hbs",
        "src/tasks/seed_dictionary.rs",
    ),
    ("src/tasks/seed_rules.rs.hbs", "src/tasks/seed_rules.rs"),
    ("src/tasks/seed_system.rs.hbs", "src/tasks/seed_system.rs"),
    (
        "src/tasks/seed_business.rs.hbs",
        "src/tasks/seed_business.rs",
    ),
    ("src/tasks/seed_reports.rs.hbs", "src/tasks/seed_reports.rs"),
    (
        "src/tasks/seed_workflows.rs.hbs",
        "src/tasks/seed_workflows.rs",
    ),
    ("src/tasks/seed_access.rs.hbs", "src/tasks/seed_access.rs"),
    ("src/tasks/ensure_admin.rs.hbs", "src/tasks/ensure_admin.rs"),
    ("src/workers/mod.rs.hbs", "src/workers/mod.rs"),
    ("src/workers/email.rs.hbs", "src/workers/email.rs"),
    ("src/workers/report.rs.hbs", "src/workers/report.rs"),
    ("src/workers/sync.rs.hbs", "src/workers/sync.rs"),
    // Integration tests: one cargo test binary (`tests/app.rs`) with shared
    // `support` and `requests` modules.
    ("tests/app.rs.hbs", "tests/app.rs"),
    ("tests/support/mod.rs.hbs", "tests/support/mod.rs"),
    ("tests/support/entities.rs.hbs", "tests/support/entities.rs"),
    ("tests/support/factory.rs.hbs", "tests/support/factory.rs"),
    ("tests/requests/mod.rs.hbs", "tests/requests/mod.rs"),
    ("tests/requests/health.rs.hbs", "tests/requests/health.rs"),
    ("tests/requests/auth.rs.hbs", "tests/requests/auth.rs"),
    (
        "tests/requests/dictionary.rs.hbs",
        "tests/requests/dictionary.rs",
    ),
    ("tests/requests/openapi.rs.hbs", "tests/requests/openapi.rs"),
    (
        "tests/requests/model_rules.rs.hbs",
        "tests/requests/model_rules.rs",
    ),
    (
        "tests/requests/model_transitions.rs.hbs",
        "tests/requests/model_transitions.rs",
    ),
    (
        "tests/requests/concurrency.rs.hbs",
        "tests/requests/concurrency.rs",
    ),
    (
        "tests/requests/permissions.rs.hbs",
        "tests/requests/permissions.rs",
    ),
    (
        "tests/requests/rate_limit.rs.hbs",
        "tests/requests/rate_limit.rs",
    ),
    ("tests/requests/ai.rs.hbs", "tests/requests/ai.rs"),
    ("tests/requests/jobs.rs.hbs", "tests/requests/jobs.rs"),
    ("tests/requests/records.rs.hbs", "tests/requests/records.rs"),
    ("tests/requests/rbac.rs.hbs", "tests/requests/rbac.rs"),
    (
        "tests/requests/workflow.rs.hbs",
        "tests/requests/workflow.rs",
    ),
    (
        "tests/requests/rules_workflow.rs.hbs",
        "tests/requests/rules_workflow.rs",
    ),
    (
        "tests/requests/saga_execution.rs.hbs",
        "tests/requests/saga_execution.rs",
    ),
    (
        "tests/requests/http_log.rs.hbs",
        "tests/requests/http_log.rs",
    ),
    (
        "tests/requests/system_config.rs.hbs",
        "tests/requests/system_config.rs",
    ),
    ("tests/requests/reports.rs.hbs", "tests/requests/reports.rs"),
];

/// Created up front so template writes never race on a missing parent.
///
/// `src/initializers` used to be here and never received a file: no template
/// targets it and `src/lib.rs` does not declare the module, so every generated
/// project carried an empty directory that looked like something was missing.
const DIRECTORIES: &[&str] = &[
    ".cargo",
    "config",
    "seed",
    "migration/src",
    "migration/sql",
    "src/bin",
    // The event catalogue and the request log live here. Listed rather than
    // left to the writer that creates it: `RENDERED_FILES` writes into it
    // first, and a directory created afterwards only works on an output that
    // already exists.
    "src/common",
    "src/controllers",
    "src/services",
    "src/models/_entities",
    "src/tasks",
    "src/workers",
    "tests/requests",
    "tests/support",
];

/// What one overlay run wrote, for the caller to report.
#[derive(Debug, Default, Clone, Copy)]
pub struct Emitted {
    pub rendered: usize,
    pub copied_sql: usize,
    pub entity_suites: usize,
    pub bus_entities: usize,
}

/// Write `seed/dictionary.sql`.
///
/// Not optional and not cosmetic. `src/tasks/seed_dictionary.rs` embeds this
/// file with `include_str!`, so the crate does not compile without it — and
/// without the rows it carries every `/api/bus/*` route 404s, because the
/// dictionary is what tells the generic controller which tables exist.
///
/// Entity names are translated to physical `bus_*` table names here, because
/// `sys_table` is matched on `table_name`. The match is case-insensitive: a
/// model may write `Compound` as the entity and `compound` in a category's
/// directive.
pub fn write_dictionary_seed(
    output_dir: &Path,
    project_name: &str,
    entities: &[BusEntity],
    categories: &[Category],
    model_enums: &[ModelEnum],
) -> Result<()> {
    let table_by_name: HashMap<String, String> = entities
        .iter()
        .map(|entity| (entity.name.to_lowercase(), entity.table_name.clone()))
        .collect();

    let resolved: Vec<CategorySeed> = categories
        .iter()
        .map(|category| CategorySeed {
            name: category.name.clone(),
            code: category.code.clone(),
            description: category.description.clone(),
            icon: category.icon.clone(),
            color: category.color.clone(),
            seq_no: category.seq_no,
            is_default: category.is_default,
            tables: category
                .entities
                .iter()
                .filter_map(|name| table_by_name.get(&name.to_lowercase()).cloned())
                .collect(),
        })
        .collect();

    let sql = build_dictionary_seed_sql(&DictionarySeedOptions {
        project_name,
        entities,
        categories: &resolved,
        model_enums,
        created_by: "system",
    });
    write_file(&output_dir.join("seed/dictionary.sql"), &sql)
}

/// Write `seed/workflows.sql` — the model's `kind: saga` workflows as BPMN.
///
/// Always written, even with no sagas, so `cargo loco db seed` has a stable file
/// to apply and a model that removes its last saga does not leave the previous
/// generation's file behind. Embedded with `include_str!` for the same reason as
/// the dictionary.
pub fn write_workflow_seed(
    output_dir: &Path,
    project_name: &str,
    sagas: &[SagaWorkflow],
) -> Result<()> {
    let sql = build_workflow_seed_sql(sagas, project_name);
    write_file(&output_dir.join("seed/workflows.sql"), &sql)
}

/// Write `seed/rules.sql` — the decision graphs the model's `rules` compile to.
///
/// Always written, for the same reason every other seed is: `seed_rules.rs`
/// embeds it with `include_str!`, resolved at compile time.
pub fn write_rules_seed(
    output_dir: &Path,
    project_name: &str,
    rules: &[CompiledRule],
) -> Result<()> {
    let sql = build_rules_seed_sql(&RulesSeedOptions {
        project_name,
        rules,
        created_by: "system",
    });
    write_file(&output_dir.join("seed/rules.sql"), &sql)
}

/// Physical table name → its column names.
///
/// Shared by the transitions and access seeds so both resolve each machine's
/// status column the same way. A rule naming a different column from the edge
/// it guards is inert.
pub fn columns_by_table(entities: &[BusEntity]) -> HashMap<String, Vec<String>> {
    entities
        .iter()
        .map(|entity| {
            (
                entity.table_name.clone(),
                entity
                    .attributes
                    .iter()
                    .map(|attribute| attribute.column_name.clone())
                    .collect(),
            )
        })
        .collect()
}

/// Write `seed/transitions.sql` — the moves the model's state machines draw.
///
/// Always written, for the same reason every other seed is: `seed_workflows.rs`
/// embeds it with `include_str!`, resolved at compile time.
pub fn write_transitions_seed(
    output_dir: &Path,
    project_name: &str,
    workflows: &[CompiledWorkflow],
    entities: &[BusEntity],
) -> Result<()> {
    let sql = build_transitions_seed_sql(&TransitionsSeedOptions {
        project_name,
        workflows,
        columns_by_table: &columns_by_table(entities),
    });
    write_file(&output_dir.join("seed/transitions.sql"), &sql)
}

/// Write `src/common/logging.rs` — the event catalogue, as a macro.
///
/// Derived from the canonical log specification rather than rendered from a
/// template: a template would be a second copy of the catalogue, and two
/// copies of a catalogue drift.
pub fn write_logging_module(output_dir: &Path, project_name: &str) -> Result<()> {
    // Resolved from the working directory, the same way the language definition
    // is: the generator is run from somewhere inside the checkout.
    let start = std::env::current_dir().context("resolving the working directory")?;
    let module = build_generated_logging_module(project_name, &start)?;
    write_file(&output_dir.join("src/common/mod.rs"), COMMON_MOD_RS)?;
    write_file(&output_dir.join("src/common/logging.rs"), &module)
}

/// Write `seed/business.sql` — demonstration records for the model's entities.
///
/// Always written, for the same reason every other seed is: `src/tasks/seed_business.rs`
/// embeds it with `include_str!`, resolved at compile time.
pub fn write_business_seed(
    output_dir: &Path,
    project_name: &str,
    entities: &[BusEntity],
    relationships: &[crate::model::Relationship],
    workflows: &[CompiledWorkflow],
    model_enums: &[ModelEnum],
) -> Result<()> {
    let sql = build_business_seed_sql(&BusinessSeedOptions {
        project_name,
        entities,
        relationships,
        workflows,
        model_enums,
        rows_per_entity: DEMONSTRATION_ROWS,
    });
    write_file(&output_dir.join("seed/business.sql"), &sql)
}

/// Write `seed/reports.sql` — the questions the model's `reports` declared.
///
/// Always written, for the same reason every other seed is:
/// `src/tasks/seed_reports.rs` embeds it with `include_str!`, resolved at
/// compile time, so a model declaring no reports still needs the file.
pub fn write_reports_seed(
    output_dir: &Path,
    project_name: &str,
    reports: &[CompiledReport],
    table_for_entity: &HashMap<String, String>,
) -> Result<()> {
    let sql = build_reports_seed_sql(&ReportsSeedOptions {
        project_name,
        reports,
        table_for_entity,
    });
    write_file(&output_dir.join("seed/reports.sql"), &sql)
}

/// Write `seed/system.sql` — the settings an operator may change at run time.
///
/// Always written, for the same reason every other seed is: `src/tasks/seed_system.rs`
/// embeds it with `include_str!`, resolved at compile time.
pub fn write_system_seed(
    output_dir: &Path,
    project_name: &str,
    project_description: &str,
) -> Result<()> {
    let sql = build_system_seed_sql(&SystemSeedOptions {
        project_name,
        project_description,
        created_by: "system",
    });
    write_file(&output_dir.join("seed/system.sql"), &sql)
}

/// Write `seed/access.sql` — the roles and restrictions the model's access rules declared.
///
/// Always written, even for a model with no access rules, and that is not
/// tidiness: `src/tasks/seed_access.rs` embeds it with `include_str!`, which is
/// resolved at compile time. A generator that skipped the file would produce a
/// backend that does not compile, and the parity gate could not see it — both
/// generators would skip it and still match.
pub fn write_access_seed(
    output_dir: &Path,
    project_name: &str,
    rbac: &CompiledRbac,
    entities: &[BusEntity],
) -> Result<()> {
    let sql = build_access_seed_sql(&AccessSeedOptions {
        project_name,
        rbac,
        columns_by_table: &columns_by_table(entities),
        entities,
        created_by: "system",
    });
    write_file(&output_dir.join("seed/access.sql"), &sql)
}

/// `src/hooks/` — the lifecycle handlers the model's `hooks` declare.
///
/// Two kinds of file, and the difference is the point:
///
/// - `handlers/<entity>.rs` holds the bodies, so it is written **once** and
///   never rewritten. Regenerating a project must not delete an implementation
///   someone wrote; a hook added to the model later is appended as a new stub.
/// - `mod.rs` and `handlers/mod.rs` are pure wiring and are rewritten every
///   run, so a newly declared hook is always picked up.
///
/// Both wiring files are written even for a model with no hooks: `lib.rs`
/// declares `pub mod hooks;` and the bus controller calls the dispatchers
/// unconditionally, so a missing module is a crate that does not compile — the
/// same trap as a conditionally emitted seed behind an `include_str!`.
pub fn write_hook_handlers(output_dir: &Path, hooks: &[CompiledHook]) -> Result<usize> {
    let grouped = hooks_by_entity(hooks);
    let entities: Vec<String> = grouped.keys().cloned().collect();

    let handlers_dir = output_dir.join("src/hooks/handlers");
    std::fs::create_dir_all(&handlers_dir)
        .with_context(|| format!("creating {}", handlers_dir.display()))?;

    for entity in &entities {
        let for_entity = grouped.get(entity).map(Vec::as_slice).unwrap_or(&[]);
        let file = handlers_dir.join(format!("{}.rs", handler_module(entity)));

        match std::fs::read_to_string(&file) {
            // Already there, and it may carry real implementations.
            Ok(existing) => {
                if let Some(appended) = append_missing_handlers(entity, for_entity, &existing) {
                    write_file(&file, &appended)?;
                }
            }
            // No handler module yet — write the stubs.
            Err(_) => write_file(&file, &build_hook_handler_module(entity, for_entity))?,
        }
    }

    write_file(
        &handlers_dir.join("mod.rs"),
        &build_hook_handlers_mod(&entities),
    )?;
    write_file(
        &output_dir.join("src/hooks/mod.rs"),
        &build_hook_registry(hooks),
    )?;

    Ok(entities.len())
}

/// Locate `packages/generator/templates`.
///
/// `TEMPLATE_DIR` wins, then a walk up from the working directory and from this
/// crate's own location — the latter is what makes `cargo run` out of the
/// workspace find them without any configuration.
pub fn template_root() -> Result<PathBuf> {
    if let Ok(configured) = std::env::var("TEMPLATE_DIR") {
        let path = PathBuf::from(configured);
        if path.is_dir() {
            return Ok(path);
        }
    }

    let mut starts: Vec<PathBuf> = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        starts.push(cwd);
    }
    starts.push(PathBuf::from(env!("CARGO_MANIFEST_DIR")));
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            starts.push(dir.to_path_buf());
        }
    }

    for start in &starts {
        if let Some(found) = walk_up_for(start, "packages/generator/templates") {
            return Ok(found);
        }
    }

    Err(anyhow!(
        "could not find packages/generator/templates.\n  \
         Set TEMPLATE_DIR to the templates directory, or run from inside the repository."
    ))
}

/// Overlay the backend templates onto an already-scaffolded (or empty) crate.
pub fn emit(output_dir: &Path, context: &BackendContext, quiet: bool) -> Result<Emitted> {
    let template_root = template_root()?;
    let backend_templates = template_root.join("tanstack-astryx-loco/backend");
    if !backend_templates.is_dir() {
        return Err(anyhow!(
            "template directory {} does not exist",
            backend_templates.display()
        ));
    }

    let hb = templates::registry();
    let value = context.to_value();

    for dir in DIRECTORIES {
        let path = output_dir.join(dir);
        std::fs::create_dir_all(&path).with_context(|| format!("creating {}", path.display()))?;
    }

    let mut emitted = Emitted::default();

    for (template, out) in RENDERED_FILES {
        let rendered = templates::render_file(&hb, &backend_templates.join(template), &value)?;
        write_file(&output_dir.join(out), &rendered)?;
        emitted.rendered += 1;
    }
    if !quiet {
        println!("  ✓ Rendered {} backend files", emitted.rendered);
    }

    emitted.copied_sql = copy_migration_sql(&backend_templates, output_dir)?;
    if !quiet {
        println!("  ✓ Copied {} sys_* DDL files verbatim", emitted.copied_sql);
    }

    emitted.entity_suites = write_per_entity_tests(
        &hb,
        &backend_templates,
        output_dir,
        &value,
        &context.entities,
    )?;

    emitted.bus_entities = write_bus_entities(
        &hb,
        &backend_templates,
        output_dir,
        &value,
        &context.entities,
    )?;
    if !quiet {
        println!(
            "  ✓ src/models/_entities/ — {} bus entity(ies)",
            emitted.bus_entities
        );
    }
    if !quiet {
        // Counted from `RENDERED_FILES`, not a literal. It read `+ 6` while
        // seven fixed suites are rendered, so every run reported one fewer
        // suite than it wrote.
        let fixed_suites = RENDERED_FILES
            .iter()
            .filter(|(_, out)| {
                out.starts_with("tests/requests/") && *out != "tests/requests/mod.rs"
            })
            .count();
        println!(
            "  ✓ tests/ — {} request suites",
            emitted.entity_suites + fixed_suites
        );
    }

    Ok(emitted)
}

fn write_file(path: &Path, contents: &str) -> Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .with_context(|| format!("creating {}", parent.display()))?;
    }
    std::fs::write(path, contents).with_context(|| format!("writing {}", path.display()))
}

/// Copy the hand-maintained `sys_*` DDL across untouched.
///
/// Rendering it would be wrong twice over: it contains no Handlebars, and SQL
/// that happens to contain `{{` would be silently rewritten.
fn copy_migration_sql(backend_templates: &Path, output_dir: &Path) -> Result<usize> {
    let source = backend_templates.join("migration/sql");
    let target = output_dir.join("migration/sql");
    std::fs::create_dir_all(&target).with_context(|| format!("creating {}", target.display()))?;

    let mut copied = 0;
    let entries =
        std::fs::read_dir(&source).with_context(|| format!("reading {}", source.display()))?;
    for entry in entries {
        let entry = entry?;
        let name = entry.file_name();
        if Path::new(&name).extension().and_then(|e| e.to_str()) != Some("sql") {
            continue;
        }
        std::fs::copy(entry.path(), target.join(&name))
            .with_context(|| format!("copying {}", entry.path().display()))?;
        copied += 1;
    }
    Ok(copied)
}

/// One CRUD module and one rules module per entity.
///
/// Per entity rather than one big suite so a failure names the entity that
/// broke, and so adding an entity to the model adds its tests without anyone
/// writing one.
fn write_per_entity_tests(
    hb: &Handlebars<'static>,
    backend_templates: &Path,
    output_dir: &Path,
    base: &Value,
    entities: &[BusEntity],
) -> Result<usize> {
    let crud_template = backend_templates.join("tests/requests/crud_entity.rs.hbs");
    let rules_template = backend_templates.join("tests/requests/rules_entity.rs.hbs");
    let requests_dir = output_dir.join("tests/requests");

    let mut written = 0;
    for entity in entities {
        // `entity` shadows nothing in the base context — the shared templates
        // read `{{entity.…}}` while the whole-model ones read `{{entities}}`.
        let mut scoped = base.clone();
        scoped["entity"] = serde_json::to_value(entity)?;

        let slug = entity.slug();
        let crud = templates::render_file(hb, &crud_template, &scoped)?;
        write_file(&requests_dir.join(format!("crud_{slug}.rs")), &crud)?;

        let rules = templates::render_file(hb, &rules_template, &scoped)?;
        write_file(&requests_dir.join(format!("rules_{slug}.rs")), &rules)?;

        written += 2;
    }
    Ok(written)
}

/// One SeaORM entity per business table, under `src/models/_entities/`.
///
/// Rewritten every run, unlike `src/hooks/handlers/`: nothing in these files is
/// the developer's, they are derived from the model, and an entity describing a
/// column the ERD no longer has is worse than no entity at all.
///
/// The file, the module and the `table_name` attribute are all the table's own
/// name — `bus_customer` three times — so there is no convention to keep in
/// sync. See decision D9 in docs/MIGRATION-LOCO-ASTRYX.md for why these exist
/// alongside `DynamicRepo` rather than instead of it.
fn write_bus_entities(
    hb: &Handlebars<'static>,
    backend_templates: &Path,
    output_dir: &Path,
    base: &Value,
    entities: &[BusEntity],
) -> Result<usize> {
    let template = backend_templates.join("src/models/_entities/bus_entity.rs.hbs");
    let entities_dir = output_dir.join("src/models/_entities");

    let mut written = 0;
    for entity in entities {
        let mut scoped = base.clone();
        scoped["entity"] = serde_json::to_value(entity)?;

        let rendered = templates::render_file(hb, &template, &scoped)?;
        write_file(
            &entities_dir.join(format!("{}.rs", entity.table_name)),
            &rendered,
        )?;
        written += 1;
    }
    Ok(written)
}

/// Run `cargo fmt` over the generated crate.
///
/// Best-effort and never fatal: Handlebars block helpers leave whitespace that
/// rustfmt cares about and that nobody should be hand-tuning inside a template,
/// but unformatted Rust still compiles.
pub fn format_sources(output_dir: &Path, quiet: bool) {
    if !crate::scaffold::is_available("cargo") {
        if !quiet {
            println!("  Cargo not found — skipping `cargo fmt` on the generated sources");
        }
        return;
    }
    match Command::new("cargo")
        .arg("fmt")
        .current_dir(output_dir)
        .status()
    {
        Ok(status) if status.success() => {
            if !quiet {
                println!("  ✓ Formatted Rust sources with cargo fmt");
            }
        }
        Ok(status) => {
            if !quiet {
                println!("  ⚠️  cargo fmt skipped: exited with {status}");
            }
        }
        Err(error) => {
            if !quiet {
                println!("  ⚠️  cargo fmt skipped: {error}");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::category::{resolve_category_declarations, Category};
    use crate::context::ContextOptions;
    use crate::language::Language;
    use crate::model::{compile_erd, Model};
    use crate::yaml_model::test_records;

    /// The model this generator is validated against, compiled.
    fn drug_discovery() -> (Model, Vec<Category>) {
        let source = std::fs::read_to_string(
            Path::new(env!("CARGO_MANIFEST_DIR")).join("../../examples/drug-discovery.eml.yaml"),
        )
        .expect("the model this generator is validated against");
        let records = test_records(&source);
        let model = compile_erd(
            &records.erd,
            &Language::load().expect("language definition"),
        );
        let names: Vec<String> = model.entities.iter().map(|e| e.name.clone()).collect();
        let categories = resolve_category_declarations(&records.categories, &names);
        (model, categories)
    }

    fn drug_discovery_context() -> BackendContext {
        let (model, categories) = drug_discovery();
        BackendContext::build(
            &model,
            &categories,
            &ContextOptions {
                project_name: "drug-discovery",
                project_version: "1.0.0",
                project_description: "Generated application",
                port: 3000,
                frontend_port: 3001,
                cors_origin: "http://localhost:3001",
                database: crate::context::DatabaseTarget::Postgres,
                rbac: &CompiledRbac::default(),
                rules: &[],
                reports: &[],
                workflows: &[],
            },
        )
    }

    #[test]
    fn every_rendered_template_exists_on_disk() {
        let backend = template_root()
            .unwrap()
            .join("tanstack-astryx-loco/backend");
        for (template, _) in RENDERED_FILES {
            assert!(
                backend.join(template).is_file(),
                "RENDERED_FILES names {template}, which is not in the template tree"
            );
        }
        for per_entity in [
            "tests/requests/crud_entity.rs.hbs",
            "tests/requests/rules_entity.rs.hbs",
        ] {
            assert!(backend.join(per_entity).is_file(), "missing {per_entity}");
        }
    }

    #[test]
    fn no_output_path_is_claimed_twice() {
        let mut seen = std::collections::HashSet::new();
        for (_, out) in RENDERED_FILES {
            assert!(seen.insert(*out), "{out} is written by two templates");
        }
    }

    #[test]
    fn the_whole_backend_renders_for_drug_discovery() {
        let dir = tempfile::tempdir().unwrap();
        let context = drug_discovery_context();
        let emitted = emit(dir.path(), &context, true).unwrap();

        assert_eq!(emitted.rendered, RENDERED_FILES.len());
        assert!(emitted.copied_sql > 0, "the sys_* DDL must be copied");
        // 17 entities in the model, two suites each.
        assert_eq!(emitted.entity_suites, context.entities.len() * 2);

        // Spot-check that the context actually reached the output rather than
        // rendering as empty: a strict-mode-off registry turns a missing field
        // into an empty string, which compiles to a plausible-looking wrong file.
        let cargo_toml = std::fs::read_to_string(dir.path().join("Cargo.toml")).unwrap();
        assert!(
            cargo_toml.contains("name = \"drug_discovery\""),
            "{cargo_toml}"
        );

        let dev = std::fs::read_to_string(dir.path().join("config/development.yaml")).unwrap();
        assert!(dev.contains("drug_discovery_development"), "{dev}");
        // `<%= … %>` is Loco's YAML-safe template delimiter, expanded at run
        // time. It must reach the output intact, and no legacy `{{ }}` may
        // survive: loco warns on those, and a `{` at the head of a YAML value
        // is a flow-mapping indicator, so a formatter rewrites the file into
        // something that no longer starts.
        assert!(
            dev.contains("<%= get_env("),
            "Tera tags were consumed: {dev}"
        );
        assert!(
            !dev.contains("{{"),
            "legacy YAML-unsafe delimiters survived: {dev}"
        );

        assert!(dir.path().join("tests/requests/crud_compound.rs").is_file());
        assert!(dir
            .path()
            .join("tests/requests/rules_compound.rs")
            .is_file());
        assert!(dir.path().join("migration/sql").read_dir().unwrap().count() > 0);
    }

    /// The bus-table DDL is the template that leans hardest on helpers —
    /// `switch`/`case`/`default` over `typeToReferenceId`, and `(or (eq …))` to
    /// skip the key and timestamp columns. When a helper is missing the
    /// registry does not fail: `set_strict_mode(false)` renders it as nothing,
    /// and the result is a syntactically valid `CREATE TABLE` with every
    /// business column quietly gone. That is what this pins.
    #[test]
    fn bus_table_ddl_carries_every_column() {
        let dir = tempfile::tempdir().unwrap();
        emit(dir.path(), &drug_discovery_context(), true).unwrap();
        let ddl =
            std::fs::read_to_string(dir.path().join("migration/src/m0002_bus_tables.rs")).unwrap();

        // The comment above each table carries the human label, which a helper
        // registered under the name `displayName` would shadow into "".
        assert!(ddl.contains("-- Compound (bus_compound)"), "{ddl}");

        for column in [
            "smiles VARCHAR(255) NOT NULL UNIQUE", // string + UK
            "molecular_weight DECIMAL(18,6)",      // decimal, optional
            "registered_by_id UUID NOT NULL",      // FK inside the string case
            "registration_status VARCHAR(255) NOT NULL",
        ] {
            assert!(ddl.contains(column), "missing `{column}` in:\n{ddl}");
        }

        // The primary key is emitted by the header line, so the `unless` guard
        // must keep the loop from emitting it a second time.
        assert_eq!(
            ddl.matches("CREATE TABLE IF NOT EXISTS bus_compound (")
                .count(),
            1
        );
        assert_eq!(
            ddl.lines()
                .filter(|l| l.trim_start().starts_with(", id UUID"))
                .count(),
            0,
            "the primary key was emitted twice"
        );

        // Indexes are for `name` and unique columns only. Without `or`
        // registered the guard reads truthy and every column gets one.
        assert!(ddl.contains("idx_bus_compound_smiles"), "{ddl}");
        assert!(
            !ddl.contains("idx_bus_compound_molecular_weight"),
            "a non-unique column was indexed — the `or` guard is not being applied"
        );
    }

    /// The neon target must not leave a localhost default behind.
    ///
    /// A silent fallback is the whole hazard: `DATABASE_URL` unset would migrate
    /// and seed a local database while the developer believes they are pointed
    /// at Neon. `config/*.yaml` therefore carries no default for that target,
    /// and Loco fails to render rather than connect to the wrong place.
    #[test]
    fn the_neon_target_has_no_localhost_fallback() {
        use crate::context::{ContextOptions, DatabaseTarget};

        let render = |target: DatabaseTarget| {
            let (model, categories) = drug_discovery();
            let context = BackendContext::build(
                &model,
                &categories,
                &ContextOptions {
                    project_name: "drug-discovery",
                    project_version: "1.0.0",
                    project_description: "Generated application",
                    port: 3000,
                    frontend_port: 3001,
                    cors_origin: "http://localhost:3001",
                    database: target,
                    rbac: &CompiledRbac::default(),
                    rules: &[],
                    reports: &[],
                    workflows: &[],
                },
            );
            let dir = tempfile::tempdir().unwrap();
            emit(dir.path(), &context, true).unwrap();
            (
                std::fs::read_to_string(dir.path().join("config/development.yaml")).unwrap(),
                std::fs::read_to_string(dir.path().join(".env.example")).unwrap(),
                std::fs::read_to_string(dir.path().join("Dockerfile")).unwrap(),
            )
        };

        let (pg_yaml, pg_env, pg_docker) = render(DatabaseTarget::Postgres);
        assert!(pg_yaml.contains("default=\"postgres://"), "{pg_yaml}");
        assert!(pg_env.contains("DATABASE_URL=postgres://postgres@localhost"));

        let (neon_yaml, neon_env, neon_docker) = render(DatabaseTarget::Neon);
        // Scoped to the database URI: `localhost` is correct elsewhere in this
        // file for the HTTP binding, the CORS origin and the Electric URL.
        let db_uri_line = neon_yaml
            .lines()
            .find(|line| line.trim_start().starts_with("uri:"))
            .expect("a database uri line");
        assert!(
            !db_uri_line.contains("localhost"),
            "the neon database uri still falls back to localhost: {db_uri_line}"
        );
        assert!(
            db_uri_line.contains("get_env(name=\"DATABASE_URL\")"),
            "{db_uri_line}"
        );
        assert!(neon_env.contains("sslmode=require"), "{neon_env}");

        // Everything else is the same app: Neon is Postgres.
        assert_eq!(pg_docker, neon_docker);
    }

    /// The Dockerfile has to name the real health route and the real env var.
    #[test]
    fn the_dockerfile_targets_this_backend_not_a_node_one() {
        let dir = tempfile::tempdir().unwrap();
        emit(dir.path(), &drug_discovery_context(), true).unwrap();
        let dockerfile = std::fs::read_to_string(dir.path().join("Dockerfile")).unwrap();

        assert!(
            dockerfile.contains("ENV LOCO_ENV="),
            "Loco reads LOCO_ENV, not NODE_ENV:\n{dockerfile}"
        );
        // Only the directive matters — the prose above it names NODE_ENV to say
        // what this is *not*.
        assert!(!dockerfile.contains("ENV NODE_ENV="), "{dockerfile}");
        // `/api/health` does not exist; a healthcheck on it never turns healthy.
        assert!(dockerfile.contains("/api/me/health"), "{dockerfile}");
        assert!(dockerfile.contains("drug_discovery-cli"), "{dockerfile}");
    }

    #[test]
    fn per_entity_suites_are_named_after_their_table() {
        let dir = tempfile::tempdir().unwrap();
        let context = drug_discovery_context();
        emit(dir.path(), &context, true).unwrap();

        // The module list in tests/requests/mod.rs and the files on disk have to
        // agree or the test binary does not compile.
        let module_list =
            std::fs::read_to_string(dir.path().join("tests/requests/mod.rs")).unwrap();
        for entity in &context.entities {
            let slug = entity.slug();
            assert!(
                module_list.contains(&format!("crud_{slug}")),
                "tests/requests/mod.rs does not declare crud_{slug}"
            );
            assert!(
                dir.path()
                    .join(format!("tests/requests/crud_{slug}.rs"))
                    .is_file(),
                "crud_{slug}.rs was not written"
            );
        }
    }

    /// Every business table gets an entity, and `_entities/mod.rs` declares it.
    ///
    /// A file on disk that `mod.rs` never declares is not compiled, so it fails
    /// silently — the entity simply is not there when a hook tries to use it.
    /// The reverse, a declared module with no file, at least fails loudly.
    #[test]
    fn every_bus_table_gets_a_declared_entity() {
        let dir = tempfile::tempdir().unwrap();
        let context = drug_discovery_context();
        emit(dir.path(), &context, true).unwrap();

        let module_list =
            std::fs::read_to_string(dir.path().join("src/models/_entities/mod.rs")).unwrap();

        for entity in &context.entities {
            let table = &entity.table_name;
            assert!(
                module_list.contains(&format!("pub mod {table};")),
                "_entities/mod.rs does not declare {table}"
            );

            let path = dir.path().join(format!("src/models/_entities/{table}.rs"));
            assert!(path.is_file(), "{table}.rs was not written");

            // The entity is only useful if it points at the table it is named
            // for — a `table_name` that drifts compiles and then reads the
            // wrong rows.
            let source = std::fs::read_to_string(&path).unwrap();
            assert!(
                source.contains(&format!("table_name = \"{table}\"")),
                "{table}.rs does not map to {table}"
            );
        }
    }

    /// The column types have to be the ones `m0002_bus_tables` actually creates.
    ///
    /// This is the pairing that cannot be checked by compiling the generated
    /// crate: a `Uuid` field over a `DECIMAL` column type-checks perfectly and
    /// fails at runtime on the first query. drug-discovery is the corpus model
    /// that carries a `json` column and a `decimal` foreign key, which are the
    /// two mappings most likely to be got wrong.
    #[test]
    fn entity_types_follow_the_ddl_not_the_declared_type() {
        let dir = tempfile::tempdir().unwrap();
        let context = drug_discovery_context();
        emit(dir.path(), &context, true).unwrap();

        let ddl =
            std::fs::read_to_string(dir.path().join("migration/src/m0002_bus_tables.rs")).unwrap();

        for entity in &context.entities {
            let table = &entity.table_name;
            let source = std::fs::read_to_string(
                dir.path().join(format!("src/models/_entities/{table}.rs")),
            )
            .unwrap();

            // A JSON column is `Json`, never `String`.
            if ddl.contains("JSONB") {
                // Only assert on the entity that owns the column.
                for attribute in &entity.attributes {
                    if attribute.ty.eq_ignore_ascii_case("json")
                        || attribute.ty.eq_ignore_ascii_case("jsonb")
                    {
                        let name = &attribute.name;
                        assert!(
                            source.contains(&format!("pub {name}: Json"))
                                || source.contains(&format!("pub {name}: Option<Json>")),
                            "{table}.{name} is a JSONB column but is not a Json field:\n{source}"
                        );
                    }
                }
            }

            // Timestamps are TIMESTAMPTZ, so `DateTimeWithTimeZone` — not the
            // `DateTime<Utc>` that `rustType` would hand back.
            assert!(
                !source.contains("DateTime<Utc>"),
                "{table}.rs uses DateTime<Utc>; TIMESTAMPTZ maps to DateTimeWithTimeZone"
            );
        }
    }
}
