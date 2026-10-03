---
title: "Supplier Return"
sidebar_position: 29
description: "The business rules that run on Supplier Return."
---

# Rules on Supplier Return

## Supplier return workflows after update

Runs after a supplier return is changed; order 100. In **Business Rules** it is listed as `supplierReturnWorkflowsAfterUpdate`.

- **When** “Status” == "EXCEPTION" and “Status” != previous “Status”: **Starts a process** — “supplierReturnWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Supplier return exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “supplierReturnWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier return follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “supplierReturnWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Supplier return completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

