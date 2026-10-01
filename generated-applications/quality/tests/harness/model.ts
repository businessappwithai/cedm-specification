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
 * Generated: 2026-10-01T05:19:07.464Z
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
    name: "TestMethodStatus",
    referenceId: 1037,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1038,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1039,
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
