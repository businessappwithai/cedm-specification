//! Loader for `language/appwithai-language.json`.
//!
//! The JSON is the single source of truth for EML's type vocabulary and
//! cardinality operators; the parser reads it rather than hard-coding a second
//! copy that can drift. A built-in fallback keeps generation working when the
//! file cannot be found — the same contract the TypeScript loader offered.

use std::collections::{BTreeMap, HashMap};
use std::path::{Path, PathBuf};

use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct RawDefinition {
    types: RawTypes,
    #[serde(default)]
    cardinalities: RawCardinalities,
    #[serde(rename = "workflowConstructs", default)]
    workflow_constructs: RawWorkflowConstructs,
}

#[derive(Debug, Default, Deserialize)]
struct RawWorkflowConstructs {
    #[serde(rename = "stepNodes", default)]
    step_nodes: RawStepNodes,
}

#[derive(Debug, Default, Deserialize)]
struct RawStepNodes {
    /// A *list*, each entry naming itself.
    ///
    /// It was an object keyed by name until the language definition was
    /// reconciled with the reference repository. Reading it as a map still
    /// deserialised — into an empty one — so every step type became unknown
    /// and every saga parsed to nothing, with no error anywhere. Hence the
    /// `name` field and the collect below rather than a `HashMap` here.
    #[serde(default)]
    types: Vec<RawStepNode>,
}

#[derive(Debug, Default, Clone, Deserialize)]
pub struct StepNodeSpec {
    #[serde(default)]
    pub required: Vec<String>,
    /// Groups where any one member satisfies the requirement — `UpdateEntity`
    /// takes a `value` or a `source`, not both.
    #[serde(rename = "oneOf", default)]
    pub one_of: Vec<Vec<String>>,
}

#[derive(Debug, Default, Clone, Deserialize)]
struct RawStepNode {
    name: String,
    #[serde(flatten)]
    spec: StepNodeSpec,
}

#[derive(Debug, Deserialize)]
struct RawTypes {
    #[serde(default)]
    map: HashMap<String, String>,
    #[serde(default = "default_type")]
    default: String,
}

#[derive(Debug, Default, Deserialize)]
struct RawCardinalities {
    /// Named `map` in the JSON but shaped as a list of operator/kind pairs.
    #[serde(default)]
    map: Vec<RawOperator>,
}

#[derive(Debug, Deserialize)]
struct RawOperator {
    operator: String,
    kind: String,
}

fn default_type() -> String {
    "string".to_string()
}

/// The subset of the language definition generation actually consults.
#[derive(Debug, Clone)]
pub struct Language {
    type_map: HashMap<String, String>,
    default_type: String,
    cardinalities: HashMap<String, String>,
    step_nodes: HashMap<String, StepNodeSpec>,
}

impl Language {
    /// Load the definition, falling back to the built-ins if it is unreachable.
    pub fn load() -> Self {
        match find_definition_file().and_then(|path| std::fs::read_to_string(path).ok()) {
            Some(raw) => match serde_json::from_str::<RawDefinition>(&raw) {
                Ok(def) => Self {
                    type_map: def.types.map,
                    default_type: def.types.default,
                    cardinalities: def
                        .cardinalities
                        .map
                        .into_iter()
                        .map(|op| (op.operator, op.kind))
                        .collect(),
                    step_nodes: def
                        .workflow_constructs
                        .step_nodes
                        .types
                        .into_iter()
                        .map(|node| (node.name, node.spec))
                        .collect(),
                },
                // A malformed definition is worth saying out loud: silently
                // falling back would generate an app off the wrong vocabulary.
                Err(err) => {
                    eprintln!("  ⚠️  appwithai-language.json could not be parsed ({err}); using built-in defaults");
                    Self::builtin()
                }
            },
            None => Self::builtin(),
        }
    }

    fn builtin() -> Self {
        let types: &[(&str, &str)] = &[
            ("string", "string"),
            ("varchar", "string"),
            ("text", "string"),
            ("char", "string"),
            ("uuid", "string"),
            ("email", "string"),
            ("url", "string"),
            ("phone", "string"),
            ("password", "string"),
            ("color", "string"),
            ("int", "integer"),
            ("integer", "integer"),
            ("bigint", "integer"),
            ("smallint", "integer"),
            ("serial", "integer"),
            ("number", "integer"),
            ("decimal", "decimal"),
            ("numeric", "decimal"),
            ("float", "decimal"),
            ("double", "decimal"),
            ("money", "decimal"),
            ("bool", "boolean"),
            ("boolean", "boolean"),
            ("date", "date"),
            ("datetime", "datetime"),
            ("timestamp", "datetime"),
            ("timestamptz", "datetime"),
            ("time", "datetime"),
            ("json", "json"),
            ("jsonb", "json"),
        ];
        let cardinalities: &[(&str, &str)] = &[
            ("||--||", "oneToOne"),
            ("||--o{", "oneToMany"),
            ("||--|{", "oneToMany"),
            ("}o--||", "manyToOne"),
            ("}|--||", "manyToOne"),
            ("}o--o{", "manyToMany"),
            ("}|--|{", "manyToMany"),
            ("|o--o|", "oneToOne"),
        ];

        Self {
            type_map: types
                .iter()
                .map(|(k, v)| (k.to_string(), v.to_string()))
                .collect(),
            default_type: "string".to_string(),
            cardinalities: cardinalities
                .iter()
                .map(|(k, v)| (k.to_string(), v.to_string()))
                .collect(),
            // No built-in fallback for step nodes. Guessing a step contract
            // would let a saga compile against a vocabulary nobody declared;
            // with none loaded, `is_step_node_type` rejects everything and the
            // diagnostics say why.
            step_nodes: HashMap::new(),
        }
    }

