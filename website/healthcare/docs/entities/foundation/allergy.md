---
title: "Healthcare Patient"
sidebar_label: "Healthcare Patient"
sidebar_position: 14
description: "Represents Allergy as a first-class governed CEDM business concept."
---

# Healthcare Patient

Represents Allergy as a first-class governed CEDM business concept. A governed patient allergy or intolerance record used to support clinical safety and treatment decisions. Domain workflows, validation, reporting, audit, integration, and cross-entity traceability. HealthcarePatient supplies the primary governing context; dependent workflows consume this record without silently mutating historical evidence. Draft → active → completed, with controlled cancellation and correction paths. Material changes revalidate open dependent workflows and preserve completed historical evidence. A Allergy is created for a valid HealthcarePatient, progresses through its governed lifecycle, and remains traceable after completion.

## Finding records

Lines are added from the parent: open a **Healthcare Patient** and choose the **Healthcare Patient** tab.

The list shows Allergy Code, Status, Context, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Healthcare Patient** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Allergy Code | Text | Required, Unique, Up to 120 characters | Human-readable business reference for the Allergy. Provides an operational identifier for searching, documents, reports, and integrations. Creation, review, search, workflow, reporting, and audit. Distinct from the immutable UUID identity and scoped to the governed business context. Required for operational identification. |
| Status | Choice | Required | Lifecycle state of the Allergy. Controls whether the record is being prepared, operationally active, historically complete, or cancelled. Workflow gating, governance, reporting, and audit. Status changes can affect related HealthcarePatient workflows but never erase historical evidence. Record is being prepared and is not yet normally effective. Record is effective for its governed business purpose. Governed work or assessment is complete and retained as historical evidence. Record was cancelled through controlled workflow and remains auditable. Required for lifecycle governance. Choose one: Draft, Active, Completed, Cancelled. |
| Context | Lookup | Required | Governing HealthcarePatient associated with this Allergy. Supplies the business context needed to interpret and validate the record. Workflow navigation, validation, traceability, reporting, and audit. Every Allergy belongs to exactly one governing HealthcarePatient in this baseline model. Changes to the governing record require revalidation of open dependent records while completed evidence remains historical. Pick a record from **Healthcare Patient**. |

## How it connects to other records

A healthcare patient is a line of a **Healthcare Patient**. It has no window of its own: open the healthcare patient and use the **Healthcare Patient** tab to see and add lines.
- A healthcare patient belongs to one **Healthcare Patient**.

## Lifecycle: Allergy lifecycle

A healthcare patient record starts as **Draft** and ends as **Completed** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

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
| Allergy workflows after update | after a healthcare patient is changed | 100 |

Processes started from this record: [Allergy follow up required](/administration/processes/#allergy-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Healthcare Patient** window. Access is granted by role under [Roles and access](/administration/access/).
