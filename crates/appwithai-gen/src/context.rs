//! The Handlebars context the backend templates render against.
//!
//! A port of `LocoBackendGenerator.prepareContext`. Every key here is read by at
//! least one `.hbs` file; the field names are the contract and are camelCase on
//! the wire regardless of how they are spelled in Rust.
//!
//! One rule worth stating: the database name is derived here and nowhere else.
//! `config/development.yaml`, `.env.example`, the README and the CLI's own
//! `createdb` line all read it from this struct, because the three drifted apart
//! once and left the documented commands pointing at a database nothing created.

use serde::Serialize;
use serde_json::Value;

use crate::backend::columns_by_table;
use crate::bus::{declared_entity_names, entity_to_bus_entity, BusEntity};
use crate::category::Category;
use crate::model::{Model, Relationship};
use crate::rbac::{derive_access, CompiledRbac, DeriveAccessOptions, DerivedAccess};
use crate::reports::CompiledReport;
use crate::rules::CompiledRule;
use crate::workflows::{status_field_for, CompiledWorkflow};

#[derive(Debug, Clone, Serialize)]
pub struct Project {
    pub name: String,
    pub version: String,
    pub description: String,
    /// Kebab-cased, for anything that names the project in a URL or a package.
    pub id: String,
    /// Snake-cased, for the crate, its binary and the `cargo loco` alias.
    pub snake: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Config {
    pub port: u16,
    #[serde(rename = "frontendPort")]
    pub frontend_port: u16,
    #[serde(rename = "corsOrigin")]
    pub cors_origin: String,
    /// The role `config/*.yaml` puts in the default `DATABASE_URL`. Loco's own
    /// default assumes the developer's own account owns the database, which is
    /// what a local `createdb` produces.
    #[serde(rename = "dbUser")]
    pub db_user: String,
}

/// Which Postgres the generated app will connect to.
///
/// Both are Postgres and use the same driver and the same SQL — Neon is
/// Postgres. What differs is that Neon has no localhost default to fall back on
/// and requires TLS, which is all the templates branch on.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DatabaseTarget {
    Postgres,
    Neon,
}

#[derive(Debug, Clone, Serialize)]
pub struct DatabaseNames {
    /// `<crate>_development`, not `<crate>` — the default baked into
    /// `config/development.yaml`, and the one `cargo loco db migrate` needs to
    /// already exist.
    pub name: String,
    #[serde(rename = "testName")]
    pub test_name: String,
    pub target: DatabaseTarget,
    #[serde(rename = "isNeon")]
    pub is_neon: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct BackendContext {
    pub project: Project,
    pub config: Config,
    pub database: DatabaseNames,
    #[serde(rename = "projectName")]
    pub project_name: String,
    #[serde(rename = "projectSnake")]
    pub project_snake: String,
    #[serde(rename = "projectKebab")]
    pub project_kebab: String,
    pub entities: Vec<BusEntity>,
    pub relationships: Vec<Relationship>,
    pub categories: Vec<Category>,
    /// The model's own rules, for `tests/requests/model_rules.rs` to assert
    /// against. The JDM is deliberately not carried here — the seed is the only
    /// place it belongs, and a second copy in the test binary would drift.
    #[serde(rename = "compiledRules")]
    pub compiled_rules: Vec<ContextRule>,
    /// The model's state machines, for `tests/requests/model_transitions.rs`.
    ///
    /// `status_field` is resolved here rather than in the template because the
    /// seed resolves it here too — a suite asserting against a different column
    /// from the one the edge was recorded on would pass while the guard matched
    /// nothing.
    #[serde(rename = "compiledWorkflows")]
    pub compiled_workflows: Vec<ContextWorkflow>,
    /// The names of the model's `reports`, in order, for
    /// `tests/requests/reports.rs` to assert against. The query is deliberately
    /// not carried here: the seed is the only place it belongs, and a second
    /// copy compiled into the test binary would drift from the row being run.
    pub reports: Vec<ContextReport>,
    /// The roles the model's access rules named, one account per role, and how many
    /// entities each may read.
    ///
    /// Read by `src/tasks/seed_access.rs.hbs`, which cannot take them from
    /// `seed/access.sql`: a credential row needs an argon2 digest and SQL
    /// cannot produce one. Derived by the same function that writes the seed,
    /// so the accounts and the rules cannot disagree about which roles exist.
    pub access: DerivedAccess,
    pub now: String,
}

/// One rule, as the templates see it. Mirrors the object literal
/// `loco-backend.generator.ts` builds — same fields, same camelCase names.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextRule {
    pub name: String,
    pub entity: String,
    pub table_name: String,
    pub event: String,
    pub operation: String,
    pub priority: i64,
}

