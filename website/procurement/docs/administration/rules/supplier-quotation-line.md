---
title: "Supplier Quotation"
sidebar_position: 28
description: "The business rules that run on Supplier Quotation."
---

# Rules on Supplier Quotation

## Supplier quotation line invariants before create

Runs before a supplier quotation is created; order 100. In **Business Rules** it is listed as `supplierQuotationLineInvariantsBeforeCreate`.

- **When** “Offered Quantity” is filled in and “Offered Quantity” < 0: **Refuses the save** — “Offered Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.

![The Supplier quotation line invariants before create rule in the editor](/img/rules/supplier-quotation-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier quotation line invariants before update

Runs before a supplier quotation is changed; order 100. In **Business Rules** it is listed as `supplierQuotationLineInvariantsBeforeUpdate`.

- **When** “Offered Quantity” is filled in and “Offered Quantity” < 0: **Refuses the save** — “Offered Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.

![The Supplier quotation line invariants before update rule in the editor](/img/rules/supplier-quotation-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

