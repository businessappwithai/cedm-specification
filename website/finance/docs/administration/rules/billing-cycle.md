---
title: "Billing Cycle"
sidebar_position: 6
description: "The business rules that run on Billing Cycle."
---

# Rules on Billing Cycle

## Billing cycle workflows after update

Runs after a billing cycle is changed; order 100. In **Business Rules** it is listed as `billingCycleWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “billingCycleWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Billing cycle follow up required”).

![The Billing cycle workflows after update rule in the editor](/img/rules/billing-cycle-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

