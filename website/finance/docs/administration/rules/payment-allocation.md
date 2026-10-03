---
title: "Payment"
sidebar_position: 22
description: "The business rules that run on Payment."
---

# Rules on Payment

## Payment allocation invariants before create

Runs before a payment is created; order 100. In **Business Rules** it is listed as `paymentAllocationInvariantsBeforeCreate`.

- **When** “Payment Amount” is filled in and “Payment Amount” < 0: **Refuses the save** — “Payment Amount cannot be negative.”.
- **When** “Invoice Amount” is filled in and “Invoice Amount” < 0: **Refuses the save** — “Invoice Amount cannot be negative.”.

![The Payment allocation invariants before create rule in the editor](/img/rules/payment-allocation-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Payment allocation invariants before update

Runs before a payment is changed; order 100. In **Business Rules** it is listed as `paymentAllocationInvariantsBeforeUpdate`.

- **When** “Payment Amount” is filled in and “Payment Amount” < 0: **Refuses the save** — “Payment Amount cannot be negative.”.
- **When** “Invoice Amount” is filled in and “Invoice Amount” < 0: **Refuses the save** — “Invoice Amount cannot be negative.”.

![The Payment allocation invariants before update rule in the editor](/img/rules/payment-allocation-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Payment allocation workflows after update

Runs after a payment is changed; order 100. In **Business Rules** it is listed as `paymentAllocationWorkflowsAfterUpdate`.

- **When** (“Status” == "CANCELLED" or “Status” == "REVERSED") and “Status” != previous “Status”: **Starts a process** — “paymentAllocationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Payment allocation follow up required”).

![The Payment allocation workflows after update rule in the editor](/img/rules/payment-allocation-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

