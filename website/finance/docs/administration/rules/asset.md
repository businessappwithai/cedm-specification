---
title: "Asset"
sidebar_position: 3
description: "The business rules that run on Asset."
---

# Rules on Asset

## Asset invariants before create

Runs before a asset is created; order 100. In **Business Rules** it is listed as `assetInvariantsBeforeCreate`.

- **When** “Acquisition Cost” is filled in and “Acquisition Cost” < 0: **Refuses the save** — “Acquisition Cost cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Asset invariants before update

Runs before a asset is changed; order 100. In **Business Rules** it is listed as `assetInvariantsBeforeUpdate`.

- **When** “Acquisition Cost” is filled in and “Acquisition Cost” < 0: **Refuses the save** — “Acquisition Cost cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Asset workflows after update

Runs after a asset is changed; order 100. In **Business Rules** it is listed as `assetWorkflowsAfterUpdate`.

- **When** “Status” == "HELD" and “Status” != previous “Status”: **Starts a process** — “assetWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Asset exception raised”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

