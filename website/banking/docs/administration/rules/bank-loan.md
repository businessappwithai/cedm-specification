---
title: "Bank Loan"
sidebar_position: 4
description: "The business rules that run on Bank Loan."
---

# Rules on Bank Loan

## Bank loan invariants before create

Runs before a bank loan is created; order 100. In **Business Rules** it is listed as `bankLoanInvariantsBeforeCreate`.

- **When** “Principal Amount” is filled in and “Principal Amount” < 0: **Refuses the save** — “Principal Amount cannot be negative.”.

![The Bank loan invariants before create rule in the editor](/img/rules/bank-loan-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Bank loan invariants before update

Runs before a bank loan is changed; order 100. In **Business Rules** it is listed as `bankLoanInvariantsBeforeUpdate`.

- **When** “Principal Amount” is filled in and “Principal Amount” < 0: **Refuses the save** — “Principal Amount cannot be negative.”.

![The Bank loan invariants before update rule in the editor](/img/rules/bank-loan-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Bank loan workflows after update

Runs after a bank loan is changed; order 100. In **Business Rules** it is listed as `bankLoanWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “bankLoanWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Bank loan follow up required”).

![The Bank loan workflows after update rule in the editor](/img/rules/bank-loan-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

