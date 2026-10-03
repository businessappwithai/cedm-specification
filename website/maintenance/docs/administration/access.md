---
title: "Roles and access"
sidebar_position: 4
description: "Who may open, create, change and move records."
---

# Roles and access

Access is decided in three steps, and a person needs to pass all three:

1. **Window access.** A role is granted windows in **Role Administration**. A window a role does not hold is absent from its menu and refused if opened by address.
2. **Action restrictions.** The model can restrict create, change or delete on an entity to named roles. With no restriction an action is open to anyone who holds the window.
3. **Lifecycle moves.** The lifecycle decides which moves exist; role rules decide who may make them. The administrator is bound by the first, not the second.

The **Administrator** role holds every window and bypasses restrictions on actions.

This application declares no roles beyond the Administrator; create roles in Role Administration and grant them windows.

![Role Administration](/img/admin/roles.jpg)

![User Administration](/img/admin/users.jpg)

## Restrictions the model declares

None.
