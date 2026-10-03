---
title: "Risk"
sidebar_label: "Risk"
sidebar_position: 3
description: "Represents a governance entity called Risk within the CEDM business model."
---

# Risk

Represents a governance entity called Risk within the CEDM business model. Risk is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Risk records. The entity participates in a wider business graph through relationships with Party, Organization, Control, RiskTreatment. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Risk record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Risk** from the menu or from its card on the dashboard.

![The Risk list](/img/entities/risk-list.jpg)

The list shows Code, Name, Description, Category, Likelihood, Impact, Status, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Risk form](/img/entities/risk-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Name**, **Category**, **Likelihood**, **Impact**, **Status**.
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
| Code | Text | Required, Unique, Up to 100 characters | A human-readable business code used to identify or reference the record in operational processes and integrations. Used when creating, reviewing, searching, validating, reporting on, or integrating Risk records, where applicable. Its meaning is specific to Risk; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Name | Text | Required, Up to 300 characters | The human-readable name used by people, reports, searches, and related business processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Risk records, where applicable. Its meaning is specific to Risk; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Description | Text | Up to 4000 characters | A business description that explains the purpose, scope, or meaning of the record to users and downstream processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Risk records, where applicable. Its meaning is specific to Risk; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Category | Text | Required, Up to 100 characters | Captures the business meaning of category for the Risk. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Risk records, where applicable. Its meaning is specific to Risk; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Likelihood | Choice | Required | Captures the business meaning of likelihood for the Risk. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Risk records, where applicable. Its meaning is specific to Risk; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the rare state or classification in the context of Risk. Represents the unlikely state or classification in the context of Risk. Represents the possible state or classification in the context of Risk. Represents the likely state or classification in the context of Risk. Represents the almost certain state or classification in the context of Risk. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Rare, Unlikely, Possible, Likely, Almost certain. |
| Impact | Choice | Required | Captures the business meaning of impact for the Risk. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Risk records, where applicable. Its meaning is specific to Risk; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the insignificant state or classification in the context of Risk. Represents the minor state or classification in the context of Risk. Represents the moderate state or classification in the context of Risk. Represents the major state or classification in the context of Risk. Represents the severe state or classification in the context of Risk. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Insignificant, Minor, Moderate, Major, Severe. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Risk records, where applicable. Its meaning is specific to Risk; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the identified state or classification in the context of Risk. Represents the assessed state or classification in the context of Risk. Represents the mitigating state or classification in the context of Risk. Represents the accepted state or classification in the context of Risk. Represents the closed state or classification in the context of Risk. Represents the materialized state or classification in the context of Risk. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Identified, Assessed, Mitigating, Accepted, Closed, Materialized. |
| Owner | Lookup | Optional | Connects Risk to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a Risk. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |
| Organization | Lookup | Optional | Connects Risk to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a Risk. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Organization**. |

## How it connects to other records
- A risk is linked to many **Control** records.
- A risk belongs to one **Party**.
- A risk belongs to one **Organization**.
- A risk has many **Risk** records.
- A risk has many **Finding** records.
- A risk has many **Risk Assessment** records.

## Lifecycle: Risk lifecycle

A risk record starts as **Identified** and ends as **Closed** or **Materialized**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> IDENTIFIED
  IDENTIFIED --> ASSESSED: mark_assessed
  ASSESSED --> MITIGATING: mark_mitigating
  MITIGATING --> ACCEPTED: accept
  ACCEPTED --> CLOSED: close
  IDENTIFIED --> MATERIALIZED: mark_materialized
  ASSESSED --> MATERIALIZED: mark_materialized
  MITIGATING --> MATERIALIZED: mark_materialized
  ACCEPTED --> MATERIALIZED: mark_materialized
```

| From | To | Move |
| --- | --- | --- |
| Identified | Assessed | Mark assessed |
| Assessed | Mitigating | Mark mitigating |
| Mitigating | Accepted | Accept |
| Accepted | Closed | Close |
| Identified | Materialized | Mark materialized |
| Assessed | Materialized | Mark materialized |
| Mitigating | Materialized | Mark materialized |
| Accepted | Materialized | Mark materialized |

## Who may use it

Anyone who holds a role with access to the **Risk** window. Access is granted by role under [Roles and access](/administration/access/).