/// One report, as the templates see it — its name and nothing else.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextReport {
    pub name: String,
}

/// One state machine, as the templates see it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextWorkflow {
    pub name: String,
    pub entity: String,
    pub table_name: String,
    pub status_field: String,
    pub initial: String,
    pub transitions: Vec<ContextTransition>,
    pub states: Vec<ContextState>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ContextState {
    pub name: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ContextTransition {
    pub from: String,
    pub to: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger: Option<String>,
}

pub struct ContextOptions<'a> {
    pub project_name: &'a str,
    pub project_version: &'a str,
    pub project_description: &'a str,
    pub port: u16,
    pub frontend_port: u16,
    pub cors_origin: &'a str,
    pub database: DatabaseTarget,
    /// The model's access rules, compiled. `CompiledRbac::default()` for a model declaring none.
    pub rbac: &'a CompiledRbac,
    /// The model's `rules`, compiled. Empty for a model declaring none.
    pub rules: &'a [CompiledRule],
    /// The model's `stateMachines`, compiled. Empty for a model declaring none.
    pub workflows: &'a [CompiledWorkflow],
    /// The model's `reports`, compiled. Empty for a model declaring none.
    pub reports: &'a [CompiledReport],
}

impl BackendContext {
    pub fn build(model: &Model, categories: &[Category], options: &ContextOptions<'_>) -> Self {
        let project_snake = squash(options.project_name, '_');
        let project_kebab = squash(options.project_name, '-');
        // Captured before the struct literal moves `project_kebab` into it.
        let project_kebab_for_access = project_kebab.clone();
        let entity_names: Vec<String> = model
            .entities
            .iter()
            .map(|entity| entity.name.clone())
            .collect();
        // Built once: the struct literal below moves it into `entities`, and
        // the status-column lookup needs it first.
        let bus_entities: Vec<BusEntity> = {
            let declared = declared_entity_names(&model.entities);
            model
                .entities
                .iter()
                .map(|entity| entity_to_bus_entity(entity, &declared))
                .collect()
        };
        let columns = columns_by_table(&bus_entities);

        BackendContext {
            project: Project {
                name: options.project_name.to_string(),
                version: options.project_version.to_string(),
                description: options.project_description.to_string(),
                id: project_kebab.clone(),
                snake: project_snake.clone(),
            },
            config: Config {
                port: options.port,
                frontend_port: options.frontend_port,
                cors_origin: options.cors_origin.to_string(),
                db_user: std::env::var("USER")
                    .or_else(|_| std::env::var("USERNAME"))
                    .unwrap_or_else(|_| "postgres".to_string()),
            },
            database: DatabaseNames {
                name: format!("{project_snake}_development"),
                test_name: format!("{project_snake}_test"),
                target: options.database,
                is_neon: options.database == DatabaseTarget::Neon,
            },
            project_name: options.project_name.to_string(),
            project_snake,
            project_kebab,
            entities: bus_entities,
            relationships: model.relationships.clone(),
            categories: categories.to_vec(),
            reports: options
                .reports
                .iter()
                .map(|report| ContextReport {
                    name: report.name.clone(),
                })
                .collect(),
            compiled_rules: options
                .rules
                .iter()
                .map(|rule| ContextRule {
                    name: rule.name.clone(),
                    entity: rule.entity.clone(),
                    table_name: rule.table_name.clone(),
                    event: rule.event.clone(),
                    operation: rule.operation.clone(),
                    priority: rule.priority,
                })
                .collect(),
            compiled_workflows: {
                options
                    .workflows
                    .iter()
                    .map(|workflow| ContextWorkflow {
                        name: workflow.name.clone(),
                        entity: workflow.entity.clone(),
                        table_name: workflow.table_name.clone(),
                        status_field: status_field_for(&workflow.table_name, &columns),
                        initial: workflow.initial.clone().unwrap_or_default(),
                        transitions: workflow
                            .transitions
                            .iter()
                            .map(|transition| ContextTransition {
                                from: transition.from.clone(),
                                to: transition.to.clone(),
                                trigger: transition.trigger.clone(),
                            })
                            .collect(),
                        states: workflow
                            .states
                            .iter()
                            .map(|state| ContextState {
                                name: state.name.clone(),
                            })
                            .collect(),
                    })
                    .collect()
            },
            access: derive_access(
                options.rbac,
                &DeriveAccessOptions {
                    project_id: &project_kebab_for_access,
                    entities: &entity_names,
                    admin_email: None,
                    admin_name: None,
                },
            ),
            now: chrono::Utc::now().to_rfc3339(),
        }
    }

