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
pub mod bus_attachment;
pub mod bus_business_unit;
pub mod bus_calendar;
pub mod bus_carrier;
pub mod bus_consignment;
pub mod bus_contact_point;
pub mod bus_country;
pub mod bus_currency;
pub mod bus_customer;
pub mod bus_delivery;
pub mod bus_delivery_attempt;
pub mod bus_department;
pub mod bus_exchange_rate;
pub mod bus_freight_charge;
pub mod bus_fulfillment;
pub mod bus_integration_endpoint;
pub mod bus_inventory_movement;
pub mod bus_language;
pub mod bus_legal_entity;
pub mod bus_load;
pub mod bus_location;
pub mod bus_message;
pub mod bus_organization;
pub mod bus_party;
pub mod bus_party_relationship;
pub mod bus_party_role;
pub mod bus_person;
pub mod bus_product;
pub mod bus_route;
pub mod bus_sales_order;
pub mod bus_sales_order_line;
pub mod bus_shipment;
pub mod bus_shipment_line;
pub mod bus_tracking_event;
pub mod bus_trip;
pub mod bus_trip_segment;
pub mod bus_unit_of_measure;
pub mod bus_vehicle;
pub mod users;
