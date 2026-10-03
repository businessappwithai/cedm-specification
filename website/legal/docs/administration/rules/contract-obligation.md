---
title: "Contract"
sidebar_position: 4
description: "The business rules that run on Contract."
---

# Rules on Contract

## Contract obligation workflows after update

Runs after a contract is changed; order 100. In **Business Rules** it is listed as `contractObligationWorkflowsAfterUpdate`.

- **When** “Status” == "BREACHED" and “Status” != previous “Status”: **Starts a process** — “contractObligationWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Contract obligation exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “contractObligationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Contract obligation follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

