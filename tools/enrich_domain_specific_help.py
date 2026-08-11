"""Apply domain-aware semantic help to every CEDM entity and field."""
from pathlib import Path
import re
import yaml

# Domain-specific enrichment is deliberately deterministic so the same model
# produces the same semantic help in CI, local tooling, and future generators.
ROOT = Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"

DOMAIN_TERMS = {
    "yard": "container yard and terminal operations", "container": "container logistics and intermodal transportation", "repair": "container maintenance and repair", "sales": "sales and order-to-cash", "purchase": "procure-to-pay", "invoice": "billing and accounts receivable", "payment": "payments and financial settlement", "bank": "banking and financial services", "insurance": "insurance administration", "inventory": "inventory and warehouse management", "warehouse": "warehouse management", "manufactur": "manufacturing execution", "bom": "manufacturing product structure", "quality": "quality management", "chemical": "chemical and process manufacturing", "food": "food manufacturing and traceability", "mining": "mining and natural resources", "energy": "energy and utilities", "meter": "energy and utilities", "aircraft": "aerospace operations", "vehicle": "transportation and automotive", "retail": "retail operations", "store": "retail operations", "shopping": "digital commerce", "hotel": "hospitality operations", "trip": "travel and journey management", "flight": "aviation and travel", "telecom": "telecommunications", "government": "government and public-sector services", "property": "real estate and property management", "lease": "real estate leasing", "farm": "agriculture", "crop": "agriculture and crop production", "construction": "construction project management", "media": "media and content management", "professional": "professional services", "service": "service and field operations", "facility": "facilities management", "research": "scientific research", "compound": "life sciences and drug discovery", "experiment": "scientific experimentation", "diagnosis": "healthcare clinical information", "medication": "healthcare medication management", "prescription": "healthcare medication management", "education": "education administration", "enrollment": "education administration", "regulatory": "regulatory affairs and compliance", "customs": "international trade and customs", "trade": "international trade and customs", "emission": "sustainability and environmental reporting", "security": "security and incident management", "dataset": "data management and analytics", "ai": "artificial intelligence and decision support", "model": "model and AI management", "party": "party and identity management", "person": "party and identity management", "organization": "organization and enterprise management", "customer": "customer relationship management", "supplier": "supplier management", "employee": "human resources and workforce management", "employment": "human resources and workforce management", "product": "product and item management", "project": "project management", "workflow": "workflow and business process management"
}

FIELD_HELP = {
    "status": "Controls the business lifecycle state and therefore influences which operations, transitions, approvals, and downstream processes are permitted.",
    "customerId": "Connects the record to the Customer relationship so customer-specific history, obligations, pricing, service activity, and reporting context can be resolved.",
    "supplierId": "Connects the record to the Supplier relationship so procurement, fulfillment, compliance, performance, and settlement processes can resolve the responsible supplier.",
    "productId": "Connects the record to Product so classification, units, pricing, inventory, and downstream transactions use the same product definition.",
    "organizationId": "Identifies the Organization responsible for, owning, requesting, or participating in the record; its exact role is defined by the surrounding entity.",
    "locationId": "Connects the record to a Location so physical responsibility, inventory, routing, service, and operational reporting share a common location context.",
    "currencyId": "Identifies the Currency required to interpret monetary amounts and supports consistent calculation, conversion, reporting, and settlement.",
    "unitOfMeasureId": "Identifies how a quantity is expressed so calculations and reporting do not interpret the numeric value without its unit context.",
    "quantity": "States how much of the associated item, resource, capacity, or service participates in the business event; interpretation depends on its unit of measure.",
    "amount": "States a monetary value whose interpretation depends on the entity, transaction purpose, and declared currency.",
    "totalAmount": "Represents the transaction-level monetary total and normally reconciles its lines, adjustments, taxes, or charges according to the entity's rules.",
    "startDate": "Defines when the applicable business validity, agreement, service, or lifecycle begins and is interpreted with endDate and status.",
    "endDate": "Defines when the applicable business validity, agreement, service, or lifecycle ends and is interpreted with startDate and status.",
    "createdAt": "System audit timestamp recording when the record entered the CEDM system; used for chronology, audit, synchronization, and reporting.",
    "updatedAt": "System audit timestamp recording the latest change; used for audit, synchronization, change detection, and downstream processing."
}