    /// Canonicalise an attribute type alias. A length suffix (`string(255)`) is
    /// part of the declaration, not the type, so it is stripped first.
    pub fn normalize_type(&self, raw: &str) -> String {
        let key = raw
            .split('(')
            .next()
            .unwrap_or(raw)
            .trim()
            .to_ascii_lowercase();
        self.type_map
            .get(&key)
            .cloned()
            .unwrap_or_else(|| self.default_type.clone())
    }

    pub fn cardinality_kind(&self, operator: &str) -> Option<&str> {
        self.cardinalities.get(operator).map(String::as_str)
    }

    pub fn is_step_node_type(&self, value: &str) -> bool {
        self.step_nodes.contains_key(value)
    }

    /// Which required properties a step is missing.
    ///
    /// An `oneOf` group is satisfied by any one member and is reported as
    /// `"value or source"` when none of them is present, so the diagnostic names
    /// the choice rather than every branch of it.
    pub fn missing_step_props(
        &self,
        node_type: &str,
        props: &BTreeMap<String, String>,
    ) -> Vec<String> {
        let Some(spec) = self.step_nodes.get(node_type) else {
            return vec![format!("unknown step type \"{node_type}\"")];
        };

        let has = |key: &str| {
            props
                .get(key)
                .map(|value| !value.trim().is_empty())
                .unwrap_or(false)
        };

        let mut missing: Vec<String> = spec
            .required
            .iter()
            .filter(|key| !has(key))
            .cloned()
            .collect();
        for group in &spec.one_of {
            if !group.iter().any(|key| has(key)) {
                missing.push(group.join(" or "));
            }
        }
        missing
    }
}

/// Find `appwithai-language.json`.
///
/// `APPWITHAI_LANGUAGE_FILE` wins, then a walk up from the executable and from
/// the working directory. The walk is what lets an installed binary — which
/// lives nowhere near the repo — still find a checkout's definition.
fn find_definition_file() -> Option<PathBuf> {
    if let Ok(env_path) = std::env::var("APPWITHAI_LANGUAGE_FILE") {
        let path = PathBuf::from(env_path);
        if path.is_file() {
            return Some(path);
        }
    }

    let mut starts: Vec<PathBuf> = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            starts.push(dir.to_path_buf());
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        starts.push(cwd);
    }
    // Compile-time location of this crate: the case that matters for
    // `cargo run` out of the workspace.
    starts.push(PathBuf::from(env!("CARGO_MANIFEST_DIR")));

    for start in starts {
        if let Some(found) = walk_up_for(&start, "language/appwithai-language.json") {
            return Some(found);
        }
    }
    None
}

pub(crate) fn walk_up_for(start: &Path, relative: &str) -> Option<PathBuf> {
    let mut dir = Some(start);
    for _ in 0..12 {
        let current = dir?;
        let candidate = current.join(relative);
        if candidate.exists() {
            return Some(candidate);
        }
        dir = current.parent();
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The shipped definition must actually load, not fall back.
    ///
    /// `load()` reports a parse failure and returns `builtin()`, which is right
    /// for a generator run outside a checkout and wrong for the definition this
    /// repository ships. When `stepNodes.types` changed from an object to a
    /// list, serde rejected the whole document: every step type became unknown,
    /// every saga parsed to nothing, and the type map quietly reverted to the
    /// built-in one — so a `text` column started coming out as a plain string.
    /// Five tests failed and none of them named the cause.
    #[test]
    fn the_shipped_definition_loads_rather_than_falling_back() {
        let lang = Language::load();
        assert!(
            lang.is_step_node_type("UpdateEntity"),
            "no step contracts loaded — the definition failed to parse and fell back"
        );
        assert!(!lang.cardinalities.is_empty(), "no cardinalities loaded");
    }

    #[test]
    fn aliases_canonicalise() {
        let lang = Language::builtin();
        assert_eq!(lang.normalize_type("varchar"), "string");
        assert_eq!(lang.normalize_type("VARCHAR(255)"), "string");
        assert_eq!(lang.normalize_type("timestamptz"), "datetime");
        // Unknown aliases fall back rather than failing generation.
        assert_eq!(lang.normalize_type("geography"), "string");
    }

    #[test]
    fn cardinality_operators_resolve() {
        let lang = Language::builtin();
        assert_eq!(lang.cardinality_kind("||--o{"), Some("oneToMany"));
        assert_eq!(lang.cardinality_kind("}o--||"), Some("manyToOne"));
        assert_eq!(lang.cardinality_kind("nonsense"), None);
    }
}
