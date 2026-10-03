---
title: "Quotation"
sidebar_position: 13
description: "The business rules that run on Quotation."
---

# Rules on Quotation

## Quotation line invariants before create

Runs before a quotation is created; order 100. In **Business Rules** it is listed as `quotationLineInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Amount” is filled in and “Amount” < 0: **Refuses the save** — “Amount cannot be negative.”.
- **When** “Discount Amount” is filled in and “Discount Amount” < 0: **Refuses the save** — “Discount Amount cannot be negative.”.

![The Quotation line invariants before create rule in the editor](/img/rules/quotation-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Quotation line invariants before update

Runs before a quotation is changed; order 100. In **Business Rules** it is listed as `quotationLineInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Amount” is filled in and “Amount” < 0: **Refuses the save** — “Amount cannot be negative.”.
- **When** “Discount Amount” is filled in and “Discount Amount” < 0: **Refuses the save** — “Discount Amount cannot be negative.”.

![The Quotation line invariants before update rule in the editor](/img/rules/quotation-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

