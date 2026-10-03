---
title: "Dataset"
sidebar_position: 3
description: "The business rules that run on Dataset."
---

# Rules on Dataset

## Data quality assessment workflows after update

Runs after a dataset is changed; order 100. In **Business Rules** it is listed as `dataQualityAssessmentWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “dataQualityAssessmentWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Data quality assessment follow up required”).

![The Data quality assessment workflows after update rule in the editor](/img/rules/data-quality-assessment-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

