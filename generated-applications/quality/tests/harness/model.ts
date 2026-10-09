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
 * Generated: 2026-10-09T06:45:47.361Z
 * Project: quality
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
    name: "CertificateOfAnalysisStatus",
    referenceId: 1002,
    values: ["DRAFT", "APPROVED", "ISSUED", "SUPERSEDED", "VOID"],
  },
  {
    name: "CorrectiveActionActionType",
    referenceId: 1003,
    values: ["CONTAINMENT", "CORRECTION", "CORRECTIVE", "PREVENTIVE"],
  },
  {
    name: "CorrectiveActionStatus",
    referenceId: 1004,
    values: ["OPEN", "ASSIGNED", "IN_PROGRESS", "VERIFICATION", "COMPLETED", "CANCELLED"],
  },
  {
    name: "CorrectiveActionVerificationResult",
    referenceId: 1005,
    values: ["EFFECTIVE", "PARTIALLY_EFFECTIVE", "INEFFECTIVE", "NOT_VERIFIABLE"],
  },
  {
    name: "CorrectiveActionVerificationStatus",
    referenceId: 1006,
    values: ["OPEN", "IN_PROGRESS", "COMPLETED", "REOPENED", "CANCELLED"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1007,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1008,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1009,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "InspectionSampleStatus",
    referenceId: 1010,
    values: ["SELECTED", "IN_TESTING", "TESTED", "REJECTED", "DISPOSED", "CANCELLED"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1011,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1012,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "NonconformanceSeverity",
    referenceId: 1013,
    values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  },
  {
    name: "NonconformanceStatus",
    referenceId: 1014,
    values: ["OPEN", "UNDER_REVIEW", "CONTAINED", "CORRECTIVE_ACTION", "CLOSED", "REJECTED"],
  },
  {
    name: "OrganizationOrganizationType",
    referenceId: 1015,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1016,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1017,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1018,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1019,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1020,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1021,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1022,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1023,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1024,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "QualityCharacteristicDataType",
    referenceId: 1025,
    values: ["DECIMAL", "INTEGER", "STRING", "BOOLEAN", "ENUM"],
  },
  {
    name: "QualityCharacteristicStatus",
    referenceId: 1026,
    values: ["DRAFT", "ACTIVE", "RETIRED"],
  },
  {
    name: "QualityInspectionDisposition",
    referenceId: 1027,
    values: ["RELEASE", "ACCEPT", "REJECT", "QUARANTINE", "RETURN_TO_SUPPLIER", "REWORK", "REPAIR", "SCRAP", "CONDITIONAL_RELEASE"],
  },
  {
    name: "QualityInspectionResult",
    referenceId: 1028,
    values: ["PASS", "FAIL", "CONDITIONAL", "NOT_TESTED"],
  },
  {
    name: "QualityInspectionStatus",
    referenceId: 1029,
    values: ["OPEN", "IN_PROGRESS", "PASSED", "FAILED", "CONDITIONAL", "CANCELLED"],
  },
  {
    name: "QualityMeasurementResult",
    referenceId: 1030,
    values: ["PASS", "FAIL", "CONDITIONAL", "NOT_EVALUATED"],
  },
  {
    name: "QualityPlanStatus",
    referenceId: 1031,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"],
  },
  {
    name: "ReturnDispositionDispositionCode",
    referenceId: 1032,
    values: ["RESTOCK", "QUARANTINE", "RETURN_TO_SUPPLIER", "REWORK", "REPAIR", "SCRAP", "REJECT", "ACCEPT", "CONDITIONAL_RELEASE"],
  },
  {
    name: "ReturnDispositionStatus",
    referenceId: 1033,
    values: ["DRAFT", "AUTHORIZED", "EXECUTED", "CANCELLED", "EXCEPTION"],
  },
  {
    name: "SamplingPlanMethod",
    referenceId: 1034,
    values: ["CENSUS", "RANDOM", "SYSTEMATIC", "STRATIFIED", "FIXED_SIZE", "PERCENTAGE", "ACCEPTANCE_SAMPLING"],
  },
  {
    name: "SamplingPlanStatus",
    referenceId: 1035,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"],
  },
  {
    name: "SamplingRuleStatus",
    referenceId: 1036,
    values: ["DRAFT", "ACTIVE", "RETIRED"],
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
    name: "TestMethodStatus",
    referenceId: 1040,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1041,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1042,
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
    entity: "QualityCharacteristic",
    tableName: "bus_quality_characteristic",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["RETIRED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "DRAFT", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "QualityPlan",
    tableName: "bus_quality_plan",
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
    entity: "TestMethod",
    tableName: "bus_test_method",
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
    entity: "SamplingPlan",
    tableName: "bus_sampling_plan",
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
    entity: "SamplingRule",
    tableName: "bus_sampling_rule",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["RETIRED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "DRAFT", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "QualityInspection",
    tableName: "bus_quality_inspection",
    statusField: "status",
    initial: "OPEN",
    terminal: ["PASSED", "FAILED", "CANCELLED"],
    edges: [
      { from: "OPEN", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "CONDITIONAL", trigger: "mark_conditional" },
      { from: "CONDITIONAL", to: "PASSED", trigger: "mark_passed" },
      { from: "IN_PROGRESS", to: "FAILED", trigger: "fail" },
      { from: "CONDITIONAL", to: "FAILED", trigger: "fail" },
      { from: "OPEN", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
      { from: "CONDITIONAL", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "InspectionSample",
    tableName: "bus_inspection_sample",
    statusField: "status",
    initial: "SELECTED",
    terminal: ["REJECTED", "DISPOSED", "CANCELLED"],
    edges: [
      { from: "SELECTED", to: "IN_TESTING", trigger: "mark_in_testing" },
      { from: "IN_TESTING", to: "TESTED", trigger: "mark_tested" },
      { from: "SELECTED", to: "REJECTED", trigger: "reject" },
      { from: "IN_TESTING", to: "REJECTED", trigger: "reject" },
      { from: "TESTED", to: "REJECTED", trigger: "reject" },
      { from: "IN_TESTING", to: "DISPOSED", trigger: "mark_disposed" },
      { from: "TESTED", to: "DISPOSED", trigger: "mark_disposed" },
      { from: "SELECTED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_TESTING", to: "CANCELLED", trigger: "cancel" },
      { from: "TESTED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Nonconformance",
    tableName: "bus_nonconformance",
    statusField: "status",
    initial: "OPEN",
    terminal: ["CLOSED", "REJECTED"],
    edges: [
      { from: "OPEN", to: "UNDER_REVIEW", trigger: "review" },
      { from: "UNDER_REVIEW", to: "CORRECTIVE_ACTION", trigger: "mark_corrective_action" },
      { from: "CORRECTIVE_ACTION", to: "CLOSED", trigger: "close" },
      { from: "UNDER_REVIEW", to: "CONTAINED", trigger: "mark_contained" },
      { from: "CONTAINED", to: "UNDER_REVIEW", trigger: "resume" },
      { from: "CORRECTIVE_ACTION", to: "CONTAINED", trigger: "mark_contained" },
      { from: "CONTAINED", to: "CORRECTIVE_ACTION", trigger: "resume" },
      { from: "OPEN", to: "REJECTED", trigger: "reject" },
      { from: "UNDER_REVIEW", to: "REJECTED", trigger: "reject" },
      { from: "CORRECTIVE_ACTION", to: "REJECTED", trigger: "reject" },
      { from: "CONTAINED", to: "REJECTED", trigger: "reject" },
    ],
  },
  {
    entity: "CorrectiveAction",
    tableName: "bus_corrective_action",
    statusField: "status",
    initial: "OPEN",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "OPEN", to: "ASSIGNED", trigger: "assign" },
      { from: "ASSIGNED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "VERIFICATION", trigger: "mark_verification" },
      { from: "VERIFICATION", to: "COMPLETED", trigger: "complete" },
      { from: "OPEN", to: "CANCELLED", trigger: "cancel" },
      { from: "ASSIGNED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
      { from: "VERIFICATION", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "CorrectiveActionVerification",
    tableName: "bus_corrective_action_verification",
    statusField: "status",
    initial: "OPEN",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "OPEN", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "REOPENED", trigger: "mark_reopened" },
      { from: "REOPENED", to: "COMPLETED", trigger: "complete" },
      { from: "OPEN", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
      { from: "REOPENED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "ReturnDisposition",
    tableName: "bus_return_disposition",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["EXECUTED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "AUTHORIZED", trigger: "authorize" },
      { from: "AUTHORIZED", to: "EXECUTED", trigger: "mark_executed" },
      { from: "AUTHORIZED", to: "EXCEPTION", trigger: "mark_exception" },
      { from: "EXCEPTION", to: "AUTHORIZED", trigger: "resolve_exception" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "AUTHORIZED", to: "CANCELLED", trigger: "cancel" },
      { from: "EXCEPTION", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "CertificateOfAnalysis",
    tableName: "bus_certificate_of_analysis",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["SUPERSEDED", "VOID"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "ISSUED", trigger: "issue" },
      { from: "DRAFT", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "APPROVED", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "ISSUED", to: "SUPERSEDED", trigger: "mark_superseded" },
      { from: "DRAFT", to: "VOID", trigger: "void" },
      { from: "APPROVED", to: "VOID", trigger: "void" },
      { from: "ISSUED", to: "VOID", trigger: "void" },
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
