---
title: "Nonconformance"
sidebar_position: 8
description: "The business rules that run on Nonconformance."
---

# Rules on Nonconformance

## Nonconformance invariants before create

Runs before a nonconformance is created; order 100. In **Business Rules** it is listed as `nonconformanceInvariantsBeforeCreate`.

- **When** “Status” == "CLOSED" and “Closed At” is empty: **Refuses the save** — “Record closed at when the nonconformance is closed.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Nonconformance invariants before update

Runs before a nonconformance is changed; order 100. In **Business Rules** it is listed as `nonconformanceInvariantsBeforeUpdate`.

- **When** “Status” == "CLOSED" and “Closed At” is empty: **Refuses the save** — “Record closed at when the nonconformance is closed.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Nonconformance workflows after update

Runs after a nonconformance is changed; order 100. In **Business Rules** it is listed as `nonconformanceWorkflowsAfterUpdate`.

- **When** “Status” == "UNDER_REVIEW" and “Status” != previous “Status”: **Starts a process** — “nonconformanceWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Nonconformance approval requested”).
- **When** “Status” == "REJECTED" and “Status” != previous “Status”: **Starts a process** — “nonconformanceWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Nonconformance follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

