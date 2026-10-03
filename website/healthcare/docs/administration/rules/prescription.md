---
title: "Prescription"
sidebar_position: 11
description: "The business rules that run on Prescription."
---

# Rules on Prescription

## Prescription workflows after update

Runs after a prescription is changed; order 100. In **Business Rules** it is listed as `prescriptionWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “prescriptionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Prescription follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “prescriptionWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Prescription completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

