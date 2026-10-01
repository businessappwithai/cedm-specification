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
 * Generated: 2026-10-01T04:34:49.207Z
 * Project: maintenance
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
    name: "AssetStatus",
    referenceId: 1002,
    values: ["PLANNED", "ACTIVE", "UNDER_MAINTENANCE", "HELD", "DISPOSED", "RETIRED"],
  },
  {
    name: "ContainerStatus",
    referenceId: 1003,
    values: ["ACTIVE", "IN_REPAIR", "DAMAGED", "SOLD", "SCRAPPED", "LOST", "RETIRED"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1004,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1005,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1006,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1007,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1008,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "MaintenancePlanFrequencyUnit",
    referenceId: 1009,
    values: ["HOURS", "DAYS", "WEEKS", "MONTHS", "MILES", "CYCLES", "OTHER"],
  },
  {
    name: "MaintenancePlanMaintenanceType",
    referenceId: 1010,
    values: ["PREVENTIVE", "CONDITION_BASED", "PREDICTIVE", "INSPECTION"],
  },
  {
    name: "MaintenancePlanStatus",
    referenceId: 1011,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"],
  },
  {
    name: "MaintenanceWorkOrderPriority",
    referenceId: 1012,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "MaintenanceWorkOrderStatus",
    referenceId: 1013,
    values: ["OPEN", "PLANNED", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"],
  },
  {
    name: "MaintenanceWorkOrderWorkType",
    referenceId: 1014,
    values: ["INSPECTION", "PREVENTIVE", "CORRECTIVE", "REPAIR", "EMERGENCY"],
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
    name: "ProductProductType",
    referenceId: 1025,
    values: ["GOOD", "MATERIAL", "SERVICE", "SUBSCRIPTION", "ASSET", "BUNDLE", "OTHER"],
  },
  {
    name: "ProductStatus",
    referenceId: 1026,
    values: ["DRAFT", "ACTIVE", "DISCONTINUED", "BLOCKED", "RETIRED"],
  },
  {
    name: "RepairEstimateDisposition",
    referenceId: 1027,
    values: ["LEASE", "SALE", "SCRAP", "REPAIR", "HOLD"],
  },
  {
    name: "RepairEstimateStatus",
    referenceId: 1028,
    values: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"],
  },
  {
    name: "SparePartCriticality",
    referenceId: 1029,
    values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1030,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1031,
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
