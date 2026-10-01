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
 * Generated: 2026-10-01T05:18:51.990Z
 * Project: procurement
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
    name: "CurrencyStatus",
    referenceId: 1002,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1003,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1004,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "GoodsReceiptStatus",
    referenceId: 1005,
    values: ["DRAFT", "RECEIVED", "INSPECTION_PENDING", "ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED", "CANCELLED"],
  },
  {
    name: "InvoiceInvoiceType",
    referenceId: 1006,
    values: ["SALES", "PURCHASE", "CREDIT_NOTE", "DEBIT_NOTE"],
  },
  {
    name: "InvoiceLineMatchingStatus",
    referenceId: 1007,
    values: ["NOT_APPLICABLE", "UNMATCHED", "MATCHED", "PARTIALLY_MATCHED", "EXCEPTION", "WAIVED"],
  },
  {
    name: "InvoiceStatus",
    referenceId: 1008,
    values: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "VOID"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1009,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1010,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "OrganizationOrganizationType",
    referenceId: 1011,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1012,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1013,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1014,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1015,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1016,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1017,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1018,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1019,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1020,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "ProductProductType",
    referenceId: 1021,
    values: ["GOOD", "MATERIAL", "SERVICE", "SUBSCRIPTION", "ASSET", "BUNDLE", "OTHER"],
  },
  {
    name: "ProductStatus",
    referenceId: 1022,
    values: ["DRAFT", "ACTIVE", "DISCONTINUED", "BLOCKED", "RETIRED"],
  },
  {
    name: "PurchaseOrderLinePriceSource",
    referenceId: 1023,
    values: ["PRICE_LIST", "CONTRACT", "SUPPLIER_AGREEMENT", "QUOTATION", "MANUAL", "OTHER"],
  },
  {
    name: "PurchaseOrderStatus",
    referenceId: 1024,
    values: ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED", "CLOSED"],
  },
  {
    name: "PurchaseRequisitionStatus",
    referenceId: 1025,
    values: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ORDERED", "CLOSED", "CANCELLED"],
  },
  {
    name: "RequestForQuotationStatus",
    referenceId: 1026,
    values: ["DRAFT", "ISSUED", "CLOSED", "AWARDED", "CANCELLED"],
  },
  {
    name: "SupplierClaimClaimType",
    referenceId: 1027,
    values: ["QUALITY", "DAMAGE", "SHORTAGE", "OVERAGE", "WRONG_ITEM", "WARRANTY", "SERVICE", "COMMERCIAL", "DELIVERY", "DOCUMENTATION", "OTHER"],
  },
  {
    name: "SupplierClaimResolutionCode",
    referenceId: 1028,
    values: ["NO_ACTION", "REPLACEMENT", "REPAIR", "RETURN", "CREDIT", "DEBIT_ADJUSTMENT", "PRICE_ADJUSTMENT", "ACCEPTED_EXCEPTION", "REJECTED"],
  },
  {
    name: "SupplierClaimResolutionResolutionType",
    referenceId: 1029,
    values: ["NO_ACTION", "REPLACEMENT", "REPAIR", "RETURN", "CREDIT", "DEBIT_ADJUSTMENT", "PRICE_ADJUSTMENT", "CASH_RECOVERY", "ACCEPTED_EXCEPTION"],
  },
  {
    name: "SupplierClaimResolutionStatus",
    referenceId: 1030,
    values: ["DRAFT", "APPROVED", "IN_EXECUTION", "PARTIALLY_EXECUTED", "EXECUTED", "FAILED", "CANCELLED"],
  },
  {
    name: "SupplierClaimStatus",
    referenceId: 1031,
    values: ["DRAFT", "OPEN", "UNDER_REVIEW", "ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED", "RESOLVED", "CLOSED", "CANCELLED", "ESCALATED"],
  },
  {
    name: "SupplierCreditNoteApplicationStatus",
    referenceId: 1032,
    values: ["DRAFT", "ACTIVE", "REVERSED", "CANCELLED"],
  },
  {
    name: "SupplierCreditNoteStatus",
    referenceId: 1033,
    values: ["DRAFT", "APPROVED", "POSTED", "PARTIALLY_APPLIED", "FULLY_APPLIED", "CANCELLED", "REVERSED"],
  },
  {
    name: "SupplierDebitNoteApplicationStatus",
    referenceId: 1034,
    values: ["DRAFT", "ACTIVE", "REVERSED", "CANCELLED"],
  },
  {
    name: "SupplierDebitNoteStatus",
    referenceId: 1035,
    values: ["DRAFT", "APPROVED", "POSTED", "PARTIALLY_APPLIED", "FULLY_APPLIED", "DISPUTED", "CANCELLED", "REVERSED"],
  },
  {
    name: "SupplierPerformanceAssessmentRating",
    referenceId: 1036,
    values: ["EXCELLENT", "GOOD", "ACCEPTABLE", "NEEDS_IMPROVEMENT", "UNSATISFACTORY"],
  },
  {
    name: "SupplierPerformanceAssessmentStatus",
    referenceId: 1037,
    values: ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "SUPERSEDED", "CANCELLED"],
  },
  {
    name: "SupplierQualificationStatus",
    referenceId: 1038,
    values: ["NOT_REVIEWED", "PENDING", "QUALIFIED", "SUSPENDED", "DISQUALIFIED"],
  },
  {
    name: "SupplierQuotationLineAwardStatus",
    referenceId: 1039,
    values: ["PENDING", "ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED"],
  },
  {
    name: "SupplierQuotationStatus",
    referenceId: 1040,
    values: ["RECEIVED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "EXPIRED", "WITHDRAWN"],
  },
  {
    name: "SupplierReturnLineDisposition",
    referenceId: 1041,
    values: ["RETURN_TO_SUPPLIER", "REJECTED", "EXCEPTION"],
  },
  {
    name: "SupplierReturnStatus",
    referenceId: 1042,
    values: ["DRAFT", "AUTHORIZED", "IN_TRANSIT", "RECEIVED_BY_SUPPLIER", "COMPLETED", "CANCELLED", "EXCEPTION"],
  },
  {
    name: "SupplierRoleType",
    referenceId: 1043,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "SupplierStatus",
    referenceId: 1044,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "SupplierSupplierType",
    referenceId: 1045,
    values: ["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "INTERNAL", "OTHER"],
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
