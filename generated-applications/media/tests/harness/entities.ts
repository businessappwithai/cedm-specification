/**
 * Entity registry — generated from the ERD.
 *
 * This is the single source of truth the suites iterate over. Every entity in
 * the model appears here with the field metadata the factory needs to invent
 * realistic values and the relationship metadata the workflow suite needs to
 * wire records together.
 *
 * Generated: 2026-10-01T04:34:56.305Z
 * Project: media
 */

export type FieldType =
  | "string"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "text"
  | "json";

export interface FieldMeta {
  /** Physical column name — what the API expects in a payload. */
  name: string;
  /** Human-readable label from the Application Dictionary. */
  displayName: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  /** True for *_id columns that point at another bus_ table. */
  isForeignKey: boolean;
  /**
   * The entity a foreign key names outright, where its column name would
   * resolve elsewhere (a CEDM reference). Wins over `referencedEntity`'s rule.
   */
  references?: string;
  maxLength?: number;
  /**
   * The enum this column is bound to, when its `enum` key binds one.
   *
   * Matches a `ModelEnum.referenceId` in `model.ts`, which is where the values
   * themselves live — one copy, so the vocabulary a payload is built from and
   * the vocabulary the suites assert against cannot disagree.
   */
  enumReferenceId?: number;
}

export interface EntityMeta {
  /** ERD entity name, e.g. "Customer". */
  name: string;
  /** Physical table, e.g. "bus_customer" — the identifier the rules API uses. */
  tableName: string;
  /** Path segment for /api/bus/:entity. */
  route: string;
  displayName: string;
  primaryKey: string;
  /**
   * The entity this one is a line item of, when its `parent` says so.
   *
   * Carried from the model rather than read back from the dictionary the same
   * generator wrote — a suite that asks the application what it did and then
   * checks that answer against itself proves only self-consistency.
   */
  parentEntity?: string;
  /** The child's foreign key back to `parentEntity`. */
  parentLinkColumn?: string;
  fields: FieldMeta[];
}

export interface RelationshipMeta {
  name: string;
  sourceEntity: string;
  targetEntity: string;
  cardinality: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
  foreignKey?: string;
}

/**
 * Columns the server owns — never sent in a create/update payload.
 *
 * `is_active` is deliberately NOT here. The generator does not add it: when a
 * bus table has one it is because the model declared it, often as a required
 * field. Excluding it meant the harness could never build a valid payload for
 * those entities, and every create in the suite failed on a missing field the
 * factory was forbidden from supplying.
 */
export const SERVER_MANAGED_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "created_by",
  "updated_by",
  "version",
  "doc_status",
]);

