---
title: "Renewal"
sidebar_position: 8
description: "The business rules that run on Renewal."
---

# Rules on Renewal

## Renewal workflows after update

Runs after a renewal is changed; order 100. In **Business Rules** it is listed as `renewalWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “renewalWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Renewal follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

