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
 * Generated: 2026-10-01T05:17:55.366Z
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
    name: "ChargeStatus",
    referenceId: 1010,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "CreditNoteApplicationStatus",
    referenceId: 1011,
    values: ["DRAFT", "ACTIVE", "REVERSED", "CANCELLED"],
  },
  {
    name: "CreditNoteStatus",
    referenceId: 1012,
    values: ["DRAFT", "APPROVED", "POSTED", "PARTIALLY_APPLIED", "FULLY_APPLIED", "REFUND_DUE", "REFUNDED", "CANCELLED", "REVERSED"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1013,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "CustomerCreditStatus",
    referenceId: 1014,
    values: ["NOT_REVIEWED", "APPROVED", "ON_HOLD", "BLOCKED"],
  },
  {
    name: "CustomerCustomerType",
    referenceId: 1015,
    values: ["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "INTERNAL", "OTHER"],
  },
  {
    name: "CustomerRoleType",
    referenceId: 1016,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "CustomerStatus",
    referenceId: 1017,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1018,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1019,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "FiscalPeriodStatus",
    referenceId: 1020,
    values: ["FUTURE", "OPEN", "SOFT_CLOSED", "CLOSED", "LOCKED"],
  },
  {
    name: "InvoiceInvoiceType",
    referenceId: 1021,
    values: ["SALES", "PURCHASE", "CREDIT_NOTE", "DEBIT_NOTE"],
  },
  {
    name: "InvoiceLineMatchingStatus",
    referenceId: 1022,
    values: ["NOT_APPLICABLE", "UNMATCHED", "MATCHED", "PARTIALLY_MATCHED", "EXCEPTION", "WAIVED"],
  },
  {
    name: "InvoiceStatus",
    referenceId: 1023,
    values: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "VOID"],
  },
  {
    name: "JournalEntryStatus",
    referenceId: 1024,
    values: ["DRAFT", "POSTED", "REVERSED"],
  },
  {
    name: "LedgerStatus",
    referenceId: 1025,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1026,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1027,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "OrganizationOrganizationType",
    referenceId: 1028,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1029,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1030,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1031,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1032,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1033,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1034,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PaymentAllocationStatus",
    referenceId: 1035,
    values: ["DRAFT", "ACTIVE", "REVERSED", "CANCELLED"],
  },
  {
    name: "PaymentDirection",
    referenceId: 1036,
    values: ["RECEIPT", "DISBURSEMENT"],
  },
  {
    name: "PaymentInstructionStatus",
    referenceId: 1037,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "PaymentPaymentMethod",
    referenceId: 1038,
    values: ["CASH", "BANK_TRANSFER", "CARD", "CHEQUE", "DIRECT_DEBIT", "OTHER"],
  },
  {
    name: "PaymentStatus",
    referenceId: 1039,
    values: ["DRAFT", "APPROVED", "POSTED", "CLEARED", "VOID", "REVERSED"],
  },
  {
    name: "PersonGender",
    referenceId: 1040,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1041,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1042,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "ProductProductType",
    referenceId: 1043,
    values: ["GOOD", "MATERIAL", "SERVICE", "SUBSCRIPTION", "ASSET", "BUNDLE", "OTHER"],
  },
  {
    name: "ProductStatus",
    referenceId: 1044,
    values: ["DRAFT", "ACTIVE", "DISCONTINUED", "BLOCKED", "RETIRED"],
  },
  {
    name: "PurchaseOrderLinePriceSource",
    referenceId: 1045,
    values: ["PRICE_LIST", "CONTRACT", "SUPPLIER_AGREEMENT", "QUOTATION", "MANUAL", "OTHER"],
  },
  {
    name: "PurchaseOrderStatus",
    referenceId: 1046,
    values: ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED", "CLOSED"],
  },
  {
    name: "SalesOrderLinePriceSource",
    referenceId: 1047,
    values: ["PRICE_LIST", "CONTRACT", "CUSTOMER_AGREEMENT", "QUOTATION", "MANUAL", "PROMOTION", "OTHER"],
  },
  {
    name: "SalesOrderStatus",
    referenceId: 1048,
    values: ["DRAFT", "CONFIRMED", "ALLOCATED", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED"],
  },
  {
    name: "ScenarioStatus",
    referenceId: 1049,
    values: ["DRAFT", "ACTIVE", "ARCHIVED"],
  },
  {
    name: "SubscriptionPlanStatus",
    referenceId: 1050,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "SubscriptionStatus",
    referenceId: 1051,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "SupplierQualificationStatus",
    referenceId: 1052,
    values: ["NOT_REVIEWED", "PENDING", "QUALIFIED", "SUSPENDED", "DISQUALIFIED"],
  },
  {
    name: "SupplierRoleType",
    referenceId: 1053,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "SupplierStatus",
    referenceId: 1054,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "SupplierSupplierType",
    referenceId: 1055,
    values: ["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "INTERNAL", "OTHER"],
  },
  {
    name: "TaxCodeStatus",
    referenceId: 1056,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "TaxJurisdictionStatus",
    referenceId: 1057,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "TaxRateStatus",
    referenceId: 1058,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "TaxRegistrationStatus",
    referenceId: 1059,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "TaxRuleStatus",
    referenceId: 1060,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "TaxRuleTaxType",
    referenceId: 1061,
    values: ["SALES", "VAT", "GST", "USE", "WITHHOLDING", "OTHER"],
  },
  {
    name: "TaxTransactionStatus",
    referenceId: 1062,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1063,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1064,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "UsageRecordStatus",
    referenceId: 1065,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
];

export const stateMachines: StateMachine[] = [
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
