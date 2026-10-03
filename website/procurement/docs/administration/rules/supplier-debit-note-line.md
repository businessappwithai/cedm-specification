---
title: "Supplier Debit Note"
sidebar_position: 24
description: "The business rules that run on Supplier Debit Note."
---

# Rules on Supplier Debit Note

## Supplier debit note line invariants before create

Runs before a supplier debit note is created; order 100. In **Business Rules** it is listed as `supplierDebitNoteLineInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Gross Amount” is filled in and “Gross Amount” < 0: **Refuses the save** — “Gross Amount cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.

![The Supplier debit note line invariants before create rule in the editor](/img/rules/supplier-debit-note-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier debit note line invariants before update

Runs before a supplier debit note is changed; order 100. In **Business Rules** it is listed as `supplierDebitNoteLineInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.
- **When** “Unit Price” is filled in and “Unit Price” < 0: **Refuses the save** — “Unit Price cannot be negative.”.
- **When** “Gross Amount” is filled in and “Gross Amount” < 0: **Refuses the save** — “Gross Amount cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.

![The Supplier debit note line invariants before update rule in the editor](/img/rules/supplier-debit-note-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

