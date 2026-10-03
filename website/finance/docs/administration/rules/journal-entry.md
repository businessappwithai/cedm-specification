---
title: "Journal Entry"
sidebar_position: 17
description: "The business rules that run on Journal Entry."
---

# Rules on Journal Entry

## Journal entry workflows after update

Runs after a journal entry is changed; order 100. In **Business Rules** it is listed as `journalEntryWorkflowsAfterUpdate`.

- **When** “Status” == "REVERSED" and “Status” != previous “Status”: **Starts a process** — “journalEntryWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Journal entry follow up required”).
- **When** “Status” == "POSTED" and “Status” != previous “Status”: **Starts a process** — “journalEntryWorkflowsAfterUpdate: CompletionConfirmed” (starts the process “Journal entry completion confirmed”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

