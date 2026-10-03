---
title: "Scrap"
sidebar_label: "Scrap"
sidebar_position: 2
description: "Governed manufacturing loss/disposition evidence."
---

# Scrap

Governed manufacturing loss/disposition evidence. Scrap explains rejected or lost quantity; it is distinct from accepted ProductionReceipt and from InventoryMovement, which remains the stock ledger. Yield, manufacturing variance, quality, costing, genealogy, inventory and continuous improvement. ManufacturingWorkOrder supplies context; Nonconformance may explain quality cause; Lot/Serial preserve genealogy; InventoryMovement records stock consequence when applicable. Recorded → validated/authorized → inventory/quality reconciled → immutable historical evidence. Scrap updates yield/cost/quality analysis and inventory only through governed attributable transactions.

## Finding records

Open **Scrap** from the menu or from its card on the dashboard.

![The Scrap list](/img/entities/scrap-list.jpg)

The list shows Scrap Number, Quantity, Reason Code, Scrapped At, Work Order, Product, Lot, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Scrap form](/img/entities/scrap-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Scrap Number**, **Quantity**, **Reason Code**, **Scrapped At**, **Work Order**, **Product**.
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
| Scrap Number | Text | Required, Unique, Up to 100 characters | Human-facing scrap reference. Operational identifier for production loss. Shop-floor reporting, quality, costing and audit. Distinct from inventory movement reference. Required. |
| Quantity | Amount | Required | Quantity classified as scrap. Quantifies governed production loss or rejected material. Yield, variance, costing and inventory. Interpreted with Product/UOM/lot/serial context. Required. |
| Reason Code | Text | Required, Up to 100 characters | Governed reason for scrap. Classifies why material/output was lost or rejected. Quality analysis, costing and continuous improvement. Should align with controlled reason taxonomy. Required. |
| Scrapped At | Date and time | Required | Effective scrap time. Establishes production-loss chronology. Cost period, genealogy and audit. Must align with related execution evidence. Required. |
| Work Order | Lookup | Required | Production order under which scrap occurred. Supplies production authorization and planned context. Yield and variance reconciliation. Exactly one work order. Scrap contributes to completion reconciliation. Pick a record from **Manufacturing Work Order**. |
| Product | Lookup | Required | Material or output being scrapped. Identifies the item affected. Inventory, costing, quality and analysis. Exactly one Product. Must reconcile with work-order input/output context or approved exception. Pick a record from **Product**. |
| Lot | Lookup | Optional | Lot affected by scrap. Preserves batch genealogy and disposition. Recall, quality and inventory. Required under lot-control policy. Lot quantity/state must reconcile. Pick a record from **Lot**. |

## How it connects to other records
- A scrap belongs to one **Manufacturing Work Order**.
- A scrap has one **Inventory Movement**.
- A scrap belongs to one **Product**.
- A scrap belongs to one **Lot**.
- A scrap has many **Serial Number** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Scrap invariants before create | before a scrap is created | 100 |
| Scrap invariants before update | before a scrap is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Scrap** window. Access is granted by role under [Roles and access](/administration/access/).
