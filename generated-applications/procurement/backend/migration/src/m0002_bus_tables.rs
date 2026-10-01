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
  , supplier_id UUID
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
-- Supplier (bus_supplier)
CREATE TABLE IF NOT EXISTS bus_supplier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , party_role_id UUID NOT NULL
  , supplier_code VARCHAR(100) NOT NULL UNIQUE
  , supplier_type VARCHAR(255)
  , qualification_status VARCHAR(255)
  , payment_terms VARCHAR(255)
  , status VARCHAR(255) NOT NULL
  , party_id UUID NOT NULL
  , role_type VARCHAR(255) NOT NULL
  , code VARCHAR(100)
  , valid_from DATE
  , valid_to DATE
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
-- Purchase Requisition (bus_purchase_requisition)
CREATE TABLE IF NOT EXISTS bus_purchase_requisition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , requisition_number VARCHAR(100) NOT NULL UNIQUE
  , requisition_date DATE NOT NULL
  , status VARCHAR(255) NOT NULL
  , justification VARCHAR(2000)
  , requester_id UUID NOT NULL
  , organization_id UUID
  , supplier_id UUID
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
-- Purchase Requisition Line (bus_purchase_requisition_line)
CREATE TABLE IF NOT EXISTS bus_purchase_requisition_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , quantity DECIMAL(18,6) NOT NULL
  , requested_date DATE
  , description VARCHAR(1000) NOT NULL
  , requisition_id UUID NOT NULL
  , product_id UUID
  , unit_of_measure_id UUID
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
-- Request For Quotation (bus_request_for_quotation)
CREATE TABLE IF NOT EXISTS bus_request_for_quotation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , rfq_number VARCHAR(100) NOT NULL UNIQUE
  , issued_at TIMESTAMPTZ
  , response_due_at TIMESTAMPTZ
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
-- Request For Quotation Line (bus_request_for_quotation_line)
CREATE TABLE IF NOT EXISTS bus_request_for_quotation_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , requested_quantity DECIMAL(18,6) NOT NULL
  , description VARCHAR(2000) NOT NULL
  , requisition_line_id UUID
  , request_for_quotation_id UUID NOT NULL
  , product_id UUID
  , unit_of_measure_id UUID
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
-- Supplier Quotation (bus_supplier_quotation)
CREATE TABLE IF NOT EXISTS bus_supplier_quotation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , quotation_number VARCHAR(120) NOT NULL
  , submitted_at TIMESTAMPTZ NOT NULL
  , valid_until DATE
  , total_amount DECIMAL(18,6)
  , status VARCHAR(255) NOT NULL
  , supplier_id UUID NOT NULL
  , request_for_quotation_id UUID NOT NULL
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
-- Supplier Quotation Line (bus_supplier_quotation_line)
CREATE TABLE IF NOT EXISTS bus_supplier_quotation_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , offered_quantity DECIMAL(18,6) NOT NULL
  , unit_price DECIMAL(18,6) NOT NULL
  , promised_date DATE
  , award_status VARCHAR(255) NOT NULL
  , request_for_quotation_line_id UUID NOT NULL
  , supplier_quotation_id UUID NOT NULL
  , product_id UUID
  , unit_of_measure_id UUID
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
-- Purchase Order (bus_purchase_order)
CREATE TABLE IF NOT EXISTS bus_purchase_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , order_number VARCHAR(100) NOT NULL UNIQUE
  , order_date TIMESTAMPTZ NOT NULL
  , status VARCHAR(255) NOT NULL
  , currency_id UUID
  , requested_delivery_date DATE
  , total_amount DECIMAL(18,6)
  , supplier_id UUID NOT NULL
  , request_for_quotation_id UUID
  , supplier_quotation_id UUID
  , organization_id UUID
  , delivery_location_id UUID
  , supplier_performance_assessment_id UUID
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
-- Purchase Order Line (bus_purchase_order_line)
CREATE TABLE IF NOT EXISTS bus_purchase_order_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , quantity DECIMAL(18,6) NOT NULL
  , unit_price DECIMAL(18,6) NOT NULL
  , line_amount DECIMAL(18,6) NOT NULL
  , received_quantity DECIMAL(18,6) NOT NULL
  , accepted_quantity DECIMAL(18,6) NOT NULL
  , returned_quantity DECIMAL(18,6) NOT NULL
  , outstanding_quantity DECIMAL(18,6) NOT NULL
  , price_source VARCHAR(255)
  , price_determined_at TIMESTAMPTZ
  , unit_of_measure_id UUID
  , supplier_quotation_line_id UUID
  , purchase_order_id UUID NOT NULL
  , product_id UUID NOT NULL
  , purchase_requisition_line_id UUID
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
-- Goods Receipt (bus_goods_receipt)
CREATE TABLE IF NOT EXISTS bus_goods_receipt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , receipt_number VARCHAR(100) NOT NULL UNIQUE
  , receipt_date TIMESTAMPTZ NOT NULL
  , status VARCHAR(255) NOT NULL
  , received_quantity DECIMAL(18,6) NOT NULL
  , accepted_quantity DECIMAL(18,6) NOT NULL
  , notes VARCHAR(2000)
  , supplier_id UUID NOT NULL
  , purchase_order_id UUID NOT NULL
  , supplier_claim_id UUID
  , supplier_performance_assessment_id UUID
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
-- Goods Receipt Line (bus_goods_receipt_line)
CREATE TABLE IF NOT EXISTS bus_goods_receipt_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , received_quantity DECIMAL(18,6) NOT NULL
  , accepted_quantity DECIMAL(18,6) NOT NULL
  , rejected_quantity DECIMAL(18,6) NOT NULL
  , pending_inspection_quantity DECIMAL(18,6) NOT NULL
  , unit_price DECIMAL(18,6)
  , notes VARCHAR(2000)
  , unit_of_measure_id UUID NOT NULL
  , purchase_order_line_id UUID NOT NULL
  , goods_receipt_id UUID NOT NULL
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
-- Supplier Claim (bus_supplier_claim)
CREATE TABLE IF NOT EXISTS bus_supplier_claim (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , claim_number VARCHAR(100) NOT NULL UNIQUE
  , claim_date TIMESTAMPTZ NOT NULL
  , status VARCHAR(255) NOT NULL
  , claim_type VARCHAR(255) NOT NULL
  , claimed_amount DECIMAL(18,6)
  , resolution_code VARCHAR(255)
  , notes VARCHAR(4000)
  , supplier_id UUID NOT NULL
  , purchase_order_id UUID
  , supplier_performance_assessment_id UUID
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
-- Supplier Claim Resolution (bus_supplier_claim_resolution)
CREATE TABLE IF NOT EXISTS bus_supplier_claim_resolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , resolution_number VARCHAR(100) NOT NULL UNIQUE
  , resolution_date TIMESTAMPTZ NOT NULL
  , resolution_type VARCHAR(255) NOT NULL
  , status VARCHAR(255) NOT NULL
  , approved_amount DECIMAL(18,6)
  , supplier_id UUID
  , supplier_claim_id UUID NOT NULL
  , supplier_performance_assessment_id UUID
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
-- Supplier Credit Note (bus_supplier_credit_note)
CREATE TABLE IF NOT EXISTS bus_supplier_credit_note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , credit_note_number VARCHAR(100) NOT NULL UNIQUE
  , credit_note_date DATE NOT NULL
  , status VARCHAR(255) NOT NULL
  , currency_id UUID NOT NULL
  , subtotal DECIMAL(18,6) NOT NULL
  , tax_amount DECIMAL(18,6) NOT NULL
  , total_amount DECIMAL(18,6) NOT NULL
  , amount_applied DECIMAL(18,6) NOT NULL
  , amount_unapplied DECIMAL(18,6) NOT NULL
  , supplier_id UUID NOT NULL
  , supplier_claim_id UUID
  , supplier_claim_resolution_id UUID
  , source_return_id UUID
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
-- Supplier Credit Note Line (bus_supplier_credit_note_line)
CREATE TABLE IF NOT EXISTS bus_supplier_credit_note_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , quantity DECIMAL(18,6)
  , unit_price DECIMAL(18,6)
  , gross_amount DECIMAL(18,6) NOT NULL
  , discount_amount DECIMAL(18,6) NOT NULL
  , taxable_amount DECIMAL(18,6) NOT NULL
  , tax_amount DECIMAL(18,6) NOT NULL
  , net_amount DECIMAL(18,6) NOT NULL
  , supplier_credit_note_id UUID NOT NULL
  , supplier_return_line_id UUID
  , invoice_line_id UUID
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
-- Supplier Credit Note Application (bus_supplier_credit_note_application)
CREATE TABLE IF NOT EXISTS bus_supplier_credit_note_application (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , supplier_credit_amount DECIMAL(18,6) NOT NULL
  , invoice_amount DECIMAL(18,6) NOT NULL
  , exchange_rate_id UUID
  , applied_at TIMESTAMPTZ NOT NULL
  , status VARCHAR(255) NOT NULL
  , reversal_of_application_id UUID
  , supplier_credit_note_id UUID NOT NULL
  , invoice_id UUID NOT NULL
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
-- Supplier Debit Note (bus_supplier_debit_note)
CREATE TABLE IF NOT EXISTS bus_supplier_debit_note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , debit_note_number VARCHAR(100) NOT NULL UNIQUE
  , debit_note_date DATE NOT NULL
  , status VARCHAR(255) NOT NULL
  , currency_id UUID NOT NULL
  , subtotal DECIMAL(18,6) NOT NULL
  , tax_amount DECIMAL(18,6) NOT NULL
  , total_amount DECIMAL(18,6) NOT NULL
  , amount_applied DECIMAL(18,6) NOT NULL
  , amount_remaining DECIMAL(18,6) NOT NULL
  , supplier_id UUID NOT NULL
  , supplier_claim_id UUID
  , supplier_claim_resolution_id UUID
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
-- Supplier Debit Note Line (bus_supplier_debit_note_line)
CREATE TABLE IF NOT EXISTS bus_supplier_debit_note_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , quantity DECIMAL(18,6)
  , unit_price DECIMAL(18,6)
  , gross_amount DECIMAL(18,6) NOT NULL
  , tax_amount DECIMAL(18,6) NOT NULL
  , net_amount DECIMAL(18,6) NOT NULL
  , reason_code VARCHAR(100) NOT NULL
  , supplier_debit_note_id UUID NOT NULL
  , supplier_claim_id UUID
  , supplier_claim_resolution_id UUID
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
-- Supplier Debit Note Application (bus_supplier_debit_note_application)
CREATE TABLE IF NOT EXISTS bus_supplier_debit_note_application (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , supplier_debit_amount DECIMAL(18,6) NOT NULL
  , invoice_amount DECIMAL(18,6) NOT NULL
  , exchange_rate_id UUID
  , applied_at TIMESTAMPTZ NOT NULL
  , status VARCHAR(255) NOT NULL
  , reversal_of_application_id UUID
  , supplier_debit_note_id UUID NOT NULL
  , invoice_id UUID NOT NULL
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
-- Supplier Performance Assessment (bus_supplier_performance_assessment)
CREATE TABLE IF NOT EXISTS bus_supplier_performance_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , assessment_number VARCHAR(100) NOT NULL UNIQUE
  , assessment_date DATE NOT NULL
  , period_start DATE NOT NULL
  , period_end DATE NOT NULL
  , status VARCHAR(255) NOT NULL
  , overall_score DECIMAL(18,6)
  , rating VARCHAR(255)
  , notes VARCHAR(4000)
  , supplier_id UUID NOT NULL
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
-- Supplier Return (bus_supplier_return)
CREATE TABLE IF NOT EXISTS bus_supplier_return (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , return_number VARCHAR(100) NOT NULL UNIQUE
  , status VARCHAR(255) NOT NULL
  , return_date TIMESTAMPTZ NOT NULL
  , reason_code VARCHAR(100)
  , supplier_id UUID NOT NULL
  , purchase_order_id UUID
  , supplier_claim_id UUID
  , supplier_claim_resolution_id UUID
  , supplier_performance_assessment_id UUID
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
-- Supplier Return Line (bus_supplier_return_line)
CREATE TABLE IF NOT EXISTS bus_supplier_return_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , quantity_returned DECIMAL(18,6) NOT NULL
  , approved_credit_amount DECIMAL(18,6)
  , disposition VARCHAR(255) NOT NULL
  , purchase_order_line_id UUID NOT NULL
  , supplier_return_id UUID NOT NULL
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
-- Invoice (bus_invoice)
CREATE TABLE IF NOT EXISTS bus_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , invoice_number VARCHAR(100) NOT NULL UNIQUE
  , invoice_date DATE NOT NULL
  , due_date DATE
  , invoice_type VARCHAR(255) NOT NULL
  , status VARCHAR(255) NOT NULL
  , currency_id UUID NOT NULL
  , subtotal DECIMAL(18,6) NOT NULL
  , discount_amount DECIMAL(18,6) NOT NULL
  , taxable_amount DECIMAL(18,6) NOT NULL
  , tax_amount DECIMAL(18,6) NOT NULL
  , total_amount DECIMAL(18,6) NOT NULL
  , amount_settled DECIMAL(18,6) NOT NULL
  , amount_credited DECIMAL(18,6) NOT NULL
  , amount_outstanding DECIMAL(18,6) NOT NULL
  , supplier_id UUID
  , purchase_order_id UUID
  , supplier_claim_id UUID
  , supplier_return_id UUID
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
-- Invoice Line (bus_invoice_line)
CREATE TABLE IF NOT EXISTS bus_invoice_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  , line_number INTEGER NOT NULL
  , quantity DECIMAL(18,6)
  , unit_price DECIMAL(18,6)
  , gross_amount DECIMAL(18,6) NOT NULL
  , discount_amount DECIMAL(18,6) NOT NULL
  , taxable_amount DECIMAL(18,6) NOT NULL
  , tax_amount DECIMAL(18,6) NOT NULL
  , net_amount DECIMAL(18,6) NOT NULL
  , pricing_evidence VARCHAR(255)
  , discount_evidence VARCHAR(255)
  , tax_evidence VARCHAR(255)
  , description VARCHAR(1000)
  , matching_status VARCHAR(255) NOT NULL
  , unit_of_measure_id UUID
  , purchase_order_line_id UUID
  , supplier_debit_note_line_id UUID
  , supplier_return_line_id UUID
  , product_id UUID
  , invoice_id UUID NOT NULL
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
  ALTER TABLE bus_invoice
    ADD CONSTRAINT fk_bus_invoice_currency_id
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
  ALTER TABLE bus_purchase_order_line
    ADD CONSTRAINT fk_bus_purchase_order_line_unit_of_measure_id
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
  ALTER TABLE bus_goods_receipt_line
    ADD CONSTRAINT fk_bus_goods_receipt_line_unit_of_measure_id
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
  ALTER TABLE bus_invoice_line
    ADD CONSTRAINT fk_bus_invoice_line_unit_of_measure_id
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
  ALTER TABLE bus_address
    ADD CONSTRAINT fk_bus_address_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_purchase_order
    ADD CONSTRAINT fk_bus_purchase_order_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_goods_receipt
    ADD CONSTRAINT fk_bus_goods_receipt_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_invoice
    ADD CONSTRAINT fk_bus_invoice_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_supplier_return
    ADD CONSTRAINT fk_bus_supplier_return_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_supplier_credit_note
    ADD CONSTRAINT fk_bus_supplier_credit_note_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_supplier_debit_note
    ADD CONSTRAINT fk_bus_supplier_debit_note_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_supplier_claim
    ADD CONSTRAINT fk_bus_supplier_claim_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_supplier_claim_resolution
    ADD CONSTRAINT fk_bus_supplier_claim_resolution_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_supplier_performance_assessment
    ADD CONSTRAINT fk_bus_supplier_performance_assessment_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_supplier_quotation
    ADD CONSTRAINT fk_bus_supplier_quotation_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_supplier
    ADD CONSTRAINT fk_bus_supplier_party_id
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
  ALTER TABLE bus_supplier
    ADD CONSTRAINT fk_bus_supplier_organization_id
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
  ALTER TABLE bus_purchase_requisition
    ADD CONSTRAINT fk_bus_purchase_requisition_party_id
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
  ALTER TABLE bus_purchase_requisition
    ADD CONSTRAINT fk_bus_purchase_requisition_organization_id
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
  ALTER TABLE bus_purchase_requisition_line
    ADD CONSTRAINT fk_bus_purchase_requisition_line_purchase_requisition_id
    FOREIGN KEY (purchase_requisition_id)
    REFERENCES bus_purchase_requisition(id)
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
  ALTER TABLE bus_purchase_requisition
    ADD CONSTRAINT fk_bus_purchase_requisition_supplier_id
    FOREIGN KEY (supplier_id)
    REFERENCES bus_supplier(id)
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
  ALTER TABLE bus_purchase_requisition_line
    ADD CONSTRAINT fk_bus_purchase_requisition_line_product_id
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
  ALTER TABLE bus_purchase_requisition_line
    ADD CONSTRAINT fk_bus_purchase_requisition_line_unit_of_measure_id
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
  ALTER TABLE bus_request_for_quotation_line
    ADD CONSTRAINT fk_bus_request_for_quotation_line_purchase_requisition_line_id
    FOREIGN KEY (purchase_requisition_line_id)
    REFERENCES bus_purchase_requisition_line(id)
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
  ALTER TABLE bus_request_for_quotation_line
    ADD CONSTRAINT fk_bus_request_for_quotation_line_request_for_quotation_id
    FOREIGN KEY (request_for_quotation_id)
    REFERENCES bus_request_for_quotation(id)
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
  ALTER TABLE bus_supplier_quotation
    ADD CONSTRAINT fk_bus_supplier_quotation_request_for_quotation_id
    FOREIGN KEY (request_for_quotation_id)
    REFERENCES bus_request_for_quotation(id)
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
  ALTER TABLE bus_purchase_order
    ADD CONSTRAINT fk_bus_purchase_order_request_for_quotation_id
    FOREIGN KEY (request_for_quotation_id)
    REFERENCES bus_request_for_quotation(id)
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
  ALTER TABLE bus_request_for_quotation_line
    ADD CONSTRAINT fk_bus_request_for_quotation_line_product_id
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
  ALTER TABLE bus_request_for_quotation_line
    ADD CONSTRAINT fk_bus_request_for_quotation_line_unit_of_measure_id
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
  ALTER TABLE bus_supplier_quotation_line
    ADD CONSTRAINT fk_bus_supplier_quotation_line_request_for_quotation_line_id
    FOREIGN KEY (request_for_quotation_line_id)
    REFERENCES bus_request_for_quotation_line(id)
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
  ALTER TABLE bus_supplier_quotation_line
    ADD CONSTRAINT fk_bus_supplier_quotation_line_supplier_quotation_id
    FOREIGN KEY (supplier_quotation_id)
    REFERENCES bus_supplier_quotation(id)
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
  ALTER TABLE bus_purchase_order
    ADD CONSTRAINT fk_bus_purchase_order_supplier_quotation_id
    FOREIGN KEY (supplier_quotation_id)
    REFERENCES bus_supplier_quotation(id)
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
  ALTER TABLE bus_supplier_quotation_line
    ADD CONSTRAINT fk_bus_supplier_quotation_line_product_id
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
  ALTER TABLE bus_supplier_quotation_line
    ADD CONSTRAINT fk_bus_supplier_quotation_line_unit_of_measure_id
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
  ALTER TABLE bus_purchase_order_line
    ADD CONSTRAINT fk_bus_purchase_order_line_supplier_quotation_line_id
    FOREIGN KEY (supplier_quotation_line_id)
    REFERENCES bus_supplier_quotation_line(id)
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
  ALTER TABLE bus_purchase_order
    ADD CONSTRAINT fk_bus_purchase_order_organization_id
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
  ALTER TABLE bus_purchase_order_line
    ADD CONSTRAINT fk_bus_purchase_order_line_purchase_order_id
    FOREIGN KEY (purchase_order_id)
    REFERENCES bus_purchase_order(id)
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
  ALTER TABLE bus_purchase_order
    ADD CONSTRAINT fk_bus_purchase_order_location_id
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
  ALTER TABLE bus_goods_receipt
    ADD CONSTRAINT fk_bus_goods_receipt_purchase_order_id
    FOREIGN KEY (purchase_order_id)
    REFERENCES bus_purchase_order(id)
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
  ALTER TABLE bus_invoice
    ADD CONSTRAINT fk_bus_invoice_purchase_order_id
    FOREIGN KEY (purchase_order_id)
    REFERENCES bus_purchase_order(id)
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
  ALTER TABLE bus_supplier_return
    ADD CONSTRAINT fk_bus_supplier_return_purchase_order_id
    FOREIGN KEY (purchase_order_id)
    REFERENCES bus_purchase_order(id)
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
  ALTER TABLE bus_purchase_order_line
    ADD CONSTRAINT fk_bus_purchase_order_line_product_id
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
  ALTER TABLE bus_purchase_order_line
    ADD CONSTRAINT fk_bus_purchase_order_line_purchase_requisition_line_id
    FOREIGN KEY (purchase_requisition_line_id)
    REFERENCES bus_purchase_requisition_line(id)
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
  ALTER TABLE bus_goods_receipt_line
    ADD CONSTRAINT fk_bus_goods_receipt_line_purchase_order_line_id
    FOREIGN KEY (purchase_order_line_id)
    REFERENCES bus_purchase_order_line(id)
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
  ALTER TABLE bus_invoice_line
    ADD CONSTRAINT fk_bus_invoice_line_purchase_order_line_id
    FOREIGN KEY (purchase_order_line_id)
    REFERENCES bus_purchase_order_line(id)
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
  ALTER TABLE bus_supplier_return_line
    ADD CONSTRAINT fk_bus_supplier_return_line_purchase_order_line_id
    FOREIGN KEY (purchase_order_line_id)
    REFERENCES bus_purchase_order_line(id)
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
  ALTER TABLE bus_goods_receipt_line
    ADD CONSTRAINT fk_bus_goods_receipt_line_goods_receipt_id
    FOREIGN KEY (goods_receipt_id)
    REFERENCES bus_goods_receipt(id)
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
  ALTER TABLE bus_goods_receipt_line
    ADD CONSTRAINT fk_bus_goods_receipt_line_product_id
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
  ALTER TABLE bus_supplier_claim
    ADD CONSTRAINT fk_bus_supplier_claim_purchase_order_id
    FOREIGN KEY (purchase_order_id)
    REFERENCES bus_purchase_order(id)
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
  ALTER TABLE bus_goods_receipt
    ADD CONSTRAINT fk_bus_goods_receipt_supplier_claim_id
    FOREIGN KEY (supplier_claim_id)
    REFERENCES bus_supplier_claim(id)
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
  ALTER TABLE bus_supplier_return
    ADD CONSTRAINT fk_bus_supplier_return_supplier_claim_id
    FOREIGN KEY (supplier_claim_id)
    REFERENCES bus_supplier_claim(id)
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
  ALTER TABLE bus_supplier_credit_note
    ADD CONSTRAINT fk_bus_supplier_credit_note_supplier_claim_id
    FOREIGN KEY (supplier_claim_id)
    REFERENCES bus_supplier_claim(id)
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
  ALTER TABLE bus_supplier_debit_note
    ADD CONSTRAINT fk_bus_supplier_debit_note_supplier_claim_id
    FOREIGN KEY (supplier_claim_id)
    REFERENCES bus_supplier_claim(id)
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
  ALTER TABLE bus_supplier_claim_resolution
    ADD CONSTRAINT fk_bus_supplier_claim_resolution_supplier_claim_id
    FOREIGN KEY (supplier_claim_id)
    REFERENCES bus_supplier_claim(id)
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
  ALTER TABLE bus_invoice
    ADD CONSTRAINT fk_bus_invoice_supplier_claim_id
    FOREIGN KEY (supplier_claim_id)
    REFERENCES bus_supplier_claim(id)
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
  ALTER TABLE bus_supplier_return
    ADD CONSTRAINT fk_bus_supplier_return_supplier_claim_resolution_id
    FOREIGN KEY (supplier_claim_resolution_id)
    REFERENCES bus_supplier_claim_resolution(id)
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
  ALTER TABLE bus_supplier_credit_note
    ADD CONSTRAINT fk_bus_supplier_credit_note_supplier_claim_resolution_id
    FOREIGN KEY (supplier_claim_resolution_id)
    REFERENCES bus_supplier_claim_resolution(id)
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
  ALTER TABLE bus_supplier_debit_note
    ADD CONSTRAINT fk_bus_supplier_debit_note_supplier_claim_resolution_id
    FOREIGN KEY (supplier_claim_resolution_id)
    REFERENCES bus_supplier_claim_resolution(id)
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
  ALTER TABLE bus_supplier_credit_note
    ADD CONSTRAINT fk_bus_supplier_credit_note_supplier_return_id
    FOREIGN KEY (supplier_return_id)
    REFERENCES bus_supplier_return(id)
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
  ALTER TABLE bus_supplier_credit_note_line
    ADD CONSTRAINT fk_bus_supplier_credit_note_line_supplier_credit_note_id
    FOREIGN KEY (supplier_credit_note_id)
    REFERENCES bus_supplier_credit_note(id)
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
  ALTER TABLE bus_supplier_credit_note_application
    ADD CONSTRAINT fk_bus_supplier_credit_note_application_supplier_credit_note_id
    FOREIGN KEY (supplier_credit_note_id)
    REFERENCES bus_supplier_credit_note(id)
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
  ALTER TABLE bus_supplier_credit_note_line
    ADD CONSTRAINT fk_bus_supplier_credit_note_line_supplier_return_line_id
    FOREIGN KEY (supplier_return_line_id)
    REFERENCES bus_supplier_return_line(id)
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
  ALTER TABLE bus_supplier_credit_note_line
    ADD CONSTRAINT fk_bus_supplier_credit_note_line_invoice_line_id
    FOREIGN KEY (invoice_line_id)
    REFERENCES bus_invoice_line(id)
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
  ALTER TABLE bus_supplier_credit_note_application
    ADD CONSTRAINT fk_bus_supplier_credit_note_application_invoice_id
    FOREIGN KEY (invoice_id)
    REFERENCES bus_invoice(id)
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
  ALTER TABLE bus_supplier_credit_note_application
    ADD CONSTRAINT fk_bus_supplier_credit_note_application_exchange_rate_id
    FOREIGN KEY (exchange_rate_id)
    REFERENCES bus_exchange_rate(id)
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
  ALTER TABLE bus_supplier_debit_note_line
    ADD CONSTRAINT fk_bus_supplier_debit_note_line_supplier_debit_note_id
    FOREIGN KEY (supplier_debit_note_id)
    REFERENCES bus_supplier_debit_note(id)
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
  ALTER TABLE bus_supplier_debit_note_application
    ADD CONSTRAINT fk_bus_supplier_debit_note_application_supplier_debit_note_id
    FOREIGN KEY (supplier_debit_note_id)
    REFERENCES bus_supplier_debit_note(id)
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
  ALTER TABLE bus_supplier_debit_note_line
    ADD CONSTRAINT fk_bus_supplier_debit_note_line_supplier_claim_id
    FOREIGN KEY (supplier_claim_id)
    REFERENCES bus_supplier_claim(id)
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
  ALTER TABLE bus_supplier_debit_note_line
    ADD CONSTRAINT fk_bus_supplier_debit_note_line_supplier_claim_resolution_id
    FOREIGN KEY (supplier_claim_resolution_id)
    REFERENCES bus_supplier_claim_resolution(id)
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
  ALTER TABLE bus_invoice_line
    ADD CONSTRAINT fk_bus_invoice_line_supplier_debit_note_line_id
    FOREIGN KEY (supplier_debit_note_line_id)
    REFERENCES bus_supplier_debit_note_line(id)
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
  ALTER TABLE bus_supplier_debit_note_application
    ADD CONSTRAINT fk_bus_supplier_debit_note_application_invoice_id
    FOREIGN KEY (invoice_id)
    REFERENCES bus_invoice(id)
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
  ALTER TABLE bus_supplier_debit_note_application
    ADD CONSTRAINT fk_bus_supplier_debit_note_application_exchange_rate_id
    FOREIGN KEY (exchange_rate_id)
    REFERENCES bus_exchange_rate(id)
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
  ALTER TABLE bus_purchase_order
    ADD CONSTRAINT fk_bus_purchase_order_supplier_performance_assessment_id
    FOREIGN KEY (supplier_performance_assessment_id)
    REFERENCES bus_supplier_performance_assessment(id)
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
  ALTER TABLE bus_goods_receipt
    ADD CONSTRAINT fk_bus_goods_receipt_supplier_performance_assessment_id
    FOREIGN KEY (supplier_performance_assessment_id)
    REFERENCES bus_supplier_performance_assessment(id)
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
  ALTER TABLE bus_supplier_claim
    ADD CONSTRAINT fk_bus_supplier_claim_supplier_performance_assessment_id
    FOREIGN KEY (supplier_performance_assessment_id)
    REFERENCES bus_supplier_performance_assessment(id)
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
  ALTER TABLE bus_supplier_return
    ADD CONSTRAINT fk_bus_supplier_return_supplier_performance_assessment_id
    FOREIGN KEY (supplier_performance_assessment_id)
    REFERENCES bus_supplier_performance_assessment(id)
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
  ALTER TABLE bus_supplier_claim_resolution
    ADD CONSTRAINT fk_bus_supplier_claim_resolution_supplier_performance_assessment_id
    FOREIGN KEY (supplier_performance_assessment_id)
    REFERENCES bus_supplier_performance_assessment(id)
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
  ALTER TABLE bus_invoice
    ADD CONSTRAINT fk_bus_invoice_supplier_return_id
    FOREIGN KEY (supplier_return_id)
    REFERENCES bus_supplier_return(id)
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
  ALTER TABLE bus_supplier_return_line
    ADD CONSTRAINT fk_bus_supplier_return_line_supplier_return_id
    FOREIGN KEY (supplier_return_id)
    REFERENCES bus_supplier_return(id)
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
  ALTER TABLE bus_invoice_line
    ADD CONSTRAINT fk_bus_invoice_line_supplier_return_line_id
    FOREIGN KEY (supplier_return_line_id)
    REFERENCES bus_supplier_return_line(id)
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
  ALTER TABLE bus_invoice_line
    ADD CONSTRAINT fk_bus_invoice_line_product_id
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
  ALTER TABLE bus_invoice_line
    ADD CONSTRAINT fk_bus_invoice_line_invoice_id
    FOREIGN KEY (invoice_id)
    REFERENCES bus_invoice(id)
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
DROP TABLE IF EXISTS bus_supplier CASCADE;
DROP TABLE IF EXISTS bus_purchase_requisition CASCADE;
DROP TABLE IF EXISTS bus_purchase_requisition_line CASCADE;
DROP TABLE IF EXISTS bus_request_for_quotation CASCADE;
DROP TABLE IF EXISTS bus_request_for_quotation_line CASCADE;
DROP TABLE IF EXISTS bus_supplier_quotation CASCADE;
DROP TABLE IF EXISTS bus_supplier_quotation_line CASCADE;
DROP TABLE IF EXISTS bus_purchase_order CASCADE;
DROP TABLE IF EXISTS bus_purchase_order_line CASCADE;
DROP TABLE IF EXISTS bus_goods_receipt CASCADE;
DROP TABLE IF EXISTS bus_goods_receipt_line CASCADE;
DROP TABLE IF EXISTS bus_supplier_claim CASCADE;
DROP TABLE IF EXISTS bus_supplier_claim_resolution CASCADE;
DROP TABLE IF EXISTS bus_supplier_credit_note CASCADE;
DROP TABLE IF EXISTS bus_supplier_credit_note_line CASCADE;
DROP TABLE IF EXISTS bus_supplier_credit_note_application CASCADE;
DROP TABLE IF EXISTS bus_supplier_debit_note CASCADE;
DROP TABLE IF EXISTS bus_supplier_debit_note_line CASCADE;
DROP TABLE IF EXISTS bus_supplier_debit_note_application CASCADE;
DROP TABLE IF EXISTS bus_supplier_performance_assessment CASCADE;
DROP TABLE IF EXISTS bus_supplier_return CASCADE;
DROP TABLE IF EXISTS bus_supplier_return_line CASCADE;
DROP TABLE IF EXISTS bus_product CASCADE;
DROP TABLE IF EXISTS bus_invoice CASCADE;
DROP TABLE IF EXISTS bus_invoice_line CASCADE;
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
