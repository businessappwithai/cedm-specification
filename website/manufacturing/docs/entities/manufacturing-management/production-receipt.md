---
title: "Production Receipt"
sidebar_label: "Production Receipt"
sidebar_position: 7
description: "Accepted manufacturing output transaction with inventory and genealogy evidence."
---

# Production Receipt

Accepted manufacturing output transaction with inventory and genealogy evidence. ProductionReceipt explains why finished/semi-finished stock increased; InventoryMovement records the stock consequence. Production completion, inventory receipt, costing, quality release, genealogy, and recall. Work order supplies production authorization; Lot/SerialNumber identify output; quality governs release; movement updates stock. Prepared → quality/quantity validated → received/posted → immutable history. Receipt updates inventory and production completion and connects consumed material genealogy to output identities.

## Finding records

Open **Production Receipt** from the menu or from its card on the dashboard.

![The Production Receipt list](/img/entities/production-receipt-list.jpg)

The list shows Receipt Number, Quantity, Received At, Work Order, Product, Lot, Quality Inspection, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Production Receipt form](/img/entities/production-receipt-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Receipt Number**, **Quantity**, **Received At**, **Work Order**, **Product**, **Inventory Movement**.
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
| Receipt Number | Text | Required, Unique, Up to 100 characters | Human-facing production receipt reference. Operational identifier for output posting. Shop floor, warehouse, quality, and audit. Distinct from inventory movement number. Required. |
| Quantity | Amount | Required | Accepted output quantity received into inventory. Quantity recognized as produced/receivable. Production completion, inventory, and costing. Rejected/scrap quantity is modeled separately. Required. |
| Received At | Date and time | Required | Effective output receipt time. Establishes production and inventory chronology. Inventory, costing, genealogy, and reporting. Distinct from work-order completion time. Required. |
| Work Order | Lookup | Required | Production order creating output. Supplies authorization, product, BOM/routing context. Completion and variance reconciliation. Exactly one work order. Output cannot exceed governed production quantity without authorized overproduction. Pick a record from **Manufacturing Work Order**. |
| Product | Lookup | Required | Produced item received. Identifies output inventory item. Inventory and genealogy. Exactly one Product. Must reconcile with work-order output. Pick a record from **Product**. |
| Lot | Lookup | Optional | Output production lot. Groups produced quantity for genealogy/quality/recall. Traceability and quality release. Required according to lot-control policy. May remain quarantined pending required quality evidence. Pick a record from **Lot**. |
| Quality Inspection | Lookup | Optional | Inspection evidence governing output acceptance/release. Separates production from quality disposition. Release and compliance. Optional unless quality plan requires it. Required quality gates constrain availability. Pick a record from **Quality Inspection**. |
| Inventory Movement | Lookup | Required | Posted stock event implementing output receipt. InventoryMovement remains authoritative inventory ledger. Balance reconciliation and audit. Exactly one attributable posting per executed receipt. Must reconcile product/quantity/lot/serial and be idempotent. Pick a record from **Inventory Movement**. |

## How it connects to other records
- A production receipt belongs to one **Manufacturing Work Order**.
- A production receipt belongs to one **Product**.
- A production receipt belongs to one **Lot**.
- A production receipt has many **Serial Number** records.
- A production receipt belongs to one **Quality Inspection**.
- A production receipt has one **Inventory Movement**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Production receipt invariants before create | before a production receipt is created | 100 |
| Production receipt invariants before update | before a production receipt is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Production Receipt** window. Access is granted by role under [Roles and access](/administration/access/).
