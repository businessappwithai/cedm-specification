---
title: "Healthcare Encounter"
sidebar_label: "Healthcare Encounter"
sidebar_position: 2
description: "Represents a healthcare transaction called HealthcareEncounter within the CEDM business model."
---

# Healthcare Encounter

Represents a healthcare transaction called HealthcareEncounter within the CEDM business model. HealthcareEncounter is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate HealthcareEncounter records. The entity participates in a wider business graph through relationships with HealthcarePatient, HealthcareProvider, Diagnosis, Procedure, HealthcareOrder. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical HealthcareEncounter record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Healthcare Encounter** from the menu or from its card on the dashboard.

The list shows Encounter Type, Status, Start At, End At, Reason, Patient, Provider, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Encounter Type**, **Status**, **Start At**, **Patient**.
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
| Encounter Type | Choice | Required | Captures the business meaning of encounter type for the HealthcareEncounter. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating HealthcareEncounter records, where applicable. Its meaning is specific to HealthcareEncounter; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the outpatient state or classification in the context of HealthcareEncounter. Represents the inpatient state or classification in the context of HealthcareEncounter. Represents the emergency state or classification in the context of HealthcareEncounter. Represents the virtual state or classification in the context of HealthcareEncounter. Represents the home care state or classification in the context of HealthcareEncounter. Represents the other state or classification in the context of HealthcareEncounter. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Outpatient, Inpatient, Emergency, Virtual, Home care, Other. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating HealthcareEncounter records, where applicable. Its meaning is specific to HealthcareEncounter; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the planned state or classification in the context of HealthcareEncounter. Represents the in progress state or classification in the context of HealthcareEncounter. Represents the completed state or classification in the context of HealthcareEncounter. Represents the cancelled state or classification in the context of HealthcareEncounter. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Planned, In progress, Completed, Cancelled. |
| Start At | Date and time | Required | Records when the start event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating HealthcareEncounter records, where applicable. Its meaning is specific to HealthcareEncounter; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| End At | Date and time | Optional | Records when the end event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating HealthcareEncounter records, where applicable. Its meaning is specific to HealthcareEncounter; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Reason | Text | Up to 2000 characters | Captures the business meaning of reason for the HealthcareEncounter. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating HealthcareEncounter records, where applicable. Its meaning is specific to HealthcareEncounter; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Patient | Lookup | Required | Connects HealthcareEncounter to HealthcarePatient so related business context can be navigated and enforced. Used when processes need to find or reason about HealthcarePatient records associated with a HealthcareEncounter. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Healthcare Patient**. |
| Provider | Lookup | Optional | Connects HealthcareEncounter to HealthcareProvider so related business context can be navigated and enforced. Used when processes need to find or reason about HealthcareProvider records associated with a HealthcareEncounter. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Healthcare Provider**. |

## How it connects to other records
- A healthcare encounter belongs to one **Healthcare Patient**.
- A healthcare encounter belongs to one **Healthcare Provider**.
- A healthcare encounter has many **Healthcare Encounter** records.

## Lifecycle: Healthcare encounter lifecycle

A healthcare encounter record starts as **Planned** and ends as **Completed** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> IN_PROGRESS: start
  IN_PROGRESS --> COMPLETED: complete
  PLANNED --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Planned | In progress | Start |
| In progress | Completed | Complete |
| Planned | Cancelled | Cancel |
| In progress | Cancelled | Cancel |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Healthcare encounter workflows after update | after a healthcare encounter is changed | 100 |

Processes started from this record: [Healthcare encounter follow up required](/administration/processes/#healthcare-encounter-follow-up-required), [Healthcare encounter completion confirmed](/administration/processes/#healthcare-encounter-completion-confirmed).

## Who may use it

Anyone who holds a role with access to the **Healthcare Encounter** window. Access is granted by role under [Roles and access](/administration/access/).
