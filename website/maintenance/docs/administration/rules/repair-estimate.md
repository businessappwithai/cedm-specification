---
title: "Repair Estimate"
sidebar_position: 10
description: "The business rules that run on Repair Estimate."
---

# Rules on Repair Estimate

## Repair estimate invariants before create

Runs before a repair estimate is created; order 100. In **Business Rules** it is listed as `repairEstimateInvariantsBeforeCreate`.

- **When** “Estimated Repair Amount” is filled in and “Estimated Repair Amount” < 0: **Refuses the save** — “Estimated Repair Amount cannot be negative.”.
- **When** “Estimated Sale Amount” is filled in and “Estimated Sale Amount” < 0: **Refuses the save** — “Estimated Sale Amount cannot be negative.”.
- **When** “Approved Amount” is filled in and “Approved Amount” < 0: **Refuses the save** — “Approved Amount cannot be negative.”.

![The Repair estimate invariants before create rule in the editor](/img/rules/repair-estimate-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Repair estimate invariants before update

Runs before a repair estimate is changed; order 100. In **Business Rules** it is listed as `repairEstimateInvariantsBeforeUpdate`.

- **When** “Estimated Repair Amount” is filled in and “Estimated Repair Amount” < 0: **Refuses the save** — “Estimated Repair Amount cannot be negative.”.
- **When** “Estimated Sale Amount” is filled in and “Estimated Sale Amount” < 0: **Refuses the save** — “Estimated Sale Amount cannot be negative.”.
- **When** “Approved Amount” is filled in and “Approved Amount” < 0: **Refuses the save** — “Approved Amount cannot be negative.”.

![The Repair estimate invariants before update rule in the editor](/img/rules/repair-estimate-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Repair estimate workflows after update

Runs after a repair estimate is changed; order 100. In **Business Rules** it is listed as `repairEstimateWorkflowsAfterUpdate`.

- **When** “Status” == "SUBMITTED" and “Status” != previous “Status”: **Starts a process** — “repairEstimateWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Repair estimate approval requested”).
- **When** (“Status” == "REJECTED" or “Status” == "CANCELLED") and “Status” != previous “Status”: **Starts a process** — “repairEstimateWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Repair estimate follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “repairEstimateWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Repair estimate completion confirmed”).

![The Repair estimate workflows after update rule in the editor](/img/rules/repair-estimate-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

