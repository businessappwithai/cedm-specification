---
title: "Maintenance Work Order"
sidebar_position: 6
description: "The business rules that run on Maintenance Work Order."
---

# Rules on Maintenance Work Order

## Maintenance work order invariants before create

Runs before a maintenance work order is created; order 100. In **Business Rules** it is listed as `maintenanceWorkOrderInvariantsBeforeCreate`.

- **When** “Status” == "COMPLETED" and “Completed At” is empty: **Refuses the save** — “Record completed at when the maintenance work order is completed.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Maintenance work order invariants before update

Runs before a maintenance work order is changed; order 100. In **Business Rules** it is listed as `maintenanceWorkOrderInvariantsBeforeUpdate`.

- **When** “Status” == "COMPLETED" and “Completed At” is empty: **Refuses the save** — “Record completed at when the maintenance work order is completed.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Maintenance work order workflows after update

Runs after a maintenance work order is changed; order 100. In **Business Rules** it is listed as `maintenanceWorkOrderWorkflowsAfterUpdate`.

- **When** “Status” == "ON_HOLD" and “Status” != previous “Status”: **Starts a process** — “maintenanceWorkOrderWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Maintenance work order exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “maintenanceWorkOrderWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Maintenance work order follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “maintenanceWorkOrderWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Maintenance work order completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

