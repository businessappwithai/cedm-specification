---
title: "Supplier Credit Note"
sidebar_position: 21
description: "The business rules that run on Supplier Credit Note."
---

# Rules on Supplier Credit Note

## Supplier credit note line invariants before create

Runs before a supplier credit note is created; order 100. In **Business Rules** it is listed as `supplierCreditNoteLineInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Gross Amount” is filled in and “Gross Amount” < 0: **Refuses the save** — “Gross Amount cannot be negative.”.
- **When** “Discount Amount” is filled in and “Discount Amount” < 0: **Refuses the save** — “Discount Amount cannot be negative.”.
- **When** “Taxable Amount” is filled in and “Taxable Amount” < 0: **Refuses the save** — “Taxable Amount cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier credit note line invariants before update

Runs before a supplier credit note is changed; order 100. In **Business Rules** it is listed as `supplierCreditNoteLineInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Gross Amount” is filled in and “Gross Amount” < 0: **Refuses the save** — “Gross Amount cannot be negative.”.
- **When** “Discount Amount” is filled in and “Discount Amount” < 0: **Refuses the save** — “Discount Amount cannot be negative.”.
- **When** “Taxable Amount” is filled in and “Taxable Amount” < 0: **Refuses the save** — “Taxable Amount cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

