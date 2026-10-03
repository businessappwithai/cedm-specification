---
title: "Inventory Transfer"
sidebar_position: 6
description: "The business rules that run on Inventory Transfer."
---

# Rules on Inventory Transfer

## Inventory transfer invariants before create

Runs before a inventory transfer is created; order 100. In **Business Rules** it is listed as `inventoryTransferInvariantsBeforeCreate`.

- **When** “Requested Quantity” is filled in and “Requested Quantity” < 0: **Refuses the save** — “Requested Quantity cannot be negative.”.

![The Inventory transfer invariants before create rule in the editor](/img/rules/inventory-transfer-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Inventory transfer invariants before update

Runs before a inventory transfer is changed; order 100. In **Business Rules** it is listed as `inventoryTransferInvariantsBeforeUpdate`.

- **When** “Requested Quantity” is filled in and “Requested Quantity” < 0: **Refuses the save** — “Requested Quantity cannot be negative.”.

![The Inventory transfer invariants before update rule in the editor](/img/rules/inventory-transfer-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Inventory transfer workflows after update

Runs after a inventory transfer is changed; order 100. In **Business Rules** it is listed as `inventoryTransferWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “inventoryTransferWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Inventory transfer follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “inventoryTransferWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Inventory transfer completion confirmed”).

![The Inventory transfer workflows after update rule in the editor](/img/rules/inventory-transfer-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

