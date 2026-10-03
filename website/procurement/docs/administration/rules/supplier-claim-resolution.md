---
title: "Supplier Claim Resolution"
sidebar_position: 19
description: "The business rules that run on Supplier Claim Resolution."
---

# Rules on Supplier Claim Resolution

## Supplier claim resolution invariants before create

Runs before a supplier claim resolution is created; order 100. In **Business Rules** it is listed as `supplierClaimResolutionInvariantsBeforeCreate`.

- **When** “Approved Amount” is filled in and “Approved Amount” < 0: **Refuses the save** — “Approved Amount cannot be negative.”.

![The Supplier claim resolution invariants before create rule in the editor](/img/rules/supplier-claim-resolution-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier claim resolution invariants before update

Runs before a supplier claim resolution is changed; order 100. In **Business Rules** it is listed as `supplierClaimResolutionInvariantsBeforeUpdate`.

- **When** “Approved Amount” is filled in and “Approved Amount” < 0: **Refuses the save** — “Approved Amount cannot be negative.”.

![The Supplier claim resolution invariants before update rule in the editor](/img/rules/supplier-claim-resolution-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier claim resolution workflows after update

Runs after a supplier claim resolution is changed; order 100. In **Business Rules** it is listed as `supplierClaimResolutionWorkflowsAfterUpdate`.

- **When** “Status” == "FAILED" and “Status” != previous “Status”: **Starts a process** — “supplierClaimResolutionWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Supplier claim resolution exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “supplierClaimResolutionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier claim resolution follow up required”).

![The Supplier claim resolution workflows after update rule in the editor](/img/rules/supplier-claim-resolution-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

