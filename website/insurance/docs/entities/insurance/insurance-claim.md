---
title: "Insurance Claim"
sidebar_label: "Insurance Claim"
sidebar_position: 1
description: "Represents a insurance transaction called InsuranceClaim within the CEDM business model."
---

# Insurance Claim

Represents a insurance transaction called InsuranceClaim within the CEDM business model. InsuranceClaim is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate InsuranceClaim records. The entity participates in a wider business graph through relationships with InsurancePolicy, Party, BusinessTransaction. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical InsuranceClaim record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Insurance Claim** from the menu or from its card on the dashboard.

The list shows Claim Number, Loss Date, Reported At, Claimed Amount, Approved Amount, Status, Policy, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Claim Number**, **Reported At**, **Status**, **Policy**, **Claimant**.
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
| Claim Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of claim number for the InsuranceClaim. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating InsuranceClaim records, where applicable. Its meaning is specific to InsuranceClaim; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Loss Date | Date | Optional | Records the business date associated with the loss. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating InsuranceClaim records, where applicable. Its meaning is specific to InsuranceClaim; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Reported At | Date and time | Required | Records when the reported event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating InsuranceClaim records, where applicable. Its meaning is specific to InsuranceClaim; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Claimed Amount | Amount | Optional | Captures the business meaning of claimed amount for the InsuranceClaim. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating InsuranceClaim records, where applicable. Its meaning is specific to InsuranceClaim; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Approved Amount | Amount | Optional | Captures the business meaning of approved amount for the InsuranceClaim. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating InsuranceClaim records, where applicable. Its meaning is specific to InsuranceClaim; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating InsuranceClaim records, where applicable. Its meaning is specific to InsuranceClaim; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the reported state or classification in the context of InsuranceClaim. Represents the under review state or classification in the context of InsuranceClaim. Represents the approved state or classification in the context of InsuranceClaim. Represents the partially approved state or classification in the context of InsuranceClaim. Represents the denied state or classification in the context of InsuranceClaim. Represents the settled state or classification in the context of InsuranceClaim. Represents the closed state or classification in the context of InsuranceClaim. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Reported, Under review, Approved, Partially approved, Denied, Settled, Closed. |
| Policy | Lookup | Required | Connects InsuranceClaim to InsurancePolicy so related business context can be navigated and enforced. Used when processes need to find or reason about InsurancePolicy records associated with a InsuranceClaim. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Insurance Policy**. |
| Claimant | Lookup | Required | Connects InsuranceClaim to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a InsuranceClaim. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |

## How it connects to other records
- A insurance claim belongs to one **Insurance Policy**.
- A insurance claim belongs to one **Party**.

## Lifecycle: Insurance claim lifecycle

A insurance claim record starts as **Reported** and ends as **Closed** or **Denied**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> REPORTED
  REPORTED --> UNDER_REVIEW: review
  UNDER_REVIEW --> APPROVED: approve
  APPROVED --> PARTIALLY_APPROVED: mark_partially_approved
  PARTIALLY_APPROVED --> SETTLED: settle
  SETTLED --> CLOSED: close
  REPORTED --> DENIED: deny
  UNDER_REVIEW --> DENIED: deny
  APPROVED --> DENIED: deny
  PARTIALLY_APPROVED --> DENIED: deny
```

| From | To | Move |
| --- | --- | --- |
| Reported | Under review | Review |
| Under review | Approved | Approve |
| Approved | Partially approved | Mark partially approved |
| Partially approved | Settled | Settle |
| Settled | Closed | Close |
| Reported | Denied | Deny |
| Under review | Denied | Deny |
| Approved | Denied | Deny |
| Partially approved | Denied | Deny |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Insurance claim invariants before create | before a insurance claim is created | 100 |
| Insurance claim invariants before update | before a insurance claim is changed | 100 |
| Insurance claim workflows after update | after a insurance claim is changed | 100 |

Processes started from this record: [Insurance claim approval requested](/administration/processes/#insurance-claim-approval-requested), [Insurance claim follow up required](/administration/processes/#insurance-claim-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Insurance Claim** window. Access is granted by role under [Roles and access](/administration/access/).
