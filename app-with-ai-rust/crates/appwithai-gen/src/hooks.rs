//! The model's `hooks` → Rust lifecycle handlers in the generated Loco backend.
//!
//! The Rust mirror of `packages/generator/src/hooks/index.ts` (the compiler)
//! and `packages/generator/src/generators/tanstack-astryx-loco/hook-handlers.ts`
//! (the emission layer). Both halves are here because the emission layer is
//! useless without the directives, and this generator had neither.
//!
//! **The two implementations must agree byte for byte.** `bun run parity` is the
//! gate, and all three corpus models declare hooks — drug-discovery 13, crm
//! 38, dance-studio 3 — so the gate genuinely exercises this rather than
//! comparing two empty outputs. Change one side and change the other in the
//! same commit.
//!
//! See the TypeScript module's header for why handler modules are written once
//! and the registry is rewritten every run.

use crate::records::HookDeclaration;
use std::collections::{BTreeMap, BTreeSet};

use crate::naming::snake_case;

/// The lifecycle events a hook may bind to.
///
/// Mirrors `language/appwithai-language.json` and `HOOK_TYPES` in the
/// TypeScript compiler, in that order.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum HookType {
    BeforeCreate,
    AfterCreate,
    BeforeUpdate,
    AfterUpdate,
    BeforeDelete,
    AfterDelete,
    BeforeRead,
    AfterRead,
    BeforeQuery,
    AfterQuery,
    BeforeList,
    AfterList,
    CustomValidate,
}

/// Declaration order, which is also the order dispatch functions are emitted.
///
/// `beforeQuery` before `beforeList` and `afterQuery` before `afterList`
/// because this stack's list endpoint *is* its query: one generic handler reads
/// the filter parameters and returns the page. Running the query pair around
/// the fetch and the list pair around the response keeps both meaningful rather
/// than making one a synonym that never fires.
pub const HOOK_TYPES: [HookType; 13] = [
    HookType::BeforeCreate,
    HookType::AfterCreate,
    HookType::BeforeUpdate,
    HookType::AfterUpdate,
    HookType::BeforeDelete,
    HookType::AfterDelete,
    HookType::BeforeRead,
    HookType::AfterRead,
    HookType::BeforeQuery,
    HookType::AfterQuery,
    HookType::BeforeList,
    HookType::AfterList,
    HookType::CustomValidate,
];

