/**
 * Faker-driven record factory.
 *
 * Values are chosen from the field's name first (so `email` gets an email and
 * `phone` gets a phone number) and its declared type second. The faker seed is
 * fixed in config, so a failing bulk run reproduces byte-for-byte.
 *
 * Generated: 2026-10-01T05:17:18.250Z
 * Project: compliance
 */

import { faker } from "@faker-js/faker";
import { config } from "./config";
import {
  type EntityMeta,
  type FieldMeta,
  foreignKeyFields,
  scalarFields,
  writableFields,
} from "./entities";
import { modelEnums, stateMachineFor } from "./model";

faker.seed(config.fakerSeed);

export function reseed(seed: number = config.fakerSeed): void {
  faker.seed(seed);
}

/**
 * Salt for unique columns.
 *
 * It must NOT come from faker: the seed is fixed so runs reproduce, which means
 * faker replays the same "random" salts every time. Against a database that
 * still holds rows from an earlier run, the second run regenerates a value it
 * already inserted and the create fails with a 409 — unique-safe within a run,
 * never across them. `Math.random` is not seeded, so this stays unique per
 * process while leaving every other value reproducible.
 */
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
let uniqueCounter = 0;

function nextUniqueSalt(): string {
  uniqueCounter += 1;
  return `${RUN_ID}${uniqueCounter.toString(36)}`;
}

export { faker };

/**
 * Name-driven generators, checked before the type-driven fallback.
 *
 * Patterns match against the column name, which is snake_case — so anything
 * that could appear *inside* a longer word is anchored to a segment boundary
 * with `(^|_)` / `(_|$)`. Without that, `ratio` matches "calib(ratio)n" and
 * "regist(ratio)n", and `login` matches "last_(login)": each one produced a
 * value of the wrong type entirely.
 *
 * A pattern is only a suggestion. `fakeValue` discards any generator whose
 * output does not fit the column's declared type and keeps scanning, so a
 * collision costs a worse-looking value, never an invalid one.
 */
const BY_NAME: Array<[RegExp, () => unknown]> = [
  [/^email$|_email$/i, () => faker.internet.email().toLowerCase()],
  [/phone|mobile|tel/i, () => faker.phone.number()],
  [/first_?name/i, () => faker.person.firstName()],
  [/last_?name|surname/i, () => faker.person.lastName()],
  [/full_?name|^name$|_name$/i, () => faker.person.fullName()],
  [/company|organi[sz]ation|employer/i, () => faker.company.name()],
  [/job|title|position|role/i, () => faker.person.jobTitle()],
  [/street|address(_?1)?$/i, () => faker.location.streetAddress()],
  [/address_?2|suite|apartment/i, () => faker.location.secondaryAddress()],
  [/city|town/i, () => faker.location.city()],
  [/(^|_)(state|province|region)(_|$)/i, () => faker.location.state()],
  [/country/i, () => faker.location.country()],
  [/zip|postal/i, () => faker.location.zipCode()],
  [/lat(itude)?$/i, () => faker.location.latitude()],
  [/lon(g|gitude)?$/i, () => faker.location.longitude()],
  [/url|website|link|homepage/i, () => faker.internet.url()],
  [/username|(^|_)(login|handle)(_|$)/i, () => faker.internet.username().toLowerCase()],
  [/password/i, () => faker.internet.password({ length: 16 })],
  [/avatar|image|photo|picture|thumbnail/i, () => faker.image.url()],
  [/slug/i, () => faker.lorem.slug()],
  [/description|summary|notes?|comment|body|content|remarks/i, () => faker.lorem.sentences(2)],
  [/price|amount|total|cost|salary|fee|balance|revenue/i, () =>
    Number(faker.commerce.price({ min: 1, max: 10_000 })),
  ],
  // Anchored: an unanchored `count` matched "dis(count)_percent" and filled a
  // percentage with anything up to 500.
  [/quantity|qty|(^|_)(count|stock|units)(_|$)/i, () => faker.number.int({ min: 0, max: 500 })],
  [/percent|discount|(^|_)(rate|ratio)(_|$)/i, () => Number(faker.number.float({ min: 0, max: 100, fractionDigits: 2 }))],
  [/sku|code|reference|ref_?no|serial/i, () => faker.string.alphanumeric({ length: 10, casing: "upper" })],
  [/color|colour/i, () => faker.color.human()],
  [/currency/i, () => faker.finance.currencyCode()],
  [/iban|account_?no/i, () => faker.finance.accountNumber()],
  // Only reached by a status column the model bound to no enum. One that
  // did is answered by `declaredValues` before this list is consulted at all.
  [/status|state$/i, () => faker.helpers.arrayElement(["active", "pending", "closed", "draft"])],
  [/priority|severity/i, () => faker.helpers.arrayElement(["low", "medium", "high", "critical"])],
  [/gender/i, () => faker.person.sex()],
  [/birth|dob/i, () => faker.date.birthdate().toISOString()],
];

