---
title: "Goods Receipt"
sidebar_position: 5
description: "The business rules that run on Goods Receipt."
---

# Rules on Goods Receipt

## Goods receipt line invariants before create

Runs before a goods receipt is created; order 100. In **Business Rules** it is listed as `goodsReceiptLineInvariantsBeforeCreate`.

- **When** “Received Quantity” is filled in and “Received Quantity” < 0: **Refuses the save** — “Received Quantity cannot be negative.”.
- **When** “Accepted Quantity” is filled in and “Accepted Quantity” < 0: **Refuses the save** — “Accepted Quantity cannot be negative.”.
- **When** “Rejected Quantity” is filled in and “Rejected Quantity” < 0: **Refuses the save** — “Rejected Quantity cannot be negative.”.
- **When** “Pending Inspection Quantity” is filled in and “Pending Inspection Quantity” < 0: **Refuses the save** — “Pending Inspection Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.

![The Goods receipt line invariants before create rule in the editor](/img/rules/goods-receipt-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Goods receipt line invariants before update

Runs before a goods receipt is changed; order 100. In **Business Rules** it is listed as `goodsReceiptLineInvariantsBeforeUpdate`.

- **When** “Received Quantity” is filled in and “Received Quantity” < 0: **Refuses the save** — “Received Quantity cannot be negative.”.
- **When** “Accepted Quantity” is filled in and “Accepted Quantity” < 0: **Refuses the save** — “Accepted Quantity cannot be negative.”.
- **When** “Rejected Quantity” is filled in and “Rejected Quantity” < 0: **Refuses the save** — “Rejected Quantity cannot be negative.”.
- **When** “Pending Inspection Quantity” is filled in and “Pending Inspection Quantity” < 0: **Refuses the save** — “Pending Inspection Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.

![The Goods receipt line invariants before update rule in the editor](/img/rules/goods-receipt-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

