---
title: "Healthcare Encounter"
sidebar_label: "Healthcare Encounter"
sidebar_position: 12
description: "Represents a healthcare clinical entity called Diagnosis within the CEDM business model."
---

# Healthcare Encounter

Represents a healthcare clinical entity called Diagnosis within the CEDM business model. Diagnosis is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Diagnosis records. The entity participates in a wider business graph through relationships with HealthcareEncounter, HealthcarePatient. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Diagnosis record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Lines are added from the parent: open a **Healthcare Encounter** and choose the **Healthcare Encounter** tab.

The list shows Code System, Code, Description, Diagnosis Type, Onset Date, Encounter, Patient, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Healthcare Encounter** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Code System | Text | Required, Up to 50 characters | Captures the business meaning of code system for the Diagnosis. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Diagnosis records, where applicable. Its meaning is specific to Diagnosis; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Code | Text | Required, Up to 50 characters | A human-readable business code used to identify or reference the record in operational processes and integrations. Used when creating, reviewing, searching, validating, reporting on, or integrating Diagnosis records, where applicable. Its meaning is specific to Diagnosis; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Description | Text | Required, Up to 1000 characters | A business description that explains the purpose, scope, or meaning of the record to users and downstream processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Diagnosis records, where applicable. Its meaning is specific to Diagnosis; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Diagnosis Type | Choice | Required | Captures the business meaning of diagnosis type for the Diagnosis. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Diagnosis records, where applicable. Its meaning is specific to Diagnosis; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the primary state or classification in the context of Diagnosis. Represents the secondary state or classification in the context of Diagnosis. Represents the suspected state or classification in the context of Diagnosis. Represents the historical state or classification in the context of Diagnosis. Represents the other state or classification in the context of Diagnosis. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Primary, Secondary, Suspected, Historical, Other. |
| Onset Date | Date | Optional | Records the business date associated with the onset. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating Diagnosis records, where applicable. Its meaning is specific to Diagnosis; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Encounter | Lookup | Required | Connects Diagnosis to HealthcareEncounter so related business context can be navigated and enforced. Used when processes need to find or reason about HealthcareEncounter records associated with a Diagnosis. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Healthcare Encounter**. |
| Patient | Lookup | Required | Connects Diagnosis to HealthcarePatient so related business context can be navigated and enforced. Used when processes need to find or reason about HealthcarePatient records associated with a Diagnosis. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Healthcare Patient**. |

## How it connects to other records

A healthcare encounter is a line of a **Healthcare Encounter**. It has no window of its own: open the healthcare encounter and use the **Healthcare Encounter** tab to see and add lines.
- A healthcare encounter belongs to one **Healthcare Encounter**.
- A healthcare encounter belongs to one **Healthcare Patient**.

## Who may use it

Anyone who holds a role with access to the **Healthcare Encounter** window. Access is granted by role under [Roles and access](/administration/access/).
