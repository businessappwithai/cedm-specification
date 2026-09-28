//! The on-premise cron matcher from `monitoring-scheduler.ts`, line for line.
//!
//! Deliberately **not** a cron library (MIGRATION_PLAN.md §4.6). The Node
//! matcher's semantics differ from Vixie cron and a library would change
//! which minutes fire:
//!
//! - day-of-month and day-of-week are ANDed, not ORed;
//! - `*/n` and `a/n` step over 0–59 in every field;
//! - numbers are read with JavaScript's `parseInt` / `Number`, so `5abc`
//!   matches 5 and an unparseable part matches nothing;
//! - a timezone that cannot be resolved falls back to UTC.
use chrono::{DateTime, Datelike, Timelike, Utc};
use chrono_tz::Tz;

use super::js::number_from_str;
use crate::common::pagination::js_parse_int;

fn js_parse_int_f(s: &str) -> f64 {
    js_parse_int(s).map_or(f64::NAN, |v| v as f64)
}

/// `matchesCronField(value, field)`.
#[must_use]
pub fn matches_field(value: u32, field: &str) -> bool {
    let value = f64::from(value);
    if field == "*" {
        return true;
    }
    for part in field.split(',') {
        if part.contains('/') {
            let mut it = part.split('/');
            let range = it.next().unwrap_or_default();
            let step = js_parse_int_f(it.next().unwrap_or_default());
            let (mut start, mut end) = (0.0, 59.0);
            if range != "*" {
                let mut bounds = range.split('-').map(number_from_str);
                let s = bounds.next().unwrap_or(f64::NAN);
                start = s;
                end = bounds.next().unwrap_or(s);
            }
            // JS: NaN comparisons are false and x % 0 is NaN, so a bad step
            // or bound matches nothing.
            if value >= start && value <= end && ((value - start) % step) == 0.0 {
                return true;
            }
        } else if part.contains('-') {
            let mut bounds = part.split('-').map(number_from_str);
            let lo = bounds.next().unwrap_or(f64::NAN);
            let hi = bounds.next().unwrap_or(f64::NAN);
            if value >= lo && value <= hi {
                return true;
            }
        } else if js_parse_int_f(part) == value {
            return true;
        }
    }
    false
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Fields {
    minute: u32,
    hour: u32,
    day: u32,
    month: u32,
    /// 0 = Sunday, as `Date#getDay`.
    dow: u32,
}

fn fields_match(cron: &str, f: Fields) -> bool {
    let parts: Vec<&str> = cron.split_whitespace().collect();
    if parts.len() != 5 {
        return false;
    }
    matches_field(f.minute, parts[0])
        && matches_field(f.hour, parts[1])
        && matches_field(f.day, parts[2])
        && matches_field(f.month, parts[3])
        && matches_field(f.dow, parts[4])
}

/// `cronMatchesWithTimezone(cron, date, timezone)`: evaluate the five fields
/// against the wall-clock time in `timezone` (IANA name; empty or `UTC` means
/// UTC, and an unknown name falls back to UTC as Node's `catch` does).
#[must_use]
pub fn cron_matches(cron: &str, at: DateTime<Utc>, timezone: &str) -> bool {
    let tz = if timezone.is_empty() || timezone == "UTC" {
        None
    } else {
        timezone.parse::<Tz>().ok()
    };
    let f = match tz {
        Some(tz) => {
            let local = at.with_timezone(&tz);
            Fields {
                minute: local.minute(),
                hour: local.hour(),
                day: local.day(),
                month: local.month(),
                dow: local.weekday().num_days_from_sunday(),
            }
        }
        None => Fields {
            minute: at.minute(),
            hour: at.hour(),
            day: at.day(),
            month: at.month(),
            dow: at.weekday().num_days_from_sunday(),
        },
    };
    fields_match(cron, f)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn at(y: i32, mo: u32, d: u32, h: u32, mi: u32) -> DateTime<Utc> {
        Utc.with_ymd_and_hms(y, mo, d, h, mi, 0).unwrap()
    }

    #[test]
    fn field_forms() {
        assert!(matches_field(5, "*"));
        assert!(matches_field(5, "1,5,9"));
        assert!(matches_field(5, "3-7"));
        assert!(!matches_field(8, "3-7"));
        assert!(matches_field(15, "*/15"));
        assert!(!matches_field(16, "*/15"));
        assert!(matches_field(12, "2-20/5"));
        assert!(!matches_field(13, "2-20/5"));
        assert!(matches_field(5, "5abc"));
        assert!(!matches_field(5, "abc"));
        assert!(!matches_field(5, "*/0"));
    }

    #[test]
    fn single_number_step_starts_there() {
        // "5/10" → start 5, end 5 (e ?? s) → only 5 matches.
        assert!(matches_field(5, "5/10"));
        assert!(!matches_field(15, "5/10"));
    }

    #[test]
    fn day_of_month_and_day_of_week_are_anded() {
        // 2026-09-23 is a Wednesday (3). Vixie cron would OR these.
        assert!(cron_matches("0 9 23 * 3", at(2026, 9, 23, 9, 0), "UTC"));
        assert!(!cron_matches("0 9 23 * 1", at(2026, 9, 23, 9, 0), "UTC"));
        assert!(!cron_matches("0 9 1 * 3", at(2026, 9, 23, 9, 0), "UTC"));
    }

    #[test]
    fn timezone_is_wall_clock() {
        // 13:00 UTC = 09:00 America/New_York (EDT) on 2026-09-23.
        assert!(cron_matches(
            "0 9 * * *",
            at(2026, 9, 23, 13, 0),
            "America/New_York"
        ));
        assert!(!cron_matches(
            "0 9 * * *",
            at(2026, 9, 23, 9, 0),
            "America/New_York"
        ));
        // Unknown zone falls back to UTC.
        assert!(cron_matches("0 9 * * *", at(2026, 9, 23, 9, 0), "Not/AZone"));
    }

    #[test]
    fn wrong_field_count_never_matches() {
        assert!(!cron_matches("* * * *", at(2026, 9, 23, 9, 0), "UTC"));
        assert!(!cron_matches("0 * * * * *", at(2026, 9, 23, 9, 0), "UTC"));
    }
}

/// Replays `parity/fixtures/cron-corpus.json`, generated by running the Node
/// matcher itself (`bun rust/parity/cron-corpus.ts`): every expression × zone
/// × minute must fire on exactly the minutes Node fires on.
#[cfg(test)]
mod node_corpus {
    use super::cron_matches;
    use chrono::{DateTime, Utc};

    #[derive(serde::Deserialize)]
    struct Corpus {
        minutes: Vec<String>,
        cases: Vec<Case>,
    }

    #[derive(serde::Deserialize)]
    struct Case {
        cron: String,
        tz: String,
        matches: Vec<usize>,
    }

    #[test]
    fn identical_to_node_matcher() {
        let corpus: Corpus =
            serde_json::from_str(include_str!("../../parity/fixtures/cron-corpus.json")).unwrap();
        let minutes: Vec<DateTime<Utc>> = corpus
            .minutes
            .iter()
            .map(|m| DateTime::parse_from_rfc3339(m).unwrap().with_timezone(&Utc))
            .collect();
        let mut mismatches = Vec::new();
        for c in &corpus.cases {
            let ours: Vec<usize> = minutes
                .iter()
                .enumerate()
                .filter(|(_, m)| cron_matches(&c.cron, **m, &c.tz))
                .map(|(i, _)| i)
                .collect();
            if ours != c.matches {
                mismatches.push(format!(
                    "{:?} @ {:?}: node fires {} times, rust {}",
                    c.cron,
                    c.tz,
                    c.matches.len(),
                    ours.len()
                ));
            }
        }
        assert!(mismatches.is_empty(), "{}", mismatches.join("\n"));
    }
}
