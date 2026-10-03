---
title: "Energy Meter"
sidebar_label: "Energy Meter"
sidebar_position: 10
description: "Represents a utility transaction called MeterReading within the CEDM business model."
---

# Energy Meter

Represents a utility transaction called MeterReading within the CEDM business model. MeterReading is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate MeterReading records. The entity participates in a wider business graph through relationships with EnergyMeter, UnitOfMeasure. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical MeterReading record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Lines are added from the parent: open a **Energy Meter** and choose the **Energy Meter** tab.

The list shows Reading At, Reading Value, Reading Type, Quality, Meter, Unit Of Measure, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Energy Meter** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Reading At | Date and time | Required | Records when the reading event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating MeterReading records, where applicable. Its meaning is specific to MeterReading; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Reading Value | Amount | Required | Captures the business meaning of reading value for the MeterReading. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating MeterReading records, where applicable. Its meaning is specific to MeterReading; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Reading Type | Choice | Required | Captures the business meaning of reading type for the MeterReading. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating MeterReading records, where applicable. Its meaning is specific to MeterReading; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the actual state or classification in the context of MeterReading. Represents the estimated state or classification in the context of MeterReading. Represents the corrected state or classification in the context of MeterReading. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Actual, Estimated, Corrected. |
| Quality | Choice | Optional | Captures the business meaning of quality for the MeterReading. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating MeterReading records, where applicable. Its meaning is specific to MeterReading; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the good state or classification in the context of MeterReading. Represents the suspect state or classification in the context of MeterReading. Represents the invalid state or classification in the context of MeterReading. Optional because the business concept can remain valid when this value is not yet known or is not applicable. Choose one: Good, Suspect, Invalid. |
| Meter | Lookup | Required | Connects MeterReading to EnergyMeter so related business context can be navigated and enforced. Used when processes need to find or reason about EnergyMeter records associated with a MeterReading. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Energy Meter**. |
| Unit Of Measure | Lookup | Required | Connects MeterReading to UnitOfMeasure so related business context can be navigated and enforced. Used when processes need to find or reason about UnitOfMeasure records associated with a MeterReading. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Unit Of Measure**. |

## How it connects to other records

A energy meter is a line of a **Energy Meter**. It has no window of its own: open the energy meter and use the **Energy Meter** tab to see and add lines.
- A energy meter belongs to one **Energy Meter**.
- A energy meter belongs to one **Unit Of Measure**.

## Who may use it

Anyone who holds a role with access to the **Energy Meter** window. Access is granted by role under [Roles and access](/administration/access/).
