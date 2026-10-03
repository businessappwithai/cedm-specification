---
title: "Customer Return"
sidebar_position: 4
description: "The business rules that run on Customer Return."
---

# Rules on Customer Return

## Customer return workflows after update

Runs after a customer return is changed; order 100. In **Business Rules** it is listed as `customerReturnWorkflowsAfterUpdate`.

- **When** “Status” == "EXCEPTION" and “Status” != previous “Status”: **Starts a process** — “customerReturnWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Customer return exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “customerReturnWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Customer return follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “customerReturnWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Customer return completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

