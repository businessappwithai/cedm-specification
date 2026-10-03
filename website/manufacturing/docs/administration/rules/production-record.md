---
title: "Production Record"
sidebar_position: 13
description: "The business rules that run on Production Record."
---

# Rules on Production Record

## Production record invariants before create

Runs before a production record is created; order 100. In **Business Rules** it is listed as `productionRecordInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Production record invariants before create rule in the editor](/img/rules/production-record-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Production record invariants before update

Runs before a production record is changed; order 100. In **Business Rules** it is listed as `productionRecordInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Production record invariants before update rule in the editor](/img/rules/production-record-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Production record workflows after update

Runs after a production record is changed; order 100. In **Business Rules** it is listed as `productionRecordWorkflowsAfterUpdate`.

- **When** “Status” == "REJECTED" and “Status” != previous “Status”: **Starts a process** — “productionRecordWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Production record follow up required”).

![The Production record workflows after update rule in the editor](/img/rules/production-record-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

