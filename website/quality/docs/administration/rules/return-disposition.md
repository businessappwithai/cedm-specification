---
title: "Return Disposition"
sidebar_position: 12
description: "The business rules that run on Return Disposition."
---

# Rules on Return Disposition

## Return disposition invariants before create

Runs before a return disposition is created; order 100. In **Business Rules** it is listed as `returnDispositionInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Return disposition invariants before create rule in the editor](/img/rules/return-disposition-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Return disposition invariants before update

Runs before a return disposition is changed; order 100. In **Business Rules** it is listed as `returnDispositionInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Return disposition invariants before update rule in the editor](/img/rules/return-disposition-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Return disposition workflows after update

Runs after a return disposition is changed; order 100. In **Business Rules** it is listed as `returnDispositionWorkflowsAfterUpdate`.

- **When** “Status” == "EXCEPTION" and “Status” != previous “Status”: **Starts a process** — “returnDispositionWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Return disposition exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “returnDispositionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Return disposition follow up required”).

![The Return disposition workflows after update rule in the editor](/img/rules/return-disposition-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

