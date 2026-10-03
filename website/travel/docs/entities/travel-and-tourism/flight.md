---
title: "Flight"
sidebar_label: "Flight"
sidebar_position: 2
description: "Represents a travel transport entity called Flight within the CEDM business model."
---

# Flight

Represents a travel transport entity called Flight within the CEDM business model. Flight is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Flight records. The entity participates in a wider business graph through relationships with Location, Location, Organization, Aircraft. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Flight record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Flight** from the menu or from its card on the dashboard.

![The Flight list](/img/entities/flight-list.jpg)

The list shows Flight Number, Departure At, Arrival At, Status, Origin, Carrier, Vehicle, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Flight form](/img/entities/flight-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Flight Number**, **Departure At**, **Arrival At**, **Status**, **Origin**, **Carrier**.
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
| Flight Number | Text | Required, Up to 30 characters | Captures the business meaning of flight number for the Flight. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Flight records, where applicable. Its meaning is specific to Flight; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Departure At | Date and time | Required | Records when the departure event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating Flight records, where applicable. Its meaning is specific to Flight; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Arrival At | Date and time | Required | Records when the arrival event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating Flight records, where applicable. Its meaning is specific to Flight; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Flight records, where applicable. Its meaning is specific to Flight; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the scheduled state or classification in the context of Flight. Represents the boarding state or classification in the context of Flight. Represents the departed state or classification in the context of Flight. Represents the arrived state or classification in the context of Flight. Represents the delayed state or classification in the context of Flight. Represents the cancelled state or classification in the context of Flight. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Scheduled, Boarding, Departed, Arrived, Delayed, Cancelled. |
| Origin | Lookup | Required | Connects Flight to Location so related business context can be navigated and enforced. Used when processes need to find or reason about Location records associated with a Flight. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Location**. |
| Carrier | Lookup | Required | Connects Flight to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a Flight. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Organization**. |
| Vehicle | Lookup | Optional | Connects Flight to Aircraft so related business context can be navigated and enforced. Used when processes need to find or reason about Aircraft records associated with a Flight. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Aircraft**. |

## How it connects to other records
- A flight belongs to one **Location**.
- A flight belongs to one **Organization**.
- A flight belongs to one **Aircraft**.

## Lifecycle: Flight lifecycle

A flight record starts as **Scheduled** and ends as **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> SCHEDULED
  SCHEDULED --> BOARDING: mark_boarding
  BOARDING --> DEPARTED: mark_departed
  DEPARTED --> ARRIVED: mark_arrived
  ARRIVED --> DELAYED: mark_delayed
  SCHEDULED --> CANCELLED: cancel
  BOARDING --> CANCELLED: cancel
  DEPARTED --> CANCELLED: cancel
  ARRIVED --> CANCELLED: cancel
  DELAYED --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Scheduled | Boarding | Mark boarding |
| Boarding | Departed | Mark departed |
| Departed | Arrived | Mark arrived |
| Arrived | Delayed | Mark delayed |
| Scheduled | Cancelled | Cancel |
| Boarding | Cancelled | Cancel |
| Departed | Cancelled | Cancel |
| Arrived | Cancelled | Cancel |
| Delayed | Cancelled | Cancel |

![A Flight record with its lifecycle bar](/img/entities/flight-record.jpg)

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Flight workflows after update | after a flight is changed | 100 |

Processes started from this record: [Flight follow up required](/administration/processes/#flight-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Flight** window. Access is granted by role under [Roles and access](/administration/access/).
