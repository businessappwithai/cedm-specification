//! The CEDM application model, read into the model document every compiler
//! reads.
//!
//! A port of `language/cedm/{imports,lower}.ts`. A model written in CEDM —
//! entities in the domain library's own shape, imported from
//! `domain/entities/` or declared in the model, plus the application profile —
//! is checked against `language/cedm/cedm-model.schema.json`, its imports are
//! folded in, and it is lowered into a model document (`language/yaml`), which
//! `yaml_model` then reads exactly as it reads one written by hand. Nothing
//! after the lowering knows which language a model was written in.
//!
//! The port works on `serde_yaml::Value` rather than typed structs, for one
//! reason: a YAML mapping keeps its order, as a JavaScript object does. Help
//! is composed, and a structured default is written out, in the order the
//! author wrote it, and `serde_json` would sort it. `bun run parity` compares
//! this lowering with the TypeScript one, document for document.

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

use anyhow::{anyhow, bail, Context, Result};
use serde_yaml::{Mapping, Value};

const CEDM_SCHEMA: &str = include_str!("../../../language/cedm/cedm-model.schema.json");
const EML_SCHEMA: &str = include_str!("../../../language/yaml/eml.schema.json");
const EML_SCHEMA_ID: &str = "https://appwithai.dev/schema/eml/1.0/eml.schema.json";

/// Whether model text is a CEDM application model rather than a model document.
pub fn is_cedm_text(text: &str) -> bool {
    text.lines().any(|line| {
        let trimmed = line.trim_end();
        trimmed.starts_with("cedm:") || trimmed.starts_with("cedm :")
    })
}

/* -------------------------------------------------------------------------- */
/*  Names                                                                      */
/* -------------------------------------------------------------------------- */

/// `registeredById` → `registered_by_id`: `language/cedm/naming.ts`'s rule,
/// which is the checker's, character for character.
pub fn snake(name: &str) -> String {
    let chars: Vec<char> = name.chars().collect();
    // ([a-z0-9])([A-Z]) → $1_$2
    let mut first = String::with_capacity(name.len() + 4);
    for (i, &ch) in chars.iter().enumerate() {
        if i > 0
            && ch.is_ascii_uppercase()
            && (chars[i - 1].is_ascii_lowercase() || chars[i - 1].is_ascii_digit())
        {
            first.push('_');
        }
        first.push(ch);
    }
    // ([A-Z]+)([A-Z][a-z]) → $1_$2
    let chars: Vec<char> = first.chars().collect();
    let mut second = String::with_capacity(first.len() + 4);
    for (i, &ch) in chars.iter().enumerate() {
        if i > 0
            && ch.is_ascii_uppercase()
            && chars[i - 1].is_ascii_uppercase()
            && chars.get(i + 1).is_some_and(char::is_ascii_lowercase)
        {
            second.push('_');
        }
        second.push(ch);
    }
    second.to_lowercase()
}

/// `registered_by_id` → `registeredById`.
fn camel(name: &str) -> String {
    let mut out = String::with_capacity(name.len());
    let mut chars = name.chars().peekable();
    while let Some(ch) = chars.next() {
        if ch == '_' {
            while chars.peek() == Some(&'_') {
                chars.next();
            }
            match chars.peek() {
                Some(next) if next.is_ascii_alphanumeric() => {
                    out.push(next.to_ascii_uppercase());
                    chars.next();
                }
                _ => out.push('_'),
            }
        } else {
            out.push(ch);
        }
    }
    out
}

fn pascal(name: &str) -> String {
    let camel = camel(name);
    let mut chars = camel.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().chain(chars).collect(),
        None => String::new(),
    }
}

fn lower_first(name: &str) -> String {
    let mut chars = name.chars();
    match chars.next() {
        Some(first) => first.to_lowercase().chain(chars).collect(),
        None => String::new(),
    }
}

fn table_of(entity: &str) -> String {
    format!("bus_{}", snake(entity))
}

const PERSON_ROLE_COLUMNS: &[&str] = &[
    "assigned_to",
    "author_id",
    "lab_manager_id",
    "manager_id",
    "owner_id",
    "pi_id",
    "remediation_owner",
    "remediation_owner_id",
    "user_id",
];

/// The table a foreign-key column points at when nothing says otherwise.
fn derived_reference_table(column: &str) -> Option<String> {
    if PERSON_ROLE_COLUMNS.contains(&column) {
        return Some("bus_user".into());
    }
    let stripped = column.strip_prefix("parent_").unwrap_or(column);
    if PERSON_ROLE_COLUMNS.contains(&stripped) {
        return Some("bus_user".into());
    }
    if stripped.ends_with("_by_id") || stripped.ends_with("_by") {
        return Some("bus_user".into());
    }
    if stripped == "id" {
        return None;
    }
    stripped
        .strip_suffix("_id")
        .map(|stem| format!("bus_{stem}"))
}

/* -------------------------------------------------------------------------- */
/*  Small Value helpers                                                        */
/* -------------------------------------------------------------------------- */

fn key(name: &str) -> Value {
    Value::String(name.to_string())
}

fn get<'a>(value: &'a Value, name: &str) -> Option<&'a Value> {
    value.as_mapping().and_then(|map| map.get(key(name)))
}

fn get_str<'a>(value: &'a Value, name: &str) -> Option<&'a str> {
    get(value, name).and_then(Value::as_str)
}

fn get_seq<'a>(value: &'a Value, name: &str) -> &'a [Value] {
    get(value, name)
        .and_then(Value::as_sequence)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

fn set(map: &mut Mapping, name: &str, value: Value) {
    map.insert(key(name), value);
}

fn text(value: &str) -> Value {
    Value::String(value.to_string())
}

/// `String(value)` as JavaScript writes it.
fn js_string(value: &Value) -> String {
    match value {
        Value::String(s) => s.clone(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => js_number(n),
        Value::Null => "null".into(),
        other => json_text(other),
    }
}

fn js_number(n: &serde_yaml::Number) -> String {
    if let Some(i) = n.as_i64() {
        return i.to_string();
    }
    if let Some(u) = n.as_u64() {
        return u.to_string();
    }
    let f = n.as_f64().unwrap_or(0.0);
    if f.fract() == 0.0 && f.abs() < 1e21 {
        format!("{}", f as i64)
    } else {
        format!("{f}")
    }
}

/// `JSON.stringify(value)`: compact, keys in the order written.
fn json_text(value: &Value) -> String {
    match value {
        Value::Null => "null".into(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => js_number(n),
        Value::String(s) => serde_json::to_string(s).unwrap_or_default(),
        Value::Sequence(items) => format!(
            "[{}]",
            items.iter().map(json_text).collect::<Vec<_>>().join(",")
        ),
        Value::Mapping(map) => format!(
            "{{{}}}",
            map.iter()
                .map(|(k, v)| format!(
                    "{}:{}",
                    serde_json::to_string(&js_string(k)).unwrap_or_default(),
                    json_text(v)
                ))
                .collect::<Vec<_>>()
                .join(",")
        ),
        Value::Tagged(tagged) => json_text(&tagged.value),
    }
}

/// Help as one paragraph: `composeHelp` in `lower.ts`.
fn compose_help(help: Option<&Value>) -> Option<String> {
    let help = help?;
    if let Value::String(s) = help {
        return Some(s.clone());
    }
    let mut parts: Vec<String> = Vec::new();
    fn collect(value: &Value, parts: &mut Vec<String>) {
        match value {
            Value::String(s) => parts.push(s.clone()),
            Value::Sequence(items) => items.iter().for_each(|item| collect(item, parts)),
            Value::Mapping(map) => map.values().for_each(|item| collect(item, parts)),
            _ => {}
        }
    }
    collect(help, &mut parts);
    let count = parts.len();
    let text = parts
        .iter()
        .map(|part| part.split_whitespace().collect::<Vec<_>>().join(" "))
        .filter(|part| !part.is_empty())
        .map(|part| {
            if part.ends_with(['.', '!', '?']) || count == 1 {
                part
            } else {
                format!("{part}.")
            }
        })
        .collect::<Vec<_>>()
        .join(" ");
    (!text.is_empty()).then_some(text)
}

/* -------------------------------------------------------------------------- */
/*  Schema                                                                     */
/* -------------------------------------------------------------------------- */

fn validate(value: &Value) -> Result<()> {
    let schema: serde_json::Value =
        serde_json::from_str(CEDM_SCHEMA).context("the embedded CEDM schema is not JSON")?;
    let eml: serde_json::Value =
        serde_json::from_str(EML_SCHEMA).context("the embedded model schema is not JSON")?;
    // The CEDM schema reuses the model language's definitions by `$ref`, so
    // both are registered; nothing is fetched, which keeps the WASM build
    // working with no network.
    let registry = jsonschema::Registry::new()
        .add(EML_SCHEMA_ID, eml)
        .map_err(|error| anyhow!("the embedded model schema cannot be registered: {error}"))?
        .prepare()
        .map_err(|error| anyhow!("the embedded model schema cannot be registered: {error}"))?;
    let validator = jsonschema::options()
        .with_draft(jsonschema::Draft::Draft202012)
        .with_registry(&registry)
        .offline()
        .build(&schema)
        .map_err(|error| anyhow!("the embedded CEDM schema does not compile: {error}"))?;
    let as_json = serde_json::to_value(value)
        .context("the model contains a value JSON cannot hold (a non-string key?)")?;
    let problems: Vec<String> = validator
        .iter_errors(&as_json)
        .map(|error| {
            let at = error.instance_path().to_string();
            format!("  {} {error}", if at.is_empty() { "/" } else { &at })
        })
        .collect();
    if problems.is_empty() {
        return Ok(());
    }
    bail!(
        "the model does not match the CEDM application model ({} problem(s)):\n{}\n  \
         `appwithai validate <model>` reports each one at its line and column.",
        problems.len(),
        problems.join("\n")
    )
}

/* -------------------------------------------------------------------------- */
/*  The library                                                                */
/* -------------------------------------------------------------------------- */

/// The CEDM specification on disk: `domain/entities/` and `applications/`.
pub struct Library {
    root: Option<PathBuf>,
    model_directory: Option<PathBuf>,
    entities: HashMap<String, Value>,
}

fn walk_up(start: &Path) -> Option<PathBuf> {
    let mut directory = start
        .canonicalize()
        .ok()
        .or_else(|| Some(start.to_path_buf()))?;
    loop {
        if directory.join("specification/manifest.yaml").exists()
            && directory.join("domain").exists()
        {
            return Some(directory);
        }
        if !directory.pop() {
            return None;
        }
    }
}

/// The specification root: `CEDM_SPEC_ROOT`, or found by walking up from the
/// model, the working directory, then the executable.
pub fn locate_root(near: Option<&Path>) -> Option<PathBuf> {
    if let Ok(root) = std::env::var("CEDM_SPEC_ROOT") {
        let root = PathBuf::from(root);
        if root.join("specification/manifest.yaml").exists() {
            return Some(root);
        }
    }
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Some(near) = near {
        candidates.push(near.to_path_buf());
    }
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd);
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            candidates.push(parent.to_path_buf());
        }
    }
    candidates.iter().find_map(|candidate| walk_up(candidate))
}

