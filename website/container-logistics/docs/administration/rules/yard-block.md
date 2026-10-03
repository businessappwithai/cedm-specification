---
title: "Yard"
sidebar_position: 9
description: "The business rules that run on Yard."
---

# Rules on Yard

## Yard block workflows after update

Runs after a yard is changed; order 100. In **Business Rules** it is listed as `yardBlockWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “yardBlockWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Yard block exception raised”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

