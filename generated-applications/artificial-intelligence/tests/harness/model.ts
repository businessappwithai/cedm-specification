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
 * Generated: 2026-10-16T07:45:14.845Z
 * Project: artificial-intelligence
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
    name: "AIEvaluationEvaluationType",
    referenceId: 1000,
    values: ["PERFORMANCE", "FAIRNESS", "ROBUSTNESS", "SAFETY", "DRIFT"],
  },
  {
    name: "AIEvaluationStatus",
    referenceId: 1001,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "AIModelModelType",
    referenceId: 1002,
    values: ["CLASSIFICATION", "REGRESSION", "FORECASTING", "RECOMMENDATION", "GENERATION", "EMBEDDING", "ANOMALY_DETECTION", "OTHER"],
  },
  {
    name: "AIModelRiskLevel",
    referenceId: 1003,
    values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  },
  {
    name: "AIModelStatus",
    referenceId: 1004,
    values: ["DRAFT", "TRAINING", "VALIDATION", "APPROVED", "DEPLOYED", "SUSPENDED", "RETIRED"],
  },
  {
    name: "AIPolicyRiskClass",
    referenceId: 1005,
    values: ["MINIMAL", "LIMITED", "HIGH", "PROHIBITED"],
  },
  {
    name: "AIPolicyStatus",
    referenceId: 1006,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "AIPredictionHumanReviewStatus",
    referenceId: 1007,
    values: ["NOT_REQUIRED", "PENDING", "ACCEPTED", "OVERRIDDEN", "REJECTED"],
  },
  {
    name: "AddressAddressType",
    referenceId: 1008,
    values: ["RESIDENTIAL", "BUSINESS", "BILLING", "SHIPPING", "REGISTERED", "POSTAL", "OTHER"],
  },
  {
    name: "AddressStatus",
    referenceId: 1009,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "AttachmentStatus",
    referenceId: 1010,
    values: ["ACTIVE", "WITHDRAWN"],
  },
  {
    name: "BusinessUnitStatus",
    referenceId: 1011,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "CalendarExceptionExceptionType",
    referenceId: 1012,
    values: ["PUBLIC_HOLIDAY", "COMPANY_CLOSURE", "EXTRA_WORKING_DAY"],
  },
  {
    name: "CalendarStatus",
    referenceId: 1013,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "ContactPointChannel",
    referenceId: 1014,
    values: ["EMAIL", "PHONE", "MOBILE", "FAX", "WEBSITE", "MESSAGING"],
  },
  {
    name: "ContactPointPurpose",
    referenceId: 1015,
    values: ["GENERAL", "BILLING", "ORDERS", "DELIVERY", "SUPPORT", "MARKETING"],
  },
  {
    name: "ContactPointStatus",
    referenceId: 1016,
    values: ["ACTIVE", "INACTIVE", "INVALID"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1017,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "DepartmentStatus",
    referenceId: 1018,
    values: ["ACTIVE", "INACTIVE"],
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
    name: "LanguageDirection",
    referenceId: 1021,
    values: ["LTR", "RTL"],
  },
  {
    name: "LegalEntityStatus",
    referenceId: 1022,
    values: ["ACTIVE", "DORMANT", "IN_LIQUIDATION", "DISSOLVED"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1023,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1024,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "OrganizationOrganizationType",
    referenceId: 1025,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1026,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1027,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1028,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRelationshipRelationshipType",
    referenceId: 1029,
    values: ["SUBSIDIARY_OF", "BRANCH_OF", "EMPLOYEE_OF", "AGENT_OF", "GUARANTOR_FOR", "BENEFICIAL_OWNER_OF", "HOUSEHOLD_MEMBER_OF", "OTHER"],
  },
  {
    name: "PartyRelationshipStatus",
    referenceId: 1030,
    values: ["ACTIVE", "ENDED"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1031,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1032,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1033,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1034,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1035,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1036,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "TaskPriority",
    referenceId: 1037,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1038,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1039,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1040,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1041,
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
    entity: "AIModel",
    tableName: "bus_ai_model",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["RETIRED"],
    edges: [
      { from: "DRAFT", to: "TRAINING", trigger: "mark_training" },
      { from: "TRAINING", to: "VALIDATION", trigger: "mark_validation" },
      { from: "VALIDATION", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "DEPLOYED", trigger: "mark_deployed" },
      { from: "TRAINING", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "TRAINING", trigger: "resume" },
      { from: "VALIDATION", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "VALIDATION", trigger: "resume" },
      { from: "APPROVED", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "APPROVED", trigger: "resume" },
      { from: "DEPLOYED", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "DEPLOYED", trigger: "resume" },
      { from: "DRAFT", to: "RETIRED", trigger: "retire" },
      { from: "TRAINING", to: "RETIRED", trigger: "retire" },
      { from: "VALIDATION", to: "RETIRED", trigger: "retire" },
      { from: "APPROVED", to: "RETIRED", trigger: "retire" },
      { from: "DEPLOYED", to: "RETIRED", trigger: "retire" },
      { from: "SUSPENDED", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "AIEvaluation",
    tableName: "bus_ai_evaluation",
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
    entity: "AIPolicy",
    tableName: "bus_ai_policy",
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
