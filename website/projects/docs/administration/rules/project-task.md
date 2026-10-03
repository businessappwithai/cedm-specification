---
title: "Project"
sidebar_position: 9
description: "The business rules that run on Project."
---

# Rules on Project

## Project task workflows after update

Runs after a project is changed; order 100. In **Business Rules** it is listed as `projectTaskWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “projectTaskWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Project task exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “projectTaskWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Project task follow up required”).

![The Project task workflows after update rule in the editor](/img/rules/project-task-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

