//! SeaORM entity for the `users` credential store.
//!
//! Hand-written to match `migration/sql/m0000_auth_users.up.sql`. Regenerate
//! with `cargo loco db entities` after changing that migration.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    #[sea_orm(unique)]
    pub pid: Uuid,
    #[sea_orm(unique)]
    pub email: String,
    /// Argon2 hash — never serialised out of the process.
    #[serde(skip_serializing)]
    pub password: String,
    #[sea_orm(unique)]
    #[serde(skip_serializing)]
    pub api_key: String,
    pub name: String,
    #[serde(skip_serializing)]
    pub reset_token: Option<String>,
    pub reset_sent_at: Option<DateTimeWithTimeZone>,
    #[serde(skip_serializing)]
    pub email_verification_token: Option<String>,
    pub email_verification_sent_at: Option<DateTimeWithTimeZone>,
    pub email_verified_at: Option<DateTimeWithTimeZone>,
    #[serde(skip_serializing)]
    pub magic_link_token: Option<String>,
    pub magic_link_expiration: Option<DateTimeWithTimeZone>,
    /// Link into the Application Dictionary's own user row, which carries RBAC.
    pub sys_user_id: Option<Uuid>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