impl HookType {
    /// The spelling a directive writes, and what the doc comments carry.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::BeforeCreate => "beforeCreate",
            Self::AfterCreate => "afterCreate",
            Self::BeforeUpdate => "beforeUpdate",
            Self::AfterUpdate => "afterUpdate",
            Self::BeforeDelete => "beforeDelete",
            Self::AfterDelete => "afterDelete",
            Self::BeforeRead => "beforeRead",
            Self::AfterRead => "afterRead",
            Self::BeforeQuery => "beforeQuery",
            Self::AfterQuery => "afterQuery",
            Self::BeforeList => "beforeList",
            Self::AfterList => "afterList",
            Self::CustomValidate => "customValidate",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        HOOK_TYPES.iter().copied().find(|t| t.as_str() == value)
    }

    /// `beforeCreate` → `before_create`, the dispatch function's name.
    pub fn dispatch_name(self) -> String {
        snake_case(self.as_str())
    }

    /// What the handler declares, what the registry forwards, and what it returns.
    ///
    /// `params` and `call` are separate because the registry has to forward
    /// exactly what it was handed; deriving the call site by reformatting the
    /// parameter list is how the two drift apart.
    pub fn contract(self) -> HookRustContract {
        match self {
            Self::BeforeCreate => HookRustContract {
                params: "data: &mut Map<String, Value>",
                call: "data",
                returns: "()",
                body: "    let _ = data;\n    Ok(())",
                summary: "Runs before the insert. Mutate `data` to change what is written.",
            },
            Self::AfterCreate => HookRustContract {
                params: "record: &Value",
                call: "record",
                returns: "()",
                body: "    let _ = record;\n    Ok(())",
                summary: "Runs after the insert, on the stored row. Side effects only.",
            },
            Self::BeforeUpdate => HookRustContract {
                params: "id: Uuid, data: &mut Map<String, Value>",
                call: "id, data",
                returns: "()",
                body: "    let _ = (id, data);\n    Ok(())",
                summary: "Runs before the update. Mutate `data` to change what is written.",
            },
            Self::AfterUpdate => HookRustContract {
                params: "record: &Value",
                call: "record",
                returns: "()",
                body: "    let _ = record;\n    Ok(())",
                summary: "Runs after the update, on the stored row. Side effects only.",
            },
            Self::BeforeDelete => HookRustContract {
                params: "id: Uuid",
                call: "id",
                returns: "bool",
                body: "    let _ = id;\n    Ok(true)",
                summary: "Runs before the delete. Return `Ok(false)` to block it.",
            },
            Self::AfterDelete => HookRustContract {
                params: "record: &Value",
                call: "record",
                returns: "()",
                body: "    let _ = record;\n    Ok(())",
                summary: "Runs after the delete, on the row as it was. Clean up related state.",
            },
            Self::BeforeRead => HookRustContract {
                params: "id: Uuid",
                call: "id",
                returns: "()",
                body: "    let _ = id;\n    Ok(())",
                summary: "Runs before a single record is fetched. Return an error to refuse.",
            },
            Self::AfterRead => HookRustContract {
                params: "record: &mut Value",
                call: "record",
                returns: "()",
                body: "    let _ = record;\n    Ok(())",
                summary: "Runs after a single record is fetched. Mutate it to shape the response.",
            },
            Self::BeforeQuery => HookRustContract {
                params: "params: &mut HashMap<String, String>",
                call: "params",
                returns: "()",
                body: "    let _ = params;\n    Ok(())",
                summary: "Runs before the list query. Mutate `params` to scope or filter it.",
            },
            Self::AfterQuery => HookRustContract {
                params: "rows: &mut Vec<Value>",
                call: "rows",
                returns: "()",
                body: "    let _ = rows;\n    Ok(())",
                summary: "Runs on the rows the list query returned, before `afterList`.",
            },
            Self::BeforeList => HookRustContract {
                params: "params: &HashMap<String, String>",
                call: "params",
                returns: "()",
                body: "    let _ = params;\n    Ok(())",
                summary:
                    "Runs before the list query, after `beforeQuery`. Return an error to refuse.",
            },
            Self::AfterList => HookRustContract {
                params: "rows: &mut Vec<Value>",
                call: "rows",
                returns: "()",
                body: "    let _ = rows;\n    Ok(())",
                summary: "Runs on the page of rows about to be returned.",
            },
            Self::CustomValidate => HookRustContract {
                params: "data: &Map<String, Value>",
                call: "data",
                returns: "()",
                body: "    let _ = data;\n    Ok(())",
                summary:
                    "Runs on create and on update. Return an `AppError::Validation` to refuse.",
            },
        }
    }
}

/// What one hook type looks like in Rust. See `HookType::contract`.
#[derive(Debug, Clone, Copy)]
pub struct HookRustContract {
    pub params: &'static str,
    pub call: &'static str,
    pub returns: &'static str,
    pub body: &'static str,
    pub summary: &'static str,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledHook {
    pub entity: String,
    pub hook_type: HookType,
    /// The generated function's name.
    pub handler: String,
    /// Field the hook is scoped to, when the directive names one.
    pub field: Option<String>,
    /// Order of declaration within the entity — hooks run in the order written.
    pub order: usize,
}

