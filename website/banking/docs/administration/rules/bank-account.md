---
title: "Bank Account"
sidebar_position: 3
description: "The business rules that run on Bank Account."
---

# Rules on Bank Account

## Bank account workflows after update

Runs after a bank account is changed; order 100. In **Business Rules** it is listed as `bankAccountWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “bankAccountWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Bank account exception raised”).

![The Bank account workflows after update rule in the editor](/img/rules/bank-account-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

