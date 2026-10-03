---
title: "Supplier"
sidebar_position: 17
description: "The business rules that run on Supplier."
---

# Rules on Supplier

## Supplier workflows after update

Runs after a supplier is changed; order 100. In **Business Rules** it is listed as `supplierWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “supplierWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Supplier exception raised”).

![The Supplier workflows after update rule in the editor](/img/rules/supplier-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

