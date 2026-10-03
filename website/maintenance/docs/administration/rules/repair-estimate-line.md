---
title: "Repair Estimate"
sidebar_position: 11
description: "The business rules that run on Repair Estimate."
---

# Rules on Repair Estimate

## Repair estimate line invariants before create

Runs before a repair estimate is created; order 100. In **Business Rules** it is listed as `repairEstimateLineInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Material Amount” is filled in and “Material Amount” < 0: **Refuses the save** — “Material Amount cannot be negative.”.
- **When** “Labour Amount” is filled in and “Labour Amount” < 0: **Refuses the save** — “Labour Amount cannot be negative.”.
- **When** “Replacement Amount” is filled in and “Replacement Amount” < 0: **Refuses the save** — “Replacement Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Repair estimate line invariants before create rule in the editor](/img/rules/repair-estimate-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Repair estimate line invariants before update

Runs before a repair estimate is changed; order 100. In **Business Rules** it is listed as `repairEstimateLineInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Material Amount” is filled in and “Material Amount” < 0: **Refuses the save** — “Material Amount cannot be negative.”.
- **When** “Labour Amount” is filled in and “Labour Amount” < 0: **Refuses the save** — “Labour Amount cannot be negative.”.
- **When** “Replacement Amount” is filled in and “Replacement Amount” < 0: **Refuses the save** — “Replacement Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Repair estimate line invariants before update rule in the editor](/img/rules/repair-estimate-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

