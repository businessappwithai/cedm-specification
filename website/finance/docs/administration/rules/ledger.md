---
title: "Ledger"
sidebar_position: 18
description: "The business rules that run on Ledger."
---

# Rules on Ledger

## Ledger workflows after update

Runs after a ledger is changed; order 100. In **Business Rules** it is listed as `ledgerWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “ledgerWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Ledger follow up required”).

![The Ledger workflows after update rule in the editor](/img/rules/ledger-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

