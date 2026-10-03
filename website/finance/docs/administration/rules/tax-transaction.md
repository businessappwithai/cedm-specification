---
title: "Tax Transaction"
sidebar_position: 38
description: "The business rules that run on Tax Transaction."
---

# Rules on Tax Transaction

## Tax transaction workflows after update

Runs after a tax transaction is changed; order 100. In **Business Rules** it is listed as `taxTransactionWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “taxTransactionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Tax transaction follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “taxTransactionWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Tax transaction completion confirmed”).

![The Tax transaction workflows after update rule in the editor](/img/rules/tax-transaction-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

