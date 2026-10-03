---
title: "Budget"
sidebar_position: 7
description: "The business rules that run on Budget."
---

# Rules on Budget

## Budget line invariants before create

Runs before a budget is created; order 100. In **Business Rules** it is listed as `budgetLineInvariantsBeforeCreate`.

- **When** “Amount” is filled in and “Amount” < 0: **Refuses the save** — “Amount cannot be negative.”.

![The Budget line invariants before create rule in the editor](/img/rules/budget-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Budget line invariants before update

Runs before a budget is changed; order 100. In **Business Rules** it is listed as `budgetLineInvariantsBeforeUpdate`.

- **When** “Amount” is filled in and “Amount” < 0: **Refuses the save** — “Amount cannot be negative.”.

![The Budget line invariants before update rule in the editor](/img/rules/budget-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

