/**
 * A declared index has to reach the database.
 *
 * Indexes were once reserved, documented and validated by the checker while no
 * compiler read them — so every declaration produced nothing. It looked like it
 * worked: the unique declarations in the drug-discovery model all name columns
 * that are also `unique`, which emits an index of its own. The composite
 * declarations, which no convention can produce, were the ones that went
 * missing.
 *
 * These tests cover the compile and the merge. The merge matters as much: both
 * sources name an index after its columns, so emitting them independently
 * produced two `CREATE INDEX IF NOT EXISTS` statements with the same name, and
 * the second — the one carrying `unique` — was the no-op.
 */

import { entityToBusEntity } from "@appwithai/core/types";
import { describe, expect, it } from "vitest";
import { compileYaml } from "./compile-yaml";

const contactWith = (indexes: string) =>
  compileYaml(`eml: "1.0"
entities:
  - name: Contact
    attributes:
      - { name: id, type: string, pk: true }
      - { name: email, type: string, unique: true }
      - { name: name, type: string }
      - { name: company_id, type: string, fk: true }
      - { name: status, type: string }
    indexes:
${indexes}
`).entities.find((entity) => entity.name === "Contact");

const DECLARED = `      - { columns: [company_id, status] }
      - { columns: [email], unique: true }`;

describe("declared indexes", () => {
  it("compiles a composite index in the order written", () => {
    expect(contactWith(DECLARED)?.indexes).toContainEqual({
      columns: ["company_id", "status"],
      unique: false,
    });
  });

  it("compiles the unique flag", () => {
    expect(contactWith(DECLARED)?.indexes).toContainEqual({ columns: ["email"], unique: true });
  });

  it("drops an index naming a column the entity does not have", () => {
    // The migration would fail on a column that does not exist, and a
    // migration that cannot apply is worse than a missing index (EML151).
    const contact = contactWith(`${DECLARED}\n      - { columns: [nope] }`);
    expect(contact?.indexes?.some((index) => index.columns.includes("nope"))).toBe(false);
    expect(contact?.indexes).toHaveLength(2);
  });
});

describe("merging declared indexes with the conventional ones", () => {
  const contact = entityToBusEntity(contactWith(DECLARED) as never);
  const names = contact.indexes?.map((index) => index.columns.join(","));

  it("keeps one index per column set", () => {
    expect(names).toHaveLength(new Set(names).size);
  });

  it("lets the declaration win over the convention on overlap", () => {
    // `email` is both unique and declared unique: one index, unique — not two
    // with the same name where the unique one is silently skipped.
    const email = contact.indexes?.filter((index) => index.columns.join(",") === "email");
    expect(email).toHaveLength(1);
    expect(email?.[0]?.unique).toBe(true);
  });

  it("still adds the conventional index for a column with no declaration", () => {
    expect(contact.indexes).toContainEqual({ columns: ["name"], unique: false });
  });

  it("keeps the composite, which no convention would produce", () => {
    expect(contact.indexes).toContainEqual({ columns: ["company_id", "status"], unique: false });
  });
});