impl Library {
    pub fn open(model_directory: Option<&Path>) -> Self {
        let root = locate_root(model_directory);
        let mut entities = HashMap::new();
        if let Some(root) = &root {
            let directory = root.join("domain/entities");
            let mut files: Vec<PathBuf> = std::fs::read_dir(&directory)
                .map(|entries| entries.filter_map(|e| e.ok().map(|e| e.path())).collect())
                .unwrap_or_default();
            files.sort();
            for file in files {
                let name = file.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if !name.ends_with(".yaml") || name == "index.yaml" || name == "README.yaml" {
                    continue;
                }
                let Ok(text) = std::fs::read_to_string(&file) else {
                    continue;
                };
                let Ok(document) = serde_yaml::from_str::<Value>(&text) else {
                    continue;
                };
                if let Some(entity) = get(&document, "entity") {
                    if let Some(entity_name) = get_str(entity, "name") {
                        let mut entity = entity.clone();
                        // Reference data is a file of its own beside the entity; the
                        // entity is handed out with the rows inlined, so nothing
                        // downstream reads a file.
                        if let (Some(reference), Value::Mapping(map)) = (
                            get_str(&entity, "referenceData").map(str::to_string),
                            &mut entity,
                        ) {
                            let rows =
                                std::fs::read_to_string(root.join("domain").join(&reference))
                                    .ok()
                                    .and_then(|t| serde_yaml::from_str::<Value>(&t).ok())
                                    .and_then(|doc| get(&doc, "referenceData").cloned());
                            if let Some(rows) = rows {
                                let mut data = Mapping::new();
                                set(
                                    &mut data,
                                    "key",
                                    get(&rows, "key").cloned().unwrap_or(Value::Null),
                                );
                                set(
                                    &mut data,
                                    "rows",
                                    get(&rows, "rows").cloned().unwrap_or(Value::Null),
                                );
                                set(map, "data", Value::Mapping(data));
                            }
                            map.remove(key("referenceData"));
                        }
                        entities.insert(entity_name.to_string(), entity);
                    }
                }
            }
        }
        Self {
            root,
            model_directory: model_directory.map(Path::to_path_buf),
            entities,
        }
    }

    fn entity(&self, name: &str) -> Option<Value> {
        self.entities.get(name).cloned()
    }

    fn module(&self, name: &str) -> Result<Option<Value>> {
        let mut places: Vec<PathBuf> = Vec::new();
        if let Some(directory) = &self.model_directory {
            places.push(directory.join(format!("{name}.cedm.yaml")));
            places.push(directory.join(name));
        }
        if let Some(root) = &self.root {
            places.push(root.join("applications").join(format!("{name}.cedm.yaml")));
        }
        let Some(file) = places.into_iter().find(|place| place.is_file()) else {
            return Ok(None);
        };
        let text = std::fs::read_to_string(&file)
            .with_context(|| format!("reading module {}", file.display()))?;
        let value: Value = serde_yaml::from_str(&text)
            .with_context(|| format!("reading module {}", file.display()))?;
        validate(&value).with_context(|| format!("module {}", file.display()))?;
        Ok(Some(value))
    }
}

/* -------------------------------------------------------------------------- */
/*  Imports                                                                    */
/* -------------------------------------------------------------------------- */

const LISTS: &[&str] = &[
    "enums",
    "hooks",
    "hookFlows",
    "triggers",
    "reports",
    "rules",
    "processes",
];

fn identity_keys(entity: &Value) -> Vec<String> {
    match get(entity, "identity").and_then(|identity| get(identity, "key")) {
        Some(Value::String(key)) => vec![key.clone()],
        Some(Value::Sequence(keys)) => keys
            .iter()
            .filter_map(|k| k.as_str().map(str::to_string))
            .collect(),
        _ => Vec::new(),
    }
}

fn merge_by_name(base: &[Value], over: &[Value]) -> Vec<Value> {
    let name = |v: &Value| get_str(v, "name").map(str::to_string);
    let mut merged: Vec<Value> = base
        .iter()
        .map(|item| {
            over.iter()
                .find(|candidate| name(candidate) == name(item))
                .unwrap_or(item)
                .clone()
        })
        .collect();
    for item in over {
        if !base.iter().any(|candidate| name(candidate) == name(item)) {
            merged.push(item.clone());
        }
    }
    merged
}

/// A local declaration refining an imported entity: `refineEntity`.
fn refine(base: &Value, over: &Value) -> Value {
    let mut merged = base.as_mapping().cloned().unwrap_or_default();
    for (k, v) in over.as_mapping().cloned().unwrap_or_default() {
        merged.insert(k, v);
    }
    let attributes = merge_by_name(get_seq(base, "attributes"), get_seq(over, "attributes"));
    set(&mut merged, "attributes", Value::Sequence(attributes));
    let relationships = merge_by_name(
        get_seq(base, "relationships"),
        get_seq(over, "relationships"),
    );
    if relationships.is_empty() {
        merged.remove(key("relationships"));
    } else {
        set(&mut merged, "relationships", Value::Sequence(relationships));
    }
    for section in ["ui", "persistence"] {
        let (b, o) = (get(base, section), get(over, section));
        if b.is_some() || o.is_some() {
            let mut combined = b.and_then(Value::as_mapping).cloned().unwrap_or_default();
            for (k, v) in o.and_then(Value::as_mapping).cloned().unwrap_or_default() {
                combined.insert(k, v);
            }
            set(&mut merged, section, Value::Mapping(combined));
        }
    }
    Value::Mapping(merged)
}

fn narrow(entity: Value, include: Option<&Value>, exclude: Option<&Value>) -> Value {
    if include.is_none() && exclude.is_none() {
        return entity;
    }
    let names = |list: Option<&Value>| -> Option<Vec<String>> {
        list.and_then(Value::as_sequence).map(|items| {
            items
                .iter()
                .filter_map(|i| i.as_str().map(str::to_string))
                .collect()
        })
    };
    let (include, exclude) = (names(include), names(exclude));
    let keys = identity_keys(&entity);
    let keep = |name: &str| {
        keys.iter().any(|k| k == name)
            || (include
                .as_ref()
                .is_none_or(|list| list.iter().any(|n| n == name))
                && !exclude
                    .as_ref()
                    .is_some_and(|list| list.iter().any(|n| n == name)))
    };
    let mut map = entity.as_mapping().cloned().unwrap_or_default();
    for section in ["attributes", "relationships"] {
        let kept: Vec<Value> = get_seq(&entity, section)
            .iter()
            .filter(|item| get_str(item, "name").is_some_and(keep))
            .cloned()
            .collect();
        set(&mut map, section, Value::Sequence(kept));
    }
    Value::Mapping(map)
}

struct Resolver<'a> {
    library: &'a Library,
    result: Mapping,
    entities: Vec<Value>,
    index_of: HashMap<String, usize>,
    origins: HashMap<String, &'static str>,
    used: Vec<String>,
    errors: Vec<String>,
    visiting: Vec<String>,
}

