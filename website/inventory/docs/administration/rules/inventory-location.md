---
title: "Warehouse"
sidebar_position: 16
description: "The business rules that run on Warehouse."
---

# Rules on Warehouse

## Inventory location invariants before create

Runs before a warehouse is created; order 100. In **Business Rules** it is listed as `inventoryLocationInvariantsBeforeCreate`.

- **When** “Capacity” is filled in and “Capacity” < 0: **Refuses the save** — “Capacity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Inventory location invariants before update

Runs before a warehouse is changed; order 100. In **Business Rules** it is listed as `inventoryLocationInvariantsBeforeUpdate`.

- **When** “Capacity” is filled in and “Capacity” < 0: **Refuses the save** — “Capacity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Inventory location workflows after update

Runs after a warehouse is changed; order 100. In **Business Rules** it is listed as `inventoryLocationWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “inventoryLocationWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Inventory location exception raised”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

