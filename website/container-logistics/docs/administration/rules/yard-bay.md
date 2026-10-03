---
title: "Yard Block"
sidebar_position: 11
description: "The business rules that run on Yard Block."
---

# Rules on Yard Block

## Yard bay workflows after update

Runs after a yard block is changed; order 100. In **Business Rules** it is listed as `yardBayWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “yardBayWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Yard bay exception raised”).

![The Yard bay workflows after update rule in the editor](/img/rules/yard-bay-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

