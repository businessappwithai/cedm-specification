---
title: "Corrective Action Verification"
sidebar_position: 5
description: "The business rules that run on Corrective Action Verification."
---

# Rules on Corrective Action Verification

## Corrective action verification workflows after update

Runs after a corrective action verification is changed; order 100. In **Business Rules** it is listed as `correctiveActionVerificationWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “correctiveActionVerificationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Corrective action verification follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “correctiveActionVerificationWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Corrective action verification completion confirmed”).

![The Corrective action verification workflows after update rule in the editor](/img/rules/corrective-action-verification-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

