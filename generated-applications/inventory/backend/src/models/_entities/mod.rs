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

pub mod users;
pub mod bus_party;
pub mod bus_person;
pub mod bus_organization;
pub mod bus_party_role;
pub mod bus_party_relationship;
pub mod bus_legal_entity;
pub mod bus_business_unit;
pub mod bus_department;
pub mod bus_address;
pub mod bus_contact_point;
pub mod bus_location;
pub mod bus_country;
pub mod bus_language;
pub mod bus_currency;
pub mod bus_exchange_rate;
pub mod bus_unit_of_measure;
pub mod bus_calendar;
pub mod bus_attachment;
pub mod bus_inventory_balance;
pub mod bus_inventory_movement;
pub mod bus_inventory_reservation;
pub mod bus_inventory_transfer;
pub mod bus_inventory_count;
pub mod bus_inventory_adjustment;
pub mod bus_lot;
pub mod bus_serial_number;
pub mod bus_product;
pub mod bus_inventory_location;
pub mod bus_warehouse;
pub mod bus_warehouse_zone;
pub mod bus_dock;
pub mod bus_handling_unit;
pub mod bus_putaway;
pub mod bus_picking;
pub mod bus_packing;
pub mod bus_wave;
pub mod bus_packaging;
