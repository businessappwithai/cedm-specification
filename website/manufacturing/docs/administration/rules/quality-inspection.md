---
title: "Quality Inspection"
sidebar_position: 14
description: "The business rules that run on Quality Inspection."
---

# Rules on Quality Inspection

## Quality inspection workflows after update

Runs after a quality inspection is changed; order 100. In **Business Rules** it is listed as `qualityInspectionWorkflowsAfterUpdate`.

- **When** “Status” == "FAILED" and “Status” != previous “Status”: **Starts a process** — “qualityInspectionWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Quality inspection exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “qualityInspectionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Quality inspection follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

