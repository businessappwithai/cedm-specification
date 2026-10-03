---
title: "Care Plan"
sidebar_position: 3
description: "The business rules that run on Care Plan."
---

# Rules on Care Plan

## Care plan workflows after update

Runs after a care plan is changed; order 100. In **Business Rules** it is listed as `carePlanWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “carePlanWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Care plan follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

