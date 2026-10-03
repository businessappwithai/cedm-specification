---
title: "Production Receipt"
sidebar_position: 12
description: "The business rules that run on Production Receipt."
---

# Rules on Production Receipt

## Production receipt invariants before create

Runs before a production receipt is created; order 100. In **Business Rules** it is listed as `productionReceiptInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Production receipt invariants before create rule in the editor](/img/rules/production-receipt-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Production receipt invariants before update

Runs before a production receipt is changed; order 100. In **Business Rules** it is listed as `productionReceiptInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

