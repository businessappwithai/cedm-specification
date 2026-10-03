---
title: "Shipment"
sidebar_position: 11
description: "The business rules that run on Shipment."
---

# Rules on Shipment

## Shipment workflows after update

Runs after a shipment is changed; order 100. In **Business Rules** it is listed as `shipmentWorkflowsAfterUpdate`.

- **When** “Status” == "EXCEPTION" and “Status” != previous “Status”: **Starts a process** — “shipmentWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Shipment exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “shipmentWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Shipment follow up required”).
- **When** “Status” == "DELIVERED" and “Status” != previous “Status”: **Starts a process** — “shipmentWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Shipment completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

