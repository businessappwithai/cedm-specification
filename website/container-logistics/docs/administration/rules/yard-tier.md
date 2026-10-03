---
title: "Yard Bay"
sidebar_position: 10
description: "The business rules that run on Yard Bay."
---

# Rules on Yard Bay

## Yard tier workflows after update

Runs after a yard bay is changed; order 100. In **Business Rules** it is listed as `yardTierWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “yardTierWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Yard tier exception raised”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

