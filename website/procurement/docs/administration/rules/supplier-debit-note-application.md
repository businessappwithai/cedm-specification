---
title: "Supplier Debit Note Application"
sidebar_position: 25
description: "The business rules that run on Supplier Debit Note Application."
---

# Rules on Supplier Debit Note Application

## Supplier debit note application invariants before create

Runs before a supplier debit note application is created; order 100. In **Business Rules** it is listed as `supplierDebitNoteApplicationInvariantsBeforeCreate`.

- **When** “Invoice Amount” is filled in and “Invoice Amount” < 0: **Refuses the save** — “Invoice Amount cannot be negative.”.

![The Supplier debit note application invariants before create rule in the editor](/img/rules/supplier-debit-note-application-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier debit note application invariants before update

Runs before a supplier debit note application is changed; order 100. In **Business Rules** it is listed as `supplierDebitNoteApplicationInvariantsBeforeUpdate`.

- **When** “Invoice Amount” is filled in and “Invoice Amount” < 0: **Refuses the save** — “Invoice Amount cannot be negative.”.

![The Supplier debit note application invariants before update rule in the editor](/img/rules/supplier-debit-note-application-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier debit note application workflows after update

Runs after a supplier debit note application is changed; order 100. In **Business Rules** it is listed as `supplierDebitNoteApplicationWorkflowsAfterUpdate`.

- **When** (“Status” == "CANCELLED" or “Status” == "REVERSED") and “Status” != previous “Status”: **Starts a process** — “supplierDebitNoteApplicationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier debit note application follow up required”).

![The Supplier debit note application workflows after update rule in the editor](/img/rules/supplier-debit-note-application-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

