---
title: "Material Issue"
sidebar_label: "Material Issue"
sidebar_position: 5
description: "Production material-consumption transaction with full inventory and genealogy provenance."
---

# Material Issue

Production material-consumption transaction with full inventory and genealogy provenance. MaterialIssue explains why material was consumed; InventoryMovement records the physical stock consequence. Shop-floor staging/consumption, inventory, costing, genealogy, recall, and variance analysis. ManufacturingWorkOrder authorizes demand, BOMComponent supplies standard requirement, Lot/SerialNumber preserve provenance. Prepared → validated → issued/posted → immutable history; corrections compensate. Issue posting updates inventory projections and manufacturing material reconciliation and contributes input genealogy for produced output.

## Finding records

Open **Material Issue** from the menu or from its card on the dashboard.

The list shows Issue Number, Quantity, Issued At, Work Order, BOM Component, Product, Lot, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Issue Number**, **Quantity**, **Issued At**, **Work Order**, **Product**, **Inventory Movement**.
3. For a dropdown that points at another window, pick the matching record; if the record you need does not exist yet, create it in its own window first. A dropdown may narrow to what you have already chosen, for example the states of the chosen country.
4. Choose **Create** (or **Save** in the toolbar). You return to the record, and it appears at the top of the list. If something is wrong the form says which field and why, and nothing is saved.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Issue Number | Text | Required, Unique, Up to 100 characters | Human-facing issue reference. Operational traceability identifier. Shop floor, warehouse, and audit. Distinct from inventory movement number. Required. |
| Quantity | Amount | Required | Component quantity issued. Amount authorized for production consumption. Material reconciliation, variance, and costing. Interpreted with component Product/UOM/lot/serial. Required. |
| Issued At | Date and time | Required | Effective material issue time. Establishes production consumption chronology. Inventory, genealogy, costing, and audit. Must align with attributable movement. Required. |
| Work Order | Lookup | Required | Production order consuming material. Identifies authorized manufacturing demand. Material reconciliation and genealogy. Exactly one work order. Must be released/in progress according to policy. Pick a record from **Manufacturing Work Order**. |
| BOM Component | Lookup | Optional | Planned BOM requirement being consumed. Connects actual issue to standard material demand. Variance and genealogy. Optional for authorized unplanned material. Quantity/product normally reconcile with effective BOM. Pick a record from **Bill Of Material**. |
| Product | Lookup | Required | Component material issued. Identifies consumed item. Inventory and costing. Exactly one Product. Must match BOM component or approved substitution. Pick a record from **Product**. |
| Lot | Lookup | Optional | Consumed component lot. Preserves input batch genealogy. Traceability and recall. Required when product is lot-controlled. Lot must be eligible and available. Pick a record from **Lot**. |
| Inventory Movement | Lookup | Required | Posted stock event implementing physical issue. InventoryMovement remains authoritative stock ledger. Reconciliation and audit. Exactly one attributable posting for executed issue. Posting must be idempotent and reconcile quantity/product/lot/serial. Pick a record from **Inventory Movement**. |

## How it connects to other records
- A material issue belongs to one **Manufacturing Work Order**.
- A material issue belongs to one **Bill Of Material**.
- A material issue belongs to one **Product**.
- A material issue belongs to one **Lot**.
- A material issue has many **Serial Number** records.
- A material issue has one **Inventory Movement**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Material issue invariants before create | before a material issue is created | 100 |
| Material issue invariants before update | before a material issue is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Material Issue** window. Access is granted by role under [Roles and access](/administration/access/).
