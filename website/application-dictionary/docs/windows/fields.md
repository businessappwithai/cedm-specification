---
title: "Field Layout Manager"
slug: /fields
sidebar_position: 3
description: "Arrange a window's fields into groups and columns, and control visibility."
---

# Field Layout Manager

**Open it:** App Dictionary side panel → *Field Layout Manager* (`/admin/fields`).

The Field Layout Manager arranges a window's fields in one place: **organise fields into groups, set the number of columns of a layout, and control which are visible.**

![The Field Layout Manager before an entity is chosen](/img/fields.jpg)

1. Open **Select Entity** and choose the entity (the window) to arrange.
2. Choose **Form Fields** to arrange the form, or **Grid Fields** to arrange the list columns.
3. Each **group** is a column of cards: the headings you see on the form, such as *General*, *Details* and *System*. Its badge shows how many columns the group lays its fields out in. Drag a field card from one group to another to move it, and up or down to reorder it.
4. The **eye** on a field card shows or hides the field (a struck-through eye is hidden). Required fields carry a red star; the grey tag names the field's kind.
5. On a group's header the **star** marks the group as the *Summary* group, whose fields are shown in the record header; the **pencil** edits the group's name, description and number of columns (1 to 4); the **bin** deletes the group. **Add Group** at the right creates a new group.
6. **Reset** returns to the layout as last saved. **Save Layout** writes it. The form changes on the next request.

![An entity's form arranged in groups](/img/fields-entity.jpg)

The same settings can be edited field by field under [Window, Tab and Field](windows.md); the manager is faster for arranging a whole form.
