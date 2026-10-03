---
title: "Supplier Credit Note Application"
sidebar_position: 22
description: "The business rules that run on Supplier Credit Note Application."
---

# Rules on Supplier Credit Note Application

## Supplier credit note application invariants before create

Runs before a supplier credit note application is created; order 100. In **Business Rules** it is listed as `supplierCreditNoteApplicationInvariantsBeforeCreate`.

- **When** “Invoice Amount” is filled in and “Invoice Amount” < 0: **Refuses the save** — “Invoice Amount cannot be negative.”.

![The Supplier credit note application invariants before create rule in the editor](/img/rules/supplier-credit-note-application-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier credit note application invariants before update

Runs before a supplier credit note application is changed; order 100. In **Business Rules** it is listed as `supplierCreditNoteApplicationInvariantsBeforeUpdate`.

- **When** “Invoice Amount” is filled in and “Invoice Amount” < 0: **Refuses the save** — “Invoice Amount cannot be negative.”.

![The Supplier credit note application invariants before update rule in the editor](/img/rules/supplier-credit-note-application-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier credit note application workflows after update

Runs after a supplier credit note application is changed; order 100. In **Business Rules** it is listed as `supplierCreditNoteApplicationWorkflowsAfterUpdate`.

- **When** (“Status” == "CANCELLED" or “Status” == "REVERSED") and “Status” != previous “Status”: **Starts a process** — “supplierCreditNoteApplicationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier credit note application follow up required”).

![The Supplier credit note application workflows after update rule in the editor](/img/rules/supplier-credit-note-application-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

