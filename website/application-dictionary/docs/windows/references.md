---
title: "Reference"
slug: /references
sidebar_position: 11
description: "The kinds of value a column can hold, and the lists behind dropdowns."
---

# Reference

**Open it:** App Dictionary side panel → *Reference* (`/admin/references`).

A **reference** is the kind of value a column holds, and it decides which control the form draws. Every column points at one.

![The Reference list](/img/references.jpg)

The list shows the reference **ID**, **Name**, **Description**, **Type** and **Active**. These come with the application:

| Reference | Control |
| --- | --- |
| **String** (10) | A line of text. |
| **Integer** (11) | A whole number. |
| **Amount** (12) | A decimal number, for money and quantities. |
| **ID** (13) | A unique identifier. |
| **Text** (14) | Long text in a multi-line box. |
| **Date** (15) and **DateTime** (16) | A date, or a date and time. |
| **List** (17) | A dropdown of fixed choices. |
| **Table** (18) and **Table Direct** (19) | A dropdown of the records of another table, labelled by that table's identifier columns. |
| **Yes-No** (20) | A checkbox. |
| **URL**, **Email**, **Phone** | Text with the matching check. |
| **JSON** (28) | Structured data. |
| IDs from **1000** up | One per list of values the model declares, drawn as a dropdown of that list's values. |

## A reference record

![A reference record](/img/reference-record.jpg)

| Field | What it means |
| --- | --- |
| **Reference ID** | The number columns use to point at it. |
| **Name** and **Description** | What it is called and what it holds. |
| **Validation Type** | **S**: a plain value; **L**: a list of fixed choices; **T**: a pick from a table. |
| **Value Format** | A format hint for plain values. |
| **Active** and **Entity Type** | Whether it is in use, and a classification code. |

## Lists of values

The values of a list are rows in the list's own business table, shown as a window under *Reference Data*. In generated applications **every enumeration has its own table**, so adding a status or a type is adding a record there, and the dropdowns show it at once. A **Table** reference points a column at any table; the dropdown labels each row with that table's **Identifier** columns.

See [Create a dropdown list](../how-to/create-a-list.md).
