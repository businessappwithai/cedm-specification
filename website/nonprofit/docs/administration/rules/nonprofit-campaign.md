---
title: "Nonprofit Campaign"
sidebar_position: 4
description: "The business rules that run on Nonprofit Campaign."
---

# Rules on Nonprofit Campaign

## Nonprofit campaign invariants before create

Runs before a nonprofit campaign is created; order 100. In **Business Rules** it is listed as `nonprofitCampaignInvariantsBeforeCreate`.

- **When** “Target Amount” is filled in and “Target Amount” < 0: **Refuses the save** — “Target Amount cannot be negative.”.

![The Nonprofit campaign invariants before create rule in the editor](/img/rules/nonprofit-campaign-invariants-before-create.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Nonprofit campaign invariants before update

Runs before a nonprofit campaign is changed; order 100. In **Business Rules** it is listed as `nonprofitCampaignInvariantsBeforeUpdate`.

- **When** “Target Amount” is filled in and “Target Amount” < 0: **Refuses the save** — “Target Amount cannot be negative.”.

![The Nonprofit campaign invariants before update rule in the editor](/img/rules/nonprofit-campaign-invariants-before-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

## Nonprofit campaign workflows after update

Runs after a nonprofit campaign is changed; order 100. In **Business Rules** it is listed as `nonprofitCampaignWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “nonprofitCampaignWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Nonprofit campaign follow up required”).

![The Nonprofit campaign workflows after update rule in the editor](/img/rules/nonprofit-campaign-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

