//! Handlebars registry and the helpers the templates actually call.
//!
//! Only the helpers the `tanstack-astryx-loco` templates use are registered.
//! The TypeScript loader registered around a hundred, most of them survivors of
//! the NestJS stack (`nestModuleName`, `tableToDto`, `kyselyType`, …) that no
//! remaining template references; carrying them across would have been porting
//! dead code.

use std::cell::RefCell;
use std::path::Path;

use anyhow::{Context, Result};
use handlebars::{
    handlebars_helper, Context as HbContext, Handlebars, Helper, HelperDef, HelperResult,
    JsonTruthy, Output, RenderContext, RenderError, RenderErrorReason, Renderable,
};
use serde_json::Value;

use crate::naming;

/// A registry with the helpers registered and HTML escaping disabled.
///
/// Escaping must be off: every output here is Rust, TypeScript, SQL or YAML,
/// and an escaped `&` or `"` in any of them is a syntax error rather than a
/// safety measure.
pub fn registry() -> Handlebars<'static> {
    let mut hb = Handlebars::new();
    hb.register_escape_fn(handlebars::no_escape);
    // Strict mode is off, and it has to be: the templates test optional fields
    // with `{{#if maxLength}}`, and `maxLength` is genuinely absent from most
    // attributes — strict mode makes that an error rather than a false.
    //
    // The cost is that a *typo* is silent too, and so is a helper this registry
    // forgot to register: both render as nothing, or worse as something
    // plausible. `backend::tests` pins the output of the templates that carry
    // real logic for exactly that reason. Add to it when you add a template.
    hb.set_strict_mode(false);

    register_case_helpers(&mut hb);
    hb.register_helper("now", Box::new(now_helper));
    hb.register_helper("seedValue", Box::new(seed_value_helper));
    hb.register_helper("json", Box::new(json_helper));
    hb.register_helper("concat", Box::new(concat_helper));
    hb.register_helper("join", Box::new(join_helper));

    // Comparison and logic. These have to be *value*-returning rather than
    // output-writing: every use in the templates is a subexpression —
    // `{{#unless (or (eq name ../primaryKey) …)}}` — and a helper that only
    // knows how to write to the output stream cannot be one.
    hb.register_helper("eq", Box::new(eq));
    hb.register_helper("ne", Box::new(ne));
    hb.register_helper("and", Box::new(and));
    hb.register_helper("or", Box::new(or));
    hb.register_helper("not", Box::new(not));

    hb.register_helper("typeToReferenceId", Box::new(type_to_reference_id));
    hb.register_helper("seaOrmType", Box::new(sea_orm_type));

    // Shell parameter expansion. See the note on `shell_default` for why these
    // exist rather than the expansion being written inline.
    hb.register_helper("shellDefault", Box::new(shell_default));
    hb.register_helper("shellRequired", Box::new(shell_required));

    hb.register_helper("switch", Box::new(SwitchHelper));
    hb.register_helper("case", Box::new(CaseHelper));
    hb.register_helper("default", Box::new(DefaultHelper));

    hb
}

handlebars_helper!(eq: |a: Json, b: Json| a == b);
handlebars_helper!(ne: |a: Json, b: Json| a != b);
handlebars_helper!(not: |v: Json| !v.is_truthy(true));
handlebars_helper!(and: |*args| args.iter().all(|v| v.is_truthy(true)));
handlebars_helper!(or: |*args| args.iter().any(|v| v.is_truthy(true)));

