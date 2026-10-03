---
title: "Quotation"
sidebar_position: 12
description: "The business rules that run on Quotation."
---

# Rules on Quotation

## Quotation invariants before create

Runs before a quotation is created; order 100. In **Business Rules** it is listed as `quotationInvariantsBeforeCreate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Quotation invariants before update

Runs before a quotation is changed; order 100. In **Business Rules** it is listed as `quotationInvariantsBeforeUpdate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Quotation workflows after update

Runs after a quotation is changed; order 100. In **Business Rules** it is listed as `quotationWorkflowsAfterUpdate`.

- **When** “Status” == "SUBMITTED" and “Status” != previous “Status”: **Starts a process** — “quotationWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Quotation approval requested”).
- **When** (“Status” == "REJECTED" or “Status” == "CANCELLED") and “Status” != previous “Status”: **Starts a process** — “quotationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Quotation follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

