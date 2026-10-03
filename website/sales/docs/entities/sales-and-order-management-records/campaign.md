---
title: "Campaign"
sidebar_label: "Campaign"
sidebar_position: 2
description: "A governed commercial marketing or outreach initiative targeting an audience over a defined period and measuring responses and outcomes."
---

# Campaign

A governed commercial marketing or outreach initiative targeting an audience over a defined period and measuring responses and outcomes. Provide canonical implementation-neutral semantics for Campaign across enterprise applications. A governed commercial marketing or outreach initiative targeting an audience over a defined period and measuring responses and outcomes. Used in CRM, sales, fulfillment, logistics, reporting, integration, or audit processes where this concept applies. Connects to canonical parties, commercial transactions, logistics execution, and downstream evidence without replacing their authoritative records. Created and progressed through governed business workflow; completed history is retained and corrections are explicit. Commercial management, fulfillment, logistics execution, reconciliation, reporting, and audit. Enterprise sales and supply-chain operations.

## Finding records

Open **Campaign** from the menu or from its card on the dashboard.

The list shows Code, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

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
| Code | Text | Up to 120 characters | Business reference for Campaign. Human or integration-friendly reference where applicable. Search, exchange and reporting. Does not replace immutable identity. Optional when another transaction reference supplies business identity. |

## Who may use it

Anyone who holds a role with access to the **Campaign** window. Access is granted by role under [Roles and access](/administration/access/).
