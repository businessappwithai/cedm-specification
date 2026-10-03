---
title: "Healthcare Patient"
sidebar_position: 8
description: "The business rules that run on Healthcare Patient."
---

# Rules on Healthcare Patient

## Allergy workflows after update

Runs after a healthcare patient is changed; order 100. In **Business Rules** it is listed as `allergyWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “allergyWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Allergy follow up required”).

![The Allergy workflows after update rule in the editor](/img/rules/allergy-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

