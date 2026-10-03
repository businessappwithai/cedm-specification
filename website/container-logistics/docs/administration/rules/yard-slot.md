---
title: "Yard Tier"
sidebar_position: 12
description: "The business rules that run on Yard Tier."
---

# Rules on Yard Tier

## Yard slot workflows after update

Runs after a yard tier is changed; order 100. In **Business Rules** it is listed as `yardSlotWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “yardSlotWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Yard slot exception raised”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

