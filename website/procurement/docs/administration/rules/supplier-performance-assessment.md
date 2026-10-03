---
title: "Supplier Performance Assessment"
sidebar_position: 26
description: "The business rules that run on Supplier Performance Assessment."
---

# Rules on Supplier Performance Assessment

## Supplier performance assessment invariants before create

Runs before a supplier performance assessment is created; order 100. In **Business Rules** it is listed as `supplierPerformanceAssessmentInvariantsBeforeCreate`.

- **When** “Period Start” is filled in and “Period End” is filled in and “Period End” < “Period Start”: **Refuses the save** — “Period End cannot be earlier than period start.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier performance assessment invariants before update

Runs before a supplier performance assessment is changed; order 100. In **Business Rules** it is listed as `supplierPerformanceAssessmentInvariantsBeforeUpdate`.

- **When** “Period Start” is filled in and “Period End” is filled in and “Period End” < “Period Start”: **Refuses the save** — “Period End cannot be earlier than period start.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier performance assessment workflows after update

Runs after a supplier performance assessment is changed; order 100. In **Business Rules** it is listed as `supplierPerformanceAssessmentWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “supplierPerformanceAssessmentWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier performance assessment follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

