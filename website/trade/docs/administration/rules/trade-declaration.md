---
title: "Trade Declaration"
sidebar_position: 8
description: "The business rules that run on Trade Declaration."
---

# Rules on Trade Declaration

## Trade declaration workflows after update

Runs after a trade declaration is changed; order 100. In **Business Rules** it is listed as `tradeDeclarationWorkflowsAfterUpdate`.

- **When** (“Status” == "SUBMITTED" or “Status” == "UNDER_REVIEW") and “Status” != previous “Status”: **Starts a process** — “tradeDeclarationWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Trade declaration approval requested”).
- **When** (“Status” == "REJECTED" or “Status” == "CANCELLED") and “Status” != previous “Status”: **Starts a process** — “tradeDeclarationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Trade declaration follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

