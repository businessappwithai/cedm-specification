import { describe, expect, it } from "vitest";
import {
  compileModelDocument,
  readModelYaml,
  serializeModelDocument,
} from "@appwithai/generator/model-yaml";
import type { DomainAnalysis } from "../../types";
import { domainToModelDocument } from "../from-domain";

const analysis: DomainAnalysis = {
  summary: "A clinic books\n appointments for its patients.",
  entities: [
    {
      name: "patient",
      description: "Someone the clinic treats",
      suggestedAttributes: [
        { name: "fullName", type: "String", required: true },
        { name: "email", type: "email", required: false, unique: true },
      ],
      confidence: 1,
      reasoning: "stated",
    },
    {
      name: "Appointment",
      description: "A booked visit",
      suggestedAttributes: [
        { name: "scheduledAt", type: "datetime", required: true },
        { name: "patientId", type: "uuid", required: true },
      ],
      confidence: 1,
      reasoning: "stated",
    },
  ],
  relationships: [
    { name: "books", source: "Patient", target: "Appointment", cardinality: "oneToMany", confidence: 1, reasoning: "" },
    { name: "bills", source: "Invoice", target: "Appointment", cardinality: "oneToMany", confidence: 0.4, reasoning: "" },
  ],
};

describe("domainToModelDocument", () => {
  const { document, dropped } = domainToModelDocument(analysis, "Clinic");
  const text = serializeModelDocument(document);
  const read = readModelYaml(text);

  it("writes a model the checker accepts and the generator compiles", () => {
    expect(read.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const compiled = compileModelDocument(read.document!);
    expect(compiled.entities.map((e) => e.name)).toEqual(["Patient", "Appointment"]);
  });

  it("names columns in snake_case and gives every entity an id key", () => {
    const patient = document.entities[0]!;
    expect(patient.attributes.map((a) => a.name)).toEqual(["id", "full_name", "email"]);
    expect(patient.attributes[0]).toEqual({ name: "id", type: "uuid", pk: true });
    expect(patient.attributes[1]?.type).toBe("string");
    expect(patient.attributes[2]).toMatchObject({ unique: true, optional: true });
  });

  it("marks the foreign key the generator resolves, on the many side, without duplicating it", () => {
    const appointment = document.entities[1]!;
    // The analysis listed the key itself as patientId; it is the same column.
    const keys = appointment.attributes.filter((a) => a.name.endsWith("_id"));
    expect(keys).toEqual([{ name: "patient_id", type: "uuid", fk: true }]);
    expect(document.relationships).toEqual([
      { from: "Patient", fromCardinality: "exactly-one", to: "Appointment", toCardinality: "zero-or-more", label: "books" },
    ]);
  });

  it("reports a relationship to an entity it never declared instead of inventing one", () => {
    expect(dropped).toEqual(["Invoice oneToMany Appointment"]);
  });

  it("writes prose as single lines", () => {
    expect(document.description).toBe("A clinic books appointments for its patients.");
  });
});