impl Resolver<'_> {
    fn add_entity(&mut self, entity: Value, origin: &'static str) {
        let Some(name) = get_str(&entity, "name").map(str::to_string) else {
            return;
        };
        if let Some(&existing) = self.index_of.get(&name) {
            self.entities[existing] = refine(&self.entities[existing], &entity);
            return;
        }
        self.index_of.insert(name.clone(), self.entities.len());
        self.entities.push(entity);
        self.origins.insert(name, origin);
    }

    fn append_lists(&mut self, from: &Value) {
        for list in LISTS {
            let items = get_seq(from, list);
            if items.is_empty() {
                continue;
            }
            let entry = self
                .result
                .entry(key(list))
                .or_insert_with(|| Value::Sequence(Vec::new()));
            if let Value::Sequence(target) = entry {
                target.extend(items.iter().cloned());
            }
        }
        for (section, list) in [("ui", "categories"), ("authorization", "permissions")] {
            let items = get(from, section).map(|s| get_seq(s, list)).unwrap_or(&[]);
            if items.is_empty() {
                continue;
            }
            let entry = self
                .result
                .entry(key(section))
                .or_insert_with(|| Value::Mapping(Mapping::new()));
            if let Value::Mapping(inner) = entry {
                let target = inner
                    .entry(key(list))
                    .or_insert_with(|| Value::Sequence(Vec::new()));
                if let Value::Sequence(target) = target {
                    target.extend(items.iter().cloned());
                }
            }
        }
    }

    fn import_from(&mut self, model: &Value) -> Result<()> {
        for item in get_seq(model, "imports") {
            if let Some(module) = get_str(item, "module") {
                if self.visiting.iter().any(|m| m == module) {
                    self.errors
                        .push(format!("CEDM103 module \"{module}\" imports itself"));
                    continue;
                }
                let Some(document) = self.library.module(module)? else {
                    self.errors
                        .push(format!("CEDM102 no application module named \"{module}\""));
                    continue;
                };
                self.visiting.push(module.to_string());
                self.import_from(&document)?;
                for entity in get_seq(&document, "entities") {
                    self.add_entity(entity.clone(), "module");
                }
                self.append_lists(&document);
                self.visiting.pop();
                continue;
            }
            let Some(name) = get_str(item, "entity") else {
                continue;
            };
            let Some(entity) = self.library.entity(name) else {
                self.errors
                    .push(format!("CEDM101 the CEDM library has no entity \"{name}\""));
                continue;
            };
            if !self.used.iter().any(|u| u == name) {
                self.used.push(name.to_string());
            }
            let narrowed = narrow(entity, get(item, "include"), get(item, "exclude"));
            self.add_entity(narrowed, "library");
        }
        Ok(())
    }

    /// The `extends` of an entity the model or the library defines.
    fn extends_of(&self, name: &str) -> Option<String> {
        let definition = self
            .index_of
            .get(name)
            .map(|&i| self.entities[i].clone())
            .or_else(|| self.library.entity(name))?;
        get_str(&definition, "extends").map(str::to_string)
    }

    /// Whether `name` is, directly or through a chain, a specialization of `root`.
    fn specializes(&self, name: &str, root: &str, seen: &mut Vec<String>) -> bool {
        let Some(next) = self.extends_of(name) else {
            return false;
        };
        if seen.iter().any(|s| s == name) {
            return false;
        }
        if next == root {
            return true;
        }
        seen.push(name.to_string());
        self.specializes(&next, root, seen)
    }

    fn flatten(&mut self, entity: Value, seen: &[String]) -> Value {
        let Some(parent_name) = get_str(&entity, "extends").map(str::to_string) else {
            return entity;
        };
        let name = get_str(&entity, "name").unwrap_or("").to_string();
        if seen.contains(&parent_name) {
            self.errors.push(format!(
                "CEDM104 {name} extends itself through {parent_name}"
            ));
            return entity;
        }
        let local = self
            .index_of
            .get(&parent_name)
            .map(|&i| self.entities[i].clone());
        let Some(parent_source) = local.or_else(|| self.library.entity(&parent_name)) else {
            return entity;
        };
        let mut chain = seen.to_vec();
        chain.push(name);
        let parent = self.flatten(parent_source, &chain);
        let parent_keys = identity_keys(&parent);
        let own: HashSet<String> = get_seq(&entity, "attributes")
            .iter()
            .filter_map(|a| get_str(a, "name").map(str::to_string))
            .collect();
        let own_relationships: HashSet<String> = get_seq(&entity, "relationships")
            .iter()
            .filter_map(|r| get_str(r, "name").map(str::to_string))
            .collect();
        let mut attributes: Vec<Value> = get_seq(&entity, "attributes").to_vec();
        attributes.extend(
            get_seq(&parent, "attributes")
                .iter()
                .filter(|a| {
                    get_str(a, "name")
                        .is_some_and(|n| !parent_keys.iter().any(|k| k == n) && !own.contains(n))
                })
                .cloned(),
        );
        // A parent's links to its own specializations (`Party.person`,
        // `Party.organization`) belong to the parent: see `flatten` in
        // `language/cedm/imports.ts`.
        let inherited: Vec<Value> = get_seq(&parent, "relationships")
            .iter()
            .filter(|r| {
                get_str(r, "name").is_some_and(|n| !own_relationships.contains(n))
                    && !get_str(r, "target").is_some_and(|target| {
                        self.specializes(target, &parent_name, &mut Vec::new())
                    })
            })
            .cloned()
            .collect();
        let mut map = entity.as_mapping().cloned().unwrap_or_default();
        set(&mut map, "attributes", Value::Sequence(attributes));
        if !inherited.is_empty() || get(&entity, "relationships").is_some() {
            let mut relationships = get_seq(&entity, "relationships").to_vec();
            relationships.extend(inherited);
            set(&mut map, "relationships", Value::Sequence(relationships));
        }
        Value::Mapping(map)
    }
}

/// Fold every import into one self-contained model: `resolveCedmImports`.
fn resolve_imports(document: &Value, library: &Library) -> Result<(Value, Vec<String>)> {
    let mut resolver = Resolver {
        library,
        result: Mapping::new(),
        entities: Vec::new(),
        index_of: HashMap::new(),
        origins: HashMap::new(),
        used: Vec::new(),
        errors: Vec::new(),
        visiting: Vec::new(),
    };
    set(
        &mut resolver.result,
        "cedm",
        get(document, "cedm").cloned().unwrap_or(text("1.0")),
    );
    if let Some(application) = get(document, "application") {
        set(&mut resolver.result, "application", application.clone());
    }
    resolver.import_from(document)?;
    for entity in get_seq(document, "entities") {
        resolver.add_entity(entity.clone(), "model");
    }
    resolver.append_lists(document);

    let mut index = 0;
    while index < resolver.entities.len() {
        let entity = resolver.entities[index].clone();
        let flattened = resolver.flatten(entity, &[]);
        resolver.entities[index] = flattened.clone();
        let name = get_str(&flattened, "name").unwrap_or("").to_string();
        if resolver.origins.get(&name) != Some(&"model") {
            let mut needed: Vec<String> = Vec::new();
            for relationship in get_seq(&flattened, "relationships") {
                let cardinality = get(relationship, "cardinality").map(js_string);
                if cardinality.as_deref().is_some_and(is_required_cardinality) {
                    if let Some(target) = get_str(relationship, "target") {
                        needed.push(target.to_string());
                    }
                }
            }
            for attribute in get_seq(&flattened, "attributes") {
                let is_reference =
                    get_str(attribute, "type").is_some_and(|t| t.eq_ignore_ascii_case("reference"));
                let optional = get(attribute, "required") == Some(&Value::Bool(false));
                if is_reference && !optional {
                    if let Some(target) = get_str(attribute, "target") {
                        needed.push(target.to_string());
                    }
                }
            }
            for target in needed {
                if resolver.index_of.contains_key(&target) {
                    continue;
                }
                let Some(found) = library.entity(&target) else {
                    continue;
                };
                if !resolver.used.contains(&target) {
                    resolver.used.push(target.clone());
                }
                resolver.add_entity(found, "library");
            }
        }
        index += 1;
    }

    if !resolver.errors.is_empty() {
        bail!(
            "the model's imports cannot be resolved:\n  {}",
            resolver.errors.join("\n  ")
        );
    }
    set(
        &mut resolver.result,
        "entities",
        Value::Sequence(resolver.entities),
    );
    // `cedm`, `application`, the lists and `entities` — the key order of the
    // TypeScript resolver is irrelevant to lowering, which reads by key.
    Ok((Value::Mapping(resolver.result), resolver.used))
}

fn is_required_cardinality(cardinality: &str) -> bool {
    cardinality == "1"
        || cardinality
            .strip_suffix("..*")
            .is_some_and(|n| n.parse::<u32>().is_ok_and(|n| n >= 1) && !n.starts_with('0'))
}

/* -------------------------------------------------------------------------- */
/*  Lowering                                                                   */
/* -------------------------------------------------------------------------- */

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum End {
    ExactlyOne,
    ZeroOrOne,
    ZeroOrMore,
    OneOrMore,
}

impl End {
    fn parse(cardinality: &str) -> Option<Self> {
        match cardinality {
            "1" => Some(Self::ExactlyOne),
            "0..1" => Some(Self::ZeroOrOne),
            "0..*" => Some(Self::ZeroOrMore),
            "1..*" => Some(Self::OneOrMore),
            _ => None,
        }
    }
    fn many(self) -> bool {
        matches!(self, Self::ZeroOrMore | Self::OneOrMore)
    }
    fn word(self) -> &'static str {
        match self {
            Self::ExactlyOne => "exactly-one",
            Self::ZeroOrOne => "zero-or-one",
            Self::ZeroOrMore => "zero-or-more",
            Self::OneOrMore => "one-or-more",
        }
    }
}

const LENGTH_TYPES: &[&str] = &["string", "varchar", "char"];

/// A CEDM type → the model language's type token: `lowerType`.
fn lower_type(ty: &str, key_type: Option<&str>, max_length: Option<&Value>) -> (String, bool) {
    let lower = ty.to_lowercase();
    match lower.as_str() {
        "reference" => return (key_type.unwrap_or("string").to_string(), true),
        "enum" => return ("string".into(), false),
        "currency_code" => return ("string(3)".into(), false),
        "country_code" => return ("string(2)".into(), false),
        "locale" => return ("string(35)".into(), false),
        "timezone" => return ("string(64)".into(), false),
        "value_object" => return ("json".into(), false),
        _ => {}
    }
    if let Some(length) = max_length {
        if LENGTH_TYPES.contains(&lower.as_str()) {
            return (format!("{ty}({})", js_string(length)), false);
        }
    }
    (ty.to_string(), false)
}

fn default_relationship_name(target: &str, many: bool) -> String {
    if many {
        format!("{}List", lower_first(target))
    } else {
        lower_first(target)
    }
}

struct EntityState {
    source: Value,
    name: String,
    document: Mapping,
    attributes: Vec<Value>,
    columns: HashMap<String, String>,
    physical: HashSet<String>,
    /// column → stated target; insertion order kept for the search below.
    references: Vec<(String, Option<String>)>,
}

