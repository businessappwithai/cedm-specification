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
  , current_slot_id UUID
  , yard_id UUID
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
-- Container Movement (bus_container_movement)
CREATE TABLE IF NOT EXISTS bus_container_movement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , movement_number VARCHAR(100) NOT NULL UNIQUE
  , movement_type VARCHAR(255) NOT NULL
  , status VARCHAR(255) NOT NULL
  , planned_at TIMESTAMPTZ
  , started_at TIMESTAMPTZ
  , completed_at TIMESTAMPTZ
  , priority VARCHAR(255) NOT NULL
  , container_id UUID NOT NULL
  , source_slot_id UUID
  , assigned_to_id UUID
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
-- Yard (bus_yard)
CREATE TABLE IF NOT EXISTS bus_yard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(100) NOT NULL UNIQUE
  , name VARCHAR(200) NOT NULL
  , status VARCHAR(255) NOT NULL
  , location_id UUID NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_bus_yard_name ON bus_yard (name);
-- Yard Block (bus_yard_block)
CREATE TABLE IF NOT EXISTS bus_yard_block (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(50) NOT NULL
  , name VARCHAR(150)
  , status VARCHAR(255) NOT NULL
  , yard_id UUID NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_bus_yard_block_name ON bus_yard_block (name);
-- Yard Bay (bus_yard_bay)
CREATE TABLE IF NOT EXISTS bus_yard_bay (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , code VARCHAR(50) NOT NULL
  , bay_number INTEGER NOT NULL
  , status VARCHAR(255) NOT NULL
  , block_id UUID NOT NULL
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
-- Yard Tier (bus_yard_tier)
CREATE TABLE IF NOT EXISTS bus_yard_tier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , tier_number INTEGER NOT NULL
  , status VARCHAR(255) NOT NULL
  , bay_id UUID NOT NULL
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
-- Yard Slot (bus_yard_slot)
CREATE TABLE IF NOT EXISTS bus_yard_slot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , slot_code VARCHAR(100) NOT NULL
  , position INTEGER NOT NULL
  , status VARCHAR(255) NOT NULL
  , latitude DECIMAL(18,6)
  , longitude DECIMAL(18,6)
  , tier_id UUID NOT NULL
  , container_id UUID
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
  ALTER TABLE bus_person
    ADD CONSTRAINT fk_bus_person_person_id
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
  ALTER TABLE bus_person
    ADD CONSTRAINT fk_bus_person_organization_id
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
  ALTER TABLE bus_address
    ADD CONSTRAINT fk_bus_address_location_id
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
  ALTER TABLE bus_location
    ADD CONSTRAINT fk_bus_location_address_id
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
  ALTER TABLE bus_container
    ADD CONSTRAINT fk_bus_container_yard_slot_id
    FOREIGN KEY (yard_slot_id)
    REFERENCES bus_yard_slot(id)
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
  ALTER TABLE bus_container_movement
    ADD CONSTRAINT fk_bus_container_movement_container_id
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
  ALTER TABLE bus_container_movement
    ADD CONSTRAINT fk_bus_container_movement_yard_slot_id
    FOREIGN KEY (yard_slot_id)
    REFERENCES bus_yard_slot(id)
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
  ALTER TABLE bus_container_movement
    ADD CONSTRAINT fk_bus_container_movement_yard_slot_id
    FOREIGN KEY (yard_slot_id)
    REFERENCES bus_yard_slot(id)
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
  ALTER TABLE bus_container_movement
    ADD CONSTRAINT fk_bus_container_movement_party_id
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
  ALTER TABLE bus_yard
    ADD CONSTRAINT fk_bus_yard_location_id
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
  ALTER TABLE bus_yard_block
    ADD CONSTRAINT fk_bus_yard_block_yard_id
    FOREIGN KEY (yard_id)
    REFERENCES bus_yard(id)
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
    ADD CONSTRAINT fk_bus_container_yard_id
    FOREIGN KEY (yard_id)
    REFERENCES bus_yard(id)
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
  ALTER TABLE bus_yard_bay
    ADD CONSTRAINT fk_bus_yard_bay_yard_block_id
    FOREIGN KEY (yard_block_id)
    REFERENCES bus_yard_block(id)
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
  ALTER TABLE bus_yard_tier
    ADD CONSTRAINT fk_bus_yard_tier_yard_bay_id
    FOREIGN KEY (yard_bay_id)
    REFERENCES bus_yard_bay(id)
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
  ALTER TABLE bus_yard_slot
    ADD CONSTRAINT fk_bus_yard_slot_yard_tier_id
    FOREIGN KEY (yard_tier_id)
    REFERENCES bus_yard_tier(id)
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
  ALTER TABLE bus_yard_slot
    ADD CONSTRAINT fk_bus_yard_slot_container_id
    FOREIGN KEY (container_id)
    REFERENCES bus_container(id)
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
DROP TABLE IF EXISTS bus_container CASCADE;
DROP TABLE IF EXISTS bus_container_movement CASCADE;
DROP TABLE IF EXISTS bus_yard CASCADE;
DROP TABLE IF EXISTS bus_yard_block CASCADE;
DROP TABLE IF EXISTS bus_yard_bay CASCADE;
DROP TABLE IF EXISTS bus_yard_tier CASCADE;
DROP TABLE IF EXISTS bus_yard_slot CASCADE;
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
