---
title: "Construction Project"
sidebar_position: 3
description: "The business rules that run on Construction Project."
---

# Rules on Construction Project

## Construction project workflows after update

Runs after a construction project is changed; order 100. In **Business Rules** it is listed as `constructionProjectWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “constructionProjectWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Construction project follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

