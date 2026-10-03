---
title: "Find out who changed a record"
sidebar_position: 8
description: "Use the Audit Log and a record's Audit Trail."
---

# Find out who changed a record

**From the record:** open it and read the **Audit Trail** at the bottom: each entry gives the action, the account, the time and the fields that changed; **Details** shows **Before** and **After**.

**From the log:** open the [Audit Log](../windows/audit.md), choose **Filters**, set **Entity** to the window and paste the record's id into **Entity ID**, then expand the entries.

![The Audit Log](/img/audit-entries.jpg)

To see everything one person did, filter by their email under **User**. To find failures, set **Success / Failure** to *Failures only*.
