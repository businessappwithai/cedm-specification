---
title: "Sales Order"
sidebar_position: 8
description: "The business rules that run on Sales Order."
---

# Rules on Sales Order

## Sales order invariants before create

Runs before a sales order is created; order 100. In **Business Rules** it is listed as `salesOrderInvariantsBeforeCreate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Sales order invariants before create rule in the editor](/img/rules/sales-order-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Sales order invariants before update

Runs before a sales order is changed; order 100. In **Business Rules** it is listed as `salesOrderInvariantsBeforeUpdate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Sales order invariants before update rule in the editor](/img/rules/sales-order-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Sales order workflows after update

Runs after a sales order is changed; order 100. In **Business Rules** it is listed as `salesOrderWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “salesOrderWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Sales order follow up required”).
- **When** “Status” == "FULFILLED" and “Status” != previous “Status”: **Starts a process** — “salesOrderWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Sales order completion confirmed”).

![The Sales order workflows after update rule in the editor](/img/rules/sales-order-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

