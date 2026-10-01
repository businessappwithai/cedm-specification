//! Every request suite, in the order a failure is most usefully read.
//!
//! Health first: if the app cannot boot or reach its database, nothing below
//! can say anything meaningful. Then auth, then the dictionary — the two things
//! every business suite depends on — then the per-entity CRUD and rules
//! modules, which are generated one per entity in the model.
//!
//! Generated: 2026-10-01T05:18:16.563Z
//! Project: inventory

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
mod crud_contact_point;
mod crud_country;
mod crud_currency;
mod crud_department;
mod crud_dock;
mod crud_exchange_rate;
mod crud_handling_unit;
mod crud_inventory_adjustment;
mod crud_inventory_balance;
mod crud_inventory_count;
mod crud_inventory_location;
mod crud_inventory_movement;
mod crud_inventory_reservation;
mod crud_inventory_transfer;
mod crud_language;
mod crud_legal_entity;
mod crud_location;
mod crud_lot;
mod crud_organization;
mod crud_packaging;
mod crud_packing;
mod crud_party;
mod crud_party_relationship;
mod crud_party_role;
mod crud_person;
mod crud_picking;
mod crud_product;
mod crud_putaway;
mod crud_serial_number;
mod crud_unit_of_measure;
mod crud_warehouse;
mod crud_warehouse_zone;
mod crud_wave;

mod rules_address;
mod rules_attachment;
mod rules_business_unit;
mod rules_calendar;
mod rules_contact_point;
mod rules_country;
mod rules_currency;
mod rules_department;
mod rules_dock;
mod rules_exchange_rate;
mod rules_handling_unit;
mod rules_inventory_adjustment;
mod rules_inventory_balance;
mod rules_inventory_count;
mod rules_inventory_location;
mod rules_inventory_movement;
mod rules_inventory_reservation;
mod rules_inventory_transfer;
mod rules_language;
mod rules_legal_entity;
mod rules_location;
mod rules_lot;
mod rules_organization;
mod rules_packaging;
mod rules_packing;
mod rules_party;
mod rules_party_relationship;
mod rules_party_role;
mod rules_person;
mod rules_picking;
mod rules_product;
mod rules_putaway;
mod rules_serial_number;
mod rules_unit_of_measure;
mod rules_warehouse;
mod rules_warehouse_zone;
mod rules_wave;
