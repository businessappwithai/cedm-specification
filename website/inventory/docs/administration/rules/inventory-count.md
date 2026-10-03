---
title: "Inventory Count"
sidebar_position: 4
description: "The business rules that run on Inventory Count."
---

# Rules on Inventory Count

## Inventory count invariants before create

Runs before a inventory count is created; order 100. In **Business Rules** it is listed as `inventoryCountInvariantsBeforeCreate`.

- **When** “Counted Quantity” is filled in and “Counted Quantity” < 0: **Refuses the save** — “Counted Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Inventory count invariants before update

Runs before a inventory count is changed; order 100. In **Business Rules** it is listed as `inventoryCountInvariantsBeforeUpdate`.

- **When** “Counted Quantity” is filled in and “Counted Quantity” < 0: **Refuses the save** — “Counted Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

