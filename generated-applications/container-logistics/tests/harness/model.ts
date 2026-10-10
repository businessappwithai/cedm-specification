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
 * Generated: 2026-10-10T02:39:27.805Z
 * Project: container-logistics
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
    name: "BerthStatus",
    referenceId: 1002,
    values: ["ACTIVE", "RESTRICTED", "OUT_OF_SERVICE", "RETIRED"],
  },
  {
    name: "ContainerMovementMovementType",
    referenceId: 1003,
    values: ["RECEIVE", "STACK", "RESTACK", "UNSTACK", "TRANSFER", "GATE_OUT", "GATE_IN", "LOAD", "DISCHARGE", "INSPECTION", "REPAIR_MOVE"],
  },
  {
    name: "ContainerMovementPriority",
    referenceId: 1004,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "ContainerMovementStatus",
    referenceId: 1005,
    values: ["PLANNED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "ContainerStatus",
    referenceId: 1006,
    values: ["ACTIVE", "IN_REPAIR", "DAMAGED", "SOLD", "SCRAPPED", "LOST", "RETIRED"],
  },
  {
    name: "ContainerVisitStatus",
    referenceId: 1007,
    values: ["ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1008,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1009,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1010,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "GateEventDirection",
    referenceId: 1011,
    values: ["IN", "OUT", "INTERNAL", "OTHER"],
  },
  {
    name: "GateEventStatus",
    referenceId: 1012,
    values: ["RECORDED", "VERIFIED", "REVERSED"],
  },
  {
    name: "GateGateType",
    referenceId: 1013,
    values: ["TRUCK", "RAIL", "PEDESTRIAN", "VESSEL_SIDE"],
  },
  {
    name: "GateStatus",
    referenceId: 1014,
    values: ["OPEN", "CLOSED", "RETIRED"],
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
    name: "OrganizationOrganizationType",
    referenceId: 1017,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1018,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1019,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1020,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1021,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1022,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1023,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1024,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1025,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1026,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PortStatus",
    referenceId: 1027,
    values: ["ACTIVE", "RESTRICTED", "CLOSED"],
  },
  {
    name: "TaskPriority",
    referenceId: 1028,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1029,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1030,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1031,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1032,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "VesselStatus",
    referenceId: 1033,
    values: ["ACTIVE", "INACTIVE", "OUT_OF_SERVICE", "RETIRED"],
  },
  {
    name: "VoyageStatus",
    referenceId: 1034,
    values: ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "YardBayStatus",
    referenceId: 1035,
    values: ["ACTIVE", "BLOCKED", "CLOSED"],
  },
  {
    name: "YardBlockStatus",
    referenceId: 1036,
    values: ["ACTIVE", "BLOCKED", "CLOSED"],
  },
  {
    name: "YardSlotStatus",
    referenceId: 1037,
    values: ["EMPTY", "OCCUPIED", "RESERVED", "BLOCKED", "OUT_OF_SERVICE"],
  },
  {
    name: "YardStatus",
    referenceId: 1038,
    values: ["PLANNED", "ACTIVE", "SUSPENDED", "CLOSED"],
  },
  {
    name: "YardTierStatus",
    referenceId: 1039,
    values: ["ACTIVE", "BLOCKED", "CLOSED"],
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
    entity: "Container",
    tableName: "bus_container",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["SOLD", "SCRAPPED", "LOST", "RETIRED"],
    edges: [
      { from: "ACTIVE", to: "IN_REPAIR", trigger: "mark_in_repair" },
      { from: "IN_REPAIR", to: "DAMAGED", trigger: "mark_damaged" },
      { from: "ACTIVE", to: "SOLD", trigger: "mark_sold" },
      { from: "IN_REPAIR", to: "SOLD", trigger: "mark_sold" },
      { from: "DAMAGED", to: "SOLD", trigger: "mark_sold" },
      { from: "IN_REPAIR", to: "SCRAPPED", trigger: "mark_scrapped" },
      { from: "DAMAGED", to: "SCRAPPED", trigger: "mark_scrapped" },
      { from: "IN_REPAIR", to: "LOST", trigger: "mark_lost" },
      { from: "DAMAGED", to: "LOST", trigger: "mark_lost" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "IN_REPAIR", to: "RETIRED", trigger: "retire" },
      { from: "DAMAGED", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "ContainerMovement",
    tableName: "bus_container_movement",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["COMPLETED", "CANCELLED", "FAILED"],
    edges: [
      { from: "PLANNED", to: "ASSIGNED", trigger: "assign" },
      { from: "ASSIGNED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "COMPLETED", trigger: "complete" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "ASSIGNED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
      { from: "ASSIGNED", to: "FAILED", trigger: "fail" },
      { from: "IN_PROGRESS", to: "FAILED", trigger: "fail" },
    ],
  },
  {
    entity: "Yard",
    tableName: "bus_yard",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["CLOSED"],
    edges: [
      { from: "PLANNED", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "CLOSED", trigger: "close" },
      { from: "ACTIVE", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "ACTIVE", trigger: "resume" },
    ],
  },
  {
    entity: "YardBlock",
    tableName: "bus_yard_block",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["CLOSED"],
    edges: [
      { from: "ACTIVE", to: "CLOSED", trigger: "close" },
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
    ],
  },
  {
    entity: "YardBay",
    tableName: "bus_yard_bay",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["CLOSED"],
    edges: [
      { from: "ACTIVE", to: "CLOSED", trigger: "close" },
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
    ],
  },
  {
    entity: "YardTier",
    tableName: "bus_yard_tier",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["CLOSED"],
    edges: [
      { from: "ACTIVE", to: "CLOSED", trigger: "close" },
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
    ],
  },
  {
    entity: "YardSlot",
    tableName: "bus_yard_slot",
    statusField: "status",
    initial: "EMPTY",
    terminal: [],
    edges: [
      { from: "EMPTY", to: "OCCUPIED", trigger: "mark_occupied" },
      { from: "OCCUPIED", to: "RESERVED", trigger: "reserve" },
      { from: "OCCUPIED", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "OCCUPIED", trigger: "unblock" },
      { from: "RESERVED", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "RESERVED", trigger: "unblock" },
      { from: "OCCUPIED", to: "OUT_OF_SERVICE", trigger: "mark_out_of_service" },
      { from: "OUT_OF_SERVICE", to: "OCCUPIED", trigger: "return_to_service" },
      { from: "RESERVED", to: "OUT_OF_SERVICE", trigger: "mark_out_of_service" },
      { from: "OUT_OF_SERVICE", to: "RESERVED", trigger: "return_to_service" },
    ],
  },
  {
    entity: "Port",
    tableName: "bus_port",
    statusField: "status",
    initial: "ACTIVE",
    terminal: [],
    edges: [
      { from: "ACTIVE", to: "RESTRICTED", trigger: "restrict" },
      { from: "RESTRICTED", to: "ACTIVE", trigger: "restore" },
      { from: "ACTIVE", to: "CLOSED", trigger: "close" },
      { from: "RESTRICTED", to: "CLOSED", trigger: "close" },
      { from: "CLOSED", to: "ACTIVE", trigger: "reopen" },
    ],
  },
  {
    entity: "Berth",
    tableName: "bus_berth",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "RESTRICTED", trigger: "restrict" },
      { from: "RESTRICTED", to: "ACTIVE", trigger: "restore" },
      { from: "ACTIVE", to: "OUT_OF_SERVICE", trigger: "take_out_of_service" },
      { from: "RESTRICTED", to: "OUT_OF_SERVICE", trigger: "take_out_of_service" },
      { from: "OUT_OF_SERVICE", to: "ACTIVE", trigger: "return_to_service" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "RESTRICTED", to: "RETIRED", trigger: "retire" },
      { from: "OUT_OF_SERVICE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Gate",
    tableName: "bus_gate",
    statusField: "status",
    initial: "OPEN",
    terminal: ["RETIRED"],
    edges: [
      { from: "OPEN", to: "CLOSED", trigger: "close" },
      { from: "CLOSED", to: "OPEN", trigger: "reopen" },
      { from: "OPEN", to: "RETIRED", trigger: "retire" },
      { from: "CLOSED", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "GateEvent",
    tableName: "bus_gate_event",
    statusField: "status",
    initial: "RECORDED",
    terminal: ["VERIFIED", "REVERSED"],
    edges: [
      { from: "RECORDED", to: "VERIFIED", trigger: "verify" },
      { from: "RECORDED", to: "REVERSED", trigger: "reverse" },
    ],
  },
  {
    entity: "ContainerVisit",
    tableName: "bus_container_visit",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Vessel",
    tableName: "bus_vessel",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "OUT_OF_SERVICE", trigger: "take_out_of_service" },
      { from: "OUT_OF_SERVICE", to: "ACTIVE", trigger: "return_to_service" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "OUT_OF_SERVICE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Voyage",
    tableName: "bus_voyage",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "PLANNED", to: "ACTIVE", trigger: "start" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "COMPLETED", trigger: "complete" },
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
