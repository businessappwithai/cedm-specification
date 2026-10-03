---
title: "Project"
sidebar_label: "Project"
sidebar_position: 21
description: "Represents a project management entity called ProjectTask within the CEDM business model."
---

# Project

Represents a project management entity called ProjectTask within the CEDM business model. ProjectTask is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate ProjectTask records. The entity participates in a wider business graph through relationships with Project, Party, ProjectTask, Milestone. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical ProjectTask record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Lines are added from the parent: open a **Project** and choose the **Project** tab.

The list shows Task Code, Name, Status, Priority, Start Date, Due Date, Percent Complete, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Project** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Task Code | Text | Required, Up to 100 characters | Captures the business meaning of task code for the ProjectTask. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating ProjectTask records, where applicable. Its meaning is specific to ProjectTask; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Name | Text | Required, Up to 300 characters | The human-readable name used by people, reports, searches, and related business processes. Used when creating, reviewing, searching, validating, reporting on, or integrating ProjectTask records, where applicable. Its meaning is specific to ProjectTask; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating ProjectTask records, where applicable. Its meaning is specific to ProjectTask; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the not started state or classification in the context of ProjectTask. Represents the in progress state or classification in the context of ProjectTask. Represents the blocked state or classification in the context of ProjectTask. Represents the completed state or classification in the context of ProjectTask. Represents the cancelled state or classification in the context of ProjectTask. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Not started, In progress, Blocked, Completed, Cancelled. |
| Priority | Choice | Required | Captures the business meaning of priority for the ProjectTask. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating ProjectTask records, where applicable. Its meaning is specific to ProjectTask; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the low state or classification in the context of ProjectTask. Represents the normal state or classification in the context of ProjectTask. Represents the high state or classification in the context of ProjectTask. Represents the critical state or classification in the context of ProjectTask. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Low, Normal, High, Critical. |
| Start Date | Date | Optional | The date on which the applicable business period, agreement, service, or lifecycle begins. Related end dates must follow the business chronology. Used when creating, reviewing, searching, validating, reporting on, or integrating ProjectTask records, where applicable. Its meaning is specific to ProjectTask; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Due Date | Date | Optional | Records the business date associated with the due. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating ProjectTask records, where applicable. Its meaning is specific to ProjectTask; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Percent Complete | Amount | Required | Captures the business meaning of percent complete for the ProjectTask. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating ProjectTask records, where applicable. Its meaning is specific to ProjectTask; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Project | Lookup | Required | Connects ProjectTask to Project so related business context can be navigated and enforced. Used when processes need to find or reason about Project records associated with a ProjectTask. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Project**. |
| Project Phase | Lookup | Optional | The ProjectPhase this ProjectTask belongs to. Pick a record from **Project**. |
| Assignee | Lookup | Optional | Connects ProjectTask to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a ProjectTask. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |
| Parent Task | Lookup | Optional | Connects ProjectTask to ProjectTask so related business context can be navigated and enforced. Used when processes need to find or reason about ProjectTask records associated with a ProjectTask. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Project**. |
| Milestone | Lookup | Optional | Connects ProjectTask to Milestone so related business context can be navigated and enforced. Used when processes need to find or reason about Milestone records associated with a ProjectTask. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Project**. |

## How it connects to other records

A project is a line of a **Project**. It has no window of its own: open the project and use the **Project** tab to see and add lines.
- A project belongs to one **Project**.
- A project belongs to one **Party**.
- A project has many **Project** records.

## Lifecycle: Project task lifecycle

A project record starts as **Not started** and ends as **Completed** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> NOT_STARTED
  NOT_STARTED --> IN_PROGRESS: start
  IN_PROGRESS --> COMPLETED: complete
  IN_PROGRESS --> BLOCKED: block
  BLOCKED --> IN_PROGRESS: unblock
  NOT_STARTED --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
  BLOCKED --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Not started | In progress | Start |
| In progress | Completed | Complete |
| In progress | Blocked | Block |
| Blocked | In progress | Unblock |
| Not started | Cancelled | Cancel |
| In progress | Cancelled | Cancel |
| Blocked | Cancelled | Cancel |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Project task workflows after update | after a project is changed | 100 |

Processes started from this record: [Project task exception raised](/administration/processes/#project-task-exception-raised), [Project task follow up required](/administration/processes/#project-task-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Project** window. Access is granted by role under [Roles and access](/administration/access/).
