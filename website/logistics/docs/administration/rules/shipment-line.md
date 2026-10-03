---
title: "Shipment"
sidebar_position: 10
description: "The business rules that run on Shipment."
---

# Rules on Shipment

## Shipment line invariants before create

Runs before a shipment is created; order 100. In **Business Rules** it is listed as `shipmentLineInvariantsBeforeCreate`.

- **When** “Planned Quantity” is filled in and “Planned Quantity” < 0: **Refuses the save** — “Planned Quantity cannot be negative.”.
- **When** “Dispatched Quantity” is filled in and “Dispatched Quantity” < 0: **Refuses the save** — “Dispatched Quantity cannot be negative.”.
- **When** “Delivered Quantity” is filled in and “Delivered Quantity” < 0: **Refuses the save** — “Delivered Quantity cannot be negative.”.

![The Shipment line invariants before create rule in the editor](/img/rules/shipment-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Shipment line invariants before update

Runs before a shipment is changed; order 100. In **Business Rules** it is listed as `shipmentLineInvariantsBeforeUpdate`.

- **When** “Planned Quantity” is filled in and “Planned Quantity” < 0: **Refuses the save** — “Planned Quantity cannot be negative.”.
- **When** “Dispatched Quantity” is filled in and “Dispatched Quantity” < 0: **Refuses the save** — “Dispatched Quantity cannot be negative.”.
- **When** “Delivered Quantity” is filled in and “Delivered Quantity” < 0: **Refuses the save** — “Delivered Quantity cannot be negative.”.

![The Shipment line invariants before update rule in the editor](/img/rules/shipment-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

