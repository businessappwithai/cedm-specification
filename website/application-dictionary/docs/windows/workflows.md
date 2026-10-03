---
title: "Workflow Monitor"
slug: /workflows
sidebar_position: 6
description: "Watch processes as they run and read what each step did."
---

# Workflow Monitor

**Open it:** *Workflow Monitor* (`/admin/workflows`).

Every time a [process](workflow-definitions.md) runs, the application records the run. The Workflow Monitor shows them, refreshing every five seconds.

![The Workflow Monitor](/img/workflows.jpg)

- **Counters**: **Total**, **Draft**, **Success**, **Error** and **Avg Duration**.
- **Filters**: a search box (entity, record id or run id) and **All Entities**, **All Operations**, **All Status**.
- **Rows** show the run's **Entity**, **Entity ID**, **Operation**, **Status** (Success, Error, Running…), **Started** and **Duration**. Open a row to see each step, what it did and, for a failure, why.
- **Refresh** reads the list now.

A record whose workflows are still running is **Draft**; if every rule and process succeeds it becomes **Final**, and if one fails nothing it changed is kept and the reason is written onto the record so you can fix it and save again. This shows as a status beside the record's title.

The monitor is empty until something triggers a process.
