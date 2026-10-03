---
title: "User Administration"
slug: /users
sidebar_position: 12
description: "See the accounts of the application and their roles."
---

# User Administration

**Open it:** dashboard → Application Dictionary → *User Administration* (`/admin/users`).

The window titled **User Management** lists every account: its **Name**, **Email**, **Roles** (or *No roles*) and **Status**.

![User Management](/img/users.jpg)

A fresh installation has the **Administrator** account (`admin@admin.com`) and, for each role the model declares, one demonstration account. People can also create their own account from **Create a new account** on the sign-in page; a new account holds no role, so it sees no windows until an administrator grants it one.

## Granting access

The screen lists accounts. Granting a role to an account is done through the application's API, described at `/openapi.json` in your application (browsable at `/redoc` and `/scalar`). The sequence, with the exact requests, is in [Grant a role access to windows](../how-to/grant-access.md).

:::caution
Change the Administrator password straight after installation, and keep the number of accounts holding the master role small: the master role passes every access check except the lifecycle rules.
:::
