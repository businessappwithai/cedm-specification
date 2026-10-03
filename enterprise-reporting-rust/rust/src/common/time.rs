use chrono::{DateTime, NaiveDateTime, SecondsFormat, Utc};

/// `new Date().toISOString()` — what Node writes into every VARCHAR timestamp
/// column (`created_at`, `updated_at`, …). Millisecond precision, `Z` suffix.
#[must_use]
pub fn now_iso() -> String {
    iso(Utc::now())
}

#[must_use]
pub fn iso(t: DateTime<Utc>) -> String {
    t.to_rfc3339_opts(SecondsFormat::Millis, true)
}

/// A `timestamp without time zone` as node-pg serialises it. node-pg reads it
/// as local time; the services run in UTC, so that is UTC.
#[must_use]
pub fn naive_iso(t: NaiveDateTime) -> String {
    iso(t.and_utc())
}
