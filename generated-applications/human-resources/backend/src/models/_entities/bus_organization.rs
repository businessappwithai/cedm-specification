//! SeaORM entity for `bus_organization` — Organization.
//!
//! **This is not the CRUD path, and must not become it.** Business-entity CRUD
//! goes through `DynamicRepo`, which resolves the table and its columns from the
//! Application Dictionary on every request — that is what lets an admin reorder
//! a field, mark one mandatory, or re-describe it without a rebuild. A
//! compile-time entity cannot express that, which is the whole reason
//! `DynamicRepo` exists (docs/MIGRATION-LOCO-ASTRYX.md §6.3).
//!
//! What this *is* is the convenience layer decision D9 asked for: typed field
//! access for code that is hand-written Rust anyway — hook handlers in
//! `src/hooks/handlers/`, and workflow tasks that need to query a related table.
//! Inside those, `order.total_amount` beats
//! `row["total_amount"].as_str().and_then(|s| s.parse().ok()).unwrap_or_default()`
//! in every way that matters.
//!
//! Field types mirror `migration/src/m0002_bus_tables.rs` branch for branch: the
//! same `sys_reference_id` switch, the same rule that a *string or integer*
//! foreign key is stored as `UUID` (a `decimal` one is not), and the same
//! nullability — `NOT NULL` only where the model marked the attribute required.
//! If that migration changes, this changes with it, or the mismatch surfaces as
//! a runtime `DbErr` on the first query rather than as a compile error here.
//!
//! Generated: 2026-10-04T01:11:56.652Z
//! Project: human-resources

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "bus_organization")]
pub struct Model {
    /// The migration defaults this to `gen_random_uuid()`, so it is explicitly
    /// not auto-increment — SeaORM assumes integer auto-increment otherwise.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub party_id: Uuid,
    pub code: String,
    pub name: String,
    pub organization_type: String,
    pub status: String,
    pub legal_name: Option<String>,
    pub registration_number: Option<String>,
    pub tax_identifier: Option<String>,
    pub party_type: String,
    pub display_name: String,
    pub external_reference: Option<String>,
    pub person_id: Option<Uuid>,
    pub parent_organization_id: Option<Uuid>,
    /// `TIMESTAMPTZ DEFAULT NOW()` — defaulted, not `NOT NULL`, so it is an
    /// `Option` here even though every row written by this application has one.
    pub created_at: Option<DateTimeWithTimeZone>,
    pub updated_at: Option<DateTimeWithTimeZone>,
    /// Soft delete. `DynamicRepo` filters `deleted_at IS NULL` on every read;
    /// a query written by hand against this entity has to do the same.
    pub deleted_at: Option<DateTimeWithTimeZone>,
    /// Optimistic concurrency. The `If-Match: "v{n}"` header the API contract
    /// specifies compares against this column.
    pub version: i32,
}

/// Left empty deliberately.
///
/// The ERD's relationships are enforced in the database — `m0002_bus_tables`
/// emits the `FOREIGN KEY` constraints — but declaring them here would commit
/// this entity to SeaORM's join API, and a `DeriveRelation` arm that names a
/// column the model did not actually emit as a UUID (see the `decimal … FK`
/// case above) does not compile. Hook and workflow code that needs a related
/// row queries it by id, which is what `DynamicRepo` does too.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

impl Model {
    /// Parse one of the JSON rows the bus layer passes to a hook.
    ///
    /// `afterCreate`, `afterUpdate`, `afterDelete` and `afterRead` are handed a
    /// whole stored row as `serde_json::Value`, which is exactly what this
    /// entity's field set describes — so the conversion is a `serde` round-trip
    /// rather than field-by-field unwrapping.
    ///
    /// The `before*` hooks are **not** a fit: they carry a partial payload
    /// whose absent fields are absent rather than null, so a required field
    /// missing from a `PATCH` body makes this fail. That is the honest outcome
    /// — mutate the `Map` directly in those, as the handler signature suggests.
    pub fn from_row(row: &serde_json::Value) -> Result<Self, serde_json::Error> {
        serde_json::from_value(row.clone())
    }
}
