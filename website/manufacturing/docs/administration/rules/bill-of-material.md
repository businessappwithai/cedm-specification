---
title: "Bill Of Material"
sidebar_position: 3
description: "The business rules that run on Bill Of Material."
---

# Rules on Bill Of Material

## Bill of material invariants before create

Runs before a bill of material is created; order 100. In **Business Rules** it is listed as `billOfMaterialInvariantsBeforeCreate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Bill of material invariants before update

Runs before a bill of material is changed; order 100. In **Business Rules** it is listed as `billOfMaterialInvariantsBeforeUpdate`.

- **When** “Effective From” is filled in and “Effective To” is filled in and “Effective To” < “Effective From”: **Refuses the save** — “Effective To cannot be earlier than effective from.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

