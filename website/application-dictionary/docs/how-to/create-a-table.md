---
title: "Create a table and its window"
sidebar_position: 3
description: "Describe a new table so it appears in the menu and on the dashboard."
---

# Create a table and its window

:::note
A table's physical schema belongs to the generated application. The dictionary *describes* a table; it does not create the database table. To add a new business entity for good, add it to the model and regenerate: the dictionary, the schema, the screens and the tests all follow from it. Use this recipe to expose a table that already exists in the database, or to describe one before the schema lands.
:::

1. Open [Table and Column](../windows/tables.md) and choose **New**.

   ![The New Table form](/img/tables-new.jpg)

2. Fill in **DB Table Name** (for example `bus_asset`), **Name** (*Asset*), **Description**, and an **Icon**. Turn on **Active** and **Maintain Change Log**.
3. Choose **Create**. The application also creates the **window** and **tab** for the table.
4. Add the **columns**: open the table, and under its **Columns** grid choose **New** for each one. Give each a **DB Column Name**, **Name** and **Reference Type**, and mark the required ones **Mandatory**. Creating a column also creates its **field**.
5. If the window or fields were not created, open the table and choose **Set up window, tab and fields** at the top.
6. Put the entity on the dashboard: in [Entity Categories](../windows/categories.md), assign it a category.
7. Reload the application: the table appears in the menu and as a card.

Then open it and check the form: [Hide, rename or reorder fields](reorder-fields.md).
