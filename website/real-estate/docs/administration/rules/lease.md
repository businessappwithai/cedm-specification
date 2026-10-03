---
title: "Lease"
sidebar_position: 4
description: "The business rules that run on Lease."
---

# Rules on Lease

## Lease invariants before create

Runs before a lease is created; order 100. In **Business Rules** it is listed as `leaseInvariantsBeforeCreate`.

- **When** “Periodic Amount” is filled in and “Periodic Amount” < 0: **Refuses the save** — “Periodic Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Lease invariants before update

Runs before a lease is changed; order 100. In **Business Rules** it is listed as `leaseInvariantsBeforeUpdate`.

- **When** “Periodic Amount” is filled in and “Periodic Amount” < 0: **Refuses the save** — “Periodic Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Lease workflows after update

Runs after a lease is changed; order 100. In **Business Rules** it is listed as `leaseWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “leaseWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Lease follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

