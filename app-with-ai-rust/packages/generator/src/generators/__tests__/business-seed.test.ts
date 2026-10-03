/**
 * `seed/business.sql` — demonstration records for the model's own entities.
 *
 * Three properties matter and none of them is about the values being pretty:
 *
 *   1. a foreign key names a row the same file inserts, and the entity order
 *      makes that possible with referential integrity switched on;
 *   2. a column bound to a `%%enum` takes a declared value;
 *   3. a status column backing a state machine takes the machine's initial
 *      state, whatever the enum would otherwise have offered.
 *
 * The third is the one that has already cost this product a release. A record
 * seeded into a state the diagram never drew is a record no guard will move, so
 * the workflow the application was generated to demonstrate is dead on exactly
 * the rows meant to demonstrate it.
 *
 * The Rust mirror (`crates/appwithai-gen/src/business.rs`) carries the same
 * cases. That the two agree byte for byte is `bun run parity`'s job.
 */

import { declaredEntityNames, entityToBusEntity } from "@appwithai/core/types";
import { describe, expect, it } from "vitest";
import { MermaidParser } from "../../parsers/mermaid.parser";
import type { CompiledWorkflow } from "../../workflows/state-machine";
import { buildBusinessSeedSql } from "../tanstack-astryx-loco/business-seed";

const MODEL = `erDiagram
    Customer ||--o{ Order : places
    Customer {
        string id PK
        string name
        string email
        string status
    }
    Order {
        string id PK
        string customer_id FK
        decimal total
        string status
        datetime shipped_at OPTIONAL
    }
%%enum OrderStatus: draft, submitted, shipped
%%field Order.status enum: OrderStatus
`;

const ROWS = 5;

function seed(workflows: CompiledWorkflow[] = []): string {
  const parsed = new MermaidParser().parse(MODEL);
  const declared = declaredEntityNames(parsed.entities);
  const entities = parsed.entities.map((entity) => entityToBusEntity(entity, declared));
  return buildBusinessSeedSql({
    projectName: "acme",
    entities,
    relationships: parsed.relationships,
    workflows,
    modelEnums: parsed.enums,
    rowsPerEntity: ROWS,
  });
}

const machine = (initial: string): CompiledWorkflow => ({
  name: "order_flow",
  entity: "Order",
  tableName: "bus_order",
  states: [],
  transitions: [],
  initial,
  terminal: [],
});

describe("the business demonstration seed", () => {
  it("writes a child after the parent it points at", () => {
    // Referential integrity is left on, so the order is the correctness
    // argument: a customer inserted after the order naming it fails the
    // constraint rather than leaving a dangling reference behind.
    const sql = seed();
    expect(sql.indexOf("-- Customer (bus_customer)")).toBeLessThan(
      sql.indexOf("-- Order (bus_order)")
    );
  });

  it("points every foreign key at a row the file inserts", () => {
    const sql = seed();
    const ids = new Set(
      sql
        .split("\n")
        .filter((line) => line.startsWith("VALUES ("))
        .map((line) => line.slice("VALUES ('".length, "VALUES ('".length + 36))
    );

    const orderLines = sql
      .split("\n")
      .slice(sql.split("\n").findIndex((line) => line.includes("-- Order (bus_order)")))
      .filter((line) => line.startsWith("VALUES ("));

    expect(orderLines).toHaveLength(ROWS);
    for (const line of orderLines) {
      const customerId = line.split("'")[3];
      expect(ids.has(customerId as string), `${customerId} references nothing`).toBe(true);
    }
  });

  it("only writes enum values the model declares", () => {
    const sql = seed();
    expect(sql).toContain("'draft'");
    expect(sql).toContain("'submitted'");
    expect(sql).toContain("'shipped'");
    // The vocabulary the old helper invented. None of it is in this model, so
    // any of it here would be a value the dropdown cannot offer.
    expect(sql).not.toContain("'Active'");
    expect(sql).not.toContain("'Pending'");
  });

  it("lets a state machine override the enum with its initial state", () => {
    const sql = seed([machine("draft")]);
    const orderLines = sql
      .split("\n")
      .slice(sql.split("\n").findIndex((line) => line.includes("-- Order (bus_order)")))
      .filter((line) => line.startsWith("VALUES ("));

    expect(orderLines).toHaveLength(ROWS);
    for (const line of orderLines) {
      expect(line).toContain("'draft'");
      expect(line).not.toContain("'shipped'");
    }
  });

  it("leaves an optional timestamp empty rather than assert an event happened", () => {
    // `shipped_at` on a draft order puts the row in two states at once, and
    // reads as a bug in the application rather than in its sample data.
    const sql = seed([machine("draft")]);
    const orderLines = sql
      .split("\n")
      .slice(sql.split("\n").findIndex((line) => line.includes("-- Order (bus_order)")))
      .filter((line) => line.startsWith("VALUES ("));
    for (const line of orderLines) {
      expect(line).toContain("NULL");
    }
  });

  it("is stable and re-runnable", () => {
    const first = seed();
    expect(first).toEqual(seed());

    const inserts = first.match(/INSERT INTO bus_/g) ?? [];
    const guarded = first.split("\n").filter((line) => line.trim() === "ON CONFLICT DO NOTHING;");
    expect(inserts).toHaveLength(ROWS * 2);
    expect(guarded).toHaveLength(inserts.length);
  });

  it("emits a file for a model with no entities at all", () => {
    // `seed_business.rs` embeds it with include_str!, resolved at compile time:
    // a crate emitted without the file does not build, and parity cannot see it
    // because both generators would skip the same file.
    const sql = buildBusinessSeedSql({
      projectName: "acme",
      entities: [],
      relationships: [],
    });
    expect(sql).toContain("This model declares no entities");
  });
});
