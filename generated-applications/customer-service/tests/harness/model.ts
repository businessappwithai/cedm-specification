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
 * Generated: 2026-10-16T07:45:54.689Z
 * Project: customer-service
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
    name: "AttachmentStatus",
    referenceId: 1002,
    values: ["ACTIVE", "WITHDRAWN"],
  },
  {
    name: "BusinessUnitStatus",
    referenceId: 1003,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "CalendarExceptionExceptionType",
    referenceId: 1004,
    values: ["PUBLIC_HOLIDAY", "COMPANY_CLOSURE", "EXTRA_WORKING_DAY"],
  },
  {
    name: "CalendarStatus",
    referenceId: 1005,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "ContactPointChannel",
    referenceId: 1006,
    values: ["EMAIL", "PHONE", "MOBILE", "FAX", "WEBSITE", "MESSAGING"],
  },
  {
    name: "ContactPointPurpose",
    referenceId: 1007,
    values: ["GENERAL", "BILLING", "ORDERS", "DELIVERY", "SUPPORT", "MARKETING"],
  },
  {
    name: "ContactPointStatus",
    referenceId: 1008,
    values: ["ACTIVE", "INACTIVE", "INVALID"],
  },
  {
    name: "ContractStatus",
    referenceId: 1009,
    values: ["DRAFT", "NEGOTIATION", "APPROVAL", "ACTIVE", "SUSPENDED", "EXPIRED", "TERMINATED", "CANCELLED"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1010,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "CustomerCreditStatus",
    referenceId: 1011,
    values: ["NOT_REVIEWED", "APPROVED", "ON_HOLD", "BLOCKED"],
  },
  {
    name: "CustomerCustomerType",
    referenceId: 1012,
    values: ["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "INTERNAL", "OTHER"],
  },
  {
    name: "CustomerRoleType",
    referenceId: 1013,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "CustomerStatus",
    referenceId: 1014,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "DepartmentStatus",
    referenceId: 1015,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "EntitlementStatus",
    referenceId: 1016,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "EXHAUSTED", "EXPIRED", "TERMINATED"],
  },
  {
    name: "EscalationReason",
    referenceId: 1017,
    values: ["SLA_BREACH", "DUE_DATE_PASSED", "CUSTOMER_REQUEST", "SEVERITY", "BLOCKED"],
  },
  {
    name: "EscalationStatus",
    referenceId: 1018,
    values: ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"],
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
    name: "IncidentCategory",
    referenceId: 1021,
    values: ["OPERATIONAL", "IT_OUTAGE", "SECURITY", "SAFETY", "ENVIRONMENTAL", "COMPLIANCE", "QUALITY"],
  },
  {
    name: "IncidentSeverity",
    referenceId: 1022,
    values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  },
  {
    name: "IncidentStatus",
    referenceId: 1023,
    values: ["REPORTED", "INVESTIGATING", "CONTAINED", "RESOLVED", "CLOSED", "INVALID"],
  },
  {
    name: "LanguageDirection",
    referenceId: 1024,
    values: ["LTR", "RTL"],
  },
  {
    name: "LegalEntityStatus",
    referenceId: 1025,
    values: ["ACTIVE", "DORMANT", "IN_LIQUIDATION", "DISSOLVED"],
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
    name: "PartyRelationshipRelationshipType",
    referenceId: 1032,
    values: ["SUBSIDIARY_OF", "BRANCH_OF", "EMPLOYEE_OF", "AGENT_OF", "GUARANTOR_FOR", "BENEFICIAL_OWNER_OF", "HOUSEHOLD_MEMBER_OF", "OTHER"],
  },
  {
    name: "PartyRelationshipStatus",
    referenceId: 1033,
    values: ["ACTIVE", "ENDED"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1034,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1035,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1036,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1037,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1038,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1039,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "ServiceCasePriority",
    referenceId: 1040,
    values: ["LOW", "NORMAL", "HIGH", "URGENT"],
  },
  {
    name: "ServiceCaseStatus",
    referenceId: 1041,
    values: ["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED", "CANCELLED"],
  },
  {
    name: "ServiceContractStatus",
    referenceId: 1042,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "EXPIRED", "TERMINATED"],
  },
  {
    name: "ServiceLevelAgreementStatus",
    referenceId: 1043,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"],
  },
  {
    name: "ServiceOrderStatus",
    referenceId: 1044,
    values: ["DRAFT", "APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  },
  {
    name: "ServiceRequestPriority",
    referenceId: 1045,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "ServiceRequestStatus",
    referenceId: 1046,
    values: ["OPEN", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"],
  },
  {
    name: "TaskPriority",
    referenceId: 1047,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1048,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1049,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
  },
  {
    name: "TicketPriority",
    referenceId: 1050,
    values: ["LOW", "NORMAL", "HIGH", "URGENT"],
  },
  {
    name: "TicketStatus",
    referenceId: 1051,
    values: ["NEW", "ASSIGNED", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED", "CANCELLED"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1052,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1053,
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
    entity: "PartyRelationship",
    tableName: "bus_party_relationship",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["ENDED"],
    edges: [
      { from: "ACTIVE", to: "ENDED", trigger: "end" },
    ],
  },
  {
    entity: "LegalEntity",
    tableName: "bus_legal_entity",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["DISSOLVED"],
    edges: [
      { from: "ACTIVE", to: "DORMANT", trigger: "make_dormant" },
      { from: "DORMANT", to: "ACTIVE", trigger: "resume_trading" },
      { from: "ACTIVE", to: "IN_LIQUIDATION", trigger: "liquidate" },
      { from: "DORMANT", to: "IN_LIQUIDATION", trigger: "liquidate" },
      { from: "IN_LIQUIDATION", to: "DISSOLVED", trigger: "dissolve" },
      { from: "DORMANT", to: "DISSOLVED", trigger: "dissolve" },
    ],
  },
  {
    entity: "BusinessUnit",
    tableName: "bus_business_unit",
    statusField: "status",
    initial: "ACTIVE",
    terminal: [],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
    ],
  },
  {
    entity: "Department",
    tableName: "bus_department",
    statusField: "status",
    initial: "ACTIVE",
    terminal: [],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
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
    entity: "ContactPoint",
    tableName: "bus_contact_point",
    statusField: "status",
    initial: "ACTIVE",
    terminal: [],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "INVALID", trigger: "mark_invalid" },
      { from: "INVALID", to: "ACTIVE", trigger: "reactivate" },
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
    entity: "Calendar",
    tableName: "bus_calendar",
    statusField: "status",
    initial: "ACTIVE",
    terminal: [],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
    ],
  },
  {
    entity: "Attachment",
    tableName: "bus_attachment",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["WITHDRAWN"],
    edges: [
      { from: "ACTIVE", to: "WITHDRAWN", trigger: "withdraw" },
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
    entity: "ServiceCase",
    tableName: "bus_service_case",
    statusField: "status",
    initial: "OPEN",
    terminal: ["CLOSED", "CANCELLED"],
    edges: [
      { from: "OPEN", to: "IN_PROGRESS", trigger: "start" },
      { from: "OPEN", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "PENDING", trigger: "pend" },
      { from: "PENDING", to: "IN_PROGRESS", trigger: "resume" },
      { from: "IN_PROGRESS", to: "RESOLVED", trigger: "resolve" },
      { from: "PENDING", to: "RESOLVED", trigger: "resolve" },
      { from: "RESOLVED", to: "CLOSED", trigger: "close" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
      { from: "PENDING", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "ServiceRequest",
    tableName: "bus_service_request",
    statusField: "status",
    initial: "OPEN",
    terminal: ["CLOSED", "CANCELLED"],
    edges: [
      { from: "OPEN", to: "TRIAGED", trigger: "mark_triaged" },
      { from: "TRIAGED", to: "ASSIGNED", trigger: "assign" },
      { from: "ASSIGNED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "RESOLVED", trigger: "resolve" },
      { from: "RESOLVED", to: "CLOSED", trigger: "close" },
      { from: "OPEN", to: "CANCELLED", trigger: "cancel" },
      { from: "TRIAGED", to: "CANCELLED", trigger: "cancel" },
      { from: "ASSIGNED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Ticket",
    tableName: "bus_ticket",
    statusField: "status",
    initial: "NEW",
    terminal: ["CLOSED", "CANCELLED"],
    edges: [
      { from: "NEW", to: "ASSIGNED", trigger: "assign" },
      { from: "NEW", to: "CANCELLED", trigger: "cancel" },
      { from: "ASSIGNED", to: "IN_PROGRESS", trigger: "start" },
      { from: "ASSIGNED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "PENDING", trigger: "pend" },
      { from: "PENDING", to: "IN_PROGRESS", trigger: "resume" },
      { from: "IN_PROGRESS", to: "RESOLVED", trigger: "resolve" },
      { from: "PENDING", to: "RESOLVED", trigger: "resolve" },
      { from: "RESOLVED", to: "CLOSED", trigger: "close" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
      { from: "PENDING", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "ServiceOrder",
    tableName: "bus_service_order",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "SCHEDULED", trigger: "schedule" },
      { from: "APPROVED", to: "IN_PROGRESS", trigger: "start" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
      { from: "SCHEDULED", to: "IN_PROGRESS", trigger: "start" },
      { from: "SCHEDULED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "COMPLETED", trigger: "complete" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "ServiceContract",
    tableName: "bus_service_contract",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["EXPIRED", "TERMINATED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "DRAFT", to: "TERMINATED", trigger: "terminate" },
      { from: "ACTIVE", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "ACTIVE", trigger: "resume" },
      { from: "ACTIVE", to: "EXPIRED", trigger: "expire" },
      { from: "SUSPENDED", to: "EXPIRED", trigger: "expire" },
      { from: "ACTIVE", to: "TERMINATED", trigger: "terminate" },
      { from: "SUSPENDED", to: "TERMINATED", trigger: "terminate" },
    ],
  },
  {
    entity: "Entitlement",
    tableName: "bus_entitlement",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["EXHAUSTED", "EXPIRED", "TERMINATED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "DRAFT", to: "TERMINATED", trigger: "terminate" },
      { from: "ACTIVE", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "ACTIVE", trigger: "resume" },
      { from: "ACTIVE", to: "EXHAUSTED", trigger: "exhaust" },
      { from: "ACTIVE", to: "EXPIRED", trigger: "expire" },
      { from: "SUSPENDED", to: "EXPIRED", trigger: "expire" },
      { from: "ACTIVE", to: "TERMINATED", trigger: "terminate" },
      { from: "SUSPENDED", to: "TERMINATED", trigger: "terminate" },
    ],
  },
  {
    entity: "ServiceLevelAgreement",
    tableName: "bus_service_level_agreement",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["RETIRED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "ACTIVE", trigger: "resume" },
      { from: "DRAFT", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "SUSPENDED", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Incident",
    tableName: "bus_incident",
    statusField: "status",
    initial: "REPORTED",
    terminal: ["CLOSED", "INVALID"],
    edges: [
      { from: "REPORTED", to: "INVESTIGATING", trigger: "triage" },
      { from: "INVESTIGATING", to: "CONTAINED", trigger: "contain" },
      { from: "CONTAINED", to: "RESOLVED", trigger: "resolve" },
      { from: "INVESTIGATING", to: "RESOLVED", trigger: "resolve" },
      { from: "RESOLVED", to: "CLOSED", trigger: "close" },
      { from: "RESOLVED", to: "INVESTIGATING", trigger: "reopen" },
      { from: "REPORTED", to: "INVALID", trigger: "reject" },
      { from: "INVESTIGATING", to: "INVALID", trigger: "reject" },
    ],
  },
  {
    entity: "Escalation",
    tableName: "bus_escalation",
    statusField: "status",
    initial: "PENDING",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "PENDING", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "PENDING", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Contract",
    tableName: "bus_contract",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["EXPIRED", "TERMINATED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "NEGOTIATION", trigger: "negotiate" },
      { from: "DRAFT", to: "APPROVAL", trigger: "submit_for_approval" },
      { from: "NEGOTIATION", to: "APPROVAL", trigger: "submit_for_approval" },
      { from: "APPROVAL", to: "NEGOTIATION", trigger: "return_to_negotiation" },
      { from: "APPROVAL", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "ACTIVE", trigger: "resume" },
      { from: "ACTIVE", to: "EXPIRED", trigger: "expire" },
      { from: "SUSPENDED", to: "EXPIRED", trigger: "expire" },
      { from: "ACTIVE", to: "TERMINATED", trigger: "terminate" },
      { from: "SUSPENDED", to: "TERMINATED", trigger: "terminate" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "NEGOTIATION", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVAL", to: "CANCELLED", trigger: "cancel" },
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
