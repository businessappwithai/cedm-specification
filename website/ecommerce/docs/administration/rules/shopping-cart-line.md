---
title: "Shopping Cart"
sidebar_position: 8
description: "The business rules that run on Shopping Cart."
---

# Rules on Shopping Cart

## Shopping cart line invariants before create

Runs before a shopping cart is created; order 100. In **Business Rules** it is listed as `shoppingCartLineInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.

![The Shopping cart line invariants before create rule in the editor](/img/rules/shopping-cart-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Shopping cart line invariants before update

Runs before a shopping cart is changed; order 100. In **Business Rules** it is listed as `shoppingCartLineInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.

![The Shopping cart line invariants before update rule in the editor](/img/rules/shopping-cart-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

