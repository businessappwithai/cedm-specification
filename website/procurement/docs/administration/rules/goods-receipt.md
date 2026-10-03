---
title: "Goods Receipt"
sidebar_position: 4
description: "The business rules that run on Goods Receipt."
---

# Rules on Goods Receipt

## Goods receipt invariants before create

Runs before a goods receipt is created; order 100. In **Business Rules** it is listed as `goodsReceiptInvariantsBeforeCreate`.

- **When** “Received Quantity” is filled in and “Received Quantity” < 0: **Refuses the save** — “Received Quantity cannot be negative.”.
- **When** “Accepted Quantity” is filled in and “Accepted Quantity” < 0: **Refuses the save** — “Accepted Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Goods receipt invariants before update

Runs before a goods receipt is changed; order 100. In **Business Rules** it is listed as `goodsReceiptInvariantsBeforeUpdate`.

- **When** “Received Quantity” is filled in and “Received Quantity” < 0: **Refuses the save** — “Received Quantity cannot be negative.”.
- **When** “Accepted Quantity” is filled in and “Accepted Quantity” < 0: **Refuses the save** — “Accepted Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Goods receipt workflows after update

Runs after a goods receipt is changed; order 100. In **Business Rules** it is listed as `goodsReceiptWorkflowsAfterUpdate`.

- **When** (“Status” == "REJECTED" or “Status” == "CANCELLED") and “Status” != previous “Status”: **Starts a process** — “goodsReceiptWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Goods receipt follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

