---
title: "Healthcare Encounter"
sidebar_position: 7
description: "The business rules that run on Healthcare Encounter."
---

# Rules on Healthcare Encounter

## Procedure workflows after update

Runs after a healthcare encounter is changed; order 100. In **Business Rules** it is listed as `procedureWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “procedureWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Procedure follow up required”).

![The Procedure workflows after update rule in the editor](/img/rules/procedure-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

