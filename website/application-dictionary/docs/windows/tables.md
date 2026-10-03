---
title: "Table and Column"
slug: /tables
sidebar_position: 1
description: "Add or change a business table and its columns."
---

# Table and Column

**Open it:** dashboard → Application Dictionary → *Table and Column* (`/admin/tables`).

A **table** is one kind of business record; its **columns** are the pieces of information it holds. This window lists every table in the application, with its columns beneath each.

![The Table and Column list](/img/tables.jpg)

The list shows **DB Table Name**, **Name**, **Description** and **Active** for each table. Business tables carry the prefix `bus_`; the dictionary's own tables carry `sys_`. Use the search box, **Search** (advanced search) and the column headings to find one, and **CSV** to export the list.

## A table record

Click a row to open the table.

![A table record with its columns](/img/table-record.jpg)

Above the fields, **Set up window, tab and fields** creates the window, the tab and the fields for this table in one step, so a table you added appears in the menu and on the dashboard. It does nothing if they already exist (“Already configured”).

Beneath the fields, the **Columns** grid lists every column of the table (here “17 Columns”) with **DB Column Name**, **Name**, **Reference Type**, **Mandatory**, **Key** and **Active**. Click a column to open it; **View all** opens the grid on its own page.

### Table fields

| Field | What it means |
| --- | --- |
| **DB Table Name** | The physical table, for example `bus_customer`. Required, up to 100 characters. Never change it on a table that holds data. |
| **Name** | What the application calls the table in the dictionary. Required. |
| **Description** | A sentence about what the table holds. |
| **Icon** | The name of an icon (for example `map-pin`) drawn on the dashboard card, the menu and the window heading. |
| **Active** | An inactive table is ignored. |
| **Maintain Change Log** | When on, every write to this table is recorded in the [Audit Log](audit.md). |
| **Access Level**, **View**, **Document**, **High Volume**, **Entity Type** | Classification flags recorded for the dictionary. They do not change a screen today; see [what the screens apply today](../what-is-applied.md). |

## A column record

![A column record](/img/column-record.jpg)

### Column fields

| Field | What it means |
| --- | --- |
| **DB Column Name** | The physical column, for example `customer_id`. |
| **Name** | The label the column carries when no field overrides it. |
| **Description** | The help text shown with the control. |
| **Reference Type** | The kind of value, which decides the control. Pick from [Reference](references.md): *String*, *Integer*, *Amount*, *Date*, *Yes-No*, *List*, *Table* and so on. |
| **Length** | The longest entry accepted for text. |
| **Default Value** | What a new record starts with. |
| **Key** | The record's identifying column. |
| **Parent Link** | The column that ties a line to its parent record. |
| **Mandatory** | The form will not save without it. |
| **Updateable** | When off, the value can be set when the record is created and never changed afterwards. |
| **Identifier** | The column that names a record when another record points at it. A dropdown shows it as the label. |
| **Selection Column**, **Encrypted** | Recorded; not applied today. |
| **Sequence** | The column's order within the table. |
| **Active** | An inactive column is ignored. |

## Add a table or a column

Choose **New**, fill in the form and **Create**. Creating a **table** here also creates its window and tab; creating a **column** also creates its field, because a table without a window has no screen and a column without a field is invisible. The schema itself (the physical table or column) is part of the generated application's migrations: adding a row here describes a table, it does not create one in the database. See [Create a table and its window](../how-to/create-a-table.md).

:::caution
Changing a **DB Table Name**, **DB Column Name** or **Reference Type** on a table that already holds data changes how the application reads that data. Do it only when the database has been changed to match.
:::
