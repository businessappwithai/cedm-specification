//! Entity registry — generated from the ERD.
//!
//! The single source of truth the suites iterate over. Every entity in the
//! model appears here with the field metadata `factory` needs to invent a valid
//! payload, so adding an entity to the model adds it to the tests without
//! anyone writing a test.
//!
//! Generated: 2026-10-01T09:33:43.614Z
//! Project: procurement

/// What a column holds, which is what decides the shape of a generated value.
///
/// These mirror the `sys_reference` vocabulary the backend validates against —
/// binding a `Date` column as text is rejected by Postgres, so the factory has
/// to know the difference.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FieldType {
    String,
    Text,
    Integer,
    Decimal,
    Boolean,
    Date,
    DateTime,
    Json,
    /// A `*_id` column pointing at another `bus_` table.
    Reference,
}

impl FieldType {
    /// Map the model's own type name onto a field type.
    ///
    /// `const` so the registry below can stay a `static` rather than becoming a
    /// lazily-initialised global. A foreign key wins over the declared type:
    /// the model calls it a string, but the API wants a UUID that resolves to a
    /// real parent row.
    pub const fn from_model(model_type: &str, is_foreign_key: bool) -> Self {
        if is_foreign_key {
            return Self::Reference;
        }
        // `match` on &str is not const, so this compares bytes.
        match model_type.as_bytes() {
            b"integer" | b"int" | b"bigint" => Self::Integer,
            b"decimal" | b"float" | b"number" | b"amount" => Self::Decimal,
            b"boolean" | b"bool" => Self::Boolean,
            b"date" => Self::Date,
            b"datetime" | b"timestamp" => Self::DateTime,
            b"json" | b"jsonb" => Self::Json,
            b"text" => Self::Text,
            _ => Self::String,
        }
    }
}

/// Columns naming a person by the role they played rather than by entity.
///
/// Mirrors `PERSON_ROLE_COLUMNS` in the backend's dictionary service and
/// `foreignKeys.personRoleColumns` in the language definition. All three must
/// agree or the tests resolve a parent the API will reject.
const PERSON_ROLE_COLUMNS: &[&str] = &[
    "assigned_to",
    "author_id",
    "lab_manager_id",
    "manager_id",
    "owner_id",
    "pi_id",
    "remediation_owner",
    "remediation_owner_id",
    "user_id",
];

/// Prefixes that name the role a reference plays, not a different entity.
///
/// Mirrors `QUALIFIER_PREFIXES` in the backend's dictionary service and
/// `foreignKeys.qualifierPrefixes` in the language definition.
pub const QUALIFIER_PREFIXES: &[&str] = &["parent_"];

/// The table a foreign key points at, derived from its name.
///
/// There is no stored target — the column name carries the reference — so this
/// repeats the backend's own rule. Returning `None` is the documented fallback
/// for a column that resolves to nothing.
pub const fn ref_table_for(column: &str, is_foreign_key: bool) -> Option<&'static str> {
    if !is_foreign_key {
        return None;
    }
    // Person roles all point at the user table, by name or by `_by` suffix.
    let mut i = 0;
    while i < PERSON_ROLE_COLUMNS.len() {
        if const_str_eq(PERSON_ROLE_COLUMNS[i], column) {
            return Some("bus_user");
        }
        i += 1;
    }
    // A qualified person role resolves the same way the bare one does:
    // `parent_owner_id` names a user, exactly as `owner_id` does. Compared
    // against `prefix + role` rather than by slicing the column, because a
    // `const fn` cannot produce a `&str` subslice.
    let mut p = 0;
    while p < QUALIFIER_PREFIXES.len() {
        let mut i = 0;
        while i < PERSON_ROLE_COLUMNS.len() {
            if eq_prefixed(QUALIFIER_PREFIXES[p], PERSON_ROLE_COLUMNS[i], column) {
                return Some("bus_user");
            }
            i += 1;
        }
        p += 1;
    }
    // A suffix is unaffected by a prefix, so this needs no stripped copy:
    // `parent_reported_by_id` ends in `_by_id` either way.
    if ends_with(column, "_by_id") || ends_with(column, "_by") {
        return Some("bus_user");
    }
    // Anything else is resolved at runtime from the registry, because a `const
    // fn` cannot allocate the `bus_<stem>` string.
    None
}

/// Is `column` exactly `prefix` followed by `suffix`?
///
/// The concatenation a `const fn` cannot build, done as a comparison instead.
const fn eq_prefixed(prefix: &str, suffix: &str, column: &str) -> bool {
    let (prefix, suffix, column) = (prefix.as_bytes(), suffix.as_bytes(), column.as_bytes());
    if column.len() != prefix.len() + suffix.len() {
        return false;
    }
    let mut i = 0;
    while i < prefix.len() {
        if column[i] != prefix[i] {
            return false;
        }
        i += 1;
    }
    let mut j = 0;
    while j < suffix.len() {
        if column[prefix.len() + j] != suffix[j] {
            return false;
        }
        j += 1;
    }
    true
}

const fn const_str_eq(a: &str, b: &str) -> bool {
    let (a, b) = (a.as_bytes(), b.as_bytes());
    if a.len() != b.len() {
        return false;
    }
    let mut i = 0;
    while i < a.len() {
        if a[i] != b[i] {
            return false;
        }
        i += 1;
    }
    true
}

const fn ends_with(haystack: &str, needle: &str) -> bool {
    let (h, n) = (haystack.as_bytes(), needle.as_bytes());
    if n.len() > h.len() {
        return false;
    }
    let offset = h.len() - n.len();
    let mut i = 0;
    while i < n.len() {
        if h[offset + i] != n[i] {
            return false;
        }
        i += 1;
    }
    true
}

