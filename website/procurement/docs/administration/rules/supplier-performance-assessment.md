---
title: "Supplier Performance Assessment"
sidebar_position: 26
description: "The business rules that run on Supplier Performance Assessment."
---

# Rules on Supplier Performance Assessment

## Supplier performance assessment invariants before create

Runs before a supplier performance assessment is created; order 100. In **Business Rules** it is listed as `supplierPerformanceAssessmentInvariantsBeforeCreate`.

- **When** “Period Start” is filled in and “Period End” is filled in and “Period End” < “Period Start”: **Refuses the save** — “Period End cannot be earlier than period start.”.

![The Supplier performance assessment invariants before create rule in the editor](/img/rules/supplier-performance-assessment-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier performance assessment invariants before update

Runs before a supplier performance assessment is changed; order 100. In **Business Rules** it is listed as `supplierPerformanceAssessmentInvariantsBeforeUpdate`.

- **When** “Period Start” is filled in and “Period End” is filled in and “Period End” < “Period Start”: **Refuses the save** — “Period End cannot be earlier than period start.”.

![The Supplier performance assessment invariants before update rule in the editor](/img/rules/supplier-performance-assessment-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Supplier performance assessment workflows after update

Runs after a supplier performance assessment is changed; order 100. In **Business Rules** it is listed as `supplierPerformanceAssessmentWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “supplierPerformanceAssessmentWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Supplier performance assessment follow up required”).

![The Supplier performance assessment workflows after update rule in the editor](/img/rules/supplier-performance-assessment-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

