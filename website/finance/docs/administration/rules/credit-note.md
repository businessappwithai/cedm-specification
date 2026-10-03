---
title: "Credit Note"
sidebar_position: 10
description: "The business rules that run on Credit Note."
---

# Rules on Credit Note

## Credit note invariants before create

Runs before a credit note is created; order 100. In **Business Rules** it is listed as `creditNoteInvariantsBeforeCreate`.

- **When** “Subtotal” is filled in and “Subtotal” < 0: **Refuses the save** — “Subtotal cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Credit note invariants before update

Runs before a credit note is changed; order 100. In **Business Rules** it is listed as `creditNoteInvariantsBeforeUpdate`.

- **When** “Subtotal” is filled in and “Subtotal” < 0: **Refuses the save** — “Subtotal cannot be negative.”.
- **When** “Tax Amount” is filled in and “Tax Amount” < 0: **Refuses the save** — “Tax Amount cannot be negative.”.
- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Credit note workflows after update

Runs after a credit note is changed; order 100. In **Business Rules** it is listed as `creditNoteWorkflowsAfterUpdate`.

- **When** (“Status” == "CANCELLED" or “Status” == "REVERSED") and “Status” != previous “Status”: **Starts a process** — “creditNoteWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Credit note follow up required”).
- **When** “Status” == "POSTED" and “Status” != previous “Status”: **Starts a process** — “creditNoteWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Credit note completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

