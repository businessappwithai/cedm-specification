---
title: "Education Student"
sidebar_position: 3
description: "The business rules that run on Education Student."
---

# Rules on Education Student

## Enrollment workflows after update

Runs after a education student is changed; order 100. In **Business Rules** it is listed as `enrollmentWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “enrollmentWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Enrollment follow up required”).
- **When** “Status” == "COMPLETED" and “Status” != previous “Status”: **Starts a process** — “enrollmentWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Enrollment completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

