---
title: "Project"
sidebar_position: 8
description: "The business rules that run on Project."
---

# Rules on Project

## Project phase workflows after update

Runs after a project is changed; order 100. In **Business Rules** it is listed as `projectPhaseWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “projectPhaseWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Project phase follow up required”).

![The Project phase workflows after update rule in the editor](/img/rules/project-phase-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

