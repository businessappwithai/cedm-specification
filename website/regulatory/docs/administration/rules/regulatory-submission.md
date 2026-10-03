---
title: "Regulatory Submission"
sidebar_position: 6
description: "The business rules that run on Regulatory Submission."
---

# Rules on Regulatory Submission

## Regulatory submission workflows after update

Runs after a regulatory submission is changed; order 100. In **Business Rules** it is listed as `regulatorySubmissionWorkflowsAfterUpdate`.

- **When** (“Status” == "SUBMITTED" or “Status” == "UNDER_REVIEW") and “Status” != previous “Status”: **Starts a process** — “regulatorySubmissionWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Regulatory submission approval requested”).
- **When** “Status” == "REJECTED" and “Status” != previous “Status”: **Starts a process** — “regulatorySubmissionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Regulatory submission follow up required”).

![The Regulatory submission workflows after update rule in the editor](/img/rules/regulatory-submission-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

