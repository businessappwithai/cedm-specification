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
 * Generated: 2026-10-16T07:45:34.939Z
 * Project: compliance
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
    name: "AuditCaseAuditType",
    referenceId: 1003,
    values: ["INTERNAL", "EXTERNAL", "REGULATORY", "CERTIFICATION", "SUPPLIER"],
  },
  {
    name: "AuditCaseOpinion",
    referenceId: 1004,
    values: ["SATISFACTORY", "NEEDS_IMPROVEMENT", "UNSATISFACTORY", "NOT_RATED"],
  },
  {
    name: "AuditCaseStatus",
    referenceId: 1005,
    values: ["PLANNED", "IN_PROGRESS", "REPORTED", "CLOSED", "CANCELLED"],
  },
  {
    name: "AuditEventCategory",
    referenceId: 1006,
    values: ["AUTHENTICATION", "AUTHORIZATION", "DATA_CHANGE", "DATA_ACCESS", "APPROVAL", "CONFIGURATION", "SYSTEM"],
  },
  {
    name: "AuditEventOutcome",
    referenceId: 1007,
    values: ["SUCCESS", "FAILURE", "DENIED"],
  },
  {
    name: "BusinessUnitStatus",
    referenceId: 1008,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "CalendarExceptionExceptionType",
    referenceId: 1009,
    values: ["PUBLIC_HOLIDAY", "COMPANY_CLOSURE", "EXTRA_WORKING_DAY"],
  },
  {
    name: "CalendarStatus",
    referenceId: 1010,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "ComplianceRequirementObligationLevel",
    referenceId: 1011,
    values: ["MANDATORY", "RECOMMENDED", "OPTIONAL"],
  },
  {
    name: "ComplianceRequirementRiskRating",
    referenceId: 1012,
    values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  },
  {
    name: "ComplianceRequirementSourceType",
    referenceId: 1013,
    values: ["LAW", "REGULATION", "STANDARD", "CONTRACT", "INTERNAL_POLICY"],
  },
  {
    name: "ComplianceRequirementStatus",
    referenceId: 1014,
    values: ["IDENTIFIED", "ACTIVE", "NOT_APPLICABLE", "RETIRED"],
  },
  {
    name: "ContactPointChannel",
    referenceId: 1015,
    values: ["EMAIL", "PHONE", "MOBILE", "FAX", "WEBSITE", "MESSAGING"],
  },
  {
    name: "ContactPointPurpose",
    referenceId: 1016,
    values: ["GENERAL", "BILLING", "ORDERS", "DELIVERY", "SUPPORT", "MARKETING"],
  },
  {
    name: "ContactPointStatus",
    referenceId: 1017,
    values: ["ACTIVE", "INACTIVE", "INVALID"],
  },
  {
    name: "ControlAutomation",
    referenceId: 1018,
    values: ["MANUAL", "SEMI_AUTOMATED", "AUTOMATED"],
  },
  {
    name: "ControlControlType",
    referenceId: 1019,
    values: ["PREVENTIVE", "DETECTIVE", "CORRECTIVE", "DIRECTIVE"],
  },
  {
    name: "ControlEffectiveness",
    referenceId: 1020,
    values: ["NOT_TESTED", "EFFECTIVE", "PARTIALLY_EFFECTIVE", "INEFFECTIVE"],
  },
  {
    name: "ControlFrequency",
    referenceId: 1021,
    values: ["CONTINUOUS", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "EVENT_DRIVEN", "AD_HOC"],
  },
  {
    name: "ControlStatus",
    referenceId: 1022,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "CurrencyStatus",
    referenceId: 1023,
    values: ["ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "DepartmentStatus",
    referenceId: 1024,
    values: ["ACTIVE", "INACTIVE"],
  },
  {
    name: "ExchangeRateRateType",
    referenceId: 1025,
    values: ["SPOT", "CONTRACT", "DAILY", "MONTHLY", "ACCOUNTING", "CUSTOM"],
  },
  {
    name: "ExchangeRateStatus",
    referenceId: 1026,
    values: ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"],
  },
  {
    name: "FilingFilingType",
    referenceId: 1027,
    values: ["COURT", "REGULATORY", "CORPORATE_REGISTRY", "TAX", "INTELLECTUAL_PROPERTY", "OTHER"],
  },
  {
    name: "FilingStatus",
    referenceId: 1028,
    values: ["REQUIRED", "IN_PREPARATION", "SUBMITTED", "ACCEPTED", "REJECTED", "WITHDRAWN"],
  },
  {
    name: "FindingSeverity",
    referenceId: 1029,
    values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  },
  {
    name: "FindingStatus",
    referenceId: 1030,
    values: ["OPEN", "IN_REMEDIATION", "REMEDIATED", "CLOSED", "RISK_ACCEPTED"],
  },
  {
    name: "LanguageDirection",
    referenceId: 1031,
    values: ["LTR", "RTL"],
  },
  {
    name: "LegalEntityStatus",
    referenceId: 1032,
    values: ["ACTIVE", "DORMANT", "IN_LIQUIDATION", "DISSOLVED"],
  },
  {
    name: "LocationLocationType",
    referenceId: 1033,
    values: ["SITE", "WAREHOUSE", "STORE", "OFFICE", "FACTORY", "YARD", "PORT", "DEPOT", "VIRTUAL", "OTHER"],
  },
  {
    name: "LocationStatus",
    referenceId: 1034,
    values: ["PLANNED", "ACTIVE", "INACTIVE", "CLOSED", "RETIRED"],
  },
  {
    name: "LossEventEventCategory",
    referenceId: 1035,
    values: ["INTERNAL_FRAUD", "EXTERNAL_FRAUD", "EMPLOYMENT_PRACTICES", "CLIENTS_PRODUCTS", "PHYSICAL_ASSETS", "SYSTEMS_FAILURE", "EXECUTION_AND_PROCESS"],
  },
  {
    name: "LossEventStatus",
    referenceId: 1036,
    values: ["IDENTIFIED", "ASSESSED", "CLOSED", "WITHDRAWN"],
  },
  {
    name: "ObligationFrequency",
    referenceId: 1037,
    values: ["ONCE", "MONTHLY", "QUARTERLY", "ANNUAL", "ONGOING"],
  },
  {
    name: "ObligationObligationType",
    referenceId: 1038,
    values: ["PAYMENT", "DELIVERY", "REPORTING", "PERFORMANCE", "CONFIDENTIALITY", "RESTRICTION"],
  },
  {
    name: "ObligationStatus",
    referenceId: 1039,
    values: ["PENDING", "MET", "WAIVED", "BREACHED"],
  },
  {
    name: "OrganizationOrganizationType",
    referenceId: 1040,
    values: ["ENTERPRISE", "COMPANY", "BUSINESS_UNIT", "DIVISION", "DEPARTMENT", "BRANCH", "SUBSIDIARY", "OTHER"],
  },
  {
    name: "OrganizationPartyType",
    referenceId: 1041,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "OrganizationStatus",
    referenceId: 1042,
    values: ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED"],
  },
  {
    name: "PartyPartyType",
    referenceId: 1043,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PartyRelationshipRelationshipType",
    referenceId: 1044,
    values: ["SUBSIDIARY_OF", "BRANCH_OF", "EMPLOYEE_OF", "AGENT_OF", "GUARANTOR_FOR", "BENEFICIAL_OWNER_OF", "HOUSEHOLD_MEMBER_OF", "OTHER"],
  },
  {
    name: "PartyRelationshipStatus",
    referenceId: 1045,
    values: ["ACTIVE", "ENDED"],
  },
  {
    name: "PartyRoleRoleType",
    referenceId: 1046,
    values: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "PARTNER", "CARRIER", "AGENT", "CONTRACTOR", "OWNER", "INVESTOR", "OTHER"],
  },
  {
    name: "PartyRoleStatus",
    referenceId: 1047,
    values: ["ACTIVE", "INACTIVE", "EXPIRED"],
  },
  {
    name: "PartyStatus",
    referenceId: 1048,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PersonGender",
    referenceId: 1049,
    values: ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNSPECIFIED"],
  },
  {
    name: "PersonPartyType",
    referenceId: 1050,
    values: ["PERSON", "ORGANIZATION"],
  },
  {
    name: "PersonStatus",
    referenceId: 1051,
    values: ["ACTIVE", "INACTIVE", "BLOCKED", "RETIRED"],
  },
  {
    name: "PolicyStatus",
    referenceId: 1052,
    values: ["DRAFT", "APPROVED", "ACTIVE", "SUSPENDED", "RETIRED"],
  },
  {
    name: "RiskAssessmentInherentImpact",
    referenceId: 1053,
    values: ["INSIGNIFICANT", "MINOR", "MODERATE", "MAJOR", "SEVERE"],
  },
  {
    name: "RiskAssessmentInherentLikelihood",
    referenceId: 1054,
    values: ["RARE", "UNLIKELY", "POSSIBLE", "LIKELY", "ALMOST_CERTAIN"],
  },
  {
    name: "RiskAssessmentResidualImpact",
    referenceId: 1055,
    values: ["INSIGNIFICANT", "MINOR", "MODERATE", "MAJOR", "SEVERE"],
  },
  {
    name: "RiskAssessmentResidualLikelihood",
    referenceId: 1056,
    values: ["RARE", "UNLIKELY", "POSSIBLE", "LIKELY", "ALMOST_CERTAIN"],
  },
  {
    name: "RiskAssessmentResidualRating",
    referenceId: 1057,
    values: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
  },
  {
    name: "RiskAssessmentStatus",
    referenceId: 1058,
    values: ["DRAFT", "SUBMITTED", "APPROVED", "SUPERSEDED"],
  },
  {
    name: "RiskImpact",
    referenceId: 1059,
    values: ["INSIGNIFICANT", "MINOR", "MODERATE", "MAJOR", "SEVERE"],
  },
  {
    name: "RiskLikelihood",
    referenceId: 1060,
    values: ["RARE", "UNLIKELY", "POSSIBLE", "LIKELY", "ALMOST_CERTAIN"],
  },
  {
    name: "RiskStatus",
    referenceId: 1061,
    values: ["IDENTIFIED", "ASSESSED", "MITIGATING", "ACCEPTED", "CLOSED", "MATERIALIZED"],
  },
  {
    name: "RiskTreatmentStatus",
    referenceId: 1062,
    values: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
  },
  {
    name: "RiskTreatmentStrategy",
    referenceId: 1063,
    values: ["REDUCE", "AVOID", "TRANSFER", "ACCEPT"],
  },
  {
    name: "RiskTreatmentTargetRating",
    referenceId: 1064,
    values: ["LOW", "MEDIUM", "HIGH"],
  },
  {
    name: "TaskPriority",
    referenceId: 1065,
    values: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
  },
  {
    name: "TaskStatus",
    referenceId: 1066,
    values: ["CREATED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "FAILED"],
  },
  {
    name: "TaskTaskType",
    referenceId: 1067,
    values: ["USER", "SYSTEM", "APPROVAL", "DECISION", "NOTIFICATION", "SCRIPT", "OTHER"],
  },
  {
    name: "UnitOfMeasureCategory",
    referenceId: 1068,
    values: ["QUANTITY", "LENGTH", "AREA", "VOLUME", "MASS", "TIME", "COUNT", "CURRENCY", "OTHER"],
  },
  {
    name: "UnitOfMeasureStatus",
    referenceId: 1069,
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
    entity: "Policy",
    tableName: "bus_policy",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["RETIRED"],
    edges: [
      { from: "DRAFT", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "ACTIVE", trigger: "activate" },
      { from: "APPROVED", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "APPROVED", trigger: "resume" },
      { from: "ACTIVE", to: "SUSPENDED", trigger: "suspend" },
      { from: "SUSPENDED", to: "ACTIVE", trigger: "resume" },
      { from: "DRAFT", to: "RETIRED", trigger: "retire" },
      { from: "APPROVED", to: "RETIRED", trigger: "retire" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "SUSPENDED", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Control",
    tableName: "bus_control",
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
    entity: "Risk",
    tableName: "bus_risk",
    statusField: "status",
    initial: "IDENTIFIED",
    terminal: ["CLOSED", "MATERIALIZED"],
    edges: [
      { from: "IDENTIFIED", to: "ASSESSED", trigger: "assess" },
      { from: "ASSESSED", to: "MITIGATING", trigger: "mitigate" },
      { from: "ASSESSED", to: "ACCEPTED", trigger: "accept" },
      { from: "MITIGATING", to: "ACCEPTED", trigger: "accept" },
      { from: "ACCEPTED", to: "CLOSED", trigger: "close" },
      { from: "MITIGATING", to: "CLOSED", trigger: "close" },
      { from: "IDENTIFIED", to: "MATERIALIZED", trigger: "materialize" },
      { from: "ASSESSED", to: "MATERIALIZED", trigger: "materialize" },
      { from: "MITIGATING", to: "MATERIALIZED", trigger: "materialize" },
      { from: "ACCEPTED", to: "MATERIALIZED", trigger: "materialize" },
    ],
  },
  {
    entity: "AuditCase",
    tableName: "bus_audit_case",
    statusField: "status",
    initial: "PLANNED",
    terminal: ["CLOSED", "CANCELLED"],
    edges: [
      { from: "PLANNED", to: "IN_PROGRESS", trigger: "start" },
      { from: "IN_PROGRESS", to: "REPORTED", trigger: "report" },
      { from: "REPORTED", to: "CLOSED", trigger: "close" },
      { from: "PLANNED", to: "CANCELLED", trigger: "cancel" },
      { from: "IN_PROGRESS", to: "CANCELLED", trigger: "cancel" },
    ],
  },
  {
    entity: "ComplianceRequirement",
    tableName: "bus_compliance_requirement",
    statusField: "status",
    initial: "IDENTIFIED",
    terminal: ["RETIRED"],
    edges: [
      { from: "IDENTIFIED", to: "ACTIVE", trigger: "activate" },
      { from: "IDENTIFIED", to: "NOT_APPLICABLE", trigger: "mark_not_applicable" },
      { from: "NOT_APPLICABLE", to: "ACTIVE", trigger: "activate" },
      { from: "ACTIVE", to: "RETIRED", trigger: "retire" },
      { from: "NOT_APPLICABLE", to: "RETIRED", trigger: "retire" },
    ],
  },
  {
    entity: "Finding",
    tableName: "bus_finding",
    statusField: "status",
    initial: "OPEN",
    terminal: ["CLOSED", "RISK_ACCEPTED"],
    edges: [
      { from: "OPEN", to: "IN_REMEDIATION", trigger: "agree_action" },
      { from: "IN_REMEDIATION", to: "REMEDIATED", trigger: "remediate" },
      { from: "REMEDIATED", to: "CLOSED", trigger: "verify" },
      { from: "REMEDIATED", to: "IN_REMEDIATION", trigger: "reject_fix" },
      { from: "OPEN", to: "RISK_ACCEPTED", trigger: "accept_risk" },
      { from: "IN_REMEDIATION", to: "RISK_ACCEPTED", trigger: "accept_risk" },
    ],
  },
  {
    entity: "RiskAssessment",
    tableName: "bus_risk_assessment",
    statusField: "status",
    initial: "DRAFT",
    terminal: ["SUPERSEDED"],
    edges: [
      { from: "DRAFT", to: "SUBMITTED", trigger: "submit" },
      { from: "SUBMITTED", to: "DRAFT", trigger: "return" },
      { from: "SUBMITTED", to: "APPROVED", trigger: "approve" },
      { from: "APPROVED", to: "SUPERSEDED", trigger: "supersede" },
    ],
  },
  {
    entity: "RiskTreatment",
    tableName: "bus_risk_treatment",
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
    entity: "Filing",
    tableName: "bus_filing",
    statusField: "status",
    initial: "REQUIRED",
    terminal: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
    edges: [
      { from: "REQUIRED", to: "IN_PREPARATION", trigger: "start" },
      { from: "IN_PREPARATION", to: "SUBMITTED", trigger: "submit" },
      { from: "REQUIRED", to: "SUBMITTED", trigger: "submit" },
      { from: "SUBMITTED", to: "ACCEPTED", trigger: "accept" },
      { from: "SUBMITTED", to: "REJECTED", trigger: "reject" },
      { from: "REQUIRED", to: "WITHDRAWN", trigger: "withdraw" },
      { from: "IN_PREPARATION", to: "WITHDRAWN", trigger: "withdraw" },
      { from: "SUBMITTED", to: "WITHDRAWN", trigger: "withdraw" },
    ],
  },
  {
    entity: "Obligation",
    tableName: "bus_obligation",
    statusField: "status",
    initial: "PENDING",
    terminal: ["MET", "WAIVED"],
    edges: [
      { from: "PENDING", to: "MET", trigger: "meet" },
      { from: "PENDING", to: "WAIVED", trigger: "waive" },
      { from: "PENDING", to: "BREACHED", trigger: "breach" },
      { from: "BREACHED", to: "MET", trigger: "cure" },
      { from: "BREACHED", to: "WAIVED", trigger: "waive" },
    ],
  },
  {
    entity: "LossEvent",
    tableName: "bus_loss_event",
    statusField: "status",
    initial: "IDENTIFIED",
    terminal: ["CLOSED", "WITHDRAWN"],
    edges: [
      { from: "IDENTIFIED", to: "ASSESSED", trigger: "assess" },
      { from: "ASSESSED", to: "CLOSED", trigger: "close" },
      { from: "IDENTIFIED", to: "WITHDRAWN", trigger: "withdraw" },
      { from: "ASSESSED", to: "WITHDRAWN", trigger: "withdraw" },
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
