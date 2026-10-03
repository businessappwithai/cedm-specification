---
title: "Permission"
sidebar_label: "Permission"
sidebar_position: 1
description: "Represents a authorization entity called Permission within the CEDM business model."
---

# Permission

Represents a authorization entity called Permission within the CEDM business model. Permission is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Permission records. The entity participates in a wider business graph through relationships with Role. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Permission record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Permission** from the menu or from its card on the dashboard.

![The Permission list](/img/entities/permission-list.jpg)

The list shows Code, Resource, Action, Status, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Permission form](/img/entities/permission-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Resource**, **Action**, **Status**.
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
| Code | Text | Required, Unique, Up to 200 characters | A human-readable business code used to identify or reference the record in operational processes and integrations. Used when creating, reviewing, searching, validating, reporting on, or integrating Permission records, where applicable. Its meaning is specific to Permission; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Resource | Text | Required, Up to 200 characters | Captures the business meaning of resource for the Permission. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Permission records, where applicable. Its meaning is specific to Permission; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Action | Choice | Required | Captures the business meaning of action for the Permission. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Permission records, where applicable. Its meaning is specific to Permission; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the create state or classification in the context of Permission. Represents the read state or classification in the context of Permission. Represents the update state or classification in the context of Permission. Represents the delete state or classification in the context of Permission. Represents the execute state or classification in the context of Permission. Represents the approve state or classification in the context of Permission. Represents the export state or classification in the context of Permission. Represents the administer state or classification in the context of Permission. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Create, Read, Update, Delete, Execute, Approve, Export, Administer. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Permission records, where applicable. Its meaning is specific to Permission; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the active state or classification in the context of Permission. Represents the inactive state or classification in the context of Permission. Represents the retired state or classification in the context of Permission. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Active, Inactive, Retired. |

## How it connects to other records
- A permission is linked to many **Role** records.

## Lifecycle: Permission lifecycle

A permission record starts as **Active** and ends as **Retired**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> INACTIVE: deactivate
  INACTIVE --> ACTIVE: reactivate
  ACTIVE --> RETIRED: retire
  INACTIVE --> RETIRED: retire
```

| From | To | Move |
| --- | --- | --- |
| Active | Inactive | Deactivate |
| Inactive | Active | Reactivate |
| Active | Retired | Retire |
| Inactive | Retired | Retire |

![A Permission record with its lifecycle bar](/img/entities/permission-record.jpg)

## Who may use it

Anyone who holds a role with access to the **Permission** window. Access is granted by role under [Roles and access](/administration/access/).
