//! Every request suite, in the order a failure is most usefully read.
//!
//! Health first: if the app cannot boot or reach its database, nothing below
//! can say anything meaningful. Then auth, then the dictionary — the two things
//! every business suite depends on — then the per-entity CRUD and rules
//! modules, which are generated one per entity in the model.
//!
//! Generated: 2026-10-01T04:35:20.621Z
//! Project: quality

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
mod crud_attachment;
mod crud_business_unit;
mod crud_calendar;
mod crud_certificate_of_analysis;
mod crud_contact_point;
mod crud_corrective_action;
mod crud_corrective_action_verification;
mod crud_country;
mod crud_currency;
mod crud_department;
mod crud_exchange_rate;
mod crud_inspection_sample;
mod crud_language;
mod crud_legal_entity;
mod crud_location;
mod crud_nonconformance;
mod crud_organization;
mod crud_party;
mod crud_party_relationship;
mod crud_party_role;
mod crud_person;
mod crud_quality_characteristic;
mod crud_quality_inspection;
mod crud_quality_measurement;
mod crud_quality_plan;
mod crud_quality_plan_characteristic;
mod crud_return_disposition;
mod crud_sampling_plan;
mod crud_sampling_rule;
mod crud_test_method;
mod crud_unit_of_measure;

mod rules_address;
mod rules_attachment;
mod rules_business_unit;
mod rules_calendar;
mod rules_certificate_of_analysis;
mod rules_contact_point;
mod rules_corrective_action;
mod rules_corrective_action_verification;
mod rules_country;
mod rules_currency;
mod rules_department;
mod rules_exchange_rate;
mod rules_inspection_sample;
mod rules_language;
mod rules_legal_entity;
mod rules_location;
mod rules_nonconformance;
mod rules_organization;
mod rules_party;
mod rules_party_relationship;
mod rules_party_role;
mod rules_person;
mod rules_quality_characteristic;
mod rules_quality_inspection;
mod rules_quality_measurement;
mod rules_quality_plan;
mod rules_quality_plan_characteristic;
mod rules_return_disposition;
mod rules_sampling_plan;
mod rules_sampling_rule;
mod rules_test_method;
mod rules_unit_of_measure;