impl EntityState {
    fn has_reference(&self, column: &str) -> bool {
        self.references.iter().any(|(c, _)| c == column)
    }
}

struct Pending {
    entity: usize,
    relationship: Value,
    end: End,
    paired: bool,
}

fn rel_str<'a>(relationship: &'a Value, name: &str) -> Option<&'a str> {
    get_str(relationship, name)
}

fn label_of(relationship: &Value, many: bool) -> Option<String> {
    if let Some(label) = rel_str(relationship, "label") {
        return Some(label.to_string());
    }
    let name = rel_str(relationship, "name").unwrap_or("");
    let target = rel_str(relationship, "target").unwrap_or("");
    if name == default_relationship_name(target, many) {
        return None;
    }
    Some(snake(name))
}

fn relationship_doc(
    from: &str,
    from_end: End,
    to: &str,
    to_end: End,
    label: Option<String>,
) -> Value {
    let mut map = Mapping::new();
    set(&mut map, "from", text(from));
    set(&mut map, "fromCardinality", text(from_end.word()));
    set(&mut map, "to", text(to));
    set(&mut map, "toCardinality", text(to_end.word()));
    if let Some(label) = label {
        set(&mut map, "label", Value::String(label));
    }
    Value::Mapping(map)
}

/// The foreign key a relationship's `foreignKey` names, or says is elsewhere.
enum ForeignKey {
    Auto,
    Named(String),
    None,
}

fn foreign_key_of(relationship: &Value) -> ForeignKey {
    match get(relationship, "foreignKey") {
        Some(Value::Bool(false)) => ForeignKey::None,
        Some(Value::String(name)) => ForeignKey::Named(name.clone()),
        _ => ForeignKey::Auto,
    }
}

/// Help for a key column a to-one relationship is held in: `keyHelp`.
fn key_help(relationship: &Value, holder: &str) -> String {
    compose_help(get(relationship, "help"))
        .or_else(|| get_str(relationship, "description").map(str::to_string))
        .unwrap_or_else(|| {
            format!(
                "The {} this {holder} refers to.",
                rel_str(relationship, "target").unwrap_or("")
            )
        })
}

/// Columns every generated table carries already: `MANAGED_COLUMNS`.
const MANAGED_COLUMNS: &[&str] = &[
    "version",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at",
    "deleted_by",
];

fn ensure_foreign_key(
    holder: &mut EntityState,
    target: &str,
    foreign_key: ForeignKey,
    hint: &str,
    optional: bool,
    help: String,
    errors: &mut Vec<String>,
) {
    match foreign_key {
        ForeignKey::None => return,
        ForeignKey::Named(name) => {
            if !holder.columns.contains_key(&name) {
                errors.push(format!(
                    "CEDM122 foreignKey \"{name}\" is not an attribute of {}",
                    holder.name
                ));
            }
            return;
        }
        ForeignKey::Auto => {}
    }
    if holder
        .references
        .iter()
        .any(|(_, referenced)| referenced.as_deref() == Some(target))
    {
        return;
    }
    if let Some(by_name) = holder.columns.get(&format!("{hint}Id")) {
        if holder.has_reference(by_name) {
            return;
        }
    }
    let column = format!("{}_id", snake(hint));
    if holder.physical.contains(&column) {
        return;
    }
    let mut attribute = Mapping::new();
    set(&mut attribute, "name", text(&column));
    set(&mut attribute, "type", text("string"));
    set(&mut attribute, "fk", Value::Bool(true));
    if optional {
        set(&mut attribute, "optional", Value::Bool(true));
    }
    if derived_reference_table(&column) != Some(table_of(target)) {
        set(&mut attribute, "references", text(target));
    }
    set(&mut attribute, "help", Value::String(help));
    holder.attributes.push(Value::Mapping(attribute));
    holder.physical.insert(column.clone());
    holder.references.push((column, Some(target.to_string())));
}

