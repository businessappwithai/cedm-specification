---
title: "Business Event"
sidebar_label: "Business Event"
sidebar_position: 4
description: "An immutable semantic record that a meaningful business fact occurred, suitable for cross-domain publication without replacing the source transaction."
---

# Business Event

An immutable semantic record that a meaningful business fact occurred, suitable for cross-domain publication without replacing the source transaction. Provide canonical implementation-neutral integration semantics for BusinessEvent. An immutable semantic record that a meaningful business fact occurred, suitable for cross-domain publication without replacing the source transaction. Used for event publication, message exchange, delivery, retry, reconciliation, integration operations, and audit. Carries or routes evidence derived from authoritative domain transactions without replacing those source records. Created and processed through governed integration states; attempts and finalized evidence are retained. Event publication, messaging, endpoint delivery, retry, dead-letter handling, reconciliation, and audit. Enterprise application integration and event-driven workflows.

## Finding records

Open **Business Event** from the menu or from its card on the dashboard.

![The Business Event list](/img/entities/business-event-list.jpg)

The list shows Occurred At, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Business Event form](/img/entities/business-event-new.jpg)

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
| Occurred At | Date and time | Optional | Effective or occurrence time where applicable. Anchors integration evidence in chronology. Processing and audit. Does not replace source transaction timestamps. Optional for endpoint/master definitions. |

## Who may use it

Anyone who holds a role with access to the **Business Event** window. Access is granted by role under [Roles and access](/administration/access/).
