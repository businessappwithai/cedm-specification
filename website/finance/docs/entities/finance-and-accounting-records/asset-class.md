---
title: "Asset Class"
sidebar_label: "Asset Class"
sidebar_position: 2
description: "A governed classification defining accounting, depreciation, lifecycle, and control defaults for Assets."
---

# Asset Class

A governed classification defining accounting, depreciation, lifecycle, and control defaults for Assets. Provide canonical enterprise semantics for AssetClass. A governed classification defining accounting, depreciation, lifecycle, and control defaults for Assets. Used in asset, maintenance, treasury, banking, credit-risk, accounting, integration, and audit workflows where applicable. Connects operational or financial lifecycle evidence to canonical masters while keeping accounting, bank, and physical records authoritative in their own domains. Created under governed conditions, progressed or finalized with audit history, and corrected through explicit subsequent evidence. Asset lifecycle, maintenance, treasury operations, bank reconciliation, lending, accounting, reporting, and audit. Enterprise fixed assets, equipment reliability, bank close, FX, deposits, interest, and secured lending.

## Finding records

Open **Asset Class** from the menu or from its card on the dashboard.

The list shows Effective At, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. No field is mandatory; fill in what you know.
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
| Effective At | Date and time | Optional | Effective timestamp for the record. Establishes temporal applicability or evidence cutoff. Lifecycle, reconciliation and reporting. Historical evidence before this time remains intact. Optional where the concept uses another effective period. |

## Who may use it

Anyone who holds a role with access to the **Asset Class** window. Access is granted by role under [Roles and access](/administration/access/).
