// SeaORM entities.
//
// `users` is the credential store, hand-written to match
// `migration/sql/m0000_auth_users.up.sql`.
//
// The `bus_*` modules are the business entities from the ERD — one per table,
// regenerated on every run. They are a **convenience layer for hand-written
// Rust** (hook handlers, workflow tasks), not the CRUD path: business-entity
// CRUD goes through `DynamicRepo`, which reads the Application Dictionary at
// request time so the UI can be reconfigured without a rebuild. See decision D9
// in docs/MIGRATION-LOCO-ASTRYX.md.
//
// Regenerate the fixed-shape ones from a migrated schema with
// `cargo loco db entities`; the `bus_*` ones come from the model.

pub mod bus_address;
pub mod bus_address_address_type;
pub mod bus_address_status;
pub mod bus_attachment;
pub mod bus_business_unit;
pub mod bus_calendar;
pub mod bus_certificate_of_analysis;
pub mod bus_certificate_of_analysis_status;
pub mod bus_city;
pub mod bus_contact_point;
pub mod bus_corrective_action;
pub mod bus_corrective_action_action_type;
pub mod bus_corrective_action_status;
pub mod bus_corrective_action_verification;
pub mod bus_corrective_action_verification_result;
pub mod bus_corrective_action_verification_status;
pub mod bus_country;
pub mod bus_currency;
pub mod bus_currency_status;
pub mod bus_department;
pub mod bus_exchange_rate;
pub mod bus_exchange_rate_rate_type;
pub mod bus_exchange_rate_status;
pub mod bus_inspection_sample;
pub mod bus_inspection_sample_status;
pub mod bus_language;
pub mod bus_legal_entity;
pub mod bus_location;
pub mod bus_location_location_type;
pub mod bus_location_status;
pub mod bus_nonconformance;
pub mod bus_nonconformance_severity;
pub mod bus_nonconformance_status;
pub mod bus_organization;
pub mod bus_organization_organization_type;
pub mod bus_organization_party_type;
pub mod bus_organization_status;
pub mod bus_party;
pub mod bus_party_party_type;
pub mod bus_party_relationship;
pub mod bus_party_role;
pub mod bus_party_role_role_type;
pub mod bus_party_role_status;
pub mod bus_party_status;
pub mod bus_person;
pub mod bus_person_gender;
pub mod bus_person_party_type;
pub mod bus_person_status;
pub mod bus_quality_characteristic;
pub mod bus_quality_characteristic_data_type;
pub mod bus_quality_characteristic_status;
pub mod bus_quality_inspection;
pub mod bus_quality_inspection_disposition;
pub mod bus_quality_inspection_result;
pub mod bus_quality_inspection_status;
pub mod bus_quality_measurement;
pub mod bus_quality_measurement_result;
pub mod bus_quality_plan;
pub mod bus_quality_plan_characteristic;
pub mod bus_quality_plan_status;
pub mod bus_return_disposition;
pub mod bus_return_disposition_disposition_code;
pub mod bus_return_disposition_status;
pub mod bus_sampling_plan;
pub mod bus_sampling_plan_method;
pub mod bus_sampling_plan_status;
pub mod bus_sampling_rule;
pub mod bus_sampling_rule_status;
pub mod bus_state_province;
pub mod bus_task;
pub mod bus_task_priority;
pub mod bus_task_status;
pub mod bus_task_task_type;
pub mod bus_test_method;
pub mod bus_test_method_status;
pub mod bus_unit_of_measure;
pub mod bus_unit_of_measure_category;
pub mod bus_unit_of_measure_status;
pub mod users;