/// Compile hook declarations read from either syntax.
pub fn compile_hook_declarations(
    declarations: &[HookDeclaration],
    known_entities: &[String],
    mut on_warn: impl FnMut(String),
) -> Vec<CompiledHook> {
    let known: BTreeSet<&str> = known_entities.iter().map(String::as_str).collect();
    let mut hooks: Vec<CompiledHook> = Vec::new();
    let mut seen: BTreeSet<String> = BTreeSet::new();
    let mut per_entity: BTreeMap<String, usize> = BTreeMap::new();

    for declaration in declarations {
        let type_name = declaration.event.as_str();
        let handler = declaration.handler.as_str();
        let entity = declaration.entity.as_str();

        let Some(hook_type) = HookType::parse(type_name) else {
            on_warn(format!(
                "Hook \"{handler}\" on {entity} uses unknown event \"{type_name}\" — skipped."
            ));
            continue;
        };

        if !known.is_empty() && !known.contains(entity) {
            on_warn(format!(
                "Hook \"{handler}\" targets unknown entity \"{entity}\" — skipped."
            ));
            continue;
        }

        // Two directives naming the same function on the same event would
        // generate a duplicate export; the second is redundant either way.
        let key = format!("{entity}:{type_name}:{handler}");
        if seen.contains(&key) {
            on_warn(format!(
                "Hook \"{handler}\" is declared twice for {entity}.{type_name} — keeping the first."
            ));
            continue;
        }
        seen.insert(key);

        let order = per_entity.entry(entity.to_string()).or_insert(0);
        let this_order = *order;
        *order += 1;

        hooks.push(CompiledHook {
            entity: entity.to_string(),
            hook_type,
            handler: handler.to_string(),
            field: declaration.field.clone(),
            order: this_order,
        });
    }

    // A handler name is a function name in a per-entity module, so the same
    // name cannot serve two events for one entity.
    let mut by_name: BTreeMap<String, HookType> = BTreeMap::new();
    let mut kept: Vec<CompiledHook> = Vec::new();
    for hook in hooks {
        let name_key = format!("{}:{}", hook.entity, hook.handler);
        if let Some(clash) = by_name.get(&name_key) {
            on_warn(format!(
                "Hook \"{}\" on {} is bound to both {} and {} — keeping {}. Give each event its own handler name.",
                hook.handler,
                hook.entity,
                clash.as_str(),
                hook.hook_type.as_str(),
                clash.as_str()
            ));
            continue;
        }
        by_name.insert(name_key, hook.hook_type);
        kept.push(hook);
    }

    kept
}

/// Group hooks by entity, preserving declaration order within each.
pub fn hooks_by_entity(hooks: &[CompiledHook]) -> BTreeMap<String, Vec<CompiledHook>> {
    let mut grouped: BTreeMap<String, Vec<CompiledHook>> = BTreeMap::new();
    for hook in hooks {
        grouped
            .entry(hook.entity.clone())
            .or_default()
            .push(hook.clone());
    }
    for list in grouped.values_mut() {
        list.sort_by_key(|h| h.order);
    }
    grouped
}

/// The module an entity's handlers live in: `DeviationReport` → `deviation_report`.
pub fn handler_module(entity: &str) -> String {
    snake_case(entity)
}

/// The same normalisation the generated `key()` performs.
fn key(entity: &str) -> String {
    let trimmed = entity.strip_prefix("bus_").unwrap_or(entity);
    trimmed
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .map(|c| c.to_ascii_lowercase())
        .collect()
}

/// One handler function: a documented no-op with the right shape.
fn render_handler(entity: &str, hook: &CompiledHook) -> String {
    let contract = hook.hook_type.contract();
    let scope = match &hook.field {
        Some(field) => format!("\n/// Scoped by the model to `{field}`."),
        None => String::new(),
    };
    format!(
        "/// `{}` on {} — declared by the model.\n///\n/// {}{}\npub async fn {}({}) -> AppResult<{}> {{\n{}\n}}\n",
        hook.hook_type.as_str(),
        entity,
        contract.summary,
        scope,
        snake_case(&hook.handler),
        contract.params,
        contract.returns,
        contract.body,
    )
}

/// One entity's handler module. Written once; see the header it emits.
pub fn build_hook_handler_module(entity: &str, hooks: &[CompiledHook]) -> String {
    let mut ordered = hooks.to_vec();
    ordered.sort_by_key(|h| h.order);

    let header = format!(
        "//! Lifecycle handlers for {entity}.\n\
         //!\n\
         //! Declared by the model's `hooks` and wired up in\n\
         //! `crate::hooks`. **The bodies are yours.** This file is written\n\
         //! once and then left alone, so regenerating the project will not overwrite\n\
         //! what you put here; a hook added to the model later arrives as a new stub\n\
         //! appended below.\n\
         //!\n\
         //! Each returns `AppResult`, so returning an error refuses the request.\n\n\
         use crate::errors::AppResult;\n\
         #[allow(unused_imports)]\n\
         use serde_json::{{Map, Value}};\n\
         #[allow(unused_imports)]\n\
         use std::collections::HashMap;\n\
         #[allow(unused_imports)]\n\
         use uuid::Uuid;\n\n"
    );

    let bodies: Vec<String> = ordered.iter().map(|h| render_handler(entity, h)).collect();
    format!("{header}{}", bodies.join("\n"))
}

