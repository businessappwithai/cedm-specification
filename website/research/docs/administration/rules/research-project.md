---
title: "Research Project"
sidebar_position: 6
description: "The business rules that run on Research Project."
---

# Rules on Research Project

## Research project workflows after update

Runs after a research project is changed; order 100. In **Business Rules** it is listed as `researchProjectWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “researchProjectWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Research project follow up required”).

![The Research project workflows after update rule in the editor](/img/rules/research-project-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

