---
title: "Budget"
sidebar_label: "Budget"
sidebar_position: 5
description: "Detailed dimensional budget allocation."
---

# Budget

Detailed dimensional budget allocation. Defines planned money at an account/responsibility intersection. Budgeting and variance analysis. Budget governs; Account/CostCenter/ProfitCenter classify.

## Finding records

Lines are added from the parent: open a **Budget** and choose the **Budget** tab.

The list shows Amount, Budget, Account, Cost Center, Profit Center, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Budget** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Amount | Amount | Required | Planned monetary amount. Financial target/limit for dimensions. Planning and variance. Not an actual ledger balance. Required. |
| Budget | Lookup | Required | Parent financial plan. Supplies governance/version context. Planning. Exactly one Budget. Line lifecycle follows budget governance. Pick a record from **Budget**. |
| Account | Lookup | Optional | Financial account dimension. Classifies planned amount. Budget-vs-actual. Optional under non-account planning. Actuals derive from accounting not line mutation. Pick a record from **Account**. |
| Cost Center | Lookup | Optional | Cost responsibility dimension. Allocates plan to cost center. Expense control. Optional. Must be eligible for budget period. Pick a record from **Cost Center**. |
| Profit Center | Lookup | Optional | Profit responsibility dimension. Allocates plan to profit center. Management reporting. Optional. Must be eligible for budget period. Pick a record from **Profit Center**. |

## How it connects to other records

A budget is a line of a **Budget**. It has no window of its own: open the budget and use the **Budget** tab to see and add lines.
- A budget belongs to one **Budget**.
- A budget belongs to one **Account**.
- A budget belongs to one **Cost Center**.
- A budget belongs to one **Profit Center**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Budget line invariants before create | before a budget is created | 100 |
| Budget line invariants before update | before a budget is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Budget** window. Access is granted by role under [Roles and access](/administration/access/).
