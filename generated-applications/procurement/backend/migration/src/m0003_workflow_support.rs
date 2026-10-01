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

ALTER TABLE bus_state_province
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_state_province_doc_status ON bus_state_province (doc_status);

ALTER TABLE bus_city
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_city_doc_status ON bus_city (doc_status);

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

ALTER TABLE bus_task
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_task_doc_status ON bus_task (doc_status);

ALTER TABLE bus_supplier
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_doc_status ON bus_supplier (doc_status);

ALTER TABLE bus_purchase_requisition
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_purchase_requisition_doc_status ON bus_purchase_requisition (doc_status);

ALTER TABLE bus_purchase_requisition_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_purchase_requisition_line_doc_status ON bus_purchase_requisition_line (doc_status);

ALTER TABLE bus_request_for_quotation
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_request_for_quotation_doc_status ON bus_request_for_quotation (doc_status);

ALTER TABLE bus_request_for_quotation_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_request_for_quotation_line_doc_status ON bus_request_for_quotation_line (doc_status);

ALTER TABLE bus_supplier_quotation
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_quotation_doc_status ON bus_supplier_quotation (doc_status);

ALTER TABLE bus_supplier_quotation_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_quotation_line_doc_status ON bus_supplier_quotation_line (doc_status);

ALTER TABLE bus_purchase_order
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_purchase_order_doc_status ON bus_purchase_order (doc_status);

ALTER TABLE bus_purchase_order_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_purchase_order_line_doc_status ON bus_purchase_order_line (doc_status);

ALTER TABLE bus_goods_receipt
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_goods_receipt_doc_status ON bus_goods_receipt (doc_status);

ALTER TABLE bus_goods_receipt_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_goods_receipt_line_doc_status ON bus_goods_receipt_line (doc_status);

ALTER TABLE bus_supplier_claim
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_claim_doc_status ON bus_supplier_claim (doc_status);

ALTER TABLE bus_supplier_claim_resolution
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_claim_resolution_doc_status ON bus_supplier_claim_resolution (doc_status);

ALTER TABLE bus_supplier_credit_note
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_credit_note_doc_status ON bus_supplier_credit_note (doc_status);

ALTER TABLE bus_supplier_credit_note_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_credit_note_line_doc_status ON bus_supplier_credit_note_line (doc_status);

ALTER TABLE bus_supplier_credit_note_application
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_credit_note_application_doc_status ON bus_supplier_credit_note_application (doc_status);

ALTER TABLE bus_supplier_debit_note
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_debit_note_doc_status ON bus_supplier_debit_note (doc_status);

ALTER TABLE bus_supplier_debit_note_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_debit_note_line_doc_status ON bus_supplier_debit_note_line (doc_status);

ALTER TABLE bus_supplier_debit_note_application
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_debit_note_application_doc_status ON bus_supplier_debit_note_application (doc_status);

ALTER TABLE bus_supplier_performance_assessment
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_performance_assessment_doc_status ON bus_supplier_performance_assessment (doc_status);

ALTER TABLE bus_supplier_return
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_return_doc_status ON bus_supplier_return (doc_status);

ALTER TABLE bus_supplier_return_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_return_line_doc_status ON bus_supplier_return_line (doc_status);

ALTER TABLE bus_product
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_product_doc_status ON bus_product (doc_status);

ALTER TABLE bus_invoice
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_invoice_doc_status ON bus_invoice (doc_status);

ALTER TABLE bus_invoice_line
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_invoice_line_doc_status ON bus_invoice_line (doc_status);

ALTER TABLE bus_party_party_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_party_party_type_doc_status ON bus_party_party_type (doc_status);

ALTER TABLE bus_party_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_party_status_doc_status ON bus_party_status (doc_status);

ALTER TABLE bus_person_gender
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_person_gender_doc_status ON bus_person_gender (doc_status);

ALTER TABLE bus_person_party_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_person_party_type_doc_status ON bus_person_party_type (doc_status);

ALTER TABLE bus_person_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_person_status_doc_status ON bus_person_status (doc_status);

ALTER TABLE bus_organization_organization_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_organization_organization_type_doc_status ON bus_organization_organization_type (doc_status);

