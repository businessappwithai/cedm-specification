---
title: "Bank Transaction"
sidebar_position: 5
description: "The business rules that run on Bank Transaction."
---

# Rules on Bank Transaction

## Bank transaction workflows after update

Runs after a bank transaction is changed; order 100. In **Business Rules** it is listed as `bankTransactionWorkflowsAfterUpdate`.

- **When** “Status” == "FAILED" and “Status” != previous “Status”: **Starts a process** — “bankTransactionWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Bank transaction exception raised”).
- **When** “Status” == "REVERSED" and “Status” != previous “Status”: **Starts a process** — “bankTransactionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Bank transaction follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

