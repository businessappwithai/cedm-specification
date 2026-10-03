---
title: "Healthcare Patient"
sidebar_label: "Healthcare Patient"
sidebar_position: 3
description: "Represents a industry specialization called HealthcarePatient within the CEDM business model."
---

# Healthcare Patient

Represents a industry specialization called HealthcarePatient within the CEDM business model. HealthcarePatient is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate HealthcarePatient records. The entity participates in a wider business graph through relationships with Party, HealthcareEncounter, CarePlan, Allergy. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical HealthcarePatient record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Healthcare Patient** from the menu or from its card on the dashboard.

The list shows Party, Medical Record Number, Status, Preferred Language, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Party**, **Medical Record Number**, **Status**.
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
| Party | Lookup | Required, Unique | Identifies the related Party associated with this HealthcarePatient. It provides the link needed to navigate from this record to the related business object. Used when creating, reviewing, searching, validating, reporting on, or integrating HealthcarePatient records, where applicable. This field connects HealthcarePatient to Party. The reference establishes business context between the two entities and lets processes navigate from this record to the related Party. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Pick a record from **Party**. |
| Medical Record Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of medical record number for the HealthcarePatient. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating HealthcarePatient records, where applicable. Its meaning is specific to HealthcarePatient; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating HealthcarePatient records, where applicable. Its meaning is specific to HealthcarePatient; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the active state or classification in the context of HealthcarePatient. Represents the inactive state or classification in the context of HealthcarePatient. Represents the deceased state or classification in the context of HealthcarePatient. Represents the merged state or classification in the context of HealthcarePatient. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Active, Inactive, Deceased, Merged. |
| Preferred Language | Text | Up to 35 characters | Captures the business meaning of preferred language for the HealthcarePatient. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating HealthcarePatient records, where applicable. Its meaning is specific to HealthcarePatient; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |

## How it connects to other records
- A healthcare patient belongs to one **Party**.
- A healthcare patient has many **Healthcare Encounter** records.
- A healthcare patient has many **Care Plan** records.
- A healthcare patient has many **Healthcare Patient** records.
- A healthcare patient has many **Prescription** records.

## Lifecycle: Healthcare patient lifecycle

A healthcare patient record starts as **Active**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> DECEASED: mark_deceased
  DECEASED --> MERGED: mark_merged
  DECEASED --> INACTIVE: deactivate
  INACTIVE --> DECEASED: reactivate
  MERGED --> INACTIVE: deactivate
  INACTIVE --> MERGED: reactivate
```

| From | To | Move |
| --- | --- | --- |
| Active | Deceased | Mark deceased |
| Deceased | Merged | Mark merged |
| Deceased | Inactive | Deactivate |
| Inactive | Deceased | Reactivate |
| Merged | Inactive | Deactivate |
| Inactive | Merged | Reactivate |

## Who may use it

Anyone who holds a role with access to the **Healthcare Patient** window. Access is granted by role under [Roles and access](/administration/access/).
