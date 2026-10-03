---
title: "Contact Point"
sidebar_label: "Contact Point"
sidebar_position: 6
description: "A governed communication endpoint such as email address, telephone number, web endpoint, or other contact channel associated with a Party."
---

# Contact Point

A governed communication endpoint such as email address, telephone number, web endpoint, or other contact channel associated with a Party. Provide a canonical enterprise representation with stable identity and governed semantics. A governed communication endpoint such as email address, telephone number, web endpoint, or other contact channel associated with a Party. Used whenever enterprise processes need this concept as controlled master or reference data. Referenced by compatible domain entities and workflows while preserving a single canonical identity. Created under governance, maintained through controlled changes, and retired or superseded without rewriting history where applicable. Master-data governance, transaction validation, reporting, integration, and audit. Enterprise configuration and cross-domain business workflows.

## Finding records

Open **Contact Point** from the menu or from its card on the dashboard.

![The Contact Point list](/img/entities/contact-point-list.jpg)

The list shows Code, Name, Party, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Contact Point form](/img/entities/contact-point-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Name**, **Party**.
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
| Code | Text | Required, Up to 100 characters | Governed business code for ContactPoint. Human and integration-friendly identifier. Search, configuration, exchange and reporting. Unique within its governing context according to policy. Required. |
| Name | Text | Required, Up to 300 characters | Human-readable name of ContactPoint. Communicates the concept to business users. UI, documents and reports. Does not replace immutable identity. Required. |
| Party | Lookup | Required | Governing Party context for this record. Establishes ownership and enterprise context. Authorization, reporting and workflow. Exactly one Party. Referenced workflows must remain compatible with governing context. Pick a record from **Party**. |

## How it connects to other records
- A contact point belongs to one **Party**.

## Who may use it

Anyone who holds a role with access to the **Contact Point** window. Access is granted by role under [Roles and access](/administration/access/).
