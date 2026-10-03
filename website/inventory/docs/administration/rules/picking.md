---
title: "Picking"
sidebar_position: 11
description: "The business rules that run on Picking."
---

# Rules on Picking

## Picking invariants before create

Runs before a picking is created; order 100. In **Business Rules** it is listed as `pickingInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Picking invariants before create rule in the editor](/img/rules/picking-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Picking invariants before update

Runs before a picking is changed; order 100. In **Business Rules** it is listed as `pickingInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Picking invariants before update rule in the editor](/img/rules/picking-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Picking workflows after update

Runs after a picking is changed; order 100. In **Business Rules** it is listed as `pickingWorkflowsAfterUpdate`.

- **When** “Status” == "EXCEPTION" and “Status” != previous “Status”: **Starts a process** — “pickingWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Picking exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “pickingWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Picking follow up required”).

![The Picking workflows after update rule in the editor](/img/rules/picking-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

