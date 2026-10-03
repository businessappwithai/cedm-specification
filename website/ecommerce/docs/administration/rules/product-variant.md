---
title: "Product"
sidebar_position: 7
description: "The business rules that run on Product."
---

# Rules on Product

## Product variant workflows after update

Runs after a product is changed; order 100. In **Business Rules** it is listed as `productVariantWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “productVariantWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Product variant exception raised”).

![The Product variant workflows after update rule in the editor](/img/rules/product-variant-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

