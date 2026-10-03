---
title: "Request For Quotation"
sidebar_position: 16
description: "The business rules that run on Request For Quotation."
---

# Rules on Request For Quotation

## Request for quotation workflows after update

Runs after a request for quotation is changed; order 100. In **Business Rules** it is listed as `requestForQuotationWorkflowsAfterUpdate`.

- **When** “Status” == "CANCELLED" and “Status” != previous “Status”: **Starts a process** — “requestForQuotationWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Request for quotation follow up required”).

![The Request for quotation workflows after update rule in the editor](/img/rules/request-for-quotation-workflows-after-update.jpg)

**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

