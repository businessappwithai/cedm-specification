---
title: "Experiment"
sidebar_position: 6
description: "The business rules that run on Experiment."
---

# Rules on Experiment

## Experiment invariants before create

Runs before a experiment is created; order 100. In **Business Rules** it is listed as `experimentInvariantsBeforeCreate`.

- **When** “Status” == "COMPLETED" and “Completed At” is empty: **Refuses the save** — “Record completed at when the experiment is completed.”.

![The Experiment invariants before create rule in the editor](/img/rules/experiment-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Experiment invariants before update

Runs before a experiment is changed; order 100. In **Business Rules** it is listed as `experimentInvariantsBeforeUpdate`.

- **When** “Status” == "COMPLETED" and “Completed At” is empty: **Refuses the save** — “Record completed at when the experiment is completed.”.

![The Experiment invariants before update rule in the editor](/img/rules/experiment-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Experiment workflows after update

Runs after a experiment is changed; order 100. In **Business Rules** it is listed as `experimentWorkflowsAfterUpdate`.

- **When** “Status” == "FAILED" and “Status” != previous “Status”: **Starts a process** — “experimentWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Experiment exception raised”).
- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “experimentWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Experiment follow up required”).

![The Experiment workflows after update rule in the editor](/img/rules/experiment-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

