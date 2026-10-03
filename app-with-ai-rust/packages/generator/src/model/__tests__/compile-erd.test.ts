/* eslint-disable @typescript-eslint/no-non-null-assertion -- test assertions: values are guaranteed by test setup */
import { describe, expect, it } from "vitest";
import { compileYaml } from "./compile-yaml";

describe("the ERD compiler", () => {
  describe("entities", () => {
    it("compiles an entity with its table name, key and timestamps", () => {
      const { entities } = compileYaml(`eml: "1.0"
entities:
  - name: Patient
    attributes:
      - { name: id, type: string, pk: true }
      - { name: name, type: string }
      - { name: email, type: string, unique: true }
      - { name: age, type: integer, optional: true }
`);
      expect(entities).toHaveLength(1);
      const patient = entities[0]!;
      expect(patient.name).toBe("Patient");
      expect(patient.tableName).toBe("patient");
      expect(patient.primaryKey).toBe("id");
      expect(patient.timestamps).toBe(true);
    });

    it("snake-cases a PascalCase name into the table name", () => {
      const { entities } = compileYaml(`eml: "1.0"
entities: [{ name: PatientRecord, attributes: [{ name: id, type: string, pk: true }] }]
`);
      expect(entities[0]?.tableName).toBe("patient_record");
    });

    it("adds an id key to an entity that declares none", () => {
      const { entities } = compileYaml(`eml: "1.0"
entities:
  - name: Product
    attributes:
      - { name: name, type: string }
      - { name: price, type: decimal }
`);
      const id = entities[0]!.attributes.find((attribute) => attribute.name === "id");
      expect(id).toBeDefined();
      expect(id?.unique).toBe(true);
    });

    it("does not add a second id to an entity that declares one", () => {
      const { entities } = compileYaml(`eml: "1.0"
entities:
  - name: User
    attributes:
      - { name: id, type: string, pk: true }
      - { name: name, type: string }
`);
      expect(entities[0]?.attributes.filter((attribute) => attribute.name === "id")).toHaveLength(1);
    });

    it("keeps entities in the order the model lists them", () => {
      const { entities } = compileYaml(`eml: "1.0"
entities:
  - { name: Customer, attributes: [{ name: id, type: string, pk: true }] }
  - { name: Order, attributes: [{ name: id, type: string, pk: true }] }
`);
      expect(entities.map((entity) => entity.name)).toEqual(["Customer", "Order"]);
    });
  });

  describe("attributes", () => {
    it("maps each type alias to the language's canonical type", () => {
      const { entities } = compileYaml(`eml: "1.0"
entities:
  - name: TypeTest
    attributes:
      - { name: name, type: string }
      - { name: email, type: varchar }
      - { name: count, type: int }
      - { name: total, type: integer }
      - { name: price, type: decimal }
      - { name: weight, type: float }
      - { name: active, type: bool }
      - { name: verified, type: boolean }
      - { name: birthday, type: date }
      - { name: created_on, type: datetime }
      - { name: metadata, type: json }
      - { name: user_ref, type: uuid }
`);
      const types = Object.fromEntries(
        entities[0]!.attributes.map((attribute) => [attribute.name, attribute.type])
      );
      expect(types).toMatchObject({
        name: "string",
        email: "string",
        count: "integer",
        total: "integer",
        price: "decimal",
        weight: "decimal",
        active: "boolean",
        verified: "boolean",
        birthday: "date",
        created_on: "datetime",
        metadata: "json",
        user_ref: "string",
      });
    });

    it("makes a column required unless it is optional", () => {
      const { entities } = compileYaml(`eml: "1.0"
entities:
  - name: Item
    attributes:
      - { name: id, type: string, pk: true }
      - { name: name, type: string }
      - { name: notes, type: string, optional: true }
`);
      const attributes = entities[0]!.attributes;
      expect(attributes.find((attribute) => attribute.name === "name")?.required).toBe(true);
      expect(attributes.find((attribute) => attribute.name === "notes")?.required).toBe(false);
    });

    it("makes a column unique only when it says so", () => {
      const { entities } = compileYaml(`eml: "1.0"
entities:
  - name: User
    attributes:
      - { name: id, type: string, pk: true }
      - { name: email, type: string, unique: true }
      - { name: name, type: string }
`);
      const attributes = entities[0]!.attributes;
      expect(attributes.find((attribute) => attribute.name === "email")?.unique).toBe(true);
      expect(attributes.find((attribute) => attribute.name === "name")?.unique).toBeFalsy();
    });

    it("reads a length off the type", () => {
      const { entities } = compileYaml(`eml: "1.0"
entities:
  - name: Code
    attributes:
      - { name: id, type: string, pk: true }
      - { name: short, type: string(12) }
`);
      expect(entities[0]!.attributes.find((attribute) => attribute.name === "short")?.maxLength).toBe(12);
    });
  });

  describe("relationships", () => {
    const withEnds = (from: string, to: string) =>
      compileYaml(`eml: "1.0"
entities:
  - { name: A, attributes: [{ name: id, type: string, pk: true }] }
  - { name: B, attributes: [{ name: id, type: string, pk: true }] }
relationships:
  - { from: A, fromCardinality: ${from}, to: B, toCardinality: ${to} }
`).relationships[0]!;

    it.each([
      ["exactly-one", "exactly-one", "oneToOne"],
      ["exactly-one", "zero-or-more", "oneToMany"],
      ["exactly-one", "one-or-more", "oneToMany"],
      ["zero-or-more", "exactly-one", "manyToOne"],
      ["one-or-more", "exactly-one", "manyToOne"],
      ["zero-or-more", "zero-or-more", "manyToMany"],
      ["one-or-more", "one-or-more", "manyToMany"],
      ["zero-or-one", "zero-or-one", "oneToOne"],
    ])("compiles %s to %s as %s", (from, to, kind) => {
      expect(withEnds(from, to).cardinality).toBe(kind);
    });

    it("keeps the direction the model states", () => {
      const relationship = withEnds("exactly-one", "zero-or-more");
      expect(relationship.sourceEntity).toBe("A");
      expect(relationship.targetEntity).toBe("B");
    });

    it("names the foreign key after the one side, on the many side", () => {
      expect(withEnds("exactly-one", "zero-or-more").foreignKey).toBe("a_id");
      expect(withEnds("zero-or-more", "exactly-one").foreignKey).toBe("b_id");
    });

    it("names a relationship from its label, and from its ends otherwise", () => {
      const { relationships } = compileYaml(`eml: "1.0"
entities:
  - { name: Doctor, attributes: [{ name: id, type: string, pk: true }] }
  - { name: Appointment, attributes: [{ name: id, type: string, pk: true }] }
relationships:
  - { from: Doctor, fromCardinality: exactly-one, to: Appointment, toCardinality: zero-or-more, label: schedules }
  - { from: Doctor, fromCardinality: exactly-one, to: Appointment, toCardinality: zero-or-more }
`);
      expect(relationships.map((relationship) => relationship.name)).toEqual([
        "schedules",
        "doctor_appointment",
      ]);
    });
  });
});
