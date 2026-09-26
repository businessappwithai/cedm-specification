//! `%%rbac` directives — the Rust half of the RBAC compiler.
//!
//! A byte-for-byte port of `packages/generator/src/rbac/{index,roles}.ts` and
//! `generators/tanstack-astryx-loco/access-seed.ts`. Three things live here:
//!
//! * [`compile_rbac`] reads the directives out of a model document;
//! * [`derive_access`] turns them into the roles and demonstration accounts the
//!   generated backend seeds;
//! * [`build_access_seed_sql`] writes `seed/access.sql`.
//!
//! ## It restricts; it does not grant
//!
//! An `(entity, operation)` pair carrying no `%%rbac` directive is
//! unrestricted — anyone the session guard admits may perform it. One or more
//! directives turn that pair into a closed list. Denying by default would lock
//! every user out of every existing model on the next regeneration, and a model
//! that says nothing about permissions is one whose author has not thought
//! about them yet, not one that wants everything forbidden.
//!
//! ## Why this does not write `sys_access`
//!
//! `sys_access` is a *grant* table whose rows feed
//! `sys_refresh_dictionary_scope()`: a table with no rows there is visible to
//! every role, and the first row narrows it to that role alone. Seeding
//! `%%rbac role:admin on Order.delete` into it would hide the Order window from
//! everybody but admin — a restriction on deleting silently becoming a
//! restriction on looking. Operation rules therefore live in
//! `sys_operation_access`.

use std::collections::{BTreeMap, BTreeSet};

use crate::records::RbacDeclaration;

use serde::Serialize;
use uuid::Uuid;

use crate::bus::BusEntity;
use crate::dictionary::{insert, now, role_ref, text, Sql, NAMESPACE};

/// The CRUD operations an `%%rbac` directive may restrict.
pub const RBAC_OPERATIONS: [&str; 4] = ["create", "read", "update", "delete"];

/// One state change a transition rule covers: `from` → `to` on the status column.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RbacTransitionEdge {
    pub from: String,
    pub to: String,
}

/// One `(entity, operation)` pair and the roles permitted to perform it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledRbacRule {
    pub entity: String,
    pub table_name: String,
    pub operation: String,
    pub roles: Vec<String>,
}

/// A restriction on moving a record along a named state-machine transition.
///
/// `edges` rather than a single target state because a transition event may
/// appear more than once in a machine (two states that both `approve` into
/// `approved`). Carrying the `from` as well as the `to` keeps the rule precise.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledRbacTransition {
    pub entity: String,
    pub table_name: String,
    pub transition: String,
    pub edges: Vec<RbacTransitionEdge>,
    pub roles: Vec<String>,
}

/// Everything `%%rbac` compiles to.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct CompiledRbac {
    pub operations: Vec<CompiledRbacRule>,
    pub transitions: Vec<CompiledRbacTransition>,
}

/// The shape `compile_workflows` will produce, declared structurally so this
/// module does not depend on one that has not landed yet (Phase 7).
#[derive(Debug, Clone, Default)]
pub struct RbacStateMachine {
    pub entity: String,
    pub transitions: Vec<RbacStateEdge>,
}

#[derive(Debug, Clone, Default)]
pub struct RbacStateEdge {
    pub from: String,
    pub to: String,
    pub trigger: Option<String>,
}

/// Aliases accepted for an operation, so a model may say what it means.
///
/// `*` and `all` expand to every operation — a whole entity behind one role is
/// the common case and writing four directives for it is noise.
fn operation_alias(raw: &str) -> Option<&'static str> {
    Some(match raw.to_lowercase().as_str() {
        "*" | "all" | "any" => "*",
        "create" | "insert" | "add" => "create",
        "read" | "view" | "select" | "list" => "read",
        "update" | "edit" | "write" | "modify" => "update",
        "delete" | "remove" | "destroy" => "delete",
        _ => return None,
    })
}

/// Read the role names out of a role expression.
///
/// `role:admin`, `role:sales|manager` and `role:sales|role:manager` are all
/// accepted — the second is what the spec's example writes and the third is
/// what someone repeating the prefix naturally produces. A bare `admin` is
/// taken as a role name too, because rejecting it would fail a directive whose
/// meaning is unambiguous.
pub fn parse_role_expression(expression: &str) -> Vec<String> {
    expression
        .split('|')
        .map(|part| {
            let trimmed = part.trim();
            let stripped = if trimmed.len() >= 5 && trimmed[..5].eq_ignore_ascii_case("role:") {
                &trimmed[5..]
            } else {
                trimmed
            };
            stripped.trim().to_string()
        })
        .filter(|name| !name.is_empty())
        .collect()
}

