---
title: "Purchase Order"
sidebar_position: 26
description: "The business rules that run on Purchase Order."
---

# Rules on Purchase Order

## Purchase order line invariants before create

Runs before a purchase order is created; order 100. In **Business Rules** it is listed as `purchaseOrderLineInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Line Amount” is filled in and “Line Amount” < 0: **Refuses the save** — “Line Amount cannot be negative.”.
- **When** “Received Quantity” is filled in and “Received Quantity” < 0: **Refuses the save** — “Received Quantity cannot be negative.”.
- **When** “Accepted Quantity” is filled in and “Accepted Quantity” < 0: **Refuses the save** — “Accepted Quantity cannot be negative.”.
- **When** “Returned Quantity” is filled in and “Returned Quantity” < 0: **Refuses the save** — “Returned Quantity cannot be negative.”.
- **When** “Outstanding Quantity” is filled in and “Outstanding Quantity” < 0: **Refuses the save** — “Outstanding Quantity cannot be negative.”.

![The Purchase order line invariants before create rule in the editor](/img/rules/purchase-order-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Purchase order line invariants before update

Runs before a purchase order is changed; order 100. In **Business Rules** it is listed as `purchaseOrderLineInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Line Amount” is filled in and “Line Amount” < 0: **Refuses the save** — “Line Amount cannot be negative.”.
- **When** “Received Quantity” is filled in and “Received Quantity” < 0: **Refuses the save** — “Received Quantity cannot be negative.”.
- **When** “Accepted Quantity” is filled in and “Accepted Quantity” < 0: **Refuses the save** — “Accepted Quantity cannot be negative.”.
- **When** “Returned Quantity” is filled in and “Returned Quantity” < 0: **Refuses the save** — “Returned Quantity cannot be negative.”.
- **When** “Outstanding Quantity” is filled in and “Outstanding Quantity” < 0: **Refuses the save** — “Outstanding Quantity cannot be negative.”.

![The Purchase order line invariants before update rule in the editor](/img/rules/purchase-order-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

