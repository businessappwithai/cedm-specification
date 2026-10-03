---
title: "Role Administration"
slug: /roles
sidebar_position: 13
description: "See the roles of the application and which are master roles."
---

# Role Administration

**Open it:** dashboard → Application Dictionary → *Role Administration* (`/admin/roles`).

The window titled **Role Management** lists the roles: **Name**, **Description**, **Type** and **Status**.

![Role Management](/img/roles.jpg)

- **Administrator** is the **Master** role (a star marks it): it holds every window and bypasses the restrictions the model puts on actions. It cannot bypass a lifecycle: a move the lifecycle does not draw does not exist for anyone.
- **User** is a **Standard** role.
- Roles the model declares through its access rules (for example *Sales Manager*) are created when the application is seeded.

## What a role may do

A role's reach is set in three layers (see [Concepts](../concepts.md)):

1. **Window access**: the dictionary's access table links a role to the windows it may open (and whether read-only).
2. **Action restrictions**: the model may restrict create, change or delete on an entity to named roles.
3. **Lifecycle moves**: role rules decide who may make a given move.

Access rows are maintained through the API (`/api/sys/access`, `/api/sys/roles`); see [Grant a role access to windows](../how-to/grant-access.md). Your application's own manual lists the roles and restrictions its model declares under **Administration → Roles and access**.
