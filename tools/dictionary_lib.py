"""Shared rules of the CEDM → Application Dictionary mapping.

`specification/dictionary-mapping.yaml` is normative; this module is its
executable form for the tools in this directory (validator, report, enrichment).
"""
from __future__ import annotations

import pathlib
import re

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
LUCIDE = {l.strip() for l in (ROOT / "tools" / "lucide-icons.txt").read_text().splitlines() if l.strip()}

_vocab = yaml.safe_load((ROOT / "specification" / "vocabulary.yaml").read_text())["vocabulary"]
KIND_RULES = [(r["class"], re.compile(r["pattern"])) for r in _vocab["kindClasses"]["rules"]]

GROUPS = ["Identification", "Classification", "Status", "Relationships", "Dates", "Amounts", "Details", "System"]

HELP_ALIASES = {
    "purpose": "businessMeaning",
    "whenUsed": "usage",
    "howItRelates": "relationshipContext",
    "lifecycleUsage": "lifecycle",
    "commonProcesses": "workflowContext",
    "commonExamples": "example",
}


def kind_classes(kind) -> list[str]:
    """Every class whose rule matches; resolution takes the first."""
    if not kind:
        return ["entity"]
    return [c for c, rx in KIND_RULES if rx.search(kind)]


def kind_class(kind) -> str:
    return kind_classes(kind)[0]


def words(name: str) -> str:
    """SalesOrderLine → Sales Order Line; `ASSET` → Asset; PARTIALLY_FILLED → Partially Filled."""
    if name.isupper() or "_" in name:
        return " ".join(w.capitalize() for w in re.split(r"[_\s]+", name.lower()) if w)
    return re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ", name).strip()


def lower_words(name: str) -> str:
    return words(name).lower()


def enumeration_name(entity: str, attribute: str) -> str:
    return entity + attribute[:1].upper() + attribute[1:]


# keyword (matched against the entity's words) → lucide 0.312 id; first hit wins.
ICON_KEYWORDS = [
    ("invoice", "receipt"), ("payment", "credit-card"), ("order", "shopping-cart"),
    ("shipment", "truck"), ("delivery", "truck"), ("carrier", "truck"), ("vehicle", "car"),
    ("warehouse", "warehouse"), ("inventory", "boxes"), ("stock", "boxes"), ("product", "package"),
    ("item", "package"), ("party", "users"), ("person", "user"), ("employee", "user-check"),
    ("customer", "user-round"), ("supplier", "factory"), ("vendor", "factory"), ("organization", "building-2"),
    ("account", "landmark"), ("ledger", "book-open"), ("journal", "book-open"), ("budget", "piggy-bank"),
    ("currency", "coins"), ("price", "tag"), ("pricing", "tag"), ("discount", "percent"), ("tax", "percent"),
    ("contract", "file-check"), ("agreement", "file-check"), ("policy", "shield"), ("claim", "file-warning"),
    ("insurance", "shield-check"), ("patient", "heart-pulse"), ("clinical", "stethoscope"),
    ("appointment", "calendar-check"), ("schedule", "calendar"), ("calendar", "calendar"), ("event", "activity"),
    ("audit", "scroll-text"), ("document", "file-text"), ("attachment", "paperclip"), ("report", "bar-chart-3"),
    ("project", "folder-kanban"), ("task", "list-checks"), ("activity", "activity"), ("case", "briefcase"),
    ("ticket", "ticket"), ("quality", "badge-check"), ("inspection", "clipboard-check"), ("sample", "flask-conical"),
    ("test", "flask-conical"), ("asset", "box"), ("equipment", "wrench"), ("maintenance", "wrench"),
    ("location", "map-pin"), ("address", "map-pin"), ("route", "route"), ("facility", "building"),
    ("property", "home"), ("lease", "key-round"), ("subscription", "repeat"), ("campaign", "megaphone"),
    ("lead", "target"), ("opportunity", "trending-up"), ("quote", "file-text"), ("return", "undo-2"),
    ("refund", "undo-2"), ("role", "shield"), ("permission", "key"), ("access", "key"),
    ("user", "user"), ("session", "log-in"), ("model", "brain"), ("agent", "bot"), ("prompt", "message-square"),
    ("media", "image"), ("content", "file-text"), ("course", "graduation-cap"), ("student", "graduation-cap"),
    ("flight", "plane"), ("booking", "calendar-check"), ("reservation", "calendar-check"), ("hotel", "bed"),
    ("room", "bed"), ("crop", "sprout"), ("energy", "zap"), ("meter", "gauge"), ("compound", "flask-conical"),
    ("loan", "banknote"), ("credit", "credit-card"), ("risk", "alert-triangle"), ("control", "sliders-horizontal"),
    ("category", "layers"), ("classification", "layers"), ("hierarchy", "network"), ("relationship", "link"),
    ("balance", "scale"), ("cost", "calculator"), ("revenue", "trending-up"), ("expense", "wallet"),
    ("time", "clock"), ("shift", "clock"), ("skill", "award"), ("position", "briefcase"), ("job", "briefcase"),
]
KIND_ICONS = {"transaction": "file-text", "line": "list", "event": "activity", "reference": "list",
              "definition": "settings", "master": "database", "entity": "table"}


def icon_for(entity_name: str, kind) -> str:
    text = lower_words(entity_name)
    for key, icon in ICON_KEYWORDS:
        if re.search(rf"\b{key}", text) and icon in LUCIDE:
            return icon
    icon = KIND_ICONS[kind_class(kind)]
    return icon if icon in LUCIDE else "table"


def value_meaning(entity: str, attribute: str, value: str) -> str:
    v = lower_words(value) if value.upper() == value or "_" in value else words(value).lower()
    return (
        f"The {lower_words(attribute)} of the {lower_words(entity)} is {v}; "
        f"set it when that is what the business means for this record."
    )