// `sys_reference_id` for a *declared* attribute type.
//
// Deliberately not the same function as `bus::attribute_reference_id`: this one
// answers "what shape is this type", which is what the DDL template needs, and
// knows nothing about whether the column happens to be a key. The template
// applies the key rules itself, with `{{#if isForeignKey}}` inside the branch.
//
// Mirrors the `typeToReferenceId` helper in the TypeScript loader, aliases and
// all, so a template that reaches it gets the same number from either generator.
// That includes its `email`/`password` pair, which is the reverse of
// `bus::reference_type` (EMAIL is 30 there, PASSWORD 29). Reproduced rather than
// corrected: the two must agree, and only one of them is reachable — the parser
// canonicalises every type into the language's eight before a template sees it,
// so `email` and `password` never arrive here. Fix both together, with the
// dictionary seed, or not at all.
handlebars_helper!(type_to_reference_id: |ty: str| {
    match ty.to_ascii_lowercase().as_str() {
        "string" | "varchar" | "char" => 10,
        "integer" | "int" | "bigint" | "smallint" => 11,
        "decimal" | "numeric" | "float" | "double" | "number" | "real" => 12,
        "uuid" | "id" => 13,
        "text" => 14,
        "date" => 15,
        "datetime" | "timestamp" | "timestamptz" => 16,
        "boolean" | "bool" => 20,
        "url" => 24,
        "image" => 25,
        "file" => 26,
        "color" => 27,
        "json" | "jsonb" => 28,
        "email" => 29,
        "password" => 30,
        "phone" => 31,
        _ => 10,
    }
});

// `sys_reference_id` → the Rust type a SeaORM entity field must declare.
//
// The mirror of `seaOrmType` in `packages/generator/src/templates/loader.ts`;
// `bun run parity` compares what the two emit. Kept deliberately distinct from
// that file's `rustType`, which answers a different question and gets DATETIME
// and DATE wrong for this one — see the TypeScript doc comment for the three
// places they disagree and why each matters.
//
// The foreign-key override applies to reference ids 10 and 11 only, because
// those are the only two branches where `m0002_bus_tables` consults
// `isForeignKey`. A `decimal … FK` column really is `DECIMAL(18,6)` in the DDL,
// so claiming `Uuid` for it here would compile and then fail on first use.
handlebars_helper!(sea_orm_type: |rid: i64, required: Json, is_fk: Json| {
    let base = if is_fk.is_truthy(true) && (rid == 10 || rid == 11) {
        "Uuid"
    } else {
        match rid {
            10 => "String",
            11 => "i32",
            12 => "Decimal",
            13 => "Uuid",
            14 => "String",
            15 => "Date",
            16 => "DateTimeWithTimeZone",
            17 => "String",
            18 | 19 => "Uuid",
            20 => "bool",
            21..=27 => "String",
            28 => "Json",
            29..=31 => "String",
            _ => "String",
        }
    };

    if required.is_truthy(true) {
        base.to_string()
    } else {
        format!("Option<{base}>")
    }
});

// `${NAME:-fallback}` / `${NAME:?message}`.
//
// These exist because the expansion cannot be written inline beside a
// Handlebars expression: `${PORT:-{{config.port}}}` ends in three closing
// braces, Handlebars reads the first two as its own terminator and fails on the
// third. It is the same two-braces trap as an inline `style={…}` object in a
// `.tsx` template. Emitting the whole expansion from a helper keeps the brace
// away from the delimiter, so template authors can write the natural thing.
handlebars_helper!(shell_default: |name: str, fallback: Json| {
    let rendered = match fallback {
        Value::String(text) => text.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    };
    format!("${{{name}:-{rendered}}}")
});

handlebars_helper!(shell_required: |name: str, message: Json| {
    let text = match message {
        Value::String(text) if !text.is_empty() => text.clone(),
        _ => format!("{name} is required"),
    };
    format!("${{{name}:?{text}}}")
});

// ── switch / case / default ──────────────────────────────────────────────────
//
// Three helpers sharing one piece of state, exactly as the TypeScript loader
// does it. `switch` records the value it was given; each `case` renders its body
// only if it matches *and* nothing has matched yet; `default` renders only if
// nothing matched. First match wins, and it is not fall-through.
//
// The state lives in a thread-local stack rather than in the render context
// because `case` is a sibling block of `switch`'s body, not a child of it —
// there is no shared scope to hang it on. A stack rather than a single slot so
// a nested `switch` inside a `case` cannot clobber its parent's match flag.

