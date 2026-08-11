from pathlib import Path
import re
import yaml

ROOT = Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"
SKIP = {"index.yaml"}

COMMON = {
    "id": "A stable identifier that uniquely distinguishes this record from other records of the same entity type.",
    "code": "A human-readable business code used to identify or reference the record in operational processes and integrations.",
    "name": "The human-readable name used by people, reports, searches, and related business processes.",
    "description": "A business description that explains the purpose, scope, or meaning of the record to users and downstream processes.",
    "status": "The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes.",
    "type": "The classification of the record. The value determines how the record is interpreted and which specialized relationships or rules apply.",
    "quantity": "The amount of the referenced item expressed in the applicable unit of measure. It is used by calculations, inventory, planning, fulfillment, or other quantity-based processes.",
    "amount": "A monetary amount representing the financial value of the record or transaction. Its interpretation depends on the surrounding business context and currency.",
    "currencyId": "Identifies the currency in which monetary amounts on the record are expressed, allowing amounts to be interpreted and aggregated consistently.",
    "startDate": "The date on which the applicable business period, agreement, service, or lifecycle begins. Related end dates must follow the business chronology.",
    "endDate": "The date on which the applicable business period, agreement, service, or lifecycle ends. It is interpreted together with the corresponding start date.",
    "createdAt": "The system-managed timestamp recording when the record was created. It supports auditability, chronology, and operational reporting.",
    "createdBy": "The party or user responsible for creating the record. It links the record to its audit actor and should not normally be supplied as ordinary business data.",
    "updatedAt": "The system-managed timestamp recording the latest modification of the record. It supports synchronization, audit, and change detection.",
    "updatedBy": "The party or user responsible for the latest modification. It provides the audit link for the most recent change.",
}

def human(name):
    return re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", str(name)).replace("_", " ").replace("-", " ").strip().lower()

def entity_help(entity, relationships):
    name = entity.get("name", "Entity")
    kind = human(entity.get("kind", "business entity"))
    targets = [r.get("target") for r in relationships if r.get("target")]
    related = ", ".join(targets[:8]) or "other CEDM entities"
    return {
        "summary": f"Represents a {kind} called {name} within the CEDM business model.",
        "businessMeaning": f"{name} is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface.",
        "usage": f"Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate {name} records.",
        "relationshipContext": f"The entity participates in a wider business graph through relationships with {related}. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns.",
        "lifecycle": "The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships.",
        "example": f"A typical {name} record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes."
    }

def field_help(field, entity_name, target=None):
    name = field.get("name", "field")
    h = human(name)
    base = COMMON.get(name)
    if not base:
        if target:
            base = f"Identifies the related {target} associated with this {entity_name}. It provides the link needed to navigate from this record to the related business object."
        elif name.endswith("Id"):
            subject = h[:-3].strip() or "related object"
            base = f"Identifies the {subject} record associated with this {entity_name}. The identifier connects this record to the corresponding CEDM entity so related processes can resolve the correct business object."
        elif name.endswith("At"):
            subject = h[:-2].strip() or "business event"
            base = f"Records when the {subject} event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities."
        elif name.endswith("Date"):
            subject = h[:-4].strip() or "business event"
            base = f"Records the business date associated with the {subject}. It is used in chronology, eligibility, scheduling, reporting, and related business rules."
        elif name.startswith("is") or name.startswith("has"):
            base = f"Indicates whether the {h} condition applies to this {entity_name}. Business rules and user interfaces use this value to determine applicable behavior."
        else:
            base = f"Captures the business meaning of {h} for the {entity_name}. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record."
    context = f"Its meaning is specific to {entity_name}; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value."
    if target:
        context = f"This field connects {entity_name} to {target}. The reference establishes business context between the two entities and lets processes navigate from this record to the related {target}."
    result = {
        "summary": base,
        "usage": f"Used when creating, reviewing, searching, validating, reporting on, or integrating {entity_name} records, where applicable.",
        "relationshipContext": context,
    }
    if field.get("values"):
        result["valueSemantics"] = {str(v): f"Represents the {human(v)} state or classification in the context of {entity_name}." for v in field["values"]}
    if field.get("required") is True:
        result["requiredMeaning"] = "Required because the business model cannot reliably interpret the record for its declared purpose without this value."
    elif field.get("required") is False:
        result["optionalMeaning"] = "Optional because the business concept can remain valid when this value is not yet known or is not applicable."
    return result

def enrich(path):
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("entity"), dict):
        return False
    e = data["entity"]
    if not e.get("name"):
        return False
    relationships = e.get("relationships") or []
    e["help"] = entity_help(e, relationships)
    for field in e.get("attributes") or []:
        if isinstance(field, dict) and field.get("name"):
            target = field.get("target") if field.get("type") == "reference" else None
            field["help"] = field_help(field, e["name"], target)
    for rel in relationships:
        if isinstance(rel, dict) and rel.get("name"):
            target = rel.get("target", "another CEDM entity")
            rel["help"] = {
                "summary": f"Connects {e['name']} to {target} so related business context can be navigated and enforced.",
                "usage": f"Used when processes need to find or reason about {target} records associated with a {e['name']}.",
                "cardinalityMeaning": f"The declared cardinality {rel.get('cardinality', 'unspecified')} expresses how many related records may participate in the relationship.",
                "context": "The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants."
            }
    path.write_text(yaml.safe_dump(data, sort_keys=False, allow_unicode=True, width=120), encoding="utf-8")
    return True

count = 0
for path in sorted(ENTITY_DIR.glob("*.yaml")):
    if path.name not in SKIP and enrich(path):
        count += 1
print(f"Enriched semantic help in {count} entity definitions")
