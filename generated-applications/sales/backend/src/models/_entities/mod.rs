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
pub mod bus_brand;
pub mod bus_brand_status;
pub mod bus_business_unit;
pub mod bus_calendar;
pub mod bus_campaign;
pub mod bus_contact;
pub mod bus_contact_point;
pub mod bus_country;
pub mod bus_currency;
pub mod bus_currency_status;
pub mod bus_customer;
pub mod bus_customer_credit_status;
pub mod bus_customer_customer_type;
pub mod bus_customer_return;
pub mod bus_customer_return_line;
pub mod bus_customer_return_line_disposition;
pub mod bus_customer_return_status;
pub mod bus_customer_role_type;
pub mod bus_customer_status;
pub mod bus_department;
pub mod bus_discount_rule;
pub mod bus_discount_rule_method;
pub mod bus_discount_rule_status;
pub mod bus_exchange_rate;
pub mod bus_exchange_rate_rate_type;
pub mod bus_exchange_rate_status;
pub mod bus_language;
pub mod bus_lead;
pub mod bus_lead_status;
pub mod bus_legal_entity;
pub mod bus_location;
pub mod bus_location_location_type;
pub mod bus_location_status;
pub mod bus_opportunity;
pub mod bus_opportunity_stage;
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
pub mod bus_payment_term;
pub mod bus_payment_term_due_date_basis;
pub mod bus_payment_term_status;
pub mod bus_person;
pub mod bus_person_gender;
pub mod bus_person_party_type;
pub mod bus_person_status;
pub mod bus_pricing;
pub mod bus_product;
pub mod bus_product_category;
pub mod bus_product_category_status;
pub mod bus_product_product_type;
pub mod bus_product_status;
pub mod bus_promotion;
pub mod bus_prospect;
pub mod bus_purchase_order;
pub mod bus_purchase_order_line;
pub mod bus_purchase_order_line_price_source;
pub mod bus_purchase_order_status;
pub mod bus_quotation;
pub mod bus_quotation_line;
pub mod bus_quotation_line_price_source;
pub mod bus_quotation_status;
pub mod bus_sales_order;
pub mod bus_sales_order_line;
pub mod bus_sales_order_line_price_source;
pub mod bus_sales_order_status;
pub mod bus_supplier;
pub mod bus_supplier_qualification_status;
pub mod bus_supplier_role_type;
pub mod bus_supplier_status;
pub mod bus_supplier_supplier_type;
pub mod bus_unit_of_measure;
pub mod bus_unit_of_measure_category;
pub mod bus_unit_of_measure_status;
pub mod users;
