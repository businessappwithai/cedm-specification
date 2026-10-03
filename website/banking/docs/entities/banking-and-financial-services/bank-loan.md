---
title: "Bank Loan"
sidebar_label: "Bank Loan"
sidebar_position: 2
description: "Represents a banking entity called BankLoan within the CEDM business model."
---

# Bank Loan

Represents a banking entity called BankLoan within the CEDM business model. BankLoan is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate BankLoan records. The entity participates in a wider business graph through relationships with Party, Organization, Currency. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical BankLoan record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **Bank Loan** from the menu or from its card on the dashboard.

![The Bank Loan list](/img/entities/bank-loan-list.jpg)

The list shows Loan Number, Principal Amount, Interest Rate, Start Date, Maturity Date, Status, Borrower, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Bank Loan form](/img/entities/bank-loan-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Loan Number**, **Principal Amount**, **Interest Rate**, **Start Date**, **Maturity Date**, **Status**, **Borrower**, **Lender**, **Currency**.
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
| Loan Number | Text | Required, Unique, Up to 100 characters | Captures the business meaning of loan number for the BankLoan. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating BankLoan records, where applicable. Its meaning is specific to BankLoan; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Principal Amount | Amount | Required | Captures the business meaning of principal amount for the BankLoan. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating BankLoan records, where applicable. Its meaning is specific to BankLoan; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Interest Rate | Amount | Required | Captures the business meaning of interest rate for the BankLoan. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating BankLoan records, where applicable. Its meaning is specific to BankLoan; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Start Date | Date | Required | The date on which the applicable business period, agreement, service, or lifecycle begins. Related end dates must follow the business chronology. Used when creating, reviewing, searching, validating, reporting on, or integrating BankLoan records, where applicable. Its meaning is specific to BankLoan; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Maturity Date | Date | Required | Records the business date associated with the maturity. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating BankLoan records, where applicable. Its meaning is specific to BankLoan; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating BankLoan records, where applicable. Its meaning is specific to BankLoan; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the application state or classification in the context of BankLoan. Represents the approved state or classification in the context of BankLoan. Represents the active state or classification in the context of BankLoan. Represents the delinquent state or classification in the context of BankLoan. Represents the paid off state or classification in the context of BankLoan. Represents the defaulted state or classification in the context of BankLoan. Represents the cancelled state or classification in the context of BankLoan. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Application, Approved, Active, Delinquent, Paid off, Defaulted, Cancelled. |
| Borrower | Lookup | Required | Connects BankLoan to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a BankLoan. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |
| Lender | Lookup | Required | Connects BankLoan to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a BankLoan. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Organization**. |
| Currency | Lookup | Required | Connects BankLoan to Currency so related business context can be navigated and enforced. Used when processes need to find or reason about Currency records associated with a BankLoan. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Currency**. |

## How it connects to other records
- A bank loan belongs to one **Party**.
- A bank loan belongs to one **Organization**.
- A bank loan belongs to one **Currency**.
- A bank loan has many **Collateral** records.

## Lifecycle: Bank loan lifecycle

A bank loan record starts as **Application** and ends as **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> APPLICATION
  APPLICATION --> APPROVED: approve
  APPROVED --> ACTIVE: activate
  ACTIVE --> DELINQUENT: mark_delinquent
  DELINQUENT --> PAID_OFF: mark_paid_off
  PAID_OFF --> DEFAULTED: mark_defaulted
  APPLICATION --> CANCELLED: cancel
  APPROVED --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
  DELINQUENT --> CANCELLED: cancel
  PAID_OFF --> CANCELLED: cancel
  DEFAULTED --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Application | Approved | Approve |
| Approved | Active | Activate |
| Active | Delinquent | Mark delinquent |
| Delinquent | Paid off | Mark paid off |
| Paid off | Defaulted | Mark defaulted |
| Application | Cancelled | Cancel |
| Approved | Cancelled | Cancel |
| Active | Cancelled | Cancel |
| Delinquent | Cancelled | Cancel |
| Paid off | Cancelled | Cancel |
| Defaulted | Cancelled | Cancel |

![A Bank Loan record with its lifecycle bar](/img/entities/bank-loan-record.jpg)

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Bank loan invariants before create | before a bank loan is created | 100 |
| Bank loan invariants before update | before a bank loan is changed | 100 |
| Bank loan workflows after update | after a bank loan is changed | 100 |

Processes started from this record: [Bank loan follow up required](/administration/processes/#bank-loan-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Bank Loan** window. Access is granted by role under [Roles and access](/administration/access/).
