---
title: "Security Incident"
sidebar_label: "Security Incident"
sidebar_position: 2
description: "Represents a security entity called SecurityIncident within the CEDM business model."
---

# Security Incident

Represents a security entity called SecurityIncident within the CEDM business model. SecurityIncident is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate SecurityIncident records. The entity participates in a wider business graph through relationships with Organization, Party, Party, Risk. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical SecurityIncident record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Security Incident** from the menu or from its card on the dashboard.

![The Security Incident list](/img/entities/security-incident-list.jpg)

The list shows Incident Number, Incident Type, Severity, Status, Detected At, Resolved At, Organization, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Security Incident form](/img/entities/security-incident-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Incident Number**, **Incident Type**, **Severity**, **Status**, **Detected At**, **Organization**.
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
| Incident Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of incident number for the SecurityIncident. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating SecurityIncident records, where applicable. Its meaning is specific to SecurityIncident; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Incident Type | Text | Required, Up to 100 characters | Captures the business meaning of incident type for the SecurityIncident. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating SecurityIncident records, where applicable. Its meaning is specific to SecurityIncident; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Severity | Choice | Required | Captures the business meaning of severity for the SecurityIncident. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating SecurityIncident records, where applicable. Its meaning is specific to SecurityIncident; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the low state or classification in the context of SecurityIncident. Represents the medium state or classification in the context of SecurityIncident. Represents the high state or classification in the context of SecurityIncident. Represents the critical state or classification in the context of SecurityIncident. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Low, Medium, High, Critical. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating SecurityIncident records, where applicable. Its meaning is specific to SecurityIncident; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the open state or classification in the context of SecurityIncident. Represents the investigating state or classification in the context of SecurityIncident. Represents the contained state or classification in the context of SecurityIncident. Represents the resolved state or classification in the context of SecurityIncident. Represents the closed state or classification in the context of SecurityIncident. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Open, Investigating, Contained, Resolved, Closed. |
| Detected At | Date and time | Required | Records when the detected event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating SecurityIncident records, where applicable. Its meaning is specific to SecurityIncident; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Resolved At | Date and time | Optional | Records when the resolved event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating SecurityIncident records, where applicable. Its meaning is specific to SecurityIncident; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Organization | Lookup | Required | Connects SecurityIncident to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a SecurityIncident. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Organization**. |
| Reporter | Lookup | Optional | Connects SecurityIncident to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a SecurityIncident. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |

## How it connects to other records
- A security incident belongs to one **Organization**.
- A security incident belongs to one **Party**.

## Lifecycle: Security incident lifecycle

A security incident record starts as **Open** and ends as **Closed**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> INVESTIGATING: mark_investigating
  INVESTIGATING --> RESOLVED: resolve
  RESOLVED --> CLOSED: close
  INVESTIGATING --> CONTAINED: mark_contained
  CONTAINED --> INVESTIGATING: resume
```

| From | To | Move |
| --- | --- | --- |
| Open | Investigating | Mark investigating |
| Investigating | Resolved | Resolve |
| Resolved | Closed | Close |
| Investigating | Contained | Mark contained |
| Contained | Investigating | Resume |

![A Security Incident record with its lifecycle bar](/img/entities/security-incident-record.jpg)

## Who may use it

Anyone who holds a role with access to the **Security Incident** window. Access is granted by role under [Roles and access](/administration/access/).
