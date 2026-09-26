/**
 * Which FK-marked column names the generator can resolve to a table.
 *
 * `isForeignKeyColumnName` decides whether an attribute the ERD marked `FK`
 * becomes a Table Direct reference — a lookup with a picker and a display
 * name — or falls through to its declared scalar type and renders as a raw
 * UUID in a text box.
 *
 * It is one of the copies of `foreignKeys` in `appwithai-language.json`, and
 * the copies genuinely drifted: the backend's `resolve_ref_table_name`, the
 * generated `tests/support/entities.rs`, the bun harness and `checker.ts` all
 * knew `assigned_to` names a person, and this function did not. The result was
 * a mandatory foreign key the dictionary described as a string — a text box in
 * the UI, and a generated CRUD suite that could not create the record at all
 * because its factory had no parent to fill.
 */

import { describe, expect, it } from "vitest";
import { attributeReferenceId, isForeignKeyColumnName } from "../bus-entity.types";
import { ReferenceType } from "../sys-dictionary.types";

describe("isForeignKeyColumnName", () => {
  it("accepts the `<entity>_id` convention", () => {
    expect(isForeignKeyColumnName("compound_id")).toBe(true);
    expect(isForeignKeyColumnName("parent_sample_id")).toBe(true);
  });

  it("accepts a `_by` column, which names a person by the role they played", () => {
    expect(isForeignKeyColumnName("reported_by")).toBe(true);
    expect(isForeignKeyColumnName("approved_by")).toBe(true);
  });

  it("accepts a person-role name that carries no suffix at all", () => {
    // The case that was broken. `assigned_to` is declared `FK` in the CRM
    // model and resolves to `bus_user` everywhere else in the stack.
    expect(isForeignKeyColumnName("assigned_to")).toBe(true);
    expect(isForeignKeyColumnName("remediation_owner")).toBe(true);
  });

  it("rejects an ordinary column", () => {
    expect(isForeignKeyColumnName("title")).toBe(false);
    expect(isForeignKeyColumnName("status")).toBe(false);
    // Near-misses: a person-role name is an exact match, not a prefix.
    expect(isForeignKeyColumnName("assigned_to_team")).toBe(false);
  });
});

describe("attributeReferenceId", () => {
  it("gives a suffix-less person-role FK a lookup rather than a text box", () => {
    expect(
      attributeReferenceId({ name: "assigned_to", type: "string", isForeignKey: true } as never)
    ).toBe(ReferenceType.TABLE_DIRECT);
  });

  it("leaves a column the model never marked FK alone", () => {
    // The FK modifier still has to be there: the name alone does not make a
    // reference, or a model with a plain `owner_id` integer would get a picker
    // onto a table it never meant.
    expect(attributeReferenceId({ name: "assigned_to", type: "string" } as never)).toBe(
      ReferenceType.STRING
    );
  });
});
