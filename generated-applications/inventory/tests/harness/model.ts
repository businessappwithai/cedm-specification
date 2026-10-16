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
 * Generated: 2026-10-16T07:47:11.753Z
 * Project: inventory
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
    name: "CurrencyStatus",
    referenceId: 1009,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "DepartmentStatus",
    referenceId: 1010,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "DockDockType",
    referenceId: 1011,
    values: ["INBOUND", "OUTBOUND", "BIDIRECTIONAL", "CROSS_DOCK"],
  },
  {
    name: "DockStatus",
    referenceId: 1012,
    values: ["AVAILABLE", "OUT_OF_SERVICE"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1013,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1014,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "HandlingUnitStatus",
    referenceId: 1015,
    values: ["OPEN", "CLOSED", "SHIPPED", "RECEIVED", "DISMANTLED"],
  },
  {
    name: "HandlingUnitType",
    referenceId: 1016,
    values: ["PALLET", "CARTON", "TOTE", "CAGE", "DRUM", "PACKAGE", "OTHER"],
  },
  {
    name: "InventoryAdjustmentStatus",
    referenceId: 1017,
    values: ["REQUESTED", "APPROVED", "POSTED", "REJECTED"],
  },
  {
    name: "InventoryCountCountType",
    referenceId: 1018,
    values: ["CYCLE", "ANNUAL", "SPOT"],
  },
  {
    name: "InventoryCountStatus",
    referenceId: 1019,
    values: ["PLANNED", "COUNTED", "RECOUNT", "APPROVED"],
  },
  {
    name: "InventoryItemStatus",
    referenceId: 1020,
    values: ["DRAFT", "ACTIVE", "BLOCKED", "DISCONTINUED"],
  },
  {
    name: "InventoryLocationLocationType",
    referenceId: 1021,
    values: ["RECEIVING", "BIN", "SHELF", "RACK", "FLOOR", "PICK", "STAGING", "QUARANTINE", "YARD_SLOT", "OTHER"],
  },
  {
    name: "InventoryLocationStatus",
    referenceId: 1022,
    values: ["ACTIVE", "BLOCKED", "INACTIVE"],
  },
  {
    name: "InventoryMovementMovementType",
    referenceId: 1023,
    values: ["RECEIPT", "ISSUE", "TRANSFER", "ADJUSTMENT", "RETURN", "RESERVATION", "RELEASE"],
  },
  {
    name: "InventoryReservationStatus",
    referenceId: 1024,
    values: ["PENDING", "ACTIVE", "PARTIALLY_CONSUMED", "RELEASED", "CONSUMED", "CANCELLED", "EXPIRED"],
  },
  {
    name: "InventoryTransferStatus",
    referenceId: 1025,
    values: ["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  },
  {
    name: "LanguageDirection",
    referenceId: 1026,
    values: ["LTR", "RTL"],
  },
  {
    name: "LegalEntityStatus",
    referenceId: 1027,
    values: ["ACTIVE", "DORMANT", "IN_LIQUIDATION", "DISSOLVED"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1028,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1029,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "LotStatus",
    referenceId: 1030,
    values: ["ACTIVE", "HOLD", "QUARANTINED", "RELEASED", "EXPIRED", "REJECTED", "CONSUMED", "CLOSED"],
  },
  {
    name: "OrganizationOrganizationType",
    referenceId: 1031,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1032,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1033,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PackagingPackagingLevel",
    referenceId: 1034,
    values: ["EACH", "INNER", "CASE", "PALLET"],
  },
  {
    name: "PackingStatus",
    referenceId: 1035,
    values: ["PLANNED", "IN_PROGRESS", "PACKED", "CANCELLED", "EXCEPTION"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1036,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRelationshipRelationshipType",
    referenceId: 1037,
    values: ["SUBSIDIARY_OF", "BRANCH_OF", "EMPLOYEE_OF", "AGENT_OF", "GUARANTOR_FOR", "BENEFICIAL_OWNER_OF", "HOUSEHOLD_MEMBER_OF", "OTHER"],
  },
  {
    name: "PartyRelationshipStatus",
    referenceId: 1038,
    values: ["ACTIVE", "ENDED"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1039,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1040,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1041,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1042,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1043,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1044,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PickingStatus",
    referenceId: 1045,
    values: ["PLANNED", "RELEASED", "IN_PROGRESS", "PICKED", "SHORT", "CANCELLED", "EXCEPTION"],
  },
  {
    name: "ProductProductType",
    referenceId: 1046,
    values: ["GOOD", "MATERIAL", "SERVICE", "SUBSCRIPTION", "ASSET", "BUNDLE", "OTHER"],
  },
  {
    name: "ProductStatus",
    referenceId: 1047,
    values: ["DRAFT", "ACTIVE", "DISCONTINUED", "BLOCKED", "RETIRED"],
  },
  {
    name: "PutawayStatus",
    referenceId: 1048,
    values: ["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "EXCEPTION"],
  },
  {
    name: "SerialNumberStatus",
    referenceId: 1049,
    values: ["EXPECTED", "AVAILABLE", "RESERVED", "IN_TRANSIT", "INSTALLED", "CONSUMED", "RETURNED", "QUARANTINED", "SCRAPPED", "RETIRED"],
  },
  {
    name: "TaskPriority",
    referenceId: 1050,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1051,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1052,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1053,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1054,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "WarehouseLocationType",
    referenceId: 1055,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "WarehouseStatus",
    referenceId: 1056,
    values: ["PLANNED", "ACTIVE", "SUSPENDED", "CLOSED"],
  },
  {
    name: "WarehouseWarehouseType",
    referenceId: 1057,
    values: ["GENERAL", "COLD_STORAGE", "BONDED", "DISTRIBUTION", "RETAIL", "OTHER"],
  },
  {
    name: "WarehouseZoneStatus",
    referenceId: 1058,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "WarehouseZoneZoneType",
    referenceId: 1059,
    values: ["RECEIVING", "RESERVE", "PICKING", "STAGING", "SHIPPING", "QUARANTINE", "RETURNS", "COLD_STORAGE", "HAZARDOUS", "GENERAL"],
  },
  {
    name: "WaveStatus",
    referenceId: 1060,
    values: ["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  },
  {
    name: "WaveWaveType",
    referenceId: 1061,
    values: ["PICKING", "PUTAWAY", "REPLENISHMENT"],
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
    entity: "InventoryItem",
    tableName: "bus_inventory_item",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["DISCONTINUED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
      { from: "DRAFT", to: "DISCONTINUED", trigger: "discontinue" },
      { from: "ACTIVE", to: "DISCONTINUED", trigger: "discontinue" },
      { from: "BLOCKED", to: "DISCONTINUED", trigger: "discontinue" },
    ],
  },
  {
    entity: "InventoryReservation",
    tableName: "bus_inventory_reservation",
    statusField: "status",
    initial: "PENDING",
    terminal: ["RELEASED", "CONSUMED", "CANCELLED", "EXPIRED"],
    edges: [
      { from: "PENDING", to: "ACTIVE", trigger: "activate" },
      { from: "PENDING", to: "CANCELLED", trigger: "cancel" },
      { from: "PENDING", to: "EXPIRED", trigger: "expire" },
      { from: "ACTIVE", to: "PARTIALLY_CONSUMED", trigger: "consume_part" },
      { from: "ACTIVE", to: "CONSUMED", trigger: "consume" },
      { from: "PARTIALLY_CONSUMED", to: "CONSUMED", trigger: "consume" },
      { from: "ACTIVE", to: "RELEASED", trigger: "release" },
      { from: "PARTIALLY_CONSUMED", to: "RELEASED", trigger: "release" },
      { from: "ACTIVE", to: "CANCELLED", trigger: "cancel" },
      { from: "ACTIVE", to: "EXPIRED", trigger: "expire" },
    ],
  },
  {
    entity: "InventoryTransfer",
    tableName: "bus_inventory_transfer",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "PLANNED", to: "RELEASED", trigger: "release" },
      { from: "RELEASED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "COMPLETED", trigger: "complete" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "RELEASED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "InventoryCount",
    tableName: "bus_inventory_count",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["APPROVED"],
    edges: [
      { from: "PLANNED", to: "COUNTED", trigger: "count" },
      { from: "COUNTED", to: "RECOUNT", trigger: "order_recount" },
      { from: "RECOUNT", to: "COUNTED", trigger: "count" },
      { from: "COUNTED", to: "APPROVED", trigger: "approve" },
    ],
  },
  {
    entity: "InventoryAdjustment",
    tableName: "bus_inventory_adjustment",
    statusField: "status",
    initial: "REQUESTED",
    terminal: ["POSTED", "REJECTED"],
    edges: [
      { from: "REQUESTED", to: "APPROVED", trigger: "approve" },
      { from: "REQUESTED", to: "REJECTED", trigger: "reject" },
      { from: "APPROVED", to: "POSTED", trigger: "post" },
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
    entity: "InventoryLocation",
    tableName: "bus_inventory_location",
    statusField: "status",
    initial: "ACTIVE",
    terminal: [],
    edges: [
      { from: "ACTIVE", to: "BLOCKED", trigger: "block" },
      { from: "BLOCKED", to: "ACTIVE", trigger: "unblock" },
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
    ],
  },
  {
    entity: "Warehouse",
    tableName: "bus_warehouse",
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
    entity: "WarehouseZone",
    tableName: "bus_warehouse_zone",
    statusField: "status",
    initial: "ACTIVE",
    terminal: [],
    edges: [
      { from: "ACTIVE", to: "INACTIVE", trigger: "deactivate" },
      { from: "INACTIVE", to: "ACTIVE", trigger: "reactivate" },
    ],
  },
  {
    entity: "Dock",
    tableName: "bus_dock",
    statusField: "status",
    initial: "AVAILABLE",
    terminal: [],
    edges: [
      { from: "AVAILABLE", to: "OUT_OF_SERVICE", trigger: "take_out_of_service" },
      { from: "OUT_OF_SERVICE", to: "AVAILABLE", trigger: "return_to_service" },
    ],
  },
  {
    entity: "HandlingUnit",
    tableName: "bus_handling_unit",
    statusField: "status",
    initial: "OPEN",
    terminal: ["DISMANTLED"],
    edges: [
      { from: "OPEN", to: "CLOSED", trigger: "close" },
      { from: "CLOSED", to: "OPEN", trigger: "reopen" },
      { from: "CLOSED", to: "SHIPPED", trigger: "ship" },
      { from: "SHIPPED", to: "RECEIVED", trigger: "receive" },
      { from: "RECEIVED", to: "DISMANTLED", trigger: "dismantle" },
      { from: "CLOSED", to: "DISMANTLED", trigger: "dismantle" },
    ],
  },
  {
    entity: "Putaway",
    tableName: "bus_putaway",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "PLANNED", to: "RELEASED", trigger: "release" },
      { from: "RELEASED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "COMPLETED", trigger: "complete" },
      { from: "RELEASED", to: "EXCEPTION", trigger: "mark_exception" },
      { from: "EXCEPTION", to: "RELEASED", trigger: "resolve_exception" },
      { from: "IN_PROGRESS", to: "EXCEPTION", trigger: "mark_exception" },
      { from: "EXCEPTION", to: "IN_PROGRESS", trigger: "resolve_exception" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "RELEASED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
      { from: "EXCEPTION", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Picking",
    tableName: "bus_picking",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["PICKED", "CANCELLED"],
    edges: [
      { from: "PLANNED", to: "RELEASED", trigger: "release" },
      { from: "RELEASED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "PICKED", trigger: "complete" },
      { from: "IN_PROGRESS", to: "SHORT", trigger: "short_pick" },
      { from: "SHORT", to: "RELEASED", trigger: "retry" },
      { from: "RELEASED", to: "EXCEPTION", trigger: "raise_exception" },
      { from: "IN_PROGRESS", to: "EXCEPTION", trigger: "raise_exception" },
      { from: "EXCEPTION", to: "RELEASED", trigger: "resolve" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "RELEASED", to: "CANCELLED", trigger: "cancel" },
      { from: "EXCEPTION", to: "CANCELLED", trigger: "cancel" },
      { from: "SHORT", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Packing",
    tableName: "bus_packing",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["CANCELLED"],
    edges: [
      { from: "PLANNED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "PACKED", trigger: "mark_packed" },
      { from: "IN_PROGRESS", to: "EXCEPTION", trigger: "mark_exception" },
      { from: "EXCEPTION", to: "IN_PROGRESS", trigger: "resolve_exception" },
      { from: "PACKED", to: "EXCEPTION", trigger: "mark_exception" },
      { from: "EXCEPTION", to: "PACKED", trigger: "resolve_exception" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
      { from: "PACKED", to: "CANCELLED", trigger: "cancel" },
      { from: "EXCEPTION", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Wave",
    tableName: "bus_wave",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "PLANNED", to: "RELEASED", trigger: "release" },
      { from: "RELEASED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "COMPLETED", trigger: "complete" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "RELEASED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
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
