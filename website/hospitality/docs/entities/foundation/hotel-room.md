---
title: "Hotel"
sidebar_label: "Hotel"
sidebar_position: 11
description: "Represents a hospitality asset called HotelRoom within the CEDM business model."
---

# Hotel

Represents a hospitality asset called HotelRoom within the CEDM business model. HotelRoom is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate HotelRoom records. The entity participates in a wider business graph through relationships with Hotel, HotelReservation. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical HotelRoom record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Lines are added from the parent: open a **Hotel** and choose the **Hotel** tab.

The list shows Room Number, Room Type, Status, Capacity, Hotel, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Hotel** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Room Number | Text | Required, Up to 50 characters | Captures the business meaning of room number for the HotelRoom. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating HotelRoom records, where applicable. Its meaning is specific to HotelRoom; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Room Type | Text | Required, Up to 100 characters | Captures the business meaning of room type for the HotelRoom. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating HotelRoom records, where applicable. Its meaning is specific to HotelRoom; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating HotelRoom records, where applicable. Its meaning is specific to HotelRoom; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the available state or classification in the context of HotelRoom. Represents the occupied state or classification in the context of HotelRoom. Represents the reserved state or classification in the context of HotelRoom. Represents the cleaning state or classification in the context of HotelRoom. Represents the out of service state or classification in the context of HotelRoom. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Available, Occupied, Reserved, Cleaning, Out of service. |
| Capacity | Whole number | Required | Captures the business meaning of capacity for the HotelRoom. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating HotelRoom records, where applicable. Its meaning is specific to HotelRoom; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Hotel | Lookup | Required | Connects HotelRoom to Hotel so related business context can be navigated and enforced. Used when processes need to find or reason about Hotel records associated with a HotelRoom. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Hotel**. |

## How it connects to other records

A hotel is a line of a **Hotel**. It has no window of its own: open the hotel and use the **Hotel** tab to see and add lines.
- A hotel belongs to one **Hotel**.
- A hotel has many **Hotel Reservation** records.

## Lifecycle: Hotel room lifecycle

A hotel record starts as **Available**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> AVAILABLE
  AVAILABLE --> OCCUPIED: mark_occupied
  OCCUPIED --> RESERVED: reserve
  OCCUPIED --> CLEANING: mark_cleaning
  CLEANING --> OCCUPIED: finish_cleaning
  RESERVED --> CLEANING: mark_cleaning
  CLEANING --> RESERVED: finish_cleaning
  OCCUPIED --> OUT_OF_SERVICE: mark_out_of_service
  OUT_OF_SERVICE --> OCCUPIED: return_to_service
  RESERVED --> OUT_OF_SERVICE: mark_out_of_service
  OUT_OF_SERVICE --> RESERVED: return_to_service
```

| From | To | Move |
| --- | --- | --- |
| Available | Occupied | Mark occupied |
| Occupied | Reserved | Reserve |
| Occupied | Cleaning | Mark cleaning |
| Cleaning | Occupied | Finish cleaning |
| Reserved | Cleaning | Mark cleaning |
| Cleaning | Reserved | Finish cleaning |
| Occupied | Out of service | Mark out of service |
| Out of service | Occupied | Return to service |
| Reserved | Out of service | Mark out of service |
| Out of service | Reserved | Return to service |

## Who may use it

Anyone who holds a role with access to the **Hotel** window. Access is granted by role under [Roles and access](/administration/access/).
