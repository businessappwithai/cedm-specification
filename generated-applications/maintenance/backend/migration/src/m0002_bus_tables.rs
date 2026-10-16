//! Business entity tables (`bus_*`), generated from the ERD.
//!
//! Mirrors `common/migrations/bus-tables.migration.ts.hbs` — the template the
//! NestJS generator actually renders — expression for expression, so both
//! stacks emit the same schema. Note the tail is `created_at`, `updated_at`,
//! `deleted_at`, `version`: the `*_by` columns some other migration templates
//! carry are deliberately not here, because that template does not emit them.

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

const UP_SQL: &str = r#"
-- Party (bus_party)
CREATE TABLE IF NOT EXISTS bus_party (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , party_type VARCHAR(255) NOT NULL
  , display_name VARCHAR(300) NOT NULL
  , status VARCHAR(255) NOT NULL
  , external_reference VARCHAR(200)
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Person (bus_person)
CREATE TABLE IF NOT EXISTS bus_person (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , party_id UUID NOT NULL
  , title VARCHAR(50)
  , given_name VARCHAR(150) NOT NULL
  , middle_name VARCHAR(150)
  , family_name VARCHAR(150) NOT NULL
  , preferred_name VARCHAR(150)
  , date_of_birth DATE
  , gender VARCHAR(255)
  , nationality_id UUID
  , party_type VARCHAR(255) NOT NULL
  , display_name VARCHAR(300) NOT NULL
  , status VARCHAR(255) NOT NULL
  , external_reference VARCHAR(200)
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Organization (bus_organization)
CREATE TABLE IF NOT EXISTS bus_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , party_id UUID NOT NULL
  , code VARCHAR(50) NOT NULL
  , name VARCHAR(200) NOT NULL
  , organization_type VARCHAR(255) NOT NULL
  , status VARCHAR(255) NOT NULL
  , legal_name VARCHAR(300)
  , registration_number VARCHAR(100)
  , tax_identifier VARCHAR(100)
  , party_type VARCHAR(255) NOT NULL
  , display_name VARCHAR(300) NOT NULL
  , external_reference VARCHAR(200)
  , person_id UUID
  , parent_organization_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_organization_name ON bus_organization (name);
-- Party Role (bus_party_role)
CREATE TABLE IF NOT EXISTS bus_party_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , party_id UUID NOT NULL
  , role_type VARCHAR(255) NOT NULL
  , code VARCHAR(100)
  , valid_from DATE
  , valid_to DATE
  , status VARCHAR(255) NOT NULL
  , person_id UUID
  , organization_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Party Relationship (bus_party_relationship)
CREATE TABLE IF NOT EXISTS bus_party_relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL
  , name VARCHAR(300) NOT NULL
  , relationship_type VARCHAR(255) NOT NULL
  , ownership_percent DECIMAL(18,6)
  , valid_from DATE
  , valid_to DATE
  , status VARCHAR(255) NOT NULL
  , from_party_id UUID NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_party_relationship_name ON bus_party_relationship (name);
-- Legal Entity (bus_legal_entity)
CREATE TABLE IF NOT EXISTS bus_legal_entity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , occurred_at TIMESTAMPTZ
  , legal_name VARCHAR(300) NOT NULL
  , registration_number VARCHAR(60)
  , legal_form VARCHAR(60)
  , incorporation_date DATE
  , dissolution_date DATE
  , tax_identifier VARCHAR(60)
  , vat_number VARCHAR(30)
  , lei VARCHAR(20)
  , is_group_company BOOLEAN NOT NULL
  , status VARCHAR(255) NOT NULL
  , organization_id UUID
  , country_id UUID
  , registered_address_id UUID
  , functional_currency_id UUID
  , parent_entity_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Business Unit (bus_business_unit)
CREATE TABLE IF NOT EXISTS bus_business_unit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL
  , name VARCHAR(300) NOT NULL
  , description TEXT
  , status VARCHAR(255) NOT NULL
  , organization_id UUID NOT NULL
  , head_id UUID
  , legal_entity_id UUID
  , parent_unit_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_business_unit_name ON bus_business_unit (name);
-- Department (bus_department)
CREATE TABLE IF NOT EXISTS bus_department (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL
  , name VARCHAR(300) NOT NULL
  , description TEXT
  , status VARCHAR(255) NOT NULL
  , organization_id UUID NOT NULL
  , business_unit_id UUID
  , parent_department_id UUID
  , manager_id UUID
  , location_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_department_name ON bus_department (name);
-- Address (bus_address)
CREATE TABLE IF NOT EXISTS bus_address (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , address_type VARCHAR(255) NOT NULL
  , line1 VARCHAR(200) NOT NULL
  , line2 VARCHAR(200)
  , line3 VARCHAR(200)
  , city_name VARCHAR(150)
  , postal_code VARCHAR(30)
  , latitude DECIMAL(18,6)
  , longitude DECIMAL(18,6)
  , is_primary BOOLEAN NOT NULL
  , status VARCHAR(255) NOT NULL
  , party_id UUID
  , person_id UUID
  , organization_id UUID
  , country_id UUID NOT NULL
  , state_province_id UUID
  , city_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Contact Point (bus_contact_point)
CREATE TABLE IF NOT EXISTS bus_contact_point (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL
  , name VARCHAR(300) NOT NULL
  , channel VARCHAR(255) NOT NULL
  , value VARCHAR(320) NOT NULL
  , purpose VARCHAR(255) NOT NULL
  , is_preferred BOOLEAN NOT NULL
  , verified_at TIMESTAMPTZ
  , status VARCHAR(255) NOT NULL
  , party_id UUID NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_contact_point_name ON bus_contact_point (name);
-- Location (bus_location)
CREATE TABLE IF NOT EXISTS bus_location (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , location_type VARCHAR(255) NOT NULL
  , status VARCHAR(255) NOT NULL
  , address_id UUID
  , parent_location_id UUID
  , organization_id UUID
  , product_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_location_name ON bus_location (name);
-- Country (bus_country)
CREATE TABLE IF NOT EXISTS bus_country (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(2) NOT NULL UNIQUE
  , alpha3 VARCHAR(3)
  , numeric_code VARCHAR(3)
  , name VARCHAR(300) NOT NULL
  , phone_code VARCHAR(20)
  , currency_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_country_name ON bus_country (name);
-- State Province (bus_state_province)
CREATE TABLE IF NOT EXISTS bus_state_province (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(10) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , subdivision_type VARCHAR(100)
  , country_id UUID NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_state_province_name ON bus_state_province (name);
-- City (bus_city)
CREATE TABLE IF NOT EXISTS bus_city (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(80) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , population INTEGER
  , latitude DECIMAL(18,6)
  , longitude DECIMAL(18,6)
  , timezone VARCHAR(64)
  , is_capital BOOLEAN
  , country_id UUID NOT NULL
  , state_province_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_city_name ON bus_city (name);
-- Language (bus_language)
CREATE TABLE IF NOT EXISTS bus_language (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(2) NOT NULL UNIQUE
  , name VARCHAR(300) NOT NULL
  , alpha3 VARCHAR(3)
  , direction VARCHAR(255) NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_language_name ON bus_language (name);
-- Currency (bus_currency)
CREATE TABLE IF NOT EXISTS bus_currency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(3) NOT NULL UNIQUE
  , name VARCHAR(100) NOT NULL
  , symbol VARCHAR(10)
  , decimal_places INTEGER NOT NULL
  , status VARCHAR(255) NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_currency_name ON bus_currency (name);
-- Exchange Rate (bus_exchange_rate)
CREATE TABLE IF NOT EXISTS bus_exchange_rate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , from_currency_id UUID NOT NULL
  , to_currency_id UUID NOT NULL
  , rate DECIMAL(18,6) NOT NULL
  , rate_type VARCHAR(255) NOT NULL
  , effective_at TIMESTAMPTZ NOT NULL
  , expires_at TIMESTAMPTZ
  , source VARCHAR(200) NOT NULL
  , status VARCHAR(255) NOT NULL
  , from_currency UUID NOT NULL
  , to_currency UUID NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Unit Of Measure (bus_unit_of_measure)
CREATE TABLE IF NOT EXISTS bus_unit_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(30) NOT NULL UNIQUE
  , name VARCHAR(100) NOT NULL
  , symbol VARCHAR(20)
  , category VARCHAR(255) NOT NULL
  , conversion_factor DECIMAL(18,6)
  , base_unit_id UUID
  , status VARCHAR(255) NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_unit_of_measure_name ON bus_unit_of_measure (name);
-- Calendar (bus_calendar)
CREATE TABLE IF NOT EXISTS bus_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL
  , name VARCHAR(300) NOT NULL
  , working_days VARCHAR(50) NOT NULL
  , time_zone VARCHAR(64)
  , valid_from DATE
  , valid_to DATE
  , status VARCHAR(255) NOT NULL
  , country_id UUID
  , base_calendar_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_calendar_name ON bus_calendar (name);
-- Calendar Exception (bus_calendar_exception)
CREATE TABLE IF NOT EXISTS bus_calendar_exception (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , exception_date DATE NOT NULL
  , name VARCHAR(150) NOT NULL
  , exception_type VARCHAR(255) NOT NULL
  , is_working_day BOOLEAN NOT NULL
  , calendar_id UUID NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_calendar_exception_name ON bus_calendar_exception (name);
-- Attachment (bus_attachment)
CREATE TABLE IF NOT EXISTS bus_attachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , effective_at TIMESTAMPTZ
  , file_name VARCHAR(255) NOT NULL
  , media_type VARCHAR(100)
  , size_bytes INTEGER
  , storage_location VARCHAR(500) NOT NULL
  , checksum VARCHAR(128)
  , record_type VARCHAR(100) NOT NULL
  , record_id VARCHAR(64) NOT NULL
  , category VARCHAR(100)
  , description VARCHAR(500)
  , uploaded_at TIMESTAMPTZ NOT NULL
  , status VARCHAR(255) NOT NULL
  , uploaded_by_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Task (bus_task)
CREATE TABLE IF NOT EXISTS bus_task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL
  , name VARCHAR(300) NOT NULL
  , description VARCHAR(2000)
  , task_type VARCHAR(255) NOT NULL
  , status VARCHAR(255) NOT NULL
  , priority VARCHAR(255) NOT NULL
  , due_at TIMESTAMPTZ
  , started_at TIMESTAMPTZ
  , completed_at TIMESTAMPTZ
  , assignee_id UUID
  , organization_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_task_name ON bus_task (name);
-- Asset (bus_asset)
CREATE TABLE IF NOT EXISTS bus_asset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , asset_number VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(300) NOT NULL
  , asset_type VARCHAR(100) NOT NULL
  , acquisition_date DATE
  , acquisition_cost DECIMAL(18,6)
  , status VARCHAR(255) NOT NULL
  , serial_number VARCHAR(200)
  , owner_id UUID
  , location_id UUID
  , product_id UUID
  , maintenance_plan_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_asset_name ON bus_asset (name);
-- Meter (bus_meter)
CREATE TABLE IF NOT EXISTS bus_meter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , meter_code VARCHAR(120) NOT NULL UNIQUE
  , meter_type VARCHAR(255) NOT NULL
  , status VARCHAR(255) NOT NULL
  , last_reading_value DECIMAL(18,6)
  , last_reading_at TIMESTAMPTZ
  , asset_id UUID
  , location_id UUID
  , unit_of_measure_id UUID NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Maintenance Plan (bus_maintenance_plan)
CREATE TABLE IF NOT EXISTS bus_maintenance_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(300) NOT NULL
  , maintenance_type VARCHAR(255) NOT NULL
  , frequency_value DECIMAL(18,6)
  , frequency_unit VARCHAR(255)
  , status VARCHAR(255) NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_maintenance_plan_name ON bus_maintenance_plan (name);
-- Maintenance Work Order (bus_maintenance_work_order)
CREATE TABLE IF NOT EXISTS bus_maintenance_work_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , work_order_number VARCHAR(100) NOT NULL UNIQUE
  , work_type VARCHAR(255) NOT NULL
  , status VARCHAR(255) NOT NULL
  , priority VARCHAR(255) NOT NULL
  , requested_at TIMESTAMPTZ NOT NULL
  , scheduled_at TIMESTAMPTZ
  , completed_at TIMESTAMPTZ
  , description VARCHAR(4000)
  , asset_id UUID
  , maintenance_plan_id UUID
  , assignee_id UUID
  , location_id UUID
  , repair_estimate_id UUID
  , spare_part_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Repair Estimate (bus_repair_estimate)
CREATE TABLE IF NOT EXISTS bus_repair_estimate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , estimate_number VARCHAR(100) NOT NULL UNIQUE
  , revision INTEGER NOT NULL
  , estimate_date DATE NOT NULL
  , status VARCHAR(255) NOT NULL
  , disposition VARCHAR(255)
  , estimated_repair_amount DECIMAL(18,6)
  , estimated_sale_amount DECIMAL(18,6)
  , approved_amount DECIMAL(18,6)
  , currency_id UUID
  , container_id UUID NOT NULL
  , organization_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Repair Estimate Line (bus_repair_estimate_line)
CREATE TABLE IF NOT EXISTS bus_repair_estimate_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , repair_code VARCHAR(50)
  , damage_code VARCHAR(50)
  , component_code VARCHAR(50)
  , material_code VARCHAR(100)
  , quantity DECIMAL(18,6)
  , material_amount DECIMAL(18,6)
  , labour_amount DECIMAL(18,6)
  , replacement_amount DECIMAL(18,6)
  , total_amount DECIMAL(18,6)
  , repair_estimate_id UUID NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Equipment (bus_equipment)
CREATE TABLE IF NOT EXISTS bus_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , effective_at TIMESTAMPTZ
  , equipment_number VARCHAR(40) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , equipment_type VARCHAR(100)
  , manufacturer_name VARCHAR(150)
  , model VARCHAR(150)
  , serial_number VARCHAR(100)
  , installation_date DATE
  , criticality VARCHAR(255) NOT NULL
  , operating_status VARCHAR(255) NOT NULL
  , warranty_end_date DATE
  , asset_id UUID
  , location_id UUID
  , parent_equipment_id UUID
  , manufacturer_id UUID
  , spare_part_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_equipment_name ON bus_equipment (name);
-- Failure (bus_failure)
CREATE TABLE IF NOT EXISTS bus_failure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , effective_at TIMESTAMPTZ
  , failure_number VARCHAR(40) NOT NULL UNIQUE
  , symptom VARCHAR(500) NOT NULL
  , failure_mode VARCHAR(150)
  , cause VARCHAR(300)
  , severity VARCHAR(255) NOT NULL
  , started_at TIMESTAMPTZ NOT NULL
  , ended_at TIMESTAMPTZ
  , downtime_minutes INTEGER
  , status VARCHAR(255) NOT NULL
  , equipment_id UUID NOT NULL
  , work_order_id UUID
  , reported_by_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Spare Part (bus_spare_part)
CREATE TABLE IF NOT EXISTS bus_spare_part (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , criticality VARCHAR(255) NOT NULL
  , part_number VARCHAR(60) NOT NULL UNIQUE
  , minimum_stock DECIMAL(18,6)
  , reorder_point DECIMAL(18,6)
  , reorder_quantity DECIMAL(18,6)
  , lead_time_days INTEGER
  , interchangeable_with VARCHAR(300)
  , status VARCHAR(255) NOT NULL
  , product_id UUID NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Container (bus_container)
CREATE TABLE IF NOT EXISTS bus_container (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , container_number VARCHAR(20) NOT NULL UNIQUE
  , iso_code VARCHAR(10)
  , size_code VARCHAR(20)
  , container_type VARCHAR(50)
  , tare_weight DECIMAL(18,6)
  , max_gross_weight DECIMAL(18,6)
  , manufacture_date DATE
  , status VARCHAR(255) NOT NULL
  , inventory_status VARCHAR(50)
  , owner_id UUID
  , current_location_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
-- Product (bus_product)
CREATE TABLE IF NOT EXISTS bus_product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(300) NOT NULL
  , description VARCHAR(4000)
  , product_type VARCHAR(255) NOT NULL
  , status VARCHAR(255) NOT NULL
  , sku VARCHAR(100)
  , unit_of_measure UUID
  , standard_price DECIMAL(18,6)
  , tax_category VARCHAR(100)
  , currency_id UUID
  , maintenance_plan_id UUID
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_product_name ON bus_product (name);
-- Party Party Type (bus_party_party_type)
CREATE TABLE IF NOT EXISTS bus_party_party_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_party_party_type_name ON bus_party_party_type (name);
-- Party Status (bus_party_status)
CREATE TABLE IF NOT EXISTS bus_party_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_party_status_name ON bus_party_status (name);
-- Person Gender (bus_person_gender)
CREATE TABLE IF NOT EXISTS bus_person_gender (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_person_gender_name ON bus_person_gender (name);
-- Person Party Type (bus_person_party_type)
CREATE TABLE IF NOT EXISTS bus_person_party_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_person_party_type_name ON bus_person_party_type (name);
-- Person Status (bus_person_status)
CREATE TABLE IF NOT EXISTS bus_person_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_person_status_name ON bus_person_status (name);
-- Organization Organization Type (bus_organization_organization_type)
CREATE TABLE IF NOT EXISTS bus_organization_organization_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_organization_organization_type_name ON bus_organization_organization_type (name);
-- Organization Status (bus_organization_status)
CREATE TABLE IF NOT EXISTS bus_organization_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_organization_status_name ON bus_organization_status (name);
-- Organization Party Type (bus_organization_party_type)
CREATE TABLE IF NOT EXISTS bus_organization_party_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_organization_party_type_name ON bus_organization_party_type (name);
-- Party Role Role Type (bus_party_role_role_type)
CREATE TABLE IF NOT EXISTS bus_party_role_role_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_party_role_role_type_name ON bus_party_role_role_type (name);
-- Party Role Status (bus_party_role_status)
CREATE TABLE IF NOT EXISTS bus_party_role_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_party_role_status_name ON bus_party_role_status (name);
-- Party Relationship Relationship Type (bus_party_relationship_relationship_type)
CREATE TABLE IF NOT EXISTS bus_party_relationship_relationship_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_party_relationship_relationship_type_name ON bus_party_relationship_relationship_type (name);
-- Party Relationship Status (bus_party_relationship_status)
CREATE TABLE IF NOT EXISTS bus_party_relationship_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_party_relationship_status_name ON bus_party_relationship_status (name);
-- Legal Entity Status (bus_legal_entity_status)
CREATE TABLE IF NOT EXISTS bus_legal_entity_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_legal_entity_status_name ON bus_legal_entity_status (name);
-- Business Unit Status (bus_business_unit_status)
CREATE TABLE IF NOT EXISTS bus_business_unit_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_business_unit_status_name ON bus_business_unit_status (name);
-- Department Status (bus_department_status)
CREATE TABLE IF NOT EXISTS bus_department_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_department_status_name ON bus_department_status (name);
-- Address Address Type (bus_address_address_type)
CREATE TABLE IF NOT EXISTS bus_address_address_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_address_address_type_name ON bus_address_address_type (name);
-- Address Status (bus_address_status)
CREATE TABLE IF NOT EXISTS bus_address_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_address_status_name ON bus_address_status (name);
-- Contact Point Channel (bus_contact_point_channel)
CREATE TABLE IF NOT EXISTS bus_contact_point_channel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_contact_point_channel_name ON bus_contact_point_channel (name);
-- Contact Point Purpose (bus_contact_point_purpose)
CREATE TABLE IF NOT EXISTS bus_contact_point_purpose (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_contact_point_purpose_name ON bus_contact_point_purpose (name);
-- Contact Point Status (bus_contact_point_status)
CREATE TABLE IF NOT EXISTS bus_contact_point_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_contact_point_status_name ON bus_contact_point_status (name);
-- Location Location Type (bus_location_location_type)
CREATE TABLE IF NOT EXISTS bus_location_location_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_location_location_type_name ON bus_location_location_type (name);
-- Location Status (bus_location_status)
CREATE TABLE IF NOT EXISTS bus_location_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_location_status_name ON bus_location_status (name);
-- Language Direction (bus_language_direction)
CREATE TABLE IF NOT EXISTS bus_language_direction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_language_direction_name ON bus_language_direction (name);
-- Currency Status (bus_currency_status)
CREATE TABLE IF NOT EXISTS bus_currency_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_currency_status_name ON bus_currency_status (name);
-- Exchange Rate Rate Type (bus_exchange_rate_rate_type)
CREATE TABLE IF NOT EXISTS bus_exchange_rate_rate_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_exchange_rate_rate_type_name ON bus_exchange_rate_rate_type (name);
-- Exchange Rate Status (bus_exchange_rate_status)
CREATE TABLE IF NOT EXISTS bus_exchange_rate_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_exchange_rate_status_name ON bus_exchange_rate_status (name);
-- Unit Of Measure Category (bus_unit_of_measure_category)
CREATE TABLE IF NOT EXISTS bus_unit_of_measure_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_unit_of_measure_category_name ON bus_unit_of_measure_category (name);
-- Unit Of Measure Status (bus_unit_of_measure_status)
CREATE TABLE IF NOT EXISTS bus_unit_of_measure_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_unit_of_measure_status_name ON bus_unit_of_measure_status (name);
-- Calendar Status (bus_calendar_status)
CREATE TABLE IF NOT EXISTS bus_calendar_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_calendar_status_name ON bus_calendar_status (name);
-- Calendar Exception Exception Type (bus_calendar_exception_exception_type)
CREATE TABLE IF NOT EXISTS bus_calendar_exception_exception_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_calendar_exception_exception_type_name ON bus_calendar_exception_exception_type (name);
-- Attachment Status (bus_attachment_status)
CREATE TABLE IF NOT EXISTS bus_attachment_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_attachment_status_name ON bus_attachment_status (name);
-- Task Task Type (bus_task_task_type)
CREATE TABLE IF NOT EXISTS bus_task_task_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_task_task_type_name ON bus_task_task_type (name);
-- Task Status (bus_task_status)
CREATE TABLE IF NOT EXISTS bus_task_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_task_status_name ON bus_task_status (name);
-- Task Priority (bus_task_priority)
CREATE TABLE IF NOT EXISTS bus_task_priority (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_task_priority_name ON bus_task_priority (name);
-- Asset Status (bus_asset_status)
CREATE TABLE IF NOT EXISTS bus_asset_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_asset_status_name ON bus_asset_status (name);
-- Meter Meter Type (bus_meter_meter_type)
CREATE TABLE IF NOT EXISTS bus_meter_meter_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_meter_meter_type_name ON bus_meter_meter_type (name);
-- Meter Status (bus_meter_status)
CREATE TABLE IF NOT EXISTS bus_meter_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_meter_status_name ON bus_meter_status (name);
-- Maintenance Plan Maintenance Type (bus_maintenance_plan_maintenance_type)
CREATE TABLE IF NOT EXISTS bus_maintenance_plan_maintenance_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_maintenance_plan_maintenance_type_name ON bus_maintenance_plan_maintenance_type (name);
-- Maintenance Plan Frequency Unit (bus_maintenance_plan_frequency_unit)
CREATE TABLE IF NOT EXISTS bus_maintenance_plan_frequency_unit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_maintenance_plan_frequency_unit_name ON bus_maintenance_plan_frequency_unit (name);
-- Maintenance Plan Status (bus_maintenance_plan_status)
CREATE TABLE IF NOT EXISTS bus_maintenance_plan_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_maintenance_plan_status_name ON bus_maintenance_plan_status (name);
-- Maintenance Work Order Work Type (bus_maintenance_work_order_work_type)
CREATE TABLE IF NOT EXISTS bus_maintenance_work_order_work_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_maintenance_work_order_work_type_name ON bus_maintenance_work_order_work_type (name);
-- Maintenance Work Order Status (bus_maintenance_work_order_status)
CREATE TABLE IF NOT EXISTS bus_maintenance_work_order_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_maintenance_work_order_status_name ON bus_maintenance_work_order_status (name);
-- Maintenance Work Order Priority (bus_maintenance_work_order_priority)
CREATE TABLE IF NOT EXISTS bus_maintenance_work_order_priority (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_maintenance_work_order_priority_name ON bus_maintenance_work_order_priority (name);
-- Repair Estimate Status (bus_repair_estimate_status)
CREATE TABLE IF NOT EXISTS bus_repair_estimate_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_repair_estimate_status_name ON bus_repair_estimate_status (name);
-- Repair Estimate Disposition (bus_repair_estimate_disposition)
CREATE TABLE IF NOT EXISTS bus_repair_estimate_disposition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_repair_estimate_disposition_name ON bus_repair_estimate_disposition (name);
-- Equipment Criticality (bus_equipment_criticality)
CREATE TABLE IF NOT EXISTS bus_equipment_criticality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_equipment_criticality_name ON bus_equipment_criticality (name);
-- Equipment Operating Status (bus_equipment_operating_status)
CREATE TABLE IF NOT EXISTS bus_equipment_operating_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_equipment_operating_status_name ON bus_equipment_operating_status (name);
-- Failure Severity (bus_failure_severity)
CREATE TABLE IF NOT EXISTS bus_failure_severity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_failure_severity_name ON bus_failure_severity (name);
-- Failure Status (bus_failure_status)
CREATE TABLE IF NOT EXISTS bus_failure_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_failure_status_name ON bus_failure_status (name);
-- Spare Part Criticality (bus_spare_part_criticality)
CREATE TABLE IF NOT EXISTS bus_spare_part_criticality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_spare_part_criticality_name ON bus_spare_part_criticality (name);
-- Spare Part Status (bus_spare_part_status)
CREATE TABLE IF NOT EXISTS bus_spare_part_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_spare_part_status_name ON bus_spare_part_status (name);
-- Container Status (bus_container_status)
CREATE TABLE IF NOT EXISTS bus_container_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_container_status_name ON bus_container_status (name);
-- Product Product Type (bus_product_product_type)
CREATE TABLE IF NOT EXISTS bus_product_product_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_product_product_type_name ON bus_product_product_type (name);
-- Product Status (bus_product_status)
CREATE TABLE IF NOT EXISTS bus_product_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , description TEXT
  , sequence INTEGER NOT NULL
  , is_active BOOLEAN NOT NULL
  , created_at TIMESTAMPTZ DEFAULT NOW()
  , updated_at TIMESTAMPTZ DEFAULT NOW()
  , deleted_at TIMESTAMPTZ
  , version INTEGER NOT NULL DEFAULT 1
);

-- Indexes.
--
-- `entity.indexes` is the merge of what the model declared in `indexes` and
-- the conventional single-column ones (a column called `name`, and anything
-- unique). It is merged rather than emitted from both sources because both name
-- an index after its columns: two `CREATE INDEX IF NOT EXISTS` statements with
-- the same name meant the second — the one carrying UNIQUE — was the no-op.
--
-- Composite declarations are the ones that were silently lost before the parser
-- read the model's indexes at all: no convention can produce them.
CREATE INDEX IF NOT EXISTS idx_bus_product_status_name ON bus_product_status (name);

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_address
    ADD CONSTRAINT fk_bus_address_party_id
    FOREIGN KEY (party_id)
    REFERENCES bus_party(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_party_role
    ADD CONSTRAINT fk_bus_party_role_party_id
    FOREIGN KEY (party_id)
    REFERENCES bus_party(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_organization
    ADD CONSTRAINT fk_bus_organization_person_id
    FOREIGN KEY (person_id)
    REFERENCES bus_person(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_address
    ADD CONSTRAINT fk_bus_address_person_id
    FOREIGN KEY (person_id)
    REFERENCES bus_person(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_party_role
    ADD CONSTRAINT fk_bus_party_role_person_id
    FOREIGN KEY (person_id)
    REFERENCES bus_person(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_organization
    ADD CONSTRAINT fk_bus_organization_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_address
    ADD CONSTRAINT fk_bus_address_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_location
    ADD CONSTRAINT fk_bus_location_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_party_role
    ADD CONSTRAINT fk_bus_party_role_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_party_relationship
    ADD CONSTRAINT fk_bus_party_relationship_party_id
    FOREIGN KEY (party_id)
    REFERENCES bus_party(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_party_relationship
    ADD CONSTRAINT fk_bus_party_relationship_party_id
    FOREIGN KEY (party_id)
    REFERENCES bus_party(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_legal_entity
    ADD CONSTRAINT fk_bus_legal_entity_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_legal_entity
    ADD CONSTRAINT fk_bus_legal_entity_country_id
    FOREIGN KEY (country_id)
    REFERENCES bus_country(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_legal_entity
    ADD CONSTRAINT fk_bus_legal_entity_address_id
    FOREIGN KEY (address_id)
    REFERENCES bus_address(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_legal_entity
    ADD CONSTRAINT fk_bus_legal_entity_currency_id
    FOREIGN KEY (currency_id)
    REFERENCES bus_currency(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_legal_entity
    ADD CONSTRAINT fk_bus_legal_entity_legal_entity_id
    FOREIGN KEY (legal_entity_id)
    REFERENCES bus_legal_entity(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_business_unit
    ADD CONSTRAINT fk_bus_business_unit_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_business_unit
    ADD CONSTRAINT fk_bus_business_unit_person_id
    FOREIGN KEY (person_id)
    REFERENCES bus_person(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_business_unit
    ADD CONSTRAINT fk_bus_business_unit_legal_entity_id
    FOREIGN KEY (legal_entity_id)
    REFERENCES bus_legal_entity(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_business_unit
    ADD CONSTRAINT fk_bus_business_unit_business_unit_id
    FOREIGN KEY (business_unit_id)
    REFERENCES bus_business_unit(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_department
    ADD CONSTRAINT fk_bus_department_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_department
    ADD CONSTRAINT fk_bus_department_business_unit_id
    FOREIGN KEY (business_unit_id)
    REFERENCES bus_business_unit(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_department
    ADD CONSTRAINT fk_bus_department_department_id
    FOREIGN KEY (department_id)
    REFERENCES bus_department(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_department
    ADD CONSTRAINT fk_bus_department_person_id
    FOREIGN KEY (person_id)
    REFERENCES bus_person(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_department
    ADD CONSTRAINT fk_bus_department_location_id
    FOREIGN KEY (location_id)
    REFERENCES bus_location(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_address
    ADD CONSTRAINT fk_bus_address_country_id
    FOREIGN KEY (country_id)
    REFERENCES bus_country(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_address
    ADD CONSTRAINT fk_bus_address_state_province_id
    FOREIGN KEY (state_province_id)
    REFERENCES bus_state_province(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_address
    ADD CONSTRAINT fk_bus_address_city_id
    FOREIGN KEY (city_id)
    REFERENCES bus_city(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_contact_point
    ADD CONSTRAINT fk_bus_contact_point_party_id
    FOREIGN KEY (party_id)
    REFERENCES bus_party(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_location
    ADD CONSTRAINT fk_bus_location_location_id
    FOREIGN KEY (location_id)
    REFERENCES bus_location(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_country
    ADD CONSTRAINT fk_bus_country_currency_id
    FOREIGN KEY (currency_id)
    REFERENCES bus_currency(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_state_province
    ADD CONSTRAINT fk_bus_state_province_country_id
    FOREIGN KEY (country_id)
    REFERENCES bus_country(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_city
    ADD CONSTRAINT fk_bus_city_country_id
    FOREIGN KEY (country_id)
    REFERENCES bus_country(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_city
    ADD CONSTRAINT fk_bus_city_state_province_id
    FOREIGN KEY (state_province_id)
    REFERENCES bus_state_province(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_product
    ADD CONSTRAINT fk_bus_product_currency_id
    FOREIGN KEY (currency_id)
    REFERENCES bus_currency(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_exchange_rate
    ADD CONSTRAINT fk_bus_exchange_rate_currency_id
    FOREIGN KEY (currency_id)
    REFERENCES bus_currency(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_exchange_rate
    ADD CONSTRAINT fk_bus_exchange_rate_currency_id
    FOREIGN KEY (currency_id)
    REFERENCES bus_currency(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_exchange_rate
    ADD CONSTRAINT fk_bus_exchange_rate_currency_id
    FOREIGN KEY (currency_id)
    REFERENCES bus_currency(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_exchange_rate
    ADD CONSTRAINT fk_bus_exchange_rate_currency_id
    FOREIGN KEY (currency_id)
    REFERENCES bus_currency(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_unit_of_measure
    ADD CONSTRAINT fk_bus_unit_of_measure_unit_of_measure_id
    FOREIGN KEY (unit_of_measure_id)
    REFERENCES bus_unit_of_measure(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_unit_of_measure
    ADD CONSTRAINT fk_bus_unit_of_measure_unit_of_measure_id
    FOREIGN KEY (unit_of_measure_id)
    REFERENCES bus_unit_of_measure(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_product
    ADD CONSTRAINT fk_bus_product_unit_of_measure_id
    FOREIGN KEY (unit_of_measure_id)
    REFERENCES bus_unit_of_measure(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_calendar
    ADD CONSTRAINT fk_bus_calendar_country_id
    FOREIGN KEY (country_id)
    REFERENCES bus_country(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_calendar
    ADD CONSTRAINT fk_bus_calendar_calendar_id
    FOREIGN KEY (calendar_id)
    REFERENCES bus_calendar(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_calendar_exception
    ADD CONSTRAINT fk_bus_calendar_exception_calendar_id
    FOREIGN KEY (calendar_id)
    REFERENCES bus_calendar(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_attachment
    ADD CONSTRAINT fk_bus_attachment_person_id
    FOREIGN KEY (person_id)
    REFERENCES bus_person(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_task
    ADD CONSTRAINT fk_bus_task_party_id
    FOREIGN KEY (party_id)
    REFERENCES bus_party(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_task
    ADD CONSTRAINT fk_bus_task_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_asset
    ADD CONSTRAINT fk_bus_asset_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_asset
    ADD CONSTRAINT fk_bus_asset_location_id
    FOREIGN KEY (location_id)
    REFERENCES bus_location(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_asset
    ADD CONSTRAINT fk_bus_asset_product_id
    FOREIGN KEY (product_id)
    REFERENCES bus_product(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_maintenance_work_order
    ADD CONSTRAINT fk_bus_maintenance_work_order_asset_id
    FOREIGN KEY (asset_id)
    REFERENCES bus_asset(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_meter
    ADD CONSTRAINT fk_bus_meter_asset_id
    FOREIGN KEY (asset_id)
    REFERENCES bus_asset(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_meter
    ADD CONSTRAINT fk_bus_meter_location_id
    FOREIGN KEY (location_id)
    REFERENCES bus_location(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_meter
    ADD CONSTRAINT fk_bus_meter_unit_of_measure_id
    FOREIGN KEY (unit_of_measure_id)
    REFERENCES bus_unit_of_measure(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_asset
    ADD CONSTRAINT fk_bus_asset_maintenance_plan_id
    FOREIGN KEY (maintenance_plan_id)
    REFERENCES bus_maintenance_plan(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_product
    ADD CONSTRAINT fk_bus_product_maintenance_plan_id
    FOREIGN KEY (maintenance_plan_id)
    REFERENCES bus_maintenance_plan(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_maintenance_work_order
    ADD CONSTRAINT fk_bus_maintenance_work_order_maintenance_plan_id
    FOREIGN KEY (maintenance_plan_id)
    REFERENCES bus_maintenance_plan(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_maintenance_work_order
    ADD CONSTRAINT fk_bus_maintenance_work_order_party_id
    FOREIGN KEY (party_id)
    REFERENCES bus_party(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_maintenance_work_order
    ADD CONSTRAINT fk_bus_maintenance_work_order_location_id
    FOREIGN KEY (location_id)
    REFERENCES bus_location(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_maintenance_work_order
    ADD CONSTRAINT fk_bus_maintenance_work_order_repair_estimate_id
    FOREIGN KEY (repair_estimate_id)
    REFERENCES bus_repair_estimate(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_repair_estimate
    ADD CONSTRAINT fk_bus_repair_estimate_container_id
    FOREIGN KEY (container_id)
    REFERENCES bus_container(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_repair_estimate_line
    ADD CONSTRAINT fk_bus_repair_estimate_line_repair_estimate_id
    FOREIGN KEY (repair_estimate_id)
    REFERENCES bus_repair_estimate(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_repair_estimate
    ADD CONSTRAINT fk_bus_repair_estimate_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_equipment
    ADD CONSTRAINT fk_bus_equipment_asset_id
    FOREIGN KEY (asset_id)
    REFERENCES bus_asset(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_equipment
    ADD CONSTRAINT fk_bus_equipment_location_id
    FOREIGN KEY (location_id)
    REFERENCES bus_location(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_equipment
    ADD CONSTRAINT fk_bus_equipment_equipment_id
    FOREIGN KEY (equipment_id)
    REFERENCES bus_equipment(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_equipment
    ADD CONSTRAINT fk_bus_equipment_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES bus_organization(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_failure
    ADD CONSTRAINT fk_bus_failure_equipment_id
    FOREIGN KEY (equipment_id)
    REFERENCES bus_equipment(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_failure
    ADD CONSTRAINT fk_bus_failure_maintenance_work_order_id
    FOREIGN KEY (maintenance_work_order_id)
    REFERENCES bus_maintenance_work_order(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_failure
    ADD CONSTRAINT fk_bus_failure_person_id
    FOREIGN KEY (person_id)
    REFERENCES bus_person(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_spare_part
    ADD CONSTRAINT fk_bus_spare_part_product_id
    FOREIGN KEY (product_id)
    REFERENCES bus_product(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_equipment
    ADD CONSTRAINT fk_bus_equipment_spare_part_id
    FOREIGN KEY (spare_part_id)
    REFERENCES bus_spare_part(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_maintenance_work_order
    ADD CONSTRAINT fk_bus_maintenance_work_order_spare_part_id
    FOREIGN KEY (spare_part_id)
    REFERENCES bus_spare_part(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_container
    ADD CONSTRAINT fk_bus_container_party_id
    FOREIGN KEY (party_id)
    REFERENCES bus_party(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_container
    ADD CONSTRAINT fk_bus_container_location_id
    FOREIGN KEY (location_id)
    REFERENCES bus_location(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_location
    ADD CONSTRAINT fk_bus_location_product_id
    FOREIGN KEY (product_id)
    REFERENCES bus_product(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN datatype_mismatch THEN NULL;
END $$;

"#;

const DOWN_SQL: &str = r#"
DROP TABLE IF EXISTS bus_party CASCADE;
DROP TABLE IF EXISTS bus_person CASCADE;
DROP TABLE IF EXISTS bus_organization CASCADE;
DROP TABLE IF EXISTS bus_party_role CASCADE;
DROP TABLE IF EXISTS bus_party_relationship CASCADE;
DROP TABLE IF EXISTS bus_legal_entity CASCADE;
DROP TABLE IF EXISTS bus_business_unit CASCADE;
DROP TABLE IF EXISTS bus_department CASCADE;
DROP TABLE IF EXISTS bus_address CASCADE;
DROP TABLE IF EXISTS bus_contact_point CASCADE;
DROP TABLE IF EXISTS bus_location CASCADE;
DROP TABLE IF EXISTS bus_country CASCADE;
DROP TABLE IF EXISTS bus_state_province CASCADE;
DROP TABLE IF EXISTS bus_city CASCADE;
DROP TABLE IF EXISTS bus_language CASCADE;
DROP TABLE IF EXISTS bus_currency CASCADE;
DROP TABLE IF EXISTS bus_exchange_rate CASCADE;
DROP TABLE IF EXISTS bus_unit_of_measure CASCADE;
DROP TABLE IF EXISTS bus_calendar CASCADE;
DROP TABLE IF EXISTS bus_calendar_exception CASCADE;
DROP TABLE IF EXISTS bus_attachment CASCADE;
DROP TABLE IF EXISTS bus_task CASCADE;
DROP TABLE IF EXISTS bus_asset CASCADE;
DROP TABLE IF EXISTS bus_meter CASCADE;
DROP TABLE IF EXISTS bus_maintenance_plan CASCADE;
DROP TABLE IF EXISTS bus_maintenance_work_order CASCADE;
DROP TABLE IF EXISTS bus_repair_estimate CASCADE;
DROP TABLE IF EXISTS bus_repair_estimate_line CASCADE;
DROP TABLE IF EXISTS bus_equipment CASCADE;
DROP TABLE IF EXISTS bus_failure CASCADE;
DROP TABLE IF EXISTS bus_spare_part CASCADE;
DROP TABLE IF EXISTS bus_container CASCADE;
DROP TABLE IF EXISTS bus_product CASCADE;
DROP TABLE IF EXISTS bus_party_party_type CASCADE;
DROP TABLE IF EXISTS bus_party_status CASCADE;
DROP TABLE IF EXISTS bus_person_gender CASCADE;
DROP TABLE IF EXISTS bus_person_party_type CASCADE;
DROP TABLE IF EXISTS bus_person_status CASCADE;
DROP TABLE IF EXISTS bus_organization_organization_type CASCADE;
DROP TABLE IF EXISTS bus_organization_status CASCADE;
DROP TABLE IF EXISTS bus_organization_party_type CASCADE;
DROP TABLE IF EXISTS bus_party_role_role_type CASCADE;
DROP TABLE IF EXISTS bus_party_role_status CASCADE;
DROP TABLE IF EXISTS bus_party_relationship_relationship_type CASCADE;
DROP TABLE IF EXISTS bus_party_relationship_status CASCADE;
DROP TABLE IF EXISTS bus_legal_entity_status CASCADE;
DROP TABLE IF EXISTS bus_business_unit_status CASCADE;
DROP TABLE IF EXISTS bus_department_status CASCADE;
DROP TABLE IF EXISTS bus_address_address_type CASCADE;
DROP TABLE IF EXISTS bus_address_status CASCADE;
DROP TABLE IF EXISTS bus_contact_point_channel CASCADE;
DROP TABLE IF EXISTS bus_contact_point_purpose CASCADE;
DROP TABLE IF EXISTS bus_contact_point_status CASCADE;
DROP TABLE IF EXISTS bus_location_location_type CASCADE;
DROP TABLE IF EXISTS bus_location_status CASCADE;
DROP TABLE IF EXISTS bus_language_direction CASCADE;
DROP TABLE IF EXISTS bus_currency_status CASCADE;
DROP TABLE IF EXISTS bus_exchange_rate_rate_type CASCADE;
DROP TABLE IF EXISTS bus_exchange_rate_status CASCADE;
DROP TABLE IF EXISTS bus_unit_of_measure_category CASCADE;
DROP TABLE IF EXISTS bus_unit_of_measure_status CASCADE;
DROP TABLE IF EXISTS bus_calendar_status CASCADE;
DROP TABLE IF EXISTS bus_calendar_exception_exception_type CASCADE;
DROP TABLE IF EXISTS bus_attachment_status CASCADE;
DROP TABLE IF EXISTS bus_task_task_type CASCADE;
DROP TABLE IF EXISTS bus_task_status CASCADE;
DROP TABLE IF EXISTS bus_task_priority CASCADE;
DROP TABLE IF EXISTS bus_asset_status CASCADE;
DROP TABLE IF EXISTS bus_meter_meter_type CASCADE;
DROP TABLE IF EXISTS bus_meter_status CASCADE;
DROP TABLE IF EXISTS bus_maintenance_plan_maintenance_type CASCADE;
DROP TABLE IF EXISTS bus_maintenance_plan_frequency_unit CASCADE;
DROP TABLE IF EXISTS bus_maintenance_plan_status CASCADE;
DROP TABLE IF EXISTS bus_maintenance_work_order_work_type CASCADE;
DROP TABLE IF EXISTS bus_maintenance_work_order_status CASCADE;
DROP TABLE IF EXISTS bus_maintenance_work_order_priority CASCADE;
DROP TABLE IF EXISTS bus_repair_estimate_status CASCADE;
DROP TABLE IF EXISTS bus_repair_estimate_disposition CASCADE;
DROP TABLE IF EXISTS bus_equipment_criticality CASCADE;
DROP TABLE IF EXISTS bus_equipment_operating_status CASCADE;
DROP TABLE IF EXISTS bus_failure_severity CASCADE;
DROP TABLE IF EXISTS bus_failure_status CASCADE;
DROP TABLE IF EXISTS bus_spare_part_criticality CASCADE;
DROP TABLE IF EXISTS bus_spare_part_status CASCADE;
DROP TABLE IF EXISTS bus_container_status CASCADE;
DROP TABLE IF EXISTS bus_product_product_type CASCADE;
DROP TABLE IF EXISTS bus_product_status CASCADE;
"#;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.get_connection().execute_unprepared(UP_SQL).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(DOWN_SQL)
            .await?;
        Ok(())
    }
}