    pub fn to_value(&self) -> Value {
        // Infallible in practice: every field is a plain owned value with a
        // derived `Serialize`, and none of them can fail to encode.
        serde_json::to_value(self).expect("backend context is plain data")
    }
}

/// Lowercase, with every run of non-alphanumerics collapsed to one separator.
fn squash(name: &str, separator: char) -> String {
    let mut out = String::with_capacity(name.len());
    let mut prev_separator = false;
    for ch in name.to_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch);
            prev_separator = false;
        } else if !prev_separator {
            out.push(separator);
            prev_separator = true;
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::yaml_model::test_model;

    fn context() -> BackendContext {
        let model = test_model(
            r#"eml: "1.0"
entities:
  - name: Compound
    attributes:
      - name: id
        type: string
        pk: true
      - name: smiles
        type: string
        unique: true
"#,
        );
        BackendContext::build(
            &model,
            &[],
            &ContextOptions {
                project_name: "drug-discovery",
                project_version: "1.0.0",
                project_description: "Generated application",
                port: 3000,
                frontend_port: 3001,
                cors_origin: "http://localhost:3001",
                database: DatabaseTarget::Postgres,
                rbac: &CompiledRbac::default(),
                rules: &[],
                reports: &[],
                workflows: &[],
            },
        )
    }

    #[test]
    fn database_names_follow_the_crate() {
        let ctx = context();
        assert_eq!(ctx.project_snake, "drug_discovery");
        assert_eq!(ctx.project_kebab, "drug-discovery");
        assert_eq!(ctx.database.name, "drug_discovery_development");
        assert_eq!(ctx.database.test_name, "drug_discovery_test");
    }

    #[test]
    fn entities_arrive_as_bus_entities() {
        let value = context().to_value();
        let entity = &value["entities"][0];
        assert_eq!(entity["tableName"], "bus_compound");
        assert_eq!(entity["displayName"], "Compound");
        assert_eq!(entity["attributes"][0]["columnName"], "id");
        assert_eq!(entity["attributes"][0]["referenceId"], 13);
        assert_eq!(entity["attributes"][0]["seqNo"], 10);
    }

    #[test]
    fn squash_collapses_runs_rather_than_repeating_them() {
        assert_eq!(squash("Drug  Discovery--App", '_'), "drug_discovery_app");
        assert_eq!(squash("Drug  Discovery--App", '-'), "drug-discovery-app");
    }
}
