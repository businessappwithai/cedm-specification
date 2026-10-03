---
title: "Quotation"
sidebar_label: "Quotation"
sidebar_position: 4
description: "Represents a commercial transaction called Quotation within the CEDM business model."
---

# Quotation

Represents a commercial transaction called Quotation within the CEDM business model. Quotation is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Quotation records. The entity participates in a wider business graph through relationships with Customer, Opportunity, QuotationLine, PaymentTerm. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Quotation record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Quotation** from the menu or from its card on the dashboard.

The list shows Quotation Number, Quotation Date, Valid Until, Status, Currency, Total Amount, Customer, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Quotation Number**, **Quotation Date**, **Status**, **Currency**, **Total Amount**, **Customer**.
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
| Quotation Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of quotation number for the Quotation. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Quotation records, where applicable. Its meaning is specific to Quotation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Quotation Date | Date | Required | Records the business date associated with the quotation. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating Quotation records, where applicable. Its meaning is specific to Quotation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Valid Until | Date | Optional | Captures the business meaning of valid until for the Quotation. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Quotation records, where applicable. Its meaning is specific to Quotation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Quotation records, where applicable. Its meaning is specific to Quotation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the draft state or classification in the context of Quotation. Represents the submitted state or classification in the context of Quotation. Represents the accepted state or classification in the context of Quotation. Represents the rejected state or classification in the context of Quotation. Represents the expired state or classification in the context of Quotation. Represents the cancelled state or classification in the context of Quotation. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Draft, Submitted, Accepted, Rejected, Expired, Cancelled. |
| Currency | Lookup | Required | Identifies the currency in which monetary amounts on the record are expressed, allowing amounts to be interpreted and aggregated consistently. Used when creating, reviewing, searching, validating, reporting on, or integrating Quotation records, where applicable. This field connects Quotation to Currency. The reference establishes business context between the two entities and lets processes navigate from this record to the related Currency. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Pick a record from **Currency**. |
| Total Amount | Amount | Required | Captures the business meaning of total amount for the Quotation. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Quotation records, where applicable. Its meaning is specific to Quotation; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Customer | Lookup | Required | Connects Quotation to Customer so related business context can be navigated and enforced. Used when processes need to find or reason about Customer records associated with a Quotation. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Customer**. |
| Opportunity | Lookup | Optional | Connects Quotation to Opportunity so related business context can be navigated and enforced. Used when processes need to find or reason about Opportunity records associated with a Quotation. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Opportunity**. |
| Payment Terms | Lookup | Optional | Connects Quotation to PaymentTerm so related business context can be navigated and enforced. Used when processes need to find or reason about PaymentTerm records associated with a Quotation. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Payment Term**. |

## How it connects to other records
- A quotation belongs to one **Customer**.
- A quotation belongs to one **Opportunity**.
- A quotation has many **Quotation** records.
- A quotation belongs to one **Payment Term**.

## Lifecycle: Quotation lifecycle

A quotation record starts as **Draft** and ends as **Rejected** or **Expired** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> SUBMITTED: submit
  SUBMITTED --> ACCEPTED: accept
  DRAFT --> REJECTED: reject
  SUBMITTED --> REJECTED: reject
  ACCEPTED --> REJECTED: reject
  SUBMITTED --> EXPIRED: expire
  ACCEPTED --> EXPIRED: expire
  DRAFT --> CANCELLED: cancel
  SUBMITTED --> CANCELLED: cancel
  ACCEPTED --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Draft | Submitted | Submit |
| Submitted | Accepted | Accept |
| Draft | Rejected | Reject |
| Submitted | Rejected | Reject |
| Accepted | Rejected | Reject |
| Submitted | Expired | Expire |
| Accepted | Expired | Expire |
| Draft | Cancelled | Cancel |
| Submitted | Cancelled | Cancel |
| Accepted | Cancelled | Cancel |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Quotation invariants before create | before a quotation is created | 100 |
| Quotation invariants before update | before a quotation is changed | 100 |
| Quotation workflows after update | after a quotation is changed | 100 |

Processes started from this record: [Quotation approval requested](/administration/processes/#quotation-approval-requested), [Quotation follow up required](/administration/processes/#quotation-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Quotation** window. Access is granted by role under [Roles and access](/administration/access/).
