---
title: "Chemical Batch"
sidebar_position: 3
description: "The business rules that run on Chemical Batch."
---

# Rules on Chemical Batch

## Chemical batch workflows after update

Runs after a chemical batch is changed; order 100. In **Business Rules** it is listed as `chemicalBatchWorkflowsAfterUpdate`.

- **When** “Status” == "QUARANTINED" and “Status” != previous “Status”: **Starts a process** — “chemicalBatchWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Chemical batch exception raised”).
- **When** “Status” == "REJECTED" and “Status” != previous “Status”: **Starts a process** — “chemicalBatchWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Chemical batch follow up required”).

![The Chemical batch workflows after update rule in the editor](/img/rules/chemical-batch-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

