---
title: "Project"
sidebar_label: "Project"
sidebar_position: 23
description: "Represents ResourceAssignment as a first-class governed CEDM business concept."
---

# Project

Represents ResourceAssignment as a first-class governed CEDM business concept. A governed assignment of a person, role, or resource to a Project with defined responsibility and allocation. Domain workflows, validation, reporting, audit, integration, and cross-entity traceability. Project supplies the primary governing context; dependent workflows consume this record without silently mutating historical evidence. Draft → active → completed, with controlled cancellation and correction paths. Material changes revalidate open dependent workflows and preserve completed historical evidence. A ResourceAssignment is created for a valid Project, progresses through its governed lifecycle, and remains traceable after completion.

## Finding records

Lines are added from the parent: open a **Project** and choose the **Project** tab.

The list shows Resource Assignment Code, Status, Context, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

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
| Resource Assignment Code | Text | Required, Unique, Up to 120 characters | Human-readable business reference for the ResourceAssignment. Provides an operational identifier for searching, documents, reports, and integrations. Creation, review, search, workflow, reporting, and audit. Distinct from the immutable UUID identity and scoped to the governed business context. Required for operational identification. |
| Status | Choice | Required | Lifecycle state of the ResourceAssignment. Controls whether the record is being prepared, operationally active, historically complete, or cancelled. Workflow gating, governance, reporting, and audit. Status changes can affect related Project workflows but never erase historical evidence. Record is being prepared and is not yet normally effective. Record is effective for its governed business purpose. Governed work or assessment is complete and retained as historical evidence. Record was cancelled through controlled workflow and remains auditable. Required for lifecycle governance. Choose one: Draft, Active, Completed, Cancelled. |
| Context | Lookup | Required | Governing Project associated with this ResourceAssignment. Supplies the business context needed to interpret and validate the record. Workflow navigation, validation, traceability, reporting, and audit. Every ResourceAssignment belongs to exactly one governing Project in this baseline model. Changes to the governing record require revalidation of open dependent records while completed evidence remains historical. Pick a record from **Project**. |

## How it connects to other records

A project is a line of a **Project**. It has no window of its own: open the project and use the **Project** tab to see and add lines.
- A project belongs to one **Project**.

## Lifecycle: Resource assignment lifecycle

A project record starts as **Draft** and ends as **Completed** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> COMPLETED: complete
  DRAFT --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Draft | Active | Activate |
| Active | Completed | Complete |
| Draft | Cancelled | Cancel |
| Active | Cancelled | Cancel |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Resource assignment workflows after update | after a project is changed | 100 |

Processes started from this record: [Resource assignment follow up required](/administration/processes/#resource-assignment-follow-up-required), [Resource assignment completion confirmed](/administration/processes/#resource-assignment-completion-confirmed).

## Who may use it

Anyone who holds a role with access to the **Project** window. Access is granted by role under [Roles and access](/administration/access/).
