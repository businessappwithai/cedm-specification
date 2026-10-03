---
title: "Contract"
sidebar_label: "Contract"
sidebar_position: 7
description: "Represents a legal commercial entity called ContractObligation within the CEDM business model."
---

# Contract

Represents a legal commercial entity called ContractObligation within the CEDM business model. ContractObligation is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate ContractObligation records. The entity participates in a wider business graph through relationships with Contract, Party. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical ContractObligation record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Lines are added from the parent: open a **Contract** and choose the **Contract** tab.

The list shows Code, Description, Obligation Type, Status, Due Date, Contract, Responsible Party, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Contract** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Code | Text | Required, Up to 100 characters | A human-readable business code used to identify or reference the record in operational processes and integrations. Used when creating, reviewing, searching, validating, reporting on, or integrating ContractObligation records, where applicable. Its meaning is specific to ContractObligation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Description | Text | Required, Up to 4000 characters | A business description that explains the purpose, scope, or meaning of the record to users and downstream processes. Used when creating, reviewing, searching, validating, reporting on, or integrating ContractObligation records, where applicable. Its meaning is specific to ContractObligation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Obligation Type | Choice | Required | Captures the business meaning of obligation type for the ContractObligation. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating ContractObligation records, where applicable. Its meaning is specific to ContractObligation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the delivery state or classification in the context of ContractObligation. Represents the payment state or classification in the context of ContractObligation. Represents the service state or classification in the context of ContractObligation. Represents the reporting state or classification in the context of ContractObligation. Represents the compliance state or classification in the context of ContractObligation. Represents the performance state or classification in the context of ContractObligation. Represents the other state or classification in the context of ContractObligation. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Delivery, Payment, Service, Reporting, Compliance, Performance, Other. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating ContractObligation records, where applicable. Its meaning is specific to ContractObligation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the open state or classification in the context of ContractObligation. Represents the in progress state or classification in the context of ContractObligation. Represents the fulfilled state or classification in the context of ContractObligation. Represents the breached state or classification in the context of ContractObligation. Represents the waived state or classification in the context of ContractObligation. Represents the cancelled state or classification in the context of ContractObligation. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Open, In progress, Fulfilled, Breached, Waived, Cancelled. |
| Due Date | Date | Optional | Records the business date associated with the due. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating ContractObligation records, where applicable. Its meaning is specific to ContractObligation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Contract | Lookup | Required | Connects ContractObligation to Contract so related business context can be navigated and enforced. Used when processes need to find or reason about Contract records associated with a ContractObligation. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Contract**. |
| Responsible Party | Lookup | Required | Connects ContractObligation to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a ContractObligation. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |

## How it connects to other records

A contract is a line of a **Contract**. It has no window of its own: open the contract and use the **Contract** tab to see and add lines.
- A contract belongs to one **Contract**.
- A contract belongs to one **Party**.

## Lifecycle: Contract obligation lifecycle

A contract record starts as **Open** and ends as **Fulfilled** or **Breached** or **Waived** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> IN_PROGRESS: start
  IN_PROGRESS --> FULFILLED: fulfil
  IN_PROGRESS --> BREACHED: mark_breached
  OPEN --> WAIVED: mark_waived
  IN_PROGRESS --> WAIVED: mark_waived
  OPEN --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Open | In progress | Start |
| In progress | Fulfilled | Fulfil |
| In progress | Breached | Mark breached |
| Open | Waived | Mark waived |
| In progress | Waived | Mark waived |
| Open | Cancelled | Cancel |
| In progress | Cancelled | Cancel |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Contract obligation workflows after update | after a contract is changed | 100 |

Processes started from this record: [Contract obligation exception raised](/administration/processes/#contract-obligation-exception-raised), [Contract obligation follow up required](/administration/processes/#contract-obligation-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Contract** window. Access is granted by role under [Roles and access](/administration/access/).
