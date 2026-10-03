---
title: "Payment Term"
sidebar_position: 8
description: "The business rules that run on Payment Term."
---

# Rules on Payment Term

## Payment term invariants before create

Runs before a payment term is created; order 100. In **Business Rules** it is listed as `paymentTermInvariantsBeforeCreate`.

- **When** “Discount Percent” is filled in and (“Discount Percent” < 0 or “Discount Percent” > 100): **Refuses the save** — “Discount Percent must be between 0 and 100.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Payment term invariants before update

Runs before a payment term is changed; order 100. In **Business Rules** it is listed as `paymentTermInvariantsBeforeUpdate`.

- **When** “Discount Percent” is filled in and (“Discount Percent” < 0 or “Discount Percent” > 100): **Refuses the save** — “Discount Percent must be between 0 and 100.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

