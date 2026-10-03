---
title: "Compound"
sidebar_label: "Compound"
sidebar_position: 2
description: "Represents a life sciences entity called Compound within the CEDM business model."
---

# Compound

Represents a life sciences entity called Compound within the CEDM business model. Compound is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Compound records. The entity participates in a wider business graph through relationships with Experiment, Sample. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Compound record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Compound** from the menu or from its card on the dashboard.

![The Compound list](/img/entities/compound-list.jpg)

The list shows Compound Code, Name, Molecular Formula, Molecular Weight, Status, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Compound form](/img/entities/compound-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Compound Code**, **Status**.
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
| Compound Code | Text | Required, Unique, Up to 100 characters | Captures the business meaning of compound code for the Compound. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Compound records, where applicable. Its meaning is specific to Compound; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Name | Text | Up to 300 characters | The human-readable name used by people, reports, searches, and related business processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Compound records, where applicable. Its meaning is specific to Compound; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Molecular Formula | Text | Up to 500 characters | Captures the business meaning of molecular formula for the Compound. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Compound records, where applicable. Its meaning is specific to Compound; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Molecular Weight | Amount | Optional | Captures the business meaning of molecular weight for the Compound. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Compound records, where applicable. Its meaning is specific to Compound; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Compound records, where applicable. Its meaning is specific to Compound; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the research state or classification in the context of Compound. Represents the development state or classification in the context of Compound. Represents the candidate state or classification in the context of Compound. Represents the approved state or classification in the context of Compound. Represents the discontinued state or classification in the context of Compound. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Research, Development, Candidate, Approved, Discontinued. |

## How it connects to other records
- A compound is linked to many **Experiment** records.
- A compound is linked to many **Sample** records.

## Lifecycle: Compound lifecycle

A compound record starts as **Candidate** and ends as **Discontinued**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> CANDIDATE
  CANDIDATE --> DEVELOPMENT: mark_development
  DEVELOPMENT --> RESEARCH: mark_research
  RESEARCH --> APPROVED: approve
  CANDIDATE --> DISCONTINUED: discontinue
  DEVELOPMENT --> DISCONTINUED: discontinue
  RESEARCH --> DISCONTINUED: discontinue
  APPROVED --> DISCONTINUED: discontinue
```

| From | To | Move |
| --- | --- | --- |
| Candidate | Development | Mark development |
| Development | Research | Mark research |
| Research | Approved | Approve |
| Candidate | Discontinued | Discontinue |
| Development | Discontinued | Discontinue |
| Research | Discontinued | Discontinue |
| Approved | Discontinued | Discontinue |

![A Compound record with its lifecycle bar](/img/entities/compound-record.jpg)

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Compound invariants before create | before a compound is created | 100 |
| Compound invariants before update | before a compound is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Compound** window. Access is granted by role under [Roles and access](/administration/access/).