/// Lower a resolved CEDM model into a model document: `lowerCedmModel`.
fn lower(cedm: &Value) -> Result<Value> {
    let mut errors: Vec<String> = Vec::new();
    let sources = get_seq(cedm, "entities");
    let names: HashSet<String> = sources
        .iter()
        .filter_map(|e| get_str(e, "name").map(str::to_string))
        .collect();

    // ---- enums
    let mut enums: Vec<(String, Vec<String>)> = Vec::new();
    for declared in get_seq(cedm, "enums") {
        let name = get_str(declared, "name").unwrap_or("").to_string();
        let values = get_seq(declared, "values").iter().map(js_string).collect();
        enums.push((name, values));
    }
    // Labels and meanings the attributes state, by value list: `(labels, descriptions)`.
    // In the order the values were first described, which is the order written out.
    type Described = Vec<(String, String)>;
    let mut enum_details: HashMap<String, (Described, Described)> = HashMap::new();
    let mut publish_enum =
        |name: &str, values: Vec<String>, help: Option<&Value>, errors: &mut Vec<String>| {
            let details = enum_details.entry(name.to_string()).or_default();
            if let Some(help) = help.filter(|h| h.is_mapping()) {
                for value in &values {
                    if let Some(label) = get(help, "valueLabels")
                        .and_then(|labels| get(labels, value))
                        .and_then(Value::as_str)
                    {
                        if !details.0.iter().any(|(v, _)| v == value) {
                            details.0.push((value.clone(), label.to_string()));
                        }
                    }
                    if let Some(meaning) = get(help, "valueSemantics")
                        .and_then(|meant| get(meant, value))
                        .and_then(Value::as_str)
                    {
                        if !details.1.iter().any(|(v, _)| v == value) {
                            details.1.push((value.clone(), meaning.to_string()));
                        }
                    }
                }
            }
            if let Some((_, known)) = enums.iter().find(|(n, _)| n == name) {
                if *known != values {
                    errors.push(format!(
                        "CEDM110 value list \"{name}\" is declared twice with different values"
                    ));
                }
                return;
            }
            enums.push((name.to_string(), values));
        };

    // ---- aggregate roots
    let mut parents: HashMap<String, String> = HashMap::new();
    for entity in sources {
        if let (Some(name), Some(root)) =
            (get_str(entity, "name"), get_str(entity, "aggregateRoot"))
        {
            parents.insert(name.to_string(), root.to_string());
        }
    }
    for entity in sources {
        let name = get_str(entity, "name").unwrap_or("");
        for relationship in get_seq(entity, "relationships") {
            let end = get(relationship, "cardinality")
                .map(js_string)
                .and_then(|c| End::parse(&c));
            let target = rel_str(relationship, "target").unwrap_or("");
            if rel_str(relationship, "ownership") == Some("aggregate")
                && end.is_some_and(End::many)
                && target != name
                && names.contains(target)
                && !parents.contains_key(target)
            {
                parents.insert(target.to_string(), name.to_string());
            }
        }
    }

    // ---- entities and attributes
    let mut states: Vec<EntityState> = Vec::new();
    for entity in sources {
        let name = get_str(entity, "name").unwrap_or("").to_string();
        let keys = identity_keys(entity);
        let single_key = keys.len() == 1;
        let mut document = Mapping::new();
        set(&mut document, "name", text(&name));
        let help = compose_help(get(entity, "help"))
            .or_else(|| get_str(entity, "description").map(str::to_string));
        if let Some(help) = help {
            set(&mut document, "help", Value::String(help));
        }
        let ui = get(entity, "ui");
        if let Some(icon) = ui.and_then(|u| get(u, "icon")) {
            set(&mut document, "icon", icon.clone());
        }
        if let Some(parent) = parents.get(&name) {
            set(&mut document, "parent", text(parent));
        }
        let persistence = get(entity, "persistence");
        if let Some(mode) = persistence.and_then(|p| get(p, "concurrency")) {
            set(&mut document, "concurrency", mode.clone());
        }
        if let Some(label) = ui.and_then(|u| get(u, "label")) {
            set(&mut document, "label", label.clone());
        }
        for option in ["prefix", "softDelete", "audited"] {
            if let Some(value) = persistence.and_then(|p| get(p, option)) {
                set(&mut document, option, value.clone());
            }
        }

        let mut state = EntityState {
            source: entity.clone(),
            name: name.clone(),
            document,
            attributes: Vec::new(),
            columns: HashMap::new(),
            physical: HashSet::new(),
            references: Vec::new(),
        };

        let declared: HashSet<String> = get_seq(entity, "attributes")
            .iter()
            .filter_map(|a| get_str(a, "name").map(str::to_string))
            .collect();
        for key_name in &keys {
            if declared.contains(key_name) {
                continue;
            }
            let column = if single_key {
                "id".to_string()
            } else {
                snake(key_name)
            };
            state.columns.insert(key_name.clone(), column.clone());
            state.physical.insert(column.clone());
            let identity_type = get(entity, "identity")
                .and_then(|i| get_str(i, "type"))
                .unwrap_or("uuid");
            let mut attribute = Mapping::new();
            set(&mut attribute, "name", Value::String(column));
            set(
                &mut attribute,
                "type",
                Value::String(lower_type(identity_type, None, None).0),
            );
            set(&mut attribute, "pk", Value::Bool(true));
            state.attributes.push(Value::Mapping(attribute));
        }

        for attribute in get_seq(entity, "attributes") {
            let attribute_name = get_str(attribute, "name").unwrap_or("").to_string();
            let is_key = keys.contains(&attribute_name);
            let column = get_str(attribute, "column")
                .map(str::to_string)
                .unwrap_or_else(|| {
                    if is_key && single_key {
                        "id".to_string()
                    } else {
                        snake(&attribute_name)
                    }
                });
            state.columns.insert(attribute_name.clone(), column.clone());
            state.physical.insert(column.clone());
            // Provided by every generated table already, unless the model
            // keeps it with `systemManaged: false`.
            if MANAGED_COLUMNS.contains(&column.as_str())
                && !is_key
                && get(attribute, "systemManaged") != Some(&Value::Bool(false))
            {
                continue;
            }
            let ty = get_str(attribute, "type").unwrap_or("string");
            let target = get_str(attribute, "target");
            let dangling =
                ty.eq_ignore_ascii_case("reference") && target.is_some_and(|t| !names.contains(t));
            let (token, typed_reference) = lower_type(
                ty,
                get_str(attribute, "keyType"),
                get(attribute, "maxLength"),
            );
            let reference = typed_reference && !dangling;

            let mut lowered = Mapping::new();
            set(&mut lowered, "name", text(&column));
            set(&mut lowered, "type", Value::String(token));
            if is_key {
                set(&mut lowered, "pk", Value::Bool(true));
            }
            if reference {
                set(&mut lowered, "fk", Value::Bool(true));
            }
            if get(attribute, "unique") == Some(&Value::Bool(true)) {
                set(&mut lowered, "unique", Value::Bool(true));
            }
            if get(attribute, "required") == Some(&Value::Bool(false)) {
                set(&mut lowered, "optional", Value::Bool(true));
            }
            if let Some(comment) = get(attribute, "comment") {
                set(&mut lowered, "comment", comment.clone());
            }
            if let Some(shared) = get_str(attribute, "enum") {
                set(&mut lowered, "enum", text(shared));
            } else if let Some(values) = get(attribute, "values").and_then(Value::as_sequence) {
                let enum_name = get_str(attribute, "enumName")
                    .map(str::to_string)
                    .unwrap_or_else(|| format!("{name}{}", pascal(&attribute_name)));
                set(&mut lowered, "enum", text(&enum_name));
                publish_enum(
                    &enum_name,
                    values.iter().map(js_string).collect(),
                    get(attribute, "help"),
                    &mut errors,
                );
            }
            let help = compose_help(get(attribute, "help"))
                .or_else(|| get_str(attribute, "description").map(str::to_string));
            if let Some(help) = help {
                set(&mut lowered, "help", Value::String(help));
            }
            if let Some(ui) = get(attribute, "ui") {
                set(&mut lowered, "ui", ui.clone());
            }
            if let Some(default) = get(attribute, "default") {
                let written = match default {
                    Value::Mapping(_) | Value::Sequence(_) => json_text(default),
                    other => js_string(other),
                };
                set(&mut lowered, "default", Value::String(written));
            }
            if let Some(minimum) = get(attribute, "minimum") {
                set(&mut lowered, "min", minimum.clone());
            }
            if let Some(maximum) = get(attribute, "maximum") {
                set(&mut lowered, "max", maximum.clone());
            }
            if let Some(format) = get(attribute, "format") {
                set(&mut lowered, "format", format.clone());
            }
            if reference {
                if let Some(target) = target {
                    if derived_reference_table(&column) != Some(table_of(target)) {
                        set(&mut lowered, "references", text(target));
                    }
                }
                state
                    .references
                    .push((column.clone(), target.map(str::to_string)));
            }
            state.attributes.push(Value::Mapping(lowered));
        }

        let indexes = persistence.map(|p| get_seq(p, "indexes")).unwrap_or(&[]);
        if !indexes.is_empty() {
            let lowered: Vec<Value> = indexes
                .iter()
                .map(|index| {
                    let mut map = Mapping::new();
                    let columns: Vec<Value> = get_seq(index, "columns")
                        .iter()
                        .map(|c| {
                            let c = js_string(c);
                            Value::String(state.columns.get(&c).cloned().unwrap_or(c))
                        })
                        .collect();
                    set(&mut map, "columns", Value::Sequence(columns));
                    if let Some(unique) = get(index, "unique") {
                        set(&mut map, "unique", unique.clone());
                    }
                    Value::Mapping(map)
                })
                .collect();
            set(&mut state.document, "indexes", Value::Sequence(lowered));
        }
        states.push(state);
    }
    let state_index: HashMap<String, usize> = states
        .iter()
        .enumerate()
        .map(|(i, s)| (s.name.clone(), i))
        .collect();

    // ---- relationships
    let mut pending: Vec<Pending> = Vec::new();
    for (index, state) in states.iter().enumerate() {
        for relationship in get_seq(&state.source, "relationships") {
            let cardinality = get(relationship, "cardinality")
                .map(js_string)
                .unwrap_or_default();
            let end = match End::parse(&cardinality) {
                Some(end) => end,
                None if cardinality
                    .strip_suffix("..*")
                    .is_some_and(|n| !n.is_empty() && n.chars().all(|c| c.is_ascii_digit())) =>
                {
                    End::OneOrMore
                }
                None => {
                    errors.push(format!(
                        "CEDM130 {}.{} has cardinality \"{cardinality}\"",
                        state.name,
                        rel_str(relationship, "name").unwrap_or("")
                    ));
                    continue;
                }
            };
            if !names.contains(rel_str(relationship, "target").unwrap_or("")) {
                continue;
            }
            pending.push(Pending {
                entity: index,
                relationship: relationship.clone(),
                end,
                paired: false,
            });
        }
    }

    let entity_names: Vec<String> = states.iter().map(|s| s.name.clone()).collect();
    let counterpart = |pending: &[Pending], item_index: usize| -> Option<usize> {
        let item = &pending[item_index];
        let relationship = &item.relationship;
        if get(relationship, "inverseCardinality").is_some() {
            return None;
        }
        let entity_name = &entity_names[item.entity];
        let target = rel_str(relationship, "target").unwrap_or("");
        let candidates: Vec<usize> = pending
            .iter()
            .enumerate()
            .filter(|(i, other)| {
                *i != item_index
                    && !other.paired
                    && entity_names[other.entity] == target
                    && rel_str(&other.relationship, "target") == Some(entity_name.as_str())
                    && get(&other.relationship, "inverseCardinality").is_none()
            })
            .map(|(i, _)| i)
            .collect();
        if let Some(inverse) = rel_str(relationship, "inverse") {
            return candidates
                .into_iter()
                .find(|&i| rel_str(&pending[i].relationship, "name") == Some(inverse));
        }
        let own_name = rel_str(relationship, "name");
        if let Some(&named) = candidates
            .iter()
            .find(|&&i| rel_str(&pending[i].relationship, "inverse") == own_name)
        {
            return Some(named);
        }
        if candidates
            .iter()
            .any(|&i| rel_str(&pending[i].relationship, "inverse").is_some())
        {
            return None;
        }
        let outgoing = pending
            .iter()
            .filter(|other| {
                other.entity == item.entity
                    && rel_str(&other.relationship, "target") == Some(target)
                    && get(&other.relationship, "inverseCardinality").is_none()
                    && rel_str(&other.relationship, "inverse").is_none()
            })
            .count();
        if outgoing != 1 || candidates.len() != 1 {
            return None;
        }
        // Two to-one relationships that point at each other are the two halves
        // of a one-to-one.
        Some(candidates[0])
    };

    let mut relationships: Vec<Value> = Vec::new();
    for item_index in 0..pending.len() {
        if pending[item_index].paired {
            continue;
        }
        let other = counterpart(&pending, item_index);
        let (entity, end, relationship) = {
            let item = &pending[item_index];
            (item.entity, item.end, item.relationship.clone())
        };
        let entity_name = states[entity].name.clone();
        let target_name = rel_str(&relationship, "target").unwrap_or("").to_string();
        let target = state_index[&target_name];

        if let Some(other_index) = other {
            pending[other_index].paired = true;
            pending[item_index].paired = true;
            let (many, one) = if end.many() {
                (item_index, other_index)
            } else {
                (other_index, item_index)
            };
            let (many_end, one_end) = (pending[many].end, pending[one].end);
            if many_end.many() && one_end.many() {
                let both = if many_end == one_end {
                    many_end
                } else {
                    End::ZeroOrMore
                };
                relationships.push(relationship_doc(
                    &states[pending[many].entity].name,
                    both,
                    rel_str(&pending[many].relationship, "target").unwrap_or(""),
                    both,
                    label_of(&pending[many].relationship, true),
                ));
                continue;
            }
            if !many_end.many() {
                // One-to-one, declared on both sides. The key sits on the side
                // that cannot exist without the other (cardinality 1); failing
                // that, on the side that already holds a reference to the
                // other; failing that, on the one declared first.
                let (a, b) = (item_index, other_index);
                let holds_reference = |side: usize, referenced: &str| {
                    states[pending[side].entity]
                        .references
                        .iter()
                        .any(|(_, target)| target.as_deref() == Some(referenced))
                };
                let (a_end, b_end) = (pending[a].end, pending[b].end);
                let holder = if a_end == End::ExactlyOne && b_end != End::ExactlyOne {
                    a
                } else if (b_end == End::ExactlyOne && a_end != End::ExactlyOne)
                    || (holds_reference(b, &states[pending[a].entity].name)
                        && !holds_reference(a, &states[pending[b].entity].name))
                {
                    b
                } else {
                    a
                };
                let both = if a_end == End::ZeroOrOne && b_end == End::ZeroOrOne {
                    End::ZeroOrOne
                } else {
                    End::ExactlyOne
                };
                let holder_relationship = pending[holder].relationship.clone();
                let holder_entity = pending[holder].entity;
                let holder_target = rel_str(&holder_relationship, "target")
                    .unwrap_or("")
                    .to_string();
                let holder_name = states[holder_entity].name.clone();
                relationships.push(relationship_doc(
                    &holder_target,
                    both,
                    &holder_name,
                    both,
                    label_of(&holder_relationship, false),
                ));
                let hint = rel_str(&holder_relationship, "name")
                    .unwrap_or("")
                    .to_string();
                let help = key_help(&holder_relationship, &holder_name);
                ensure_foreign_key(
                    &mut states[holder_entity],
                    &holder_target,
                    foreign_key_of(&holder_relationship),
                    &hint,
                    pending[holder].end == End::ZeroOrOne,
                    help,
                    &mut errors,
                );
                continue;
            }
            relationships.push(relationship_doc(
                &states[pending[many].entity].name,
                End::ExactlyOne,
                rel_str(&pending[many].relationship, "target").unwrap_or(""),
                many_end,
                label_of(&pending[many].relationship, true),
            ));
            let one_relationship = pending[one].relationship.clone();
            let one_entity = pending[one].entity;
            let one_target = rel_str(&one_relationship, "target")
                .unwrap_or("")
                .to_string();
            let hint = rel_str(&one_relationship, "name").unwrap_or("").to_string();
            let help = key_help(&one_relationship, &states[one_entity].name.clone());
            ensure_foreign_key(
                &mut states[one_entity],
                &one_target,
                foreign_key_of(&one_relationship),
                &hint,
                one_end == End::ZeroOrOne,
                help,
                &mut errors,
            );
            continue;
        }

        let inverse = get(&relationship, "inverseCardinality")
            .map(js_string)
            .and_then(|c| End::parse(&c));

        if end.many() {
            let from_end = inverse.unwrap_or(End::ExactlyOne);
            relationships.push(relationship_doc(
                &entity_name,
                from_end,
                &target_name,
                end,
                label_of(&relationship, true),
            ));
            if !from_end.many() {
                let hint = if target == entity {
                    format!("parent{entity_name}")
                } else {
                    lower_first(&entity_name)
                };
                let help = format!("The {entity_name} this {} belongs to.", states[target].name);
                ensure_foreign_key(
                    &mut states[target],
                    &entity_name,
                    foreign_key_of(&relationship),
                    &hint,
                    rel_str(&relationship, "ownership") != Some("aggregate"),
                    help,
                    &mut errors,
                );
            }
            continue;
        }

        let label = label_of(&relationship, false);
        match inverse {
            None => relationships.push(relationship_doc(
                &target_name,
                End::ExactlyOne,
                &entity_name,
                End::ZeroOrMore,
                label,
            )),
            Some(inverse) => relationships.push(relationship_doc(
                &entity_name,
                inverse,
                &target_name,
                end,
                label,
            )),
        }
        let hint = rel_str(&relationship, "name").unwrap_or("").to_string();
        let help = key_help(&relationship, &entity_name);
        ensure_foreign_key(
            &mut states[entity],
            &target_name,
            foreign_key_of(&relationship),
            &hint,
            end == End::ZeroOrOne,
            help,
            &mut errors,
        );
    }

    // ---- lifecycles
    let mut machines: Vec<Value> = Vec::new();
    for state in &states {
        let lifecycles: Vec<Value> = match get(&state.source, "lifecycle") {
            Some(Value::Sequence(list)) => list.clone(),
            Some(single) => vec![single.clone()],
            None => Vec::new(),
        };
        for lifecycle in lifecycles {
            let transitions = get_seq(&lifecycle, "transitions");
            if transitions.is_empty() {
                continue;
            }
            let mut machine = Mapping::new();
            set(
                &mut machine,
                "name",
                text(
                    get_str(&lifecycle, "name")
                        .map(str::to_string)
                        .unwrap_or_else(|| format!("{}Lifecycle", state.name))
                        .as_str(),
                ),
            );
            set(&mut machine, "entity", text(&state.name));
            set(
                &mut machine,
                "states",
                get(&lifecycle, "states")
                    .cloned()
                    .unwrap_or(Value::Sequence(Vec::new())),
            );
            let lowered: Vec<Value> = transitions
                .iter()
                .map(|transition| {
                    let mut map = Mapping::new();
                    set(
                        &mut map,
                        "from",
                        get(transition, "from").cloned().unwrap_or(Value::Null),
                    );
                    set(
                        &mut map,
                        "to",
                        get(transition, "to").cloned().unwrap_or(Value::Null),
                    );
                    if let Some(action) = get(transition, "action") {
                        set(&mut map, "trigger", action.clone());
                    }
                    Value::Mapping(map)
                })
                .collect();
            set(&mut machine, "transitions", Value::Sequence(lowered));
            if let Some(title) = get(&lifecycle, "title") {
                set(&mut machine, "title", title.clone());
            }
            // No initial state: the first one listed, as `lowerLifecycle` does.
            let first = get_seq(&lifecycle, "states").first();
            if let Some(initial) = get(&lifecycle, "initial").or(first) {
                set(&mut machine, "initial", initial.clone());
            }
            if let Some(terminal) = get(&lifecycle, "terminal") {
                set(&mut machine, "final", terminal.clone());
            }
            machines.push(Value::Mapping(machine));
        }
    }

    // ---- rules: the model's own, then invariants with a condition
    let mut rules: Vec<Value> = get_seq(cedm, "rules").to_vec();
    const INVARIANT_EVENTS: &[&str] = &["beforeCreate", "beforeUpdate"];
    for state in &states {
        let checked: Vec<&Value> = get_seq(&state.source, "invariants")
            .iter()
            .filter(|invariant| get(invariant, "violatedWhen").is_some())
            .collect();
        if checked.is_empty() {
            continue;
        }
        let events_of = |invariant: &Value| -> Vec<String> {
            match get(invariant, "events").and_then(Value::as_sequence) {
                Some(events) => events.iter().map(js_string).collect(),
                None => INVARIANT_EVENTS.iter().map(|e| (*e).to_string()).collect(),
            }
        };
        let mut events: Vec<String> = Vec::new();
        for invariant in &checked {
            for event in events_of(invariant) {
                if !events.contains(&event) {
                    events.push(event);
                }
            }
        }
        for event in events {
            let applicable: Vec<&&Value> = checked
                .iter()
                .filter(|invariant| events_of(invariant).contains(&event))
                .collect();
            if applicable.is_empty() {
                continue;
            }
            let mut rule = Mapping::new();
            set(
                &mut rule,
                "name",
                Value::String(format!(
                    "{}Invariants{}",
                    lower_first(&state.name),
                    pascal(&event)
                )),
            );
            set(
                &mut rule,
                "title",
                Value::String(format!("{} invariants ({event})", state.name)),
            );
            set(&mut rule, "entity", text(&state.name));
            set(&mut rule, "event", text(&event));
            let node = |id: &str, label: String, ty: &str| {
                let mut map = Mapping::new();
                set(&mut map, "id", text(id));
                set(&mut map, "label", Value::String(label));
                set(&mut map, "type", text(ty));
                Value::Mapping(map)
            };
            set(
                &mut rule,
                "nodes",
                Value::Sequence(vec![
                    node("S", format!("Start: {} {event}", state.name), "start"),
                    node("E", "End: invariants hold".to_string(), "end"),
                ]),
            );
            let mut edge = Mapping::new();
            set(&mut edge, "from", text("S"));
            set(&mut edge, "to", text("E"));
            set(
                &mut rule,
                "edges",
                Value::Sequence(vec![Value::Mapping(edge)]),
            );
            let actions: Vec<Value> = applicable
                .iter()
                .map(|invariant| {
                    let id = get_str(invariant, "id").unwrap_or("");
                    let name: String = id
                        .chars()
                        .map(|c| {
                            if c.is_ascii_alphanumeric() || c == '_' || c == '-' {
                                c
                            } else {
                                '_'
                            }
                        })
                        .collect();
                    let message = get_str(invariant, "message")
                        .or_else(|| get_str(invariant, "rule"))
                        .unwrap_or("");
                    let mut action = Mapping::new();
                    set(&mut action, "name", Value::String(name));
                    set(&mut action, "type", text("validation-error"));
                    set(
                        &mut action,
                        "when",
                        get(invariant, "violatedWhen")
                            .cloned()
                            .unwrap_or(Value::Null),
                    );
                    let mut props = Mapping::new();
                    set(
                        &mut props,
                        "message",
                        Value::String(message.split_whitespace().collect::<Vec<_>>().join(" ")),
                    );
                    set(&mut action, "props", Value::Mapping(props));
                    Value::Mapping(action)
                })
                .collect();
            set(&mut rule, "actions", Value::Sequence(actions));
            rules.push(Value::Mapping(rule));
        }
    }

    // ---- entity workflows: a saga, and a rule that triggers it
    let mut entity_sagas: Vec<Value> = Vec::new();
    for state in &states {
        let declared = get_seq(&state.source, "workflows");
        if declared.is_empty() {
            continue;
        }
        let event_of = |workflow: &Value| {
            get_str(workflow, "event")
                .unwrap_or("afterUpdate")
                .to_string()
        };
        let mut events: Vec<String> = Vec::new();
        for workflow in declared {
            let saga_name = format!("{}{}", state.name, get_str(workflow, "name").unwrap_or(""));
            let mut saga = Mapping::new();
            set(&mut saga, "name", Value::String(saga_name));
            if let Some(title) = get(workflow, "title") {
                set(&mut saga, "title", title.clone());
            }
            set(&mut saga, "entity", text(&state.name));
            set(&mut saga, "operation", text("UPDATE"));
            set(&mut saga, "trigger", text("rule"));
            if let Some(description) = get(workflow, "description") {
                set(&mut saga, "description", description.clone());
            }
            let steps: Vec<Value> = get_seq(workflow, "steps")
                .iter()
                .map(|step| lower_workflow_step(step, &names))
                .collect();
            set(&mut saga, "steps", Value::Sequence(steps));
            entity_sagas.push(Value::Mapping(saga));
            let event = event_of(workflow);
            if !events.contains(&event) {
                events.push(event);
            }
        }
        for event in events {
            let mut rule = Mapping::new();
            set(
                &mut rule,
                "name",
                Value::String(format!(
                    "{}Workflows{}",
                    lower_first(&state.name),
                    pascal(&event)
                )),
            );
            set(
                &mut rule,
                "title",
                Value::String(format!("{} workflows ({event})", state.name)),
            );
            set(&mut rule, "entity", text(&state.name));
            set(&mut rule, "event", text(&event));
            let node = |id: &str, label: String, ty: &str| {
                let mut map = Mapping::new();
                set(&mut map, "id", text(id));
                set(&mut map, "label", Value::String(label));
                set(&mut map, "type", text(ty));
                Value::Mapping(map)
            };
            set(
                &mut rule,
                "nodes",
                Value::Sequence(vec![
                    node("S", format!("Start: {} {event}", state.name), "start"),
                    node("E", "End: workflows started".to_string(), "end"),
                ]),
            );
            let mut edge = Mapping::new();
            set(&mut edge, "from", text("S"));
            set(&mut edge, "to", text("E"));
            set(
                &mut rule,
                "edges",
                Value::Sequence(vec![Value::Mapping(edge)]),
            );
            let actions: Vec<Value> = declared
                .iter()
                .filter(|workflow| event_of(workflow) == event)
                .map(|workflow| {
                    let name = get_str(workflow, "name").unwrap_or("");
                    let mut action = Mapping::new();
                    set(&mut action, "name", text(name));
                    set(&mut action, "type", text("trigger-workflow"));
                    set(
                        &mut action,
                        "when",
                        get(workflow, "when").cloned().unwrap_or(Value::Null),
                    );
                    let mut props = Mapping::new();
                    set(
                        &mut props,
                        "workflow",
                        Value::String(format!("{}{}", state.name, name)),
                    );
                    if let Some(message) = get(workflow, "message") {
                        set(&mut props, "message", message.clone());
                    }
                    set(&mut action, "props", Value::Mapping(props));
                    Value::Mapping(action)
                })
                .collect();
            set(&mut rule, "actions", Value::Sequence(actions));
            rules.push(Value::Mapping(rule));
        }
    }

    // ---- authorization
    let mut rbac: Vec<Value> = Vec::new();
    let permissions = get(cedm, "authorization")
        .map(|a| get_seq(a, "permissions"))
        .unwrap_or(&[]);
    for permission in permissions {
        let resource = get_str(permission, "resource").unwrap_or("");
        let action = get_str(permission, "action").unwrap_or("");
        if get_str(permission, "effect") == Some("deny") {
            errors.push(format!(
                "CEDM160 a deny permission ({resource} {action}) cannot be generated"
            ));
            continue;
        }
        if get(permission, "scope").is_some() {
            errors.push(format!(
                "CEDM161 a scoped permission ({resource} {action}) cannot be generated"
            ));
            continue;
        }
        let roles: Vec<Value> = match get(permission, "subject") {
            Some(Value::Sequence(list)) => list.clone(),
            Some(single) => vec![single.clone()],
            None => Vec::new(),
        };
        let mut rule = Mapping::new();
        set(&mut rule, "entity", text(resource));
        set(&mut rule, "action", text(action));
        set(&mut rule, "roles", Value::Sequence(roles));
        rbac.push(Value::Mapping(rule));
    }

    if !errors.is_empty() {
        bail!(
            "the CEDM model cannot be generated:\n  {}",
            errors.join("\n  ")
        );
    }

    // ---- narrowed lookups: names become the columns that hold the references.
    // Mirrors the same step in `lower.ts`.
    for state in states.iter_mut() {
        let physical: HashSet<String> = state
            .attributes
            .iter()
            .filter_map(|a| get_str(a, "name").map(str::to_string))
            .collect();
        let relationship_names: HashSet<String> = get_seq(&state.source, "relationships")
            .iter()
            .filter_map(|r| get_str(r, "name").map(str::to_string))
            .collect();
        let column_of = |name: &str| -> Option<String> {
            if let Some(declared) = state.columns.get(name) {
                if physical.contains(declared) {
                    return Some(declared.clone());
                }
            }
            let key_column = format!("{}_id", snake(name));
            (relationship_names.contains(name) && physical.contains(&key_column))
                .then_some(key_column)
        };
        let mut wanted: Vec<(String, Vec<String>)> = Vec::new();
        for relationship in get_seq(&state.source, "relationships") {
            if let (Some(name), narrowed) = (
                get_str(relationship, "name"),
                get_seq(relationship, "narrowedBy"),
            ) {
                if !narrowed.is_empty() {
                    wanted.push((name.to_string(), narrowed.iter().map(js_string).collect()));
                }
            }
        }
        for attribute in get_seq(&state.source, "attributes") {
            if let (Some(name), narrowed) =
                (get_str(attribute, "name"), get_seq(attribute, "narrowedBy"))
            {
                if !narrowed.is_empty() {
                    wanted.push((name.to_string(), narrowed.iter().map(js_string).collect()));
                }
            }
        }
        for (holder, names) in wanted {
            let columns: Vec<Option<String>> = names.iter().map(|n| column_of(n)).collect();
            let holder_column = column_of(&holder);
            let target = holder_column.as_ref().and_then(|column| {
                state
                    .attributes
                    .iter()
                    .position(|a| get_str(a, "name") == Some(column.as_str()))
            });
            match (target, columns.iter().all(Option::is_some)) {
                (Some(index), true) => {
                    if let Value::Mapping(attribute) = &mut state.attributes[index] {
                        set(
                            attribute,
                            "narrowedBy",
                            Value::Sequence(
                                columns.into_iter().flatten().map(Value::String).collect(),
                            ),
                        );
                    }
                }
                _ => errors.push(format!(
                    "CEDM182 {}.{holder} is narrowed by {}, which are not all references of the entity",
                    state.name,
                    names.join(", ")
                )),
            }
        }
    }

    // ---- reference data: rows keyed by attribute become rows keyed by column
    // (`data` of each entity). Mirrors the same step in `lower.ts`.
    for state in states.iter_mut() {
        let Some(data) = get(&state.source, "data") else {
            continue;
        };
        let physical: HashSet<String> = state
            .attributes
            .iter()
            .filter_map(|a| get_str(a, "name").map(str::to_string))
            .collect();
        let relationship_names: HashSet<String> = get_seq(&state.source, "relationships")
            .iter()
            .filter_map(|r| get_str(r, "name").map(str::to_string))
            .collect();
        let column_of = |name: &str| -> Option<String> {
            if let Some(declared) = state.columns.get(name) {
                return Some(declared.clone());
            }
            let fk = format!("{}_id", snake(name));
            if relationship_names.contains(name) && physical.contains(&fk) {
                return Some(fk);
            }
            physical.contains(&snake(name)).then(|| snake(name))
        };
        let Some(key_column) = get_str(data, "key").and_then(column_of) else {
            errors.push(format!(
                "CEDM180 {} data names a key that is not one of its columns",
                state.name
            ));
            continue;
        };
        let mut rows: Vec<Value> = Vec::new();
        for row in get_seq(data, "rows") {
            let Value::Mapping(row) = row else {
                continue;
            };
            let mut lowered = Mapping::new();
            for (name, value) in row {
                let name = name.as_str().unwrap_or("");
                match column_of(name) {
                    Some(column) => set(&mut lowered, &column, value.clone()),
                    None => errors.push(format!(
                        "CEDM181 {} data has a value for \"{name}\", which is not one of its columns",
                        state.name
                    )),
                }
            }
            rows.push(Value::Mapping(lowered));
        }
        let mut data_doc = Mapping::new();
        set(&mut data_doc, "key", Value::String(key_column));
        set(&mut data_doc, "rows", Value::Sequence(rows));
        set(&mut state.document, "data", Value::Mapping(data_doc));
    }

    // ---- the document, in the language's key order
    let mut document = Mapping::new();
    set(&mut document, "eml", text("1.0"));
    if let Some(application) = get(cedm, "application") {
        for field in ["name", "version", "description"] {
            if let Some(value) = get(application, field) {
                set(&mut document, field, value.clone());
            }
        }
    }
    // Lists some attribute names; only those reach a dropdown, so only those get
    // a business table when the application asks for them.
    let enumeration_tables = get(cedm, "application")
        .is_some_and(|a| get(a, "enumerationTables") == Some(&Value::Bool(true)));
    let used_enums: HashSet<String> = states
        .iter()
        .flat_map(|s| s.attributes.iter())
        .filter_map(|a| get_str(a, "enum").map(str::to_string))
        .collect();
    let mut table_enums: Vec<String> = Vec::new();
    if !enums.is_empty() {
        let list = enums
            .into_iter()
            .map(|(name, values)| {
                let mut map = Mapping::new();
                set(&mut map, "name", Value::String(name.clone()));
                set(
                    &mut map,
                    "values",
                    Value::Sequence(values.into_iter().map(Value::String).collect()),
                );
                if enumeration_tables && used_enums.contains(&name) && !names.contains(&name) {
                    table_enums.push(name.clone());
                    set(&mut map, "table", Value::Bool(true));
                    if let Some((labels, descriptions)) = enum_details.get(&name) {
                        for (field, details) in [("labels", labels), ("descriptions", descriptions)]
                        {
                            if !details.is_empty() {
                                let mut entries = Mapping::new();
                                for (value, text_) in details {
                                    set(&mut entries, value, Value::String(text_.clone()));
                                }
                                set(&mut map, field, Value::Mapping(entries));
                            }
                        }
                    }
                }
                Value::Mapping(map)
            })
            .collect();
        set(&mut document, "enums", Value::Sequence(list));
    }
    let categories = get(cedm, "ui")
        .map(|u| get_seq(u, "categories"))
        .unwrap_or(&[]);
    if !categories.is_empty() {
        set(
            &mut document,
            "categories",
            Value::Sequence(categories.to_vec()),
        );
    }
    let column_maps: HashMap<String, HashMap<String, String>> = states
        .iter()
        .map(|s| (s.name.clone(), s.columns.clone()))
        .collect();
    let entities: Vec<Value> = states
        .into_iter()
        .map(|state| {
            let mut map = state.document;
            let indexes = map.remove(key("indexes"));
            set(&mut map, "attributes", Value::Sequence(state.attributes));
            if let Some(indexes) = indexes {
                set(&mut map, "indexes", indexes);
            }
            Value::Mapping(map)
        })
        .collect();
    set(&mut document, "entities", Value::Sequence(entities));
    if !relationships.is_empty() {
        set(
            &mut document,
            "relationships",
            Value::Sequence(relationships),
        );
    }
    let hooks: Vec<Value> = get_seq(cedm, "hooks")
        .iter()
        .map(|hook| {
            let entity = get_str(hook, "entity").unwrap_or("");
            let (Some(fields), Some(columns)) = (
                get(hook, "fields").and_then(Value::as_sequence),
                column_maps.get(entity),
            ) else {
                return hook.clone();
            };
            let mapped: Vec<Value> = fields
                .iter()
                .map(|f| {
                    let f = js_string(f);
                    Value::String(columns.get(&f).cloned().unwrap_or(f))
                })
                .collect();
            let mut map = hook.as_mapping().cloned().unwrap_or_default();
            set(&mut map, "fields", Value::Sequence(mapped));
            Value::Mapping(map)
        })
        .collect();
    for (name, list) in [
        ("hooks", hooks),
        ("hookFlows", get_seq(cedm, "hookFlows").to_vec()),
    ] {
        if !list.is_empty() {
            set(&mut document, name, Value::Sequence(list));
        }
    }
    if !rbac.is_empty() {
        set(&mut document, "rbac", Value::Sequence(rbac));
    }
    for (name, list) in [
        ("triggers", get_seq(cedm, "triggers").to_vec()),
        ("reports", get_seq(cedm, "reports").to_vec()),
        ("rules", rules),
        ("stateMachines", machines),
        ("sagas", {
            let mut sagas = get_seq(cedm, "processes").to_vec();
            sagas.extend(entity_sagas);
            sagas
        }),
    ] {
        if !list.is_empty() {
            set(&mut document, name, Value::Sequence(list));
        }
    }
    add_enumeration_tables(&mut document, &table_enums);
    Ok(Value::Mapping(document))
}