ALTER TABLE bus_organization_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_organization_status_doc_status ON bus_organization_status (doc_status);

ALTER TABLE bus_organization_party_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_organization_party_type_doc_status ON bus_organization_party_type (doc_status);

ALTER TABLE bus_party_role_role_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_party_role_role_type_doc_status ON bus_party_role_role_type (doc_status);

ALTER TABLE bus_party_role_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_party_role_status_doc_status ON bus_party_role_status (doc_status);

ALTER TABLE bus_address_address_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_address_address_type_doc_status ON bus_address_address_type (doc_status);

ALTER TABLE bus_address_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_address_status_doc_status ON bus_address_status (doc_status);

ALTER TABLE bus_location_location_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_location_location_type_doc_status ON bus_location_location_type (doc_status);

ALTER TABLE bus_location_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_location_status_doc_status ON bus_location_status (doc_status);

ALTER TABLE bus_currency_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_currency_status_doc_status ON bus_currency_status (doc_status);

ALTER TABLE bus_exchange_rate_rate_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_exchange_rate_rate_type_doc_status ON bus_exchange_rate_rate_type (doc_status);

ALTER TABLE bus_exchange_rate_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_exchange_rate_status_doc_status ON bus_exchange_rate_status (doc_status);

ALTER TABLE bus_unit_of_measure_category
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_unit_of_measure_category_doc_status ON bus_unit_of_measure_category (doc_status);

ALTER TABLE bus_unit_of_measure_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_unit_of_measure_status_doc_status ON bus_unit_of_measure_status (doc_status);

ALTER TABLE bus_task_task_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_task_task_type_doc_status ON bus_task_task_type (doc_status);

ALTER TABLE bus_task_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_task_status_doc_status ON bus_task_status (doc_status);

ALTER TABLE bus_task_priority
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_task_priority_doc_status ON bus_task_priority (doc_status);

ALTER TABLE bus_supplier_supplier_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_supplier_type_doc_status ON bus_supplier_supplier_type (doc_status);

ALTER TABLE bus_supplier_qualification_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_qualification_status_doc_status ON bus_supplier_qualification_status (doc_status);

ALTER TABLE bus_supplier_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_status_doc_status ON bus_supplier_status (doc_status);

ALTER TABLE bus_supplier_role_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_role_type_doc_status ON bus_supplier_role_type (doc_status);

ALTER TABLE bus_purchase_requisition_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_purchase_requisition_status_doc_status ON bus_purchase_requisition_status (doc_status);

ALTER TABLE bus_request_for_quotation_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_request_for_quotation_status_doc_status ON bus_request_for_quotation_status (doc_status);

ALTER TABLE bus_supplier_quotation_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_quotation_status_doc_status ON bus_supplier_quotation_status (doc_status);

ALTER TABLE bus_supplier_quotation_line_award_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_quotation_line_award_status_doc_status ON bus_supplier_quotation_line_award_status (doc_status);

ALTER TABLE bus_purchase_order_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_purchase_order_status_doc_status ON bus_purchase_order_status (doc_status);

ALTER TABLE bus_purchase_order_line_price_source
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_purchase_order_line_price_source_doc_status ON bus_purchase_order_line_price_source (doc_status);

ALTER TABLE bus_goods_receipt_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_goods_receipt_status_doc_status ON bus_goods_receipt_status (doc_status);

ALTER TABLE bus_supplier_claim_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_claim_status_doc_status ON bus_supplier_claim_status (doc_status);

ALTER TABLE bus_supplier_claim_claim_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_claim_claim_type_doc_status ON bus_supplier_claim_claim_type (doc_status);

ALTER TABLE bus_supplier_claim_resolution_code
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_claim_resolution_code_doc_status ON bus_supplier_claim_resolution_code (doc_status);

ALTER TABLE bus_supplier_claim_resolution_resolution_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_claim_resolution_resolution_type_doc_status ON bus_supplier_claim_resolution_resolution_type (doc_status);

ALTER TABLE bus_supplier_claim_resolution_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_claim_resolution_status_doc_status ON bus_supplier_claim_resolution_status (doc_status);

