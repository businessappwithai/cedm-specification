---
title: "AI Policy"
sidebar_position: 4
description: "The business rules that run on AI Policy."
---

# Rules on AI Policy

## A i policy workflows after update

Runs after a ai policy is changed; order 100. In **Business Rules** it is listed as `aIPolicyWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “aIPolicyWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Ai policy follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