/// `Order` → `bus_order`. Mirrors the ERD parser's table naming.
fn bus_table_name(entity: &str) -> String {
    let chars: Vec<char> = entity.chars().collect();
    let mut snake = String::new();
    for (index, ch) in chars.iter().enumerate() {
        if ch.is_ascii_uppercase() && index > 0 {
            let prev = chars[index - 1];
            let next_lower = chars.get(index + 1).is_some_and(|c| c.is_ascii_lowercase());
            // `dealLine` → `deal_Line`, and `HTTPServer` → `HTTP_Server`: a
            // boundary is either lower-then-upper, or the last capital of a run
            // that a lower-case letter follows. The two TypeScript regexes,
            // written as one condition.
            if prev.is_ascii_lowercase()
                || prev.is_ascii_digit()
                || (prev.is_ascii_uppercase() && next_lower)
            {
                snake.push('_');
            }
        }
        snake.push(ch.to_ascii_lowercase());
    }
    let snake = snake.trim_start_matches('_').to_string();
    if snake.starts_with("bus_") || snake.starts_with("sys_") {
        snake
    } else {
        format!("bus_{snake}")
    }
}

/// A directive line, split into its three parts.
///
/// The TypeScript side matches `^%%rbac\s+(\S+)\s+on\s+([A-Za-z_]\w*)\.([A-Za-z_*]\w*)\s*$`.
/// Hand-parsed here rather than pulling in a regex crate for one pattern, and
/// the acceptance set is deliberately identical — including the trailing
/// anchor, so a directive with anything after the target is malformed in both.
fn parse_directive(line: &str) -> Option<(String, String, String)> {
    let rest = line.strip_prefix("%%rbac")?;
    if !rest.starts_with(char::is_whitespace) {
        return None;
    }
    let mut parts = rest.split_whitespace();
    let role_expr = parts.next()?;
    if !parts.next()?.eq("on") {
        return None;
    }
    let target = parts.next()?;
    if parts.next().is_some() {
        return None;
    }

    let (entity, operation) = target.split_once('.')?;
    let is_ident = |value: &str, allow_star: bool| {
        let mut chars = value.chars();
        let Some(first) = chars.next() else {
            return false;
        };
        let first_ok = first.is_ascii_alphabetic() || first == '_' || (allow_star && first == '*');
        // `*` is a whole token on its own: `\w*` after `[A-Za-z_*]` still
        // requires everything that follows to be a word character, and `**`
        // would fail there too.
        first_ok && chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
    };
    if !is_ident(entity, false) || !is_ident(operation, true) {
        return None;
    }
    Some((
        role_expr.to_string(),
        entity.to_string(),
        operation.to_string(),
    ))
}

/// Compile every `%%rbac` directive in a document.
///
/// Directives naming the same target are merged rather than overriding one
/// another: two lines each naming a role mean either role may perform it, which
/// is the reading that matches `|` inside a single directive.
///
/// An operation name that is not CRUD is looked up among `state_machines` as a
/// transition event on that entity. One that matches neither is skipped with a
/// warning naming both possibilities, because at that point the model has said
/// something the generator genuinely cannot act on.
#[cfg(test)]
pub fn compile_rbac(
    source: &str,
    known_entities: &[String],
    state_machines: &[RbacStateMachine],
    mut on_warn: impl FnMut(String),
) -> CompiledRbac {
    let declarations = read_rbac_directives(source, &mut on_warn);
    compile_rbac_declarations(&declarations, known_entities, state_machines, on_warn)
}

/// Read every `%%rbac` line into a declaration, uncompiled. Only the line's
/// shape is checked here; the entity, the roles and whether the target is an
/// operation or a transition are the compiler's questions.
pub fn read_rbac_directives(source: &str, mut on_warn: impl FnMut(String)) -> Vec<RbacDeclaration> {
    let mut declarations = Vec::new();
    for raw_line in source.lines() {
        let line = raw_line.trim();
        if !line.starts_with("%%rbac") {
            continue;
        }
        let Some((role_expr, entity, target)) = parse_directive(line) else {
            on_warn(format!("Skipping malformed %%rbac directive: {line}"));
            continue;
        };
        declarations.push(RbacDeclaration {
            roles: parse_role_expression(&role_expr),
            entity,
            target,
        });
    }
    declarations
}

