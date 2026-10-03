---
title: "Tax Registration"
sidebar_position: 36
description: "The business rules that run on Tax Registration."
---

# Rules on Tax Registration

## Tax registration workflows after update

Runs after a tax registration is changed; order 100. In **Business Rules** it is listed as `taxRegistrationWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “taxRegistrationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Tax registration follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

