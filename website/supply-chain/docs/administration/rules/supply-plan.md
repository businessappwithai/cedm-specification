---
title: "Supply Plan"
sidebar_position: 7
description: "The business rules that run on Supply Plan."
---

# Rules on Supply Plan

## Supply plan invariants before create

Runs before a supply plan is created; order 100. In **Business Rules** it is listed as `supplyPlanInvariantsBeforeCreate`.

- **When** “Planning Start” is filled in and “Planning End” is filled in and “Planning End” < “Planning Start”: **Refuses the save** — “Planning End cannot be earlier than planning start.”.

![The Supply plan invariants before create rule in the editor](/img/rules/supply-plan-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supply plan invariants before update

Runs before a supply plan is changed; order 100. In **Business Rules** it is listed as `supplyPlanInvariantsBeforeUpdate`.

- **When** “Planning Start” is filled in and “Planning End” is filled in and “Planning End” < “Planning Start”: **Refuses the save** — “Planning End cannot be earlier than planning start.”.

![The Supply plan invariants before update rule in the editor](/img/rules/supply-plan-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supply plan workflows after update

Runs after a supply plan is changed; order 100. In **Business Rules** it is listed as `supplyPlanWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “supplyPlanWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supply plan follow up required”).

![The Supply plan workflows after update rule in the editor](/img/rules/supply-plan-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

