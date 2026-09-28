//! The model's `categories`, compiled.
//!
//! Categories group business entities into dashboard sections. Port of
//! `packages/generator/src/model/categories.ts`.

use std::collections::BTreeMap;

use crate::records::CategoryDeclaration;

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

/// Compile category declarations. Duplicate codes merge — later fields win,
/// entity lists append — so a model split across files does not silently lose
/// assignments.
pub fn compile_category_declarations(declarations: &[CategoryDeclaration]) -> Vec<Category> {
    // Insertion order matters (it is the seed order), so this keeps a Vec and
    // an index rather than relying on a map's iteration order.
    let mut categories: Vec<Category> = Vec::new();
    let mut index_by_code: BTreeMap<String, usize> = BTreeMap::new();
    let mut order: i64 = 0;

    for declaration in declarations {
        let name = declaration.name.clone();
        let code = declaration.code.clone().unwrap_or_else(|| slugify(&name));
        if code.is_empty() {
            continue;
        }
        let entities = declaration.entities.clone();
        let seq = declaration.seq;
        let declared_default = declaration.is_default;

        match index_by_code.get(&code).copied() {
            Some(existing_index) => {
                let existing = &mut categories[existing_index];
                existing.name = name;
                if let Some(value) = &declaration.description {
                    existing.description = Some(value.clone());
                }
                if let Some(value) = &declaration.icon {
                    existing.icon = Some(value.clone());
                }
                if let Some(value) = &declaration.color {
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
                    description: declaration.description.clone(),
                    icon: declaration.icon.clone(),
                    color: declaration.color.clone(),
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

/// `resolve_categories` over declarations already read, from either syntax.
pub fn resolve_category_declarations(
    declarations: &[CategoryDeclaration],
    entity_names: &[String],
) -> Vec<Category> {
    let mut declared = compile_category_declarations(declarations);

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

#[cfg(test)]
mod tests {
    use super::*;

    fn category(name: &str, is_default: bool, entities: &[&str]) -> CategoryDeclaration {
        CategoryDeclaration {
            name: name.to_string(),
            code: None,
            description: None,
            icon: None,
            color: None,
            seq: None,
            is_default,
            entities: entities.iter().map(|e| e.to_string()).collect(),
        }
    }

    fn declared() -> Vec<CategoryDeclaration> {
        vec![
            CategoryDeclaration {
                description: Some("Structures and aliases".to_string()),
                icon: Some("flask-conical".to_string()),
                color: Some("#6366f1".to_string()),
                ..category("Compound Registry", false, &["Compound", "CompoundAlias"])
            },
            category("People and Teams", true, &["User", "Team"]),
        ]
    }

    #[test]
    fn compiles_declared_categories_with_a_code_derived_from_the_name() {
        let categories = compile_category_declarations(&declared());
        assert_eq!(categories.len(), 2);
        assert_eq!(categories[0].name, "Compound Registry");
        assert_eq!(categories[0].code, "compound-registry");
        assert_eq!(categories[0].icon.as_deref(), Some("flask-conical"));
        assert_eq!(categories[0].entities, vec!["Compound", "CompoundAlias"]);
        assert!(categories[1].is_default);
        assert!(!categories[0].is_default);
    }

    #[test]
    fn unassigned_entities_land_in_the_default() {
        let names: Vec<String> = ["Compound", "CompoundAlias", "User", "Team", "Orphan"]
            .map(String::from)
            .to_vec();
        let categories = resolve_category_declarations(&declared(), &names);
        let default = categories.iter().find(|c| c.is_default).unwrap();
        assert!(default.entities.contains(&"Orphan".to_string()));
    }

    #[test]
    fn a_model_with_no_categories_still_gets_one() {
        let categories = resolve_category_declarations(&[], &["Compound".to_string()]);
        assert_eq!(categories.len(), 1);
        assert_eq!(categories[0].code, "general");
        assert!(categories[0].is_default);
    }

    #[test]
    fn only_one_category_stays_default() {
        let categories =
            compile_category_declarations(&[category("A", true, &[]), category("B", true, &[])]);
        assert_eq!(categories.iter().filter(|c| c.is_default).count(), 1);
    }
}
