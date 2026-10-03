---
title: "Legal Matter"
sidebar_label: "Legal Matter"
sidebar_position: 7
description: "A governed legal work matter grouping parties, counsel, documents, obligations, filings, issues, costs, and outcomes."
---

# Legal Matter

A governed legal work matter grouping parties, counsel, documents, obligations, filings, issues, costs, and outcomes. Provide canonical governance semantics for LegalMatter. A governed legal work matter grouping parties, counsel, documents, obligations, filings, issues, costs, and outcomes. Used in enterprise risk, legal, compliance, audit, contract, incident, and remediation processes where applicable. Connects risks, controls, parties, legal matters, agreements, obligations, evidence and outcomes without replacing their authoritative histories. Created when identified or initiated, progressed through governed review/action, and retained after closure or supersession. Risk assessment, incident management, legal matter management, compliance, remediation, filing and audit. Enterprise risk reviews, operational incidents, legal cases, obligations and regulatory/court submissions.

## Finding records

Open **Legal Matter** from the menu or from its card on the dashboard.

![The Legal Matter list](/img/entities/legal-matter-list.jpg)

The list shows Occurred At, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Legal Matter form](/img/entities/legal-matter-new.jpg)

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
| Occurred At | Date and time | Optional | Effective occurrence or assessment time where applicable. Anchors temporal evidence. Chronology, reporting and audit. Historical timing is not silently rewritten. Optional when the concept is a standing master or future obligation. |

## How it connects to other records
- A legal matter has many **Legal Case** records.

## Who may use it

Anyone who holds a role with access to the **Legal Matter** window. Access is granted by role under [Roles and access](/administration/access/).
