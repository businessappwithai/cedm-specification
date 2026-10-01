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

ALTER TABLE bus_policy
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_policy_doc_status ON bus_policy (doc_status);

ALTER TABLE bus_control
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_control_doc_status ON bus_control (doc_status);

ALTER TABLE bus_risk
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_risk_doc_status ON bus_risk (doc_status);

ALTER TABLE bus_audit_case
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_audit_case_doc_status ON bus_audit_case (doc_status);

ALTER TABLE bus_audit_event
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_audit_event_doc_status ON bus_audit_event (doc_status);

ALTER TABLE bus_compliance_requirement
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_compliance_requirement_doc_status ON bus_compliance_requirement (doc_status);

ALTER TABLE bus_finding
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_finding_doc_status ON bus_finding (doc_status);

ALTER TABLE bus_risk_assessment
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_risk_assessment_doc_status ON bus_risk_assessment (doc_status);

ALTER TABLE bus_risk_treatment
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_risk_treatment_doc_status ON bus_risk_treatment (doc_status);

ALTER TABLE bus_filing
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_filing_doc_status ON bus_filing (doc_status);

ALTER TABLE bus_obligation
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_obligation_doc_status ON bus_obligation (doc_status);

ALTER TABLE bus_loss_event
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_loss_event_doc_status ON bus_loss_event (doc_status);

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

ALTER TABLE bus_policy_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_policy_status_doc_status ON bus_policy_status (doc_status);

ALTER TABLE bus_control_control_type
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_control_control_type_doc_status ON bus_control_control_type (doc_status);

ALTER TABLE bus_control_frequency
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_control_frequency_doc_status ON bus_control_frequency (doc_status);

ALTER TABLE bus_control_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_control_status_doc_status ON bus_control_status (doc_status);

ALTER TABLE bus_risk_likelihood
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_risk_likelihood_doc_status ON bus_risk_likelihood (doc_status);

ALTER TABLE bus_risk_impact
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_risk_impact_doc_status ON bus_risk_impact (doc_status);

ALTER TABLE bus_risk_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_risk_status_doc_status ON bus_risk_status (doc_status);

ALTER TABLE bus_risk_treatment_status
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID,
  ADD COLUMN IF NOT EXISTS doc_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS doc_status_message TEXT;

CREATE INDEX IF NOT EXISTS idx_bus_risk_treatment_status_doc_status ON bus_risk_treatment_status (doc_status);

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

DROP INDEX IF EXISTS idx_bus_policy_doc_status;

ALTER TABLE bus_policy
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_control_doc_status;

ALTER TABLE bus_control
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_risk_doc_status;

ALTER TABLE bus_risk
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_audit_case_doc_status;

ALTER TABLE bus_audit_case
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_audit_event_doc_status;

ALTER TABLE bus_audit_event
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_compliance_requirement_doc_status;

ALTER TABLE bus_compliance_requirement
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_finding_doc_status;

ALTER TABLE bus_finding
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_risk_assessment_doc_status;

ALTER TABLE bus_risk_assessment
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_risk_treatment_doc_status;

ALTER TABLE bus_risk_treatment
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_filing_doc_status;

ALTER TABLE bus_filing
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_obligation_doc_status;

ALTER TABLE bus_obligation
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_loss_event_doc_status;

ALTER TABLE bus_loss_event
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

DROP INDEX IF EXISTS idx_bus_policy_status_doc_status;

ALTER TABLE bus_policy_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_control_control_type_doc_status;

ALTER TABLE bus_control_control_type
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_control_frequency_doc_status;

ALTER TABLE bus_control_frequency
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_control_status_doc_status;

ALTER TABLE bus_control_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_risk_likelihood_doc_status;

ALTER TABLE bus_risk_likelihood
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_risk_impact_doc_status;

ALTER TABLE bus_risk_impact
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_risk_status_doc_status;

ALTER TABLE bus_risk_status
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_run_id,
  DROP COLUMN IF EXISTS doc_status,
  DROP COLUMN IF EXISTS doc_status_message;

DROP INDEX IF EXISTS idx_bus_risk_treatment_status_doc_status;

ALTER TABLE bus_risk_treatment_status
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
