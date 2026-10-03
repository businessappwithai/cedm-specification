---
title: "Telecom Subscription"
sidebar_position: 8
description: "The business rules that run on Telecom Subscription."
---

# Rules on Telecom Subscription

## Telecom subscription workflows after update

Runs after a telecom subscription is changed; order 100. In **Business Rules** it is listed as `telecomSubscriptionWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “telecomSubscriptionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Telecom subscription follow up required”).

![The Telecom subscription workflows after update rule in the editor](/img/rules/telecom-subscription-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

