---
title: "Inventory Reservation"
sidebar_position: 5
description: "The business rules that run on Inventory Reservation."
---

# Rules on Inventory Reservation

## Inventory reservation workflows after update

Runs after a inventory reservation is changed; order 100. In **Business Rules** it is listed as `inventoryReservationWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “inventoryReservationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Inventory reservation follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

