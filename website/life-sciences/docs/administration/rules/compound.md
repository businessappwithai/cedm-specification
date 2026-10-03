---
title: "Compound"
sidebar_position: 4
description: "The business rules that run on Compound."
---

# Rules on Compound

## Compound invariants before create

Runs before a compound is created; order 100. In **Business Rules** it is listed as `compoundInvariantsBeforeCreate`.

- **When** “Molecular Weight” is filled in and “Molecular Weight” < 0: **Refuses the save** — “Molecular Weight cannot be negative.”.

![The Compound invariants before create rule in the editor](/img/rules/compound-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Compound invariants before update

Runs before a compound is changed; order 100. In **Business Rules** it is listed as `compoundInvariantsBeforeUpdate`.

- **When** “Molecular Weight” is filled in and “Molecular Weight” < 0: **Refuses the save** — “Molecular Weight cannot be negative.”.

![The Compound invariants before update rule in the editor](/img/rules/compound-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