/// Compile `%%rbac` declarations read from either syntax.
pub fn compile_rbac_declarations(
    declarations: &[RbacDeclaration],
    known_entities: &[String],
    state_machines: &[RbacStateMachine],
    mut on_warn: impl FnMut(String),
) -> CompiledRbac {
    let known: BTreeSet<&str> = known_entities.iter().map(String::as_str).collect();

    // Keyed by `entity:operation` / `entity:transition`; BTreeMap so iteration
    // is deterministic before the explicit sort, matching the TypeScript
    // insertion-ordered Map closely enough that ties resolve the same way.
    let mut operations: BTreeMap<String, (String, String, BTreeSet<String>)> = BTreeMap::new();
    let mut transitions: BTreeMap<
        String,
        (String, String, Vec<RbacTransitionEdge>, BTreeSet<String>),
    > = BTreeMap::new();

    let edges_for = |entity: &str, event: &str| -> Vec<RbacTransitionEdge> {
        let mut found = Vec::new();
        for machine in state_machines {
            if machine.entity != entity {
                continue;
            }
            for edge in &machine.transitions {
                let Some(trigger) = &edge.trigger else {
                    continue;
                };
                // Events are written as they read in a diagram (`close won`,
                // `counter-signed`); a directive spells the same thing in one
                // token.
                let normalized = normalize_key(trigger);
                if normalized == event.to_lowercase() {
                    found.push(RbacTransitionEdge {
                        from: edge.from.clone(),
                        to: edge.to.clone(),
                    });
                }
            }
        }
        found
    };

    for declaration in declarations {
        let entity = declaration.entity.clone();
        let raw_target = declaration.target.clone();

        if !known.is_empty() && !known.contains(entity.as_str()) {
            on_warn(format!(
                "%%rbac targets unknown entity \"{entity}\" — skipped."
            ));
            continue;
        }

        let roles: Vec<String> = declaration
            .roles
            .iter()
            .filter(|role| !role.is_empty())
            .cloned()
            .collect();
        if roles.is_empty() {
            // A directive with no role names would compile to a rule nobody can
            // satisfy, locking the target for everyone including its author.
            on_warn(format!(
                "%%rbac on {entity}.{raw_target} names no role — skipped."
            ));
            continue;
        }

        if let Some(resolved) = operation_alias(&raw_target) {
            let ops: Vec<&str> = if resolved == "*" {
                RBAC_OPERATIONS.to_vec()
            } else {
                vec![resolved]
            };
            for operation in ops {
                let key = format!("{entity}:{operation}");
                let slot = operations
                    .entry(key)
                    .or_insert_with(|| (entity.clone(), operation.to_string(), BTreeSet::new()));
                for role in &roles {
                    slot.2.insert(role.clone());
                }
            }
            continue;
        }

        let edges = edges_for(&entity, &raw_target);
        if edges.is_empty() {
            on_warn(format!(
                "%%rbac on {entity}.{raw_target} names neither a CRUD operation ({}, *) nor a transition in {entity}'s state machine — skipped.",
                RBAC_OPERATIONS.join(", ")
            ));
            continue;
        }

        let key = format!("{entity}:{}", raw_target.to_lowercase());
        let slot = transitions.entry(key).or_insert_with(|| {
            (
                entity.clone(),
                raw_target.clone(),
                edges.clone(),
                BTreeSet::new(),
            )
        });
        for role in &roles {
            slot.3.insert(role.clone());
        }
    }

    let mut compiled_operations: Vec<CompiledRbacRule> = operations
        .into_values()
        .map(|(entity, operation, roles)| CompiledRbacRule {
            table_name: bus_table_name(&entity),
            entity,
            operation,
            roles: roles.into_iter().collect(),
        })
        .collect();
    compiled_operations.sort_by(|a, b| {
        a.table_name
            .cmp(&b.table_name)
            .then_with(|| a.operation.cmp(&b.operation))
    });

    let mut compiled_transitions: Vec<CompiledRbacTransition> = transitions
        .into_values()
        .map(
            |(entity, transition, edges, roles)| CompiledRbacTransition {
                table_name: bus_table_name(&entity),
                entity,
                transition,
                edges,
                roles: roles.into_iter().collect(),
            },
        )
        .collect();
    compiled_transitions.sort_by(|a, b| {
        a.table_name
            .cmp(&b.table_name)
            .then_with(|| a.transition.cmp(&b.transition))
    });

    CompiledRbac {
        operations: compiled_operations,
        transitions: compiled_transitions,
    }
}

