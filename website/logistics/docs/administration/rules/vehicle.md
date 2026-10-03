---
title: "Vehicle"
sidebar_position: 15
description: "The business rules that run on Vehicle."
---

# Rules on Vehicle

## Vehicle invariants before create

Runs before a vehicle is created; order 100. In **Business Rules** it is listed as `vehicleInvariantsBeforeCreate`.

- **When** “Capacity” is filled in and “Capacity” < 0: **Refuses the save** — “Capacity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Vehicle invariants before update

Runs before a vehicle is changed; order 100. In **Business Rules** it is listed as `vehicleInvariantsBeforeUpdate`.

- **When** “Capacity” is filled in and “Capacity” < 0: **Refuses the save** — “Capacity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

