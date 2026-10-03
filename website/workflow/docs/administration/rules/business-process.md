---
title: "Business Process"
sidebar_position: 3
description: "The business rules that run on Business Process."
---

# Rules on Business Process

## Business process invariants before create

Runs before a business process is created; order 100. In **Business Rules** it is listed as `businessProcessInvariantsBeforeCreate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.

![The Business process invariants before create rule in the editor](/img/rules/business-process-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Business process invariants before update

Runs before a business process is changed; order 100. In **Business Rules** it is listed as `businessProcessInvariantsBeforeUpdate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.

![The Business process invariants before update rule in the editor](/img/rules/business-process-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

