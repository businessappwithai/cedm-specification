---
title: "Warehouse"
sidebar_position: 17
description: "The business rules that run on Warehouse."
---

# Rules on Warehouse

## Warehouse invariants before create

Runs before a warehouse is created; order 100. In **Business Rules** it is listed as `warehouseInvariantsBeforeCreate`.

- **When** “Capacity” is filled in and “Capacity” < 0: **Refuses the save** — “Capacity cannot be negative.”.

![The Warehouse invariants before create rule in the editor](/img/rules/warehouse-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Warehouse invariants before update

Runs before a warehouse is changed; order 100. In **Business Rules** it is listed as `warehouseInvariantsBeforeUpdate`.

- **When** “Capacity” is filled in and “Capacity” < 0: **Refuses the save** — “Capacity cannot be negative.”.

![The Warehouse invariants before update rule in the editor](/img/rules/warehouse-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

