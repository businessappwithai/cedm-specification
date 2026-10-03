---
title: "Task"
sidebar_position: 10
description: "The business rules that run on Task."
---

# Rules on Task

## Task invariants before create

Runs before a task is created; order 100. In **Business Rules** it is listed as `taskInvariantsBeforeCreate`.

- **When** “Status” == "COMPLETED" and “Completed At” is empty: **Refuses the save** — “Record completed at when the task is completed.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Task invariants before update

Runs before a task is changed; order 100. In **Business Rules** it is listed as `taskInvariantsBeforeUpdate`.

- **When** “Status” == "COMPLETED" and “Completed At” is empty: **Refuses the save** — “Record completed at when the task is completed.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

