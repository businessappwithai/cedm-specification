---
title: "Container Movement"
sidebar_position: 4
description: "The business rules that run on Container Movement."
---

# Rules on Container Movement

## Container movement invariants before create

Runs before a container movement is created; order 100. In **Business Rules** it is listed as `containerMovementInvariantsBeforeCreate`.

- **When** “Status” == "COMPLETED" and “Completed At” is empty: **Refuses the save** — “Record completed at when the container movement is completed.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Container movement invariants before update

Runs before a container movement is changed; order 100. In **Business Rules** it is listed as `containerMovementInvariantsBeforeUpdate`.

- **When** “Status” == "COMPLETED" and “Completed At” is empty: **Refuses the save** — “Record completed at when the container movement is completed.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Container movement workflows after update

Runs after a container movement is changed; order 100. In **Business Rules** it is listed as `containerMovementWorkflowsAfterUpdate`.

- **When** “Status” == "FAILED" and “Status” != previous “Status”: **Starts a process** — “containerMovementWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Container movement exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “containerMovementWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Container movement follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “containerMovementWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Container movement completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