#[derive(Clone, Copy, Debug)]
pub struct FieldMeta {
    /// Physical column name — what the API expects in a payload.
    pub name: &'static str,
    pub field_type: FieldType,
    pub required: bool,
    /// The `bus_*` table a `Reference` points at, when it resolves to one.
    pub ref_table: Option<&'static str>,
}

#[derive(Clone, Copy, Debug)]
pub struct EntityMeta {
    /// ERD entity name, e.g. "Compound".
    pub name: &'static str,
    /// Physical table, e.g. `bus_compound` — the identifier the rules API uses.
    pub table_name: &'static str,
    /// Path segment for `/api/bus/{entity}`.
    pub route: &'static str,
    pub fields: &'static [FieldMeta],
}

/// Columns the request handler owns rather than the caller.
///
/// Mirrors `is_managed_column` in the backend's dictionary service. Sending
/// these is not an error — they are ignored — which is exactly why the suites
/// must not build assertions on them: an override of `id` looks like it was
/// accepted and then reads back as the id the server actually assigned.
pub fn is_managed(column: &str) -> bool {
    matches!(
        column,
        "id" | "version"
            | "created_at"
            | "updated_at"
            | "deleted_at"
            | "created_by"
            | "updated_by"
            | "workflow_status"
            | "workflow_run_id"
            | "doc_status"
            | "doc_status_message"
    )
}

impl EntityMeta {
    /// The fields a caller may actually write.
    ///
    /// Everything else on this type filters through here, so a server-managed
    /// column can never end up in a payload or an assertion.
    pub fn writable_fields(&self) -> impl Iterator<Item = &FieldMeta> {
        self.fields.iter().filter(|f| !is_managed(f.name))
    }

    /// Fields a create payload must carry.
    pub fn required_fields(&self) -> impl Iterator<Item = &FieldMeta> {
        self.writable_fields().filter(|f| f.required)
    }

    /// The first free-text field, for "does it persist what I sent?" assertions.
    pub fn first_text_field(&self) -> Option<&FieldMeta> {
        self.writable_fields()
            .find(|f| matches!(f.field_type, FieldType::String | FieldType::Text))
    }

    /// The first numeric field, for the rules suites' range checks.
    pub fn first_numeric_field(&self) -> Option<&FieldMeta> {
        self.writable_fields()
            .find(|f| matches!(f.field_type, FieldType::Integer | FieldType::Decimal))
    }

    /// Optional fields whose column is *not* text.
    ///
    /// This is the family an explicit JSON `null` used to break. Every NULL was
    /// bound as an untyped text parameter, and Postgres will not store text in
    /// a `numeric`, `date`, `timestamptz`, `boolean`, `uuid` or `jsonb` column
    /// — it raised 42804 and the API answered `400 A value has the wrong type
    /// or format`, so an optional field could never be cleared.
    pub fn optional_typed_fields(&self) -> impl Iterator<Item = &FieldMeta> {
        self.writable_fields().filter(|f| {
            !f.required
                && matches!(
                    f.field_type,
                    FieldType::Integer
                        | FieldType::Decimal
                        | FieldType::Boolean
                        | FieldType::Date
                        | FieldType::DateTime
                        | FieldType::Json
                        | FieldType::Reference
                )
        })
    }

    /// Foreign keys that have to be satisfied before this entity can exist.
    pub fn foreign_keys(&self) -> impl Iterator<Item = &FieldMeta> {
        self.writable_fields()
            .filter(|f| f.field_type == FieldType::Reference)
    }
}

/// Look an entity up by its ERD name. Panics on a miss: the name comes from
/// generated code, so a miss is a generator bug, not a runtime condition.
pub fn entity(name: &str) -> &'static EntityMeta {
    ENTITIES.iter().find(|e| e.name == name).unwrap_or_else(|| {
        panic!("unknown entity '{name}' — the registry is generated, so this is a generator bug")
    })
}

/// Find the entity behind a `bus_*` table name.
pub fn entity_by_table(table: &str) -> Option<&'static EntityMeta> {
    ENTITIES.iter().find(|e| e.table_name == table)
}

/// The parent entity a foreign key refers to.
///
/// `FieldMeta::ref_table` covers the person-role columns a `const fn` can
/// decide; everything else is `bus_<stem>` and is matched against the registry
/// here, where allocation is allowed.
pub fn parent_of(field: &FieldMeta) -> Option<&'static EntityMeta> {
    if let Some(table) = field.ref_table {
        return entity_by_table(table);
    }
    // A qualifier names the role the reference plays, not another entity, so it
    // is stripped before the `bus_<stem>` rule — a Sample's `parent_sample_id`
    // is a Sample. Mirrors `QUALIFIER_PREFIXES` in the backend's dictionary
    // service and `foreignKeys.qualifierPrefixes` in the language definition.
    let name = QUALIFIER_PREFIXES
        .iter()
        .find_map(|prefix| field.name.strip_prefix(prefix))
        .unwrap_or(field.name);
    let stem = name.strip_suffix("_id")?;
    entity_by_table(&format!("bus_{stem}"))
}

