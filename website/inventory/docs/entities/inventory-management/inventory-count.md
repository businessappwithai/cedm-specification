---
title: "Inventory Count"
sidebar_label: "Inventory Count"
sidebar_position: 2
description: "Physical inventory observation used for controlled reconciliation."
---

# Inventory Count

Physical inventory observation used for controlled reconciliation. A count states what was observed; it does not rewrite what the ledger says happened. Cycle count, annual stocktake, serial verification and inventory-control audit. Product/location/lot/serial define count scope; InventoryAdjustment resolves approved variance. Planned/performed → reviewed → reconciled → closed; evidence retained. Approved variance may create adjustments; observations themselves never post inventory.

## Finding records

Open **Inventory Count** from the menu or from its card on the dashboard.

The list shows Count Number, Counted Quantity, Counted At, Product, Inventory Location, Lot, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Count Number**, **Counted Quantity**, **Counted At**, **Product**, **Inventory Location**.
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
| Count Number | Text | Required, Unique, Up to 100 characters | Human-facing count reference. Operational identifier for count activity. Warehouse execution and audit. Distinct from adjustment reference. Required. |
| Counted Quantity | Amount | Required | Quantity physically/systematically observed. Evidence of stock reality at count time. Variance calculation and approval. Does not itself alter InventoryBalance. Required. |
| Counted At | Date and time | Required | Effective observation time. Anchors the count against ledger chronology. Cutoff and reconciliation. Movements around count time require controlled cutoff treatment. Required. |
| Product | Lookup | Required | Product counted. Identifies observed item. Reconciliation. Exactly one Product. Must match stock context. Pick a record from **Product**. |
| Inventory Location | Lookup | Required | Location counted. Defines physical/accountable stock scope. Cycle counting and stocktake. Exactly one location. Ledger cutoff uses this location. Pick a record from **Warehouse**. |
| Lot | Lookup | Optional | Lot counted where applicable. Preserves batch-specific observation. Traceability and reconciliation. Required under lot-controlled count scope. Variance is lot-specific. Pick a record from **Lot**. |

## How it connects to other records
- A inventory count belongs to one **Product**.
- A inventory count belongs to one **Warehouse**.
- A inventory count belongs to one **Lot**.
- A inventory count has many **Serial Number** records.
- A inventory count has many **Inventory Adjustment** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Inventory count invariants before create | before a inventory count is created | 100 |
| Inventory count invariants before update | before a inventory count is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Inventory Count** window. Access is granted by role under [Roles and access](/administration/access/).