/// Stubs for hooks a handler module does not define yet.
///
/// A hook declared after the project was first generated has to arrive
/// somehow, and rewriting the module would take the implementations with it.
/// Returns `None` when the module already defines everything.
pub fn append_missing_handlers(
    entity: &str,
    hooks: &[CompiledHook],
    existing: &str,
) -> Option<String> {
    let mut ordered = hooks.to_vec();
    ordered.sort_by_key(|h| h.order);

    let missing: Vec<&CompiledHook> = ordered
        .iter()
        .filter(|hook| !defines_fn(existing, &snake_case(&hook.handler)))
        .collect();
    if missing.is_empty() {
        return None;
    }

    let additions: Vec<String> = missing.iter().map(|h| render_handler(entity, h)).collect();
    Some(format!(
        "{}\n\n// --- Added by a later generation run ---\n\n{}",
        existing.trim_end(),
        additions.join("\n")
    ))
}

/// Does the source already define `fn <name>(`?
///
/// The TypeScript side uses `\bfn\s+<name>\s*\(`; this is the same test without
/// building a regex per handler.
fn defines_fn(source: &str, name: &str) -> bool {
    for (index, _) in source.match_indices("fn ") {
        // `fn` must be its own word — `r#fn` or `myfn ` must not match.
        if index > 0 {
            let prev = source[..index].chars().next_back().unwrap_or(' ');
            if prev.is_alphanumeric() || prev == '_' {
                continue;
            }
        }
        let rest = source[index + 3..].trim_start();
        if let Some(after) = rest.strip_prefix(name) {
            if after.trim_start().starts_with('(') {
                return true;
            }
        }
    }
    false
}

/// `handlers/mod.rs` — one `pub mod` per entity that declares a hook.
pub fn build_hook_handlers_mod(entities: &[String]) -> String {
    let header = "//! Per-entity lifecycle handler modules.\n\
                  //!\n\
                  //! Generated wiring — rewritten on every run. The modules it names are not.\n\n";

    if entities.is_empty() {
        return format!("{header}// No hooks are declared in this model.\n");
    }

    let mut sorted = entities.to_vec();
    sorted.sort();
    let mods: String = sorted
        .iter()
        .map(|entity| format!("pub mod {};\n", handler_module(entity)))
        .collect();
    format!("{header}{mods}")
}

