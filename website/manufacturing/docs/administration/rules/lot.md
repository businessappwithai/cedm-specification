---
title: "Lot"
sidebar_position: 6
description: "The business rules that run on Lot."
---

# Rules on Lot

## Lot workflows after update

Runs after a lot is changed; order 100. In **Business Rules** it is listed as `lotWorkflowsAfterUpdate`.

- **When** “Status” == "QUARANTINED" and “Status” != previous “Status”: **Starts a process** — “lotWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Lot exception raised”).
- **When** “Status” == "REJECTED" and “Status” != previous “Status”: **Starts a process** — “lotWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Lot follow up required”).

![The Lot workflows after update rule in the editor](/img/rules/lot-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

