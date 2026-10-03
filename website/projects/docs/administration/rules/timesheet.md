---
title: "Timesheet"
sidebar_position: 13
description: "The business rules that run on Timesheet."
---

# Rules on Timesheet

## Timesheet workflows after update

Runs after a timesheet is changed; order 100. In **Business Rules** it is listed as `timesheetWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “timesheetWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Timesheet follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “timesheetWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Timesheet completion confirmed”).

![The Timesheet workflows after update rule in the editor](/img/rules/timesheet-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

