/**
 * What the model declared — as data.
 *
 * `entities.ts` describes the *shape* the suites have to build payloads for.
 * This file is the other half: the values a column is allowed to hold and the
 * states a record is allowed to move between, taken straight from the enums
 * and state machines of the source model.
 *
 * The distinction matters. A suite that reads the running application's
 * dictionary and then asserts against that same dictionary proves only that
 * the application is self-consistent — it passes just as happily when the
 * generator dropped a value on the floor. Everything here is the model's own
 * word, so a dropdown that lost an option or a state machine that lost an edge
 * fails a test instead of quietly shipping.
 *
 * Generated: 2026-10-09T15:28:46.057Z
 * Project: finance
 */

export interface ModelEnum {
  /** Name as the model spells it. */
  name: string;
  /** sys_reference_id the generator allocated — 1000 and up. */
  referenceId: number;
  /** Allowed values, in declaration order. */
  values: string[];
}

export interface StateEdge {
  from: string;
  to: string;
  /** The `:` label on the diagram's arrow, where it carries one. */
  trigger: string;
}

export interface StateMachine {
  /** ERD entity name, e.g. "Program". */
  entity: string;
  /** Physical table the guard reads transitions for. */
  tableName: string;
  /** Column holding the state — `status` unless the entity has no such column. */
  statusField: string;
  /** The state a record starts in, from the `[*] --> x` edge. */
  initial: string;
  /** States with no outgoing edge. */
  terminal: string[];
  /** Every edge the diagram draws, minus the `[*]` start and end markers. */
  edges: StateEdge[];
}

