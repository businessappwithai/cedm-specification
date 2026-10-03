---
title: "Tax Rate"
sidebar_position: 35
description: "The business rules that run on Tax Rate."
---

# Rules on Tax Rate

## Tax rate workflows after update

Runs after a tax rate is changed; order 100. In **Business Rules** it is listed as `taxRateWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “taxRateWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Tax rate follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

