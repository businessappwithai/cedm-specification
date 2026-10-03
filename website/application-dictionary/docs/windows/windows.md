---
title: "Window, Tab and Field"
slug: /windows
sidebar_position: 2
description: "Arrange the windows, tabs and fields users see."
---

# Window, Tab and Field

**Open it:** dashboard → Application Dictionary → *Window, Tab and Field* (`/admin/windows`).

This window controls what users see. A **window** is a screen in the menu; a **tab** is a part of it that shows one table; a **field** is one control on a tab. The list starts at windows; open a window to see its tabs, open a tab to see its fields.

![The Window list](/img/windows.jpg)

The list shows **Name**, **Description**, **Type** and **Active**. The administrator windows appear here too, with their address (for example `/admin/rules`) as the description.

## A window

![A window record with its tabs](/img/window-record.jpg)

| Field | What it means |
| --- | --- |
| **Name** | The window's title in the menu and on the dashboard. Required. |
| **Description** | One line shown on the dashboard card and in the list. |
| **Help** | The text the **Help** button on the window opens. In generated applications it is composed from the model's help for the entity: what the window is, what its fields mean and what a save does. |
| **Default** | Marks a default window. |
| **Active** | An inactive window is removed from the menu and the dashboard. |
| **Window Type**, **Sales Transaction**, **Entity Type** | Classification flags recorded for the dictionary; not applied today. |

The **Tabs** grid beneath the fields lists the window's tabs with the table each shows, its **Level** (0 is the main tab; 1 is a line shown under a parent record), its **Sequence**, **Read Only** and **Active**.

## A tab

![A tab record](/img/tab-record.jpg)

| Field | What it means |
| --- | --- |
| **Name** | The tab's label. |
| **Table** | The table the tab shows. Pick from the tables in [Table and Column](tables.md). |
| **Description**, **Help** | Text for the tab. |
| **Tab Level** | 0 for the main tab. A child tab (an order's lines) is level 1 and appears beneath the parent record's fields. |
| **Sequence** | Order among the window's tabs. |
| **Read Only** | The tab shows records but cannot add or change them. |
| **Active** | Switch the tab off. |
| **Single Row**, **Translation Tab**, **Insert Record**, **Advanced Tab**, **Order By**, **Where Clause** | Recorded for the dictionary; the generated screens do not apply them yet. |

The **Fields** grid lists the tab's fields.

## A field

![A field record](/img/field-record.jpg)

The field is where a column becomes a control.

| Field | What it means | Applied today |
| --- | --- | --- |
| **Column** | The column the field shows. | Yes |
| **Name** | The label users see. This is where to rename a field. | Yes |
| **Description**, **Help** | The help shown behind the question-mark icon beside the label. | Yes |
| **Reference Type Override** | Use a different control than the column's own reference. | Yes |
| **Sequence** | The field's order on the form. | Yes |
| **Grid Sequence** | The field's order among the list columns. | Yes |
| **Displayed** | Show the field on the form. | Yes |
| **Displayed in Grid** | Show it as a column in the list. | Yes |
| **Read Only** | Show the value but do not let it be edited. | Yes |
| **Default Value** | What a new record starts with. | Yes |
| **Active** | An inactive field is hidden. | Yes |
| **Display Length**, **Column Span**, **X Position**, **Y Position**, **Num Lines**, **Same Line**, **Heading**, **Field Only (no label)**, **Encrypted**, **Sort Number**, **Obscure Type** | Layout and presentation hints. | Not yet; use the [Field Layout Manager](fields.md) for groups and columns |
| **Display Logic**, **Read Only Logic**, **Mandatory Logic** | Conditions for showing, locking or requiring a field. | Not yet |

To hide, reorder or rename a field, see [Hide or reorder fields](../how-to/reorder-fields.md).

## Change a window

Open the record, choose **Edit**, change the field and **Save Changes**. The change shows on the next request for every user.
