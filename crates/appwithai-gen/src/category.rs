//! `%%category` directive parsing.
//!
//! Categories group business entities into dashboard sections. They are
//! declared on Mermaid comment lines, which is why this reads the raw model
//! source rather than the parsed ERD:
//!
//! ```text
//! %%category name: Compound Registry; icon: FlaskConical; \
//!            color: #6366f1; entities: Compound, CompoundAlias
//! ```
//!
//! Port of `packages/generator/src/parsers/category.parser.ts`.

use std::collections::BTreeMap;

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Category {
    pub name: String,
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(rename = "seqNo")]
    pub seq_no: i64,
    #[serde(rename = "isDefault")]
    pub is_default: bool,
    /// ERD entity names assigned to this category.
    pub entities: Vec<String>,
}

/// A stable short identifier derived from the display name.
pub fn slugify(name: &str) -> String {
    let mut out = String::new();
    let mut prev_dash = false;
    for ch in name.trim().to_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch);
            prev_dash = false;
        } else if !prev_dash {
            out.push('-');
            prev_dash = true;
        }
    }
    out.trim_matches('-').chars().take(50).collect()
}

/// Join lines ending in a backslash with the line that follows, stripping a
/// leading `%%` from continuations so wrapped directives stay commented.
fn unfold(source: &str) -> Vec<String> {
    let mut joined: Vec<String> = Vec::new();

    for raw in source.replace("\r\n", "\n").lines() {
        let line = raw.trim().to_string();
        if let Some(previous) = joined.last_mut() {
            if previous.ends_with('\\') {
                previous.truncate(previous.len() - 1);
                let head = previous.trim_end().to_string();
                let tail = line
                    .strip_prefix("%%")
                    .map(|rest| rest.trim_start())
                    .unwrap_or(&line);
                *previous = format!("{head} {tail}");
                continue;
            }
        }
        joined.push(line);
    }

    joined
}

/// Split `a: 1; b: 2` into key/value pairs, tolerating empty segments.
fn parse_fields(body: &str) -> BTreeMap<String, String> {
    let mut fields = BTreeMap::new();
    for segment in body.split(';') {
        let trimmed = segment.trim();
        if trimmed.is_empty() {
            continue;
        }
        let Some(separator) = trimmed.find(':') else {
            continue;
        };
        if separator == 0 {
            continue;
        }
        let key = trimmed[..separator].trim().to_lowercase();
        let value = trimmed[separator + 1..].trim().to_string();
        if !key.is_empty() {
            fields.insert(key, value);
        }
    }
    fields
}

fn is_truthy(value: &str) -> bool {
    matches!(
        value.trim().to_ascii_lowercase().as_str(),
        "true" | "yes" | "1"
    )
}

/// Every `%%category` directive in a document, in declaration order.
///
/// Duplicate codes merge — later fields win, entity lists append — so a model
/// split across files does not silently lose assignments.
pub fn parse_categories(source: &str) -> Vec<Category> {
    // Insertion order matters (it is the seed order), so this keeps a Vec and
    // an index rather than relying on a map's iteration order.
    let mut categories: Vec<Category> = Vec::new();
    let mut index_by_code: BTreeMap<String, usize> = BTreeMap::new();
    let mut order: i64 = 0;

    for line in unfold(source) {
        let Some(body) = strip_directive(&line, "category") else {
            continue;
        };
        if body.is_empty() {
            continue;
        }

        let fields = parse_fields(&body);
        let Some(name) = fields.get("name").map(|n| n.trim().to_string()) else {
            continue;
        };
        if name.is_empty() {
            continue;
        }

        let code = fields
            .get("code")
            .map(|c| c.trim().to_string())
            .filter(|c| !c.is_empty())
            .unwrap_or_else(|| slugify(&name));
        if code.is_empty() {
            continue;
        }

        let entities: Vec<String> = fields
            .get("entities")
            .map(|raw| {
                raw.split(',')
                    .map(|e| e.trim().to_string())
                    .filter(|e| !e.is_empty())
                    .collect()
            })
            .unwrap_or_default();

        let seq = fields.get("seq").and_then(|s| s.trim().parse::<i64>().ok());
        let declared_default = fields.map_get_truthy("default");

        match index_by_code.get(&code).copied() {
            Some(existing_index) => {
                let existing = &mut categories[existing_index];
                existing.name = name;
                if let Some(value) = fields.get("description").filter(|v| !v.is_empty()) {
                    existing.description = Some(value.clone());
                }
                if let Some(value) = fields.get("icon").filter(|v| !v.is_empty()) {
                    existing.icon = Some(value.clone());
                }
                if let Some(value) = fields.get("color").filter(|v| !v.is_empty()) {
                    existing.color = Some(value.clone());
                }
                if let Some(value) = seq {
                    existing.seq_no = value;
                }
                existing.is_default = declared_default || existing.is_default;
                for entity in entities {
                    if !existing.entities.contains(&entity) {
                        existing.entities.push(entity);
                    }
                }
            }
            None => {
                let mut deduped: Vec<String> = Vec::new();
                for entity in entities {
                    if !deduped.contains(&entity) {
                        deduped.push(entity);
                    }
                }
                categories.push(Category {
                    name,
                    code: code.clone(),
                    description: fields.get("description").filter(|v| !v.is_empty()).cloned(),
                    icon: fields.get("icon").filter(|v| !v.is_empty()).cloned(),
                    color: fields.get("color").filter(|v| !v.is_empty()).cloned(),
                    seq_no: seq.unwrap_or(order),
                    is_default: declared_default,
                    entities: deduped,
                });
                index_by_code.insert(code, categories.len() - 1);
                order += 1;
            }
        }
    }

    // Exactly one default: an explicit declaration wins, and later ones lose.
    let mut seen_default = false;
    for category in categories.iter_mut() {
        if category.is_default {
            if seen_default {
                category.is_default = false;
            }
            seen_default = true;
        }
    }

    categories
}

