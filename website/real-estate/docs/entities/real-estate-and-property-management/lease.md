---
title: "Lease"
sidebar_label: "Lease"
sidebar_position: 2
description: "Represents a real estate commercial entity called Lease within the CEDM business model."
---

# Lease

Represents a real estate commercial entity called Lease within the CEDM business model. Lease is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Lease records. The entity participates in a wider business graph through relationships with Property, Party, Party, Contract. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Lease record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Lease** from the menu or from its card on the dashboard.

![The Lease list](/img/entities/lease-list.jpg)

The list shows Lease Number, Lease Type, Start Date, End Date, Status, Periodic Amount, Property, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Lease form](/img/entities/lease-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Lease Number**, **Lease Type**, **Start Date**, **Status**, **Lessor**.
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
| Lease Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of lease number for the Lease. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Lease records, where applicable. Its meaning is specific to Lease; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Lease Type | Choice | Required | Captures the business meaning of lease type for the Lease. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Lease records, where applicable. Its meaning is specific to Lease; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the operating state or classification in the context of Lease. Represents the finance state or classification in the context of Lease. Represents the commercial state or classification in the context of Lease. Represents the residential state or classification in the context of Lease. Represents the equipment state or classification in the context of Lease. Represents the other state or classification in the context of Lease. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Operating, Finance, Commercial, Residential, Equipment, Other. |
| Start Date | Date | Required | The date on which the applicable business period, agreement, service, or lifecycle begins. Related end dates must follow the business chronology. Used when creating, reviewing, searching, validating, reporting on, or integrating Lease records, where applicable. Its meaning is specific to Lease; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| End Date | Date | Optional | The date on which the applicable business period, agreement, service, or lifecycle ends. It is interpreted together with the corresponding start date. Used when creating, reviewing, searching, validating, reporting on, or integrating Lease records, where applicable. Its meaning is specific to Lease; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Lease records, where applicable. Its meaning is specific to Lease; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the draft state or classification in the context of Lease. Represents the active state or classification in the context of Lease. Represents the suspended state or classification in the context of Lease. Represents the expired state or classification in the context of Lease. Represents the terminated state or classification in the context of Lease. Represents the cancelled state or classification in the context of Lease. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Draft, Active, Suspended, Expired, Terminated, Cancelled. |
| Periodic Amount | Amount | Optional | Captures the business meaning of periodic amount for the Lease. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Lease records, where applicable. Its meaning is specific to Lease; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Property | Lookup | Optional | Connects Lease to Property so related business context can be navigated and enforced. Used when processes need to find or reason about Property records associated with a Lease. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Property**. |
| Lessor | Lookup | Required | Connects Lease to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a Lease. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |

## How it connects to other records
- A lease belongs to one **Property**.
- A lease belongs to one **Party**.

## Lifecycle: Lease lifecycle

A lease record starts as **Draft** and ends as **Expired** or **Terminated** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
  ACTIVE --> EXPIRED: expire
  SUSPENDED --> EXPIRED: expire
  ACTIVE --> TERMINATED: terminate
  SUSPENDED --> TERMINATED: terminate
  DRAFT --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
  SUSPENDED --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Draft | Active | Activate |
| Active | Suspended | Suspend |
| Suspended | Active | Resume |
| Active | Expired | Expire |
| Suspended | Expired | Expire |
| Active | Terminated | Terminate |
| Suspended | Terminated | Terminate |
| Draft | Cancelled | Cancel |
| Active | Cancelled | Cancel |
| Suspended | Cancelled | Cancel |

![A Lease record with its lifecycle bar](/img/entities/lease-record.jpg)

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Lease invariants before create | before a lease is created | 100 |
| Lease invariants before update | before a lease is changed | 100 |
| Lease workflows after update | after a lease is changed | 100 |

Processes started from this record: [Lease follow up required](/administration/processes/#lease-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Lease** window. Access is granted by role under [Roles and access](/administration/access/).
