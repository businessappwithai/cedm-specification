---
title: "Contract"
sidebar_label: "Contract"
sidebar_position: 1
description: "Represents a legal commercial entity called Contract within the CEDM business model."
---

# Contract

Represents a legal commercial entity called Contract within the CEDM business model. Contract is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Contract records. The entity participates in a wider business graph through relationships with Party, Organization, Document, ContractObligation. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Contract record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Contract** from the menu or from its card on the dashboard.

The list shows Contract Number, Title, Contract Type, Status, Effective From, Effective To, Signed At, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Contract Number**, **Title**, **Contract Type**, **Status**, **Auto Renew**.
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
| Contract Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of contract number for the Contract. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Contract records, where applicable. Its meaning is specific to Contract; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Title | Text | Required, Up to 300 characters | Captures the business meaning of title for the Contract. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Contract records, where applicable. Its meaning is specific to Contract; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Contract Type | Text | Required, Up to 100 characters | Captures the business meaning of contract type for the Contract. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Contract records, where applicable. Its meaning is specific to Contract; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Contract records, where applicable. Its meaning is specific to Contract; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the draft state or classification in the context of Contract. Represents the negotiation state or classification in the context of Contract. Represents the approval state or classification in the context of Contract. Represents the active state or classification in the context of Contract. Represents the suspended state or classification in the context of Contract. Represents the expired state or classification in the context of Contract. Represents the terminated state or classification in the context of Contract. Represents the cancelled state or classification in the context of Contract. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Draft, Negotiation, Approval, Active, Suspended, Expired, Terminated, Cancelled. |
| Effective From | Date | Optional | Captures the business meaning of effective from for the Contract. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Contract records, where applicable. Its meaning is specific to Contract; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Effective To | Date | Optional | Captures the business meaning of effective to for the Contract. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Contract records, where applicable. Its meaning is specific to Contract; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Signed At | Date and time | Optional | Records when the signed event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating Contract records, where applicable. Its meaning is specific to Contract; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Auto Renew | Yes / No | Required | Captures the business meaning of auto renew for the Contract. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Contract records, where applicable. Its meaning is specific to Contract; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Owner Organization | Lookup | Optional | Connects Contract to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a Contract. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Organization**. |

## How it connects to other records
- A contract has many **Party** records.
- A contract belongs to one **Organization**.
- A contract has many **Contract** records.
- A contract has many **Contract Clause** records.
- A contract has many **Contract Line** records.
- A contract has many **Contract Amendment** records.
- A contract has many **Contract Renewal** records.
- A contract has many **Contract Termination** records.

## Lifecycle: Contract lifecycle

A contract record starts as **Draft** and ends as **Expired** or **Terminated** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> APPROVAL: mark_approval
  APPROVAL --> ACTIVE: activate
  APPROVAL --> NEGOTIATION: mark_negotiation
  NEGOTIATION --> APPROVAL: resume
  ACTIVE --> NEGOTIATION: mark_negotiation
  NEGOTIATION --> ACTIVE: resume
  APPROVAL --> SUSPENDED: suspend
  SUSPENDED --> APPROVAL: resume
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
  APPROVAL --> EXPIRED: expire
  ACTIVE --> EXPIRED: expire
  NEGOTIATION --> EXPIRED: expire
  SUSPENDED --> EXPIRED: expire
  APPROVAL --> TERMINATED: terminate
  ACTIVE --> TERMINATED: terminate
  NEGOTIATION --> TERMINATED: terminate
  SUSPENDED --> TERMINATED: terminate
  DRAFT --> CANCELLED: cancel
  APPROVAL --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
  NEGOTIATION --> CANCELLED: cancel
  SUSPENDED --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Draft | Approval | Mark approval |
| Approval | Active | Activate |
| Approval | Negotiation | Mark negotiation |
| Negotiation | Approval | Resume |
| Active | Negotiation | Mark negotiation |
| Negotiation | Active | Resume |
| Approval | Suspended | Suspend |
| Suspended | Approval | Resume |
| Active | Suspended | Suspend |
| Suspended | Active | Resume |
| Approval | Expired | Expire |
| Active | Expired | Expire |
| Negotiation | Expired | Expire |
| Suspended | Expired | Expire |
| Approval | Terminated | Terminate |
| Active | Terminated | Terminate |
| Negotiation | Terminated | Terminate |
| Suspended | Terminated | Terminate |
| Draft | Cancelled | Cancel |
| Approval | Cancelled | Cancel |
| Active | Cancelled | Cancel |
| Negotiation | Cancelled | Cancel |
| Suspended | Cancelled | Cancel |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Contract invariants before create | before a contract is created | 100 |
| Contract invariants before update | before a contract is changed | 100 |
| Contract workflows after update | after a contract is changed | 100 |

Processes started from this record: [Contract follow up required](/administration/processes/#contract-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Contract** window. Access is granted by role under [Roles and access](/administration/access/).
