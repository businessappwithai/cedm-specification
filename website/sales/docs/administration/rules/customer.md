---
title: "Customer"
sidebar_position: 3
description: "The business rules that run on Customer."
---

# Rules on Customer

## Customer workflows after update

Runs after a customer is changed; order 100. In **Business Rules** it is listed as `customerWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “customerWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Customer exception raised”).

![The Customer workflows after update rule in the editor](/img/rules/customer-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

