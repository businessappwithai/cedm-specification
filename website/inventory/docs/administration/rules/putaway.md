---
title: "Putaway"
sidebar_position: 13
description: "The business rules that run on Putaway."
---

# Rules on Putaway

## Putaway invariants before create

Runs before a putaway is created; order 100. In **Business Rules** it is listed as `putawayInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Putaway invariants before update

Runs before a putaway is changed; order 100. In **Business Rules** it is listed as `putawayInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Putaway workflows after update

Runs after a putaway is changed; order 100. In **Business Rules** it is listed as `putawayWorkflowsAfterUpdate`.

- **When** “Status” == "EXCEPTION" and “Status” != previous “Status”: **Starts a process** — “putawayWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Putaway exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “putawayWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Putaway follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “putawayWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Putaway completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

