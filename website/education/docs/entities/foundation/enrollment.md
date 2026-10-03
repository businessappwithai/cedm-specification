---
title: "Education Student"
sidebar_label: "Education Student"
sidebar_position: 10
description: "Represents a education transaction called Enrollment within the CEDM business model."
---

# Education Student

Represents a education transaction called Enrollment within the CEDM business model. Enrollment is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Enrollment records. The entity participates in a wider business graph through relationships with EducationStudent, EducationProgram. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Enrollment record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Lines are added from the parent: open a **Education Student** and choose the **Education Student** tab.

The list shows Enrollment Number, Enrolled At, Status, Program, Education Course, Student, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Education Student** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Enrollment Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of enrollment number for the Enrollment. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Enrollment records, where applicable. Its meaning is specific to Enrollment; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Enrolled At | Date and time | Required | Records when the enrolled event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating Enrollment records, where applicable. Its meaning is specific to Enrollment; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Enrollment records, where applicable. Its meaning is specific to Enrollment; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the pending state or classification in the context of Enrollment. Represents the active state or classification in the context of Enrollment. Represents the completed state or classification in the context of Enrollment. Represents the withdrawn state or classification in the context of Enrollment. Represents the cancelled state or classification in the context of Enrollment. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Pending, Active, Completed, Withdrawn, Cancelled. |
| Program | Lookup | Required | Connects Enrollment to EducationProgram so related business context can be navigated and enforced. Used when processes need to find or reason about EducationProgram records associated with a Enrollment. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Education Program**. |
| Education Course | Lookup | Optional | The EducationCourse this Enrollment belongs to. Pick a record from **Education Course**. |
| Student | Lookup | Required | Connects Enrollment to EducationStudent so related business context can be navigated and enforced. Used when processes need to find or reason about EducationStudent records associated with a Enrollment. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Education Student**. |

## How it connects to other records

A education student is a line of a **Education Student**. It has no window of its own: open the education student and use the **Education Student** tab to see and add lines.
- A education student belongs to one **Education Program**.
- A education student belongs to one **Education Course**.
- A education student belongs to one **Education Student**.

## Lifecycle: Enrollment lifecycle

A education student record starts as **Pending** and ends as **Completed** or **Withdrawn** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> ACTIVE: activate
  ACTIVE --> COMPLETED: complete
  PENDING --> WITHDRAWN: withdraw
  ACTIVE --> WITHDRAWN: withdraw
  PENDING --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Pending | Active | Activate |
| Active | Completed | Complete |
| Pending | Withdrawn | Withdraw |
| Active | Withdrawn | Withdraw |
| Pending | Cancelled | Cancel |
| Active | Cancelled | Cancel |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Enrollment workflows after update | after a education student is changed | 100 |

Processes started from this record: [Enrollment follow up required](/administration/processes/#enrollment-follow-up-required), [Enrollment completion confirmed](/administration/processes/#enrollment-completion-confirmed).

## Who may use it

Anyone who holds a role with access to the **Education Student** window. Access is granted by role under [Roles and access](/administration/access/).
