---
title: "Tax Jurisdiction"
sidebar_position: 34
description: "The business rules that run on Tax Jurisdiction."
---

# Rules on Tax Jurisdiction

## Tax jurisdiction workflows after update

Runs after a tax jurisdiction is changed; order 100. In **Business Rules** it is listed as `taxJurisdictionWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “taxJurisdictionWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Tax jurisdiction follow up required”).

![The Tax jurisdiction workflows after update rule in the editor](/img/rules/tax-jurisdiction-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

