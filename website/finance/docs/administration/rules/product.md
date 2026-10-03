---
title: "Product"
sidebar_position: 24
description: "The business rules that run on Product."
---

# Rules on Product

## Product invariants before create

Runs before a product is created; order 100. In **Business Rules** it is listed as `productInvariantsBeforeCreate`.

- **When** “Standard Price” is filled in and “Standard Price” < 0: **Refuses the save** — “Standard Price cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Product invariants before update

Runs before a product is changed; order 100. In **Business Rules** it is listed as `productInvariantsBeforeUpdate`.

- **When** “Standard Price” is filled in and “Standard Price” < 0: **Refuses the save** — “Standard Price cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Product workflows after update

Runs after a product is changed; order 100. In **Business Rules** it is listed as `productWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “productWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Product exception raised”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

