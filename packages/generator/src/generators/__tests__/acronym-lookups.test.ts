/**
 * Regression: an entity whose name begins with an acronym was invisible to
 * every derivation that works from a column's stem.
 *
 * `KYCVerification.kyc_record_id` points at `KYCRecord`, and three separate
 * copies of "snake-case an entity name" had to agree for that to be noticed.
 * They did not. Core's guarded only the all-caps case, so `KYCRecord` became
 * `k_y_c_record` and the generated migration created `bus_k_y_c_record`; the
 * Mermaid parser and the dictionary-help composer each carried a third and a
 * fourth copy, both of which produced `kycrecord`.
 *
 * Nothing failed. The application simply had a table under a name no other
 * component would ever ask for, a lookup labelled `Kyc Record Id`, and field
 * help that read "The kyc record of this KYC Verification" — the column name
 * in prose, which is the restatement EML151 exists to refuse.
 *
 * One snake-caser now, in core, and `crates/appwithai-gen/src/naming.rs`
 * mirrors it — `bun run parity` is what holds the two together.
 */

import { declaredEntityNames, type Entity, entityToBusEntity } from "@appwithai/core/types";
import { snakeCase } from "@appwithai/core/utils";
import { describe, expect, it } from "vitest";
import { MermaidParser } from "../../parsers/mermaid.parser";
import { buildDictionaryHelp } from "../dictionary-help";

const MODEL = `
erDiagram
    KYCRecord {
        string id PK
        string reference
        string contact_email
    }
    KYCVerification {
        string id PK
        string kyc_record_id FK
        string outcome
    }
    KYCRecord ||--o{ KYCVerification : "verified by"
`;

function parsed(): Entity[] {
  return new MermaidParser().parse(MODEL).entities;
}

describe("an entity whose name begins with an acronym", () => {
  it("gets the table name every other component derives for it", () => {
    const record = parsed().find((entity) => entity.name === "KYCRecord");
    expect(record?.tableName).toBe("kyc_record");
    expect(snakeCase("KYCRecord")).toBe("kyc_record");
  });

  it("is what its foreign key is labelled by, acronym intact", () => {
    const entities = parsed();
    const declared = declaredEntityNames(entities);
    const verification = entities.find((entity) => entity.name === "KYCVerification");
    const bus = entityToBusEntity(verification as Entity, declared);
    const link = bus.attributes.find((attr) => attr.columnName === "kyc_record_id");
    expect(link?.displayName).toBe("KYC Record");
  });

  it("is resolvable by the help composer, which works from the same stem", () => {
    const entities = parsed();
    const declared = declaredEntityNames(entities);
    const help = buildDictionaryHelp(entities.map((entity) => entityToBusEntity(entity, declared)));
    const field = help.bus_kyc_verification?.fields.kyc_record_id ?? "";

    // The resolved sentence names the target entity and says it is a lookup.
    expect(field).toContain("KYC Record");
    expect(field).toContain("lookup");
    // The unresolved fallback restates the column name in prose.
    expect(field).not.toContain("The kyc record of this");
  });
});

describe("a foreign key names the entity it points at", () => {
  it("takes the column from the one side of a oneToMany, not the many", () => {
    const relationship = new MermaidParser().parse(MODEL).relationships[0];
    expect(relationship?.cardinality).toBe("oneToMany");
    expect(relationship?.foreignKey).toBe("kyc_record_id");
  });
});
