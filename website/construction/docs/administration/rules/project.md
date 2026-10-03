---
title: "Project"
sidebar_position: 7
description: "The business rules that run on Project."
---

# Rules on Project

## Project invariants before create

Runs before a project is created; order 100. In **Business Rules** it is listed as `projectInvariantsBeforeCreate`.

- **When** “Budget Amount” is filled in and “Budget Amount” < 0: **Refuses the save** — “Budget Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Project invariants before update

Runs before a project is changed; order 100. In **Business Rules** it is listed as `projectInvariantsBeforeUpdate`.

- **When** “Budget Amount” is filled in and “Budget Amount” < 0: **Refuses the save** — “Budget Amount cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Project workflows after update

Runs after a project is changed; order 100. In **Business Rules** it is listed as `projectWorkflowsAfterUpdate`.

- **When** “Status” == "ON_HOLD" and “Status” != previous “Status”: **Starts a process** — “projectWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Project exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “projectWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Project follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

