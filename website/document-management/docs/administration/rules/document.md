---
title: "Document"
sidebar_position: 3
description: "The business rules that run on Document."
---

# Rules on Document

## Document workflows after update

Runs after a document is changed; order 100. In **Business Rules** it is listed as `documentWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “documentWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Document follow up required”).

![The Document workflows after update rule in the editor](/img/rules/document-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

