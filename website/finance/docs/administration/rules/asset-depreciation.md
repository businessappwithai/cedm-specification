---
title: "Asset Depreciation"
sidebar_position: 4
description: "The business rules that run on Asset Depreciation."
---

# Rules on Asset Depreciation

## Asset depreciation invariants before create

Runs before a asset depreciation is created; order 100. In **Business Rules** it is listed as `assetDepreciationInvariantsBeforeCreate`.

- **When** “Depreciation Rate” is filled in and “Depreciation Rate” < 0: **Refuses the save** — “Depreciation Rate cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Asset depreciation invariants before update

Runs before a asset depreciation is changed; order 100. In **Business Rules** it is listed as `assetDepreciationInvariantsBeforeUpdate`.

- **When** “Depreciation Rate” is filled in and “Depreciation Rate” < 0: **Refuses the save** — “Depreciation Rate cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