/// Match `%%<keyword> …`, returning the directive body.
pub(crate) fn strip_directive(line: &str, keyword: &str) -> Option<String> {
    let rest = line.strip_prefix("%%")?.trim_start();
    let lowered = rest.to_ascii_lowercase();
    let keyword_lower = keyword.to_ascii_lowercase();
    if !lowered.starts_with(&keyword_lower) {
        return None;
    }
    let after = &rest[keyword.len()..];
    // The keyword must be a whole word, so `%%categories` is not a `%%category`.
    if !after.is_empty() && !after.starts_with(char::is_whitespace) && !after.starts_with(':') {
        return None;
    }
    Some(after.trim().to_string())
}

/// Categories to seed, guaranteeing the dictionary is never empty.
///
/// A model that declares none still gets a single "General" default holding
/// every entity, so the dashboard and admin screens work out of the box.
pub fn resolve_categories(source: &str, entity_names: &[String]) -> Vec<Category> {
    let mut declared = parse_categories(source);

    if declared.is_empty() {
        return vec![Category {
            name: "General".to_string(),
            code: "general".to_string(),
            description: Some("Default grouping for all business entities".to_string()),
            icon: Some("LayoutGrid".to_string()),
            color: None,
            seq_no: 0,
            is_default: true,
            entities: entity_names.to_vec(),
        }];
    }

    let assigned: Vec<&String> = declared.iter().flat_map(|c| c.entities.iter()).collect();
    let unassigned: Vec<String> = entity_names
        .iter()
        .filter(|name| !assigned.contains(name))
        .cloned()
        .collect();

    if !unassigned.is_empty() {
        let fallback_index = match declared.iter().position(|c| c.is_default) {
            Some(index) => index,
            None => {
                declared.push(Category {
                    name: "General".to_string(),
                    code: "general".to_string(),
                    description: Some("Entities not assigned to a specific category".to_string()),
                    icon: Some("LayoutGrid".to_string()),
                    color: None,
                    seq_no: declared.len() as i64,
                    is_default: true,
                    entities: Vec::new(),
                });
                declared.len() - 1
            }
        };
        for entity in unassigned {
            if !declared[fallback_index].entities.contains(&entity) {
                declared[fallback_index].entities.push(entity);
            }
        }
    } else if !declared.iter().any(|c| c.is_default) {
        declared[0].is_default = true;
    }

    declared
}

/// Small helper so the `default:` lookup reads as one expression above.
trait TruthyLookup {
    fn map_get_truthy(&self, key: &str) -> bool;
}

impl TruthyLookup for BTreeMap<String, String> {
    fn map_get_truthy(&self, key: &str) -> bool {
        self.get(key).map(|v| is_truthy(v)).unwrap_or(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SOURCE: &str = r#"
%%category name: Compound Registry; description: Structures and aliases; icon: FlaskConical; color: #6366f1; entities: Compound, CompoundAlias
%%category name: People and Teams; default: true; entities: User, Team
erDiagram
"#;

    #[test]
    fn parses_declared_categories() {
        let categories = parse_categories(SOURCE);
        assert_eq!(categories.len(), 2);
        assert_eq!(categories[0].name, "Compound Registry");
        assert_eq!(categories[0].code, "compound-registry");
        assert_eq!(categories[0].icon.as_deref(), Some("FlaskConical"));
        assert_eq!(categories[0].entities, vec!["Compound", "CompoundAlias"]);
        assert!(categories[1].is_default);
        assert!(!categories[0].is_default);
    }

    #[test]
    fn continuation_lines_fold_in() {
        let src = "%%category name: Quality; \\\n%%  entities: CAPA, DeviationReport\n";
        let categories = parse_categories(src);
        assert_eq!(categories[0].entities, vec!["CAPA", "DeviationReport"]);
    }

    #[test]
    fn unassigned_entities_land_in_the_default() {
        let names = vec![
            "Compound".to_string(),
            "CompoundAlias".to_string(),
            "User".to_string(),
            "Team".to_string(),
            "Orphan".to_string(),
        ];
        let categories = resolve_categories(SOURCE, &names);
        let default = categories.iter().find(|c| c.is_default).unwrap();
        assert!(default.entities.contains(&"Orphan".to_string()));
    }

    #[test]
    fn a_model_with_no_categories_still_gets_one() {
        let categories = resolve_categories("erDiagram\n", &["Compound".to_string()]);
        assert_eq!(categories.len(), 1);
        assert_eq!(categories[0].code, "general");
        assert!(categories[0].is_default);
    }

    #[test]
    fn only_one_category_stays_default() {
        let src = "%%category name: A; default: true\n%%category name: B; default: true\n";
        let categories = parse_categories(src);
        assert_eq!(categories.iter().filter(|c| c.is_default).count(), 1);
    }
}
