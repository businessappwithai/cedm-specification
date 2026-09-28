//! Name conversions shared by every stage of generation.
//!
//! These are ports of `packages/core/src/utils/naming.ts` and the parts of
//! `table-naming.ts` the generator uses. The rules are reproduced exactly,
//! including the acronym guard: without it `CAPA` snake-cases to `c_a_p_a`,
//! which disagrees with the table name the ERD parser derives for the same
//! entity and yields foreign keys pointing at tables nothing ever created.

pub const BUS_TABLE_PREFIX: &str = "bus_";
pub const SYS_TABLE_PREFIX: &str = "sys_";

/// True when a name is all-caps/underscores — an acronym like `CAPA` or an
/// already-snake_cased constant.
fn is_acronym(s: &str) -> bool {
    !s.is_empty()
        && s.chars()
            .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '_')
}

pub fn snake_case(s: &str) -> String {
    if s.is_empty() {
        return String::new();
    }
    if is_acronym(s) {
        return s.to_ascii_lowercase();
    }

    // An acronym is one word, and the boundary is where it *ends*.
    //
    // `is_acronym` above only catches a name that is nothing but an acronym. A
    // name that *begins* with one — `SIPInstruction`, `KYCRecord` — fell
    // through to the per-capital rule below and came out `s_i_p_instruction`,
    // which is the table an application was generated with while everything
    // else reading the same model called it `sip_instruction`. So a capital
    // opens a word only when the character before it is not itself a capital,
    // or when the character after it is lowercase — that last capital is the
    // one starting the next word.
    let chars: Vec<char> = s.chars().collect();
    let mut out = String::with_capacity(s.len() + 4);
    for (i, &ch) in chars.iter().enumerate() {
        if ch.is_ascii_uppercase() {
            let prev_is_upper = i > 0 && chars[i - 1].is_ascii_uppercase();
            let next_is_lower = chars.get(i + 1).is_some_and(char::is_ascii_lowercase);
            if !prev_is_upper || next_is_lower {
                out.push('_');
            }
            out.push(ch.to_ascii_lowercase());
        } else if ch == '-' || ch == ' ' {
            out.push('_');
        } else {
            out.push(ch);
        }
    }

    // Collapse the runs the two branches above can produce ("A-B" -> "_a__b").
    let mut collapsed = String::with_capacity(out.len());
    let mut prev_underscore = false;
    for ch in out.chars() {
        if ch == '_' {
            if !prev_underscore {
                collapsed.push(ch);
            }
            prev_underscore = true;
        } else {
            collapsed.push(ch);
            prev_underscore = false;
        }
    }

    collapsed.trim_start_matches('_').to_string()
}

pub fn pascal_case(s: &str) -> String {
    if s.is_empty() {
        return String::new();
    }
    let mut out = String::with_capacity(s.len());
    let mut upper_next = true;
    for ch in s.chars() {
        if ch == '-' || ch == '_' {
            upper_next = true;
            continue;
        }
        if upper_next {
            out.extend(ch.to_uppercase());
            upper_next = false;
        } else {
            out.push(ch);
        }
    }
    out
}

pub fn camel_case(s: &str) -> String {
    let pascal = pascal_case(s);
    let mut chars = pascal.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_lowercase().chain(chars).collect(),
    }
}

pub fn kebab_case(s: &str) -> String {
    if s.is_empty() {
        return String::new();
    }
    let spaced = s.replace(char::is_whitespace, "-");

    // A hyphen goes before a capital only when a lowercase precedes it, so
    // acronyms stay whole ("HTTPServer" -> "httpserver", not "h-t-t-p-server").
    let mut out = String::with_capacity(spaced.len() + 4);
    let mut prev_lower = false;
    for ch in spaced.chars() {
        if ch.is_ascii_uppercase() && prev_lower {
            out.push('-');
        }
        prev_lower = ch.is_ascii_lowercase();
        out.push(ch);
    }

    let lowered = out.to_ascii_lowercase().replace('_', "-");
    let mut collapsed = String::with_capacity(lowered.len());
    let mut prev_dash = false;
    for ch in lowered.chars() {
        if ch == '-' {
            if !prev_dash {
                collapsed.push(ch);
            }
            prev_dash = true;
        } else {
            collapsed.push(ch);
            prev_dash = false;
        }
    }
    collapsed.trim_matches('-').to_string()
}

