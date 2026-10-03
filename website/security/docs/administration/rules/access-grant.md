---
title: "Access Grant"
sidebar_position: 2
description: "The business rules that run on Access Grant."
---

# Rules on Access Grant

## Access grant workflows after update

Runs after a access grant is changed; order 100. In **Business Rules** it is listed as `accessGrantWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “accessGrantWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Access grant follow up required”).

![The Access grant workflows after update rule in the editor](/img/rules/access-grant-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

