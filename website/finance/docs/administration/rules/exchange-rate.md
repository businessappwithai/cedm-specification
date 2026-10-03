---
title: "Exchange Rate"
sidebar_position: 14
description: "The business rules that run on Exchange Rate."
---

# Rules on Exchange Rate

## Exchange rate invariants before create

Runs before a exchange rate is created; order 100. In **Business Rules** it is listed as `exchangeRateInvariantsBeforeCreate`.

- **When** “Rate” is filled in and “Rate” < 0: **Refuses the save** — “Rate cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Exchange rate invariants before update

Runs before a exchange rate is changed; order 100. In **Business Rules** it is listed as `exchangeRateInvariantsBeforeUpdate`.

- **When** “Rate” is filled in and “Rate” < 0: **Refuses the save** — “Rate cannot be negative.”.


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Exchange rate workflows after update

Runs after a exchange rate is changed; order 100. In **Business Rules** it is listed as `exchangeRateWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “exchangeRateWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Exchange rate follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

