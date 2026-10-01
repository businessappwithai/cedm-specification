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
  , nationality VARCHAR(2)
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
  , organization_id UUID NOT NULL
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
  , organization_id UUID NOT NULL
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
  , city VARCHAR(150) NOT NULL
  , state_or_province VARCHAR(150)
  , postal_code VARCHAR(30)
  , country_code VARCHAR(2) NOT NULL
  , latitude DECIMAL(18,6)
  , longitude DECIMAL(18,6)
  , is_primary BOOLEAN NOT NULL
  , status VARCHAR(255) NOT NULL
  , party_id UUID
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
-- Contact Point (bus_contact_point)
CREATE TABLE IF NOT EXISTS bus_contact_point (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL
  , name VARCHAR(300) NOT NULL
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
  , code VARCHAR(100) NOT NULL
  , name VARCHAR(300) NOT NULL
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
-- Language (bus_language)
CREATE TABLE IF NOT EXISTS bus_language (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL
  , name VARCHAR(300) NOT NULL
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
  , from_currency UUID NOT NULL
  , to_currency UUID NOT NULL
  , rate DECIMAL(18,6) NOT NULL
  , rate_type VARCHAR(255) NOT NULL
  , effective_at TIMESTAMPTZ NOT NULL
  , expires_at TIMESTAMPTZ
  , source VARCHAR(200) NOT NULL
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
-- Attachment (bus_attachment)
CREATE TABLE IF NOT EXISTS bus_attachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , effective_at TIMESTAMPTZ
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
-- Bill Of Material (bus_bill_of_material)
CREATE TABLE IF NOT EXISTS bus_bill_of_material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , status VARCHAR(255) NOT NULL
  , effective_from DATE
  , effective_to DATE
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
-- BOM Component (bus_bom_component)
CREATE TABLE IF NOT EXISTS bus_bom_component (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , sequence INTEGER NOT NULL
  , quantity DECIMAL(18,6) NOT NULL
  , scrap_percent DECIMAL(18,6)
  , operation_sequence INTEGER
  , bill_of_material_id UUID NOT NULL
  , component_product_id UUID NOT NULL
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
-- Routing (bus_routing)
CREATE TABLE IF NOT EXISTS bus_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL
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
-- Operation (bus_operation)
CREATE TABLE IF NOT EXISTS bus_operation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , sequence INTEGER NOT NULL
  , name VARCHAR(300) NOT NULL
  , standard_minutes DECIMAL(18,6)
  , routing_id UUID NOT NULL
  , work_center_id UUID
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
CREATE INDEX IF NOT EXISTS idx_bus_operation_name ON bus_operation (name);
-- Work Center (bus_work_center)
CREATE TABLE IF NOT EXISTS bus_work_center (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(300) NOT NULL
  , capacity_per_hour DECIMAL(18,6)
  , status VARCHAR(255) NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_bus_work_center_name ON bus_work_center (name);
-- Manufacturing Work Order (bus_manufacturing_work_order)
CREATE TABLE IF NOT EXISTS bus_manufacturing_work_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , order_number VARCHAR(100) NOT NULL UNIQUE
  , quantity DECIMAL(18,6) NOT NULL
  , planned_start TIMESTAMPTZ
  , planned_end TIMESTAMPTZ
  , status VARCHAR(255) NOT NULL
  , product_id UUID NOT NULL
  , location_id UUID
  , bill_of_material_id UUID
  , routing_id UUID
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
-- Material Issue (bus_material_issue)
CREATE TABLE IF NOT EXISTS bus_material_issue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , issue_number VARCHAR(100) NOT NULL UNIQUE
  , quantity DECIMAL(18,6) NOT NULL
  , issued_at TIMESTAMPTZ NOT NULL
  , work_order_id UUID NOT NULL
  , bom_component_id UUID
  , product_id UUID NOT NULL
  , lot_id UUID
  , inventory_movement_id UUID NOT NULL
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
-- Production Receipt (bus_production_receipt)
CREATE TABLE IF NOT EXISTS bus_production_receipt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , receipt_number VARCHAR(100) NOT NULL UNIQUE
  , quantity DECIMAL(18,6) NOT NULL
  , received_at TIMESTAMPTZ NOT NULL
  , work_order_id UUID NOT NULL
  , product_id UUID NOT NULL
  , lot_id UUID
  , quality_inspection_id UUID
  , inventory_movement_id UUID NOT NULL
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
-- Lot (bus_lot)
CREATE TABLE IF NOT EXISTS bus_lot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , lot_number VARCHAR(150) NOT NULL
  , manufactured_at TIMESTAMPTZ
  , expires_at TIMESTAMPTZ
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
-- Serial Number (bus_serial_number)
CREATE TABLE IF NOT EXISTS bus_serial_number (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , serial_code VARCHAR(200) NOT NULL
  , status VARCHAR(255) NOT NULL
  , product_id UUID NOT NULL
  , material_issue_id UUID
  , production_receipt_id UUID
  , lot_id UUID
  , scrap_id UUID
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
-- Inventory Movement (bus_inventory_movement)
CREATE TABLE IF NOT EXISTS bus_inventory_movement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , movement_number VARCHAR(100) NOT NULL UNIQUE
  , movement_type VARCHAR(255) NOT NULL
  , quantity DECIMAL(18,6) NOT NULL
  , movement_date TIMESTAMPTZ NOT NULL
  , reason VARCHAR(500)
  , unit_of_measure_id UUID
  , product_id UUID NOT NULL
  , lot_id UUID
  , party_id UUID
  , scrap_id UUID
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
-- Quality Inspection (bus_quality_inspection)
CREATE TABLE IF NOT EXISTS bus_quality_inspection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , inspection_number VARCHAR(100) NOT NULL UNIQUE
  , inspection_date TIMESTAMPTZ NOT NULL
  , status VARCHAR(255) NOT NULL
  , result VARCHAR(255)
  , disposition VARCHAR(255)
  , notes VARCHAR(4000)
  , product_id UUID
  , inspector_id UUID
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
-- Production Record (bus_production_record)
CREATE TABLE IF NOT EXISTS bus_production_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , production_date TIMESTAMPTZ NOT NULL
  , quantity DECIMAL(18,6) NOT NULL
  , status VARCHAR(255) NOT NULL
  , product_id UUID NOT NULL
  , location_id UUID
  , work_order_id UUID
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
-- Scrap (bus_scrap)
CREATE TABLE IF NOT EXISTS bus_scrap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , scrap_number VARCHAR(100) NOT NULL UNIQUE
  , quantity DECIMAL(18,6) NOT NULL
  , reason_code VARCHAR(100) NOT NULL
  , scrapped_at TIMESTAMPTZ NOT NULL
  , work_order_id UUID NOT NULL
  , product_id UUID NOT NULL
  , lot_id UUID
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
-- Product Lifecycle (bus_product_lifecycle)
CREATE TABLE IF NOT EXISTS bus_product_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , effective_at TIMESTAMPTZ NOT NULL
  , lifecycle_status VARCHAR(255) NOT NULL
  , reason VARCHAR(1000) NOT NULL
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
  ALTER TABLE bus_inventory_movement
    ADD CONSTRAINT fk_bus_inventory_movement_unit_of_measure_id
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

-- The TypeScript migration wraps this in `.catch(() => {})`; the DO block is
-- how that same tolerance is expressed in plain SQL. Re-running a migration or
-- a model whose FK column was typed as something other than UUID must not
-- abort the whole migration.
DO $$ BEGIN
  ALTER TABLE bus_inventory_movement
    ADD CONSTRAINT fk_bus_inventory_movement_product_id
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
  ALTER TABLE bus_lot
    ADD CONSTRAINT fk_bus_lot_product_id
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
  ALTER TABLE bus_serial_number
    ADD CONSTRAINT fk_bus_serial_number_product_id
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
  ALTER TABLE bus_product_lifecycle
    ADD CONSTRAINT fk_bus_product_lifecycle_product_id
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
  ALTER TABLE bus_bill_of_material
    ADD CONSTRAINT fk_bus_bill_of_material_product_id
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
  ALTER TABLE bus_bom_component
    ADD CONSTRAINT fk_bus_bom_component_bill_of_material_id
    FOREIGN KEY (bill_of_material_id)
    REFERENCES bus_bill_of_material(id)
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
  ALTER TABLE bus_bom_component
    ADD CONSTRAINT fk_bus_bom_component_product_id
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
  ALTER TABLE bus_routing
    ADD CONSTRAINT fk_bus_routing_product_id
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
  ALTER TABLE bus_operation
    ADD CONSTRAINT fk_bus_operation_routing_id
    FOREIGN KEY (routing_id)
    REFERENCES bus_routing(id)
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
  ALTER TABLE bus_operation
    ADD CONSTRAINT fk_bus_operation_work_center_id
    FOREIGN KEY (work_center_id)
    REFERENCES bus_work_center(id)
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
  ALTER TABLE bus_work_center
    ADD CONSTRAINT fk_bus_work_center_location_id
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
  ALTER TABLE bus_manufacturing_work_order
    ADD CONSTRAINT fk_bus_manufacturing_work_order_product_id
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
  ALTER TABLE bus_manufacturing_work_order
    ADD CONSTRAINT fk_bus_manufacturing_work_order_location_id
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
  ALTER TABLE bus_manufacturing_work_order
    ADD CONSTRAINT fk_bus_manufacturing_work_order_bill_of_material_id
    FOREIGN KEY (bill_of_material_id)
    REFERENCES bus_bill_of_material(id)
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
  ALTER TABLE bus_manufacturing_work_order
    ADD CONSTRAINT fk_bus_manufacturing_work_order_routing_id
    FOREIGN KEY (routing_id)
    REFERENCES bus_routing(id)
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
  ALTER TABLE bus_material_issue
    ADD CONSTRAINT fk_bus_material_issue_manufacturing_work_order_id
    FOREIGN KEY (manufacturing_work_order_id)
    REFERENCES bus_manufacturing_work_order(id)
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
  ALTER TABLE bus_production_receipt
    ADD CONSTRAINT fk_bus_production_receipt_manufacturing_work_order_id
    FOREIGN KEY (manufacturing_work_order_id)
    REFERENCES bus_manufacturing_work_order(id)
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
  ALTER TABLE bus_scrap
    ADD CONSTRAINT fk_bus_scrap_manufacturing_work_order_id
    FOREIGN KEY (manufacturing_work_order_id)
    REFERENCES bus_manufacturing_work_order(id)
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
  ALTER TABLE bus_material_issue
    ADD CONSTRAINT fk_bus_material_issue_bom_component_id
    FOREIGN KEY (bom_component_id)
    REFERENCES bus_bom_component(id)
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
  ALTER TABLE bus_material_issue
    ADD CONSTRAINT fk_bus_material_issue_product_id
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
  ALTER TABLE bus_material_issue
    ADD CONSTRAINT fk_bus_material_issue_lot_id
    FOREIGN KEY (lot_id)
    REFERENCES bus_lot(id)
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
  ALTER TABLE bus_serial_number
    ADD CONSTRAINT fk_bus_serial_number_material_issue_id
    FOREIGN KEY (material_issue_id)
    REFERENCES bus_material_issue(id)
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
  ALTER TABLE bus_production_receipt
    ADD CONSTRAINT fk_bus_production_receipt_product_id
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
  ALTER TABLE bus_production_receipt
    ADD CONSTRAINT fk_bus_production_receipt_lot_id
    FOREIGN KEY (lot_id)
    REFERENCES bus_lot(id)
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
  ALTER TABLE bus_serial_number
    ADD CONSTRAINT fk_bus_serial_number_production_receipt_id
    FOREIGN KEY (production_receipt_id)
    REFERENCES bus_production_receipt(id)
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
  ALTER TABLE bus_production_receipt
    ADD CONSTRAINT fk_bus_production_receipt_quality_inspection_id
    FOREIGN KEY (quality_inspection_id)
    REFERENCES bus_quality_inspection(id)
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
  ALTER TABLE bus_inventory_movement
    ADD CONSTRAINT fk_bus_inventory_movement_lot_id
    FOREIGN KEY (lot_id)
    REFERENCES bus_lot(id)
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
  ALTER TABLE bus_serial_number
    ADD CONSTRAINT fk_bus_serial_number_lot_id
    FOREIGN KEY (lot_id)
    REFERENCES bus_lot(id)
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
  ALTER TABLE bus_inventory_movement
    ADD CONSTRAINT fk_bus_inventory_movement_party_id
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
  ALTER TABLE bus_quality_inspection
    ADD CONSTRAINT fk_bus_quality_inspection_product_id
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
  ALTER TABLE bus_quality_inspection
    ADD CONSTRAINT fk_bus_quality_inspection_party_id
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
  ALTER TABLE bus_production_record
    ADD CONSTRAINT fk_bus_production_record_product_id
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
  ALTER TABLE bus_production_record
    ADD CONSTRAINT fk_bus_production_record_location_id
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
  ALTER TABLE bus_production_record
    ADD CONSTRAINT fk_bus_production_record_manufacturing_work_order_id
    FOREIGN KEY (manufacturing_work_order_id)
    REFERENCES bus_manufacturing_work_order(id)
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
  ALTER TABLE bus_scrap
    ADD CONSTRAINT fk_bus_scrap_product_id
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
  ALTER TABLE bus_scrap
    ADD CONSTRAINT fk_bus_scrap_lot_id
    FOREIGN KEY (lot_id)
    REFERENCES bus_lot(id)
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
  ALTER TABLE bus_serial_number
    ADD CONSTRAINT fk_bus_serial_number_scrap_id
    FOREIGN KEY (scrap_id)
    REFERENCES bus_scrap(id)
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
DROP TABLE IF EXISTS bus_language CASCADE;
DROP TABLE IF EXISTS bus_currency CASCADE;
DROP TABLE IF EXISTS bus_exchange_rate CASCADE;
DROP TABLE IF EXISTS bus_unit_of_measure CASCADE;
DROP TABLE IF EXISTS bus_calendar CASCADE;
DROP TABLE IF EXISTS bus_attachment CASCADE;
DROP TABLE IF EXISTS bus_product CASCADE;
DROP TABLE IF EXISTS bus_bill_of_material CASCADE;
DROP TABLE IF EXISTS bus_bom_component CASCADE;
DROP TABLE IF EXISTS bus_routing CASCADE;
DROP TABLE IF EXISTS bus_operation CASCADE;
DROP TABLE IF EXISTS bus_work_center CASCADE;
DROP TABLE IF EXISTS bus_manufacturing_work_order CASCADE;
DROP TABLE IF EXISTS bus_material_issue CASCADE;
DROP TABLE IF EXISTS bus_production_receipt CASCADE;
DROP TABLE IF EXISTS bus_lot CASCADE;
DROP TABLE IF EXISTS bus_serial_number CASCADE;
DROP TABLE IF EXISTS bus_inventory_movement CASCADE;
DROP TABLE IF EXISTS bus_quality_inspection CASCADE;
DROP TABLE IF EXISTS bus_production_record CASCADE;
DROP TABLE IF EXISTS bus_scrap CASCADE;
DROP TABLE IF EXISTS bus_product_lifecycle CASCADE;
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