export const entities: EntityMeta[] = [
  {
    name: "Party",
    tableName: "bus_party",
    route: "bus_party",
    displayName: "Party",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "party_type",
        displayName: "Party Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1013,
      },
      {
        name: "display_name",
        displayName: "Display Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1016,
      },
      {
        name: "external_reference",
        displayName: "External Reference",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "person_id",
        displayName: "Person",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "organization_id",
        displayName: "Organization",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
    ],
  },
  {
    name: "Person",
    tableName: "bus_person",
    route: "bus_person",
    displayName: "Person",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "party_id",
        displayName: "Party",
        type: "string",
        required: true,
        unique: true,
        isForeignKey: true,
      },
      {
        name: "title",
        displayName: "Title",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 50,
      },
      {
        name: "given_name",
        displayName: "Given Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 150,
      },
      {
        name: "middle_name",
        displayName: "Middle Name",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 150,
      },
      {
        name: "family_name",
        displayName: "Family Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 150,
      },
      {
        name: "preferred_name",
        displayName: "Preferred Name",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 150,
      },
      {
        name: "date_of_birth",
        displayName: "Date Of Birth",
        type: "date",
        required: false,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "gender",
        displayName: "Gender",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1017,
      },
      {
        name: "nationality",
        displayName: "Nationality",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 2,
      },
      {
        name: "party_type",
        displayName: "Party Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1018,
      },
      {
        name: "display_name",
        displayName: "Display Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1019,
      },
      {
        name: "external_reference",
        displayName: "External Reference",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "person_id",
        displayName: "Person",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "organization_id",
        displayName: "Organization",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
    ],
  },
  {
    name: "Organization",
    tableName: "bus_organization",
    route: "bus_organization",
    displayName: "Organization",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "party_id",
        displayName: "Party",
        type: "string",
        required: true,
        unique: true,
        isForeignKey: true,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 50,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "organization_type",
        displayName: "Organization Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1010,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1012,
      },
      {
        name: "legal_name",
        displayName: "Legal Name",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
      {
        name: "registration_number",
        displayName: "Registration Number",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "tax_identifier",
        displayName: "Tax Identifier",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "party_type",
        displayName: "Party Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1011,
      },
      {
        name: "display_name",
        displayName: "Display Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
      {
        name: "external_reference",
        displayName: "External Reference",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "person_id",
        displayName: "Person",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "parent_organization_id",
        displayName: "Parent Organization",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
    ],
  },
  {
    name: "PartyRole",
    tableName: "bus_party_role",
    route: "bus_party_role",
    displayName: "Party Role",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "party_id",
        displayName: "Party",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "role_type",
        displayName: "Role Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1014,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "valid_from",
        displayName: "Valid From",
        type: "date",
        required: false,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "valid_to",
        displayName: "Valid To",
        type: "date",
        required: false,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1015,
      },
      {
        name: "person_id",
        displayName: "Person",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "organization_id",
        displayName: "Organization",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
    ],
  },
  {
    name: "PartyRelationship",
    tableName: "bus_party_relationship",
    route: "bus_party_relationship",
    displayName: "Party Relationship",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
      {
        name: "from_party_id",
        displayName: "From Party",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: true,
        references: "Party",
      },
    ],
  },
  {
    name: "LegalEntity",
    tableName: "bus_legal_entity",
    route: "bus_legal_entity",
    displayName: "Legal Entity",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "occurred_at",
        displayName: "Occurred At",
        type: "datetime",
        required: false,
        unique: false,
        isForeignKey: false,
      },
    ],
  },
  {
    name: "BusinessUnit",
    tableName: "bus_business_unit",
    route: "bus_business_unit",
    displayName: "Business Unit",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
      {
        name: "organization_id",
        displayName: "Organization",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: true,
      },
    ],
  },
  {
    name: "Department",
    tableName: "bus_department",
    route: "bus_department",
    displayName: "Department",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
      {
        name: "organization_id",
        displayName: "Organization",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: true,
      },
    ],
  },
  {
    name: "Address",
    tableName: "bus_address",
    route: "bus_address",
    displayName: "Address",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "address_type",
        displayName: "Address Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1000,
      },
      {
        name: "line1",
        displayName: "Line1",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "line2",
        displayName: "Line2",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "line3",
        displayName: "Line3",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "city",
        displayName: "City",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 150,
      },
      {
        name: "state_or_province",
        displayName: "State Or Province",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 150,
      },
      {
        name: "postal_code",
        displayName: "Postal Code",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 30,
      },
      {
        name: "country_code",
        displayName: "Country Code",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 2,
      },
      {
        name: "latitude",
        displayName: "Latitude",
        type: "decimal",
        required: false,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "longitude",
        displayName: "Longitude",
        type: "decimal",
        required: false,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "is_primary",
        displayName: "Is Primary",
        type: "boolean",
        required: true,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1001,
      },
      {
        name: "party_id",
        displayName: "Party",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "person_id",
        displayName: "Person",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "organization_id",
        displayName: "Organization",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "location_id",
        displayName: "Location",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
    ],
  },
  {
    name: "ContactPoint",
    tableName: "bus_contact_point",
    route: "bus_contact_point",
    displayName: "Contact Point",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
      {
        name: "party_id",
        displayName: "Party",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: true,
      },
    ],
  },
  {
    name: "Location",
    tableName: "bus_location",
    route: "bus_location",
    displayName: "Location",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: true,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "location_type",
        displayName: "Location Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1005,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1006,
      },
      {
        name: "address_id",
        displayName: "Address",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "parent_location_id",
        displayName: "Parent Location",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
      {
        name: "organization_id",
        displayName: "Organization",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
      },
    ],
  },
  {
    name: "Country",
    tableName: "bus_country",
    route: "bus_country",
    displayName: "Country",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
    ],
  },
  {
    name: "Language",
    tableName: "bus_language",
    route: "bus_language",
    displayName: "Language",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
    ],
  },
  {
    name: "Currency",
    tableName: "bus_currency",
    route: "bus_currency",
    displayName: "Currency",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: true,
        isForeignKey: false,
        maxLength: 3,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "symbol",
        displayName: "Symbol",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 10,
      },
      {
        name: "decimal_places",
        displayName: "Decimal Places",
        type: "integer",
        required: true,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1002,
      },
    ],
  },
  {
    name: "ExchangeRate",
    tableName: "bus_exchange_rate",
    route: "bus_exchange_rate",
    displayName: "Exchange Rate",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "from_currency",
        displayName: "From Currency",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: true,
        references: "Currency",
      },
      {
        name: "to_currency",
        displayName: "To Currency",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: true,
        references: "Currency",
      },
      {
        name: "rate",
        displayName: "Rate",
        type: "decimal",
        required: true,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "rate_type",
        displayName: "Rate Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1003,
      },
      {
        name: "effective_at",
        displayName: "Effective At",
        type: "datetime",
        required: true,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "expires_at",
        displayName: "Expires At",
        type: "datetime",
        required: false,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "source",
        displayName: "Source",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1004,
      },
    ],
  },
  {
    name: "UnitOfMeasure",
    tableName: "bus_unit_of_measure",
    route: "bus_unit_of_measure",
    displayName: "Unit Of Measure",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: true,
        isForeignKey: false,
        maxLength: 30,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "symbol",
        displayName: "Symbol",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 20,
      },
      {
        name: "category",
        displayName: "Category",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1020,
      },
      {
        name: "conversion_factor",
        displayName: "Conversion Factor",
        type: "decimal",
        required: false,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "base_unit_id",
        displayName: "Base Unit",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
        references: "UnitOfMeasure",
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1021,
      },
    ],
  },
  {
    name: "Calendar",
    tableName: "bus_calendar",
    route: "bus_calendar",
    displayName: "Calendar",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "code",
        displayName: "Code",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "name",
        displayName: "Name",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 300,
      },
    ],
  },
  {
    name: "Attachment",
    tableName: "bus_attachment",
    route: "bus_attachment",
    displayName: "Attachment",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "effective_at",
        displayName: "Effective At",
        type: "datetime",
        required: false,
        unique: false,
        isForeignKey: false,
      },
    ],
  },
  {
    name: "MediaContent",
    tableName: "bus_media_content",
    route: "bus_media_content",
    displayName: "Media Content",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "content_code",
        displayName: "Content Code",
        type: "string",
        required: true,
        unique: true,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "title",
        displayName: "Title",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 500,
      },
      {
        name: "content_type",
        displayName: "Content Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1007,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1008,
      },
      {
        name: "owner_id",
        displayName: "Owner",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: true,
        references: "Organization",
      },
    ],
  },
  {
    name: "MediaRight",
    tableName: "bus_media_right",
    route: "bus_media_right",
    displayName: "Media Right",
    primaryKey: "id",
    parentEntity: "MediaContent",
    parentLinkColumn: "content_id",
    fields: [
      {
        name: "id",
        displayName: "Id",
        type: "string",
        required: false,
        unique: true,
        isForeignKey: false,
      },
      {
        name: "right_type",
        displayName: "Right Type",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        maxLength: 100,
      },
      {
        name: "territory",
        displayName: "Territory",
        type: "string",
        required: false,
        unique: false,
        isForeignKey: false,
        maxLength: 200,
      },
      {
        name: "valid_from",
        displayName: "Valid From",
        type: "date",
        required: false,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "valid_to",
        displayName: "Valid To",
        type: "date",
        required: false,
        unique: false,
        isForeignKey: false,
      },
      {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: false,
        enumReferenceId: 1009,
      },
      {
        name: "content_id",
        displayName: "Content",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: true,
        references: "MediaContent",
      },
      {
        name: "holder_id",
        displayName: "Holder",
        type: "string",
        required: true,
        unique: false,
        isForeignKey: true,
        references: "Party",
      },
    ],
  },
];

