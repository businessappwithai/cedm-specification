---
title: "Bill Of Material"
sidebar_position: 4
description: "The business rules that run on Bill Of Material."
---

# Rules on Bill Of Material

## B om component invariants before create

Runs before a bill of material is created; order 100. In **Business Rules** it is listed as `bOMComponentInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Scrap Percent” is filled in and (“Scrap Percent” < 0 or “Scrap Percent” > 100): **Refuses the save** — “Scrap Percent must be between 0 and 100.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## B om component invariants before update

Runs before a bill of material is changed; order 100. In **Business Rules** it is listed as `bOMComponentInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Scrap Percent” is filled in and (“Scrap Percent” < 0 or “Scrap Percent” > 100): **Refuses the save** — “Scrap Percent must be between 0 and 100.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