thread_local! {
    static SWITCH_STACK: RefCell<Vec<SwitchFrame>> = const { RefCell::new(Vec::new()) };
}

struct SwitchFrame {
    value: Value,
    matched: bool,
}

fn switch_out_of_place(helper: &str) -> RenderError {
    RenderErrorReason::Other(format!(
        "`{{{{#{helper}}}}}` used outside a `{{{{#switch}}}}` block"
    ))
    .into()
}

struct SwitchHelper;

impl HelperDef for SwitchHelper {
    fn call<'reg: 'rc, 'rc>(
        &self,
        h: &Helper<'rc>,
        r: &'reg Handlebars<'reg>,
        ctx: &'rc HbContext,
        rc: &mut RenderContext<'reg, 'rc>,
        out: &mut dyn Output,
    ) -> HelperResult {
        let value = h.param(0).map(|p| p.value().clone()).unwrap_or(Value::Null);

        SWITCH_STACK.with(|stack| {
            stack.borrow_mut().push(SwitchFrame {
                value,
                matched: false,
            })
        });

        // The frame is popped whether or not the body renders cleanly: leaving
        // it behind would make the *next* switch in the same file read this
        // one's value.
        let result = match h.template() {
            Some(template) => template.render(r, ctx, rc, out),
            None => Ok(()),
        };
        SWITCH_STACK.with(|stack| stack.borrow_mut().pop());
        result
    }
}

struct CaseHelper;

impl HelperDef for CaseHelper {
    fn call<'reg: 'rc, 'rc>(
        &self,
        h: &Helper<'rc>,
        r: &'reg Handlebars<'reg>,
        ctx: &'rc HbContext,
        rc: &mut RenderContext<'reg, 'rc>,
        out: &mut dyn Output,
    ) -> HelperResult {
        let candidate = h.param(0).map(|p| p.value().clone()).unwrap_or(Value::Null);

        let take = SWITCH_STACK.with(|stack| {
            let mut stack = stack.borrow_mut();
            match stack.last_mut() {
                None => Err(switch_out_of_place("case")),
                Some(frame) => {
                    let hit = !frame.matched && frame.value == candidate;
                    if hit {
                        frame.matched = true;
                    }
                    Ok(hit)
                }
            }
        })?;

        if take {
            if let Some(template) = h.template() {
                return template.render(r, ctx, rc, out);
            }
        }
        Ok(())
    }
}

struct DefaultHelper;

impl HelperDef for DefaultHelper {
    fn call<'reg: 'rc, 'rc>(
        &self,
        h: &Helper<'rc>,
        r: &'reg Handlebars<'reg>,
        ctx: &'rc HbContext,
        rc: &mut RenderContext<'reg, 'rc>,
        out: &mut dyn Output,
    ) -> HelperResult {
        let take = SWITCH_STACK.with(|stack| {
            let mut stack = stack.borrow_mut();
            match stack.last_mut() {
                None => Err(switch_out_of_place("default")),
                Some(frame) => {
                    let hit = !frame.matched;
                    frame.matched = true;
                    Ok(hit)
                }
            }
        })?;

        if take {
            if let Some(template) = h.template() {
                return template.render(r, ctx, rc, out);
            }
        }
        Ok(())
    }
}

