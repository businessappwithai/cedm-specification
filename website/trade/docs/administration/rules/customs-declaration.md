---
title: "Customs Declaration"
sidebar_position: 3
description: "The business rules that run on Customs Declaration."
---

# Rules on Customs Declaration

## Customs declaration workflows after update

Runs after a customs declaration is changed; order 100. In **Business Rules** it is listed as `customsDeclarationWorkflowsAfterUpdate`.

- **When** “Status” == "SUBMITTED" and “Status” != previous “Status”: **Starts a process** — “customsDeclarationWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Customs declaration approval requested”).
- **When** (“Status” == "REJECTED" or “Status” == "CANCELLED") and “Status” != previous “Status”: **Starts a process** — “customsDeclarationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Customs declaration follow up required”).

![The Customs declaration workflows after update rule in the editor](/img/rules/customs-declaration-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

