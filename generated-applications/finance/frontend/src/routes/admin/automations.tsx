/**
 * Automations — build multi-step workflows and business rules.
 *
 * One screen holds the automations, the rule tables they look up, and the help,
 * because a rule table is only ever reached from a step that uses it.
 *
 * The entity list is baked in at generation time from this app's own model, so
 * the pickers and the help examples name Party rather than a
 * stand-in the reader has to translate.
 *
 * Generated for: finance
 */

import { createFileRoute } from '@tanstack/react-router';
import { apiClient } from '@/lib/api-client';
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { AutomationBuilder, type RuleTableSummary } from '@/components/automation/AutomationBuilder';
import { AutomationHelp } from '@/components/automation/AutomationHelp';
import { RailSection } from '@/components/automation/RailList';
import { RuleTableEditor } from '@/components/automation/RuleTableEditor';
import { type Automation, emptyAutomation, validateAutomation } from '@/lib/automation/model';
import {
  automationToYaml,
  readStoredAutomation,
  type StoredAutomationRow,
} from '@/lib/automation/yaml';
import { type DecisionTable, emptyDecisionTable } from '@/lib/workflow/bpmn-model';

export const Route = createFileRoute('/admin/automations')({
  component: AutomationsPage,
});

/** This app's entities and their fields, from the model it was generated from. */
const ENTITIES: string[] = [
  'Party',
  'Person',
  'Organization',
  'PartyRole',
  'PartyRelationship',
  'LegalEntity',
  'BusinessUnit',
  'Department',
  'Address',
  'ContactPoint',
  'Location',
  'Country',
  'StateProvince',
  'City',
  'Language',
  'Currency',
  'ExchangeRate',
  'UnitOfMeasure',
  'Calendar',
  'CalendarException',
  'Attachment',
  'Task',
  'Account',
  'JournalEntry',
  'JournalEntryLine',
  'Invoice',
  'Payment',
  'Supplier',
  'PurchaseOrder',
  'Customer',
  'SalesOrder',
  'Budget',
  'BudgetLine',
  'Forecast',
  'Scenario',
  'CostCenter',
  'ProfitCenter',
  'Variance',
  'Ledger',
  'FiscalPeriod',
  'InvoiceLine',
  'PaymentAllocation',
  'PaymentInstruction',
  'CreditNote',
  'CreditNoteLine',
  'CreditNoteApplication',
  'TaxCode',
  'TaxJurisdiction',
  'TaxRate',
  'TaxRegistration',
  'TaxRule',
  'TaxTransaction',
  'BillingCycle',
  'Charge',
  'Subscription',
  'SubscriptionPlan',
  'UsageRecord',
  'AssetClass',
  'AssetAcquisition',
  'AssetDepreciation',
  'AssetDisposal',
  'AssetTransfer',
  'ForeignExchangeTransaction',
  'CashPosition',
  'Interest',
  'PurchaseOrderLine',
  'SalesOrderLine',
  'BankAccount',
  'Asset',
  'Product',
  'PartyPartyType',
  'PartyStatus',
  'PersonGender',
  'PersonPartyType',
  'PersonStatus',
  'OrganizationOrganizationType',
  'OrganizationStatus',
  'OrganizationPartyType',
  'PartyRoleRoleType',
  'PartyRoleStatus',
  'PartyRelationshipRelationshipType',
  'PartyRelationshipStatus',
  'LegalEntityStatus',
  'BusinessUnitStatus',
  'DepartmentStatus',
  'AddressAddressType',
  'AddressStatus',
  'ContactPointChannel',
  'ContactPointPurpose',
  'ContactPointStatus',
  'LocationLocationType',
  'LocationStatus',
  'LanguageDirection',
  'CurrencyStatus',
  'ExchangeRateRateType',
  'ExchangeRateStatus',
  'UnitOfMeasureCategory',
  'UnitOfMeasureStatus',
  'CalendarStatus',
  'CalendarExceptionExceptionType',
  'AttachmentStatus',
  'TaskTaskType',
  'TaskStatus',
  'TaskPriority',
  'AccountAccountType',
  'AccountStatus',
  'JournalEntryStatus',
  'InvoiceInvoiceType',
  'InvoiceStatus',
  'PaymentDirection',
  'PaymentStatus',
  'PaymentPaymentMethod',
  'SupplierSupplierType',
  'SupplierQualificationStatus',
  'SupplierStatus',
  'SupplierRoleType',
  'PurchaseOrderStatus',
  'CustomerCustomerType',
  'CustomerCreditStatus',
  'CustomerStatus',
  'CustomerRoleType',
  'SalesOrderStatus',
  'BudgetStatus',
  'BudgetBudgetType',
  'ForecastForecastType',
  'ForecastStatus',
  'ScenarioStatus',
  'ScenarioScenarioType',
  'CostCenterCategory',
  'CostCenterStatus',
  'ProfitCenterStatus',
  'VarianceBasis',
  'VarianceComparisonType',
  'VarianceStatus',
  'LedgerStatus',
  'LedgerLedgerType',
  'FiscalPeriodStatus',
  'InvoiceLineMatchingStatus',
  'PaymentAllocationStatus',
  'PaymentInstructionStatus',
  'PaymentInstructionPaymentMethod',
  'CreditNoteStatus',
  'CreditNoteApplicationStatus',
  'TaxCodeStatus',
  'TaxCodeTaxType',
  'TaxCodeCategory',
  'TaxJurisdictionStatus',
  'TaxJurisdictionLevel',
  'TaxJurisdictionFilingFrequency',
  'TaxRateStatus',
  'TaxRateRateBasis',
  'TaxRateRateType',
  'TaxRegistrationStatus',
  'TaxRegistrationTaxType',
  'TaxRegistrationFilingFrequency',
  'TaxRuleTaxType',
  'TaxRuleStatus',
  'TaxTransactionStatus',
  'TaxTransactionDirection',
  'BillingCycleStatus',
  'BillingCycleFrequency',
  'ChargeStatus',
  'ChargeChargeType',
  'SubscriptionStatus',
  'SubscriptionPlanStatus',
  'SubscriptionPlanPricingUnit',
  'UsageRecordStatus',
  'AssetClassDepreciationMethod',
  'AssetClassStatus',
  'AssetAcquisitionAcquisitionType',
  'AssetAcquisitionStatus',
  'AssetDepreciationDepreciationMethod',
  'AssetDisposalDisposalMethod',
  'AssetDisposalStatus',
  'AssetTransferTransferType',
  'AssetTransferStatus',
  'ForeignExchangeTransactionDealType',
  'ForeignExchangeTransactionStatus',
  'InterestInterestType',
  'InterestDayCountBasis',
  'InterestStatus',
  'PurchaseOrderLinePriceSource',
  'SalesOrderLinePriceSource',
  'BankAccountAccountType',
  'BankAccountStatus',
  'AssetStatus',
  'ProductProductType',
  'ProductStatus',
];

