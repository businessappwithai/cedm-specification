---
title: "Insurance Policy"
sidebar_position: 5
description: "The business rules that run on Insurance Policy."
---

# Rules on Insurance Policy

## Insurance policy invariants before create

Runs before a insurance policy is created; order 100. In **Business Rules** it is listed as `insurancePolicyInvariantsBeforeCreate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Insurance policy invariants before update

Runs before a insurance policy is changed; order 100. In **Business Rules** it is listed as `insurancePolicyInvariantsBeforeUpdate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Insurance policy workflows after update

Runs after a insurance policy is changed; order 100. In **Business Rules** it is listed as `insurancePolicyWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “insurancePolicyWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Insurance policy follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

