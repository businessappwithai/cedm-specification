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
pub mod bus_city;
pub mod bus_contact_point;
pub mod bus_country;
pub mod bus_currency;
pub mod bus_currency_status;
pub mod bus_department;
pub mod bus_exchange_rate;
pub mod bus_exchange_rate_rate_type;
pub mod bus_exchange_rate_status;
pub mod bus_goods_receipt;
pub mod bus_goods_receipt_line;
pub mod bus_goods_receipt_status;
pub mod bus_invoice;
pub mod bus_invoice_invoice_type;
pub mod bus_invoice_line;
pub mod bus_invoice_line_matching_status;
pub mod bus_invoice_status;
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
pub mod bus_product;
pub mod bus_product_product_type;
pub mod bus_product_status;
pub mod bus_purchase_order;
pub mod bus_purchase_order_line;
pub mod bus_purchase_order_line_price_source;
pub mod bus_purchase_order_status;
pub mod bus_purchase_requisition;
pub mod bus_purchase_requisition_line;
pub mod bus_purchase_requisition_status;
pub mod bus_request_for_quotation;
pub mod bus_request_for_quotation_line;
pub mod bus_request_for_quotation_status;
pub mod bus_state_province;
pub mod bus_supplier;
pub mod bus_supplier_claim;
pub mod bus_supplier_claim_claim_type;
pub mod bus_supplier_claim_resolution;
pub mod bus_supplier_claim_resolution_code;
pub mod bus_supplier_claim_resolution_resolution_type;
pub mod bus_supplier_claim_resolution_status;
pub mod bus_supplier_claim_status;
pub mod bus_supplier_credit_note;
pub mod bus_supplier_credit_note_application;
pub mod bus_supplier_credit_note_application_status;
pub mod bus_supplier_credit_note_line;
pub mod bus_supplier_credit_note_status;
pub mod bus_supplier_debit_note;
pub mod bus_supplier_debit_note_application;
pub mod bus_supplier_debit_note_application_status;
pub mod bus_supplier_debit_note_line;
pub mod bus_supplier_debit_note_status;
pub mod bus_supplier_performance_assessment;
pub mod bus_supplier_performance_assessment_rating;
pub mod bus_supplier_performance_assessment_status;
pub mod bus_supplier_qualification_status;
pub mod bus_supplier_quotation;
pub mod bus_supplier_quotation_line;
pub mod bus_supplier_quotation_line_award_status;
pub mod bus_supplier_quotation_status;
pub mod bus_supplier_return;
pub mod bus_supplier_return_line;
pub mod bus_supplier_return_line_disposition;
pub mod bus_supplier_return_status;
pub mod bus_supplier_role_type;
pub mod bus_supplier_status;
pub mod bus_supplier_supplier_type;
pub mod bus_task;
pub mod bus_task_priority;
pub mod bus_task_status;
pub mod bus_task_task_type;
pub mod bus_unit_of_measure;
pub mod bus_unit_of_measure_category;
pub mod bus_unit_of_measure_status;
pub mod users;
