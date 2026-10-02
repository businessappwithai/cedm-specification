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
 * Generated: 2026-10-02T10:14:19.943Z
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
    name: "TaskPriority",
    referenceId: 1046,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1047,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1048,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1049,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1050,
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
    entity: "PurchaseRequisition",
    tableName: "bus_purchase_requisition",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["CLOSED", "REJECTED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "SUBMITTED", trigger: "submit" },
      { from: "SUBMITTED", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "ORDERED", trigger: "mark_ordered" },
      { from: "ORDERED", to: "CLOSED", trigger: "close" },
      { from: "DRAFT", to: "REJECTED", trigger: "reject" },
      { from: "SUBMITTED", to: "REJECTED", trigger: "reject" },
      { from: "APPROVED", to: "REJECTED", trigger: "reject" },
      { from: "ORDERED", to: "REJECTED", trigger: "reject" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "SUBMITTED", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
      { from: "ORDERED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "RequestForQuotation",
    tableName: "bus_request_for_quotation",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["AWARDED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "ISSUED", trigger: "issue" },
      { from: "ISSUED", to: "CLOSED", trigger: "close" },
      { from: "CLOSED", to: "AWARDED", trigger: "mark_awarded" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "ISSUED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "SupplierQuotation",
    tableName: "bus_supplier_quotation",
    statusField: "status",
    initial: "RECEIVED",
    terminal: ["REJECTED", "EXPIRED", "WITHDRAWN"],
    edges: [
      { from: "RECEIVED", to: "UNDER_REVIEW", trigger: "review" },
      { from: "UNDER_REVIEW", to: "ACCEPTED", trigger: "accept" },
      { from: "RECEIVED", to: "REJECTED", trigger: "reject" },
      { from: "UNDER_REVIEW", to: "REJECTED", trigger: "reject" },
      { from: "ACCEPTED", to: "REJECTED", trigger: "reject" },
      { from: "UNDER_REVIEW", to: "EXPIRED", trigger: "expire" },
      { from: "ACCEPTED", to: "EXPIRED", trigger: "expire" },
      { from: "RECEIVED", to: "WITHDRAWN", trigger: "withdraw" },
      { from: "UNDER_REVIEW", to: "WITHDRAWN", trigger: "withdraw" },
      { from: "ACCEPTED", to: "WITHDRAWN", trigger: "withdraw" },
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
    entity: "GoodsReceipt",
    tableName: "bus_goods_receipt",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["REJECTED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "RECEIVED", trigger: "receive" },
      { from: "RECEIVED", to: "ACCEPTED", trigger: "accept" },
      { from: "ACCEPTED", to: "PARTIALLY_ACCEPTED", trigger: "mark_partially_accepted" },
      { from: "RECEIVED", to: "INSPECTION_PENDING", trigger: "mark_inspection_pending" },
      { from: "INSPECTION_PENDING", to: "RECEIVED", trigger: "resume" },
      { from: "ACCEPTED", to: "INSPECTION_PENDING", trigger: "mark_inspection_pending" },
      { from: "INSPECTION_PENDING", to: "ACCEPTED", trigger: "resume" },
      { from: "PARTIALLY_ACCEPTED", to: "INSPECTION_PENDING", trigger: "mark_inspection_pending" },
      { from: "INSPECTION_PENDING", to: "PARTIALLY_ACCEPTED", trigger: "resume" },
      { from: "DRAFT", to: "REJECTED", trigger: "reject" },
      { from: "RECEIVED", to: "REJECTED", trigger: "reject" },
      { from: "ACCEPTED", to: "REJECTED", trigger: "reject" },
      { from: "PARTIALLY_ACCEPTED", to: "REJECTED", trigger: "reject" },
      { from: "INSPECTION_PENDING", to: "REJECTED", trigger: "reject" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "RECEIVED", to: "CANCELLED", trigger: "cancel" },
      { from: "ACCEPTED", to: "CANCELLED", trigger: "cancel" },
      { from: "PARTIALLY_ACCEPTED", to: "CANCELLED", trigger: "cancel" },
      { from: "INSPECTION_PENDING", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "SupplierClaim",
    tableName: "bus_supplier_claim",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["CLOSED", "REJECTED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "OPEN", trigger: "open" },
      { from: "OPEN", to: "UNDER_REVIEW", trigger: "review" },
      { from: "UNDER_REVIEW", to: "ACCEPTED", trigger: "accept" },
      { from: "ACCEPTED", to: "PARTIALLY_ACCEPTED", trigger: "mark_partially_accepted" },
      { from: "PARTIALLY_ACCEPTED", to: "ESCALATED", trigger: "mark_escalated" },
      { from: "ESCALATED", to: "RESOLVED", trigger: "resolve" },
      { from: "RESOLVED", to: "CLOSED", trigger: "close" },
      { from: "DRAFT", to: "REJECTED", trigger: "reject" },
      { from: "OPEN", to: "REJECTED", trigger: "reject" },
      { from: "UNDER_REVIEW", to: "REJECTED", trigger: "reject" },
      { from: "ACCEPTED", to: "REJECTED", trigger: "reject" },
      { from: "PARTIALLY_ACCEPTED", to: "REJECTED", trigger: "reject" },
      { from: "ESCALATED", to: "REJECTED", trigger: "reject" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "OPEN", to: "CANCELLED", trigger: "cancel" },
      { from: "UNDER_REVIEW", to: "CANCELLED", trigger: "cancel" },
      { from: "ACCEPTED", to: "CANCELLED", trigger: "cancel" },
      { from: "PARTIALLY_ACCEPTED", to: "CANCELLED", trigger: "cancel" },
      { from: "ESCALATED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "SupplierClaimResolution",
    tableName: "bus_supplier_claim_resolution",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["EXECUTED", "FAILED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "IN_EXECUTION", trigger: "mark_in_execution" },
      { from: "IN_EXECUTION", to: "PARTIALLY_EXECUTED", trigger: "mark_partially_executed" },
      { from: "PARTIALLY_EXECUTED", to: "EXECUTED", trigger: "mark_executed" },
      { from: "APPROVED", to: "FAILED", trigger: "fail" },
      { from: "IN_EXECUTION", to: "FAILED", trigger: "fail" },
      { from: "PARTIALLY_EXECUTED", to: "FAILED", trigger: "fail" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_EXECUTION", to: "CANCELLED", trigger: "cancel" },
      { from: "PARTIALLY_EXECUTED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "SupplierCreditNote",
    tableName: "bus_supplier_credit_note",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["FULLY_APPLIED", "CANCELLED", "REVERSED"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "POSTED", trigger: "post" },
      { from: "POSTED", to: "PARTIALLY_APPLIED", trigger: "mark_partially_applied" },
      { from: "PARTIALLY_APPLIED", to: "FULLY_APPLIED", trigger: "mark_fully_applied" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
      { from: "POSTED", to: "CANCELLED", trigger: "cancel" },
      { from: "PARTIALLY_APPLIED", to: "CANCELLED", trigger: "cancel" },
      { from: "PARTIALLY_APPLIED", to: "REVERSED", trigger: "reverse" },
    ],
  },
  {
    entity: "SupplierCreditNoteApplication",
    tableName: "bus_supplier_credit_note_application",
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
    entity: "SupplierDebitNote",
    tableName: "bus_supplier_debit_note",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["FULLY_APPLIED", "CANCELLED", "REVERSED"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "POSTED", trigger: "post" },
      { from: "POSTED", to: "PARTIALLY_APPLIED", trigger: "mark_partially_applied" },
      { from: "PARTIALLY_APPLIED", to: "DISPUTED", trigger: "mark_disputed" },
      { from: "DISPUTED", to: "FULLY_APPLIED", trigger: "mark_fully_applied" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
      { from: "POSTED", to: "CANCELLED", trigger: "cancel" },
      { from: "PARTIALLY_APPLIED", to: "CANCELLED", trigger: "cancel" },
      { from: "DISPUTED", to: "CANCELLED", trigger: "cancel" },
      { from: "DISPUTED", to: "REVERSED", trigger: "reverse" },
    ],
  },
  {
    entity: "SupplierDebitNoteApplication",
    tableName: "bus_supplier_debit_note_application",
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
    entity: "SupplierPerformanceAssessment",
    tableName: "bus_supplier_performance_assessment",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["SUPERSEDED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "IN_REVIEW", trigger: "mark_in_review" },
      { from: "IN_REVIEW", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "PUBLISHED", trigger: "publish" },
      { from: "DRAFT", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "IN_REVIEW", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "APPROVED", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "PUBLISHED", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_REVIEW", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
      { from: "PUBLISHED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "SupplierReturn",
    tableName: "bus_supplier_return",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "AUTHORIZED", trigger: "authorize" },
      { from: "AUTHORIZED", to: "IN_TRANSIT", trigger: "mark_in_transit" },
      { from: "IN_TRANSIT", to: "RECEIVED_BY_SUPPLIER", trigger: "mark_received_by_supplier" },
      { from: "RECEIVED_BY_SUPPLIER", to: "COMPLETED", trigger: "complete" },
      { from: "AUTHORIZED", to: "EXCEPTION", trigger: "mark_exception" },
      { from: "EXCEPTION", to: "AUTHORIZED", trigger: "resolve_exception" },
      { from: "IN_TRANSIT", to: "EXCEPTION", trigger: "mark_exception" },
      { from: "EXCEPTION", to: "IN_TRANSIT", trigger: "resolve_exception" },
      { from: "RECEIVED_BY_SUPPLIER", to: "EXCEPTION", trigger: "mark_exception" },
      { from: "EXCEPTION", to: "RECEIVED_BY_SUPPLIER", trigger: "resolve_exception" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "AUTHORIZED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_TRANSIT", to: "CANCELLED", trigger: "cancel" },
      { from: "RECEIVED_BY_SUPPLIER", to: "CANCELLED", trigger: "cancel" },
      { from: "EXCEPTION", to: "CANCELLED", trigger: "cancel" },
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
