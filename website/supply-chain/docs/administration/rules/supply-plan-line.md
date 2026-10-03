---
title: "Supply Plan Line"
sidebar_position: 8
description: "The business rules that run on Supply Plan Line."
---

# Rules on Supply Plan Line

## Supply plan line invariants before create

Runs before a supply plan line is created; order 100. In **Business Rules** it is listed as `supplyPlanLineInvariantsBeforeCreate`.

- **When** “Planned Quantity” is filled in and “Planned Quantity” < 0: **Refuses the save** — “Planned Quantity cannot be negative.”.
- **When** “Safety Stock Quantity” is filled in and “Safety Stock Quantity” < 0: **Refuses the save** — “Safety Stock Quantity cannot be negative.”.

![The Supply plan line invariants before create rule in the editor](/img/rules/supply-plan-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supply plan line invariants before update

Runs before a supply plan line is changed; order 100. In **Business Rules** it is listed as `supplyPlanLineInvariantsBeforeUpdate`.

- **When** “Planned Quantity” is filled in and “Planned Quantity” < 0: **Refuses the save** — “Planned Quantity cannot be negative.”.
- **When** “Safety Stock Quantity” is filled in and “Safety Stock Quantity” < 0: **Refuses the save** — “Safety Stock Quantity cannot be negative.”.

![The Supply plan line invariants before update rule in the editor](/img/rules/supply-plan-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supply plan line workflows after update

Runs after a supply plan line is changed; order 100. In **Business Rules** it is listed as `supplyPlanLineWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “supplyPlanLineWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supply plan line follow up required”).

![The Supply plan line workflows after update rule in the editor](/img/rules/supply-plan-line-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

