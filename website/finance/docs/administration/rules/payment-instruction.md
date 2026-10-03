---
title: "Payment Instruction"
sidebar_position: 23
description: "The business rules that run on Payment Instruction."
---

# Rules on Payment Instruction

## Payment instruction workflows after update

Runs after a payment instruction is changed; order 100. In **Business Rules** it is listed as `paymentInstructionWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “paymentInstructionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Payment instruction follow up required”).

![The Payment instruction workflows after update rule in the editor](/img/rules/payment-instruction-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