function byType(field: FieldMeta): unknown {
  switch (field.type) {
    case "integer":
      return faker.number.int({ min: 1, max: 100_000 });
    case "decimal":
      return Number(faker.number.float({ min: 0, max: 100_000, fractionDigits: 2 }));
    case "boolean":
      return faker.datatype.boolean();
    case "date":
      return faker.date.past({ years: 3 }).toISOString().slice(0, 10);
    case "datetime":
      return faker.date.past({ years: 3 }).toISOString();
    case "json":
      return { tag: faker.lorem.word(), value: faker.number.int({ min: 1, max: 100 }) };
    case "text":
      return faker.lorem.paragraph();
    default:
      return faker.lorem.words({ min: 2, max: 4 });
  }
}

function truncate(value: unknown, field: FieldMeta): unknown {
  if (typeof value === "string" && field.maxLength && value.length > field.maxLength) {
    return value.slice(0, field.maxLength);
  }
  return value;
}

/**
 * The only temporal shapes the API accepts. `Date.parse` alone is not a type
 * check: V8's legacy parser reads `"nova56"` as November 1956, so a username
 * generated for `last_login` passed as a timestamp and the API refused the
 * record — 17 of every 1000 users in the bulk seed.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Whether a generated value is storable in a column of this declared type.
 *
 * The name-driven generators are heuristics over substrings, so they will
 * sometimes fire on a column they were not meant for. When that happens the
 * value is usually the wrong *type* — a float for a status string, a username
 * for a timestamp — and the API rejects the whole payload, which reads as
 * "every create in this suite is broken" rather than "one field guessed wrong".
 * Checking the type turns that class of collision into a cosmetic one.
 */
function matchesType(value: unknown, type: FieldMeta["type"]): boolean {
  switch (type) {
    case "integer":
    case "decimal":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));
    case "datetime":
      return (
        typeof value === "string" && ISO_DATETIME.test(value) && !Number.isNaN(Date.parse(value))
      );
    case "json":
      return typeof value === "object" && value !== null;
    default:
      return typeof value === "string";
  }
}

/**
 * The vocabulary the model declared for this column, if it declared one.
 *
 * An enum is a closed list, and the generated application enforces it: the
 * column gets a `sys_ref_list` reference, the form renders a dropdown, and the
 * API refuses a value outside it. Guessing here is therefore not "a less
 * realistic value" — it is an invalid one.
 *
 * The names below were invented by this factory and no model declares them:
 * `active`, `pending`, `closed`, `draft`. A record seeded with one contradicts
 * the application's own dictionary, and where the entity has a state machine it
 * sits in a state the diagram never drew — so every guard finds no edge out of
 * it and every rule keyed on a real status value never fires. The suite then
 * demonstrates an application that cannot do what it was generated to do.
 */
function declaredValues(field: FieldMeta): string[] | undefined {
  if (field.enumReferenceId === undefined) return undefined;
  const declared = modelEnums.find((e) => e.referenceId === field.enumReferenceId);
  return declared && declared.values.length > 0 ? declared.values : undefined;
}

