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

pub mod bus_account;
pub mod bus_address;
pub mod bus_asset;
pub mod bus_asset_acquisition;
pub mod bus_asset_class;
pub mod bus_asset_depreciation;
pub mod bus_asset_disposal;
pub mod bus_asset_transfer;
pub mod bus_attachment;
pub mod bus_bank_account;
pub mod bus_billing_cycle;
pub mod bus_budget;
pub mod bus_budget_line;
pub mod bus_business_unit;
pub mod bus_calendar;
pub mod bus_cash_position;
pub mod bus_charge;
pub mod bus_contact_point;
pub mod bus_cost_center;
pub mod bus_country;
pub mod bus_credit_note;
pub mod bus_credit_note_application;
pub mod bus_credit_note_line;
pub mod bus_currency;
pub mod bus_customer;
pub mod bus_department;
pub mod bus_exchange_rate;
pub mod bus_fiscal_period;
pub mod bus_forecast;
pub mod bus_foreign_exchange_transaction;
pub mod bus_interest;
pub mod bus_invoice;
pub mod bus_invoice_line;
pub mod bus_journal_entry;
pub mod bus_journal_entry_line;
pub mod bus_language;
pub mod bus_ledger;
pub mod bus_legal_entity;
pub mod bus_location;
pub mod bus_organization;
pub mod bus_party;
pub mod bus_party_relationship;
pub mod bus_party_role;
pub mod bus_payment;
pub mod bus_payment_allocation;
pub mod bus_payment_instruction;
pub mod bus_person;
pub mod bus_product;
pub mod bus_profit_center;
pub mod bus_purchase_order;
pub mod bus_purchase_order_line;
pub mod bus_sales_order;
pub mod bus_sales_order_line;
pub mod bus_scenario;
pub mod bus_subscription;
pub mod bus_subscription_plan;
pub mod bus_supplier;
pub mod bus_tax_code;
pub mod bus_tax_jurisdiction;
pub mod bus_tax_rate;
pub mod bus_tax_registration;
pub mod bus_tax_rule;
pub mod bus_tax_transaction;
pub mod bus_unit_of_measure;
pub mod bus_usage_record;
pub mod bus_variance;
pub mod users;
