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
 * Generated: 2026-10-09T15:29:37.327Z
 * Project: manufacturing
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
    name: "BillOfMaterialStatus",
    referenceId: 1002,
    values: ["DRAFT", "ACTIVE", "OBSOLETE"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1003,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1004,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1005,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "InventoryMovementMovementType",
    referenceId: 1006,
    values: ["RECEIPT", "ISSUE", "TRANSFER", "ADJUSTMENT", "RETURN", "RESERVATION", "RELEASE"],
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
    name: "LotStatus",
    referenceId: 1009,
    values: ["ACTIVE", "HOLD", "QUARANTINED", "RELEASED", "EXPIRED", "REJECTED", "CONSUMED", "CLOSED"],
  },
  {
    name: "ManufacturingWorkOrderStatus",
    referenceId: 1010,
    values: ["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"],
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
    name: "ProductLifecycleLifecycleStatus",
    referenceId: 1021,
    values: ["DRAFT", "ACTIVE", "DISCONTINUED", "BLOCKED", "RETIRED"],
  },
  {
    name: "ProductProductType",
    referenceId: 1022,
    values: ["GOOD", "MATERIAL", "SERVICE", "SUBSCRIPTION", "ASSET", "BUNDLE", "OTHER"],
  },
  {
    name: "ProductStatus",
    referenceId: 1023,
    values: ["DRAFT", "ACTIVE", "DISCONTINUED", "BLOCKED", "RETIRED"],
  },
  {
    name: "ProductionRecordStatus",
    referenceId: 1024,
    values: ["PLANNED", "RECORDED", "VERIFIED", "REJECTED"],
  },
  {
    name: "QualityInspectionDisposition",
    referenceId: 1025,
    values: ["RELEASE", "ACCEPT", "REJECT", "QUARANTINE", "RETURN_TO_SUPPLIER", "REWORK", "REPAIR", "SCRAP", "CONDITIONAL_RELEASE"],
  },
  {
    name: "QualityInspectionResult",
    referenceId: 1026,
    values: ["PASS", "FAIL", "CONDITIONAL", "NOT_TESTED"],
  },
  {
    name: "QualityInspectionStatus",
    referenceId: 1027,
    values: ["OPEN", "IN_PROGRESS", "PASSED", "FAILED", "CONDITIONAL", "CANCELLED"],
  },
  {
    name: "RoutingStatus",
    referenceId: 1028,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "OBSOLETE"],
  },
  {
    name: "SerialNumberStatus",
    referenceId: 1029,
    values: ["EXPECTED", "AVAILABLE", "RESERVED", "IN_TRANSIT", "INSTALLED", "CONSUMED", "RETURNED", "QUARANTINED", "SCRAPPED", "RETIRED"],
  },
  {
    name: "TaskPriority",
    referenceId: 1030,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1031,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1032,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1033,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1034,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "WorkCenterStatus",
    referenceId: 1035,
    values: ["ACTIVE", "INACTIVE", "MAINTENANCE", "RETIRED"],
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
    entity: "BillOfMaterial",
    tableName: "bus_bill_of_material",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["OBSOLETE"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "DRAFT", to: "OBSOLETE", trigger: "mark_obsolete" },
      { from: "ACTIVE", to: "OBSOLETE", trigger: "mark_obsolete" },
    ],
  },
  {
    entity: "Routing",
    tableName: "bus_routing",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["OBSOLETE"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "ACTIVE", trigger: "resume" },
      { from: "DRAFT", to: "OBSOLETE", trigger: "mark_obsolete" },
      { from: "ACTIVE", to: "OBSOLETE", trigger: "mark_obsolete" },
      { from: "SUSPENDED", to: "OBSOLETE", trigger: "mark_obsolete" },
    ],
  },
  {
    entity: "WorkCenter",
    tableName: "bus_work_center",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["RETIRED"],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
      { from: "ACTIVE", to: "MAINTENANCE", trigger: "mark_maintenance" },
      { from: "MAINTENANCE", to: "ACTIVE", trigger: "return_to_service" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "INACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "MAINTENANCE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "ManufacturingWorkOrder",
    tableName: "bus_manufacturing_work_order",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["CLOSED", "CANCELLED"],
    edges: [
      { from: "PLANNED", to: "RELEASED", trigger: "release" },
      { from: "RELEASED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "COMPLETED", trigger: "complete" },
      { from: "COMPLETED", to: "CLOSED", trigger: "close" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "RELEASED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Lot",
    tableName: "bus_lot",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["CONSUMED", "EXPIRED", "REJECTED", "CLOSED"],
    edges: [
      { from: "ACTIVE", to: "HOLD", trigger: "hold" },
      { from: "ACTIVE", to: "QUARANTINED", trigger: "quarantine" },
      { from: "ACTIVE", to: "CONSUMED", trigger: "consume" },
      { from: "ACTIVE", to: "EXPIRED", trigger: "expire" },
      { from: "ACTIVE", to: "CLOSED", trigger: "close" },
      { from: "HOLD", to: "ACTIVE", trigger: "release_hold" },
      { from: "HOLD", to: "QUARANTINED", trigger: "quarantine" },
      { from: "QUARANTINED", to: "RELEASED", trigger: "release" },
      { from: "QUARANTINED", to: "REJECTED", trigger: "reject" },
      { from: "QUARANTINED", to: "HOLD", trigger: "hold" },
      { from: "RELEASED", to: "HOLD", trigger: "hold" },
      { from: "RELEASED", to: "QUARANTINED", trigger: "quarantine" },
      { from: "RELEASED", to: "CONSUMED", trigger: "consume" },
      { from: "RELEASED", to: "EXPIRED", trigger: "expire" },
      { from: "RELEASED", to: "CLOSED", trigger: "close" },
    ],
  },
  {
    entity: "SerialNumber",
    tableName: "bus_serial_number",
    statusField: "status",
    initial: "EXPECTED",
    terminal: ["CONSUMED", "SCRAPPED", "RETIRED"],
    edges: [
      { from: "EXPECTED", to: "AVAILABLE", trigger: "receive" },
      { from: "AVAILABLE", to: "RESERVED", trigger: "reserve" },
      { from: "RESERVED", to: "AVAILABLE", trigger: "release" },
      { from: "RESERVED", to: "IN_TRANSIT", trigger: "ship" },
      { from: "AVAILABLE", to: "IN_TRANSIT", trigger: "ship" },
      { from: "IN_TRANSIT", to: "INSTALLED", trigger: "install" },
      { from: "IN_TRANSIT", to: "AVAILABLE", trigger: "receive" },
      { from: "INSTALLED", to: "RETURNED", trigger: "return" },
      { from: "IN_TRANSIT", to: "RETURNED", trigger: "return" },
      { from: "RETURNED", to: "AVAILABLE", trigger: "restock" },
      { from: "RETURNED", to: "QUARANTINED", trigger: "quarantine" },
      { from: "AVAILABLE", to: "QUARANTINED", trigger: "quarantine" },
      { from: "QUARANTINED", to: "AVAILABLE", trigger: "release" },
      { from: "QUARANTINED", to: "SCRAPPED", trigger: "scrap" },
      { from: "AVAILABLE", to: "SCRAPPED", trigger: "scrap" },
      { from: "RETURNED", to: "SCRAPPED", trigger: "scrap" },
      { from: "AVAILABLE", to: "CONSUMED", trigger: "consume" },
      { from: "INSTALLED", to: "RETIRED", trigger: "retire" },
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
    entity: "ProductionRecord",
    tableName: "bus_production_record",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["VERIFIED", "REJECTED"],
    edges: [
      { from: "PLANNED", to: "RECORDED", trigger: "record" },
      { from: "RECORDED", to: "VERIFIED", trigger: "verify" },
      { from: "RECORDED", to: "REJECTED", trigger: "reject" },
      { from: "PLANNED", to: "REJECTED", trigger: "reject" },
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