pub static ENTITIES: &[EntityMeta] = &[
    EntityMeta {
        name: "Party",
        table_name: "bus_party",
        route: "bus_party",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "party_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("party_type", false),
            },
            FieldMeta {
                name: "display_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("display_name", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "external_reference",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("external_reference", false),
            },
        ],
    },
    EntityMeta {
        name: "Person",
        table_name: "bus_person",
        route: "bus_person",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_id", true),
            },
            FieldMeta {
                name: "title",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("title", false),
            },
            FieldMeta {
                name: "given_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("given_name", false),
            },
            FieldMeta {
                name: "middle_name",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("middle_name", false),
            },
            FieldMeta {
                name: "family_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("family_name", false),
            },
            FieldMeta {
                name: "preferred_name",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("preferred_name", false),
            },
            FieldMeta {
                name: "date_of_birth",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("date_of_birth", false),
            },
            FieldMeta {
                name: "gender",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("gender", false),
            },
            FieldMeta {
                name: "nationality_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_country"),
            },
            FieldMeta {
                name: "party_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("party_type", false),
            },
            FieldMeta {
                name: "display_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("display_name", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "external_reference",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("external_reference", false),
            },
        ],
    },
    EntityMeta {
        name: "Organization",
        table_name: "bus_organization",
        route: "bus_organization",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_id", true),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "organization_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("organization_type", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "legal_name",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("legal_name", false),
            },
            FieldMeta {
                name: "registration_number",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("registration_number", false),
            },
            FieldMeta {
                name: "tax_identifier",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("tax_identifier", false),
            },
            FieldMeta {
                name: "party_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("party_type", false),
            },
            FieldMeta {
                name: "display_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("display_name", false),
            },
            FieldMeta {
                name: "external_reference",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("external_reference", false),
            },
            FieldMeta {
                name: "person_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("person_id", true),
            },
            FieldMeta {
                name: "parent_organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("parent_organization_id", true),
            },
        ],
    },
    EntityMeta {
        name: "PartyRole",
        table_name: "bus_party_role",
        route: "bus_party_role",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_id", true),
            },
            FieldMeta {
                name: "role_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("role_type", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "valid_from",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("valid_from", false),
            },
            FieldMeta {
                name: "valid_to",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("valid_to", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "person_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("person_id", true),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
            },
        ],
    },
    EntityMeta {
        name: "PartyRelationship",
        table_name: "bus_party_relationship",
        route: "bus_party_relationship",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "from_party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_party"),
            },
        ],
    },
    EntityMeta {
        name: "LegalEntity",
        table_name: "bus_legal_entity",
        route: "bus_legal_entity",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "occurred_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("occurred_at", false),
            },
        ],
    },
    EntityMeta {
        name: "BusinessUnit",
        table_name: "bus_business_unit",
        route: "bus_business_unit",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("organization_id", true),
            },
        ],
    },
    EntityMeta {
        name: "Department",
        table_name: "bus_department",
        route: "bus_department",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("organization_id", true),
            },
        ],
    },
    EntityMeta {
        name: "Address",
        table_name: "bus_address",
        route: "bus_address",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "address_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("address_type", false),
            },
            FieldMeta {
                name: "line1",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("line1", false),
            },
            FieldMeta {
                name: "line2",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("line2", false),
            },
            FieldMeta {
                name: "line3",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("line3", false),
            },
            FieldMeta {
                name: "city_name",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("city_name", false),
            },
            FieldMeta {
                name: "postal_code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("postal_code", false),
            },
            FieldMeta {
                name: "latitude",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("latitude", false),
            },
            FieldMeta {
                name: "longitude",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("longitude", false),
            },
            FieldMeta {
                name: "is_primary",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_primary", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("party_id", true),
            },
            FieldMeta {
                name: "person_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("person_id", true),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
            },
            FieldMeta {
                name: "country_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("country_id", true),
            },
            FieldMeta {
                name: "state_province_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("state_province_id", true),
            },
            FieldMeta {
                name: "city_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("city_id", true),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_id", true),
            },
        ],
    },
    EntityMeta {
        name: "ContactPoint",
        table_name: "bus_contact_point",
        route: "bus_contact_point",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_id", true),
            },
        ],
    },
    EntityMeta {
        name: "Location",
        table_name: "bus_location",
        route: "bus_location",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "location_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("location_type", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "address_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("address_id", true),
            },
            FieldMeta {
                name: "parent_location_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("parent_location_id", true),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
            },
            FieldMeta {
                name: "product_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("product_id", true),
            },
        ],
    },
    EntityMeta {
        name: "Country",
        table_name: "bus_country",
        route: "bus_country",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "alpha3",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("alpha3", false),
            },
            FieldMeta {
                name: "numeric_code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("numeric_code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "phone_code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("phone_code", false),
            },
            FieldMeta {
                name: "currency_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("currency_id", true),
            },
        ],
    },
    EntityMeta {
        name: "StateProvince",
        table_name: "bus_state_province",
        route: "bus_state_province",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "subdivision_type",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("subdivision_type", false),
            },
            FieldMeta {
                name: "country_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("country_id", true),
            },
        ],
    },
    EntityMeta {
        name: "City",
        table_name: "bus_city",
        route: "bus_city",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "population",
                field_type: FieldType::from_model("integer", false),
                required: false,
                ref_table: ref_table_for("population", false),
            },
            FieldMeta {
                name: "latitude",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("latitude", false),
            },
            FieldMeta {
                name: "longitude",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("longitude", false),
            },
            FieldMeta {
                name: "timezone",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("timezone", false),
            },
            FieldMeta {
                name: "is_capital",
                field_type: FieldType::from_model("boolean", false),
                required: false,
                ref_table: ref_table_for("is_capital", false),
            },
            FieldMeta {
                name: "country_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("country_id", true),
            },
            FieldMeta {
                name: "state_province_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("state_province_id", true),
            },
        ],
    },
    EntityMeta {
        name: "Language",
        table_name: "bus_language",
        route: "bus_language",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
        ],
    },
    EntityMeta {
        name: "Currency",
        table_name: "bus_currency",
        route: "bus_currency",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "symbol",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("symbol", false),
            },
            FieldMeta {
                name: "decimal_places",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("decimal_places", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
        ],
    },
    EntityMeta {
        name: "ExchangeRate",
        table_name: "bus_exchange_rate",
        route: "bus_exchange_rate",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "from_currency",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_currency"),
            },
            FieldMeta {
                name: "to_currency",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_currency"),
            },
            FieldMeta {
                name: "rate",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("rate", false),
            },
            FieldMeta {
                name: "rate_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("rate_type", false),
            },
            FieldMeta {
                name: "effective_at",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("effective_at", false),
            },
            FieldMeta {
                name: "expires_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("expires_at", false),
            },
            FieldMeta {
                name: "source",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("source", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
        ],
    },
    EntityMeta {
        name: "UnitOfMeasure",
        table_name: "bus_unit_of_measure",
        route: "bus_unit_of_measure",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "symbol",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("symbol", false),
            },
            FieldMeta {
                name: "category",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("category", false),
            },
            FieldMeta {
                name: "conversion_factor",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("conversion_factor", false),
            },
            FieldMeta {
                name: "base_unit_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_unit_of_measure"),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
        ],
    },
    EntityMeta {
        name: "Calendar",
        table_name: "bus_calendar",
        route: "bus_calendar",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
        ],
    },
    EntityMeta {
        name: "Attachment",
        table_name: "bus_attachment",
        route: "bus_attachment",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "effective_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("effective_at", false),
            },
        ],
    },
    EntityMeta {
        name: "Task",
        table_name: "bus_task",
        route: "bus_task",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "task_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("task_type", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "priority",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("priority", false),
            },
            FieldMeta {
                name: "due_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("due_at", false),
            },
            FieldMeta {
                name: "started_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("started_at", false),
            },
            FieldMeta {
                name: "completed_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("completed_at", false),
            },
            FieldMeta {
                name: "assignee_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_party"),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
            },
        ],
    },
    EntityMeta {
        name: "Supplier",
        table_name: "bus_supplier",
        route: "bus_supplier",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "party_role_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_role_id", true),
            },
            FieldMeta {
                name: "supplier_code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("supplier_code", false),
            },
            FieldMeta {
                name: "supplier_type",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("supplier_type", false),
            },
            FieldMeta {
                name: "qualification_status",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("qualification_status", false),
            },
            FieldMeta {
                name: "payment_terms",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("payment_terms", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_id", true),
            },
            FieldMeta {
                name: "role_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("role_type", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "valid_from",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("valid_from", false),
            },
            FieldMeta {
                name: "valid_to",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("valid_to", false),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
            },
        ],
    },
    EntityMeta {
        name: "PurchaseRequisition",
        table_name: "bus_purchase_requisition",
        route: "bus_purchase_requisition",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "requisition_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("requisition_number", false),
            },
            FieldMeta {
                name: "requisition_date",
                field_type: FieldType::from_model("date", false),
                required: true,
                ref_table: ref_table_for("requisition_date", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "justification",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("justification", false),
            },
            FieldMeta {
                name: "requester_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_party"),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_id", true),
            },
        ],
    },
    EntityMeta {
        name: "PurchaseRequisitionLine",
        table_name: "bus_purchase_requisition_line",
        route: "bus_purchase_requisition_line",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "line_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("line_number", false),
            },
            FieldMeta {
                name: "quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("quantity", false),
            },
            FieldMeta {
                name: "requested_date",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("requested_date", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "requisition_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_purchase_requisition"),
            },
            FieldMeta {
                name: "product_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("product_id", true),
            },
            FieldMeta {
                name: "unit_of_measure_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("unit_of_measure_id", true),
            },
        ],
    },
    EntityMeta {
        name: "RequestForQuotation",
        table_name: "bus_request_for_quotation",
        route: "bus_request_for_quotation",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "rfq_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("rfq_number", false),
            },
            FieldMeta {
                name: "issued_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("issued_at", false),
            },
            FieldMeta {
                name: "response_due_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("response_due_at", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
        ],
    },
    EntityMeta {
        name: "RequestForQuotationLine",
        table_name: "bus_request_for_quotation_line",
        route: "bus_request_for_quotation_line",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "line_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("line_number", false),
            },
            FieldMeta {
                name: "requested_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("requested_quantity", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "requisition_line_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_purchase_requisition_line"),
            },
            FieldMeta {
                name: "request_for_quotation_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("request_for_quotation_id", true),
            },
            FieldMeta {
                name: "product_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("product_id", true),
            },
            FieldMeta {
                name: "unit_of_measure_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("unit_of_measure_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierQuotation",
        table_name: "bus_supplier_quotation",
        route: "bus_supplier_quotation",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "quotation_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("quotation_number", false),
            },
            FieldMeta {
                name: "submitted_at",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("submitted_at", false),
            },
            FieldMeta {
                name: "valid_until",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("valid_until", false),
            },
            FieldMeta {
                name: "total_amount",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("total_amount", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_id", true),
            },
            FieldMeta {
                name: "request_for_quotation_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("request_for_quotation_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierQuotationLine",
        table_name: "bus_supplier_quotation_line",
        route: "bus_supplier_quotation_line",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "line_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("line_number", false),
            },
            FieldMeta {
                name: "offered_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("offered_quantity", false),
            },
            FieldMeta {
                name: "unit_price",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("unit_price", false),
            },
            FieldMeta {
                name: "promised_date",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("promised_date", false),
            },
            FieldMeta {
                name: "award_status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("award_status", false),
            },
            FieldMeta {
                name: "request_for_quotation_line_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("request_for_quotation_line_id", true),
            },
            FieldMeta {
                name: "supplier_quotation_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_quotation_id", true),
            },
            FieldMeta {
                name: "product_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("product_id", true),
            },
            FieldMeta {
                name: "unit_of_measure_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("unit_of_measure_id", true),
            },
        ],
    },
    EntityMeta {
        name: "PurchaseOrder",
        table_name: "bus_purchase_order",
        route: "bus_purchase_order",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "order_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("order_number", false),
            },
            FieldMeta {
                name: "order_date",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("order_date", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "currency_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("currency_id", true),
            },
            FieldMeta {
                name: "requested_delivery_date",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("requested_delivery_date", false),
            },
            FieldMeta {
                name: "total_amount",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("total_amount", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_id", true),
            },
            FieldMeta {
                name: "request_for_quotation_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("request_for_quotation_id", true),
            },
            FieldMeta {
                name: "supplier_quotation_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_quotation_id", true),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
            },
            FieldMeta {
                name: "delivery_location_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_location"),
            },
            FieldMeta {
                name: "supplier_performance_assessment_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_performance_assessment_id", true),
            },
        ],
    },
    EntityMeta {
        name: "PurchaseOrderLine",
        table_name: "bus_purchase_order_line",
        route: "bus_purchase_order_line",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "line_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("line_number", false),
            },
            FieldMeta {
                name: "quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("quantity", false),
            },
            FieldMeta {
                name: "unit_price",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("unit_price", false),
            },
            FieldMeta {
                name: "line_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("line_amount", false),
            },
            FieldMeta {
                name: "received_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("received_quantity", false),
            },
            FieldMeta {
                name: "accepted_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("accepted_quantity", false),
            },
            FieldMeta {
                name: "returned_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("returned_quantity", false),
            },
            FieldMeta {
                name: "outstanding_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("outstanding_quantity", false),
            },
            FieldMeta {
                name: "price_source",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("price_source", false),
            },
            FieldMeta {
                name: "price_determined_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("price_determined_at", false),
            },
            FieldMeta {
                name: "unit_of_measure_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("unit_of_measure_id", true),
            },
            FieldMeta {
                name: "supplier_quotation_line_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_quotation_line_id", true),
            },
            FieldMeta {
                name: "purchase_order_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("purchase_order_id", true),
            },
            FieldMeta {
                name: "product_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("product_id", true),
            },
            FieldMeta {
                name: "purchase_requisition_line_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("purchase_requisition_line_id", true),
            },
        ],
    },
    EntityMeta {
        name: "GoodsReceipt",
        table_name: "bus_goods_receipt",
        route: "bus_goods_receipt",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "receipt_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("receipt_number", false),
            },
            FieldMeta {
                name: "receipt_date",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("receipt_date", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "received_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("received_quantity", false),
            },
            FieldMeta {
                name: "accepted_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("accepted_quantity", false),
            },
            FieldMeta {
                name: "notes",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("notes", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_id", true),
            },
            FieldMeta {
                name: "purchase_order_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("purchase_order_id", true),
            },
            FieldMeta {
                name: "supplier_claim_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_id", true),
            },
            FieldMeta {
                name: "supplier_performance_assessment_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_performance_assessment_id", true),
            },
        ],
    },
    EntityMeta {
        name: "GoodsReceiptLine",
        table_name: "bus_goods_receipt_line",
        route: "bus_goods_receipt_line",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "line_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("line_number", false),
            },
            FieldMeta {
                name: "received_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("received_quantity", false),
            },
            FieldMeta {
                name: "accepted_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("accepted_quantity", false),
            },
            FieldMeta {
                name: "rejected_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("rejected_quantity", false),
            },
            FieldMeta {
                name: "pending_inspection_quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("pending_inspection_quantity", false),
            },
            FieldMeta {
                name: "unit_price",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("unit_price", false),
            },
            FieldMeta {
                name: "notes",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("notes", false),
            },
            FieldMeta {
                name: "unit_of_measure_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("unit_of_measure_id", true),
            },
            FieldMeta {
                name: "purchase_order_line_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("purchase_order_line_id", true),
            },
            FieldMeta {
                name: "goods_receipt_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("goods_receipt_id", true),
            },
            FieldMeta {
                name: "product_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("product_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierClaim",
        table_name: "bus_supplier_claim",
        route: "bus_supplier_claim",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "claim_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("claim_number", false),
            },
            FieldMeta {
                name: "claim_date",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("claim_date", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "claim_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("claim_type", false),
            },
            FieldMeta {
                name: "claimed_amount",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("claimed_amount", false),
            },
            FieldMeta {
                name: "resolution_code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("resolution_code", false),
            },
            FieldMeta {
                name: "notes",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("notes", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_id", true),
            },
            FieldMeta {
                name: "purchase_order_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("purchase_order_id", true),
            },
            FieldMeta {
                name: "supplier_performance_assessment_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_performance_assessment_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierClaimResolution",
        table_name: "bus_supplier_claim_resolution",
        route: "bus_supplier_claim_resolution",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "resolution_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("resolution_number", false),
            },
            FieldMeta {
                name: "resolution_date",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("resolution_date", false),
            },
            FieldMeta {
                name: "resolution_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("resolution_type", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "approved_amount",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("approved_amount", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_id", true),
            },
            FieldMeta {
                name: "supplier_claim_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_claim_id", true),
            },
            FieldMeta {
                name: "supplier_performance_assessment_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_performance_assessment_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierCreditNote",
        table_name: "bus_supplier_credit_note",
        route: "bus_supplier_credit_note",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "credit_note_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("credit_note_number", false),
            },
            FieldMeta {
                name: "credit_note_date",
                field_type: FieldType::from_model("date", false),
                required: true,
                ref_table: ref_table_for("credit_note_date", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "currency_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("currency_id", true),
            },
            FieldMeta {
                name: "subtotal",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("subtotal", false),
            },
            FieldMeta {
                name: "tax_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("tax_amount", false),
            },
            FieldMeta {
                name: "total_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("total_amount", false),
            },
            FieldMeta {
                name: "amount_applied",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("amount_applied", false),
            },
            FieldMeta {
                name: "amount_unapplied",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("amount_unapplied", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_id", true),
            },
            FieldMeta {
                name: "supplier_claim_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_id", true),
            },
            FieldMeta {
                name: "supplier_claim_resolution_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_resolution_id", true),
            },
            FieldMeta {
                name: "source_return_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_supplier_return"),
            },
        ],
    },
    EntityMeta {
        name: "SupplierCreditNoteLine",
        table_name: "bus_supplier_credit_note_line",
        route: "bus_supplier_credit_note_line",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "line_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("line_number", false),
            },
            FieldMeta {
                name: "quantity",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("quantity", false),
            },
            FieldMeta {
                name: "unit_price",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("unit_price", false),
            },
            FieldMeta {
                name: "gross_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("gross_amount", false),
            },
            FieldMeta {
                name: "discount_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("discount_amount", false),
            },
            FieldMeta {
                name: "taxable_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("taxable_amount", false),
            },
            FieldMeta {
                name: "tax_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("tax_amount", false),
            },
            FieldMeta {
                name: "net_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("net_amount", false),
            },
            FieldMeta {
                name: "supplier_credit_note_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_credit_note_id", true),
            },
            FieldMeta {
                name: "supplier_return_line_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_return_line_id", true),
            },
            FieldMeta {
                name: "invoice_line_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("invoice_line_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierCreditNoteApplication",
        table_name: "bus_supplier_credit_note_application",
        route: "bus_supplier_credit_note_application",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "supplier_credit_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("supplier_credit_amount", false),
            },
            FieldMeta {
                name: "invoice_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("invoice_amount", false),
            },
            FieldMeta {
                name: "exchange_rate_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("exchange_rate_id", true),
            },
            FieldMeta {
                name: "applied_at",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("applied_at", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "reversal_of_application_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_supplier_credit_note_application"),
            },
            FieldMeta {
                name: "supplier_credit_note_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_credit_note_id", true),
            },
            FieldMeta {
                name: "invoice_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("invoice_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierDebitNote",
        table_name: "bus_supplier_debit_note",
        route: "bus_supplier_debit_note",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "debit_note_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("debit_note_number", false),
            },
            FieldMeta {
                name: "debit_note_date",
                field_type: FieldType::from_model("date", false),
                required: true,
                ref_table: ref_table_for("debit_note_date", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "currency_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("currency_id", true),
            },
            FieldMeta {
                name: "subtotal",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("subtotal", false),
            },
            FieldMeta {
                name: "tax_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("tax_amount", false),
            },
            FieldMeta {
                name: "total_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("total_amount", false),
            },
            FieldMeta {
                name: "amount_applied",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("amount_applied", false),
            },
            FieldMeta {
                name: "amount_remaining",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("amount_remaining", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_id", true),
            },
            FieldMeta {
                name: "supplier_claim_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_id", true),
            },
            FieldMeta {
                name: "supplier_claim_resolution_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_resolution_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierDebitNoteLine",
        table_name: "bus_supplier_debit_note_line",
        route: "bus_supplier_debit_note_line",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "line_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("line_number", false),
            },
            FieldMeta {
                name: "quantity",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("quantity", false),
            },
            FieldMeta {
                name: "unit_price",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("unit_price", false),
            },
            FieldMeta {
                name: "gross_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("gross_amount", false),
            },
            FieldMeta {
                name: "tax_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("tax_amount", false),
            },
            FieldMeta {
                name: "net_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("net_amount", false),
            },
            FieldMeta {
                name: "reason_code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("reason_code", false),
            },
            FieldMeta {
                name: "supplier_debit_note_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_debit_note_id", true),
            },
            FieldMeta {
                name: "supplier_claim_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_id", true),
            },
            FieldMeta {
                name: "supplier_claim_resolution_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_resolution_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierDebitNoteApplication",
        table_name: "bus_supplier_debit_note_application",
        route: "bus_supplier_debit_note_application",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "supplier_debit_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("supplier_debit_amount", false),
            },
            FieldMeta {
                name: "invoice_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("invoice_amount", false),
            },
            FieldMeta {
                name: "exchange_rate_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("exchange_rate_id", true),
            },
            FieldMeta {
                name: "applied_at",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("applied_at", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "reversal_of_application_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_supplier_debit_note_application"),
            },
            FieldMeta {
                name: "supplier_debit_note_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_debit_note_id", true),
            },
            FieldMeta {
                name: "invoice_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("invoice_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierPerformanceAssessment",
        table_name: "bus_supplier_performance_assessment",
        route: "bus_supplier_performance_assessment",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "assessment_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("assessment_number", false),
            },
            FieldMeta {
                name: "assessment_date",
                field_type: FieldType::from_model("date", false),
                required: true,
                ref_table: ref_table_for("assessment_date", false),
            },
            FieldMeta {
                name: "period_start",
                field_type: FieldType::from_model("date", false),
                required: true,
                ref_table: ref_table_for("period_start", false),
            },
            FieldMeta {
                name: "period_end",
                field_type: FieldType::from_model("date", false),
                required: true,
                ref_table: ref_table_for("period_end", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "overall_score",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("overall_score", false),
            },
            FieldMeta {
                name: "rating",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("rating", false),
            },
            FieldMeta {
                name: "notes",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("notes", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierReturn",
        table_name: "bus_supplier_return",
        route: "bus_supplier_return",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "return_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("return_number", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "return_date",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("return_date", false),
            },
            FieldMeta {
                name: "reason_code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("reason_code", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_id", true),
            },
            FieldMeta {
                name: "purchase_order_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("purchase_order_id", true),
            },
            FieldMeta {
                name: "supplier_claim_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_id", true),
            },
            FieldMeta {
                name: "supplier_claim_resolution_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_resolution_id", true),
            },
            FieldMeta {
                name: "supplier_performance_assessment_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_performance_assessment_id", true),
            },
        ],
    },
    EntityMeta {
        name: "SupplierReturnLine",
        table_name: "bus_supplier_return_line",
        route: "bus_supplier_return_line",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "line_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("line_number", false),
            },
            FieldMeta {
                name: "quantity_returned",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("quantity_returned", false),
            },
            FieldMeta {
                name: "approved_credit_amount",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("approved_credit_amount", false),
            },
            FieldMeta {
                name: "disposition",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("disposition", false),
            },
            FieldMeta {
                name: "purchase_order_line_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("purchase_order_line_id", true),
            },
            FieldMeta {
                name: "supplier_return_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("supplier_return_id", true),
            },
        ],
    },
    EntityMeta {
        name: "Product",
        table_name: "bus_product",
        route: "bus_product",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "product_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("product_type", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "sku",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("sku", false),
            },
            FieldMeta {
                name: "unit_of_measure",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_unit_of_measure"),
            },
            FieldMeta {
                name: "standard_price",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("standard_price", false),
            },
            FieldMeta {
                name: "tax_category",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("tax_category", false),
            },
            FieldMeta {
                name: "currency_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("currency_id", true),
            },
        ],
    },
    EntityMeta {
        name: "Invoice",
        table_name: "bus_invoice",
        route: "bus_invoice",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "invoice_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("invoice_number", false),
            },
            FieldMeta {
                name: "invoice_date",
                field_type: FieldType::from_model("date", false),
                required: true,
                ref_table: ref_table_for("invoice_date", false),
            },
            FieldMeta {
                name: "due_date",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("due_date", false),
            },
            FieldMeta {
                name: "invoice_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("invoice_type", false),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
            },
            FieldMeta {
                name: "currency_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("currency_id", true),
            },
            FieldMeta {
                name: "subtotal",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("subtotal", false),
            },
            FieldMeta {
                name: "discount_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("discount_amount", false),
            },
            FieldMeta {
                name: "taxable_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("taxable_amount", false),
            },
            FieldMeta {
                name: "tax_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("tax_amount", false),
            },
            FieldMeta {
                name: "total_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("total_amount", false),
            },
            FieldMeta {
                name: "amount_settled",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("amount_settled", false),
            },
            FieldMeta {
                name: "amount_credited",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("amount_credited", false),
            },
            FieldMeta {
                name: "amount_outstanding",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("amount_outstanding", false),
            },
            FieldMeta {
                name: "supplier_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_id", true),
            },
            FieldMeta {
                name: "purchase_order_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("purchase_order_id", true),
            },
            FieldMeta {
                name: "supplier_claim_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_claim_id", true),
            },
            FieldMeta {
                name: "supplier_return_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_return_id", true),
            },
        ],
    },
    EntityMeta {
        name: "InvoiceLine",
        table_name: "bus_invoice_line",
        route: "bus_invoice_line",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "line_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("line_number", false),
            },
            FieldMeta {
                name: "quantity",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("quantity", false),
            },
            FieldMeta {
                name: "unit_price",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("unit_price", false),
            },
            FieldMeta {
                name: "gross_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("gross_amount", false),
            },
            FieldMeta {
                name: "discount_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("discount_amount", false),
            },
            FieldMeta {
                name: "taxable_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("taxable_amount", false),
            },
            FieldMeta {
                name: "tax_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("tax_amount", false),
            },
            FieldMeta {
                name: "net_amount",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("net_amount", false),
            },
            FieldMeta {
                name: "pricing_evidence",
                field_type: FieldType::from_model("json", false),
                required: false,
                ref_table: ref_table_for("pricing_evidence", false),
            },
            FieldMeta {
                name: "discount_evidence",
                field_type: FieldType::from_model("json", false),
                required: false,
                ref_table: ref_table_for("discount_evidence", false),
            },
            FieldMeta {
                name: "tax_evidence",
                field_type: FieldType::from_model("json", false),
                required: false,
                ref_table: ref_table_for("tax_evidence", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "matching_status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("matching_status", false),
            },
            FieldMeta {
                name: "unit_of_measure_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("unit_of_measure_id", true),
            },
            FieldMeta {
                name: "purchase_order_line_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("purchase_order_line_id", true),
            },
            FieldMeta {
                name: "supplier_debit_note_line_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_debit_note_line_id", true),
            },
            FieldMeta {
                name: "supplier_return_line_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("supplier_return_line_id", true),
            },
            FieldMeta {
                name: "product_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("product_id", true),
            },
            FieldMeta {
                name: "invoice_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("invoice_id", true),
            },
        ],
    },
    EntityMeta {
        name: "PartyPartyType",
        table_name: "bus_party_party_type",
        route: "bus_party_party_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "PartyStatus",
        table_name: "bus_party_status",
        route: "bus_party_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "PersonGender",
        table_name: "bus_person_gender",
        route: "bus_person_gender",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "PersonPartyType",
        table_name: "bus_person_party_type",
        route: "bus_person_party_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "PersonStatus",
        table_name: "bus_person_status",
        route: "bus_person_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "OrganizationOrganizationType",
        table_name: "bus_organization_organization_type",
        route: "bus_organization_organization_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "OrganizationStatus",
        table_name: "bus_organization_status",
        route: "bus_organization_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "OrganizationPartyType",
        table_name: "bus_organization_party_type",
        route: "bus_organization_party_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "PartyRoleRoleType",
        table_name: "bus_party_role_role_type",
        route: "bus_party_role_role_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "PartyRoleStatus",
        table_name: "bus_party_role_status",
        route: "bus_party_role_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "AddressAddressType",
        table_name: "bus_address_address_type",
        route: "bus_address_address_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "AddressStatus",
        table_name: "bus_address_status",
        route: "bus_address_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "LocationLocationType",
        table_name: "bus_location_location_type",
        route: "bus_location_location_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "LocationStatus",
        table_name: "bus_location_status",
        route: "bus_location_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "CurrencyStatus",
        table_name: "bus_currency_status",
        route: "bus_currency_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "ExchangeRateRateType",
        table_name: "bus_exchange_rate_rate_type",
        route: "bus_exchange_rate_rate_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "ExchangeRateStatus",
        table_name: "bus_exchange_rate_status",
        route: "bus_exchange_rate_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "UnitOfMeasureCategory",
        table_name: "bus_unit_of_measure_category",
        route: "bus_unit_of_measure_category",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "UnitOfMeasureStatus",
        table_name: "bus_unit_of_measure_status",
        route: "bus_unit_of_measure_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "TaskTaskType",
        table_name: "bus_task_task_type",
        route: "bus_task_task_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "TaskStatus",
        table_name: "bus_task_status",
        route: "bus_task_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "TaskPriority",
        table_name: "bus_task_priority",
        route: "bus_task_priority",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierSupplierType",
        table_name: "bus_supplier_supplier_type",
        route: "bus_supplier_supplier_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierQualificationStatus",
        table_name: "bus_supplier_qualification_status",
        route: "bus_supplier_qualification_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierStatus",
        table_name: "bus_supplier_status",
        route: "bus_supplier_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierRoleType",
        table_name: "bus_supplier_role_type",
        route: "bus_supplier_role_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "PurchaseRequisitionStatus",
        table_name: "bus_purchase_requisition_status",
        route: "bus_purchase_requisition_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "RequestForQuotationStatus",
        table_name: "bus_request_for_quotation_status",
        route: "bus_request_for_quotation_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierQuotationStatus",
        table_name: "bus_supplier_quotation_status",
        route: "bus_supplier_quotation_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierQuotationLineAwardStatus",
        table_name: "bus_supplier_quotation_line_award_status",
        route: "bus_supplier_quotation_line_award_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "PurchaseOrderStatus",
        table_name: "bus_purchase_order_status",
        route: "bus_purchase_order_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "PurchaseOrderLinePriceSource",
        table_name: "bus_purchase_order_line_price_source",
        route: "bus_purchase_order_line_price_source",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "GoodsReceiptStatus",
        table_name: "bus_goods_receipt_status",
        route: "bus_goods_receipt_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierClaimStatus",
        table_name: "bus_supplier_claim_status",
        route: "bus_supplier_claim_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierClaimClaimType",
        table_name: "bus_supplier_claim_claim_type",
        route: "bus_supplier_claim_claim_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierClaimResolutionCode",
        table_name: "bus_supplier_claim_resolution_code",
        route: "bus_supplier_claim_resolution_code",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierClaimResolutionResolutionType",
        table_name: "bus_supplier_claim_resolution_resolution_type",
        route: "bus_supplier_claim_resolution_resolution_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierClaimResolutionStatus",
        table_name: "bus_supplier_claim_resolution_status",
        route: "bus_supplier_claim_resolution_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierCreditNoteStatus",
        table_name: "bus_supplier_credit_note_status",
        route: "bus_supplier_credit_note_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierCreditNoteApplicationStatus",
        table_name: "bus_supplier_credit_note_application_status",
        route: "bus_supplier_credit_note_application_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierDebitNoteStatus",
        table_name: "bus_supplier_debit_note_status",
        route: "bus_supplier_debit_note_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierDebitNoteApplicationStatus",
        table_name: "bus_supplier_debit_note_application_status",
        route: "bus_supplier_debit_note_application_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierPerformanceAssessmentStatus",
        table_name: "bus_supplier_performance_assessment_status",
        route: "bus_supplier_performance_assessment_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierPerformanceAssessmentRating",
        table_name: "bus_supplier_performance_assessment_rating",
        route: "bus_supplier_performance_assessment_rating",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierReturnStatus",
        table_name: "bus_supplier_return_status",
        route: "bus_supplier_return_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "SupplierReturnLineDisposition",
        table_name: "bus_supplier_return_line_disposition",
        route: "bus_supplier_return_line_disposition",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "ProductProductType",
        table_name: "bus_product_product_type",
        route: "bus_product_product_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "ProductStatus",
        table_name: "bus_product_status",
        route: "bus_product_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "InvoiceInvoiceType",
        table_name: "bus_invoice_invoice_type",
        route: "bus_invoice_invoice_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "InvoiceStatus",
        table_name: "bus_invoice_status",
        route: "bus_invoice_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
    EntityMeta {
        name: "InvoiceLineMatchingStatus",
        table_name: "bus_invoice_line_matching_status",
        route: "bus_invoice_line_matching_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
            },
        ],
    },
];
