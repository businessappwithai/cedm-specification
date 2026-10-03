---
title: "Customs Declaration"
sidebar_label: "Customs Declaration"
sidebar_position: 1
description: "Represents a trade entity called CustomsDeclaration within the CEDM business model."
---

# Customs Declaration

Represents a trade entity called CustomsDeclaration within the CEDM business model. CustomsDeclaration is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate CustomsDeclaration records. The entity participates in a wider business graph through relationships with Party, Organization, Shipment, Document. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical CustomsDeclaration record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Customs Declaration** from the menu or from its card on the dashboard.

The list shows Declaration Number, Declaration Type, Status, Declared Value, Currency, Declaration Date, Declarant, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Declaration Number**, **Declaration Type**, **Status**, **Declaration Date**, **Declarant**, **Authority**.
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
| Declaration Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of declaration number for the CustomsDeclaration. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating CustomsDeclaration records, where applicable. Its meaning is specific to CustomsDeclaration; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Declaration Type | Choice | Required | Captures the business meaning of declaration type for the CustomsDeclaration. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating CustomsDeclaration records, where applicable. Its meaning is specific to CustomsDeclaration; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the import state or classification in the context of CustomsDeclaration. Represents the export state or classification in the context of CustomsDeclaration. Represents the transit state or classification in the context of CustomsDeclaration. Represents the temporary import state or classification in the context of CustomsDeclaration. Represents the other state or classification in the context of CustomsDeclaration. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Import, Export, Transit, Temporary import, Other. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating CustomsDeclaration records, where applicable. Its meaning is specific to CustomsDeclaration; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the draft state or classification in the context of CustomsDeclaration. Represents the submitted state or classification in the context of CustomsDeclaration. Represents the accepted state or classification in the context of CustomsDeclaration. Represents the under inspection state or classification in the context of CustomsDeclaration. Represents the cleared state or classification in the context of CustomsDeclaration. Represents the rejected state or classification in the context of CustomsDeclaration. Represents the cancelled state or classification in the context of CustomsDeclaration. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Draft, Submitted, Accepted, Under inspection, Cleared, Rejected, Cancelled. |
| Declared Value | Amount | Optional | Captures the business meaning of declared value for the CustomsDeclaration. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating CustomsDeclaration records, where applicable. Its meaning is specific to CustomsDeclaration; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Currency | Lookup | Optional | Identifies the currency in which monetary amounts on the record are expressed, allowing amounts to be interpreted and aggregated consistently. Used when creating, reviewing, searching, validating, reporting on, or integrating CustomsDeclaration records, where applicable. This field connects CustomsDeclaration to Currency. The reference establishes business context between the two entities and lets processes navigate from this record to the related Currency. Optional because the business concept can remain valid when this value is not yet known or is not applicable. Pick a record from **Currency**. |
| Declaration Date | Date | Required | Records the business date associated with the declaration. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating CustomsDeclaration records, where applicable. Its meaning is specific to CustomsDeclaration; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Declarant | Lookup | Required | Connects CustomsDeclaration to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a CustomsDeclaration. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |
| Authority | Lookup | Required | Connects CustomsDeclaration to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a CustomsDeclaration. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Organization**. |

## How it connects to other records
- A customs declaration belongs to one **Party**.
- A customs declaration belongs to one **Organization**.

## Lifecycle: Customs declaration lifecycle

A customs declaration record starts as **Draft** and ends as **Cleared** or **Rejected** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> SUBMITTED: submit
  SUBMITTED --> ACCEPTED: accept
  ACCEPTED --> UNDER_INSPECTION: mark_under_inspection
  UNDER_INSPECTION --> CLEARED: mark_cleared
  DRAFT --> REJECTED: reject
  SUBMITTED --> REJECTED: reject
  ACCEPTED --> REJECTED: reject
  UNDER_INSPECTION --> REJECTED: reject
  DRAFT --> CANCELLED: cancel
  SUBMITTED --> CANCELLED: cancel
  ACCEPTED --> CANCELLED: cancel
  UNDER_INSPECTION --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Draft | Submitted | Submit |
| Submitted | Accepted | Accept |
| Accepted | Under inspection | Mark under inspection |
| Under inspection | Cleared | Mark cleared |
| Draft | Rejected | Reject |
| Submitted | Rejected | Reject |
| Accepted | Rejected | Reject |
| Under inspection | Rejected | Reject |
| Draft | Cancelled | Cancel |
| Submitted | Cancelled | Cancel |
| Accepted | Cancelled | Cancel |
| Under inspection | Cancelled | Cancel |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Customs declaration workflows after update | after a customs declaration is changed | 100 |

Processes started from this record: [Customs declaration approval requested](/administration/processes/#customs-declaration-approval-requested), [Customs declaration follow up required](/administration/processes/#customs-declaration-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Customs Declaration** window. Access is granted by role under [Roles and access](/administration/access/).
