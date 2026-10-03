---
title: "Party"
sidebar_position: 6
description: "The business rules that run on Party."
---

# Rules on Party

## Party workflows after update

Runs after a party is changed; order 100. In **Business Rules** it is listed as `partyWorkflowsAfterUpdate`.

- **When** “Status” == "BLOCKED" and “Status” != previous “Status”: **Starts a process** — “partyWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Party exception raised”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

