---
title: "Create a dropdown list"
sidebar_position: 4
description: "Add a list of choices, or add a value to an existing one."
---

# Create a dropdown list

## Add a value to an existing list

In a generated application every list of values is a table with its own window, under **Reference Data**.

1. Open the list's window from the menu, for example *Order Status*.
2. Choose **New**, fill in the code, name and description, and **Create**.
3. Every dropdown that uses the list offers the new value on its next refresh (use the refresh button).

## Point a field at a list of another table

1. In [Table and Column](../windows/tables.md), open the column.
2. Set **Reference Type** to **Table Direct** (or **Table**).
3. Save. The dropdown now offers the records of the table the column's name points at, labelled by that table's **Identifier** columns.

To change what labels the records, set **Identifier** on the target table's columns.

## Add a new fixed list

A fixed list of values is declared in the model as an enumeration, and regenerating gives it a table and a window. See the model language reference. In a running application, the **Reference** window records the list's reference id.