ALTER TABLE bus_supplier_credit_note_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_credit_note_status_doc_status ON bus_supplier_credit_note_status (doc_status);

ALTER TABLE bus_supplier_credit_note_application_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_credit_note_application_status_doc_status ON bus_supplier_credit_note_application_status (doc_status);

ALTER TABLE bus_supplier_debit_note_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_debit_note_status_doc_status ON bus_supplier_debit_note_status (doc_status);

ALTER TABLE bus_supplier_debit_note_application_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_debit_note_application_status_doc_status ON bus_supplier_debit_note_application_status (doc_status);

ALTER TABLE bus_supplier_performance_assessment_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_performance_assessment_status_doc_status ON bus_supplier_performance_assessment_status (doc_status);

ALTER TABLE bus_supplier_performance_assessment_rating
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_performance_assessment_rating_doc_status ON bus_supplier_performance_assessment_rating (doc_status);

ALTER TABLE bus_supplier_return_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_return_status_doc_status ON bus_supplier_return_status (doc_status);

ALTER TABLE bus_supplier_return_line_disposition
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_supplier_return_line_disposition_doc_status ON bus_supplier_return_line_disposition (doc_status);

ALTER TABLE bus_product_product_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_product_product_type_doc_status ON bus_product_product_type (doc_status);

ALTER TABLE bus_product_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_product_status_doc_status ON bus_product_status (doc_status);

ALTER TABLE bus_invoice_invoice_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_invoice_invoice_type_doc_status ON bus_invoice_invoice_type (doc_status);

ALTER TABLE bus_invoice_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_invoice_status_doc_status ON bus_invoice_status (doc_status);

ALTER TABLE bus_invoice_line_matching_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_invoice_line_matching_status_doc_status ON bus_invoice_line_matching_status (doc_status);

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

DROP INDEX IF EXISTS idx_bus_state_province_doc_status;

ALTER TABLE bus_state_province
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_city_doc_status;

ALTER TABLE bus_city
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

DROP INDEX IF EXISTS idx_bus_task_doc_status;

ALTER TABLE bus_task
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

DROP INDEX IF EXISTS idx_bus_purchase_requisition_doc_status;

ALTER TABLE bus_purchase_requisition
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_purchase_requisition_line_doc_status;

ALTER TABLE bus_purchase_requisition_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_request_for_quotation_doc_status;

ALTER TABLE bus_request_for_quotation
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_request_for_quotation_line_doc_status;

ALTER TABLE bus_request_for_quotation_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_quotation_doc_status;

ALTER TABLE bus_supplier_quotation
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_quotation_line_doc_status;

ALTER TABLE bus_supplier_quotation_line
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

DROP INDEX IF EXISTS idx_bus_purchase_order_line_doc_status;

ALTER TABLE bus_purchase_order_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_goods_receipt_doc_status;

ALTER TABLE bus_goods_receipt
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_goods_receipt_line_doc_status;

ALTER TABLE bus_goods_receipt_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_claim_doc_status;

ALTER TABLE bus_supplier_claim
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_claim_resolution_doc_status;

ALTER TABLE bus_supplier_claim_resolution
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_credit_note_doc_status;

ALTER TABLE bus_supplier_credit_note
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_credit_note_line_doc_status;

ALTER TABLE bus_supplier_credit_note_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_credit_note_application_doc_status;

ALTER TABLE bus_supplier_credit_note_application
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_debit_note_doc_status;

ALTER TABLE bus_supplier_debit_note
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_debit_note_line_doc_status;

ALTER TABLE bus_supplier_debit_note_line
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_debit_note_application_doc_status;

ALTER TABLE bus_supplier_debit_note_application
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_performance_assessment_doc_status;

ALTER TABLE bus_supplier_performance_assessment
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_return_doc_status;

ALTER TABLE bus_supplier_return
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_return_line_doc_status;

ALTER TABLE bus_supplier_return_line
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

DROP INDEX IF EXISTS idx_bus_invoice_doc_status;

ALTER TABLE bus_invoice
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

DROP INDEX IF EXISTS idx_bus_party_party_type_doc_status;

ALTER TABLE bus_party_party_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_party_status_doc_status;

