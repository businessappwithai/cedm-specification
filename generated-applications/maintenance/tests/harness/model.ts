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
 * Generated: 2026-10-16T07:47:37.599Z
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
    name: "AttachmentStatus",
    referenceId: 1003,
    values: ["ACTIVE", "WITHDRAWN"],
  },
  {
    name: "BusinessUnitStatus",
    referenceId: 1004,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "CalendarExceptionExceptionType",
    referenceId: 1005,
    values: ["PUBLIC_HOLIDAY", "COMPANY_CLOSURE", "EXTRA_WORKING_DAY"],
  },
  {
    name: "CalendarStatus",
    referenceId: 1006,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "ContactPointChannel",
    referenceId: 1007,
    values: ["EMAIL", "PHONE", "MOBILE", "FAX", "WEBSITE", "MESSAGING"],
  },
  {
    name: "ContactPointPurpose",
    referenceId: 1008,
    values: ["GENERAL", "BILLING", "ORDERS", "DELIVERY", "SUPPORT", "MARKETING"],
  },
  {
    name: "ContactPointStatus",
    referenceId: 1009,
    values: ["ACTIVE", "INACTIVE", "INVALID"],
  },
  {
    name: "ContainerStatus",
    referenceId: 1010,
    values: ["ACTIVE", "IN_REPAIR", "DAMAGED", "SOLD", "SCRAPPED", "LOST", "RETIRED"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1011,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "DepartmentStatus",
    referenceId: 1012,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "EquipmentCriticality",
    referenceId: 1013,
    values: ["A", "B", "C"],
  },
  {
    name: "EquipmentOperatingStatus",
    referenceId: 1014,
    values: ["IN_OPERATION", "DOWN", "STANDBY", "DECOMMISSIONED"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1015,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1016,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "FailureSeverity",
    referenceId: 1017,
    values: ["MINOR", "MAJOR", "CRITICAL"],
  },
  {
    name: "FailureStatus",
    referenceId: 1018,
    values: ["REPORTED", "UNDER_REPAIR", "REPAIRED", "CLOSED", "CANCELLED"],
  },
  {
    name: "LanguageDirection",
    referenceId: 1019,
    values: ["LTR", "RTL"],
  },
  {
    name: "LegalEntityStatus",
    referenceId: 1020,
    values: ["ACTIVE", "DORMANT", "IN_LIQUIDATION", "DISSOLVED"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1021,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1022,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "MaintenancePlanFrequencyUnit",
    referenceId: 1023,
    values: ["HOURS", "DAYS", "WEEKS", "MONTHS", "MILES", "CYCLES", "OTHER"],
  },
  {
    name: "MaintenancePlanMaintenanceType",
    referenceId: 1024,
    values: ["PREVENTIVE", "CONDITION_BASED", "PREDICTIVE", "INSPECTION"],
  },
  {
    name: "MaintenancePlanStatus",
    referenceId: 1025,
    values: ["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"],
  },
  {
    name: "MaintenanceWorkOrderPriority",
    referenceId: 1026,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "MaintenanceWorkOrderStatus",
    referenceId: 1027,
    values: ["OPEN", "PLANNED", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"],
  },
  {
    name: "MaintenanceWorkOrderWorkType",
    referenceId: 1028,
    values: ["INSPECTION", "PREVENTIVE", "CORRECTIVE", "REPAIR", "EMERGENCY"],
  },
  {
    name: "MeterMeterType",
    referenceId: 1029,
    values: ["HOURS", "DISTANCE", "CYCLES", "ENERGY", "VOLUME", "COUNT", "PRESSURE", "TEMPERATURE", "OTHER"],
  },
  {
    name: "MeterStatus",
    referenceId: 1030,
    values: ["DRAFT", "ACTIVE", "OUT_OF_SERVICE", "RETIRED"],
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
    name: "PartyPartyType",
    referenceId: 1034,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRelationshipRelationshipType",
    referenceId: 1035,
    values: ["SUBSIDIARY_OF", "BRANCH_OF", "EMPLOYEE_OF", "AGENT_OF", "GUARANTOR_FOR", "BENEFICIAL_OWNER_OF", "HOUSEHOLD_MEMBER_OF", "OTHER"],
  },
  {
    name: "PartyRelationshipStatus",
    referenceId: 1036,
    values: ["ACTIVE", "ENDED"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1037,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1038,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1039,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1040,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1041,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1042,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "ProductProductType",
    referenceId: 1043,
    values: ["GOOD", "MATERIAL", "SERVICE", "SUBSCRIPTION", "ASSET", "BUNDLE", "OTHER"],
  },
  {
    name: "ProductStatus",
    referenceId: 1044,
    values: ["DRAFT", "ACTIVE", "DISCONTINUED", "BLOCKED", "RETIRED"],
  },
  {
    name: "RepairEstimateDisposition",
    referenceId: 1045,
    values: ["LEASE", "SALE", "SCRAP", "REPAIR", "HOLD"],
  },
  {
    name: "RepairEstimateStatus",
    referenceId: 1046,
    values: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"],
  },
  {
    name: "SparePartCriticality",
    referenceId: 1047,
    values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  },
  {
    name: "SparePartStatus",
    referenceId: 1048,
    values: ["ACTIVE", "OBSOLETE"],
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
    entity: "Asset",
    tableName: "bus_asset",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["DISPOSED", "RETIRED"],
    edges: [
      { from: "PLANNED", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "UNDER_MAINTENANCE", trigger: "mark_under_maintenance" },
      { from: "UNDER_MAINTENANCE", to: "ACTIVE", trigger: "return_to_service" },
      { from: "ACTIVE", to: "HELD", trigger: "mark_held" },
      { from: "HELD", to: "ACTIVE", trigger: "resume" },
      { from: "ACTIVE", to: "DISPOSED", trigger: "mark_disposed" },
      { from: "UNDER_MAINTENANCE", to: "DISPOSED", trigger: "mark_disposed" },
      { from: "HELD", to: "DISPOSED", trigger: "mark_disposed" },
      { from: "PLANNED", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "UNDER_MAINTENANCE", to: "RETIRED", trigger: "retire" },
      { from: "HELD", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Meter",
    tableName: "bus_meter",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["RETIRED"],
    edges: [
      { from: "DRAFT", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "OUT_OF_SERVICE", trigger: "take_out_of_service" },
      { from: "OUT_OF_SERVICE", to: "ACTIVE", trigger: "return_to_service" },
      { from: "DRAFT", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "OUT_OF_SERVICE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "MaintenancePlan",
    tableName: "bus_maintenance_plan",
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
    entity: "MaintenanceWorkOrder",
    tableName: "bus_maintenance_work_order",
    statusField: "status",
    initial: "OPEN",
    terminal: ["COMPLETED", "CANCELLED"],
    edges: [
      { from: "OPEN", to: "PLANNED", trigger: "plan" },
      { from: "PLANNED", to: "ASSIGNED", trigger: "assign" },
      { from: "OPEN", to: "ASSIGNED", trigger: "assign" },
      { from: "ASSIGNED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "COMPLETED", trigger: "complete" },
      { from: "ASSIGNED", to: "ON_HOLD", trigger: "hold" },
      { from: "IN_PROGRESS", to: "ON_HOLD", trigger: "hold" },
      { from: "ON_HOLD", to: "ASSIGNED", trigger: "resume" },
      { from: "ON_HOLD", to: "IN_PROGRESS", trigger: "resume" },
      { from: "OPEN", to: "CANCELLED", trigger: "cancel" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "ASSIGNED", to: "CANCELLED", trigger: "cancel" },
      { from: "ON_HOLD", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "RepairEstimate",
    tableName: "bus_repair_estimate",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["COMPLETED", "REJECTED", "CANCELLED"],
    edges: [
      { from: "DRAFT", to: "SUBMITTED", trigger: "submit" },
      { from: "SUBMITTED", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "COMPLETED", trigger: "complete" },
      { from: "DRAFT", to: "REJECTED", trigger: "reject" },
      { from: "SUBMITTED", to: "REJECTED", trigger: "reject" },
      { from: "APPROVED", to: "REJECTED", trigger: "reject" },
      { from: "DRAFT", to: "CANCELLED", trigger: "cancel" },
      { from: "SUBMITTED", to: "CANCELLED", trigger: "cancel" },
      { from: "APPROVED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "Equipment",
    tableName: "bus_equipment",
    statusField: "workflow_status",
    initial: "IN_OPERATION",
    terminal: ["DECOMMISSIONED"],
    edges: [
      { from: "IN_OPERATION", to: "DOWN", trigger: "stop" },
      { from: "DOWN", to: "IN_OPERATION", trigger: "restart" },
      { from: "IN_OPERATION", to: "STANDBY", trigger: "stand_by" },
      { from: "STANDBY", to: "IN_OPERATION", trigger: "start" },
      { from: "STANDBY", to: "DOWN", trigger: "stop" },
      { from: "IN_OPERATION", to: "DECOMMISSIONED", trigger: "decommission" },
      { from: "DOWN", to: "DECOMMISSIONED", trigger: "decommission" },
      { from: "STANDBY", to: "DECOMMISSIONED", trigger: "decommission" },
    ],
  },
  {
    entity: "Failure",
    tableName: "bus_failure",
    statusField: "status",
    initial: "REPORTED",
    terminal: ["CLOSED", "CANCELLED"],
    edges: [
      { from: "REPORTED", to: "UNDER_REPAIR", trigger: "start_repair" },
      { from: "UNDER_REPAIR", to: "REPAIRED", trigger: "repair" },
      { from: "REPORTED", to: "REPAIRED", trigger: "repair" },
      { from: "REPAIRED", to: "CLOSED", trigger: "close" },
      { from: "REPORTED", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "SparePart",
    tableName: "bus_spare_part",
    statusField: "status",
    initial: "ACTIVE",
    terminal: ["OBSOLETE"],
    edges: [
      { from: "ACTIVE", to: "OBSOLETE", trigger: "make_obsolete" },
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
