//! Every request suite, in the order a failure is most usefully read.
//!
//! Health first: if the app cannot boot or reach its database, nothing below
//! can say anything meaningful. Then auth, then the dictionary — the two things
//! every business suite depends on — then the per-entity CRUD and rules
//! modules, which are generated one per entity in the model.
//!
//! Generated: 2026-10-01T05:18:01.714Z
//! Project: healthcare

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
mod rules_workflow;
mod saga_execution;
mod system_config;
mod workflow;

mod crud_address;
mod crud_allergy;
mod crud_attachment;
mod crud_business_unit;
mod crud_calendar;
mod crud_care_plan;
mod crud_contact_point;
mod crud_country;
mod crud_currency;
mod crud_department;
mod crud_diagnosis;
mod crud_exchange_rate;
mod crud_healthcare_encounter;
mod crud_healthcare_order;
mod crud_healthcare_patient;
mod crud_healthcare_provider;
mod crud_language;
mod crud_legal_entity;
mod crud_location;
mod crud_medication;
mod crud_organization;
mod crud_party;
mod crud_party_relationship;
mod crud_party_role;
mod crud_person;
mod crud_prescription;
mod crud_procedure;
mod crud_unit_of_measure;

mod rules_address;
mod rules_allergy;
mod rules_attachment;
mod rules_business_unit;
mod rules_calendar;
mod rules_care_plan;
mod rules_contact_point;
mod rules_country;
mod rules_currency;
mod rules_department;
mod rules_diagnosis;
mod rules_exchange_rate;
mod rules_healthcare_encounter;
mod rules_healthcare_order;
mod rules_healthcare_patient;
mod rules_healthcare_provider;
mod rules_language;
mod rules_legal_entity;
mod rules_location;
mod rules_medication;
mod rules_organization;
mod rules_party;
mod rules_party_relationship;
mod rules_party_role;
mod rules_person;
mod rules_prescription;
mod rules_procedure;
mod rules_unit_of_measure;
