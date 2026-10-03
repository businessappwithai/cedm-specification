---
title: "Supplier Quotation"
sidebar_position: 27
description: "The business rules that run on Supplier Quotation."
---

# Rules on Supplier Quotation

## Supplier quotation invariants before create

Runs before a supplier quotation is created; order 100. In **Business Rules** it is listed as `supplierQuotationInvariantsBeforeCreate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Supplier quotation invariants before create rule in the editor](/img/rules/supplier-quotation-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier quotation invariants before update

Runs before a supplier quotation is changed; order 100. In **Business Rules** it is listed as `supplierQuotationInvariantsBeforeUpdate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Supplier quotation invariants before update rule in the editor](/img/rules/supplier-quotation-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier quotation workflows after update

Runs after a supplier quotation is changed; order 100. In **Business Rules** it is listed as `supplierQuotationWorkflowsAfterUpdate`.

- **When** “Status” == "UNDER_REVIEW" and “Status” != previous “Status”: **Starts a process** — “supplierQuotationWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Supplier quotation approval requested”).
- **When** “Status” == "REJECTED" and “Status” != previous “Status”: **Starts a process** — “supplierQuotationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier quotation follow up required”).

![The Supplier quotation workflows after update rule in the editor](/img/rules/supplier-quotation-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

