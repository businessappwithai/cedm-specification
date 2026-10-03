---
title: "Emission"
sidebar_label: "Emission"
sidebar_position: 1
description: "Represents a sustainability entity called Emission within the CEDM business model."
---

# Emission

Represents a sustainability entity called Emission within the CEDM business model. Emission is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Emission records. The entity participates in a wider business graph through relationships with Organization, Location, Product. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Emission record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Emission** from the menu or from its card on the dashboard.

The list shows Emission Source, Emission Type, Quantity, Unit Of Measure, Measured At, Source Quality, Organization, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Emission Source**, **Emission Type**, **Quantity**, **Unit Of Measure**, **Measured At**, **Organization**.
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
| Emission Source | Text | Required, Up to 300 characters | Captures the business meaning of emission source for the Emission. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Emission records, where applicable. Its meaning is specific to Emission; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Emission Type | Choice | Required | Captures the business meaning of emission type for the Emission. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Emission records, where applicable. Its meaning is specific to Emission; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the scope 1 state or classification in the context of Emission. Represents the scope 2 state or classification in the context of Emission. Represents the scope 3 state or classification in the context of Emission. Represents the other state or classification in the context of Emission. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Scope 1, Scope 2, Scope 3, Other. |
| Quantity | Amount | Required | The amount of the referenced item expressed in the applicable unit of measure. It is used by calculations, inventory, planning, fulfillment, or other quantity-based processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Emission records, where applicable. Its meaning is specific to Emission; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Unit Of Measure | Lookup | Required | Identifies the related UnitOfMeasure associated with this Emission. It provides the link needed to navigate from this record to the related business object. Used when creating, reviewing, searching, validating, reporting on, or integrating Emission records, where applicable. This field connects Emission to UnitOfMeasure. The reference establishes business context between the two entities and lets processes navigate from this record to the related UnitOfMeasure. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Pick a record from **Unit Of Measure**. |
| Measured At | Date and time | Required | Records when the measured event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating Emission records, where applicable. Its meaning is specific to Emission; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Source Quality | Choice | Optional | Captures the business meaning of source quality for the Emission. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Emission records, where applicable. Its meaning is specific to Emission; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the measured state or classification in the context of Emission. Represents the calculated state or classification in the context of Emission. Represents the estimated state or classification in the context of Emission. Optional because the business concept can remain valid when this value is not yet known or is not applicable. Choose one: Measured, Calculated, Estimated. |
| Organization | Lookup | Required | Connects Emission to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a Emission. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Organization**. |
| Location | Lookup | Optional | Connects Emission to Location so related business context can be navigated and enforced. Used when processes need to find or reason about Location records associated with a Emission. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Location**. |

## How it connects to other records
- A emission belongs to one **Organization**.
- A emission belongs to one **Location**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Emission invariants before create | before a emission is created | 100 |
| Emission invariants before update | before a emission is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Emission** window. Access is granted by role under [Roles and access](/administration/access/).