/// A workflow step as a saga step: an entity named by its CEDM name is written as
/// its table, and `fields` given as a mapping is the JSON text the executor reads.
/// Mirrors `lowerWorkflowStep` in `language/cedm/lower.ts`.
fn lower_workflow_step(step: &Value, entity_names: &HashSet<String>) -> Value {
    let mut out = Mapping::new();
    set(
        &mut out,
        "id",
        get(step, "id").cloned().unwrap_or(Value::Null),
    );
    set(
        &mut out,
        "type",
        get(step, "type").cloned().unwrap_or(Value::Null),
    );
    if let Some(label) = get(step, "label") {
        set(&mut out, "label", label.clone());
    }
    if let Some(Value::Mapping(properties)) = get(step, "properties") {
        let mut lowered = Mapping::new();
        for (name, value) in properties {
            let key_name = name.as_str().unwrap_or("");
            let written = match value {
                Value::String(text_) => {
                    if key_name == "entity" && entity_names.contains(text_) {
                        table_of(text_)
                    } else {
                        text_.clone()
                    }
                }
                other => json_text(other),
            };
            set(&mut lowered, key_name, Value::String(written));
        }
        if !lowered.is_empty() {
            set(&mut out, "properties", Value::Mapping(lowered));
        }
    }
    Value::Mapping(out)
}