export const relationships: RelationshipMeta[] = [
  {
    name: "person_party",
    sourceEntity: "Person",
    targetEntity: "Party",
    cardinality: "oneToOne",
    foreignKey: "party_id",
  },
  {
    name: "organization_party",
    sourceEntity: "Organization",
    targetEntity: "Party",
    cardinality: "oneToOne",
    foreignKey: "party_id",
  },
  {
    name: "addresses",
    sourceEntity: "Party",
    targetEntity: "Address",
    cardinality: "oneToMany",
    foreignKey: "party_id",
  },
  {
    name: "party_roles",
    sourceEntity: "Party",
    targetEntity: "PartyRole",
    cardinality: "oneToMany",
    foreignKey: "party_id",
  },
  {
    name: "employer_organizations",
    sourceEntity: "Person",
    targetEntity: "Organization",
    cardinality: "oneToMany",
    foreignKey: "person_id",
  },
  {
    name: "person_person",
    sourceEntity: "Person",
    targetEntity: "Person",
    cardinality: "oneToMany",
    foreignKey: "person_id",
  },
  {
    name: "organization_person",
    sourceEntity: "Organization",
    targetEntity: "Person",
    cardinality: "oneToMany",
    foreignKey: "organization_id",
  },
  {
    name: "addresses",
    sourceEntity: "Person",
    targetEntity: "Address",
    cardinality: "oneToMany",
    foreignKey: "person_id",
  },
  {
    name: "party_roles",
    sourceEntity: "Person",
    targetEntity: "PartyRole",
    cardinality: "oneToMany",
    foreignKey: "person_id",
  },
  {
    name: "child_organizations",
    sourceEntity: "Organization",
    targetEntity: "Organization",
    cardinality: "oneToMany",
    foreignKey: "organization_id",
  },
  {
    name: "addresses",
    sourceEntity: "Organization",
    targetEntity: "Address",
    cardinality: "oneToMany",
    foreignKey: "organization_id",
  },
  {
    name: "locations",
    sourceEntity: "Organization",
    targetEntity: "Location",
    cardinality: "oneToMany",
    foreignKey: "organization_id",
  },
  {
    name: "person_organization",
    sourceEntity: "Person",
    targetEntity: "Organization",
    cardinality: "oneToMany",
    foreignKey: "person_id",
  },
  {
    name: "organization_organization",
    sourceEntity: "Organization",
    targetEntity: "Organization",
    cardinality: "oneToMany",
    foreignKey: "organization_id",
  },
  {
    name: "party_roles",
    sourceEntity: "Organization",
    targetEntity: "PartyRole",
    cardinality: "oneToMany",
    foreignKey: "organization_id",
  },
  {
    name: "from_party",
    sourceEntity: "Party",
    targetEntity: "PartyRelationship",
    cardinality: "oneToMany",
    foreignKey: "party_id",
  },
  {
    name: "organization_businessunit",
    sourceEntity: "Organization",
    targetEntity: "BusinessUnit",
    cardinality: "oneToMany",
    foreignKey: "organization_id",
  },
  {
    name: "organization_department",
    sourceEntity: "Organization",
    targetEntity: "Department",
    cardinality: "oneToMany",
    foreignKey: "organization_id",
  },
  {
    name: "location_address",
    sourceEntity: "Location",
    targetEntity: "Address",
    cardinality: "oneToMany",
    foreignKey: "location_id",
  },
  {
    name: "party_contactpoint",
    sourceEntity: "Party",
    targetEntity: "ContactPoint",
    cardinality: "oneToMany",
    foreignKey: "party_id",
  },
  {
    name: "child_locations",
    sourceEntity: "Location",
    targetEntity: "Location",
    cardinality: "oneToMany",
    foreignKey: "location_id",
  },
  {
    name: "address_location",
    sourceEntity: "Address",
    targetEntity: "Location",
    cardinality: "oneToMany",
    foreignKey: "address_id",
  },
  {
    name: "exchange_rates_from",
    sourceEntity: "Currency",
    targetEntity: "ExchangeRate",
    cardinality: "oneToMany",
    foreignKey: "currency_id",
  },
  {
    name: "exchange_rates_to",
    sourceEntity: "Currency",
    targetEntity: "ExchangeRate",
    cardinality: "oneToMany",
    foreignKey: "currency_id",
  },
  {
    name: "from_currency_ref",
    sourceEntity: "Currency",
    targetEntity: "ExchangeRate",
    cardinality: "oneToMany",
    foreignKey: "currency_id",
  },
  {
    name: "to_currency_ref",
    sourceEntity: "Currency",
    targetEntity: "ExchangeRate",
    cardinality: "oneToMany",
    foreignKey: "currency_id",
  },
  {
    name: "base_unit",
    sourceEntity: "UnitOfMeasure",
    targetEntity: "UnitOfMeasure",
    cardinality: "oneToMany",
    foreignKey: "unit_of_measure_id",
  },
  {
    name: "derived_units",
    sourceEntity: "UnitOfMeasure",
    targetEntity: "UnitOfMeasure",
    cardinality: "oneToMany",
    foreignKey: "unit_of_measure_id",
  },
  {
    name: "owner",
    sourceEntity: "Organization",
    targetEntity: "MediaContent",
    cardinality: "oneToMany",
    foreignKey: "organization_id",
  },
  {
    name: "rights",
    sourceEntity: "MediaContent",
    targetEntity: "MediaRight",
    cardinality: "oneToMany",
    foreignKey: "media_content_id",
  },
  {
    name: "holder",
    sourceEntity: "Party",
    targetEntity: "MediaRight",
    cardinality: "oneToMany",
    foreignKey: "party_id",
  },
];

