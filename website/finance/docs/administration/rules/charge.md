---
title: "Charge"
sidebar_position: 9
description: "The business rules that run on Charge."
---

# Rules on Charge

## Charge workflows after update

Runs after a charge is changed; order 100. In **Business Rules** it is listed as `chargeWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “chargeWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Charge follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “chargeWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Charge completion confirmed”).

![The Charge workflows after update rule in the editor](/img/rules/charge-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

