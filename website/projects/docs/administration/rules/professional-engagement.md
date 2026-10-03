---
title: "Professional Engagement"
sidebar_position: 6
description: "The business rules that run on Professional Engagement."
---

# Rules on Professional Engagement

## Professional engagement workflows after update

Runs after a professional engagement is changed; order 100. In **Business Rules** it is listed as `professionalEngagementWorkflowsAfterUpdate`.

- **When** “Status” == "PROPOSED" and “Status” != previous “Status”: **Starts a process** — “professionalEngagementWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Professional engagement approval requested”).
- **When** “Status” == "ON_HOLD" and “Status” != previous “Status”: **Starts a process** — “professionalEngagementWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Professional engagement exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “professionalEngagementWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Professional engagement follow up required”).

![The Professional engagement workflows after update rule in the editor](/img/rules/professional-engagement-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

