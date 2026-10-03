---
title: "Purchase Requisition"
sidebar_position: 13
description: "The business rules that run on Purchase Requisition."
---

# Rules on Purchase Requisition

## Purchase requisition line invariants before create

Runs before a purchase requisition is created; order 100. In **Business Rules** it is listed as `purchaseRequisitionLineInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Purchase requisition line invariants before update

Runs before a purchase requisition is changed; order 100. In **Business Rules** it is listed as `purchaseRequisitionLineInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

