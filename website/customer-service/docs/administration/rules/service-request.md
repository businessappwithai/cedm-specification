---
title: "Service Request"
sidebar_position: 8
description: "The business rules that run on Service Request."
---

# Rules on Service Request

## Service request workflows after update

Runs after a service request is changed; order 100. In **Business Rules** it is listed as `serviceRequestWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “serviceRequestWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Service request follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

