---
title: "Supplier Claim"
sidebar_position: 18
description: "The business rules that run on Supplier Claim."
---

# Rules on Supplier Claim

## Supplier claim invariants before create

Runs before a supplier claim is created; order 100. In **Business Rules** it is listed as `supplierClaimInvariantsBeforeCreate`.

- **When** “Claimed Amount” is filled in and “Claimed Amount” < 0: **Refuses the save** — “Claimed Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier claim invariants before update

Runs before a supplier claim is changed; order 100. In **Business Rules** it is listed as `supplierClaimInvariantsBeforeUpdate`.

- **When** “Claimed Amount” is filled in and “Claimed Amount” < 0: **Refuses the save** — “Claimed Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier claim workflows after update

Runs after a supplier claim is changed; order 100. In **Business Rules** it is listed as `supplierClaimWorkflowsAfterUpdate`.

- **When** “Status” == "UNDER_REVIEW" and “Status” != previous “Status”: **Starts a process** — “supplierClaimWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Supplier claim approval requested”).
- **When** (“Status” == "REJECTED" or “Status” == "CANCELLED") and “Status” != previous “Status”: **Starts a process** — “supplierClaimWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier claim follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

