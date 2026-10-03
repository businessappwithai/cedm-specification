---
title: "Energy Asset"
sidebar_position: 3
description: "The business rules that run on Energy Asset."
---

# Rules on Energy Asset

## Energy asset invariants before create

Runs before a energy asset is created; order 100. In **Business Rules** it is listed as `energyAssetInvariantsBeforeCreate`.

- **When** “Capacity” is filled in and “Capacity” < 0: **Refuses the save** — “Capacity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Energy asset invariants before update

Runs before a energy asset is changed; order 100. In **Business Rules** it is listed as `energyAssetInvariantsBeforeUpdate`.

- **When** “Capacity” is filled in and “Capacity” < 0: **Refuses the save** — “Capacity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

