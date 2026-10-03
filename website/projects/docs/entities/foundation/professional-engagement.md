---
title: "Professional Engagement"
sidebar_label: "Professional Engagement"
sidebar_position: 19
description: "Represents a professional services entity called ProfessionalEngagement within the CEDM business model."
---

# Professional Engagement

Represents a professional services entity called ProfessionalEngagement within the CEDM business model. ProfessionalEngagement is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate ProfessionalEngagement records. The entity participates in a wider business graph through relationships with Party, Contract, Project, Timesheet. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical ProfessionalEngagement record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Professional Engagement** from the menu or from its card on the dashboard.

![The Professional Engagement list](/img/entities/professional-engagement-list.jpg)

The list shows Engagement Number, Name, Status, Start Date, End Date, Client, Project, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Professional Engagement form](/img/entities/professional-engagement-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Engagement Number**, **Name**, **Status**, **Client**.
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
| Engagement Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of engagement number for the ProfessionalEngagement. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating ProfessionalEngagement records, where applicable. Its meaning is specific to ProfessionalEngagement; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Name | Text | Required, Up to 300 characters | The human-readable name used by people, reports, searches, and related business processes. Used when creating, reviewing, searching, validating, reporting on, or integrating ProfessionalEngagement records, where applicable. Its meaning is specific to ProfessionalEngagement; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating ProfessionalEngagement records, where applicable. Its meaning is specific to ProfessionalEngagement; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the proposed state or classification in the context of ProfessionalEngagement. Represents the active state or classification in the context of ProfessionalEngagement. Represents the on hold state or classification in the context of ProfessionalEngagement. Represents the completed state or classification in the context of ProfessionalEngagement. Represents the cancelled state or classification in the context of ProfessionalEngagement. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Proposed, Active, On hold, Completed, Cancelled. |
| Start Date | Date | Optional | The date on which the applicable business period, agreement, service, or lifecycle begins. Related end dates must follow the business chronology. Used when creating, reviewing, searching, validating, reporting on, or integrating ProfessionalEngagement records, where applicable. Its meaning is specific to ProfessionalEngagement; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| End Date | Date | Optional | The date on which the applicable business period, agreement, service, or lifecycle ends. It is interpreted together with the corresponding start date. Used when creating, reviewing, searching, validating, reporting on, or integrating ProfessionalEngagement records, where applicable. Its meaning is specific to ProfessionalEngagement; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Client | Lookup | Required | Connects ProfessionalEngagement to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a ProfessionalEngagement. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |
| Project | Lookup | Optional | Connects ProfessionalEngagement to Project so related business context can be navigated and enforced. Used when processes need to find or reason about Project records associated with a ProfessionalEngagement. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Project**. |

## How it connects to other records
- A professional engagement has many **Timesheet** records.
- A professional engagement belongs to one **Party**.
- A professional engagement belongs to one **Project**.

## Lifecycle: Professional engagement lifecycle

A professional engagement record starts as **Proposed** and ends as **Completed** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> PROPOSED
  PROPOSED --> ACTIVE: activate
  ACTIVE --> COMPLETED: complete
  ACTIVE --> ON_HOLD: hold
  ON_HOLD --> ACTIVE: resume
  PROPOSED --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
  ON_HOLD --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Proposed | Active | Activate |
| Active | Completed | Complete |
| Active | On hold | Hold |
| On hold | Active | Resume |
| Proposed | Cancelled | Cancel |
| Active | Cancelled | Cancel |
| On hold | Cancelled | Cancel |

![A Professional Engagement record with its lifecycle bar](/img/entities/professional-engagement-record.jpg)

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Professional engagement workflows after update | after a professional engagement is changed | 100 |

Processes started from this record: [Professional engagement approval requested](/administration/processes/#professional-engagement-approval-requested), [Professional engagement exception raised](/administration/processes/#professional-engagement-exception-raised), [Professional engagement follow up required](/administration/processes/#professional-engagement-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Professional Engagement** window. Access is granted by role under [Roles and access](/administration/access/).
