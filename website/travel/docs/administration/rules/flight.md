---
title: "Flight"
sidebar_position: 4
description: "The business rules that run on Flight."
---

# Rules on Flight

## Flight workflows after update

Runs after a flight is changed; order 100. In **Business Rules** it is listed as `flightWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “flightWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Flight follow up required”).

![The Flight workflows after update rule in the editor](/img/rules/flight-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

