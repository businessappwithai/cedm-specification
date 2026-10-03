//! Every request suite, in the order a failure is most usefully read.
//!
//! Health first: if the app cannot boot or reach its database, nothing below
//! can say anything meaningful. Then auth, then the dictionary — the two things
//! every business suite depends on — then the per-entity CRUD and rules
//! modules, which are generated one per entity in the model.
//!
//! Generated: 2026-10-03T02:00:16.520Z
//! Project: legal

mod ai;
mod auth;
mod dictionary;
mod health;
mod http_log;
mod jobs;
mod model_rules;
mod model_transitions;
mod openapi;
mod permissions;
mod rate_limit;
mod rbac;
mod records;
mod reports;
// Not `rules_workflow`: every entity gets `crud_<name>` and `rules_<name>`, so an entity
// called Workflow would define `rules_workflow` a second time.
mod saga_execution;
mod system_config;
mod workflow;
mod workflow_rules;

mod crud_address;
mod crud_address_address_type;
mod crud_address_status;
mod crud_agreement;
mod crud_attachment;
mod crud_business_unit;
mod crud_calendar;
mod crud_city;
mod crud_contact_point;
mod crud_contract;
mod crud_contract_amendment;
mod crud_contract_clause;
mod crud_contract_line;
mod crud_contract_obligation;
mod crud_contract_obligation_obligation_type;
mod crud_contract_obligation_status;
mod crud_contract_renewal;
mod crud_contract_status;
mod crud_contract_termination;
mod crud_country;
mod crud_currency;
mod crud_currency_status;
mod crud_department;
mod crud_exchange_rate;
mod crud_exchange_rate_rate_type;
mod crud_exchange_rate_status;
mod crud_language;
mod crud_legal_case;
mod crud_legal_entity;
mod crud_legal_matter;
mod crud_location;
mod crud_location_location_type;
mod crud_location_status;
mod crud_organization;
mod crud_organization_organization_type;
mod crud_organization_party_type;
mod crud_organization_status;
mod crud_party;
mod crud_party_party_type;
mod crud_party_relationship;
mod crud_party_role;
mod crud_party_role_role_type;
mod crud_party_role_status;
mod crud_party_status;
mod crud_person;
mod crud_person_gender;
mod crud_person_party_type;
mod crud_person_status;
mod crud_renewal;
mod crud_renewal_status;
mod crud_state_province;
mod crud_task;
mod crud_task_priority;
mod crud_task_status;
mod crud_task_task_type;
mod crud_unit_of_measure;
mod crud_unit_of_measure_category;
mod crud_unit_of_measure_status;

mod rules_address;
mod rules_address_address_type;
mod rules_address_status;
mod rules_agreement;
mod rules_attachment;
mod rules_business_unit;
mod rules_calendar;
mod rules_city;
mod rules_contact_point;
mod rules_contract;
mod rules_contract_amendment;
mod rules_contract_clause;
mod rules_contract_line;
mod rules_contract_obligation;
mod rules_contract_obligation_obligation_type;
mod rules_contract_obligation_status;
mod rules_contract_renewal;
mod rules_contract_status;
mod rules_contract_termination;
mod rules_country;
mod rules_currency;
mod rules_currency_status;
mod rules_department;
mod rules_exchange_rate;
mod rules_exchange_rate_rate_type;
mod rules_exchange_rate_status;
mod rules_language;
mod rules_legal_case;
mod rules_legal_entity;
mod rules_legal_matter;
mod rules_location;
mod rules_location_location_type;
mod rules_location_status;
mod rules_organization;
mod rules_organization_organization_type;
mod rules_organization_party_type;
mod rules_organization_status;
mod rules_party;
mod rules_party_party_type;
mod rules_party_relationship;
mod rules_party_role;
mod rules_party_role_role_type;
mod rules_party_role_status;
mod rules_party_status;
mod rules_person;
mod rules_person_gender;
mod rules_person_party_type;
mod rules_person_status;
mod rules_renewal;
mod rules_renewal_status;
mod rules_state_province;
mod rules_task;
mod rules_task_priority;
mod rules_task_status;
mod rules_task_task_type;
mod rules_unit_of_measure;
mod rules_unit_of_measure_category;
mod rules_unit_of_measure_status;