/** Fields a client is allowed to write. */
export function writableFields(entity: EntityMeta): FieldMeta[] {
  return entity.fields.filter((f) => !SERVER_MANAGED_FIELDS.has(f.name));
}

/** Writable fields excluding foreign keys — safe to populate without existing parents. */
export function scalarFields(entity: EntityMeta): FieldMeta[] {
  return writableFields(entity).filter((f) => !f.isForeignKey && !f.name.endsWith("_id"));
}

export function foreignKeyFields(entity: EntityMeta): FieldMeta[] {
  return writableFields(entity).filter((f) => f.isForeignKey || f.name.endsWith("_id"));
}

/**
 * Columns whose contents the model constrains to a shape. Tests write arbitrary
 * markers into a text field to assert round-tripping and search, so a column
 * with a format rule is the wrong one to pick — writing `e2e-1785…` into
 * `email` trips the email-format rule and the create is rejected.
 */
const FORMATTED_TEXT_COLUMNS = /email|url|website|link|phone|mobile|tel|slug|signature/i;

/**
 * The first free-text field, used for search and update assertions.
 *
 * A column the model gives an enum is not free text: it holds one of the
 * declared values, its dictionary reference is a list rather than a string, and
 * the backend's `?search=` deliberately does not match against it. Writing a
 * marker into one and searching for it tests nothing the application promises,
 * so an entity whose only text columns are enums has no free-text field.
 */
