//! Reading a model, in whichever syntax it is written, into model records.
//!
//! A port of `packages/generator/src/model/read-eml.ts` plus the YAML entry.
//! `*.yaml` / `*.yml` is the YAML model language — the source of truth — and
//! anything else is EML. Everything after this module works on records.

use std::path::PathBuf;

use anyhow::{bail, Context, Result};

use crate::category;
use crate::hooks;
use crate::language::Language;
use crate::model;
use crate::rbac;
use crate::records::ModelRecords;
use crate::reports;
use crate::rules;
use crate::saga;
use crate::workflows;
use crate::yaml_model;

/// `%%meta description:` — the first in the document, as the TypeScript reader
/// takes it.
fn model_description(source: &str) -> Option<String> {
    source.lines().find_map(|raw| {
        let rest = raw.trim().strip_prefix("%%meta")?;
        if !rest.starts_with(char::is_whitespace) {
            return None;
        }
        let rest = rest.trim_start().strip_prefix("description")?;
        let text = rest.trim_start().strip_prefix(':')?.trim();
        (!text.is_empty()).then(|| text.to_string())
    })
}

/// Read everything an EML document declares. Nothing is compiled.
pub fn read_eml_model(source: &str, lang: &Language, mut warn: impl FnMut(String)) -> ModelRecords {
    let (sagas, saga_diagnostics) = saga::read_saga_directives(source);
    for diagnostic in saga_diagnostics {
        let where_ = match &diagnostic.node_id {
            Some(node_id) => format!("{}.{node_id}", diagnostic.workflow),
            None => diagnostic.workflow.clone(),
        };
        eprintln!("  ⚠️  saga {where_}: {}", diagnostic.message);
    }

    ModelRecords {
        description: model_description(source),
        erd: model::read_erd(source, lang),
        categories: category::read_category_directives(source),
        rbac: rbac::read_rbac_directives(source, &mut warn),
        hooks: hooks::read_hook_directives(source, &mut warn),
        reports: reports::read_report_directives(source, &mut warn),
        rules: rules::extract_rule_sections(source)
            .iter()
            .map(rules::read_rule_section)
            .collect(),
        state_machines: workflows::read_state_machines(source),
        sagas,
    }
}

/// Read the model files a command was given.
///
/// Several files are EML's multi-file mode and are read as one document; a
/// YAML model is always a single document.
pub fn read_model_files(
    paths: &[PathBuf],
    lang: &Language,
    warn: impl FnMut(String),
) -> Result<ModelRecords> {
    let yaml: Vec<&PathBuf> = paths
        .iter()
        .filter(|path| yaml_model::is_model_yaml_path(path))
        .collect();

    if !yaml.is_empty() {
        if paths.len() != 1 {
            bail!(
                "--sys-file / --bus-file / --ref-file read EML; a YAML model is one document. \
                 Pass it as a single --input."
            );
        }
        let path = yaml[0];
        let text = std::fs::read_to_string(path)
            .with_context(|| format!("reading model file {}", path.display()))?;
        return yaml_model::read_model_yaml(&text)
            .with_context(|| format!("reading YAML model {}", path.display()));
    }

    let mut sources = Vec::new();
    for path in paths {
        sources.push(
            std::fs::read_to_string(path)
                .with_context(|| format!("reading model file {}", path.display()))?,
        );
    }
    Ok(read_eml_model(&sources.join("\n"), lang, warn))
}