fn register_case_helpers(hb: &mut Handlebars<'static>) {
    macro_rules! string_helper {
        ($name:literal, $func:expr) => {
            hb.register_helper(
                $name,
                Box::new(
                    move |h: &Helper,
                          _: &Handlebars,
                          _: &HbContext,
                          _: &mut RenderContext,
                          out: &mut dyn Output|
                          -> HelperResult {
                        let input = param_str(h, 0);
                        out.write(&$func(&input))?;
                        Ok(())
                    },
                ),
            );
        };
    }

    string_helper!("snakeCase", naming::snake_case);
    string_helper!("camelCase", naming::camel_case);
    string_helper!("pascalCase", naming::pascal_case);
    string_helper!("kebabCase", naming::kebab_case);
    string_helper!("plural", naming::plural);
    string_helper!("singular", naming::singular);
    string_helper!("addBusPrefix", naming::add_bus_prefix);
    string_helper!("removeTablePrefix", naming::remove_table_prefix);
    // No `displayName` helper. `displayName` is a *field* on every entity and
    // attribute in the context, and a helper of that name shadows it: the
    // templates then render an empty string where the human label belongs, with
    // nothing to indicate the value was ever there. The TypeScript loader
    // registers no such helper either.
    string_helper!("upperCase", |s: &str| s.to_uppercase());
    string_helper!("lowerCase", |s: &str| s.to_lowercase());
}

/// A positional parameter rendered as a bare string.
///
/// `to_string()` on a JSON string keeps its quotes, which would land literal
/// `"` characters in generated source; this unwraps strings first.
fn param_str(h: &Helper, index: usize) -> String {
    match h.param(index).map(|p| p.value()) {
        Some(Value::String(s)) => s.clone(),
        Some(Value::Null) | None => String::new(),
        Some(other) => other.to_string(),
    }
}

fn now_helper(
    _: &Helper,
    _: &Handlebars,
    _: &HbContext,
    _: &mut RenderContext,
    out: &mut dyn Output,
) -> HelperResult {
    out.write(&chrono::Utc::now().to_rfc3339())?;
    Ok(())
}

fn json_helper(
    h: &Helper,
    _: &Handlebars,
    _: &HbContext,
    _: &mut RenderContext,
    out: &mut dyn Output,
) -> HelperResult {
    let value = h.param(0).map(|p| p.value()).unwrap_or(&Value::Null);
    let rendered = serde_json::to_string_pretty(value)
        .map_err(|e| RenderError::from(RenderErrorReason::NestedError(Box::new(e))))?;
    out.write(&rendered)?;
    Ok(())
}

/// `{{join columns ", "}}` — an array as a delimited string.
///
/// Registered here as well as in the TypeScript loader, and that pairing is the
/// point: strict mode is off in both engines, so a helper only one of them knows
/// renders as an empty string in the other rather than raising. Index DDL is
/// where that would have shown up as a `CREATE INDEX ... ON table ()`.
fn join_helper(
    h: &Helper,
    _: &Handlebars,
    _: &HbContext,
    _: &mut RenderContext,
    out: &mut dyn Output,
) -> HelperResult {
    let separator = h
        .param(1)
        .and_then(|p| p.value().as_str().map(str::to_string))
        .unwrap_or_else(|| ", ".to_string());

    let joined = h
        .param(0)
        .and_then(|p| p.value().as_array().cloned())
        .map(|items| {
            items
                .iter()
                .map(|item| match item {
                    Value::String(text) => text.clone(),
                    other => other.to_string(),
                })
                .collect::<Vec<_>>()
                .join(&separator)
        })
        .unwrap_or_default();

    out.write(&joined)?;
    Ok(())
}

fn concat_helper(
    h: &Helper,
    _: &Handlebars,
    _: &HbContext,
    _: &mut RenderContext,
    out: &mut dyn Output,
) -> HelperResult {
    for index in 0..h.params().len() {
        out.write(&param_str(h, index))?;
    }
    Ok(())
}

const FIRST_NAMES: [&str; 10] = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David",
    "Barbara",
];
const LAST_NAMES: [&str; 10] = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson",
    "Taylor",
];