VALUES = {"ACTIVE": "The record is currently valid for processes that permit active records.", "INACTIVE": "The record remains known but is not currently available for normal active processing.", "DRAFT": "The record is being prepared and is not yet an approved or committed business object.", "APPROVED": "The applicable approval decision has succeeded and dependent processes may proceed.", "REJECTED": "The record was evaluated and not accepted for its intended business purpose.", "CANCELLED": "The commitment or activity was intentionally cancelled and should not continue as active.", "COMPLETED": "The business activity reached its defined completion state and can proceed to appropriate downstream processing.", "CLOSED": "The business process or case is finished and should normally accept no ordinary operational changes."}

def domain(name, kind):
    text = f"{name} {kind}".lower()
    for term, value in DOMAIN_TERMS.items():
        if term in text: return value
    return re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", kind or "business operations").replace("_", " ")

def run(path):
    data = yaml.safe_load(path.read_text(encoding="utf-8")); e = data.get("entity") if isinstance(data, dict) else None
    if not isinstance(e, dict) or not e.get("name"): return False
    name, area = e["name"], domain(e["name"], e.get("kind", ""))
    e["help"] = {"summary": f"Represents {name} as a business concept in the CEDM model.", "businessMeaning": f"{name} captures a distinct business object or occurrence used in {area}. It has independent identity and semantics so processes can reason about it without relying on database or UI implementation details.", "usage": f"Used by {area} processes to create, find, validate, change, report, integrate, and audit {name} records.", "relationshipContext": f"{name} participates in the CEDM semantic graph through its declared relationships. Related parties, products, locations, transactions, documents, resources, and other entities provide the context needed to interpret the record.", "lifecycle": "Lifecycle is governed by declared status values, invariants, approvals, and related processes; state changes must preserve dependent business relationships.", "example": f"A typical {name} record represents one identifiable business object or occurrence within {area}."}
    for f in e.get("attributes", []) or []:
        if not isinstance(f, dict) or not f.get("name"): continue
        n, target = f["name"], f.get("target") if f.get("type") == "reference" else None
        summary = FIELD_HELP.get(n) or (f"Identifies the related {target} for {name}. It provides the business link needed to navigate to the related object and apply rules that depend on that relationship." if target else f"Captures {re.sub(r'([a-z0-9])([A-Z])', r'\\1 \\2', n).replace('_', ' ').lower()} for {name}. The value must be interpreted with the entity's purpose, lifecycle, relationships, and business rules rather than as an isolated technical column.")
        h = {"summary": summary, "usage": f"Used by {area} processes when {name} records are created, reviewed, validated, searched, reported, integrated, or transitioned.", "relationshipContext": f"Connects {name} to {target}; the referenced entity supplies business context required by related processes." if target else f"Interpreted together with the other attributes and relationships of {name}; related processes may use it for validation, calculation, selection, reporting, or workflow decisions."}
        if f.get("values"): h["valueSemantics"] = {str(v): VALUES.get(str(v), f"Represents the {str(v).lower().replace('_', ' ')} classification or state for {name}.") for v in f["values"]}
        h["requiredMeaning"] = "Required because the business concept cannot be reliably interpreted or processed without this information." if f.get("required") else "Optional because the record remains meaningful when the information is unknown, pending, or not applicable."
        f["help"] = h
    for r in e.get("relationships", []) or []:
        if not isinstance(r, dict) or not r.get("name"): continue
        target = r.get("target", "related entity")
        r["help"] = {"summary": f"Connects {name} with {target} so the two business concepts can be interpreted together.", "usage": f"Used by {area} processes to navigate, validate, aggregate, authorize, report, and coordinate information between {name} and {target}.", "cardinalityMeaning": f"Cardinality {r.get('cardinality', 'unspecified')} defines how many {target} records may participate for one {name} record.", "context": "Ownership, conditions, lifecycle, and invariants determine when the relationship is valid and how changes propagate between the connected concepts."}
    path.write_text(yaml.safe_dump(data, sort_keys=False, allow_unicode=True, width=120), encoding="utf-8"); return True

count = sum(run(p) for p in sorted(ENTITY_DIR.glob("*.yaml")) if p.name != "index.yaml")
print(f"Applied domain-specific semantic help to {count} CEDM entity definitions")
