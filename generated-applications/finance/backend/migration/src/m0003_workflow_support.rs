//! Workflow + document-status columns on every `bus_*` table.
//!
//! Mirrors `003_add_workflow_support.ts.hbs`. `doc_status` is the draft→final
//! promotion state the create/update response reports back as
//! `promotion.docStatus` — part of the frozen API contract (§9).

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

const UP_SQL: &str = r#"
-- Transcribed from 003_add_workflow_support.ts. Note this CREATE is a no-op in
-- practice: m0001 already created `sys_workflow_runs` with a different (and
-- authoritative) column set, and `IF NOT EXISTS` makes the first one win. The
-- statement is kept so the two stacks stay literally comparable — the
-- divergence is pre-existing in the TypeScript migrations, not introduced here.
CREATE TABLE IF NOT EXISTS sys_workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_by VARCHAR(100) NOT NULL DEFAULT 'system',
  error_details TEXT,
  mutations_applied JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_entity ON sys_workflow_runs (entity_name, entity_id);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON sys_workflow_runs (status);

ALTER TABLE bus_party
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_party_doc_status ON bus_party (doc_status);

ALTER TABLE bus_person
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_person_doc_status ON bus_person (doc_status);

ALTER TABLE bus_organization
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_organization_doc_status ON bus_organization (doc_status);

ALTER TABLE bus_party_role
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_party_role_doc_status ON bus_party_role (doc_status);

ALTER TABLE bus_party_relationship
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_party_relationship_doc_status ON bus_party_relationship (doc_status);

ALTER TABLE bus_legal_entity
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_legal_entity_doc_status ON bus_legal_entity (doc_status);

ALTER TABLE bus_business_unit
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_business_unit_doc_status ON bus_business_unit (doc_status);

ALTER TABLE bus_department
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_department_doc_status ON bus_department (doc_status);

ALTER TABLE bus_address
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_address_doc_status ON bus_address (doc_status);

ALTER TABLE bus_contact_point
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_contact_point_doc_status ON bus_contact_point (doc_status);

ALTER TABLE bus_location
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_location_doc_status ON bus_location (doc_status);

ALTER TABLE bus_country
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_country_doc_status ON bus_country (doc_status);

ALTER TABLE bus_language
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_language_doc_status ON bus_language (doc_status);

ALTER TABLE bus_currency
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_currency_doc_status ON bus_currency (doc_status);

ALTER TABLE bus_exchange_rate
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_exchange_rate_doc_status ON bus_exchange_rate (doc_status);

ALTER TABLE bus_unit_of_measure
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_unit_of_measure_doc_status ON bus_unit_of_measure (doc_status);

ALTER TABLE bus_calendar
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_calendar_doc_status ON bus_calendar (doc_status);

ALTER TABLE bus_attachment
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_attachment_doc_status ON bus_attachment (doc_status);

ALTER TABLE bus_account
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_account_doc_status ON bus_account (doc_status);

ALTER TABLE bus_journal_entry
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_journal_entry_doc_status ON bus_journal_entry (doc_status);

ALTER TABLE bus_journal_entry_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_journal_entry_line_doc_status ON bus_journal_entry_line (doc_status);

ALTER TABLE bus_invoice
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_invoice_doc_status ON bus_invoice (doc_status);

ALTER TABLE bus_payment
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_payment_doc_status ON bus_payment (doc_status);

ALTER TABLE bus_supplier
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_doc_status ON bus_supplier (doc_status);

ALTER TABLE bus_purchase_order
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_purchase_order_doc_status ON bus_purchase_order (doc_status);

ALTER TABLE bus_customer
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_customer_doc_status ON bus_customer (doc_status);

ALTER TABLE bus_sales_order
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_sales_order_doc_status ON bus_sales_order (doc_status);

ALTER TABLE bus_budget
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_budget_doc_status ON bus_budget (doc_status);

ALTER TABLE bus_budget_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_budget_line_doc_status ON bus_budget_line (doc_status);

ALTER TABLE bus_forecast
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_forecast_doc_status ON bus_forecast (doc_status);

ALTER TABLE bus_scenario
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_scenario_doc_status ON bus_scenario (doc_status);

ALTER TABLE bus_cost_center
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_cost_center_doc_status ON bus_cost_center (doc_status);

ALTER TABLE bus_profit_center
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_profit_center_doc_status ON bus_profit_center (doc_status);

