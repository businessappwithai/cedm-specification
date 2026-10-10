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
pub mod bus_berth;
pub mod bus_berth_status;
pub mod bus_business_unit;
pub mod bus_calendar;
pub mod bus_city;
pub mod bus_contact_point;
pub mod bus_container;
pub mod bus_container_movement;
pub mod bus_container_movement_movement_type;
pub mod bus_container_movement_priority;
pub mod bus_container_movement_status;
pub mod bus_container_status;
pub mod bus_container_visit;
pub mod bus_container_visit_status;
pub mod bus_country;
pub mod bus_currency;
pub mod bus_currency_status;
pub mod bus_department;
pub mod bus_exchange_rate;
pub mod bus_exchange_rate_rate_type;
pub mod bus_exchange_rate_status;
pub mod bus_gate;
pub mod bus_gate_event;
pub mod bus_gate_event_direction;
pub mod bus_gate_event_status;
pub mod bus_gate_gate_type;
pub mod bus_gate_status;
pub mod bus_language;
pub mod bus_legal_entity;
pub mod bus_location;
pub mod bus_location_location_type;
pub mod bus_location_status;
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
pub mod bus_port;
pub mod bus_port_status;
pub mod bus_state_province;
pub mod bus_task;
pub mod bus_task_priority;
pub mod bus_task_status;
pub mod bus_task_task_type;
pub mod bus_unit_of_measure;
pub mod bus_unit_of_measure_category;
pub mod bus_unit_of_measure_status;
pub mod bus_vessel;
pub mod bus_vessel_status;
pub mod bus_voyage;
pub mod bus_voyage_status;
pub mod bus_yard;
pub mod bus_yard_bay;
pub mod bus_yard_bay_status;
pub mod bus_yard_block;
pub mod bus_yard_block_status;
pub mod bus_yard_slot;
pub mod bus_yard_slot_status;
pub mod bus_yard_status;
pub mod bus_yard_tier;
pub mod bus_yard_tier_status;
pub mod users;
