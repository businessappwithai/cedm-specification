---
title: "Purchase Order"
sidebar_position: 10
description: "The business rules that run on Purchase Order."
---

# Rules on Purchase Order

## Purchase order invariants before create

Runs before a purchase order is created; order 100. In **Business Rules** it is listed as `purchaseOrderInvariantsBeforeCreate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Purchase order invariants before create rule in the editor](/img/rules/purchase-order-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Purchase order invariants before update

Runs before a purchase order is changed; order 100. In **Business Rules** it is listed as `purchaseOrderInvariantsBeforeUpdate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Purchase order invariants before update rule in the editor](/img/rules/purchase-order-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Purchase order workflows after update

Runs after a purchase order is changed; order 100. In **Business Rules** it is listed as `purchaseOrderWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “purchaseOrderWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Purchase order follow up required”).

![The Purchase order workflows after update rule in the editor](/img/rules/purchase-order-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