/// `src/hooks/mod.rs` — the registry. Pure wiring, rewritten on every run.
pub fn build_hook_registry(hooks: &[CompiledHook]) -> String {
    let grouped = hooks_by_entity(hooks);
    // `BTreeMap` keys are already sorted, which is what the TypeScript side
    // gets from an explicit `.sort()`.
    let entities: Vec<&String> = grouped.keys().collect();

    let mut out = String::from(
        "//! The hook registry: which handler runs on which entity, for each event.\n\
         //!\n\
         //! Generated wiring — rewritten on every run, so a hook added to the\n\
         //! model is always picked up. The handler bodies in `handlers/` are not\n\
         //! rewritten; see that module's header.\n\
         //!\n\
         //! A dispatch function with no arm for an entity is a no-op, which is what\n\
         //! makes it safe for the generic bus controller to call all of these\n\
         //! unconditionally on every request.\n\n\
         pub mod handlers;\n\n\
         use crate::errors::AppResult;\n\
         #[allow(unused_imports)]\n\
         use serde_json::{Map, Value};\n\
         #[allow(unused_imports)]\n\
         use std::collections::HashMap;\n\
         #[allow(unused_imports)]\n\
         use uuid::Uuid;\n\n\
         /// Normalise whatever spelling the caller used to the model's entity name.\n\
         ///\n\
         /// `bus_compound`, `compound`, `Compound` and `chemical-inventory` all have\n\
         /// to reach the same handlers, or a hook would fire from one route and not\n\
         /// another.\n\
         #[allow(dead_code)]\n\
         fn key(entity: &str) -> String {\n\
         \x20   let trimmed = entity.strip_prefix(\"bus_\").unwrap_or(entity);\n\
         \x20   trimmed\n\
         \x20       .chars()\n\
         \x20       .filter(|c| c.is_ascii_alphanumeric())\n\
         \x20       .map(|c| c.to_ascii_lowercase())\n\
         \x20       .collect()\n\
         }\n",
    );

    for hook_type in HOOK_TYPES {
        let contract = hook_type.contract();
        let fn_name = hook_type.dispatch_name();

        let declaring: Vec<(&String, Vec<&CompiledHook>)> = entities
            .iter()
            .filter_map(|entity| {
                let for_event: Vec<&CompiledHook> = grouped
                    .get(*entity)
                    .map(|list| {
                        let mut v: Vec<&CompiledHook> =
                            list.iter().filter(|h| h.hook_type == hook_type).collect();
                        v.sort_by_key(|h| h.order);
                        v
                    })
                    .unwrap_or_default();
                if for_event.is_empty() {
                    None
                } else {
                    Some((*entity, for_event))
                }
            })
            .collect();

        let calls_for = |entity: &str, for_event: &[&CompiledHook], indent: &str| -> String {
            for_event
                .iter()
                .map(|hook| {
                    let path = format!(
                        "handlers::{}::{}",
                        handler_module(entity),
                        snake_case(&hook.handler)
                    );
                    if contract.returns == "bool" {
                        format!(
                            "{indent}if !{path}({}).await? {{\n{indent}    return Ok(false);\n{indent}}}\n",
                            contract.call
                        )
                    } else {
                        format!("{indent}{path}({}).await?;\n", contract.call)
                    }
                })
                .collect()
        };

        let ok = if contract.returns == "bool" {
            "Ok(true)"
        } else {
            "Ok(())"
        };

        out.push_str(&format!(
            "\n/// `{}` — {}\npub async fn {fn_name}(entity: &str, {}) -> AppResult<{}> {{\n",
            hook_type.as_str(),
            contract.summary,
            contract.params,
            contract.returns,
        ));

        if declaring.is_empty() {
            // No entity declares this event. Naming the parameters keeps the
            // signature identical to the populated form, so the controller's
            // call sites do not change shape with the model.
            out.push_str(&format!(
                "    let _ = (entity, {});\n    {ok}\n}}\n",
                contract.call
            ));
        } else if declaring.len() == 1 {
            // Exactly one entity. A `match` with one arm and a `_ => {}` is
            // what clippy's `single_match` rejects, and the generated backend
            // is expected to be clippy-clean with `-D warnings` — so this shape
            // is the difference between a crate that builds in CI and one that
            // does not.
            let (entity, for_event) = &declaring[0];
            out.push_str(&format!("    if key(entity) == \"{}\" {{\n", key(entity)));
            out.push_str(&calls_for(entity, for_event, "        "));
            out.push_str(&format!("    }}\n    {ok}\n}}\n"));
        } else {
            out.push_str("    match key(entity).as_str() {\n");
            for (entity, for_event) in &declaring {
                out.push_str(&format!("        \"{}\" => {{\n", key(entity)));
                out.push_str(&calls_for(entity, for_event, "            "));
                out.push_str("        }\n");
            }
            out.push_str(&format!("        _ => {{}}\n    }}\n    {ok}\n}}\n"));
        }
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn declared(event: &str, handler: &str, entity: &str, field: Option<&str>) -> HookDeclaration {
        HookDeclaration {
            event: event.to_string(),
            handler: handler.to_string(),
            entity: entity.to_string(),
            field: field.map(str::to_string),
        }
    }

    fn hook(entity: &str, hook_type: HookType, handler: &str, order: usize) -> CompiledHook {
        CompiledHook {
            entity: entity.to_string(),
            hook_type,
            handler: handler.to_string(),
            field: None,
            order,
        }
    }

    #[test]
    fn compiles_a_declaration_with_a_scoped_field() {
        let hooks = compile_hook_declarations(
            &[declared(
                "beforeCreate",
                "generateInchiKey",
                "Compound",
                Some("inchi_key"),
            )],
            &["Compound".to_string()],
            |_| {},
        );
        assert_eq!(hooks.len(), 1);
        assert_eq!(hooks[0].hook_type, HookType::BeforeCreate);
        assert_eq!(hooks[0].handler, "generateInchiKey");
        assert_eq!(hooks[0].field.as_deref(), Some("inchi_key"));
    }

    #[test]
    fn drops_a_hook_naming_an_entity_the_model_does_not_declare() {
        let mut warnings = Vec::new();
        let hooks = compile_hook_declarations(
            &[declared("afterCreate", "notify", "Ghost", None)],
            &["Compound".to_string()],
            |m| warnings.push(m),
        );
        assert!(hooks.is_empty());
        assert!(warnings[0].contains("unknown entity"));
    }

    #[test]
    fn keeps_the_first_of_two_identical_declarations() {
        let mut warnings = Vec::new();
        let source = [
            declared("afterCreate", "notify", "Compound", None),
            declared("afterCreate", "notify", "Compound", None),
        ];
        let hooks =
            compile_hook_declarations(&source, &["Compound".to_string()], |m| warnings.push(m));
        assert_eq!(hooks.len(), 1);
        assert!(warnings[0].contains("declared twice"));
    }

    #[test]
    fn refuses_one_handler_name_bound_to_two_events() {
        let mut warnings = Vec::new();
        let source = [
            declared("beforeCreate", "touch", "Compound", None),
            declared("afterCreate", "touch", "Compound", None),
        ];
        let hooks =
            compile_hook_declarations(&source, &["Compound".to_string()], |m| warnings.push(m));
        assert_eq!(hooks.len(), 1);
        assert_eq!(hooks[0].hook_type, HookType::BeforeCreate);
        assert!(warnings[0].contains("bound to both"));
    }

    #[test]
    fn a_single_declaring_entity_collapses_to_an_if() {
        // clippy's `single_match` denies the one-arm `match` this would
        // otherwise be, and the generated backend is built with -D warnings.
        let registry = build_hook_registry(&[hook(
            "Experiment",
            HookType::BeforeUpdate,
            "snapshotPreviousState",
            0,
        )]);
        assert!(registry.contains("if key(entity) == \"experiment\" {"));
        assert!(!registry.contains("_ => {}"));
    }

    #[test]
    fn two_declaring_entities_use_a_match() {
        let registry = build_hook_registry(&[
            hook("Compound", HookType::BeforeCreate, "a", 0),
            hook("DeviationReport", HookType::BeforeCreate, "b", 0),
        ]);
        assert!(registry.contains("match key(entity).as_str() {"));
        assert!(registry.contains("_ => {}"));
    }

    #[test]
    fn every_hook_type_gets_a_dispatch_function_even_with_no_hooks() {
        // The bus controller calls all of them unconditionally, so a model with
        // no hooks still has to produce a crate that compiles.
        let registry = build_hook_registry(&[]);
        for hook_type in HOOK_TYPES {
            assert!(
                registry.contains(&format!(
                    "pub async fn {}(entity: &str,",
                    hook_type.dispatch_name()
                )),
                "missing dispatch for {}",
                hook_type.as_str()
            );
        }
    }

    #[test]
    fn before_delete_short_circuits_on_a_refusal() {
        let registry =
            build_hook_registry(&[hook("Compound", HookType::BeforeDelete, "blockIt", 0)]);
        assert!(registry.contains("if !handlers::compound::block_it(id).await? {"));
        assert!(registry.contains("return Ok(false);"));
    }

    #[test]
    fn appending_keeps_a_hand_written_body() {
        let existing = build_hook_handler_module(
            "Compound",
            &[hook(
                "Compound",
                HookType::BeforeCreate,
                "generateInchiKey",
                0,
            )],
        )
        .replace("let _ = data;", "data.insert(\"k\".into(), Value::Null);");

        let appended = append_missing_handlers(
            "Compound",
            &[
                hook("Compound", HookType::BeforeCreate, "generateInchiKey", 0),
                hook("Compound", HookType::AfterCreate, "indexForSearch", 1),
            ],
            &existing,
        )
        .expect("a new hook must be appended");

        assert!(appended.contains("data.insert(\"k\".into(), Value::Null);"));
        assert!(appended.contains("pub async fn index_for_search"));
        assert_eq!(
            appended.matches("pub async fn generate_inchi_key").count(),
            1
        );
    }

    #[test]
    fn appending_nothing_when_every_hook_is_already_defined() {
        let hooks = [hook(
            "Compound",
            HookType::BeforeCreate,
            "generateInchiKey",
            0,
        )];
        let existing = build_hook_handler_module("Compound", &hooks);
        assert!(append_missing_handlers("Compound", &hooks, &existing).is_none());
    }

    #[test]
    fn defines_fn_requires_a_whole_word() {
        assert!(defines_fn("pub async fn notify(record: &Value)", "notify"));
        // A handler whose name is a suffix of another must not be mistaken for it.
        assert!(!defines_fn(
            "pub async fn renotify(record: &Value)",
            "notify"
        ));
        assert!(!defines_fn("// mentions notify in prose", "notify"));
    }
}
