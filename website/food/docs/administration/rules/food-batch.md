---
title: "Food Batch"
sidebar_position: 4
description: "The business rules that run on Food Batch."
---

# Rules on Food Batch

## Food batch workflows after update

Runs after a food batch is changed; order 100. In **Business Rules** it is listed as `foodBatchWorkflowsAfterUpdate`.

- **When** “Status” == "QUARANTINED" and “Status” != previous “Status”: **Starts a process** — “foodBatchWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Food batch exception raised”).
- **When** “Status” == "REJECTED" and “Status” != previous “Status”: **Starts a process** — “foodBatchWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Food batch follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