/// `Sales Manager`, `sales-manager` and `sales_manager` are one role.
fn normalize_key(value: &str) -> String {
    let mut out = String::new();
    let mut pending_separator = false;
    for ch in value.trim().to_lowercase().chars() {
        if ch.is_whitespace() || ch == '-' {
            pending_separator = !out.is_empty();
            continue;
        }
        if pending_separator {
            out.push('_');
            pending_separator = false;
        }
        out.push(ch);
    }
    out
}

/// `sales_manager` → `Sales Manager`.
pub fn title_case_role(name: &str) -> String {
    split_words(name)
        .into_iter()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// `sales_manager` → `sales.manager`, so the address is readable and routable.
///
/// Underscores are legal in the local part of an address and read badly in a
/// sign-in box next to nine others; a dot is the convention every directory
/// uses.
fn local_part(name: &str) -> String {
    split_words(&name.to_lowercase()).join(".")
}

/// Split on whitespace, `_` and `-`, dropping empties — the TypeScript
/// `split(/[\s_-]+/).filter(Boolean)`.
fn split_words(value: &str) -> Vec<String> {
    value
        .split(|c: char| c.is_whitespace() || c == '_' || c == '-')
        .filter(|word| !word.is_empty())
        .map(str::to_string)
        .collect()
}

/// One role the generated application seeds.
///
/// Serialised into the backend Handlebars context, so the field names are the
/// TypeScript ones — the two generators render the same `.hbs` files.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DerivedRole {
    /// Title-cased for display: `sales_manager` → `Sales Manager`.
    pub name: String,
    /// The spelling the model used, which is what the guards match on.
    pub declared_as: String,
    pub description: String,
    pub is_admin: bool,
    /// `S` for a system role, `U` for an ordinary one.
    pub user_level: String,
}

/// One seeded account, so every role can actually be signed in as.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DerivedUser {
    pub email: String,
    pub name: String,
    pub role_name: String,
    pub description: String,
    pub is_admin: bool,
}

/// Turn compiled `%%rbac` into the roles, users and visibility both generators
/// seed. Pure, and deliberately so.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DerivedAccess {
    pub roles: Vec<DerivedRole>,
    pub users: Vec<DerivedUser>,
    /// Entity name → the roles its `read` rule admits. Empty when none declared.
    pub entity_visibility: BTreeMap<String, Vec<String>>,
    /// Role display name → how many entities it may read.
    pub entity_counts: BTreeMap<String, usize>,
    /// True when at least one entity is restricted, so navigation must be scoped.
    pub scoped: bool,
}

pub struct DeriveAccessOptions<'a> {
    /// Domain for the seeded addresses, e.g. `acme-crm`.
    pub project_id: &'a str,
    /// Every entity the model declares, so the counts have a denominator.
    pub entities: &'a [String],
    /// The administrator's address; defaults to `admin@admin.com`.
    pub admin_email: Option<&'a str>,
    /// The administrator's display name.
    pub admin_name: Option<&'a str>,
}

const ADMIN_ROLE: &str = "Administrator";

/// Roles the model does not have to declare.
///
/// `Administrator` is the master role every guard bypasses for, and the one
/// account whose address is fixed. `User` is the floor: an account holding no
/// functional role at all, which is what proves a restriction restricts.
fn built_in_roles() -> Vec<DerivedRole> {
    vec![
        DerivedRole {
            name: ADMIN_ROLE.to_string(),
            declared_as: "administrator".to_string(),
            description: "Full access to every entity, and bypasses every restriction".to_string(),
            is_admin: true,
            user_level: "S".to_string(),
        },
        DerivedRole {
            name: "User".to_string(),
            declared_as: "user".to_string(),
            description: "Signed in, holding no functional role".to_string(),
            is_admin: false,
            user_level: "U".to_string(),
        },
    ]
}

