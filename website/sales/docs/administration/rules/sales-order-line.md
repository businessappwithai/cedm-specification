---
title: "Sales Order"
sidebar_position: 15
description: "The business rules that run on Sales Order."
---

# Rules on Sales Order

## Sales order line invariants before create

Runs before a sales order is created; order 100. In **Business Rules** it is listed as `salesOrderLineInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Discount Amount” is filled in and “Discount Amount” < 0: **Refuses the save** — “Discount Amount cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Line Amount” is filled in and “Line Amount” < 0: **Refuses the save** — “Line Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Sales order line invariants before update

Runs before a sales order is changed; order 100. In **Business Rules** it is listed as `salesOrderLineInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Discount Amount” is filled in and “Discount Amount” < 0: **Refuses the save** — “Discount Amount cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Line Amount” is filled in and “Line Amount” < 0: **Refuses the save** — “Line Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