const ENTITY_FIELDS: Record<string, string[]> = {
  'Party': ['id', 'party_type', 'display_name', 'status', 'external_reference', 'bank_account_id'],
  'Person': ['id', 'party_id', 'title', 'given_name', 'middle_name', 'family_name', 'preferred_name', 'date_of_birth', 'gender', 'nationality_id', 'party_type', 'display_name', 'status', 'external_reference'],
  'Organization': ['id', 'party_id', 'code', 'name', 'organization_type', 'status', 'legal_name', 'registration_number', 'tax_identifier', 'party_type', 'display_name', 'external_reference', 'person_id', 'parent_organization_id', 'tax_rule_id'],
  'PartyRole': ['id', 'party_id', 'role_type', 'code', 'valid_from', 'valid_to', 'status', 'person_id', 'organization_id'],
  'PartyRelationship': ['id', 'code', 'name', 'relationship_type', 'ownership_percent', 'valid_from', 'valid_to', 'status', 'from_party_id'],
  'LegalEntity': ['id', 'occurred_at', 'legal_name', 'registration_number', 'legal_form', 'incorporation_date', 'dissolution_date', 'tax_identifier', 'vat_number', 'lei', 'is_group_company', 'status', 'organization_id', 'country_id', 'registered_address_id', 'functional_currency_id', 'parent_entity_id'],
  'BusinessUnit': ['id', 'code', 'name', 'description', 'status', 'organization_id', 'head_id', 'legal_entity_id', 'profit_center_id', 'parent_unit_id'],
  'Department': ['id', 'code', 'name', 'description', 'status', 'organization_id', 'business_unit_id', 'parent_department_id', 'manager_id', 'cost_center_id', 'location_id'],
  'Address': ['id', 'address_type', 'line1', 'line2', 'line3', 'city_name', 'postal_code', 'latitude', 'longitude', 'is_primary', 'status', 'party_id', 'person_id', 'organization_id', 'country_id', 'state_province_id', 'city_id', 'supplier_id', 'customer_id'],
  'ContactPoint': ['id', 'code', 'name', 'channel', 'value', 'purpose', 'is_preferred', 'verified_at', 'status', 'party_id'],
  'Location': ['id', 'code', 'name', 'location_type', 'status', 'address_id', 'parent_location_id', 'organization_id', 'product_id'],
  'Country': ['id', 'code', 'alpha3', 'numeric_code', 'name', 'phone_code', 'currency_id'],
  'StateProvince': ['id', 'code', 'name', 'subdivision_type', 'country_id'],
  'City': ['id', 'code', 'name', 'population', 'latitude', 'longitude', 'timezone', 'is_capital', 'country_id', 'state_province_id'],
  'Language': ['id', 'code', 'name', 'alpha3', 'direction'],
  'Currency': ['id', 'code', 'name', 'symbol', 'decimal_places', 'status'],
  'ExchangeRate': ['id', 'from_currency_id', 'to_currency_id', 'rate', 'rate_type', 'effective_at', 'expires_at', 'source', 'status', 'from_currency', 'to_currency'],
  'UnitOfMeasure': ['id', 'code', 'name', 'symbol', 'category', 'conversion_factor', 'base_unit_id', 'status'],
  'Calendar': ['id', 'code', 'name', 'working_days', 'time_zone', 'valid_from', 'valid_to', 'status', 'country_id', 'base_calendar_id'],
  'CalendarException': ['id', 'exception_date', 'name', 'exception_type', 'is_working_day', 'calendar_id'],
  'Attachment': ['id', 'effective_at', 'file_name', 'media_type', 'size_bytes', 'storage_location', 'checksum', 'record_type', 'record_id', 'category', 'description', 'uploaded_at', 'status', 'uploaded_by_id'],
  'Task': ['id', 'code', 'name', 'description', 'task_type', 'status', 'priority', 'due_at', 'started_at', 'completed_at', 'assignee_id', 'organization_id'],
  'Account': ['id', 'code', 'name', 'account_type', 'status', 'currency_id', 'is_posting_account', 'parent_account_id', 'organization_id'],
  'JournalEntry': ['id', 'entry_number', 'entry_date', 'status', 'description', 'currency_id', 'payment_id', 'credit_note_id', 'organization_id', 'fiscal_period_id', 'ledger_id'],
  'JournalEntryLine': ['id', 'line_number', 'debit_amount', 'credit_amount', 'description', 'journal_entry_id', 'account_id'],
  'Invoice': ['id', 'invoice_number', 'invoice_date', 'due_date', 'invoice_type', 'status', 'currency_id', 'subtotal', 'discount_amount', 'taxable_amount', 'tax_amount', 'total_amount', 'amount_settled', 'amount_credited', 'amount_outstanding', 'customer_id', 'supplier_id', 'sales_order_id', 'purchase_order_id'],
  'Payment': ['id', 'payment_number', 'payment_date', 'direction', 'status', 'amount', 'currency_id', 'payment_method', 'value_date', 'external_reference', 'payer_id', 'bank_account_id', 'supplier_id', 'customer_id', 'cash_position_id'],
  'Supplier': ['id', 'party_role_id', 'supplier_code', 'supplier_type', 'qualification_status', 'payment_terms', 'status', 'party_id', 'role_type', 'code', 'valid_from', 'valid_to', 'organization_id'],
  'PurchaseOrder': ['id', 'order_number', 'order_date', 'status', 'currency_id', 'requested_delivery_date', 'total_amount', 'supplier_id', 'organization_id', 'delivery_location_id'],
  'Customer': ['id', 'party_role_id', 'customer_code', 'customer_type', 'credit_status', 'credit_limit', 'payment_terms', 'status', 'party_id', 'role_type', 'code', 'valid_from', 'valid_to', 'organization_id', 'tax_rule_id'],
  'SalesOrder': ['id', 'order_number', 'order_date', 'status', 'currency_id', 'requested_delivery_date', 'total_amount', 'customer_id', 'organization_id', 'delivery_location_id'],
  'Budget': ['id', 'code', 'status', 'name', 'budget_version', 'budget_type', 'total_amount', 'approved_at', 'organization_id', 'fiscal_period_id', 'scenario_id', 'currency_id'],
  'BudgetLine': ['id', 'amount', 'line_number', 'description', 'period_start', 'period_end', 'quantity', 'basis_of_estimate', 'budget_id', 'account_id', 'cost_center_id', 'profit_center_id'],
  'Forecast': ['id', 'code', 'name', 'as_of_date', 'horizon_start', 'horizon_end', 'forecast_type', 'total_revenue', 'total_cost', 'assumptions', 'status', 'organization_id', 'scenario_id', 'fiscal_period_id', 'currency_id'],
  'Scenario': ['id', 'code', 'status', 'name', 'scenario_type', 'assumptions'],
  'CostCenter': ['id', 'code', 'name', 'category', 'valid_from', 'valid_to', 'status', 'organization_id', 'manager_id', 'parent_cost_center_id', 'profit_center_id'],
  'ProfitCenter': ['id', 'code', 'name', 'segment', 'valid_from', 'valid_to', 'status', 'organization_id', 'manager_id', 'parent_profit_center_id'],
  'Variance': ['id', 'code', 'period_start', 'period_end', 'basis', 'planned_amount', 'actual_amount', 'variance_amount', 'measure', 'comparison_type', 'variance_percent', 'is_favourable', 'explanation', 'status', 'organization_id', 'budget_id', 'forecast_id', 'cost_center_id', 'owner_id', 'currency_id'],
  'Ledger': ['id', 'status', 'code', 'name', 'ledger_type', 'accounting_standard', 'chart_of_accounts', 'organization_id', 'currency_id'],
  'FiscalPeriod': ['id', 'code', 'start_date', 'end_date', 'status', 'organization_id'],
  'InvoiceLine': ['id', 'line_number', 'quantity', 'unit_price', 'gross_amount', 'discount_amount', 'taxable_amount', 'tax_amount', 'net_amount', 'pricing_evidence', 'discount_evidence', 'tax_evidence', 'description', 'matching_status', 'unit_of_measure_id', 'invoice_id', 'product_id', 'purchase_order_line_id', 'sales_order_line_id'],
  'PaymentAllocation': ['id', 'payment_id', 'invoice_id', 'payment_amount', 'invoice_amount', 'exchange_rate_id', 'allocated_at', 'status', 'reversal_of_allocation_id', 'rounding_adjustment', 'currency_id'],
  'PaymentInstruction': ['id', 'status', 'instruction_number', 'amount', 'value_date', 'payee_name', 'payee_account', 'payee_bank_code', 'payment_method', 'remittance_reference', 'approved_at', 'sent_at', 'bank_status_message', 'bank_account_id', 'payment_id', 'payee_id', 'approved_by_id'],
  'CreditNote': ['id', 'credit_note_number', 'credit_note_date', 'status', 'currency_id', 'reason_code', 'subtotal', 'tax_amount', 'total_amount', 'amount_applied', 'amount_refunded', 'amount_remaining', 'customer_id'],
  'CreditNoteLine': ['id', 'line_number', 'quantity', 'unit_price', 'subtotal', 'discount_amount', 'taxable_amount', 'tax_amount', 'total_amount', 'pricing_evidence', 'tax_evidence', 'invoice_line_id', 'credit_note_id'],
  'CreditNoteApplication': ['id', 'credit_note_amount', 'invoice_amount', 'exchange_rate_id', 'applied_at', 'status', 'reversal_of_application_id', 'credit_note_id', 'invoice_id'],
  'TaxCode': ['id', 'status', 'code', 'name', 'tax_type', 'category', 'return_box', 'description', 'organization_id', 'jurisdiction_id'],
  'TaxJurisdiction': ['id', 'status', 'code', 'name', 'level', 'filing_frequency', 'organization_id', 'country_id', 'parent_jurisdiction_id'],
  'TaxRate': ['id', 'status', 'rate', 'rate_basis', 'effective_from', 'effective_to', 'tax_code_label', 'rate_type', 'rate_percent', 'amount_per_unit', 'valid_from', 'valid_to', 'organization_id', 'tax_code_id', 'tax_jurisdiction_id'],
  'TaxRegistration': ['id', 'status', 'registration_number', 'tax_type', 'valid_from', 'valid_to', 'filing_frequency', 'last_validated_date', 'organization_id', 'jurisdiction_id'],
  'TaxRule': ['id', 'code', 'name', 'rate', 'jurisdiction_code', 'tax_type', 'valid_from', 'valid_to', 'status', 'invoice_line_id', 'credit_note_line_id', 'jurisdiction_id'],
  'TaxTransaction': ['id', 'status', 'tax_transaction_number', 'document_type', 'document_reference', 'direction', 'tax_date', 'taxable_amount', 'rate_percent', 'tax_amount', 'reported_period', 'organization_id', 'invoice_id', 'tax_code_id', 'jurisdiction_id'],
  'BillingCycle': ['id', 'status', 'code', 'name', 'frequency', 'interval_count', 'anchor_day', 'cutoff_offset_days', 'invoice_offset_days', 'payment_due_days', 'currency_id'],
  'Charge': ['id', 'status', 'charge_number', 'charge_type', 'amount', 'currency_id', 'charged_on', 'description', 'period_start', 'period_end', 'quantity', 'unit_price', 'customer_id', 'subscription_id', 'product_id', 'invoice_id'],
  'Subscription': ['id', 'status', 'subscription_number', 'quantity', 'start_date', 'trial_end_date', 'current_term_start', 'current_term_end', 'auto_renew', 'cancelled_date', 'cancellation_reason', 'customer_id', 'plan_id', 'billing_cycle_id'],
  'SubscriptionPlan': ['id', 'status', 'code', 'name', 'description', 'recurring_fee', 'pricing_unit', 'included_usage', 'usage_unit', 'overage_price', 'trial_days', 'minimum_term_months', 'product_id', 'billing_cycle_id', 'currency_id'],
  'UsageRecord': ['id', 'status', 'usage_number', 'source_reference', 'source', 'metric', 'quantity', 'period_start', 'period_end', 'rejection_reason', 'customer_id', 'subscription_id', 'charge_id'],
  'AssetClass': ['id', 'effective_at', 'code', 'name', 'description', 'depreciation_method', 'useful_life_months', 'residual_value_percent', 'capitalization_threshold', 'status', 'asset_account_id'],
  'AssetAcquisition': ['id', 'effective_at', 'acquisition_number', 'acquisition_type', 'acquisition_date', 'in_service_date', 'acquisition_cost', 'additional_costs', 'capitalized_amount', 'capitalized_at', 'status', 'asset_id', 'supplier_id', 'invoice_id', 'purchase_order_id', 'currency_id'],
  'AssetDepreciation': ['id', 'depreciation_method', 'depreciation_rate', 'salvage_value', 'useful_life_months', 'depreciable_base', 'accumulated_depreciation', 'net_book_value', 'asset_id', 'product_id', 'currency_id'],
  'AssetDisposal': ['id', 'effective_at', 'disposal_number', 'disposal_method', 'disposal_date', 'reason', 'proceeds', 'book_value_at_disposal', 'gain_or_loss', 'approved_at', 'status', 'asset_id', 'buyer_id', 'approved_by_id', 'currency_id'],
  'AssetTransfer': ['id', 'effective_at', 'transfer_number', 'transfer_type', 'effective_date', 'reason', 'shipped_at', 'received_at', 'status', 'asset_id', 'from_location_id', 'from_cost_center_id', 'from_custodian_id'],
  'ForeignExchangeTransaction': ['id', 'effective_at', 'deal_number', 'deal_type', 'sold_amount', 'bought_amount', 'exchange_rate', 'trade_date', 'value_date', 'swap_reference', 'purpose', 'confirmed_at', 'settled_at', 'status', 'sold_currency_id', 'counterparty_id', 'paying_account_id'],
  'CashPosition': ['id', 'as_of', 'ledger_balance', 'available_balance', 'forecast_balance', 'bank_account_id'],
  'Interest': ['id', 'effective_at', 'calculation_number', 'interest_type', 'balance', 'rate_percent', 'day_count_basis', 'period_start', 'period_end', 'days', 'interest_amount', 'posted_at', 'status', 'invoice_id', 'currency_id'],
  'PurchaseOrderLine': ['id', 'line_number', 'quantity', 'unit_price', 'line_amount', 'received_quantity', 'accepted_quantity', 'returned_quantity', 'outstanding_quantity', 'price_source', 'price_determined_at', 'unit_of_measure_id', 'purchase_order_id', 'product_id'],
  'SalesOrderLine': ['id', 'line_number', 'quantity', 'quantity_fulfilled', 'quantity_allocated', 'unit_price', 'discount_amount', 'tax_amount', 'line_amount', 'price_source', 'price_determined_at', 'unit_of_measure_id', 'sales_order_id', 'product_id'],
  'BankAccount': ['id', 'account_number', 'account_type', 'currency_id', 'status', 'institution_id'],
  'Asset': ['id', 'asset_number', 'name', 'asset_type', 'acquisition_date', 'acquisition_cost', 'status', 'serial_number', 'owner_id', 'location_id', 'product_id'],
  'Product': ['id', 'code', 'name', 'description', 'product_type', 'status', 'sku', 'unit_of_measure', 'standard_price', 'tax_category', 'currency_id', 'tax_rule_id'],
  'PartyPartyType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PartyStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PersonGender': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PersonPartyType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PersonStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'OrganizationOrganizationType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'OrganizationStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'OrganizationPartyType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PartyRoleRoleType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PartyRoleStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PartyRelationshipRelationshipType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PartyRelationshipStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'LegalEntityStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'BusinessUnitStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'DepartmentStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AddressAddressType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AddressStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ContactPointChannel': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ContactPointPurpose': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ContactPointStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'LocationLocationType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'LocationStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'LanguageDirection': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CurrencyStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ExchangeRateRateType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ExchangeRateStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'UnitOfMeasureCategory': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'UnitOfMeasureStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CalendarStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CalendarExceptionExceptionType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AttachmentStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaskTaskType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaskStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaskPriority': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AccountAccountType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AccountStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'JournalEntryStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'InvoiceInvoiceType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'InvoiceStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PaymentDirection': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PaymentStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PaymentPaymentMethod': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'SupplierSupplierType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'SupplierQualificationStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'SupplierStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'SupplierRoleType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PurchaseOrderStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CustomerCustomerType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CustomerCreditStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CustomerStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CustomerRoleType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'SalesOrderStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'BudgetStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'BudgetBudgetType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ForecastForecastType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ForecastStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ScenarioStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ScenarioScenarioType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CostCenterCategory': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CostCenterStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ProfitCenterStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'VarianceBasis': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'VarianceComparisonType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'VarianceStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'LedgerStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'LedgerLedgerType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'FiscalPeriodStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'InvoiceLineMatchingStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PaymentAllocationStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PaymentInstructionStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PaymentInstructionPaymentMethod': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CreditNoteStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'CreditNoteApplicationStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxCodeStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxCodeTaxType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxCodeCategory': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxJurisdictionStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxJurisdictionLevel': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxJurisdictionFilingFrequency': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxRateStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxRateRateBasis': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxRateRateType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxRegistrationStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxRegistrationTaxType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxRegistrationFilingFrequency': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxRuleTaxType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxRuleStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxTransactionStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'TaxTransactionDirection': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'BillingCycleStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'BillingCycleFrequency': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ChargeStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ChargeChargeType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'SubscriptionStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'SubscriptionPlanStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'SubscriptionPlanPricingUnit': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'UsageRecordStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetClassDepreciationMethod': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetClassStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetAcquisitionAcquisitionType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetAcquisitionStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetDepreciationDepreciationMethod': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetDisposalDisposalMethod': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetDisposalStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetTransferTransferType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetTransferStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ForeignExchangeTransactionDealType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ForeignExchangeTransactionStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'InterestInterestType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'InterestDayCountBasis': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'InterestStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'PurchaseOrderLinePriceSource': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'SalesOrderLinePriceSource': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'BankAccountAccountType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'BankAccountStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'AssetStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ProductProductType': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
  'ProductStatus': ['id', 'code', 'name', 'description', 'sequence', 'is_active'],
};

