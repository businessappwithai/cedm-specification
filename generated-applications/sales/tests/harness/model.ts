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
 * Generated: 2026-10-09T06:46:09.249Z
 * Project: sales
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
    name: "AddressAddressType",
    referenceId: 1000,
    values: ["RESIDENTIAL", "BUSINESS", "BILLING", "SHIPPING", "REGISTERED", "POSTAL", "OTHER"],
  },
  {
    name: "AddressStatus",
    referenceId: 1001,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "BrandStatus",
    referenceId: 1002,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1003,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "CustomerCreditStatus",
    referenceId: 1004,
    values: ["NOT_REVIEWED", "APPROVED", "ON_HOLD", "BLOCKED"],
  },
  {
    name: "CustomerCustomerType",
    referenceId: 1005,
    values: ["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "INTERNAL", "OTHER"],
  },
  {
    name: "CustomerReturnLineDisposition",
    referenceId: 1006,
    values: ["PENDING", "RESTOCK", "QUARANTINE", "REPAIR", "SCRAP", "MIXED"],
  },
  {
    name: "CustomerReturnStatus",
    referenceId: 1007,
    values: ["DRAFT", "AUTHORIZED", "IN_TRANSIT", "RECEIVED", "INSPECTION_PENDING", "DISPOSITIONED", "COMPLETED", "CANCELLED", "EXCEPTION"],
  },
  {
    name: "CustomerRoleType",
    referenceId: 1008,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "CustomerStatus",
    referenceId: 1009,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "DiscountRuleMethod",
    referenceId: 1010,
    values: ["PERCENTAGE", "FIXED_AMOUNT"],
  },
  {
    name: "DiscountRuleStatus",
    referenceId: 1011,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1012,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1013,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "LeadStatus",
    referenceId: 1014,
    values: ["NEW", "QUALIFYING", "QUALIFIED", "DISQUALIFIED", "CONVERTED", "LOST"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1015,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1016,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "OpportunityStage",
    referenceId: 1017,
    values: ["QUALIFICATION", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"],
  },
  {
    name: "OrganizationOrganizationType",
    referenceId: 1018,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1019,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1020,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1021,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1022,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1023,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1024,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PaymentTermDueDateBasis",
    referenceId: 1025,
    values: ["INVOICE_DATE", "DELIVERY_DATE", "RECEIPT_DATE", "MONTH_END", "CUSTOM"],
  },
  {
    name: "PaymentTermStatus",
    referenceId: 1026,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1027,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1028,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1029,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "ProductCategoryStatus",
    referenceId: 1030,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "ProductProductType",
    referenceId: 1031,
    values: ["GOOD", "MATERIAL", "SERVICE", "SUBSCRIPTION", "ASSET", "BUNDLE", "OTHER"],
  },
  {
    name: "ProductStatus",
    referenceId: 1032,
    values: ["DRAFT", "ACTIVE", "DISCONTINUED", "BLOCKED", "RETIRED"],
  },
  {
    name: "PurchaseOrderLinePriceSource",
    referenceId: 1033,
    values: ["PRICE_LIST", "CONTRACT", "SUPPLIER_AGREEMENT", "QUOTATION", "MANUAL", "OTHER"],
  },
  {
    name: "PurchaseOrderStatus",
    referenceId: 1034,
    values: ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED", "CLOSED"],
  },
  {
    name: "QuotationLinePriceSource",
    referenceId: 1035,
    values: ["PRICE_LIST", "CONTRACT", "CUSTOMER_AGREEMENT", "MANUAL", "PROMOTION", "OTHER"],
  },
  {
    name: "QuotationStatus",
    referenceId: 1036,
    values: ["DRAFT", "SUBMITTED", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
  },
  {
    name: "SalesOrderLinePriceSource",
    referenceId: 1037,
    values: ["PRICE_LIST", "CONTRACT", "CUSTOMER_AGREEMENT", "QUOTATION", "MANUAL", "PROMOTION", "OTHER"],
  },
  {
    name: "SalesOrderStatus",
    referenceId: 1038,
    values: ["DRAFT", "CONFIRMED", "ALLOCATED", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED"],
  },
  {
    name: "SupplierQualificationStatus",
    referenceId: 1039,
    values: ["NOT_REVIEWED", "PENDING", "QUALIFIED", "SUSPENDED", "DISQUALIFIED"],
  },
  {
    name: "SupplierRoleType",
    referenceId: 1040,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "SupplierStatus",
    referenceId: 1041,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "SupplierSupplierType",
    referenceId: 1042,
    values: ["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "INTERNAL", "OTHER"],
  },
  {
    name: "TaskPriority",
    referenceId: 1043,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1044,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1045,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1046,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1047,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
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
    entity: "Lead",
    tableName: "bus_lead",
    statusField: "status",
    initial: "NEW",
    terminal: ["DISQUALIFIED", "CONVERTED", "LOST"],
    edges: [
      { from: "NEW", to: "QUALIFYING", trigger: "start_qualifying" },
      { from: "NEW", to: "DISQUALIFIED", trigger: "disqualify" },
      { from: "NEW", to: "LOST", trigger: "mark_lost" },
      { from: "QUALIFYING", to: "QUALIFIED", trigger: "qualify" },
      { from: "QUALIFYING", to: "DISQUALIFIED", trigger: "disqualify" },
      { from: "QUALIFYING", to: "LOST", trigger: "mark_lost" },
      { from: "QUALIFIED", to: "CONVERTED", trigger: "convert" },
      { from: "QUALIFIED", to: "DISQUALIFIED", trigger: "disqualify" },
      { from: "QUALIFIED", to: "LOST", trigger: "mark_lost" },
    ],
  },
  {
    entity: "Opportunity",
    tableName: "bus_opportunity",
    statusField: "stage",
    initial: "QUALIFICATION",
    terminal: ["WON", "LOST"],
    edges: [
      { from: "QUALIFICATION", to: "DISCOVERY", trigger: "advance" },
      { from: "DISCOVERY", to: "PROPOSAL", trigger: "advance" },
      { from: "PROPOSAL", to: "NEGOTIATION", trigger: "advance" },
      { from: "NEGOTIATION", to: "PROPOSAL", trigger: "revise_proposal" },
      { from: "PROPOSAL", to: "WON", trigger: "win" },
      { from: "NEGOTIATION", to: "WON", trigger: "win" },
      { from: "QUALIFICATION", to: "LOST", trigger: "lose" },
      { from: "DISCOVERY", to: "LOST", trigger: "lose" },
      { from: "PROPOSAL", to: "LOST", trigger: "lose" },
      { from: "NEGOTIATION", to: "LOST", trigger: "lose" },
    ],
  },
  {
    entity: "Quotation",
    tableName: "bus_quotation",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "SUBMITTED", trigger: "submit" },
      { from: "SUBMITTED", to: "ACCEPTED", trigger: "accept" },
      { from: "SUBMITTED", to: "REJECTED", trigger: "reject" },
      { from: "SUBMITTED", to: "EXPIRED", trigger: "expire" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "SUBMITTED", to: "CANCELLED", trigger: "cancel" },
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
    entity: "PaymentTerm",
    tableName: "bus_payment_term",
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
    entity: "ProductCategory",
    tableName: "bus_product_category",
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
    entity: "DiscountRule",
    tableName: "bus_discount_rule",
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
    entity: "CustomerReturn",
    tableName: "bus_customer_return",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "AUTHORIZED", trigger: "authorize" },
      { from: "AUTHORIZED", to: "IN_TRANSIT", trigger: "ship_back" },
      { from: "IN_TRANSIT", to: "RECEIVED", trigger: "receive" },
      { from: "RECEIVED", to: "INSPECTION_PENDING", trigger: "send_to_inspection" },
      { from: "RECEIVED", to: "DISPOSITIONED", trigger: "disposition" },
      { from: "INSPECTION_PENDING", to: "DISPOSITIONED", trigger: "disposition" },
      { from: "DISPOSITIONED", to: "COMPLETED", trigger: "complete" },
      { from: "AUTHORIZED", to: "EXCEPTION", trigger: "raise_exception" },
      { from: "IN_TRANSIT", to: "EXCEPTION", trigger: "raise_exception" },
      { from: "RECEIVED", to: "EXCEPTION", trigger: "raise_exception" },
      { from: "INSPECTION_PENDING", to: "EXCEPTION", trigger: "raise_exception" },
      { from: "EXCEPTION", to: "AUTHORIZED", trigger: "resume" },
      { from: "EXCEPTION", to: "IN_TRANSIT", trigger: "resume" },
      { from: "EXCEPTION", to: "RECEIVED", trigger: "resume" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "AUTHORIZED", to: "CANCELLED", trigger: "cancel" },
      { from: "EXCEPTION", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Brand",
    tableName: "bus_brand",
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
