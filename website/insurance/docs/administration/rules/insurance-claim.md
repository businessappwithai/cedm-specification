---
title: "Insurance Claim"
sidebar_position: 4
description: "The business rules that run on Insurance Claim."
---

# Rules on Insurance Claim

## Insurance claim invariants before create

Runs before a insurance claim is created; order 100. In **Business Rules** it is listed as `insuranceClaimInvariantsBeforeCreate`.

- **When** “Claimed Amount” is filled in and “Claimed Amount” < 0: **Refuses the save** — “Claimed Amount cannot be negative.”.
- **When** “Approved Amount” is filled in and “Approved Amount” < 0: **Refuses the save** — “Approved Amount cannot be negative.”.

![The Insurance claim invariants before create rule in the editor](/img/rules/insurance-claim-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Insurance claim invariants before update

Runs before a insurance claim is changed; order 100. In **Business Rules** it is listed as `insuranceClaimInvariantsBeforeUpdate`.

- **When** “Claimed Amount” is filled in and “Claimed Amount” < 0: **Refuses the save** — “Claimed Amount cannot be negative.”.
- **When** “Approved Amount” is filled in and “Approved Amount” < 0: **Refuses the save** — “Approved Amount cannot be negative.”.

![The Insurance claim invariants before update rule in the editor](/img/rules/insurance-claim-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Insurance claim workflows after update

Runs after a insurance claim is changed; order 100. In **Business Rules** it is listed as `insuranceClaimWorkflowsAfterUpdate`.

- **When** “Status” == "UNDER_REVIEW" and “Status” != previous “Status”: **Starts a process** — “insuranceClaimWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Insurance claim approval requested”).
- **When** “Status” == "DENIED" and “Status” != previous “Status”: **Starts a process** — “insuranceClaimWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Insurance claim follow up required”).

![The Insurance claim workflows after update rule in the editor](/img/rules/insurance-claim-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

