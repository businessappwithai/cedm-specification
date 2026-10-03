---
title: "Variance"
sidebar_label: "Variance"
sidebar_position: 6
description: "A derived comparison between planned, forecast, or actual financial measures for a defined period and dimensional context."
---

# Variance

A derived comparison between planned, forecast, or actual financial measures for a defined period and dimensional context. Provides planning/management semantics separately from actual accounting evidence. Planning, control, management reporting and analysis. Organization supplies governance; financial transactions remain authoritative for actuals.

## Finding records

Open **Variance** from the menu or from its card on the dashboard.

![The Variance list](/img/entities/variance-list.jpg)

The list shows Code, Organization, Budget, Forecast, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Variance form](/img/entities/variance-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Organization**.
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
| Code | Text | Required, Up to 100 characters | Governed business code. Human/integration identifier. Planning and reporting. Unique within governing context. Required. |
| Organization | Lookup | Required | Governing organization. Defines management/reporting boundary. Planning and analysis. Exactly one Organization. References must use compatible organization context. Pick a record from **Organization**. |
| Budget | Lookup | Optional | Budget baseline compared. Supplies planned value source. Budget-vs-actual analysis. Optional for forecast-only comparison. Analysis cannot mutate budget. Pick a record from **Budget**. |
| Forecast | Lookup | Optional | Forecast baseline compared. Supplies projected value source. Forecast-vs-actual/budget analysis. Optional. Analysis cannot mutate forecast. Pick a record from **Forecast**. |

## How it connects to other records
- A variance belongs to one **Organization**.
- A variance belongs to one **Budget**.
- A variance belongs to one **Forecast**.

## Who may use it

Anyone who holds a role with access to the **Variance** window. Access is granted by role under [Roles and access](/administration/access/).
