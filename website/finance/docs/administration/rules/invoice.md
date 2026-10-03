---
title: "Invoice"
sidebar_position: 15
description: "The business rules that run on Invoice."
---

# Rules on Invoice

## Invoice invariants before create

Runs before a invoice is created; order 100. In **Business Rules** it is listed as `invoiceInvariantsBeforeCreate`.

- **When** “Subtotal” is filled in and “Subtotal” < 0: **Refuses the save** — “Subtotal cannot be negative.”.
- **When** “Discount Amount” is filled in and “Discount Amount” < 0: **Refuses the save** — “Discount Amount cannot be negative.”.
- **When** “Taxable Amount” is filled in and “Taxable Amount” < 0: **Refuses the save** — “Taxable Amount cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Invoice invariants before update

Runs before a invoice is changed; order 100. In **Business Rules** it is listed as `invoiceInvariantsBeforeUpdate`.

- **When** “Subtotal” is filled in and “Subtotal” < 0: **Refuses the save** — “Subtotal cannot be negative.”.
- **When** “Discount Amount” is filled in and “Discount Amount” < 0: **Refuses the save** — “Discount Amount cannot be negative.”.
- **When** “Taxable Amount” is filled in and “Taxable Amount” < 0: **Refuses the save** — “Taxable Amount cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Invoice workflows after update

Runs after a invoice is changed; order 100. In **Business Rules** it is listed as `invoiceWorkflowsAfterUpdate`.

- **When** “Status” == "OVERDUE" and “Status” != previous “Status”: **Starts a process** — “invoiceWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Invoice exception raised”).
- **When** (“Status” == "CANCELLED" or “Status” == "VOID") and “Status” != previous “Status”: **Starts a process** — “invoiceWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Invoice follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