/// The category the business tables of enumerations are listed under.
const ENUMERATION_CATEGORY: &str = "Reference Data";

/// `SalesOrderStatus` → `sales order status`.
fn words_of(name: &str) -> String {
    let chars: Vec<char> = name.chars().collect();
    let mut out = String::new();
    for (index, c) in chars.iter().enumerate() {
        if index > 0 {
            let before = chars[index - 1];
            let after = chars.get(index + 1);
            if c.is_ascii_uppercase()
                && (before.is_ascii_lowercase()
                    || before.is_ascii_digit()
                    || (before.is_ascii_uppercase() && after.is_some_and(char::is_ascii_lowercase)))
            {
                out.push(' ');
            }
        }
        out.push(c.to_ascii_lowercase());
    }
    out
}

/// Give every enumeration in `table_enums` a business table: an entity named like
/// the list, with the columns `specification/enumeration-semantics.yaml` fixes.
/// Mirrors `addEnumerationTables` in `language/cedm/lower.ts`.
fn add_enumeration_tables(document: &mut Mapping, table_enums: &[String]) {
    if table_enums.is_empty() {
        return;
    }
    let attribute = |pairs: &[(&str, Value)]| {
        let mut map = Mapping::new();
        for (name, value) in pairs {
            set(&mut map, name, value.clone());
        }
        Value::Mapping(map)
    };
    let mut entities = document
        .get(key("entities"))
        .and_then(Value::as_sequence)
        .cloned()
        .unwrap_or_default();
    for name in table_enums {
        let mut entity = Mapping::new();
        set(&mut entity, "name", text(name));
        set(
            &mut entity,
            "help",
            Value::String(format!(
                "The values of {}, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.",
                words_of(name)
            )),
        );
        set(&mut entity, "icon", text("list"));
        set(
            &mut entity,
            "attributes",
            Value::Sequence(vec![
                attribute(&[("name", text("id")), ("type", text("uuid")), ("pk", Value::Bool(true))]),
                attribute(&[
                    ("name", text("code")),
                    ("type", text("string(100)")),
                    ("unique", Value::Bool(true)),
                    ("help", text("The value stored on every record that uses this list. Fixed once created.")),
                ]),
                attribute(&[
                    ("name", text("name")),
                    ("type", text("string(200)")),
                    ("help", text("What a person reads in the dropdown and on a record.")),
                ]),
                attribute(&[
                    ("name", text("description")),
                    ("type", text("text")),
                    ("optional", Value::Bool(true)),
                    ("help", text("What the value means to the business.")),
                ]),
                attribute(&[
                    ("name", text("sequence")),
                    ("type", text("integer")),
                    ("help", text("The position of the value in a dropdown, lowest first.")),
                ]),
                attribute(&[
                    ("name", text("is_active")),
                    ("type", text("boolean")),
                    ("default", text("true")),
                    ("help", text("Whether the value is offered on new records.")),
                ]),
            ]),
        );
        entities.push(Value::Mapping(entity));
    }
    set(document, "entities", Value::Sequence(entities));

    let mut categories = document
        .get(key("categories"))
        .and_then(Value::as_sequence)
        .cloned()
        .unwrap_or_default();
    let made: Vec<Value> = table_enums.iter().map(|n| text(n)).collect();
    let existing = categories
        .iter_mut()
        .find(|category| get_str(category, "name") == Some(ENUMERATION_CATEGORY));
    if let Some(Value::Mapping(category)) = existing {
        let mut listed = category
            .get(key("entities"))
            .and_then(Value::as_sequence)
            .cloned()
            .unwrap_or_default();
        listed.extend(made);
        set(category, "entities", Value::Sequence(listed));
    } else {
        let mut category = Mapping::new();
        set(&mut category, "name", text(ENUMERATION_CATEGORY));
        set(&mut category, "icon", text("list"));
        set(&mut category, "entities", Value::Sequence(made));
        categories.push(Value::Mapping(category));
    }
    set(document, "categories", Value::Sequence(categories));
}

