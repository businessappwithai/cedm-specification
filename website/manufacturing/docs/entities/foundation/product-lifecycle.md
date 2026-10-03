---
title: "Product"
sidebar_label: "Product"
sidebar_position: 20
description: "Effective-dated audit trail of product eligibility changes."
---

# Product

Effective-dated audit trail of product eligibility changes. Product.status is current state; ProductLifecycle preserves governed transition history and reason. PIM governance, product introduction, blocking, discontinuation and retirement. Changes propagate to open dependent workflows while historical evidence remains immutable. Append-only governed transition history for Product.

## Finding records

Lines are added from the parent: open a **Product** and choose the **Product** tab.

The list shows Effective At, Lifecycle Status, Reason, Product, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Product** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Effective At | Date and time | Required | Time lifecycle transition becomes effective. Establishes point-in-time product eligibility. Catalog, transaction validation and audit. Historical transactions use status effective at relevant time. Required. |
| Lifecycle Status | Choice | Required | Product lifecycle state established by event. Governs future product eligibility. Master-data workflow. Reconciles to current Product.status. Not yet generally usable. Eligible. No new ordinary demand. Temporarily restricted. Lifecycle closed. Required. Choose one: Draft, Active, Discontinued, Blocked, Retired. |
| Reason | Text | Required, Up to 1000 characters | Business reason for transition. Provides governance/audit justification. Approval and downstream exception handling. Does not itself reverse existing obligations. Required. |
| Product | Lookup | Required | Product whose lifecycle changes. Supplies governed master context. Eligibility and audit. Exactly one Product. Transition triggers dependency validation. Pick a record from **Product**. |

## How it connects to other records

A product is a line of a **Product**. It has no window of its own: open the product and use the **Product** tab to see and add lines.
- A product belongs to one **Product**.

## Who may use it

Anyone who holds a role with access to the **Product** window. Access is granted by role under [Roles and access](/administration/access/).
