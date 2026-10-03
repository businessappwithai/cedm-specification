---
title: "Audit Log"
slug: /audit
sidebar_position: 8
description: "Read the tamper-evident trail of every change."
---

# Audit Log

**Open it:** dashboard → Application Dictionary → *Audit Log* (`/admin/audit`).

Every write to a table that has **Maintain Change Log** switched on is recorded: who did it, when, to which record, and what changed. The entries are chained together so that altering or removing one is detectable.

![The Audit Log](/img/audit-entries.jpg)

## Reading the list

| Column | What it shows |
| --- | --- |
| **Timestamp** | When the change happened. |
| **User** | The account that made it (its id and email). |
| **Action** | **CREATE**, **UPDATE** or **DELETE**. |
| **Entity** | The window the record belongs to, and the record's id. |
| **Changed** | The fields that changed. |
| **Source** | Where the change came from: **API** (the application's own screens and integrations) or another source. |
| **Status** | **OK** or a failure. |
| **Verify** | A check mark control for entries also written to an external tamper-proof ledger; **—** when none is configured. |

Choose the arrow at the right of a row to expand it: **Before** and **After** show the record's values, so you can see exactly what a change did.

## Filter

**Filters** (top left) opens the filter bar: **Action**, **Entity**, **Source**, **Success / Failure** (all, success only, failures only), **User** (by email) and **Entity ID**, plus a **Search** box. **Refresh** reads the log again. The footer shows how many records match, **Rows** per page (50 by default) and **Page n of N** with first, previous, next and last buttons.

Each record also shows its own **Audit Trail** at the bottom of its page, so you rarely need to search the log to see one record's history.

:::note
A table's changes are recorded only if its **Maintain Change Log** setting is on in [Table and Column](tables.md). Generated applications switch it on for business tables.
:::
