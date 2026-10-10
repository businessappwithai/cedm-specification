/**
 * Shared rules of the CEDM → Application Dictionary mapping.
 *
 * `specification/dictionary-mapping.yaml` is normative; this module is its
 * executable form for the tools in this directory (validator, report, enrichment).
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, readRootYaml } from "./library";

/** The lucide 0.312 ids a generated application can draw. */
export const LUCIDE: ReadonlySet<string> = new Set(
  readFileSync(path.join(ROOT, "tools", "lucide-icons.txt"), "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
);

const vocabulary = readRootYaml("specification/vocabulary.yaml").vocabulary;
const KIND_RULES: Array<[string, RegExp]> = vocabulary.kindClasses.rules.map(
  (rule: { class: string; pattern: string }) => [rule.class, new RegExp(rule.pattern)]
);

export const GROUPS = [
  "Identification",
  "Classification",
  "Status",
  "Relationships",
  "Dates",
  "Amounts",
  "Details",
  "System",
];

/** Older help keys and the key each now means. */
export const HELP_ALIASES: Readonly<Record<string, string>> = {
  purpose: "businessMeaning",
  whenUsed: "usage",
  howItRelates: "relationshipContext",
  lifecycleUsage: "lifecycle",
  commonProcesses: "workflowContext",
  commonExamples: "example",
};

/** Every class whose rule matches; resolution takes the first. */
export function kindClasses(kind: unknown): string[] {
  if (!kind) return ["entity"];
  return KIND_RULES.filter(([, rx]) => rx.test(String(kind))).map(([cls]) => cls);
}

export function kindClass(kind: unknown): string {
  return kindClasses(kind)[0] as string;
}

const isUpper = (text: string) => text === text.toUpperCase() && text !== text.toLowerCase();
const capitalize = (word: string) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();

/** SalesOrderLine → Sales Order Line; `ASSET` → Asset; PARTIALLY_FILLED → Partially Filled. */
export function words(name: string): string {
  if (isUpper(name) || name.includes("_")) {
    return name
      .toLowerCase()
      .split(/[_\s]+/)
      .filter(Boolean)
      .map(capitalize)
      .join(" ");
  }
  return name.replace(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, " ").trim();
}

export function lowerWords(name: string): string {
  return words(name).toLowerCase();
}

/** The enumeration an attribute's values make: Entity + Attribute. */
export function enumerationName(entity: string, attribute: string): string {
  return entity + attribute.slice(0, 1).toUpperCase() + attribute.slice(1);
}

/** keyword (matched against the entity's words) → lucide 0.312 id; first hit wins. */
const ICON_KEYWORDS: Array<[string, string]> = [
  ["invoice", "receipt"],
  ["payment", "credit-card"],
  ["order", "shopping-cart"],
  ["shipment", "truck"],
  ["delivery", "truck"],
  ["carrier", "truck"],
  ["vehicle", "car"],
  ["warehouse", "warehouse"],
  ["inventory", "boxes"],
  ["stock", "boxes"],
  ["product", "package"],
  ["item", "package"],
  ["party", "users"],
  ["person", "user"],
  ["employee", "user-check"],
  ["customer", "user-round"],
  ["supplier", "factory"],
  ["vendor", "factory"],
  ["organization", "building-2"],
  ["account", "landmark"],
  ["ledger", "book-open"],
  ["journal", "book-open"],
  ["budget", "piggy-bank"],
  ["currency", "coins"],
  ["price", "tag"],
  ["pricing", "tag"],
  ["discount", "percent"],
  ["tax", "percent"],
  ["contract", "file-check"],
  ["agreement", "file-check"],
  ["policy", "shield"],
  ["claim", "file-warning"],
  ["insurance", "shield-check"],
  ["patient", "heart-pulse"],
  ["clinical", "stethoscope"],
  ["appointment", "calendar-check"],
  ["schedule", "calendar"],
  ["calendar", "calendar"],
  ["event", "activity"],
  ["audit", "scroll-text"],
  ["document", "file-text"],
  ["attachment", "paperclip"],
  ["report", "bar-chart-3"],
  ["project", "folder-kanban"],
  ["task", "list-checks"],
  ["activity", "activity"],
  ["case", "briefcase"],
  ["ticket", "ticket"],
  ["quality", "badge-check"],
  ["inspection", "clipboard-check"],
  ["sample", "flask-conical"],
  ["test", "flask-conical"],
  ["asset", "box"],
  ["equipment", "wrench"],
  ["maintenance", "wrench"],
  ["location", "map-pin"],
  ["address", "map-pin"],
  ["route", "route"],
  ["facility", "building"],
  ["property", "home"],
  ["lease", "key-round"],
  ["subscription", "repeat"],
  ["campaign", "megaphone"],
  ["lead", "target"],
  ["opportunity", "trending-up"],
  ["quote", "file-text"],
  ["return", "undo-2"],
  ["refund", "undo-2"],
  ["role", "shield"],
  ["permission", "key"],
  ["access", "key"],
  ["user", "user"],
  ["session", "log-in"],
  ["model", "brain"],
  ["agent", "bot"],
  ["prompt", "message-square"],
  ["media", "image"],
  ["content", "file-text"],
  ["course", "graduation-cap"],
  ["student", "graduation-cap"],
  ["flight", "plane"],
  ["booking", "calendar-check"],
  ["reservation", "calendar-check"],
  ["hotel", "bed"],
  ["room", "bed"],
  ["crop", "sprout"],
  ["energy", "zap"],
  ["meter", "gauge"],
  ["compound", "flask-conical"],
  ["loan", "banknote"],
  ["credit", "credit-card"],
  ["risk", "alert-triangle"],
  ["control", "sliders-horizontal"],
  ["category", "layers"],
  ["classification", "layers"],
  ["hierarchy", "network"],
  ["relationship", "link"],
  ["balance", "scale"],
  ["cost", "calculator"],
  ["revenue", "trending-up"],
  ["expense", "wallet"],
  ["time", "clock"],
  ["shift", "clock"],
  ["skill", "award"],
  ["position", "briefcase"],
  ["job", "briefcase"],
];
const KIND_ICONS: Readonly<Record<string, string>> = {
  transaction: "file-text",
  line: "list",
  event: "activity",
  reference: "list",
  definition: "settings",
  master: "database",
  entity: "table",
};

/** The icon an entity gets when it states none. */
export function iconFor(entityName: string, kind: unknown): string {
  const text = lowerWords(entityName);
  for (const [key, icon] of ICON_KEYWORDS) {
    if (new RegExp(`\\b${key}`).test(text) && LUCIDE.has(icon)) return icon;
  }
  const icon = KIND_ICONS[kindClass(kind)] as string;
  return LUCIDE.has(icon) ? icon : "table";
}

/** The meaning written for an enumeration value that has none. */
export function valueMeaning(entity: string, attribute: string, value: string): string {
  const v =
    value.toUpperCase() === value || value.includes("_")
      ? lowerWords(value)
      : words(value).toLowerCase();
  return (
    `The ${lowerWords(attribute)} of the ${lowerWords(entity)} is ${v}; ` +
    "set it when that is what the business means for this record."
  );
}

/** Sentence case: the first letter upper, the rest as it is. */
export function cap(text: string): string {
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}
