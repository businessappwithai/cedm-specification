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
 * Generated: 2026-10-16T07:47:18.718Z
 * Project: legal
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
    name: "AgreementAgreementType",
    referenceId: 1002,
    values: ["SERVICE", "SUPPLY", "LICENSE", "PARTNERSHIP", "NON_DISCLOSURE", "OTHER"],
  },
  {
    name: "AgreementStatus",
    referenceId: 1003,
    values: ["DRAFT", "IN_NEGOTIATION", "SIGNED", "IN_FORCE", "EXPIRED", "TERMINATED", "CANCELLED"],
  },
  {
    name: "AttachmentStatus",
    referenceId: 1004,
    values: ["ACTIVE", "WITHDRAWN"],
  },
  {
    name: "BusinessUnitStatus",
    referenceId: 1005,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "CalendarExceptionExceptionType",
    referenceId: 1006,
    values: ["PUBLIC_HOLIDAY", "COMPANY_CLOSURE", "EXTRA_WORKING_DAY"],
  },
  {
    name: "CalendarStatus",
    referenceId: 1007,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "ContactPointChannel",
    referenceId: 1008,
    values: ["EMAIL", "PHONE", "MOBILE", "FAX", "WEBSITE", "MESSAGING"],
  },
  {
    name: "ContactPointPurpose",
    referenceId: 1009,
    values: ["GENERAL", "BILLING", "ORDERS", "DELIVERY", "SUPPORT", "MARKETING"],
  },
  {
    name: "ContactPointStatus",
    referenceId: 1010,
    values: ["ACTIVE", "INACTIVE", "INVALID"],
  },
  {
    name: "ContractAmendmentAmendmentType",
    referenceId: 1011,
    values: ["PRICE", "SCOPE", "TERM", "PARTIES", "TERMS"],
  },
  {
    name: "ContractAmendmentStatus",
    referenceId: 1012,
    values: ["DRAFT", "APPROVED", "SIGNED", "EFFECTIVE", "REJECTED", "CANCELLED"],
  },
  {
    name: "ContractClauseCategory",
    referenceId: 1013,
    values: ["LIABILITY", "INDEMNITY", "TERMINATION", "CONFIDENTIALITY", "DATA_PROTECTION", "PAYMENT", "WARRANTY", "GOVERNING_LAW", "INTELLECTUAL_PROPERTY", "OTHER"],
  },
  {
    name: "ContractObligationObligationType",
    referenceId: 1014,
    values: ["DELIVERY", "PAYMENT", "SERVICE", "REPORTING", "COMPLIANCE", "PERFORMANCE", "OTHER"],
  },
  {
    name: "ContractObligationStatus",
    referenceId: 1015,
    values: ["OPEN", "IN_PROGRESS", "FULFILLED", "BREACHED", "WAIVED", "CANCELLED"],
  },
  {
    name: "ContractRenewalRenewalType",
    referenceId: 1016,
    values: ["AUTOMATIC", "NEGOTIATED", "OPTION"],
  },
  {
    name: "ContractRenewalStatus",
    referenceId: 1017,
    values: ["UNDER_REVIEW", "CONFIRMED", "DECLINED"],
  },
  {
    name: "ContractStatus",
    referenceId: 1018,
    values: ["DRAFT", "NEGOTIATION", "APPROVAL", "ACTIVE", "SUSPENDED", "EXPIRED", "TERMINATED", "CANCELLED"],
  },
  {
    name: "ContractTerminationGround",
    referenceId: 1019,
    values: ["CONVENIENCE", "BREACH", "INSOLVENCY", "EXPIRY", "MUTUAL_AGREEMENT", "FORCE_MAJEURE"],
  },
  {
    name: "ContractTerminationInitiatedBy",
    referenceId: 1020,
    values: ["US", "COUNTERPARTY", "MUTUAL"],
  },
  {
    name: "ContractTerminationStatus",
    referenceId: 1021,
    values: ["NOTIFIED", "EFFECTIVE", "COMPLETED", "WITHDRAWN"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1022,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "DepartmentStatus",
    referenceId: 1023,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1024,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1025,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "LanguageDirection",
    referenceId: 1026,
    values: ["LTR", "RTL"],
  },
  {
    name: "LegalCaseForumType",
    referenceId: 1027,
    values: ["COURT", "TRIBUNAL", "ARBITRATION", "REGULATORY_AUTHORITY"],
  },
  {
    name: "LegalCaseOurRole",
    referenceId: 1028,
    values: ["CLAIMANT", "DEFENDANT", "THIRD_PARTY", "INTERVENER"],
  },
  {
    name: "LegalCaseStatus",
    referenceId: 1029,
    values: ["FILED", "PENDING", "DECIDED", "SETTLED", "APPEALED", "CLOSED", "WITHDRAWN"],
  },
  {
    name: "LegalEntityStatus",
    referenceId: 1030,
    values: ["ACTIVE", "DORMANT", "IN_LIQUIDATION", "DISSOLVED"],
  },
  {
    name: "LegalMatterMatterType",
    referenceId: 1031,
    values: ["ADVISORY", "CONTRACT", "LITIGATION", "ARBITRATION", "REGULATORY", "CORPORATE", "EMPLOYMENT", "INTELLECTUAL_PROPERTY"],
  },
  {
    name: "LegalMatterOutcomeLikelihood",
    referenceId: 1032,
    values: ["REMOTE", "POSSIBLE", "PROBABLE"],
  },
  {
    name: "LegalMatterStatus",
    referenceId: 1033,
    values: ["OPEN", "ON_HOLD", "CLOSED"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1034,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1035,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "OrganizationOrganizationType",
    referenceId: 1036,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1037,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1038,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1039,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRelationshipRelationshipType",
    referenceId: 1040,
    values: ["SUBSIDIARY_OF", "BRANCH_OF", "EMPLOYEE_OF", "AGENT_OF", "GUARANTOR_FOR", "BENEFICIAL_OWNER_OF", "HOUSEHOLD_MEMBER_OF", "OTHER"],
  },
  {
    name: "PartyRelationshipStatus",
    referenceId: 1041,
    values: ["ACTIVE", "ENDED"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1042,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1043,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1044,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1045,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1046,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1047,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "RenewalStatus",
    referenceId: 1048,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "TaskPriority",
    referenceId: 1049,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1050,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1051,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
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
  {
    entity: "ContractObligation",
    tableName: "bus_contract_obligation",
    statusField: "status",
    initial: "OPEN",
    terminal: ["FULFILLED", "BREACHED", "WAIVED", "CANCELLED"],
    edges: [
      { from: "OPEN", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "FULFILLED", trigger: "fulfil" },
      { from: "IN_PROGRESS", to: "BREACHED", trigger: "mark_breached" },
      { from: "OPEN", to: "WAIVED", trigger: "mark_waived" },
      { from: "IN_PROGRESS", to: "WAIVED", trigger: "mark_waived" },
      { from: "OPEN", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Agreement",
    tableName: "bus_agreement",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["EXPIRED", "TERMINATED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "IN_NEGOTIATION", trigger: "send" },
      { from: "IN_NEGOTIATION", to: "DRAFT", trigger: "revise" },
      { from: "IN_NEGOTIATION", to: "SIGNED", trigger: "sign" },
      { from: "DRAFT", to: "SIGNED", trigger: "sign" },
      { from: "SIGNED", to: "IN_FORCE", trigger: "take_effect" },
      { from: "IN_FORCE", to: "EXPIRED", trigger: "expire" },
      { from: "IN_FORCE", to: "TERMINATED", trigger: "terminate" },
      { from: "SIGNED", to: "TERMINATED", trigger: "terminate" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_NEGOTIATION", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "ContractAmendment",
    tableName: "bus_contract_amendment",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["EFFECTIVE", "REJECTED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "SIGNED", trigger: "sign" },
      { from: "SIGNED", to: "EFFECTIVE", trigger: "take_effect" },
      { from: "APPROVED", to: "REJECTED", trigger: "reject" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "ContractRenewal",
    tableName: "bus_contract_renewal",
    statusField: "status",
    initial: "UNDER_REVIEW",
    terminal: ["CONFIRMED", "DECLINED"],
    edges: [
      { from: "UNDER_REVIEW", to: "CONFIRMED", trigger: "confirm" },
      { from: "UNDER_REVIEW", to: "DECLINED", trigger: "decline" },
    ],
  },
  {
    entity: "ContractTermination",
    tableName: "bus_contract_termination",
    statusField: "status",
    initial: "NOTIFIED",
    terminal: ["COMPLETED", "WITHDRAWN"],
    edges: [
      { from: "NOTIFIED", to: "EFFECTIVE", trigger: "take_effect" },
      { from: "EFFECTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "NOTIFIED", to: "WITHDRAWN", trigger: "withdraw" },
    ],
  },
  {
    entity: "Renewal",
    tableName: "bus_renewal",
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
    entity: "LegalCase",
    tableName: "bus_legal_case",
    statusField: "status",
    initial: "FILED",
    terminal: ["CLOSED", "SETTLED", "WITHDRAWN"],
    edges: [
      { from: "FILED", to: "PENDING", trigger: "proceed" },
      { from: "PENDING", to: "DECIDED", trigger: "decide" },
      { from: "PENDING", to: "SETTLED", trigger: "settle" },
      { from: "FILED", to: "SETTLED", trigger: "settle" },
      { from: "DECIDED", to: "CLOSED", trigger: "close" },
      { from: "DECIDED", to: "APPEALED", trigger: "appeal" },
      { from: "APPEALED", to: "CLOSED", trigger: "close" },
      { from: "APPEALED", to: "SETTLED", trigger: "settle" },
      { from: "FILED", to: "WITHDRAWN", trigger: "withdraw" },
      { from: "PENDING", to: "WITHDRAWN", trigger: "withdraw" },
    ],
  },
  {
    entity: "LegalMatter",
    tableName: "bus_legal_matter",
    statusField: "status",
    initial: "OPEN",
    terminal: ["CLOSED"],
    edges: [
      { from: "OPEN", to: "ON_HOLD", trigger: "hold" },
      { from: "ON_HOLD", to: "OPEN", trigger: "resume" },
      { from: "OPEN", to: "CLOSED", trigger: "close" },
      { from: "ON_HOLD", to: "CLOSED", trigger: "close" },
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