pub fn derive_access(compiled: &CompiledRbac, options: &DeriveAccessOptions<'_>) -> DerivedAccess {
    // First spelling wins, keyed case-insensitively — the TypeScript Map.
    let mut declared: BTreeMap<String, String> = BTreeMap::new();
    for rule in &compiled.operations {
        for role in &rule.roles {
            declared.entry(role.to_lowercase()).or_insert(role.clone());
        }
    }
    for rule in &compiled.transitions {
        for role in &rule.roles {
            declared.entry(role.to_lowercase()).or_insert(role.clone());
        }
    }

    let mut roles = built_in_roles();
    let mut taken: BTreeSet<String> = roles.iter().map(|role| role.name.to_lowercase()).collect();

    for spelling in declared.values() {
        let name = title_case_role(spelling);
        // A model that writes `role:administrator` means the built-in one.
        // Adding a second role of the same name would seed two rows and give
        // the account whichever the lookup returned first.
        if taken.contains(&name.to_lowercase()) {
            continue;
        }
        taken.insert(name.to_lowercase());
        roles.push(DerivedRole {
            name,
            declared_as: spelling.clone(),
            description: format!("Declared by %%rbac as {spelling}"),
            is_admin: false,
            user_level: "U".to_string(),
        });
    }

    let admin_email = options
        .admin_email
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("admin@admin.com");
    let project = if options.project_id.is_empty() {
        "app"
    } else {
        options.project_id
    };
    let domain = format!("{project}.example.com");

    let users: Vec<DerivedUser> = roles
        .iter()
        .map(|role| {
            if role.is_admin {
                DerivedUser {
                    email: admin_email.to_string(),
                    name: options
                        .admin_name
                        .map(str::trim)
                        .filter(|value| !value.is_empty())
                        .unwrap_or("Administrator")
                        .to_string(),
                    role_name: role.name.clone(),
                    description:
                        "Bypasses every restriction — the account to compare the others against"
                            .to_string(),
                    is_admin: true,
                }
            } else {
                DerivedUser {
                    email: format!("{}@{domain}", local_part(&role.declared_as)),
                    name: role.name.clone(),
                    role_name: role.name.clone(),
                    description: format!("Holds {} and nothing else", role.name),
                    is_admin: false,
                }
            }
        })
        .collect();

    let mut entity_visibility: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for rule in &compiled.operations {
        if rule.operation != "read" {
            continue;
        }
        let entry = entity_visibility.entry(rule.entity.clone()).or_default();
        for role in &rule.roles {
            if !entry.contains(role) {
                entry.push(role.clone());
            }
        }
        entry.sort();
    }

    // Counted over the model's entities rather than over the visibility map: an
    // entity nobody restricted is readable by everyone and still belongs in the
    // total, and leaving it out would make an unrestricted model report every
    // role as seeing nothing.
    let fallback: Vec<String> = entity_visibility.keys().cloned().collect();
    let all_entities: &[String] = if options.entities.is_empty() {
        &fallback
    } else {
        options.entities
    };

    let mut entity_counts: BTreeMap<String, usize> = BTreeMap::new();
    for role in &roles {
        let count = if role.is_admin {
            all_entities.len()
        } else {
            all_entities
                .iter()
                .filter(|entity| match entity_visibility.get(*entity) {
                    None => true,
                    Some(allowed) if allowed.is_empty() => true,
                    Some(allowed) => allowed
                        .iter()
                        .any(|name| normalize_key(name) == normalize_key(&role.declared_as)),
                })
                .count()
        };
        entity_counts.insert(role.name.clone(), count);
    }

    DerivedAccess {
        scoped: !entity_visibility.is_empty(),
        roles,
        users,
        entity_visibility,
        entity_counts,
    }
}

/// The roles `dictionary.sql` already seeds.
///
/// A model that writes `role:administrator` means that one; adding a second row
/// of the same name would give the account whichever the lookup returned first.
const BUILT_IN_ROLE_NAMES: [&str; 2] = ["administrator", "user"];

pub struct AccessSeedOptions<'a> {
    pub project_name: &'a str,
    pub rbac: &'a CompiledRbac,
    /// Physical table name → its column names.
    ///
    /// A transition rule has to name the same status column the transition
    /// itself writes, or the guard reads a column nothing sets and every
    /// restriction on it is inert. Both seeds resolve it through
    /// `workflows::status_field_for`.
    pub columns_by_table: &'a std::collections::HashMap<String, Vec<String>>,
    /// The entities the dictionary describes, so a declared role can be granted
    /// the windows it needs to open. With no `sys_access` row a role is refused
    /// by the first authorisation gate, reads included.
    pub entities: &'a [BusEntity],
    /// Value written to every `created_by` / `updated_by`.
    pub created_by: &'a str,
}

