---
title: "Serial Number"
sidebar_position: 16
description: "The business rules that run on Serial Number."
---

# Rules on Serial Number

## Serial number workflows after update

Runs after a serial number is changed; order 100. In **Business Rules** it is listed as `serialNumberWorkflowsAfterUpdate`.

- **When** “Status” == "QUARANTINED" and “Status” != previous “Status”: **Starts a process** — “serialNumberWorkflowsAfterUpdate: ExceptionRaised” (starts the process “Serial number exception raised”).


**To change it:** open **Business Rules**, find the rule by name (or search for it), choose the pencil icon, change the decision table under **Decision Logic** and choose **Save Changes**. Use **Test Rule** to try a sample record first. The **Active** switch under **Rule Details** turns the rule off without deleting it.

