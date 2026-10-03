---
title: "Supplier Credit Note"
sidebar_position: 20
description: "The business rules that run on Supplier Credit Note."
---

# Rules on Supplier Credit Note

## Supplier credit note invariants before create

Runs before a supplier credit note is created; order 100. In **Business Rules** it is listed as `supplierCreditNoteInvariantsBeforeCreate`.

- **When** “Subtotal” is filled in and “Subtotal” < 0: **Refuses the save** — “Subtotal cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Supplier credit note invariants before create rule in the editor](/img/rules/supplier-credit-note-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier credit note invariants before update

Runs before a supplier credit note is changed; order 100. In **Business Rules** it is listed as `supplierCreditNoteInvariantsBeforeUpdate`.

- **When** “Subtotal” is filled in and “Subtotal” < 0: **Refuses the save** — “Subtotal cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Supplier credit note invariants before update rule in the editor](/img/rules/supplier-credit-note-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier credit note workflows after update

Runs after a supplier credit note is changed; order 100. In **Business Rules** it is listed as `supplierCreditNoteWorkflowsAfterUpdate`.

- **When** (“Status” == "CANCELLED" or “Status” == "REVERSED") and “Status” != previous “Status”: **Starts a process** — “supplierCreditNoteWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier credit note follow up required”).
- **When** “Status” == "POSTED" and “Status” != previous “Status”: **Starts a process** — “supplierCreditNoteWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Supplier credit note completion confirmed”).

![The Supplier credit note workflows after update rule in the editor](/img/rules/supplier-credit-note-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

