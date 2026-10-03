---
title: "Getting started"
sidebar_position: 3
description: "Sign in, open the administrator windows, and learn the controls every window shares."
---

# Getting started

## Sign in as an administrator

Open your application and sign in. A fresh installation has one administrator, **admin@admin.com** with the password **admin**. Change the password before the application is used by anyone else.

Only a user holding the **Administrator** (master) role sees the administrator windows.

## Find the administrator windows

The dashboard ends with an **Application Dictionary** section, one card per administrator window. Each window is also reachable by its address, shown on its page in this manual (for example `/admin/rules`).

![The Application Dictionary section of the dashboard](/img/admin-index.jpg)

Windows that belong together share a side panel titled **App Dictionary**: *Table and Column*, *Window, Tab and Field*, *Element*, *Reference*, *Entity Categories*, *Field Layout Manager*, *Business Rules* and *Audit Log*.

## The controls every dictionary list shares

The dictionary windows for tables, windows, references, elements and settings share one layout, the same one the business windows use.

![An administrator list with advanced search open](/img/list-advanced-search.jpg)

- **Search** (top left) opens **Advanced Search**. Choose **Add Filter**, pick a field, a comparison and a value, then **Apply**. Comparisons depend on the field: *equals*, *contains*, *starts with*, *ends with*, *<*, *<=*, *>*, *>=*, *before*, *after*, *on or before*, *on or after*.
- **New** (beside Search) opens a form to add a row. **Save** in the toolbar, or **Create** on the form, writes it.
- **Refresh** (top right) re-reads the rows.
- The **search box** above the grid filters the visible rows as you type; the heading arrows **sort**; **CSV** downloads what you see; and a line shows how many entries match.
- Click a row to open the **record**. The arrows and “1 of 51” step through the list.

On a record:

- **Edit** makes the fields editable; **Save Changes** writes them; **Undo Changes** puts back what you changed; **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one; **Delete Record** (in edit mode) asks you to confirm.
- A record that has children lists them in a grid beneath its fields; **View all** opens that grid on its own page.
- A required field carries a red star. A message names the field and the reason when a save is refused.

## Before you change anything

- The dictionary is **shared by every user of the application** and applies on the next request.
- Rows marked **Model-managed** come from the model. Edit them and regeneration may replace the change; change the model for a lasting edit.
- Every change is written to the [Audit Log](windows/audit.md).
