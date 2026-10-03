---
title: "Healthcare Encounter"
sidebar_position: 5
description: "The business rules that run on Healthcare Encounter."
---

# Rules on Healthcare Encounter

## Healthcare encounter workflows after update

Runs after a healthcare encounter is changed; order 100. In **Business Rules** it is listed as `healthcareEncounterWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “healthcareEncounterWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Healthcare encounter follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “healthcareEncounterWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Healthcare encounter completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

