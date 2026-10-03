---
title: "Process Definition"
sidebar_position: 7
description: "The business rules that run on Process Definition."
---

# Rules on Process Definition

## Process definition workflows after update

Runs after a process definition is changed; order 100. In **Business Rules** it is listed as `processDefinitionWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “processDefinitionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Process definition follow up required”).

![The Process definition workflows after update rule in the editor](/img/rules/process-definition-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

