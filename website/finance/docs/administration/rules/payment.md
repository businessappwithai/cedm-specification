---
title: "Payment"
sidebar_position: 21
description: "The business rules that run on Payment."
---

# Rules on Payment

## Payment invariants before create

Runs before a payment is created; order 100. In **Business Rules** it is listed as `paymentInvariantsBeforeCreate`.

- **When** “Amount” is filled in and “Amount” < 0: **Refuses the save** — “Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Payment invariants before update

Runs before a payment is changed; order 100. In **Business Rules** it is listed as `paymentInvariantsBeforeUpdate`.

- **When** “Amount” is filled in and “Amount” < 0: **Refuses the save** — “Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Payment workflows after update

Runs after a payment is changed; order 100. In **Business Rules** it is listed as `paymentWorkflowsAfterUpdate`.

- **When** (“Status” == "VOID" or “Status” == "REVERSED") and “Status” != previous “Status”: **Starts a process** — “paymentWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Payment follow up required”).
- **When** “Status” == "POSTED" and “Status” != previous “Status”: **Starts a process** — “paymentWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Payment completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

