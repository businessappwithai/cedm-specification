---
title: "Contract"
sidebar_position: 3
description: "The business rules that run on Contract."
---

# Rules on Contract

## Contract invariants before create

Runs before a contract is created; order 100. In **Business Rules** it is listed as `contractInvariantsBeforeCreate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.

![The Contract invariants before create rule in the editor](/img/rules/contract-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Contract invariants before update

Runs before a contract is changed; order 100. In **Business Rules** it is listed as `contractInvariantsBeforeUpdate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.

![The Contract invariants before update rule in the editor](/img/rules/contract-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Contract workflows after update

Runs after a contract is changed; order 100. In **Business Rules** it is listed as `contractWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “contractWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Contract follow up required”).

![The Contract workflows after update rule in the editor](/img/rules/contract-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