ALTER TABLE bus_variance
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_variance_doc_status ON bus_variance (doc_status);

ALTER TABLE bus_ledger
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_ledger_doc_status ON bus_ledger (doc_status);

ALTER TABLE bus_fiscal_period
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_fiscal_period_doc_status ON bus_fiscal_period (doc_status);

ALTER TABLE bus_invoice_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_invoice_line_doc_status ON bus_invoice_line (doc_status);

ALTER TABLE bus_payment_allocation
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_payment_allocation_doc_status ON bus_payment_allocation (doc_status);

ALTER TABLE bus_payment_instruction
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_payment_instruction_doc_status ON bus_payment_instruction (doc_status);

ALTER TABLE bus_credit_note
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_credit_note_doc_status ON bus_credit_note (doc_status);

ALTER TABLE bus_credit_note_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_credit_note_line_doc_status ON bus_credit_note_line (doc_status);

ALTER TABLE bus_credit_note_application
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_credit_note_application_doc_status ON bus_credit_note_application (doc_status);

ALTER TABLE bus_tax_code
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_tax_code_doc_status ON bus_tax_code (doc_status);

ALTER TABLE bus_tax_jurisdiction
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_tax_jurisdiction_doc_status ON bus_tax_jurisdiction (doc_status);

ALTER TABLE bus_tax_rate
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_tax_rate_doc_status ON bus_tax_rate (doc_status);

ALTER TABLE bus_tax_registration
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_tax_registration_doc_status ON bus_tax_registration (doc_status);

ALTER TABLE bus_tax_rule
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_tax_rule_doc_status ON bus_tax_rule (doc_status);

ALTER TABLE bus_tax_transaction
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_tax_transaction_doc_status ON bus_tax_transaction (doc_status);

ALTER TABLE bus_billing_cycle
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_billing_cycle_doc_status ON bus_billing_cycle (doc_status);

ALTER TABLE bus_charge
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_charge_doc_status ON bus_charge (doc_status);

ALTER TABLE bus_subscription
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_subscription_doc_status ON bus_subscription (doc_status);

ALTER TABLE bus_subscription_plan
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_subscription_plan_doc_status ON bus_subscription_plan (doc_status);

ALTER TABLE bus_usage_record
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_usage_record_doc_status ON bus_usage_record (doc_status);

ALTER TABLE bus_asset_class
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_asset_class_doc_status ON bus_asset_class (doc_status);

ALTER TABLE bus_asset_acquisition
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_asset_acquisition_doc_status ON bus_asset_acquisition (doc_status);

ALTER TABLE bus_asset_depreciation
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_asset_depreciation_doc_status ON bus_asset_depreciation (doc_status);

ALTER TABLE bus_asset_disposal
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_asset_disposal_doc_status ON bus_asset_disposal (doc_status);

ALTER TABLE bus_asset_transfer
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_asset_transfer_doc_status ON bus_asset_transfer (doc_status);

ALTER TABLE bus_foreign_exchange_transaction
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_foreign_exchange_transaction_doc_status ON bus_foreign_exchange_transaction (doc_status);

ALTER TABLE bus_cash_position
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_cash_position_doc_status ON bus_cash_position (doc_status);

ALTER TABLE bus_interest
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_interest_doc_status ON bus_interest (doc_status);

ALTER TABLE bus_purchase_order_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_purchase_order_line_doc_status ON bus_purchase_order_line (doc_status);

ALTER TABLE bus_sales_order_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_sales_order_line_doc_status ON bus_sales_order_line (doc_status);

ALTER TABLE bus_bank_account
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_bank_account_doc_status ON bus_bank_account (doc_status);

ALTER TABLE bus_asset
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_asset_doc_status ON bus_asset (doc_status);

ALTER TABLE bus_product
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_product_doc_status ON bus_product (doc_status);

"#;

const DOWN_SQL: &str = r#"
DROP INDEX IF EXISTS idx_bus_party_doc_status;

ALTER TABLE bus_party
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_person_doc_status;

ALTER TABLE bus_person
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_organization_doc_status;

ALTER TABLE bus_organization
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_party_role_doc_status;

ALTER TABLE bus_party_role
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_party_relationship_doc_status;

ALTER TABLE bus_party_relationship
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_legal_entity_doc_status;

ALTER TABLE bus_legal_entity
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_business_unit_doc_status;

ALTER TABLE bus_business_unit
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_department_doc_status;

