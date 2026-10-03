---
title: "Contract Amendment"
sidebar_label: "Contract Amendment"
sidebar_position: 2
description: "A governed change instrument that modifies defined Contract terms prospectively while preserving prior executed contract evidence."
---

# Contract Amendment

A governed change instrument that modifies defined Contract terms prospectively while preserving prior executed contract evidence. Provide durable, implementation-neutral governance semantics for ContractAmendment. A governed change instrument that modifies defined Contract terms prospectively while preserving prior executed contract evidence. Used in contracts, documents, governance, compliance, risk, legal, service, finance, or audit workflows where applicable. Connects authoritative business records to controlled lifecycle, evidence, findings, and downstream remediation without replacing source transactions. Created under governance, reviewed or finalized where applicable, and retained or superseded with history preserved. Contract management, document control, audit, compliance assessment, risk governance, approval, and remediation. Enterprise agreements, controlled records, audit evidence, compliance findings, and lifecycle changes.

## Finding records

Open **Contract Amendment** from the menu or from its card on the dashboard.

The list shows Effective At, Contract, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Contract**.
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
| Effective At | Date and time | Optional | Time at which this record becomes effective or evidentially applicable. Establishes temporal business meaning. Lifecycle, audit and reporting. Does not rewrite earlier effective evidence. Optional when lifecycle does not require a separate effective timestamp. |
| Contract | Lookup | Required | Contract governed by this record. Supplies legal/commercial agreement context. Contract lifecycle and audit. Exactly one Contract. Changes preserve prior executed evidence and apply according to effective terms. Pick a record from **Contract**. |

## How it connects to other records
- A contract amendment belongs to one **Contract**.

## Who may use it

Anyone who holds a role with access to the **Contract Amendment** window. Access is granted by role under [Roles and access](/administration/access/).
