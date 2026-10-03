---
title: "Government Case"
sidebar_position: 4
description: "The business rules that run on Government Case."
---

# Rules on Government Case

## Government case invariants before create

Runs before a government case is created; order 100. In **Business Rules** it is listed as `governmentCaseInvariantsBeforeCreate`.

- **When** “Status” == "CLOSED" and “Closed At” is empty: **Refuses the save** — “Record closed at when the government case is closed.”.

![The Government case invariants before create rule in the editor](/img/rules/government-case-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Government case invariants before update

Runs before a government case is changed; order 100. In **Business Rules** it is listed as `governmentCaseInvariantsBeforeUpdate`.

- **When** “Status” == "CLOSED" and “Closed At” is empty: **Refuses the save** — “Record closed at when the government case is closed.”.

![The Government case invariants before update rule in the editor](/img/rules/government-case-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Government case workflows after update

Runs after a government case is changed; order 100. In **Business Rules** it is listed as `governmentCaseWorkflowsAfterUpdate`.

- **When** “Status” == "UNDER_REVIEW" and “Status” != previous “Status”: **Starts a process** — “governmentCaseWorkflowsAfterUpdate: ApprovalRequested” (starts the process “Government case approval requested”).
- **When** (“Status” == "CANCELLED" or “Status” == "DENIED") and “Status” != previous “Status”: **Starts a process** — “governmentCaseWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Government case follow up required”).

![The Government case workflows after update rule in the editor](/img/rules/government-case-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