/** A value for one field, unique-safe when the column is declared unique. */
export function fakeValue(field: FieldMeta, uniqueSalt?: string | number): unknown {
  // Ahead of every heuristic below: a declared vocabulary is not a guess.
  const declared = declaredValues(field);
  if (declared) return faker.helpers.arrayElement(declared);

  for (const [pattern, generate] of BY_NAME) {
    if (!pattern.test(field.name)) continue;

    const candidate = generate();
    // Keep scanning on a type mismatch: a later pattern may still fit, and the
    // type-driven fallback is there if none does.
    if (!matchesType(candidate, field.type)) continue;

    let value = candidate;
    if (field.unique && typeof value === "string") {
      const salt = uniqueSalt ?? nextUniqueSalt();
      value = value.includes("@") ? value.replace("@", `+${salt}@`) : `${value}-${salt}`;
    }
    return truncate(value, field);
  }

  let value = byType(field);
  if (field.unique && typeof value === "string") {
    value = `${value}-${uniqueSalt ?? nextUniqueSalt()}`;
  }
  return truncate(value, field);
}

export interface BuildOptions {
  /** Foreign-key values to inject, keyed by column name. */
  foreignKeys?: Record<string, string>;
  /** Force these fields to exact values. */
  overrides?: Record<string, unknown>;
  /** Only populate required fields — for minimal-payload tests. */
  requiredOnly?: boolean;
  /** Salt appended to unique fields, so bulk batches never collide. */
  uniqueSalt?: string | number;
}

/** Build one create-payload for an entity. */
export function buildRecord(
  entity: EntityMeta,
  options: BuildOptions = {}
): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  const fields = options.requiredOnly
    ? writableFields(entity).filter((f) => f.required)
    : scalarFields(entity);

  const machine = stateMachineFor(entity.tableName);

  for (const field of fields) {
    if (field.isForeignKey || field.name.endsWith("_id")) continue;
    /*
     * A record starts where the machine says records start.
     *
     * A state machine declares a topology, and its `initial` names the
     * one state a new record may be in. Any other declared value is a state the
     * record cannot have reached, so the moves out of it are the wrong ones and
     * a suite walking the machine from there has nowhere legal to go. An
     * arbitrary pick from the enum is valid for the dropdown and wrong for the
     * lifecycle; `initial` is the only value that is both.
     */
    if (machine && field.name === machine.statusField && machine.initial) {
      record[field.name] = machine.initial;
      continue;
    }
    record[field.name] = fakeValue(field, options.uniqueSalt);
  }

  for (const fk of foreignKeyFields(entity)) {
    const provided = options.foreignKeys?.[fk.name];
    if (provided) {
      record[fk.name] = provided;
    }
    // An unsatisfied optional FK is left out entirely — sending null would trip
    // the required-field rule for columns the ERD marked mandatory.
  }

  return { ...record, ...options.overrides };
}

/** Build `count` payloads, salted so unique columns stay unique across the batch. */
export function buildRecords(
  entity: EntityMeta,
  count: number,
  options: BuildOptions = {}
): Array<Record<string, unknown>> {
  return Array.from({ length: count }, (_unused, index) =>
    buildRecord(entity, { ...options, uniqueSalt: options.uniqueSalt ?? `${nextUniqueSalt()}${index}` })
  );
}

/** A payload that should FAIL validation — omits a required field. */
export function buildInvalidRecord(entity: EntityMeta): {
  payload: Record<string, unknown>;
  omittedField: FieldMeta;
} | null {
  const required = scalarFields(entity).filter((f) => f.required);
  if (required.length === 0) return null;

  const omittedField = required[0]!;
  const payload = buildRecord(entity);
  delete payload[omittedField.name];
  return { payload, omittedField };
}

/** A user payload for the users-and-roles suite. */
export function buildUser(index: number): { email: string; password: string; name: string } {
  const stamp = `${Date.now().toString(36)}${index}`;
  return {
    email: `e2e.${faker.internet.username().toLowerCase().replace(/[^a-z0-9]/g, "")}.${stamp}@example.test`,
    password: `Test-${faker.string.alphanumeric(12)}!1`,
    name: faker.person.fullName(),
  };
}