/// Naive English pluralisation — the same rules the TypeScript generator used,
/// so table and route names do not shift between the two implementations.
pub fn plural(s: &str) -> String {
    if s.is_empty() {
        return String::new();
    }
    if let Some(stem) = s.strip_suffix('y') {
        return format!("{stem}ies");
    }
    if s.ends_with('s') || s.ends_with('x') || s.ends_with("ch") {
        return format!("{s}es");
    }
    format!("{s}s")
}

pub fn singular(s: &str) -> String {
    if let Some(stem) = s.strip_suffix("ies") {
        return format!("{stem}y");
    }
    if let Some(stem) = s.strip_suffix("es") {
        return stem.to_string();
    }
    if let Some(stem) = s.strip_suffix('s') {
        return stem.to_string();
    }
    s.to_string()
}

/// Physical table name for an ERD entity. `sys_`/`bus_` prefixes already in the
/// model are respected rather than doubled.
pub fn add_bus_prefix(name: &str) -> String {
    if name.starts_with(BUS_TABLE_PREFIX) || name.starts_with(SYS_TABLE_PREFIX) {
        return name.to_string();
    }
    format!("{BUS_TABLE_PREFIX}{}", snake_case(name))
}

pub fn remove_table_prefix(name: &str) -> String {
    name.strip_prefix(BUS_TABLE_PREFIX)
        .or_else(|| name.strip_prefix(SYS_TABLE_PREFIX))
        .unwrap_or(name)
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn acronyms_do_not_explode() {
        assert_eq!(snake_case("CAPA"), "capa");
        assert_eq!(add_bus_prefix("CAPA"), "bus_capa");
    }

    /// A name that *begins* with an acronym is the case `is_acronym` cannot see.
    ///
    /// `KYCRecord` used to come out `k_y_c_record`, so the generated migration
    /// created `bus_k_y_c_record` while the checker, the manual and every model
    /// author called it `kyc_record`. Nothing failed; the application simply
    /// had a table under a name no other component would ever ask for.
    #[test]
    fn an_acronym_at_the_front_is_still_one_word() {
        assert_eq!(snake_case("KYCRecord"), "kyc_record");
        assert_eq!(snake_case("SIPInstruction"), "sip_instruction");
        assert_eq!(snake_case("FATCADeclaration"), "fatca_declaration");
        // And one at the back, which has no lowercase letter after it.
        assert_eq!(snake_case("orderID"), "order_id");
    }

    /// A boundary that is both a separator and a capital is one boundary.
    ///
    /// "Drug Discovery Live" came out `drug__discovery__live`, which is what a
    /// generated project ended up naming its database.
    #[test]
    fn a_separator_before_a_capital_is_one_underscore() {
        assert_eq!(snake_case("Drug Discovery Live"), "drug_discovery_live");
        assert_eq!(snake_case("Compound Alias"), "compound_alias");
    }

    #[test]
    fn pascal_and_camel_round_trip() {
        assert_eq!(snake_case("CompoundAlias"), "compound_alias");
        assert_eq!(pascal_case("compound_alias"), "CompoundAlias");
        assert_eq!(camel_case("compound_alias"), "compoundAlias");
        assert_eq!(kebab_case("CompoundAlias"), "compound-alias");
    }

    #[test]
    fn already_snake_stays_put() {
        assert_eq!(snake_case("molecular_weight"), "molecular_weight");
    }

    #[test]
    fn prefixes_are_not_doubled() {
        assert_eq!(add_bus_prefix("bus_compound"), "bus_compound");
        assert_eq!(add_bus_prefix("sys_table"), "sys_table");
        assert_eq!(remove_table_prefix("bus_compound"), "compound");
    }
}
