---
title: "Credit Note Application"
sidebar_position: 12
description: "The business rules that run on Credit Note Application."
---

# Rules on Credit Note Application

## Credit note application invariants before create

Runs before a credit note application is created; order 100. In **Business Rules** it is listed as `creditNoteApplicationInvariantsBeforeCreate`.

- **When** “Invoice Amount” is filled in and “Invoice Amount” < 0: **Refuses the save** — “Invoice Amount cannot be negative.”.

![The Credit note application invariants before create rule in the editor](/img/rules/credit-note-application-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Credit note application invariants before update

Runs before a credit note application is changed; order 100. In **Business Rules** it is listed as `creditNoteApplicationInvariantsBeforeUpdate`.

- **When** “Invoice Amount” is filled in and “Invoice Amount” < 0: **Refuses the save** — “Invoice Amount cannot be negative.”.

![The Credit note application invariants before update rule in the editor](/img/rules/credit-note-application-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Credit note application workflows after update

Runs after a credit note application is changed; order 100. In **Business Rules** it is listed as `creditNoteApplicationWorkflowsAfterUpdate`.

- **When** (“Status” == "CANCELLED" or “Status” == "REVERSED") and “Status” != previous “Status”: **Starts a process** — “creditNoteApplicationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Credit note application follow up required”).

![The Credit note application workflows after update rule in the editor](/img/rules/credit-note-application-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

