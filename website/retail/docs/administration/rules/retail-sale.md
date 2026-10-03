---
title: "Retail Sale"
sidebar_position: 7
description: "The business rules that run on Retail Sale."
---

# Rules on Retail Sale

## Retail sale invariants before create

Runs before a retail sale is created; order 100. In **Business Rules** it is listed as `retailSaleInvariantsBeforeCreate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Retail sale invariants before create rule in the editor](/img/rules/retail-sale-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Retail sale invariants before update

Runs before a retail sale is changed; order 100. In **Business Rules** it is listed as `retailSaleInvariantsBeforeUpdate`.

- **When** “Total Amount” is filled in and “Total Amount” < 0: **Refuses the save** — “Total Amount cannot be negative.”.

![The Retail sale invariants before update rule in the editor](/img/rules/retail-sale-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Retail sale workflows after update

Runs after a retail sale is changed; order 100. In **Business Rules** it is listed as `retailSaleWorkflowsAfterUpdate`.

- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “retailSaleWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Retail sale completion confirmed”).

![The Retail sale workflows after update rule in the editor](/img/rules/retail-sale-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

