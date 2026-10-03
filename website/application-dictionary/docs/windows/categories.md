---
title: "Entity Categories"
slug: /categories
sidebar_position: 9
description: "Group windows on the dashboard and menu."
---

# Entity Categories

**Open it:** App Dictionary side panel → *Entity Categories* (`/admin/categories`).

The dashboard draws one block per **category**, ordered by sequence, and each block holds the cards of the windows assigned to it. This window creates categories and assigns each entity to one.

![Entity Categories](/img/categories.jpg)

## Categories

The first table lists the categories with **Name**, **Code**, **Description**, the number of **Entities** in it and two actions: **pencil** edits and **bin** deletes. A star beside a name marks the **default** category, which collects entities that are not assigned elsewhere. Generated applications start with the categories the model declares, plus **Reference Data** for the lists of values.

Choose **New Category** to add one.

![New category](/img/categories-new.jpg)

| Field | What it means |
| --- | --- |
| **Name** | The heading shown on the dashboard, for example *Compound Management*. |
| **Code** | A short identifier, for example `compound-management`. |
| **Description** | A sentence shown under the heading. |
| **Icon** | A lucide icon name, for example `flask-conical`. |
| **Colour** | A hex colour, for example `#6366f1`. |
| **Sequence** | Order among the categories. |
| **Default** | Make this the default category. |

## Entity assignment

The second table lists every entity with a drop-down **Category**. Change the category of an entity and the entity's card moves to that block on the dashboard.
