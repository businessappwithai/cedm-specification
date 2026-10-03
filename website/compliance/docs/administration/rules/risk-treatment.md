---
title: "Risk"
sidebar_position: 7
description: "The business rules that run on Risk."
---

# Rules on Risk

## Risk treatment workflows after update

Runs after a risk is changed; order 100. In **Business Rules** it is listed as `riskTreatmentWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “riskTreatmentWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Risk treatment follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

