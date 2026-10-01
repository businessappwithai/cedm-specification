//! Every request suite, in the order a failure is most usefully read.
//!
//! Health first: if the app cannot boot or reach its database, nothing below
//! can say anything meaningful. Then auth, then the dictionary — the two things
//! every business suite depends on — then the per-entity CRUD and rules
//! modules, which are generated one per entity in the model.
//!
//! Generated: 2026-10-01T04:35:38.918Z
//! Project: sales

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
mod crud_brand;
mod crud_business_unit;
mod crud_calendar;
mod crud_campaign;
mod crud_contact;
mod crud_contact_point;
mod crud_country;
mod crud_currency;
mod crud_customer;
mod crud_customer_return;
mod crud_customer_return_line;
mod crud_department;
mod crud_discount_rule;
mod crud_exchange_rate;
mod crud_language;
mod crud_lead;
mod crud_legal_entity;
mod crud_location;
mod crud_opportunity;
mod crud_organization;
mod crud_party;
mod crud_party_relationship;
mod crud_party_role;
mod crud_payment_term;
mod crud_person;
mod crud_pricing;
mod crud_product;
mod crud_product_category;
mod crud_promotion;
mod crud_prospect;
mod crud_purchase_order;
mod crud_purchase_order_line;
mod crud_quotation;
mod crud_quotation_line;
mod crud_sales_order;
mod crud_sales_order_line;
mod crud_supplier;
mod crud_unit_of_measure;

mod rules_address;
mod rules_attachment;
mod rules_brand;
mod rules_business_unit;
mod rules_calendar;
mod rules_campaign;
mod rules_contact;
mod rules_contact_point;
mod rules_country;
mod rules_currency;
mod rules_customer;
mod rules_customer_return;
mod rules_customer_return_line;
mod rules_department;
mod rules_discount_rule;
mod rules_exchange_rate;
mod rules_language;
mod rules_lead;
mod rules_legal_entity;
mod rules_location;
mod rules_opportunity;
mod rules_organization;
mod rules_party;
mod rules_party_relationship;
mod rules_party_role;
mod rules_payment_term;
mod rules_person;
mod rules_pricing;
mod rules_product;
mod rules_product_category;
mod rules_promotion;
mod rules_prospect;
mod rules_purchase_order;
mod rules_purchase_order_line;
mod rules_quotation;
mod rules_quotation_line;
mod rules_sales_order;
mod rules_sales_order_line;
mod rules_supplier;
mod rules_unit_of_measure;
