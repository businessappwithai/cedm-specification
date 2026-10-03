---
title: "Healthcare Encounter"
sidebar_position: 6
description: "The business rules that run on Healthcare Encounter."
---

# Rules on Healthcare Encounter

## Healthcare order workflows after update

Runs after a healthcare encounter is changed; order 100. In **Business Rules** it is listed as `healthcareOrderWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “healthcareOrderWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Healthcare order follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “healthcareOrderWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Healthcare order completion confirmed”).

![The Healthcare order workflows after update rule in the editor](/img/rules/healthcare-order-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

