---
title: "Production Record"
sidebar_label: "Production Record"
sidebar_position: 1
description: "Represents a industrial transaction called ProductionRecord within the CEDM business model."
---

# Production Record

Represents a industrial transaction called ProductionRecord within the CEDM business model. ProductionRecord is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate ProductionRecord records. The entity participates in a wider business graph through relationships with Product, Location, MiningSite, ManufacturingWorkOrder. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical ProductionRecord record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Production Record** from the menu or from its card on the dashboard.

![The Production Record list](/img/entities/production-record-list.jpg)

The list shows Production Date, Quantity, Status, Product, Location, Work Order, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Production Record form](/img/entities/production-record-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Production Date**, **Quantity**, **Status**, **Product**.
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
| Production Date | Date and time | Required | Records the business date associated with the production. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating ProductionRecord records, where applicable. Its meaning is specific to ProductionRecord; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Quantity | Amount | Required | The amount of the referenced item expressed in the applicable unit of measure. It is used by calculations, inventory, planning, fulfillment, or other quantity-based processes. Used when creating, reviewing, searching, validating, reporting on, or integrating ProductionRecord records, where applicable. Its meaning is specific to ProductionRecord; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating ProductionRecord records, where applicable. Its meaning is specific to ProductionRecord; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the planned state or classification in the context of ProductionRecord. Represents the recorded state or classification in the context of ProductionRecord. Represents the verified state or classification in the context of ProductionRecord. Represents the rejected state or classification in the context of ProductionRecord. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Planned, Recorded, Verified, Rejected. |
| Product | Lookup | Required | Connects ProductionRecord to Product so related business context can be navigated and enforced. Used when processes need to find or reason about Product records associated with a ProductionRecord. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Product**. |
| Location | Lookup | Optional | Connects ProductionRecord to Location so related business context can be navigated and enforced. Used when processes need to find or reason about Location records associated with a ProductionRecord. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Location**. |
| Work Order | Lookup | Optional | Connects ProductionRecord to ManufacturingWorkOrder so related business context can be navigated and enforced. Used when processes need to find or reason about ManufacturingWorkOrder records associated with a ProductionRecord. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Manufacturing Work Order**. |

## How it connects to other records
- A production record belongs to one **Product**.
- A production record belongs to one **Location**.
- A production record belongs to one **Manufacturing Work Order**.

## Lifecycle: Production record lifecycle

A production record record starts as **Recorded** and ends as **Rejected**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> RECORDED
  RECORDED --> PLANNED: plan
  PLANNED --> VERIFIED: verify
  RECORDED --> REJECTED: reject
  PLANNED --> REJECTED: reject
  VERIFIED --> REJECTED: reject
```

| From | To | Move |
| --- | --- | --- |
| Recorded | Planned | Plan |
| Planned | Verified | Verify |
| Recorded | Rejected | Reject |
| Planned | Rejected | Reject |
| Verified | Rejected | Reject |

![A Production Record record with its lifecycle bar](/img/entities/production-record-record.jpg)

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Production record invariants before create | before a production record is created | 100 |
| Production record invariants before update | before a production record is changed | 100 |
| Production record workflows after update | after a production record is changed | 100 |

Processes started from this record: [Production record follow up required](/administration/processes/#production-record-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Production Record** window. Access is granted by role under [Roles and access](/administration/access/).
