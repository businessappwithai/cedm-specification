---
title: "Hotel Reservation"
sidebar_position: 4
description: "The business rules that run on Hotel Reservation."
---

# Rules on Hotel Reservation

## Hotel reservation workflows after update

Runs after a hotel reservation is changed; order 100. In **Business Rules** it is listed as `hotelReservationWorkflowsAfterUpdate`.

- **When** “Status” == "REQUESTED" and “Status” != previous “Status”: **Starts a process** — “hotelReservationWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Hotel reservation approval requested”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “hotelReservationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Hotel reservation follow up required”).

![The Hotel reservation workflows after update rule in the editor](/img/rules/hotel-reservation-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

