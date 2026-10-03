---
title: "Business Transaction"
sidebar_position: 4
description: "The business rules that run on Business Transaction."
---

# Rules on Business Transaction

## Business transaction invariants before create

Runs before a business transaction is created; order 100. In **Business Rules** it is listed as `businessTransactionInvariantsBeforeCreate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Business transaction invariants before create rule in the editor](/img/rules/business-transaction-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Business transaction invariants before update

Runs before a business transaction is changed; order 100. In **Business Rules** it is listed as `businessTransactionInvariantsBeforeUpdate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Business transaction invariants before update rule in the editor](/img/rules/business-transaction-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Business transaction workflows after update

Runs after a business transaction is changed; order 100. In **Business Rules** it is listed as `businessTransactionWorkflowsAfterUpdate`.

- **When** (“Status” == "CANCELLED" or “Status” == "REVERSED") and “Status” != previous “Status”: **Starts a process** — “businessTransactionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Business transaction follow up required”).
- **When** (“Status” == "COMPLETED" or “Status” == "POSTED") and “Status” != previous “Status”: **Starts a process** — “businessTransactionWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Business transaction completion confirmed”).

![The Business transaction workflows after update rule in the editor](/img/rules/business-transaction-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

