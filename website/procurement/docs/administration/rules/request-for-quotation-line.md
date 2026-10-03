---
title: "Request For Quotation"
sidebar_position: 15
description: "The business rules that run on Request For Quotation."
---

# Rules on Request For Quotation

## Request for quotation line invariants before create

Runs before a request for quotation is created; order 100. In **Business Rules** it is listed as `requestForQuotationLineInvariantsBeforeCreate`.

- **When** “Requested Quantity” is filled in and “Requested Quantity” < 0: **Refuses the save** — “Requested Quantity cannot be negative.”.

![The Request for quotation line invariants before create rule in the editor](/img/rules/request-for-quotation-line-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Request for quotation line invariants before update

Runs before a request for quotation is changed; order 100. In **Business Rules** it is listed as `requestForQuotationLineInvariantsBeforeUpdate`.

- **When** “Requested Quantity” is filled in and “Requested Quantity” < 0: **Refuses the save** — “Requested Quantity cannot be negative.”.

![The Request for quotation line invariants before update rule in the editor](/img/rules/request-for-quotation-line-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