export function firstTextField(entity: EntityMeta): FieldMeta | undefined {
  const textish = scalarFields(entity).filter(
    (f) => (f.type === "string" || f.type === "text") && f.enumReferenceId === undefined
  );
  return (
    textish.find((f) => !FORMATTED_TEXT_COLUMNS.test(f.name)) ??
    // Every text column is format-constrained — fall back rather than skip the
    // assertion entirely; the suite tolerates a create failure better than a
    // silent gap in coverage.
    textish[0]
  );
}

export function numericFields(entity: EntityMeta): FieldMeta[] {
  return scalarFields(entity).filter((f) => f.type === "integer" || f.type === "decimal");
}

export function getEntity(name: string): EntityMeta {
  const found = entities.find(
    (e) => e.name === name || e.tableName === name || e.route === name
  );
  if (!found) throw new Error(`Unknown entity "${name}"`);
  return found;
}

/**
 * FK columns naming a person by the role they played rather than by entity.
 * Mirrors `foreignKeys.personRoleColumns` in appwithai-language.json and the
 * backend's own COLUMN_TABLE_ALIASES.
 */
const PERSON_ROLE_COLUMNS = new Set([
  "assigned_to",
  "author_id",
  "lab_manager_id",
  "manager_id",
  "owner_id",
  "pi_id",
  "remediation_owner",
  "remediation_owner_id",
  "user_id",
]);

