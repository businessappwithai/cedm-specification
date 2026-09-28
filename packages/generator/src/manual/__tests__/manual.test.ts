/**
 * The manual describes the model it was given.
 *
 * It is the one artefact a non-technical reader of a generated application will
 * open, and nothing else checks it: the app runs whether or not the manual is
 * accurate, so a section that silently stopped rendering would go unnoticed
 * until somebody read it and found their own entity missing.
 *
 * These assert against the *model* rather than against a fixture of the output,
 * which is what makes them survive an edit to the prose.
 */

import { describe, expect, it } from "vitest";
import { compileYaml } from "../../model/__tests__/compile-yaml";
import { renderManual } from "../index";

const MODEL = `eml: "1.0"
name: Billing
enums:
  - name: InvoiceStatus
    values: [draft, sent, paid]
categories:
  - name: Money
    description: What is owed
    entities: [Invoice, InvoiceLine]
entities:
  - name: Invoice
    help: A request for payment.
    attributes:
      - name: id
        type: string
        pk: true
      - name: number
        type: string
        unique: true
      - name: status
        type: string
        enum: InvoiceStatus
      - name: customer_name
        type: string
  - name: InvoiceLine
    parent: Invoice
    attributes:
      - name: id
        type: string
        pk: true
      - name: invoice_id
        type: string
        fk: true
      - name: product_name
        type: string
      - name: quantity
        type: integer
relationships:
  - from: Invoice
    fromCardinality: exactly-one
    to: InvoiceLine
    toCardinality: zero-or-more
    label: has
rbac:
  - entity: Invoice
    action: read
    roles: [billing_clerk]
rules:
  - name: invoiceApproval
    title: Invoice Approval
    entity: Invoice
    event: beforeUpdate
    nodes:
      - id: A
        label: Start
        type: start
      - id: B
        label: status == paid?
        type: decision
      - id: C
        label: Done
        type: end
    edges:
      - from: A
        to: B
      - from: B
        to: C
stateMachines:
  - name: InvoiceLifecycle
    title: Invoice Lifecycle
    entity: Invoice
    states: [draft, sent, paid]
    initial: draft
    final: [paid]
    transitions:
      - from: draft
        to: sent
        trigger: send
      - from: sent
        to: paid
        trigger: settle
`;

function manual(): string {
  return renderManual(compileYaml(MODEL), {
    name: "Billing",
    version: "1.0.0",
    description: "Invoices and what is owed",
    stack: "loco",
  });
}

describe("renderManual", () => {
  it("names every entity the model declares", () => {
    const html = manual();
    expect(html).toContain("Invoice");
    expect(html).toContain("Invoice Line");
    expect(html).toContain('id="entity-invoice"');
  });

  it("carries the model's own help text rather than inventing prose", () => {
    expect(manual()).toContain("A request for payment.");
  });

  it("lists the roles an access rule named, alongside the built-in two", () => {
    const html = manual();
    expect(html).toContain("Billing Clerk");
    expect(html).toContain("Administrator");
  });

  it("has a section for the rules and one for the lifecycle", () => {
    const html = manual();
    expect(html).toContain("invoiceApproval");
    // The state machine's own states, which is what a reader checks the
    // application against.
    expect(html).toContain("draft");
    expect(html).toContain("paid");
  });

  it("renders no template artefacts", () => {
    const html = manual();
    for (const artefact of ["{{", "undefined", "[object Object]", "NaN"]) {
      expect(html, `manual contains ${artefact}`).not.toContain(artefact);
    }
  });

  it("is a complete standalone document", () => {
    const html = manual();
    expect(html.trimStart().toLowerCase().startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("</html>");
    // Self-contained: a reader opens it from the file system, so it must not
    // fetch a stylesheet or a script it will not find there.
    expect(html).not.toContain("<script src=");
    expect(html).not.toContain('rel="stylesheet"');
  });

  it("says nothing about processes when the model declares none", () => {
    // The section is conditional; rendering an empty "The processes it runs"
    // heading tells a reader to look for something that is not there.
    expect(manual()).not.toContain("The processes it runs");
  });
});
