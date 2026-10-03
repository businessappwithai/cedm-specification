---
title: "Trip"
sidebar_position: 13
description: "The business rules that run on Trip."
---

# Rules on Trip

## Trip workflows after update

Runs after a trip is changed; order 100. In **Business Rules** it is listed as `tripWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “tripWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Trip follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

