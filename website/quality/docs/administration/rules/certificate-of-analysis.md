---
title: "Certificate Of Analysis"
sidebar_position: 3
description: "The business rules that run on Certificate Of Analysis."
---

# Rules on Certificate Of Analysis

## Certificate of analysis workflows after update

Runs after a certificate of analysis is changed; order 100. In **Business Rules** it is listed as `certificateOfAnalysisWorkflowsAfterUpdate`.

- **When** “Status” == "VOID" and “Status” != previous “Status”: **Starts a process** — “certificateOfAnalysisWorkflowsAfterUpdate: FollowUpRequired” (starts the process “Certificate of analysis follow up required”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

