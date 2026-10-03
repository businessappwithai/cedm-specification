---
title: "Packing"
sidebar_position: 8
description: "The business rules that run on Packing."
---

# Rules on Packing

## Packing invariants before create

Runs before a packing is created; order 100. In **Business Rules** it is listed as `packingInvariantsBeforeCreate`.

- **When** “Packed Quantity” is filled in and “Packed Quantity” < 0: **Refuses the save** — “Packed Quantity cannot be negative.”.

![The Packing invariants before create rule in the editor](/img/rules/packing-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Packing invariants before update

Runs before a packing is changed; order 100. In **Business Rules** it is listed as `packingInvariantsBeforeUpdate`.

- **When** “Packed Quantity” is filled in and “Packed Quantity” < 0: **Refuses the save** — “Packed Quantity cannot be negative.”.

![The Packing invariants before update rule in the editor](/img/rules/packing-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Packing workflows after update

Runs after a packing is changed; order 100. In **Business Rules** it is listed as `packingWorkflowsAfterUpdate`.

- **When** “Status” == "EXCEPTION" and “Status” != previous “Status”: **Starts a process** — “packingWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Packing exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “packingWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Packing follow up required”).

![The Packing workflows after update rule in the editor](/img/rules/packing-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