ALTER TABLE bus_department
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_address_doc_status;

ALTER TABLE bus_address
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_contact_point_doc_status;

ALTER TABLE bus_contact_point
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_location_doc_status;

ALTER TABLE bus_location
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_country_doc_status;

ALTER TABLE bus_country
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_language_doc_status;

ALTER TABLE bus_language
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_currency_doc_status;

ALTER TABLE bus_currency
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_exchange_rate_doc_status;

ALTER TABLE bus_exchange_rate
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_unit_of_measure_doc_status;

ALTER TABLE bus_unit_of_measure
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_calendar_doc_status;

ALTER TABLE bus_calendar
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_attachment_doc_status;

ALTER TABLE bus_attachment
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_account_doc_status;

ALTER TABLE bus_account
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_journal_entry_doc_status;

ALTER TABLE bus_journal_entry
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_journal_entry_line_doc_status;

ALTER TABLE bus_journal_entry_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_invoice_doc_status;

ALTER TABLE bus_invoice
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_payment_doc_status;

ALTER TABLE bus_payment
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_doc_status;

ALTER TABLE bus_supplier
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_purchase_order_doc_status;

ALTER TABLE bus_purchase_order
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_customer_doc_status;

ALTER TABLE bus_customer
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_sales_order_doc_status;

ALTER TABLE bus_sales_order
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_budget_doc_status;

ALTER TABLE bus_budget
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_budget_line_doc_status;

ALTER TABLE bus_budget_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_forecast_doc_status;

ALTER TABLE bus_forecast
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_scenario_doc_status;

ALTER TABLE bus_scenario
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_cost_center_doc_status;

ALTER TABLE bus_cost_center
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_profit_center_doc_status;

ALTER TABLE bus_profit_center
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_variance_doc_status;

ALTER TABLE bus_variance
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_ledger_doc_status;

ALTER TABLE bus_ledger
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_fiscal_period_doc_status;

ALTER TABLE bus_fiscal_period
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_invoice_line_doc_status;

ALTER TABLE bus_invoice_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_payment_allocation_doc_status;

ALTER TABLE bus_payment_allocation
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_payment_instruction_doc_status;

ALTER TABLE bus_payment_instruction
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_credit_note_doc_status;

ALTER TABLE bus_credit_note
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_credit_note_line_doc_status;

ALTER TABLE bus_credit_note_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_credit_note_application_doc_status;

ALTER TABLE bus_credit_note_application
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_tax_code_doc_status;

ALTER TABLE bus_tax_code
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_tax_jurisdiction_doc_status;

ALTER TABLE bus_tax_jurisdiction
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_tax_rate_doc_status;

ALTER TABLE bus_tax_rate
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_tax_registration_doc_status;

ALTER TABLE bus_tax_registration
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_tax_rule_doc_status;

ALTER TABLE bus_tax_rule
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_tax_transaction_doc_status;

ALTER TABLE bus_tax_transaction
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_billing_cycle_doc_status;

ALTER TABLE bus_billing_cycle
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_charge_doc_status;

ALTER TABLE bus_charge
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_subscription_doc_status;

ALTER TABLE bus_subscription
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_subscription_plan_doc_status;

ALTER TABLE bus_subscription_plan
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_usage_record_doc_status;

ALTER TABLE bus_usage_record
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_asset_class_doc_status;

ALTER TABLE bus_asset_class
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_asset_acquisition_doc_status;

ALTER TABLE bus_asset_acquisition
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_asset_depreciation_doc_status;

ALTER TABLE bus_asset_depreciation
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_asset_disposal_doc_status;

ALTER TABLE bus_asset_disposal
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_asset_transfer_doc_status;

ALTER TABLE bus_asset_transfer
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_foreign_exchange_transaction_doc_status;

ALTER TABLE bus_foreign_exchange_transaction
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_cash_position_doc_status;

ALTER TABLE bus_cash_position
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_interest_doc_status;

ALTER TABLE bus_interest
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_purchase_order_line_doc_status;

ALTER TABLE bus_purchase_order_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_sales_order_line_doc_status;

ALTER TABLE bus_sales_order_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_bank_account_doc_status;

ALTER TABLE bus_bank_account
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_asset_doc_status;

ALTER TABLE bus_asset
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_product_doc_status;

ALTER TABLE bus_product
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP TABLE IF EXISTS sys_workflow_runs CASCADE;
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
