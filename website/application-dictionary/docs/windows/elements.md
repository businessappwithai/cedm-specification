---
title: "Element"
slug: /elements
sidebar_position: 10
description: "Reusable field names, labels and help text."
---

# Element

**Open it:** App Dictionary side panel → *Element* (`/admin/elements`).

An **element** names a concept once, with its label and help, so every column that holds that concept reads the same way.

![The Element list](/img/elements.jpg)

An element record has:

| Field | What it means |
| --- | --- |
| **DB Column Name** | The column name the element describes, for example `customer_id`. |
| **Name** | The default label. |
| **Print Name** | The label used on printed output and reports. |
| **Description** | What the concept is. |
| **Help / Comment** | Longer help text. |
| **PO Name**, **PO Print Name**, **PO Description** | The same three, for purchase-side wording where a concept reads differently (for example *Customer* on a sales order and *Supplier* on a purchase order). |
| **Active** | An inactive element is ignored. |

The list uses the shared controls described in [Getting started](../getting-started.md).
