//! Every request suite, in the order a failure is most usefully read.
//!
//! Health first: if the app cannot boot or reach its database, nothing below
//! can say anything meaningful. Then auth, then the dictionary — the two things
//! every business suite depends on — then the per-entity CRUD and rules
//! modules, which are generated one per entity in the model.
//!
//! Generated: 2026-10-01T04:34:43.643Z
//! Project: logistics

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
mod crud_carrier;
mod crud_consignment;
mod crud_contact_point;
mod crud_country;
mod crud_currency;
mod crud_customer;
mod crud_delivery;
mod crud_delivery_attempt;
mod crud_department;
mod crud_exchange_rate;
mod crud_freight_charge;
mod crud_fulfillment;
mod crud_integration_endpoint;
mod crud_inventory_movement;
mod crud_language;
mod crud_legal_entity;
mod crud_load;
mod crud_location;
mod crud_message;
mod crud_organization;
mod crud_party;
mod crud_party_relationship;
mod crud_party_role;
mod crud_person;
mod crud_product;
mod crud_route;
mod crud_sales_order;
mod crud_sales_order_line;
mod crud_shipment;
mod crud_shipment_line;
mod crud_tracking_event;
mod crud_trip;
mod crud_trip_segment;
mod crud_unit_of_measure;
mod crud_vehicle;

mod rules_address;
mod rules_attachment;
mod rules_business_unit;
mod rules_calendar;
mod rules_carrier;
mod rules_consignment;
mod rules_contact_point;
mod rules_country;
mod rules_currency;
mod rules_customer;
mod rules_delivery;
mod rules_delivery_attempt;
mod rules_department;
mod rules_exchange_rate;
mod rules_freight_charge;
mod rules_fulfillment;
mod rules_integration_endpoint;
mod rules_inventory_movement;
mod rules_language;
mod rules_legal_entity;
mod rules_load;
mod rules_location;
mod rules_message;
mod rules_organization;
mod rules_party;
mod rules_party_relationship;
mod rules_party_role;
mod rules_person;
mod rules_product;
mod rules_route;
mod rules_sales_order;
mod rules_sales_order_line;
mod rules_shipment;
mod rules_shipment_line;
mod rules_tracking_event;
mod rules_trip;
mod rules_trip_segment;
mod rules_unit_of_measure;
mod rules_vehicle;
