---
title: "Payment Instruction"
sidebar_label: "Payment Instruction"
sidebar_position: 15
description: "A governed instruction authorizing or requesting a future payment through a bank or payment channel, separate from the resulting Payment and BankTransaction evidence."
---

# Payment Instruction

A governed instruction authorizing or requesting a future payment through a bank or payment channel, separate from the resulting Payment and BankTransaction evidence. Provide canonical enterprise semantics for PaymentInstruction while keeping planning, operational, financial and evidential responsibilities separated. A governed instruction authorizing or requesting a future payment through a bank or payment channel, separate from the resulting Payment and BankTransaction evidence. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain explicit through JournalEntry, Payment and BankTransaction where applicable. Created under governed workflow, progressed through explicit states, and retained historically after completion/cancellation. Financial control, tax, billing, subscription management, settlement, reconciliation and audit. Enterprise finance and recurring-revenue operations.

## Finding records

Open **Payment Instruction** from the menu or from its card on the dashboard.

![The Payment Instruction list](/img/entities/payment-instruction-list.jpg)

The list shows Status, Bank Account, Payment, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Payment Instruction form](/img/entities/payment-instruction-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Status**, **Bank Account**.
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
| Status | Choice | Required | Governed lifecycle state. Indicates usability/execution state of PaymentInstruction. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal completion. Required. Choose one: Draft, Active, Completed, Cancelled. |
| Bank Account | Lookup | Required | Bank account from/to which payment is instructed. Supplies treasury settlement account. Payment execution. Exactly one BankAccount. Instruction does not itself prove bank settlement. Pick a record from **Bank Account**. |
| Payment | Lookup | Optional | Payment resulting from executed instruction. Connects intent to settlement transaction. Treasury reconciliation. Optional until execution. Retries must not create duplicate Payment. Pick a record from **Payment**. |

## How it connects to other records
- A payment instruction belongs to one **Bank Account**.
- A payment instruction belongs to one **Payment**.

## Lifecycle: Payment instruction lifecycle

A payment instruction record starts as **Draft** and ends as **Completed** or **Cancelled**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> COMPLETED: complete
  DRAFT --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
```

| From | To | Move |
| --- | --- | --- |
| Draft | Active | Activate |
| Active | Completed | Complete |
| Draft | Cancelled | Cancel |
| Active | Cancelled | Cancel |

![A Payment Instruction record with its lifecycle bar](/img/entities/payment-instruction-record.jpg)

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Payment instruction workflows after update | after a payment instruction is changed | 100 |

Processes started from this record: [Payment instruction follow up required](/administration/processes/#payment-instruction-follow-up-required).

## Who may use it

Anyone who holds a role with access to the **Payment Instruction** window. Access is granted by role under [Roles and access](/administration/access/).
