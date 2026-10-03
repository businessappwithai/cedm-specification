---
title: "Tax Rule"
sidebar_position: 37
description: "The business rules that run on Tax Rule."
---

# Rules on Tax Rule

## Tax rule invariants before create

Runs before a tax rule is created; order 100. In **Business Rules** it is listed as `taxRuleInvariantsBeforeCreate`.

- **When** “Valid From” is filled in and “Valid To” is filled in and “Valid To” < “Valid From”: **Refuses the save** — “Valid To cannot be earlier than valid from.”.

![The Tax rule invariants before create rule in the editor](/img/rules/tax-rule-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Tax rule invariants before update

Runs before a tax rule is changed; order 100. In **Business Rules** it is listed as `taxRuleInvariantsBeforeUpdate`.

- **When** “Valid From” is filled in and “Valid To” is filled in and “Valid To” < “Valid From”: **Refuses the save** — “Valid To cannot be earlier than valid from.”.

![The Tax rule invariants before update rule in the editor](/img/rules/tax-rule-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