/// `seed/access.sql` — the roles the model named, and the rules that close an
/// operation to them.
pub fn build_access_seed_sql(options: &AccessSeedOptions<'_>) -> String {
    let AccessSeedOptions {
        project_name,
        rbac,
        columns_by_table,
        entities,
        created_by,
    } = *options;

    let id = |kind: &str, parts: &[&str]| -> String {
        let name = format!("{project_name}:{kind}:{}", parts.join(":"));
        Uuid::new_v5(&NAMESPACE, name.as_bytes()).to_string()
    };

    let mut out: Vec<String> = Vec::new();
    let section = |out: &mut Vec<String>, title: &str| {
        out.push(String::new());
        out.push(format!("-- {}", "-".repeat(74)));
        out.push(format!("-- {title}"));
        out.push(format!("-- {}", "-".repeat(74)));
    };

    out.push(format!(
        "-- Access rules for {project_name}, compiled from %%rbac."
    ));
    out.push("--".to_string());
    out.push(
        "-- Generated by @appwithai/generator — do not edit by hand; regenerate instead."
            .to_string(),
    );
    out.push(
        "-- Applied by `cargo loco task seed_access` and by `cargo loco db seed`.".to_string(),
    );
    out.push("--".to_string());
    out.push(
        "-- Every statement is `ON CONFLICT DO NOTHING` over a deterministic primary".to_string(),
    );
    out.push("-- key, so running this file twice is a no-op.".to_string());

    if rbac.operations.is_empty() && rbac.transitions.is_empty() {
        out.push("--".to_string());
        out.push(
            "-- This model declares no %%rbac, so every operation stays open to any".to_string(),
        );
        out.push(
            "-- authenticated caller. The file is still emitted: `seed_access.rs`".to_string(),
        );
        out.push("-- embeds it with include_str!, which is resolved at compile time.".to_string());
        out.push(String::new());
        return out.join("\n");
    }

    // ── Roles ───────────────────────────────────────────────────────────────
    let derived = derive_access(
        rbac,
        &DeriveAccessOptions {
            project_id: &kebab(project_name),
            entities: &[],
            admin_email: None,
            admin_name: None,
        },
    );
    let declared_roles: Vec<&DerivedRole> = derived
        .roles
        .iter()
        .filter(|role| !BUILT_IN_ROLE_NAMES.contains(&role.name.to_lowercase().as_str()))
        .collect();

    if !declared_roles.is_empty() {
        section(&mut out, "Roles the model named");
        for role in &declared_roles {
            out.push(insert(
                "sys_role",
                &[
                    ("sys_role_id", text(id("role", &[&role.name]))),
                    ("name", text(role.name.clone())),
                    ("description", text(role.description.clone())),
                    ("user_level", text(role.user_level.clone())),
                    ("is_master_role", Sql::Bool(role.is_admin)),
                    ("is_can_export", Sql::Bool(true)),
                    ("is_can_report", Sql::Bool(true)),
                    ("is_personal_lock", Sql::Bool(false)),
                    ("is_personal_access", Sql::Bool(false)),
                    ("max_query_records", Sql::Int(0)),
                    ("is_show_accounting", Sql::Bool(false)),
                    ("entity_type", text("U")),
                    ("is_active", Sql::Bool(true)),
                    ("created_by", text(created_by)),
                    ("updated_by", text(created_by)),
                    ("created_at", now()),
                    ("updated_at", now()),
                ],
            ));
        }
    }

    // ── What those roles may open ───────────────────────────────────────────
    /*
     * A role with no `sys_access` row is refused by the *first* of the three
     * gates, before either of the tables below is consulted. The seeded
     * demonstration accounts were in exactly that state: signing in as the
     * Researcher gave an empty dashboard, `windows: []` from
     * `/api/me/permissions`, and 403 on every entity — including reads, and
     * including the transitions its own `%%rbac` directive granted it.
     *
     * So each declared role is granted the same windows the built-in `User`
     * role gets, and the two tables below are what narrow it. That is what the
     * directive's additive rule means: `%%rbac role:x on Order.delete` closes
     * deleting to everyone but x, and says nothing about looking at an Order.
     */
    if !declared_roles.is_empty() && !entities.is_empty() {
        section(&mut out, "What the model's roles may open (sys_access)");
        let table_name_by_entity: std::collections::HashMap<&str, &str> = entities
            .iter()
            .map(|entity| (entity.name.as_str(), entity.table_name.as_str()))
            .collect();
        for role in &declared_roles {
            for entity in entities {
                // A child entity has no window of its own; its rows are reached
                // through the parent's, which is the window to grant.
                let window_table = table_name_by_entity
                    .get(entity.window_owner.as_str())
                    .copied()
                    .unwrap_or(entity.table_name.as_str());
                out.push(insert(
                    "sys_access",
                    &[
                        (
                            "sys_access_id",
                            text(id("access", &[&role.name, &entity.table_name])),
                        ),
                        ("sys_role_id", role_ref(&role.name)),
                        ("sys_table_id", text(id("table", &[&entity.table_name]))),
                        ("sys_window_id", text(id("window", &[window_table]))),
                        ("access_type_table", text("W")),
                        ("is_read_only", Sql::Bool(false)),
                        ("is_exclude", Sql::Bool(false)),
                        ("entity_type", text("U")),
                        ("is_active", Sql::Bool(true)),
                        ("created_by", text(created_by)),
                        ("updated_by", text(created_by)),
                        ("created_at", now()),
                        ("updated_at", now()),
                    ],
                ));
            }
        }
    }

    // ── Operation rules ─────────────────────────────────────────────────────
    if !rbac.operations.is_empty() {
        section(&mut out, "Per-operation access (sys_operation_access)");
        for rule in &rbac.operations {
            for role in &rule.roles {
                out.push(insert(
                    "sys_operation_access",
                    &[
                        (
                            "sys_operation_access_id",
                            text(id(
                                "operation_access",
                                &[&rule.table_name, &rule.operation, role],
                            )),
                        ),
                        ("table_name", text(rule.table_name.clone())),
                        ("operation", text(rule.operation.clone())),
                        // The author's spelling, not the title-cased role name:
                        // the guard folds case when it compares, and the admin
                        // UI should show what the model actually said.
                        ("role_name", text(role.clone())),
                        // Marks the row as the model's. A rule added in the
                        // running application is unmarked, so regeneration can
                        // replace what it owns without discarding what an
                        // administrator added.
                        ("is_model_managed", Sql::Bool(true)),
                        ("is_active", Sql::Bool(true)),
                        ("created_at", now()),
                        ("updated_at", now()),
                    ],
                ));
            }
        }
    }

    // ── Transition rules ────────────────────────────────────────────────────
    if !rbac.transitions.is_empty() {
        section(&mut out, "Per-transition access (sys_transition_access)");
        for rule in &rbac.transitions {
            for edge in &rule.edges {
                for role in &rule.roles {
                    out.push(insert(
                        "sys_transition_access",
                        &[
                            (
                                "sys_transition_access_id",
                                text(id(
                                    "transition_access",
                                    &[
                                        &rule.table_name,
                                        &rule.transition,
                                        &edge.from,
                                        &edge.to,
                                        role,
                                    ],
                                )),
                            ),
                            ("table_name", text(rule.table_name.clone())),
                            ("transition", text(rule.transition.clone())),
                            // The same column `seed/transitions.sql` recorded
                            // the edge against. Reading a different one would
                            // leave the rule matching nothing.
                            (
                                "status_field",
                                text(crate::workflows::status_field_for(
                                    &rule.table_name,
                                    columns_by_table,
                                )),
                            ),
                            ("from_state", text(edge.from.clone())),
                            ("to_state", text(edge.to.clone())),
                            ("role_name", text(role.clone())),
                            ("is_model_managed", Sql::Bool(true)),
                            ("is_active", Sql::Bool(true)),
                            ("created_at", now()),
                            ("updated_at", now()),
                        ],
                    ));
                }
            }
        }
    }

    out.push(String::new());
    out.join("\n")
}