/**
 * Prefixes naming the role a reference plays rather than a different entity.
 * Mirrors `foreignKeys.qualifierPrefixes` in appwithai-language.json.
 */
const QUALIFIER_PREFIXES = ["parent_"];

function entityByStem(stem: string): EntityMeta | null {
  return (
    entities.find(
      (e) =>
        e.route === stem || e.tableName === `bus_${stem}` || e.name.toLowerCase() === stem.toLowerCase()
    ) ?? null
  );
}

/**
 * Map a foreign-key column (`customer_id`) to the entity it references.
 *
 * A `_by` column points at a user, so it resolves to the user entity rather
 * than to the table its name would suggest — there is no `bus_reported_by`.
 * Getting this wrong leaves a mandatory FK unset and every create in the
 * suite fails validation.
 */
export function referencedEntity(columnName: string, references?: string): EntityMeta | null {
  // A target the model named outright is the answer; the name is not consulted.
  if (references) return entities.find((e) => e.name === references) ?? null;

  if (
    columnName.endsWith("_by_id") ||
    columnName.endsWith("_by") ||
    PERSON_ROLE_COLUMNS.has(columnName)
  ) {
    const user = entityByStem("user");
    if (user) return user;
  }

  // A qualifier names the role the reference plays, not another entity: a
  // Sample's `parent_sample_id` is a Sample, and there is no
  // `bus_parent_sample` to create one in.
  const qualified = QUALIFIER_PREFIXES.find((prefix) => columnName.startsWith(prefix));
  if (qualified) {
    const stripped = columnName.slice(qualified.length);
    if (PERSON_ROLE_COLUMNS.has(stripped)) {
      const user = entityByStem("user");
      if (user) return user;
    }
    if (stripped.endsWith("_id")) {
      const parent = entityByStem(stripped.slice(0, -3));
      if (parent) return parent;
    }
  }

  if (!columnName.endsWith("_id")) return null;
  return entityByStem(columnName.slice(0, -3));
}

/**
 * Entities ordered so that a record's foreign-key targets are created first —
 * and so, reversed, that a record is deleted before anything it references.
 * Falls back to declaration order for cycles.
 *
 * The edges are every foreign-key column resolved by `referencedEntity`, the
 * same rule the suites use to fill those columns, plus the relationships the
 * model declares. Relationships alone missed every reference a column name
 * implies: `Compound.registered_by_id` is a User, but no relationship says so,
 * so Compound sorted ahead of User, the bulk seed had no user to point at, and
 * all 1000 compounds — then every alias of them — were refused.
 */
export function topologicalEntities(): EntityMeta[] {
  const byName = new Map(entities.map((e) => [e.name, e]));
  const dependencies = new Map<string, Set<string>>();

  for (const entity of entities) {
    const references = new Set<string>();
    for (const field of foreignKeyFields(entity)) {
      const target = referencedEntity(field.name, field.references);
      if (target) references.add(target.name);
    }
    dependencies.set(entity.name, references);
  }
  for (const rel of relationships) {
    // manyToOne / oneToOne: the source holds the FK, so the target must exist first.
    if (rel.cardinality === "manyToOne" || rel.cardinality === "oneToOne") {
      dependencies.get(rel.sourceEntity)?.add(rel.targetEntity);
    } else if (rel.cardinality === "oneToMany") {
      dependencies.get(rel.targetEntity)?.add(rel.sourceEntity);
    }
  }

  const ordered: EntityMeta[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (name: string): void => {
    if (visited.has(name) || visiting.has(name)) return;
    visiting.add(name);
    for (const dep of dependencies.get(name) ?? []) {
      if (dep !== name) visit(dep);
    }
    visiting.delete(name);
    visited.add(name);
    const entity = byName.get(name);
    if (entity) ordered.push(entity);
  };

  for (const entity of entities) visit(entity.name);
  return ordered;
}