/** A rule as the endpoint returns it, in either casing. */
interface RuleRow {
  id: string;
  ruleName?: string;
  entityName?: string;
  jdmContent?: unknown;
  rule_name?: string;
  entity_name?: string;
  jdm_content?: unknown;
}

interface RuleTableRecord {
  id: string;
  name: string;
  entity: string;
  table: DecisionTable;
}

type View =
  | { kind: 'automation'; id: string }
  | { kind: 'table'; id: string }
  | { kind: 'help' };

function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [storedIds, setStoredIds] = useState<Record<string, string>>({});
  const [tables, setTables] = useState<RuleTableRecord[]>([]);
  const [view, setView] = useState<View>({ kind: 'help' });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoTotal, setAutoTotal] = useState(0);
  const [tableTotal, setTableTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Through `apiClient`, not `fetch`: `/api/rules` and every
        // `/api/workflow*` route on this backend require a bearer token, and a
        // bare fetch sends none — the screen would load empty and look like a
        // model that declares no automations.
        //
        // `apiClient` throws on a non-2xx, and `Promise.all` rejects on the
        // first throw, so the two calls are settled independently: one
        // endpoint being unavailable must not blank the other's list.
        const [autoRes, ruleRes] = await Promise.allSettled([
          apiClient.get<unknown>('/workflow-definitions', { kind: 'automation', limit: 200 }),
          apiClient.get<unknown>('/rules', { limit: 200 }),
        ]);

        if (cancelled) return;

        // Parse first, then apply. Everything that touches state goes inside
        // one startTransition below.
        // The endpoint answers with the rows themselves; a paged envelope is
        // read too, so the screen does not depend on which one it gets.
        const autoPayload =
          autoRes.status === 'fulfilled'
            ? (autoRes.value as
                | StoredAutomationRow[]
                | { items?: StoredAutomationRow[]; total?: number })
            : null;
        const autoRows: StoredAutomationRow[] = autoPayload
          ? Array.isArray(autoPayload)
            ? autoPayload
            : (autoPayload.items ?? [])
          : [];
        if (autoRes.status === 'rejected') {
          console.error('Failed to load automations:', autoRes.reason);
        }

        const rulePayload =
          ruleRes.status === 'fulfilled'
            ? (ruleRes.value as
                | RuleRow[]
                | { rules?: RuleRow[]; items?: RuleRow[]; data?: RuleRow[]; total?: number })
            : null;

        if (cancelled) return;

        // Each row is its YAML document. A row that cannot be read is reported
        // and left out rather than opened as an empty automation someone could
        // publish over it.
        const parsed = autoRows.flatMap((row) => {
          try {
            return [
              {
                stored: row.id,
                automation: readStoredAutomation(row),
              },
            ];
          } catch (error) {
            console.error(`Automation "${row.name}" (${row.id}) could not be read:`, error);
            return [];
          }
        });

        const ruleRows: RuleRow[] = rulePayload
          ? Array.isArray(rulePayload)
            ? rulePayload
            : (rulePayload.rules ?? rulePayload.items ?? [])
          : [];

        // The page streams from the server showing "Loading automations…", so
        // this is the first update while hydration is still in flight. React
        // treats an urgent update inside a hydrating Suspense boundary as a
        // reason to discard the server HTML and re-render on the client — the
        // "received an update before it finished hydrating" warning. Marking it
        // non-urgent lets hydration finish first.
        startTransition(() => {
          if (autoPayload) {
            setAutoTotal(
              (Array.isArray(autoPayload) ? undefined : autoPayload.total) ?? autoRows.length
            );
            setAutomations(parsed.map((p) => p.automation));
            setStoredIds(Object.fromEntries(parsed.map((p) => [p.automation.id, p.stored])));
            const first = parsed[0];
            if (first) setView({ kind: 'automation', id: first.automation.id });
          }

          if (rulePayload) {
            setTableTotal(
              (Array.isArray(rulePayload) ? undefined : rulePayload.total) ?? ruleRows.length
            );
            setTables(
              ruleRows.map((r) => ({
                id: r.id,
                name: r.ruleName ?? r.rule_name ?? 'Untitled rule',
                entity: r.entityName ?? r.entity_name ?? '',
                table: asDecisionTable(r.jdmContent ?? r.jdm_content),
              }))
            );
          }
        });
      } catch (error) {
        console.error('Failed to load automations:', error);
      } finally {
        // This is the update that actually swaps the "Loading automations…"
        // placeholder for the builder, so it has to be non-urgent too — a
        // transition around the data alone still leaves this one able to
        // interrupt hydration.
        if (!cancelled) startTransition(() => setLoading(false));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = useMemo(
    () => (view.kind === 'automation' ? automations.find((a) => a.id === view.id) : undefined),
    [view, automations]
  );

  const currentTable = useMemo(
    () => (view.kind === 'table' ? tables.find((t) => t.id === view.id) : undefined),
    [view, tables]
  );

  const ruleTableSummaries: RuleTableSummary[] = useMemo(
    () =>
      tables.map((t) => ({
        id: t.id,
        name: t.name,
        rowCount: t.table.rules.length,
        outputs: t.table.outputs.map((o) => o.field || o.name),
      })),
    [tables]
  );

  const usersOf = useCallback(
    (tableName: string) =>
      automations.flatMap((a) =>
        a.steps
          .map((s, i) => ({ s, i }))
          .filter(({ s }) => s.type === 'Decision' && s.props.ruleTable === tableName)
          .map(({ i }) => ({ name: a.name, where: `step ${i + 1}` }))
      ),
    [automations]
  );

  const helpExample = useMemo(() => {
    const entity = ENTITIES[0] ?? 'Record';
    const fields = ENTITY_FIELDS[entity] ?? [];
    return {
      entity,
      numericField: fields.find((f) => /total|amount|price|qty|count/i.test(f)) ?? fields[0] ?? 'id',
      relatedEntity: ENTITIES[1] ?? entity,
    };
  }, []);

  const updateAutomation = (next: Automation) =>
    setAutomations((list) => list.map((a) => (a.id === next.id ? next : a)));

  const createAutomation = async () => {
    const fresh = emptyAutomation(ENTITIES[0] ?? 'Record');
    setAutomations((list) => [...list, fresh]);
    setView({ kind: 'automation', id: fresh.id });

    try {
      const created = await apiClient.post<{ id?: string; item?: { id: string } }>(
        '/workflow-definitions',
        {
          kind: 'automation',
          name: fresh.name,
          entityName: fresh.trigger.entity,
          operation: 'ALL',
          definition: automationToYaml(fresh),
        }
      );
      const id = created?.id ?? created?.item?.id;
      if (id) setStoredIds((m) => ({ ...m, [fresh.id]: id }));
    } catch (error) {
      console.error('Failed to create automation:', error);
    }
  };

  const publish = async (automation: Automation) => {
    const storedId = storedIds[automation.id];
    if (!storedId) return;

    setSaveState('saving');
    const published: Automation = { ...automation, status: 'live' };
    try {
      await apiClient.put<unknown>(`/workflow-definitions/${storedId}`, {
        name: published.name,
        entityName: published.trigger.entity,
        definition: automationToYaml(published),
        isActive: true,
      });
      setSaveState('saved');
      updateAutomation(published);
    } catch (error) {
      console.error('Failed to publish automation:', error);
      setSaveState('error');
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Loading automations…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-5">
        <span className="text-[15px] font-bold">finance</span>
        <span className="text-[13px] text-muted-foreground">
          Automations ›{' '}
          <b className="font-semibold text-foreground">
            {view.kind === 'help'
              ? 'Help'
              : view.kind === 'table'
                ? currentTable?.name ?? 'Rule table'
                : current?.name ?? 'Automation'}
          </b>
        </span>
        <div className="flex-1" />
        {saveState === 'saving' ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
        {saveState === 'saved' ? <span className="text-xs text-emerald-600">Published</span> : null}
        {saveState === 'error' ? (
          <span className="text-xs text-red-600">Could not save. Try again.</span>
        ) : null}
        <button
          type="button"
          onClick={() => setView({ kind: 'help' })}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ? Help
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Automations and rule tables"
          // Scrolls on its own: with a few hundred automations an unscrolled rail
          // grows the document instead, and selecting one further down takes the
          // work area off screen with it.
          className="flex w-[248px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card"
        >
          <RailSection
            heading="Automations"
            total={autoTotal}
            items={automations.map((a) => ({
              id: a.id,
              title: a.name,
              subtitle: `${a.trigger.entity || 'no record type'} · ${a.steps.length} step${
                a.steps.length === 1 ? '' : 's'
              }`,
              state:
                a.status === 'live'
                  ? ('live' as const)
                  : validateAutomation(a).length > 0
                    ? ('draft' as const)
                    : ('paused' as const),
            }))}
            selectedId={view.kind === 'automation' ? view.id : undefined}
            onSelect={(id) => setView({ kind: 'automation', id })}
          />

          <RailSection
            heading="Rule tables"
            total={tableTotal}
            items={tables.map((t) => ({
              id: t.id,
              title: t.name,
              subtitle: `${t.table.inputs.length} inputs · ${t.table.rules.length} rows`,
              state: 'live' as const,
            }))}
            selectedId={view.kind === 'table' ? view.id : undefined}
            onSelect={(id) => setView({ kind: 'table', id })}
          />

          <div className="mt-auto border-t border-border p-3">
            <button
              type="button"
              onClick={createAutomation}
              className="w-full rounded-lg border border-border bg-card py-2 text-[13px] font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              + New automation
            </button>
          </div>
        </nav>

        {view.kind === 'help' ? (
          <AutomationHelp
            example={helpExample}
            onClose={
              automations[0]
                ? () => setView({ kind: 'automation', id: automations[0]!.id })
                : undefined
            }
          />
        ) : null}

        {/* No onOpenHelp is passed: the header above already offers Help, and
            two identical controls on one screen is one more decision than needed. */}
        {view.kind === 'automation' && current ? (
          <AutomationBuilder
            automation={current}
            onChange={updateAutomation}
            entities={ENTITIES}
            entityFields={ENTITY_FIELDS}
            ruleTables={ruleTableSummaries}
            onOpenRuleTable={(name) => {
              const table = tables.find((t) => t.name === name);
              if (table) setView({ kind: 'table', id: table.id });
            }}
            onPublish={() => void publish(current)}
          />
        ) : null}

        {view.kind === 'table' && currentTable ? (
          <RuleTableEditor
            name={currentTable.name}
            table={currentTable.table}
            usedBy={usersOf(currentTable.name)}
            onChange={(table) =>
              setTables((list) => list.map((t) => (t.id === currentTable.id ? { ...t, table } : t)))
            }
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Accept whatever the rules endpoint stored.
 *
 * A rule saved as a JDM graph rather than a table opens as an empty table
 * instead of a guessed conversion — visibly empty beats silently wrong.
 */
function asDecisionTable(content: unknown): DecisionTable {
  if (content && typeof content === 'object') {
    const c = content as Partial<DecisionTable>;
    if (Array.isArray(c.inputs) && Array.isArray(c.outputs) && Array.isArray(c.rules)) {
      return {
        hitPolicy: c.hitPolicy === 'collect' ? 'collect' : 'first',
        inputs: c.inputs,
        outputs: c.outputs,
        rules: c.rules,
      };
    }
  }
  return emptyDecisionTable();
}
