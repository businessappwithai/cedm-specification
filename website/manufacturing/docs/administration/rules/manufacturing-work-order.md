---
title: "Manufacturing Work Order"
sidebar_position: 7
description: "The business rules that run on Manufacturing Work Order."
---

# Rules on Manufacturing Work Order

## Manufacturing work order invariants before create

Runs before a manufacturing work order is created; order 100. In **Business Rules** it is listed as `manufacturingWorkOrderInvariantsBeforeCreate`.

- **When** “Planned Start” is filled in and “Planned End” is filled in and “Planned End” < “Planned Start”: **Refuses the save** — “Planned End cannot be earlier than planned start.”.
- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Manufacturing work order invariants before create rule in the editor](/img/rules/manufacturing-work-order-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Manufacturing work order invariants before update

Runs before a manufacturing work order is changed; order 100. In **Business Rules** it is listed as `manufacturingWorkOrderInvariantsBeforeUpdate`.

- **When** “Planned Start” is filled in and “Planned End” is filled in and “Planned End” < “Planned Start”: **Refuses the save** — “Planned End cannot be earlier than planned start.”.
- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Manufacturing work order invariants before update rule in the editor](/img/rules/manufacturing-work-order-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Manufacturing work order workflows after update

Runs after a manufacturing work order is changed; order 100. In **Business Rules** it is listed as `manufacturingWorkOrderWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “manufacturingWorkOrderWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Manufacturing work order follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “manufacturingWorkOrderWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Manufacturing work order completion confirmed”).

![The Manufacturing work order workflows after update rule in the editor](/img/rules/manufacturing-work-order-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

