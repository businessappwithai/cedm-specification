---
title: "Sample"
sidebar_position: 10
description: "The business rules that run on Sample."
---

# Rules on Sample

## Sample invariants before create

Runs before a sample is created; order 100. In **Business Rules** it is listed as `sampleInvariantsBeforeCreate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Sample invariants before create rule in the editor](/img/rules/sample-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Sample invariants before update

Runs before a sample is changed; order 100. In **Business Rules** it is listed as `sampleInvariantsBeforeUpdate`.

- **When** “Quantity” is filled in and “Quantity” < 0: **Refuses the save** — “Quantity cannot be negative.”.

![The Sample invariants before update rule in the editor](/img/rules/sample-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Sample workflows after update

Runs after a sample is changed; order 100. In **Business Rules** it is listed as `sampleWorkflowsAfterUpdate`.

- **When** “Status” == "QUARANTINED" and “Status” != previous “Status”: **Starts a process** — “sampleWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Sample exception raised”).

![The Sample workflows after update rule in the editor](/img/rules/sample-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

