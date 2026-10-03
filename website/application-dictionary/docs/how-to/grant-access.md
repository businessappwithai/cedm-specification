---
title: "Grant a role access to windows"
sidebar_position: 1
description: "Create a role, give it windows, and give it to an account."
---

# Grant a role access to windows

Roles and access are created through the application's API, because the browser screens for them are read-only (see [what the screens apply today](../what-is-applied.md)). Every request carries an administrator's token and is a JSON `POST` to your application's `/api`.

You need three things: a **role**, a **grant** for each window the role may open, and a **link** from an account to the role.

## 1. Get a token

```bash
curl -s -X POST $API/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@admin.com","password":"admin"}'
```

Copy the `token` from the answer and send it as `authorization: Bearer <token>` below.

## 2. Create the role

```bash
curl -s -X POST $API/api/sys/roles -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"Sales Reader","description":"Reads orders","is_active":true,
       "created_by":"admin","updated_by":"admin"}'
```

The answer carries the new `sys_role_id`. Dictionary writes require `created_by` and `updated_by`.

## 3. Grant a window

Find the window and its table:

```bash
curl -s "$API/api/sys/windows?name=Customer" -H "authorization: Bearer $TOKEN"
curl -s "$API/api/sys/tables?name=bus_customer" -H "authorization: Bearer $TOKEN"
```

Then grant it. `is_read_only: true` lets the role see but not change:

```bash
curl -s -X POST $API/api/sys/access -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"sys_role_id":"…","sys_window_id":"…","sys_table_id":"…",
       "is_read_only":true,"is_exclude":false,"is_active":true,
       "created_by":"admin","updated_by":"admin"}'
```

Repeat for each window. A window a role does not hold is absent from its menu and refused if opened by address.

## 4. Give the role to an account

Find the account in [User Administration](../windows/users.md) or with `GET /api/sys/users`, then:

```bash
curl -s -X POST $API/api/sys/user-roles -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"sys_user_id":"…","sys_role_id":"…","is_active":true,
       "created_by":"admin","updated_by":"admin"}'
```

:::caution
Send `"is_active": true`. A link created without it is stored inactive and grants nothing.
:::

The person's next request sees the new access: the dashboard and menu are built from it on every request.

## Check it

Sign in as that person: the dashboard shows only the windows you granted. The roles and their windows also read back in [Role Administration](../windows/roles.md).

Action restrictions (who may create, change or delete) and lifecycle role rules are declared in the model, not here.