/// Plausible seed data for a column, chosen by its name.
///
/// Deterministic in the index, so regenerating a project produces the same seed
/// file and the diff stays empty.
pub fn seed_value(field_name: &str, index: usize) -> String {
    let n = field_name.to_ascii_lowercase();
    let pick = |values: &[&str]| values[index % values.len()].to_string();

    match n.as_str() {
        "first_name" => return pick(&FIRST_NAMES),
        "last_name" => return pick(&LAST_NAMES),
        "gender" => {
            return if index.is_multiple_of(2) {
                "Male"
            } else {
                "Female"
            }
            .to_string();
        }
        "relationship" | "relationship_type" => {
            return pick(&["Mother", "Father", "Guardian", "Grandmother", "Grandfather"])
        }
        "grade" | "letter_grade" => return pick(&["A", "B+", "A-", "B", "A"]),
        "status" => return pick(&["Active", "Pending", "Completed", "In Progress", "Scheduled"]),
        "subject" | "subject_name" => {
            return pick(&["Mathematics", "Science", "English", "History", "Geography"])
        }
        "department" => return pick(&["Engineering", "Marketing", "Finance", "Operations", "HR"]),
        "address" | "street_address" => {
            return format!(
                "{} {}, {}",
                (index + 1) * 100,
                pick(&["Main St", "Oak Ave", "Elm Dr", "Park Blvd", "Cedar Ln"]),
                pick(&["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"])
            )
        }
        "city" => return pick(&["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]),
        "phone" | "phone_number" | "mobile" => return format!("555-{:04}", 1000 + index * 101),
        "description" | "notes" | "bio" => return format!("Description {}", index + 1),
        "title" => return format!("Title {}", index + 1),
        "code" | "reference_code" => return format!("CODE-{:03}", index + 1),
        "score" | "grade_value" => return (70 + index * 5).to_string(),
        "capacity" | "max_students" => return (20 + index * 5).to_string(),
        "room_number" => return format!("10{}", index + 1),
        "year" | "academic_year" => return (2024 + index).to_string(),
        "section" => return ((b'A' + (index % 26) as u8) as char).to_string(),
        _ => {}
    }

    if n == "name" || n.ends_with("_name") {
        return format!("{} {}", pick(&FIRST_NAMES), pick(&LAST_NAMES));
    }
    format!("Sample {}", index + 1)
}

fn seed_value_helper(
    h: &Helper,
    _: &Handlebars,
    _: &HbContext,
    _: &mut RenderContext,
    out: &mut dyn Output,
) -> HelperResult {
    let field = param_str(h, 0);
    let index = h.param(1).and_then(|p| p.value().as_u64()).unwrap_or(0) as usize;
    out.write(&seed_value(&field, index))?;
    Ok(())
}

/// Render one template file against a context.
pub fn render_file(
    hb: &Handlebars<'static>,
    template_path: &Path,
    context: &Value,
) -> Result<String> {
    let source = std::fs::read_to_string(template_path)
        .with_context(|| format!("reading template {}", template_path.display()))?;
    hb.render_template(&source, context)
        .with_context(|| format!("rendering template {}", template_path.display()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn case_helpers_render() {
        let hb = registry();
        let ctx = json!({ "entity": { "name": "CompoundAlias" } });
        assert_eq!(
            hb.render_template("{{snakeCase entity.name}}", &ctx)
                .unwrap(),
            "compound_alias"
        );
        assert_eq!(
            hb.render_template("{{kebabCase entity.name}}", &ctx)
                .unwrap(),
            "compound-alias"
        );
        assert_eq!(
            hb.render_template("{{addBusPrefix entity.name}}", &ctx)
                .unwrap(),
            "bus_compound_alias"
        );
    }

    /// A helper must never be registered under the name of a context field.
    ///
    /// `{{displayName}}` resolves to the helper, not to the entity's label, and
    /// a zero-argument string helper returns "" — so the label silently
    /// disappears from every file that prints one. It cost a round of generated
    /// SQL with no entity names in its comments.
    #[test]
    fn context_fields_are_not_shadowed_by_helpers() {
        let hb = registry();
        let ctx = json!({ "displayName": "Compound Alias", "tableName": "bus_compound_alias" });
        assert_eq!(
            hb.render_template("{{displayName}} ({{tableName}})", &ctx)
                .unwrap(),
            "Compound Alias (bus_compound_alias)"
        );
    }

    #[test]
    fn comparisons_work_as_subexpressions() {
        let hb = registry();
        let ctx = json!({ "name": "id", "primaryKey": "id", "unique": false });
        // This is the exact shape the bus-tables migration uses to skip the
        // primary key and the timestamp columns.
        assert_eq!(
            hb.render_template(
                "{{#unless (or (eq name primaryKey) (eq name 'created_at'))}}KEEP{{/unless}}",
                &ctx
            )
            .unwrap(),
            ""
        );
        assert_eq!(
            hb.render_template(
                "{{#unless (or (eq name primaryKey) (eq name 'created_at'))}}KEEP{{/unless}}",
                &json!({ "name": "smiles", "primaryKey": "id" })
            )
            .unwrap(),
            "KEEP"
        );
        assert_eq!(
            hb.render_template("{{#if (or (eq name 'name') unique)}}IDX{{/if}}", &ctx)
                .unwrap(),
            ""
        );
        assert_eq!(hb.render_template("{{not unique}}", &ctx).unwrap(), "true");
        assert_eq!(
            hb.render_template("{{and true unique}}", &ctx).unwrap(),
            "false"
        );
        assert_eq!(hb.render_template("{{ne name 'x'}}", &ctx).unwrap(), "true");
    }

    #[test]
    fn switch_takes_the_first_matching_case_only() {
        let hb = registry();
        let render = |ty: &str| {
            hb.render_template(
                "{{#switch (typeToReferenceId type)}}\
                 {{#case 10}}VARCHAR{{/case}}\
                 {{#case 12}}DECIMAL{{/case}}\
                 {{#case 16}}TIMESTAMPTZ{{/case}}\
                 {{#default}}FALLBACK{{/default}}\
                 {{/switch}}",
                &json!({ "type": ty }),
            )
            .unwrap()
        };
        assert_eq!(render("string"), "VARCHAR");
        assert_eq!(render("decimal"), "DECIMAL");
        assert_eq!(render("datetime"), "TIMESTAMPTZ");
        // `text` is 14, which no case above lists.
        assert_eq!(render("text"), "FALLBACK");
    }

    #[test]
    fn a_switch_frame_does_not_leak_into_the_next_one() {
        let hb = registry();
        // Two sibling switches, as `{{#each attributes}}` produces. If the
        // first one's "already matched" flag survived, the second would fall
        // through to nothing.
        let out = hb
            .render_template(
                "{{#each rows}}{{#switch n}}{{#case 1}}one{{/case}}{{#default}}other{{/default}}{{/switch}};{{/each}}",
                &json!({ "rows": [{ "n": 1 }, { "n": 1 }, { "n": 7 }] }),
            )
            .unwrap();
        assert_eq!(out, "one;one;other;");
    }

    #[test]
    fn a_case_outside_a_switch_is_an_error_rather_than_silence() {
        let hb = registry();
        assert!(hb
            .render_template("{{#case 10}}x{{/case}}", &json!({}))
            .is_err());
    }

    #[test]
    fn output_is_never_html_escaped() {
        let hb = registry();
        let ctx = json!({ "code": "a && b > c \"quoted\"" });
        assert_eq!(
            hb.render_template("{{code}}", &ctx).unwrap(),
            "a && b > c \"quoted\""
        );
    }

    #[test]
    fn seed_values_are_deterministic() {
        assert_eq!(seed_value("first_name", 0), "James");
        assert_eq!(seed_value("first_name", 0), "James");
        assert_eq!(seed_value("title", 4), "Title 5");
        assert_eq!(seed_value("phone", 1), "555-1101");
        assert_eq!(seed_value("anything_else", 2), "Sample 3");
        // `*_name` is a suffix rule, not an exact match.
        assert_eq!(seed_value("vendor_name", 0), "James Smith");
    }
}
