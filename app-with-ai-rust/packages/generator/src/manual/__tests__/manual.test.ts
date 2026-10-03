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
import { parseModel } from "../../pipeline/parse-model";
import { renderManual } from "../index";

const MODEL = `
%%meta name: Billing
%%enum InvoiceStatus: draft, sent, paid

%%category name: Money; description: What is owed; entities: Invoice, InvoiceLine

erDiagram
    Invoice {
        string id PK
        string number UK
        string status
        string customer_name
    }

    InvoiceLine {
        string id PK
        string invoice_id FK
        string product_name
        integer quantity
    }

    Invoice ||--o{ InvoiceLine : "has"

    %%field Invoice.status enum: InvoiceStatus
    %%entity Invoice help: A request for payment.
    %%entity InvoiceLine parent: Invoice
    %%rbac role:billing_clerk on Invoice.read

%%meta name: Invoice Approval
%%meta kind: rules
%%rule invoiceApproval on Invoice event: beforeUpdate
flowchart TD
    A([Start]) --> B{status == paid?}
    B --> C([Done])

%%meta name: Invoice Lifecycle
%%meta kind: workflow
%%workflow InvoiceLifecycle entity: Invoice kind: state
stateDiagram-v2
    [*] --> draft
    draft --> sent : send
    sent --> paid : settle
    paid --> [*]
`;

function manual(): string {
  return renderManual(parseModel(MODEL), {
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

  it("lists the roles a %%rbac directive named, alongside the built-in two", () => {
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
