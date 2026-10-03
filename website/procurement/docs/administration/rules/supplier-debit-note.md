---
title: "Supplier Debit Note"
sidebar_position: 23
description: "The business rules that run on Supplier Debit Note."
---

# Rules on Supplier Debit Note

## Supplier debit note invariants before create

Runs before a supplier debit note is created; order 100. In **Business Rules** it is listed as `supplierDebitNoteInvariantsBeforeCreate`.

- **When** “Subtotal” is filled in and “Subtotal” < 0: **Refuses the save** — “Subtotal cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier debit note invariants before update

Runs before a supplier debit note is changed; order 100. In **Business Rules** it is listed as `supplierDebitNoteInvariantsBeforeUpdate`.

- **When** “Subtotal” is filled in and “Subtotal” < 0: **Refuses the save** — “Subtotal cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier debit note workflows after update

Runs after a supplier debit note is changed; order 100. In **Business Rules** it is listed as `supplierDebitNoteWorkflowsAfterUpdate`.

- **When** (“Status” == "CANCELLED" or “Status” == "REVERSED") and “Status” != previous “Status”: **Starts a process** — “supplierDebitNoteWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier debit note follow up required”).
- **When** “Status” == "POSTED" and “Status” != previous “Status”: **Starts a process** — “supplierDebitNoteWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Supplier debit note completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

