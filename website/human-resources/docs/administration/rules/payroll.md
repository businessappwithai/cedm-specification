---
title: "Payroll"
sidebar_position: 6
description: "The business rules that run on Payroll."
---

# Rules on Payroll

## Payroll invariants before create

Runs before a payroll is created; order 100. In **Business Rules** it is listed as `payrollInvariantsBeforeCreate`.

- **When** “Period Start” is filled in and “Period End” is filled in and “Period End” < “Period Start”: **Refuses the save** — “Period End cannot be earlier than period start.”.
- **When** “Gross Amount” is filled in and “Gross Amount” < 0: **Refuses the save** — “Gross Amount cannot be negative.”.

![The Payroll invariants before create rule in the editor](/img/rules/payroll-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Payroll invariants before update

Runs before a payroll is changed; order 100. In **Business Rules** it is listed as `payrollInvariantsBeforeUpdate`.

- **When** “Period Start” is filled in and “Period End” is filled in and “Period End” < “Period Start”: **Refuses the save** — “Period End cannot be earlier than period start.”.
- **When** “Gross Amount” is filled in and “Gross Amount” < 0: **Refuses the save** — “Gross Amount cannot be negative.”.

![The Payroll invariants before update rule in the editor](/img/rules/payroll-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Payroll workflows after update

Runs after a payroll is changed; order 100. In **Business Rules** it is listed as `payrollWorkflowsAfterUpdate`.

- **When** “Status” == "REVERSED" and “Status” != previous “Status”: **Starts a process** — “payrollWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Payroll follow up required”).
- **When** “Status” == "POSTED" and “Status” != previous “Status”: **Starts a process** — “payrollWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Payroll completion confirmed”).

![The Payroll workflows after update rule in the editor](/img/rules/payroll-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

