---
title: "Employment"
sidebar_label: "Employment"
sidebar_position: 2
description: "Represents a workforce relationship called Employment within the CEDM business model."
---

# Employment

Represents a workforce relationship called Employment within the CEDM business model. Employment is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Employment records. The entity participates in a wider business graph through relationships with Employee, Organization, Position. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Employment record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Employment** from the menu or from its card on the dashboard.

![The Employment list](/img/entities/employment-list.jpg)

The list shows Employment Type, Start Date, End Date, Status, Employee, Employer, Position, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Employment form](/img/entities/employment-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Employment Type**, **Start Date**, **Status**, **Employee**, **Employer**.
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
| Employment Type | Choice | Required | Captures the business meaning of employment type for the Employment. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Employment records, where applicable. Its meaning is specific to Employment; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the full time state or classification in the context of Employment. Represents the part time state or classification in the context of Employment. Represents the contract state or classification in the context of Employment. Represents the temporary state or classification in the context of Employment. Represents the intern state or classification in the context of Employment. Represents the other state or classification in the context of Employment. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Full time, Part time, Contract, Temporary, Intern, Other. |
| Start Date | Date | Required | The date on which the applicable business period, agreement, service, or lifecycle begins. Related end dates must follow the business chronology. Used when creating, reviewing, searching, validating, reporting on, or integrating Employment records, where applicable. Its meaning is specific to Employment; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| End Date | Date | Optional | The date on which the applicable business period, agreement, service, or lifecycle ends. It is interpreted together with the corresponding start date. Used when creating, reviewing, searching, validating, reporting on, or integrating Employment records, where applicable. Its meaning is specific to Employment; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Employment records, where applicable. Its meaning is specific to Employment; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the pending state or classification in the context of Employment. Represents the active state or classification in the context of Employment. Represents the suspended state or classification in the context of Employment. Represents the terminated state or classification in the context of Employment. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Pending, Active, Suspended, Terminated. |
| Employee | Lookup | Required | Connects Employment to Employee so related business context can be navigated and enforced. Used when processes need to find or reason about Employee records associated with a Employment. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Employee**. |
| Employer | Lookup | Required | Connects Employment to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a Employment. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Organization**. |
| Position | Lookup | Optional | Connects Employment to Position so related business context can be navigated and enforced. Used when processes need to find or reason about Position records associated with a Employment. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Position**. |

## How it connects to other records
- A employment belongs to one **Employee**.
- A employment belongs to one **Organization**.
- A employment belongs to one **Position**.
- A employment has many **Payroll** records.

## Lifecycle: Employment lifecycle

A employment record starts as **Pending** and ends as **Terminated**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> ACTIVE: activate
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
  ACTIVE --> TERMINATED: terminate
  SUSPENDED --> TERMINATED: terminate
```

| From | To | Move |
| --- | --- | --- |
| Pending | Active | Activate |
| Active | Suspended | Suspend |
| Suspended | Active | Resume |
| Active | Terminated | Terminate |
| Suspended | Terminated | Terminate |

![A Employment record with its lifecycle bar](/img/entities/employment-record.jpg)

## Who may use it

Anyone who holds a role with access to the **Employment** window. Access is granted by role under [Roles and access](/administration/access/).
