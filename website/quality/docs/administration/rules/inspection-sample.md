---
title: "Inspection Sample"
sidebar_position: 7
description: "The business rules that run on Inspection Sample."
---

# Rules on Inspection Sample

## Inspection sample invariants before create

Runs before a inspection sample is created; order 100. In **Business Rules** it is listed as `inspectionSampleInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Inspection sample invariants before update

Runs before a inspection sample is changed; order 100. In **Business Rules** it is listed as `inspectionSampleInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Inspection sample workflows after update

Runs after a inspection sample is changed; order 100. In **Business Rules** it is listed as `inspectionSampleWorkflowsAfterUpdate`.

- **When** (“Status” == "REJECTED" or “Status” == "CANCELLED") and “Status” != previous “Status”: **Starts a process** — “inspectionSampleWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Inspection sample follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

