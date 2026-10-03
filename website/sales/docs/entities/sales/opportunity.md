---
title: "Opportunity"
sidebar_label: "Opportunity"
sidebar_position: 3
description: "Represents a crm entity called Opportunity within the CEDM business model."
---

# Opportunity

Represents a crm entity called Opportunity within the CEDM business model. Opportunity is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Opportunity records. The entity participates in a wider business graph through relationships with Customer, Party, Lead, SalesOrder. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Opportunity record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Opportunity** from the menu or from its card on the dashboard.

The list shows Opportunity Number, Name, Stage, Probability, Expected Value, Expected Close Date, Customer, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Opportunity Number**, **Name**, **Stage**.
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
| Opportunity Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of opportunity number for the Opportunity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Opportunity records, where applicable. Its meaning is specific to Opportunity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Name | Text | Required, Up to 300 characters | The human-readable name used by people, reports, searches, and related business processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Opportunity records, where applicable. Its meaning is specific to Opportunity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Stage | Choice | Required | Captures the business meaning of stage for the Opportunity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Opportunity records, where applicable. Its meaning is specific to Opportunity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the qualification state or classification in the context of Opportunity. Represents the discovery state or classification in the context of Opportunity. Represents the proposal state or classification in the context of Opportunity. Represents the negotiation state or classification in the context of Opportunity. Represents the won state or classification in the context of Opportunity. Represents the lost state or classification in the context of Opportunity. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Qualification, Discovery, Proposal, Negotiation, Won, Lost. |
| Probability | Amount | Optional | Captures the business meaning of probability for the Opportunity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Opportunity records, where applicable. Its meaning is specific to Opportunity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Expected Value | Amount | Optional | Captures the business meaning of expected value for the Opportunity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Opportunity records, where applicable. Its meaning is specific to Opportunity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Expected Close Date | Date | Optional | Records the business date associated with the expected close. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating Opportunity records, where applicable. Its meaning is specific to Opportunity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Customer | Lookup | Optional | Connects Opportunity to Customer so related business context can be navigated and enforced. Used when processes need to find or reason about Customer records associated with a Opportunity. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Customer**. |
| Owner | Lookup | Optional | Connects Opportunity to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a Opportunity. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |
| Sales Order | Lookup | Optional | Connects Opportunity to SalesOrder so related business context can be navigated and enforced. Used when processes need to find or reason about SalesOrder records associated with a Opportunity. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Sales Order**. |

## How it connects to other records
- A opportunity has one **Lead**.
- A opportunity belongs to one **Customer**.
- A opportunity belongs to one **Party**.
- A opportunity belongs to one **Sales Order**.
- A opportunity has many **Quotation** records.

## Lifecycle: Opportunity lifecycle

A opportunity record starts as **Qualification** and ends as **Lost**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> QUALIFICATION
  QUALIFICATION --> DISCOVERY: mark_discovery
  DISCOVERY --> PROPOSAL: mark_proposal
  PROPOSAL --> WON: mark_won
  DISCOVERY --> NEGOTIATION: mark_negotiation
  NEGOTIATION --> DISCOVERY: resume
  PROPOSAL --> NEGOTIATION: mark_negotiation
  NEGOTIATION --> PROPOSAL: resume
  WON --> NEGOTIATION: mark_negotiation
  NEGOTIATION --> WON: resume
  DISCOVERY --> LOST: mark_lost
  PROPOSAL --> LOST: mark_lost
  WON --> LOST: mark_lost
  NEGOTIATION --> LOST: mark_lost
```

| From | To | Move |
| --- | --- | --- |
| Qualification | Discovery | Mark discovery |
| Discovery | Proposal | Mark proposal |
| Proposal | Won | Mark won |
| Discovery | Negotiation | Mark negotiation |
| Negotiation | Discovery | Resume |
| Proposal | Negotiation | Mark negotiation |
| Negotiation | Proposal | Resume |
| Won | Negotiation | Mark negotiation |
| Negotiation | Won | Resume |
| Discovery | Lost | Mark lost |
| Proposal | Lost | Mark lost |
| Won | Lost | Mark lost |
| Negotiation | Lost | Mark lost |

## Who may use it

Anyone who holds a role with access to the **Opportunity** window. Access is granted by role under [Roles and access](/administration/access/).
