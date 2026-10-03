---
title: "Cash Position"
sidebar_label: "Cash Position"
sidebar_position: 7
description: "Reproducible point-in-time treasury liquidity view."
---

# Cash Position

Reproducible point-in-time treasury liquidity view. CashPosition summarizes cash; BankTransaction supplies external evidence, Payment supplies internal settlement state, and JournalEntry supplies accounting recognition. Daily cash management, liquidity, funding, payment planning and treasury reporting. BankAccount defines account/currency; bank transactions and payments supply observed/pending cash evidence. Calculated for an as-of cutoff → reviewed/published where required → retained or superseded by later snapshots. New/reversed/reconciled cash evidence affects subsequent positions and forecasts, not source transaction history.

## Finding records

Open **Cash Position** from the menu or from its card on the dashboard.

![The Cash Position list](/img/entities/cash-position-list.jpg)

The list shows As Of, Ledger Balance, Available Balance, Forecast Balance, Bank Account, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Cash Position form](/img/entities/cash-position-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **As Of**, **Ledger Balance**, **Available Balance**, **Bank Account**.
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
| As Of | Date and time | Required | Effective timestamp of position. Defines evidence cutoff. Intraday/end-of-day liquidity. Transactions after cutoff are excluded. Required. |
| Ledger Balance | Amount | Required | Account balance recognized at cutoff under position policy. Baseline cash amount. Treasury reporting. Must be reproducible from authoritative evidence. Required. |
| Available Balance | Amount | Required | Cash considered available for use at cutoff. Liquidity available after restrictions/pending effects under policy. Funding and payment decisions. Currency must match account/position currency. Required. |
| Forecast Balance | Amount | Optional | Projected cash after included future inflows/outflows. Forward liquidity estimate, not posted cash. Treasury planning. Must identify forecast policy/horizon externally or through consuming process. Optional when no forecast is calculated. |
| Bank Account | Lookup | Required | Bank account positioned. Defines cash account context. Treasury and reconciliation. Exactly one BankAccount. Account status/currency constrain calculation. Pick a record from **Bank Account**. |

## How it connects to other records
- A cash position belongs to one **Bank Account**.
- A cash position has many **Payment** records.

## Who may use it

Anyone who holds a role with access to the **Cash Position** window. Access is granted by role under [Roles and access](/administration/access/).
