---
title: "Corrective Action"
sidebar_position: 4
description: "The business rules that run on Corrective Action."
---

# Rules on Corrective Action

## Corrective action workflows after update

Runs after a corrective action is changed; order 100. In **Business Rules** it is listed as `correctiveActionWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “correctiveActionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Corrective action follow up required”).

![The Corrective action workflows after update rule in the editor](/img/rules/corrective-action-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