export const modelEnums: ModelEnum[] = [
  {
    name: "AccountAccountType",
    referenceId: 1000,
    values: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE", "CONTRA"],
  },
  {
    name: "AccountStatus",
    referenceId: 1001,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "AddressAddressType",
    referenceId: 1002,
    values: ["RESIDENTIAL", "BUSINESS", "BILLING", "SHIPPING", "REGISTERED", "POSTAL", "OTHER"],
  },
  {
    name: "AddressStatus",
    referenceId: 1003,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "AssetDepreciationDepreciationMethod",
    referenceId: 1004,
    values: ["STRAIGHT", "REM_LIFE", "RED_BAL", "NBVSLUNIT"],
  },
  {
    name: "AssetStatus",
    referenceId: 1005,
    values: ["PLANNED", "ACTIVE", "UNDER_MAINTENANCE", "HELD", "DISPOSED", "RETIRED"],
  },
  {
    name: "BankAccountAccountType",
    referenceId: 1006,
    values: ["CURRENT", "SAVINGS", "LOAN", "ESCROW", "OTHER"],
  },
  {
    name: "BankAccountStatus",
    referenceId: 1007,
    values: ["PENDING", "ACTIVE", "BLOCKED", "CLOSED"],
  },
  {
    name: "BillingCycleStatus",
    referenceId: 1008,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "BudgetStatus",
    referenceId: 1009,
    values: ["DRAFT", "SUBMITTED", "APPROVED", "ACTIVE", "SUPERSEDED", "CLOSED"],
  },
  {
    name: "ChargeChargeType",
    referenceId: 1010,
    values: ["SUBSCRIPTION", "USAGE", "SERVICE", "PRODUCT", "FEE", "ADJUSTMENT"],
  },
  {
    name: "ChargeStatus",
    referenceId: 1011,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "CreditNoteApplicationStatus",
    referenceId: 1012,
    values: ["DRAFT", "ACTIVE", "REVERSED", "CANCELLED"],
  },
  {
    name: "CreditNoteStatus",
    referenceId: 1013,
    values: ["DRAFT", "APPROVED", "POSTED", "PARTIALLY_APPLIED", "FULLY_APPLIED", "REFUND_DUE", "REFUNDED", "CANCELLED", "REVERSED"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1014,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "CustomerCreditStatus",
    referenceId: 1015,
    values: ["NOT_REVIEWED", "APPROVED", "ON_HOLD", "BLOCKED"],
  },
  {
    name: "CustomerCustomerType",
    referenceId: 1016,
    values: ["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "INTERNAL", "OTHER"],
  },
  {
    name: "CustomerRoleType",
    referenceId: 1017,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "CustomerStatus",
    referenceId: 1018,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1019,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1020,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "FiscalPeriodStatus",
    referenceId: 1021,
    values: ["FUTURE", "OPEN", "SOFT_CLOSED", "CLOSED", "LOCKED"],
  },
  {
    name: "InvoiceInvoiceType",
    referenceId: 1022,
    values: ["SALES", "PURCHASE", "CREDIT_NOTE", "DEBIT_NOTE"],
  },
  {
    name: "InvoiceLineMatchingStatus",
    referenceId: 1023,
    values: ["NOT_APPLICABLE", "UNMATCHED", "MATCHED", "PARTIALLY_MATCHED", "EXCEPTION", "WAIVED"],
  },
  {
    name: "InvoiceStatus",
    referenceId: 1024,
    values: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "VOID"],
  },
  {
    name: "JournalEntryStatus",
    referenceId: 1025,
    values: ["DRAFT", "POSTED", "REVERSED"],
  },
  {
    name: "LedgerStatus",
    referenceId: 1026,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1027,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1028,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "OrganizationOrganizationType",
    referenceId: 1029,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1030,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1031,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1032,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1033,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1034,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1035,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PaymentAllocationStatus",
    referenceId: 1036,
    values: ["DRAFT", "ACTIVE", "REVERSED", "CANCELLED"],
  },
  {
    name: "PaymentDirection",
    referenceId: 1037,
    values: ["RECEIPT", "DISBURSEMENT"],
  },
  {
    name: "PaymentInstructionStatus",
    referenceId: 1038,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "PaymentPaymentMethod",
    referenceId: 1039,
    values: ["CASH", "BANK_TRANSFER", "CARD", "CHEQUE", "DIRECT_DEBIT", "OTHER"],
  },
  {
    name: "PaymentStatus",
    referenceId: 1040,
    values: ["DRAFT", "APPROVED", "POSTED", "CLEARED", "VOID", "REVERSED"],
  },
  {
    name: "PersonGender",
    referenceId: 1041,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1042,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1043,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "ProductProductType",
    referenceId: 1044,
    values: ["GOOD", "MATERIAL", "SERVICE", "SUBSCRIPTION", "ASSET", "BUNDLE", "OTHER"],
  },
  {
    name: "ProductStatus",
    referenceId: 1045,
    values: ["DRAFT", "ACTIVE", "DISCONTINUED", "BLOCKED", "RETIRED"],
  },
  {
    name: "PurchaseOrderLinePriceSource",
    referenceId: 1046,
    values: ["PRICE_LIST", "CONTRACT", "SUPPLIER_AGREEMENT", "QUOTATION", "MANUAL", "OTHER"],
  },
  {
    name: "PurchaseOrderStatus",
    referenceId: 1047,
    values: ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED", "CLOSED"],
  },
  {
    name: "SalesOrderLinePriceSource",
    referenceId: 1048,
    values: ["PRICE_LIST", "CONTRACT", "CUSTOMER_AGREEMENT", "QUOTATION", "MANUAL", "PROMOTION", "OTHER"],
  },
  {
    name: "SalesOrderStatus",
    referenceId: 1049,
    values: ["DRAFT", "CONFIRMED", "ALLOCATED", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED"],
  },
  {
    name: "ScenarioStatus",
    referenceId: 1050,
    values: ["DRAFT", "ACTIVE", "ARCHIVED"],
  },
  {
    name: "SubscriptionPlanStatus",
    referenceId: 1051,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "SubscriptionStatus",
    referenceId: 1052,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "SupplierQualificationStatus",
    referenceId: 1053,
    values: ["NOT_REVIEWED", "PENDING", "QUALIFIED", "SUSPENDED", "DISQUALIFIED"],
  },
  {
    name: "SupplierRoleType",
    referenceId: 1054,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "SupplierStatus",
    referenceId: 1055,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "SupplierSupplierType",
    referenceId: 1056,
    values: ["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "INTERNAL", "OTHER"],
  },
  {
    name: "TaskPriority",
    referenceId: 1057,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1058,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1059,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
  },
  {
    name: "TaxCodeStatus",
    referenceId: 1060,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "TaxJurisdictionStatus",
    referenceId: 1061,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "TaxRateRateBasis",
    referenceId: 1062,
    values: ["PERCENTAGE", "FIXED_AMOUNT"],
  },
  {
    name: "TaxRateStatus",
    referenceId: 1063,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "TaxRegistrationStatus",
    referenceId: 1064,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "TaxRuleStatus",
    referenceId: 1065,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "TaxRuleTaxType",
    referenceId: 1066,
    values: ["SALES", "VAT", "GST", "USE", "WITHHOLDING", "OTHER"],
  },
  {
    name: "TaxTransactionStatus",
    referenceId: 1067,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1068,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1069,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "UsageRecordStatus",
    referenceId: 1070,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "VarianceBasis",
    referenceId: 1071,
    values: ["BUDGET", "FORECAST"],
  },
];

export const stateMachines: StateMachine[] = [
  {
    entity: "Party",
    tableName: "bus_party",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "BLOCKED", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Organization",
    tableName: "bus_organization",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["RETIRED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "DRAFT", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "PartyRole",
    tableName: "bus_party_role",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["EXPIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "EXPIRED", trigger: "expire" },
      { from: "INACTIVE", to: "EXPIRED", trigger: "expire" },
    ],
  },
  {
    entity: "Address",
    tableName: "bus_address",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Location",
    tableName: "bus_location",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["CLOSED", "RETIRED"],
    edges: [
      { from: "PLANNED", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "CLOSED", trigger: "close" },
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "PLANNED", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Currency",
    tableName: "bus_currency",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "ExchangeRate",
    tableName: "bus_exchange_rate",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["EXPIRED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "EXPIRED", trigger: "expire" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "UnitOfMeasure",
    tableName: "bus_unit_of_measure",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Task",
    tableName: "bus_task",
    statusField: "status",
    initial: "CREATED",
    terminal: ["COMPLETED", "CANCELLED", "FAILED"],
    edges: [
      { from: "CREATED", to: "READY", trigger: "mark_ready" },
      { from: "READY", to: "ASSIGNED", trigger: "assign" },
      { from: "ASSIGNED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "COMPLETED", trigger: "complete" },
      { from: "READY", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "READY", trigger: "unblock" },
      { from: "ASSIGNED", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ASSIGNED", trigger: "unblock" },
      { from: "IN_PROGRESS", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "IN_PROGRESS", trigger: "unblock" },
      { from: "CREATED", to: "CANCELLED", trigger: "cancel" },
      { from: "READY", to: "CANCELLED", trigger: "cancel" },
      { from: "ASSIGNED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
      { from: "BLOCKED", to: "CANCELLED", trigger: "cancel" },
      { from: "READY", to: "FAILED", trigger: "fail" },
      { from: "ASSIGNED", to: "FAILED", trigger: "fail" },
      { from: "IN_PROGRESS", to: "FAILED", trigger: "fail" },
      { from: "BLOCKED", to: "FAILED", trigger: "fail" },
    ],
  },
  {
    entity: "Account",
    tableName: "bus_account",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "JournalEntry",
    tableName: "bus_journal_entry",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["REVERSED"],
    edges: [
      { from: "DRAFT", to: "POSTED", trigger: "post" },
      { from: "POSTED", to: "REVERSED", trigger: "reverse" },
    ],
  },
  {
    entity: "Invoice",
    tableName: "bus_invoice",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["PAID", "CANCELLED", "VOID"],
    edges: [
      { from: "DRAFT", to: "ISSUED", trigger: "issue" },
      { from: "ISSUED", to: "PARTIALLY_PAID", trigger: "mark_partially_paid" },
      { from: "PARTIALLY_PAID", to: "PAID", trigger: "pay" },
      { from: "ISSUED", to: "OVERDUE", trigger: "mark_overdue" },
      { from: "OVERDUE", to: "ISSUED", trigger: "resume" },
      { from: "PARTIALLY_PAID", to: "OVERDUE", trigger: "mark_overdue" },
      { from: "OVERDUE", to: "PARTIALLY_PAID", trigger: "resume" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ISSUED", to: "CANCELLED", trigger: "cancel" },
      { from: "PARTIALLY_PAID", to: "CANCELLED", trigger: "cancel" },
      { from: "OVERDUE", to: "CANCELLED", trigger: "cancel" },
      { from: "DRAFT", to: "VOID", trigger: "void" },
      { from: "ISSUED", to: "VOID", trigger: "void" },
      { from: "PARTIALLY_PAID", to: "VOID", trigger: "void" },
      { from: "OVERDUE", to: "VOID", trigger: "void" },
    ],
  },
  {
    entity: "Payment",
    tableName: "bus_payment",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["CLEARED", "VOID", "REVERSED"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "POSTED", trigger: "post" },
      { from: "POSTED", to: "CLEARED", trigger: "mark_cleared" },
      { from: "DRAFT", to: "VOID", trigger: "void" },
      { from: "APPROVED", to: "VOID", trigger: "void" },
      { from: "POSTED", to: "VOID", trigger: "void" },
      { from: "POSTED", to: "REVERSED", trigger: "reverse" },
    ],
  },
  {
    entity: "Supplier",
    tableName: "bus_supplier",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "BLOCKED", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "PurchaseOrder",
    tableName: "bus_purchase_order",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["CLOSED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "SENT", trigger: "mark_sent" },
      { from: "SENT", to: "PARTIALLY_RECEIVED", trigger: "mark_partially_received" },
      { from: "PARTIALLY_RECEIVED", to: "RECEIVED", trigger: "receive" },
      { from: "RECEIVED", to: "CLOSED", trigger: "close" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
      { from: "SENT", to: "CANCELLED", trigger: "cancel" },
      { from: "PARTIALLY_RECEIVED", to: "CANCELLED", trigger: "cancel" },
      { from: "RECEIVED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Customer",
    tableName: "bus_customer",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "BLOCKED", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "SalesOrder",
    tableName: "bus_sales_order",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["FULFILLED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "CONFIRMED", trigger: "confirm" },
      { from: "CONFIRMED", to: "ALLOCATED", trigger: "mark_allocated" },
      { from: "ALLOCATED", to: "PARTIALLY_FULFILLED", trigger: "mark_partially_fulfilled" },
      { from: "PARTIALLY_FULFILLED", to: "FULFILLED", trigger: "fulfil" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "CONFIRMED", to: "CANCELLED", trigger: "cancel" },
      { from: "ALLOCATED", to: "CANCELLED", trigger: "cancel" },
      { from: "PARTIALLY_FULFILLED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Budget",
    tableName: "bus_budget",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["CLOSED", "SUPERSEDED"],
    edges: [
      { from: "DRAFT", to: "SUBMITTED", trigger: "submit" },
      { from: "SUBMITTED", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "CLOSED", trigger: "close" },
      { from: "DRAFT", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "SUBMITTED", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "APPROVED", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "ACTIVE", to: "SUPERSEDED", trigger: "mark_superseded" },
    ],
  },
  {
    entity: "Scenario",
    tableName: "bus_scenario",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["ARCHIVED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "ARCHIVED", trigger: "archive" },
    ],
  },
  {
    entity: "Ledger",
    tableName: "bus_ledger",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "FiscalPeriod",
    tableName: "bus_fiscal_period",
    statusField: "status",
    initial: "FUTURE",
    terminal: ["CLOSED"],
    edges: [
      { from: "FUTURE", to: "OPEN", trigger: "open" },
      { from: "OPEN", to: "SOFT_CLOSED", trigger: "mark_soft_closed" },
      { from: "SOFT_CLOSED", to: "CLOSED", trigger: "close" },
      { from: "OPEN", to: "LOCKED", trigger: "lock" },
      { from: "LOCKED", to: "OPEN", trigger: "unlock" },
    ],
  },
  {
    entity: "PaymentAllocation",
    tableName: "bus_payment_allocation",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["REVERSED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "REVERSED", trigger: "reverse" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "PaymentInstruction",
    tableName: "bus_payment_instruction",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "CreditNote",
    tableName: "bus_credit_note",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["CANCELLED", "REVERSED"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "POSTED", trigger: "post" },
      { from: "POSTED", to: "PARTIALLY_APPLIED", trigger: "apply" },
      { from: "POSTED", to: "FULLY_APPLIED", trigger: "apply" },
      { from: "PARTIALLY_APPLIED", to: "FULLY_APPLIED", trigger: "apply" },
      { from: "POSTED", to: "REFUND_DUE", trigger: "mark_refund_due" },
      { from: "PARTIALLY_APPLIED", to: "REFUND_DUE", trigger: "mark_refund_due" },
      { from: "REFUND_DUE", to: "REFUNDED", trigger: "refund" },
      { from: "REFUND_DUE", to: "PARTIALLY_APPLIED", trigger: "apply" },
      { from: "REFUND_DUE", to: "FULLY_APPLIED", trigger: "apply" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
      { from: "POSTED", to: "REVERSED", trigger: "reverse" },
      { from: "PARTIALLY_APPLIED", to: "REVERSED", trigger: "reverse" },
      { from: "FULLY_APPLIED", to: "REVERSED", trigger: "reverse" },
      { from: "REFUND_DUE", to: "REVERSED", trigger: "reverse" },
      { from: "REFUNDED", to: "REVERSED", trigger: "reverse" },
    ],
  },
  {
    entity: "CreditNoteApplication",
    tableName: "bus_credit_note_application",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["REVERSED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "REVERSED", trigger: "reverse" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "TaxCode",
    tableName: "bus_tax_code",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "TaxJurisdiction",
    tableName: "bus_tax_jurisdiction",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "TaxRate",
    tableName: "bus_tax_rate",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "TaxRegistration",
    tableName: "bus_tax_registration",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "TaxRule",
    tableName: "bus_tax_rule",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["RETIRED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "DRAFT", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "TaxTransaction",
    tableName: "bus_tax_transaction",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "BillingCycle",
    tableName: "bus_billing_cycle",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Charge",
    tableName: "bus_charge",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Subscription",
    tableName: "bus_subscription",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "SubscriptionPlan",
    tableName: "bus_subscription_plan",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "UsageRecord",
    tableName: "bus_usage_record",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "BankAccount",
    tableName: "bus_bank_account",
    statusField: "status",
    initial: "PENDING",
    terminal: ["CLOSED"],
    edges: [
      { from: "PENDING", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "CLOSED", trigger: "close" },
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
    ],
  },
  {
    entity: "Asset",
    tableName: "bus_asset",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["DISPOSED", "RETIRED"],
    edges: [
      { from: "PLANNED", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "UNDER_MAINTENANCE", trigger: "mark_under_maintenance" },
      { from: "UNDER_MAINTENANCE", to: "ACTIVE", trigger: "return_to_service" },
      { from: "ACTIVE", to: "HELD", trigger: "mark_held" },
      { from: "HELD", to: "ACTIVE", trigger: "resume" },
      { from: "ACTIVE", to: "DISPOSED", trigger: "mark_disposed" },
      { from: "UNDER_MAINTENANCE", to: "DISPOSED", trigger: "mark_disposed" },
      { from: "HELD", to: "DISPOSED", trigger: "mark_disposed" },
      { from: "PLANNED", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "UNDER_MAINTENANCE", to: "RETIRED", trigger: "retire" },
      { from: "HELD", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Product",
    tableName: "bus_product",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["DISCONTINUED", "RETIRED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
      { from: "DRAFT", to: "DISCONTINUED", trigger: "discontinue" },
      { from: "ACTIVE", to: "DISCONTINUED", trigger: "discontinue" },
      { from: "BLOCKED", to: "DISCONTINUED", trigger: "discontinue" },
      { from: "DRAFT", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "BLOCKED", to: "RETIRED", trigger: "retire" },
    ],
  },
];

/** The state machine declared for a table, if the model declared one. */
export function stateMachineFor(tableName: string): StateMachine | undefined {
  return stateMachines.find((machine) => machine.tableName === tableName);
}

/** Every state either end of an edge names, plus the initial state. */
export function statesOf(machine: StateMachine): string[] {
  const seen = new Set<string>();
  if (machine.initial) seen.add(machine.initial);
  for (const edge of machine.edges) {
    seen.add(edge.from);
    seen.add(edge.to);
  }
  return [...seen];
}

/** The states reachable from `from` in one step. */
export function successorsOf(machine: StateMachine, from: string): string[] {
  return machine.edges.filter((edge) => edge.from === from).map((edge) => edge.to);
}

/**
 * A state the model does *not* allow moving to from `from`, or null when the
 * machine allows every state from there and there is nothing illegal to try.
 */
export function illegalTargetFrom(machine: StateMachine, from: string): string | null {
  const allowed = new Set(successorsOf(machine, from));
  allowed.add(from);
  return statesOf(machine).find((state) => !allowed.has(state)) ?? null;
}

/**
 * A shortest path of edges from the machine's initial state to `target`,
 * or null when no path exists. Breadth-first, so a suite walking a record into
 * a given state takes the fewest writes that get it there.
 */
export function pathTo(machine: StateMachine, target: string): StateEdge[] | null {
  if (!machine.initial) return null;
  if (machine.initial === target) return [];

  const queue: Array<{ state: string; path: StateEdge[] }> = [
    { state: machine.initial, path: [] },
  ];
  const seen = new Set<string>([machine.initial]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const edge of machine.edges) {
      if (edge.from !== current.state || seen.has(edge.to)) continue;
      const path = [...current.path, edge];
      if (edge.to === target) return path;
      seen.add(edge.to);
      queue.push({ state: edge.to, path });
    }
  }
  return null;
}
