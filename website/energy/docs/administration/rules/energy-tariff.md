---
title: "Energy Tariff"
sidebar_position: 4
description: "The business rules that run on Energy Tariff."
---

# Rules on Energy Tariff

## Energy tariff invariants before create

Runs before a energy tariff is created; order 100. In **Business Rules** it is listed as `energyTariffInvariantsBeforeCreate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.

![The Energy tariff invariants before create rule in the editor](/img/rules/energy-tariff-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Energy tariff invariants before update

Runs before a energy tariff is changed; order 100. In **Business Rules** it is listed as `energyTariffInvariantsBeforeUpdate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.

![The Energy tariff invariants before update rule in the editor](/img/rules/energy-tariff-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

