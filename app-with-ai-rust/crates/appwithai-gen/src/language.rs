//! Loader for `language/appwithai-language.json`.
//!
//! The JSON is the single source of truth for the model language's type
//! vocabulary, relationship cardinalities and saga step contracts; the compilers
//! read it rather than hard-coding a second copy that can drift. There is no
//! built-in fallback: a generator that could not find the definition used to
//! carry on with a copy of it, which read `text` as `string` and reported
//! nothing. A missing or malformed definition is an error that says where it
//! looked.

use std::collections::{BTreeMap, HashMap};
use std::path::{Path, PathBuf};

use anyhow::{anyhow, Context, Result};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct RawDefinition {
    types: RawTypes,
    cardinalities: RawCardinalities,
    #[serde(rename = "workflowConstructs")]
    workflow_constructs: RawWorkflowConstructs,
}

#[derive(Debug, Deserialize)]
struct RawWorkflowConstructs {
    #[serde(rename = "stepNodes")]
    step_nodes: RawStepNodes,
}

#[derive(Debug, Deserialize)]
struct RawStepNodes {
    /// A *list*, each entry naming itself.
    ///
    /// It was an object keyed by name until the language definition was
    /// reconciled with the reference repository. Reading it as a map still
    /// deserialised — into an empty one — so every step type became unknown
    /// and every saga parsed to nothing, with no error anywhere. Hence the
    /// `name` field and the collect below rather than a `HashMap` here.
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
    map: HashMap<String, String>,
    default: String,
}

#[derive(Debug, Deserialize)]
struct RawCardinalities {
    /// Named `map` in the JSON but shaped as a list of end pairs and the kind
    /// they make.
    map: Vec<RawCardinality>,
}

#[derive(Debug, Deserialize)]
struct RawCardinality {
    from: String,
    to: String,
    kind: String,
}

/// The subset of the language definition generation actually consults.
#[derive(Debug, Clone)]
pub struct Language {
    type_map: HashMap<String, String>,
    default_type: String,
    /// `(from end, to end)` → kind.
    cardinalities: HashMap<(String, String), String>,
    step_nodes: HashMap<String, StepNodeSpec>,
}

impl Language {
    /// Load the definition. Fails, naming where it looked, when the file is
    /// missing or does not parse.
    pub fn load() -> Result<Self> {
        let path = find_definition_file().ok_or_else(|| {
            anyhow!(
                "language/appwithai-language.json was not found. Set APPWITHAI_LANGUAGE_FILE \
                 to its path, or run from inside a checkout."
            )
        })?;
        let raw = std::fs::read_to_string(&path)
            .with_context(|| format!("reading {}", path.display()))?;
        Self::from_json(&raw).with_context(|| format!("parsing {}", path.display()))
    }

    /// Build the vocabulary from the definition's text.
    pub fn from_json(raw: &str) -> Result<Self> {
        let def: RawDefinition = serde_json::from_str(raw)?;
        if def.cardinalities.map.is_empty() {
            return Err(anyhow!("the definition declares no cardinalities"));
        }
        Ok(Self {
            type_map: def.types.map,
            default_type: def.types.default,
            cardinalities: def
                .cardinalities
                .map
                .into_iter()
                .map(|entry| ((entry.from, entry.to), entry.kind))
                .collect(),
            step_nodes: def
                .workflow_constructs
                .step_nodes
                .types
                .into_iter()
                .map(|node| (node.name, node.spec))
                .collect(),
        })
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

    /// The kind of relationship two ends make, or `None` for a pair the
    /// language does not define.
    pub fn cardinality_kind(&self, from: &str, to: &str) -> Option<&str> {
        self.cardinalities
            .get(&(from.to_string(), to.to_string()))
            .map(String::as_str)
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

    /// The shipped definition must load, with every section the compilers read.
    ///
    /// When `stepNodes.types` changed from an object to a list, serde rejected
    /// the whole document and the generator of the day quietly fell back to a
    /// built-in vocabulary — every step type became unknown and a `text` column
    /// came out a plain string. There is no fallback now; this is the gate that
    /// the definition still parses.
    #[test]
    fn the_shipped_definition_loads() {
        let lang = Language::load().expect("the shipped definition loads");
        assert!(
            lang.is_step_node_type("UpdateEntity"),
            "no step contracts loaded"
        );
        assert!(!lang.cardinalities.is_empty(), "no cardinalities loaded");
    }

    #[test]
    fn aliases_canonicalise() {
        let lang = Language::load().expect("language definition");
        assert_eq!(lang.normalize_type("varchar"), "string");
        assert_eq!(lang.normalize_type("VARCHAR(255)"), "string");
        assert_eq!(lang.normalize_type("timestamp"), "datetime");
        // An alias the language does not know takes the definition's default.
        assert_eq!(lang.normalize_type("geography"), "string");
    }

    #[test]
    fn cardinality_ends_resolve() {
        let lang = Language::load().expect("language definition");
        assert_eq!(
            lang.cardinality_kind("exactly-one", "zero-or-more"),
            Some("oneToMany")
        );
        assert_eq!(
            lang.cardinality_kind("zero-or-more", "exactly-one"),
            Some("manyToOne")
        );
        assert_eq!(lang.cardinality_kind("zero-or-one", "zero-or-more"), None);
    }

    #[test]
    fn a_definition_without_cardinalities_is_refused() {
        let err = Language::from_json(
            r#"{"types":{"map":{},"default":"string"},"cardinalities":{"map":[]},"workflowConstructs":{"stepNodes":{"types":[]}}}"#,
        ).expect_err("refused");
        assert!(err.to_string().contains("no cardinalities"));
    }
}
