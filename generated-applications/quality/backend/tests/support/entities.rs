//! Entity registry — generated from the ERD.
//!
//! The single source of truth the suites iterate over. Every entity in the
//! model appears here with the field metadata `factory` needs to invent a valid
//! payload, so adding an entity to the model adds it to the tests without
//! anyone writing a test.
//!
//! Generated: 2026-10-09T08:32:31.658Z
//! Project: quality

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
    /// The longest value the column accepts, when the model states one. A
    /// two-letter ISO code rejects the factory's usual `e2e-code-…` string, and
    /// the failure surfaces as "could not create the record".
    pub max_length: Option<usize>,
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
                max_length: None,
            },
            FieldMeta {
                name: "party_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("party_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "display_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("display_name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "external_reference",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("external_reference", false),
                max_length: Some(200),
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
                max_length: None,
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "title",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("title", false),
                max_length: Some(50),
            },
            FieldMeta {
                name: "given_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("given_name", false),
                max_length: Some(150),
            },
            FieldMeta {
                name: "middle_name",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("middle_name", false),
                max_length: Some(150),
            },
            FieldMeta {
                name: "family_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("family_name", false),
                max_length: Some(150),
            },
            FieldMeta {
                name: "preferred_name",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("preferred_name", false),
                max_length: Some(150),
            },
            FieldMeta {
                name: "date_of_birth",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("date_of_birth", false),
                max_length: None,
            },
            FieldMeta {
                name: "gender",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("gender", false),
                max_length: None,
            },
            FieldMeta {
                name: "nationality_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_country"),
                max_length: None,
            },
            FieldMeta {
                name: "party_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("party_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "display_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("display_name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "external_reference",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("external_reference", false),
                max_length: Some(200),
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
                max_length: None,
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(50),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "organization_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("organization_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "legal_name",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("legal_name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "registration_number",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("registration_number", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "tax_identifier",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("tax_identifier", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "party_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("party_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "display_name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("display_name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "external_reference",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("external_reference", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "person_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("person_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "parent_organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("parent_organization_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "role_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("role_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "valid_from",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("valid_from", false),
                max_length: None,
            },
            FieldMeta {
                name: "valid_to",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("valid_to", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "person_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("person_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "from_party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_party"),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "occurred_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("occurred_at", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("organization_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("organization_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "address_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("address_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "line1",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("line1", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "line2",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("line2", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "line3",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("line3", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "city_name",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("city_name", false),
                max_length: Some(150),
            },
            FieldMeta {
                name: "postal_code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("postal_code", false),
                max_length: Some(30),
            },
            FieldMeta {
                name: "latitude",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("latitude", false),
                max_length: None,
            },
            FieldMeta {
                name: "longitude",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("longitude", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_primary",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_primary", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("party_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "person_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("person_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "country_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("country_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "state_province_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("state_province_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "city_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("city_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "party_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("party_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "location_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("location_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "address_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("address_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "parent_location_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("parent_location_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(2),
            },
            FieldMeta {
                name: "alpha3",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("alpha3", false),
                max_length: Some(3),
            },
            FieldMeta {
                name: "numeric_code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("numeric_code", false),
                max_length: Some(3),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "phone_code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("phone_code", false),
                max_length: Some(20),
            },
            FieldMeta {
                name: "currency_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("currency_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(10),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "subdivision_type",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("subdivision_type", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "country_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("country_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(80),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "population",
                field_type: FieldType::from_model("integer", false),
                required: false,
                ref_table: ref_table_for("population", false),
                max_length: None,
            },
            FieldMeta {
                name: "latitude",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("latitude", false),
                max_length: None,
            },
            FieldMeta {
                name: "longitude",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("longitude", false),
                max_length: None,
            },
            FieldMeta {
                name: "timezone",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("timezone", false),
                max_length: Some(64),
            },
            FieldMeta {
                name: "is_capital",
                field_type: FieldType::from_model("boolean", false),
                required: false,
                ref_table: ref_table_for("is_capital", false),
                max_length: None,
            },
            FieldMeta {
                name: "country_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("country_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "state_province_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("state_province_id", true),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(2),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(3),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "symbol",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("symbol", false),
                max_length: Some(10),
            },
            FieldMeta {
                name: "decimal_places",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("decimal_places", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "from_currency_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_currency"),
                max_length: None,
            },
            FieldMeta {
                name: "to_currency_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_currency"),
                max_length: None,
            },
            FieldMeta {
                name: "rate",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("rate", false),
                max_length: None,
            },
            FieldMeta {
                name: "rate_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("rate_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "effective_at",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("effective_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "expires_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("expires_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "source",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("source", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(30),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "symbol",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("symbol", false),
                max_length: Some(20),
            },
            FieldMeta {
                name: "category",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("category", false),
                max_length: None,
            },
            FieldMeta {
                name: "conversion_factor",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("conversion_factor", false),
                max_length: None,
            },
            FieldMeta {
                name: "base_unit_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_unit_of_measure"),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
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
                max_length: None,
            },
            FieldMeta {
                name: "effective_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("effective_at", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: Some(2000),
            },
            FieldMeta {
                name: "task_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("task_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "priority",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("priority", false),
                max_length: None,
            },
            FieldMeta {
                name: "due_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("due_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "started_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("started_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "completed_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("completed_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "assignee_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_party"),
                max_length: None,
            },
            FieldMeta {
                name: "organization_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("organization_id", true),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityCharacteristic",
        table_name: "bus_quality_characteristic",
        route: "bus_quality_characteristic",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: Some(2000),
            },
            FieldMeta {
                name: "data_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("data_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "evaluation_method",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("evaluation_method", false),
                max_length: Some(500),
            },
        ],
    },
    EntityMeta {
        name: "QualityPlanCharacteristic",
        table_name: "bus_quality_plan_characteristic",
        route: "bus_quality_plan_characteristic",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence_number",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence_number", false),
                max_length: None,
            },
            FieldMeta {
                name: "required",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("required", false),
                max_length: None,
            },
            FieldMeta {
                name: "lower_limit",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("lower_limit", false),
                max_length: None,
            },
            FieldMeta {
                name: "upper_limit",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("upper_limit", false),
                max_length: None,
            },
            FieldMeta {
                name: "target_value",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("target_value", false),
                max_length: None,
            },
            FieldMeta {
                name: "unit_of_measure",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_unit_of_measure"),
                max_length: None,
            },
            FieldMeta {
                name: "method",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("method", false),
                max_length: Some(500),
            },
            FieldMeta {
                name: "sampling_required",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("sampling_required", false),
                max_length: None,
            },
            FieldMeta {
                name: "quality_characteristic_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("quality_characteristic_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "quality_plan_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("quality_plan_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "test_method_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("test_method_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "sampling_plan_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("sampling_plan_id", true),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityPlan",
        table_name: "bus_quality_plan",
        route: "bus_quality_plan",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "TestMethod",
        table_name: "bus_test_method",
        route: "bus_test_method",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "instructions",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("instructions", false),
                max_length: Some(10000),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "SamplingPlan",
        table_name: "bus_sampling_plan",
        route: "bus_sampling_plan",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(300),
            },
            FieldMeta {
                name: "method",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("method", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "SamplingRule",
        table_name: "bus_sampling_rule",
        route: "bus_sampling_rule",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "rule_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("rule_number", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "population_min",
                field_type: FieldType::from_model("integer", false),
                required: false,
                ref_table: ref_table_for("population_min", false),
                max_length: None,
            },
            FieldMeta {
                name: "population_max",
                field_type: FieldType::from_model("integer", false),
                required: false,
                ref_table: ref_table_for("population_max", false),
                max_length: None,
            },
            FieldMeta {
                name: "sample_size",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sample_size", false),
                max_length: None,
            },
            FieldMeta {
                name: "acceptance_number",
                field_type: FieldType::from_model("integer", false),
                required: false,
                ref_table: ref_table_for("acceptance_number", false),
                max_length: None,
            },
            FieldMeta {
                name: "rejection_number",
                field_type: FieldType::from_model("integer", false),
                required: false,
                ref_table: ref_table_for("rejection_number", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "sampling_plan_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("sampling_plan_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "quality_plan_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("quality_plan_id", true),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityInspection",
        table_name: "bus_quality_inspection",
        route: "bus_quality_inspection",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "inspection_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("inspection_number", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "inspection_date",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("inspection_date", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "result",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("result", false),
                max_length: None,
            },
            FieldMeta {
                name: "disposition",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("disposition", false),
                max_length: None,
            },
            FieldMeta {
                name: "notes",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("notes", false),
                max_length: Some(4000),
            },
            FieldMeta {
                name: "quality_plan_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("quality_plan_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "inspector_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_party"),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "InspectionSample",
        table_name: "bus_inspection_sample",
        route: "bus_inspection_sample",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "sample_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("sample_number", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "selected_at",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("selected_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("quantity", false),
                max_length: None,
            },
            FieldMeta {
                name: "unit_of_measure",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_unit_of_measure"),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "selection_basis",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("selection_basis", false),
                max_length: Some(1000),
            },
            FieldMeta {
                name: "quality_inspection_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("quality_inspection_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "sampling_plan_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("sampling_plan_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "sampling_rule_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("sampling_rule_id", true),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityMeasurement",
        table_name: "bus_quality_measurement",
        route: "bus_quality_measurement",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "measurement_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("measurement_number", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "characteristic_code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("characteristic_code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "measured_value",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("measured_value", false),
                max_length: None,
            },
            FieldMeta {
                name: "measured_text",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("measured_text", false),
                max_length: Some(1000),
            },
            FieldMeta {
                name: "unit_of_measure",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_unit_of_measure"),
                max_length: None,
            },
            FieldMeta {
                name: "lower_limit",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("lower_limit", false),
                max_length: None,
            },
            FieldMeta {
                name: "upper_limit",
                field_type: FieldType::from_model("decimal", false),
                required: false,
                ref_table: ref_table_for("upper_limit", false),
                max_length: None,
            },
            FieldMeta {
                name: "result",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("result", false),
                max_length: None,
            },
            FieldMeta {
                name: "measured_at",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("measured_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "method",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("method", false),
                max_length: Some(500),
            },
            FieldMeta {
                name: "notes",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("notes", false),
                max_length: Some(2000),
            },
            FieldMeta {
                name: "quality_characteristic_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("quality_characteristic_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "quality_plan_characteristic_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("quality_plan_characteristic_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "test_method_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("test_method_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "quality_inspection_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("quality_inspection_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "inspection_sample_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("inspection_sample_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "quality_plan_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("quality_plan_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "certificate_of_analysis_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("certificate_of_analysis_id", true),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "Nonconformance",
        table_name: "bus_nonconformance",
        route: "bus_nonconformance",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("number", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "severity",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("severity", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("description", false),
                max_length: Some(4000),
            },
            FieldMeta {
                name: "detected_at",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("detected_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "closed_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("closed_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "inspection_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_quality_inspection"),
                max_length: None,
            },
            FieldMeta {
                name: "owner_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_party"),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "CorrectiveAction",
        table_name: "bus_corrective_action",
        route: "bus_corrective_action",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "action_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("action_number", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "action_type",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("action_type", false),
                max_length: None,
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("description", false),
                max_length: Some(4000),
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "due_date",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("due_date", false),
                max_length: None,
            },
            FieldMeta {
                name: "completed_date",
                field_type: FieldType::from_model("date", false),
                required: false,
                ref_table: ref_table_for("completed_date", false),
                max_length: None,
            },
            FieldMeta {
                name: "nonconformance_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("nonconformance_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "owner_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: Some("bus_party"),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "CorrectiveActionVerification",
        table_name: "bus_corrective_action_verification",
        route: "bus_corrective_action_verification",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "verification_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("verification_number", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "verification_date",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("verification_date", false),
                max_length: None,
            },
            FieldMeta {
                name: "result",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("result", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "findings",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("findings", false),
                max_length: Some(4000),
            },
            FieldMeta {
                name: "verified_by",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: Some("bus_party"),
                max_length: None,
            },
            FieldMeta {
                name: "nonconformance_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("nonconformance_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "corrective_action_id",
                field_type: FieldType::from_model("string", true),
                required: true,
                ref_table: ref_table_for("corrective_action_id", true),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "ReturnDisposition",
        table_name: "bus_return_disposition",
        route: "bus_return_disposition",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "disposition_code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("disposition_code", false),
                max_length: None,
            },
            FieldMeta {
                name: "disposition_date",
                field_type: FieldType::from_model("datetime", false),
                required: true,
                ref_table: ref_table_for("disposition_date", false),
                max_length: None,
            },
            FieldMeta {
                name: "quantity",
                field_type: FieldType::from_model("decimal", false),
                required: true,
                ref_table: ref_table_for("quantity", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
            },
            FieldMeta {
                name: "reason_code",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("reason_code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "nonconformance_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("nonconformance_id", true),
                max_length: None,
            },
            FieldMeta {
                name: "quality_inspection_id",
                field_type: FieldType::from_model("string", true),
                required: false,
                ref_table: ref_table_for("quality_inspection_id", true),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "CertificateOfAnalysis",
        table_name: "bus_certificate_of_analysis",
        route: "bus_certificate_of_analysis",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "certificate_number",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("certificate_number", false),
                max_length: Some(120),
            },
            FieldMeta {
                name: "issued_at",
                field_type: FieldType::from_model("datetime", false),
                required: false,
                ref_table: ref_table_for("issued_at", false),
                max_length: None,
            },
            FieldMeta {
                name: "status",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("status", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
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
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityCharacteristicDataType",
        table_name: "bus_quality_characteristic_data_type",
        route: "bus_quality_characteristic_data_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityCharacteristicStatus",
        table_name: "bus_quality_characteristic_status",
        route: "bus_quality_characteristic_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityPlanStatus",
        table_name: "bus_quality_plan_status",
        route: "bus_quality_plan_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "TestMethodStatus",
        table_name: "bus_test_method_status",
        route: "bus_test_method_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "SamplingPlanMethod",
        table_name: "bus_sampling_plan_method",
        route: "bus_sampling_plan_method",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "SamplingPlanStatus",
        table_name: "bus_sampling_plan_status",
        route: "bus_sampling_plan_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "SamplingRuleStatus",
        table_name: "bus_sampling_rule_status",
        route: "bus_sampling_rule_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityInspectionStatus",
        table_name: "bus_quality_inspection_status",
        route: "bus_quality_inspection_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityInspectionResult",
        table_name: "bus_quality_inspection_result",
        route: "bus_quality_inspection_result",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityInspectionDisposition",
        table_name: "bus_quality_inspection_disposition",
        route: "bus_quality_inspection_disposition",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "InspectionSampleStatus",
        table_name: "bus_inspection_sample_status",
        route: "bus_inspection_sample_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "QualityMeasurementResult",
        table_name: "bus_quality_measurement_result",
        route: "bus_quality_measurement_result",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "NonconformanceSeverity",
        table_name: "bus_nonconformance_severity",
        route: "bus_nonconformance_severity",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "NonconformanceStatus",
        table_name: "bus_nonconformance_status",
        route: "bus_nonconformance_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "CorrectiveActionActionType",
        table_name: "bus_corrective_action_action_type",
        route: "bus_corrective_action_action_type",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "CorrectiveActionStatus",
        table_name: "bus_corrective_action_status",
        route: "bus_corrective_action_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "CorrectiveActionVerificationResult",
        table_name: "bus_corrective_action_verification_result",
        route: "bus_corrective_action_verification_result",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "CorrectiveActionVerificationStatus",
        table_name: "bus_corrective_action_verification_status",
        route: "bus_corrective_action_verification_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "ReturnDispositionDispositionCode",
        table_name: "bus_return_disposition_disposition_code",
        route: "bus_return_disposition_disposition_code",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "ReturnDispositionStatus",
        table_name: "bus_return_disposition_status",
        route: "bus_return_disposition_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
    EntityMeta {
        name: "CertificateOfAnalysisStatus",
        table_name: "bus_certificate_of_analysis_status",
        route: "bus_certificate_of_analysis_status",
        fields: &[
            FieldMeta {
                name: "id",
                field_type: FieldType::from_model("string", false),
                required: false,
                ref_table: ref_table_for("id", false),
                max_length: None,
            },
            FieldMeta {
                name: "code",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("code", false),
                max_length: Some(100),
            },
            FieldMeta {
                name: "name",
                field_type: FieldType::from_model("string", false),
                required: true,
                ref_table: ref_table_for("name", false),
                max_length: Some(200),
            },
            FieldMeta {
                name: "description",
                field_type: FieldType::from_model("text", false),
                required: false,
                ref_table: ref_table_for("description", false),
                max_length: None,
            },
            FieldMeta {
                name: "sequence",
                field_type: FieldType::from_model("integer", false),
                required: true,
                ref_table: ref_table_for("sequence", false),
                max_length: None,
            },
            FieldMeta {
                name: "is_active",
                field_type: FieldType::from_model("boolean", false),
                required: true,
                ref_table: ref_table_for("is_active", false),
                max_length: None,
            },
        ],
    },
];
