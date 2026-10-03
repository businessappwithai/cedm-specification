---
title: "Position"
sidebar_position: 7
description: "The business rules that run on Position."
---

# Rules on Position

## Position invariants before create

Runs before a position is created; order 100. In **Business Rules** it is listed as `positionInvariantsBeforeCreate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Position invariants before update

Runs before a position is changed; order 100. In **Business Rules** it is listed as `positionInvariantsBeforeUpdate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

