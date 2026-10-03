---
title: "Subscription"
sidebar_position: 29
description: "The business rules that run on Subscription."
---

# Rules on Subscription

## Subscription workflows after update

Runs after a subscription is changed; order 100. In **Business Rules** it is listed as `subscriptionWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “subscriptionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Subscription follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

