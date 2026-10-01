//! Every request suite, in the order a failure is most usefully read.
//!
//! Health first: if the app cannot boot or reach its database, nothing below
//! can say anything meaningful. Then auth, then the dictionary — the two things
//! every business suite depends on — then the per-entity CRUD and rules
//! modules, which are generated one per entity in the model.
//!
//! Generated: 2026-10-01T05:18:50.211Z
//! Project: procurement

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
mod crud_exchange_rate;
mod crud_goods_receipt;
mod crud_goods_receipt_line;
mod crud_invoice;
mod crud_invoice_line;
mod crud_language;
mod crud_legal_entity;
mod crud_location;
mod crud_organization;
mod crud_party;
mod crud_party_relationship;
mod crud_party_role;
mod crud_person;
mod crud_product;
mod crud_purchase_order;
mod crud_purchase_order_line;
mod crud_purchase_requisition;
mod crud_purchase_requisition_line;
mod crud_request_for_quotation;
mod crud_request_for_quotation_line;
mod crud_supplier;
mod crud_supplier_claim;
mod crud_supplier_claim_resolution;
mod crud_supplier_credit_note;
mod crud_supplier_credit_note_application;
mod crud_supplier_credit_note_line;
mod crud_supplier_debit_note;
mod crud_supplier_debit_note_application;
mod crud_supplier_debit_note_line;
mod crud_supplier_performance_assessment;
mod crud_supplier_quotation;
mod crud_supplier_quotation_line;
mod crud_supplier_return;
mod crud_supplier_return_line;
mod crud_unit_of_measure;

mod rules_address;
mod rules_attachment;
mod rules_business_unit;
mod rules_calendar;
mod rules_contact_point;
mod rules_country;
mod rules_currency;
mod rules_department;
mod rules_exchange_rate;
mod rules_goods_receipt;
mod rules_goods_receipt_line;
mod rules_invoice;
mod rules_invoice_line;
mod rules_language;
mod rules_legal_entity;
mod rules_location;
mod rules_organization;
mod rules_party;
mod rules_party_relationship;
mod rules_party_role;
mod rules_person;
mod rules_product;
mod rules_purchase_order;
mod rules_purchase_order_line;
mod rules_purchase_requisition;
mod rules_purchase_requisition_line;
mod rules_request_for_quotation;
mod rules_request_for_quotation_line;
mod rules_supplier;
mod rules_supplier_claim;
mod rules_supplier_claim_resolution;
mod rules_supplier_credit_note;
mod rules_supplier_credit_note_application;
mod rules_supplier_credit_note_line;
mod rules_supplier_debit_note;
mod rules_supplier_debit_note_application;
mod rules_supplier_debit_note_line;
mod rules_supplier_performance_assessment;
mod rules_supplier_quotation;
mod rules_supplier_quotation_line;
mod rules_supplier_return;
mod rules_supplier_return_line;
mod rules_unit_of_measure;