/// `Acme CRM` → `acme-crm`, the same expression both generators use for the
/// project id.
pub fn kebab(value: &str) -> String {
    let mut out = String::new();
    let mut pending = false;
    for ch in value.to_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            if pending && !out.is_empty() {
                out.push('-');
            }
            pending = false;
            out.push(ch);
        } else {
            pending = true;
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn compile(source: &str) -> CompiledRbac {
        compile_rbac(source, &[], &[], |_| {})
    }

    #[test]
    fn a_star_target_expands_to_every_operation() {
        let compiled = compile("%%rbac role:admin on Order.*");
        assert_eq!(compiled.operations.len(), 4);
        let ops: Vec<&str> = compiled
            .operations
            .iter()
            .map(|rule| rule.operation.as_str())
            .collect();
        assert_eq!(ops, vec!["create", "delete", "read", "update"]);
        assert!(compiled
            .operations
            .iter()
            .all(|rule| rule.table_name == "bus_order"));
    }

    #[test]
    fn two_directives_on_one_target_merge_rather_than_override() {
        let compiled = compile(
            "%%rbac role:sales on Deal.read\n\
             %%rbac role:manager on Deal.read",
        );
        assert_eq!(compiled.operations.len(), 1);
        assert_eq!(compiled.operations[0].roles, vec!["manager", "sales"]);
    }

    #[test]
    fn a_pipe_expression_accepts_both_spellings() {
        assert_eq!(
            parse_role_expression("role:sales|manager"),
            vec!["sales".to_string(), "manager".to_string()]
        );
        assert_eq!(
            parse_role_expression("role:sales|role:manager"),
            vec!["sales".to_string(), "manager".to_string()]
        );
        assert_eq!(parse_role_expression("admin"), vec!["admin".to_string()]);
    }

    #[test]
    fn an_unknown_entity_is_skipped_with_a_warning() {
        let mut warnings = Vec::new();
        let compiled = compile_rbac(
            "%%rbac role:admin on Ghost.read",
            &["Order".to_string()],
            &[],
            |message| warnings.push(message),
        );
        assert!(compiled.operations.is_empty());
        assert_eq!(warnings.len(), 1);
        assert!(warnings[0].contains("Ghost"));
    }

    #[test]
    fn a_transition_target_resolves_against_the_state_machine() {
        let machines = vec![RbacStateMachine {
            entity: "Deal".to_string(),
            transitions: vec![
                RbacStateEdge {
                    from: "negotiation".to_string(),
                    to: "won".to_string(),
                    trigger: Some("close won".to_string()),
                },
                RbacStateEdge {
                    from: "proposal".to_string(),
                    to: "won".to_string(),
                    trigger: Some("close-won".to_string()),
                },
            ],
        }];
        let compiled = compile_rbac(
            "%%rbac role:manager on Deal.close_won",
            &[],
            &machines,
            |_| {},
        );
        assert!(compiled.operations.is_empty());
        assert_eq!(compiled.transitions.len(), 1);
        // Both edges match: one transition name can sit on several edges, and
        // restricting the event must restrict every way of taking it.
        assert_eq!(compiled.transitions[0].edges.len(), 2);
    }

    #[test]
    fn table_names_follow_the_erd_parser() {
        assert_eq!(bus_table_name("Order"), "bus_order");
        assert_eq!(bus_table_name("DealLineItem"), "bus_deal_line_item");
        assert_eq!(bus_table_name("bus_already"), "bus_already");
    }

    #[test]
    fn derived_roles_keep_the_two_built_ins_and_add_the_declared_ones() {
        let compiled = compile("%%rbac role:sales_manager on Deal.read");
        let access = derive_access(
            &compiled,
            &DeriveAccessOptions {
                project_id: "crm",
                entities: &["Deal".to_string(), "Company".to_string()],
                admin_email: None,
                admin_name: None,
            },
        );
        let names: Vec<&str> = access.roles.iter().map(|r| r.name.as_str()).collect();
        assert_eq!(names, vec!["Administrator", "User", "Sales Manager"]);
        assert_eq!(
            access
                .users
                .iter()
                .map(|u| u.email.as_str())
                .collect::<Vec<_>>(),
            vec![
                "admin@admin.com",
                "user@crm.example.com",
                "sales.manager@crm.example.com",
            ]
        );
        // Deal is restricted to Sales Manager; Company is not restricted at all.
        assert_eq!(access.entity_counts["Sales Manager"], 2);
        assert_eq!(access.entity_counts["User"], 1);
        assert_eq!(access.entity_counts["Administrator"], 2);
        assert!(access.scoped);
    }

    #[test]
    fn a_model_naming_administrator_does_not_get_a_second_role() {
        let compiled = compile("%%rbac role:administrator on Deal.delete");
        let access = derive_access(
            &compiled,
            &DeriveAccessOptions {
                project_id: "crm",
                entities: &[],
                admin_email: None,
                admin_name: None,
            },
        );
        assert_eq!(access.roles.len(), 2);
    }

    #[test]
    fn a_model_with_no_directives_emits_only_the_header() {
        let sql = build_access_seed_sql(&AccessSeedOptions {
            project_name: "crm",
            rbac: &CompiledRbac::default(),
            columns_by_table: &std::collections::HashMap::new(),
            entities: &[],
            created_by: "system",
        });
        assert!(!sql.contains("INSERT INTO"));
        assert!(sql.contains("declares no %%rbac"));
    }

    #[test]
    fn a_malformed_directive_is_reported_not_silently_dropped() {
        let mut warnings = Vec::new();
        let compiled = compile_rbac("%%rbac role:admin Order.read", &[], &[], |m| {
            warnings.push(m)
        });
        assert!(compiled.operations.is_empty());
        assert_eq!(warnings.len(), 1);
        assert!(warnings[0].contains("malformed"));
    }
}