ALTER TABLE bus_party_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_person_gender_doc_status;

ALTER TABLE bus_person_gender
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_person_party_type_doc_status;

ALTER TABLE bus_person_party_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_person_status_doc_status;

ALTER TABLE bus_person_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_organization_organization_type_doc_status;

ALTER TABLE bus_organization_organization_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_organization_status_doc_status;

ALTER TABLE bus_organization_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_organization_party_type_doc_status;

ALTER TABLE bus_organization_party_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_party_role_role_type_doc_status;

ALTER TABLE bus_party_role_role_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_party_role_status_doc_status;

ALTER TABLE bus_party_role_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_address_address_type_doc_status;

ALTER TABLE bus_address_address_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_address_status_doc_status;

ALTER TABLE bus_address_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_location_location_type_doc_status;

ALTER TABLE bus_location_location_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_location_status_doc_status;

ALTER TABLE bus_location_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_currency_status_doc_status;

ALTER TABLE bus_currency_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_exchange_rate_rate_type_doc_status;

ALTER TABLE bus_exchange_rate_rate_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_exchange_rate_status_doc_status;

ALTER TABLE bus_exchange_rate_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_unit_of_measure_category_doc_status;

ALTER TABLE bus_unit_of_measure_category
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_unit_of_measure_status_doc_status;

ALTER TABLE bus_unit_of_measure_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_task_task_type_doc_status;

ALTER TABLE bus_task_task_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_task_status_doc_status;

ALTER TABLE bus_task_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_task_priority_doc_status;

ALTER TABLE bus_task_priority
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_supplier_type_doc_status;

ALTER TABLE bus_supplier_supplier_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_qualification_status_doc_status;

ALTER TABLE bus_supplier_qualification_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_status_doc_status;

ALTER TABLE bus_supplier_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_role_type_doc_status;

ALTER TABLE bus_supplier_role_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_purchase_requisition_status_doc_status;

ALTER TABLE bus_purchase_requisition_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_request_for_quotation_status_doc_status;

ALTER TABLE bus_request_for_quotation_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_quotation_status_doc_status;

ALTER TABLE bus_supplier_quotation_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_quotation_line_award_status_doc_status;

ALTER TABLE bus_supplier_quotation_line_award_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_purchase_order_status_doc_status;

ALTER TABLE bus_purchase_order_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_purchase_order_line_price_source_doc_status;

ALTER TABLE bus_purchase_order_line_price_source
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_goods_receipt_status_doc_status;

ALTER TABLE bus_goods_receipt_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_claim_status_doc_status;

ALTER TABLE bus_supplier_claim_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_claim_claim_type_doc_status;

ALTER TABLE bus_supplier_claim_claim_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_claim_resolution_code_doc_status;

ALTER TABLE bus_supplier_claim_resolution_code
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_claim_resolution_resolution_type_doc_status;

ALTER TABLE bus_supplier_claim_resolution_resolution_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_claim_resolution_status_doc_status;

ALTER TABLE bus_supplier_claim_resolution_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_credit_note_status_doc_status;

ALTER TABLE bus_supplier_credit_note_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_credit_note_application_status_doc_status;

ALTER TABLE bus_supplier_credit_note_application_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_debit_note_status_doc_status;

ALTER TABLE bus_supplier_debit_note_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_debit_note_application_status_doc_status;

ALTER TABLE bus_supplier_debit_note_application_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_performance_assessment_status_doc_status;

ALTER TABLE bus_supplier_performance_assessment_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_performance_assessment_rating_doc_status;

ALTER TABLE bus_supplier_performance_assessment_rating
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_return_status_doc_status;

ALTER TABLE bus_supplier_return_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_supplier_return_line_disposition_doc_status;

ALTER TABLE bus_supplier_return_line_disposition
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_product_product_type_doc_status;

ALTER TABLE bus_product_product_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_product_status_doc_status;

ALTER TABLE bus_product_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_invoice_invoice_type_doc_status;

ALTER TABLE bus_invoice_invoice_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_invoice_status_doc_status;

ALTER TABLE bus_invoice_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_invoice_line_matching_status_doc_status;

ALTER TABLE bus_invoice_line_matching_status
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