/// What reading a CEDM model produces.
pub struct ReadCedm {
    /// The model document it lowers to, as YAML text the model reader accepts.
    pub document: Value,
    /// Library entities the model used.
    pub library_entities: Vec<String>,
}

/// Read CEDM text: schema, imports, lowering.
pub fn read_cedm(text: &str, model_directory: Option<&Path>) -> Result<ReadCedm> {
    let value: Value = serde_yaml::from_str(text).map_err(|error| match error.location() {
        Some(location) => anyhow!(
            "line {}, column {}: {error}",
            location.line(),
            location.column()
        ),
        None => anyhow!("{error}"),
    })?;
    validate(&value)?;
    let library = Library::open(model_directory);
    let (resolved, library_entities) = resolve_imports(&value, &library)?;
    let document = lower(&resolved)?;
    Ok(ReadCedm {
        document,
        library_entities,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snake_matches_the_language_rule() {
        assert_eq!(snake("registeredById"), "registered_by_id");
        assert_eq!(snake("KYCRecord"), "kyc_record");
        assert_eq!(snake("deliveryLocation"), "delivery_location");
        assert_eq!(snake("ph7Value"), "ph7_value");
    }

    #[test]
    fn help_is_joined_in_the_order_written() {
        let help: Value =
            serde_yaml::from_str("{summary: A thing, businessMeaning: What it means.}").unwrap();
        assert_eq!(
            compose_help(Some(&help)).as_deref(),
            Some("A thing. What it means.")
        );
    }

    #[test]
    fn a_structured_default_keeps_its_key_order() {
        let value: Value = serde_yaml::from_str("{currency: EUR, amount: 0}").unwrap();
        assert_eq!(json_text(&value), r#"{"currency":"EUR","amount":0}"#);
    }

    #[test]
    fn a_named_reference_states_its_target_where_the_name_would_not() {
        let model: Value = serde_yaml::from_str(
            "cedm: '1.0'\nentities:\n  - name: Location\n  - name: Shipment\n    relationships:\n      - {name: deliveryLocation, target: Location, cardinality: '0..1'}\n",
        )
        .unwrap();
        let document = lower(&model).unwrap();
        let shipment = &get_seq(&document, "entities")[1];
        let column = &get_seq(shipment, "attributes")[0];
        assert_eq!(get_str(column, "name"), Some("delivery_location_id"));
        assert_eq!(get_str(column, "references"), Some("Location"));
    }
}
