---
title: "What the screens apply today"
sidebar_position: 6
description: "Which dictionary settings change a screen now, and which are recorded for later."
---

# What the screens apply today

The dictionary records more settings than the generated screens read. Changing a setting in the first column changes the screen; changing one in the second is stored but does not yet change anything. The list is true of the generated applications as they ship now.

## Applied

| Where | Setting |
| --- | --- |
| Table | **Name**, **Description**, **Icon**, **Active**, **Maintain Change Log** |
| Column | **Reference Type**, **Length**, **Default Value**, **Mandatory**, **Updateable**, **Identifier**, **Key**, **Parent Link**, **Sequence**, **Active** |
| Window | **Name**, **Description**, **Help**, **Active** |
| Tab | **Table**, **Tab Level**, **Sequence**, **Read Only**, **Active** |
| Field | **Column**, **Name**, **Description**, **Help**, **Reference Type Override**, **Sequence**, **Grid Sequence**, **Displayed**, **Displayed in Grid**, **Read Only**, **Default Value**, **Active** |
| Layout | Groups, their columns, the Summary group, and field visibility in the [Field Layout Manager](windows/fields.md) |
| Category | All fields |

## Recorded, not yet applied

| Where | Setting |
| --- | --- |
| Table | **Access Level**, **View**, **Document**, **High Volume**, **Entity Type** |
| Column | **Selection Column**, **Encrypted** |
| Window | **Window Type**, **Sales Transaction**, **Entity Type** |
| Tab | **Single Row**, **Translation Tab**, **Insert Record**, **Advanced Tab**, **Order By**, **Where Clause** |
| Field | **Display Length**, **Column Span**, **X Position**, **Y Position**, **Num Lines**, **Same Line**, **Heading**, **Field Only (no label)**, **Encrypted**, **Sort Number**, **Obscure Type**, **Display Logic**, **Read Only Logic**, **Mandatory Logic** |

Use the Field Layout Manager for what *Column Span* and *Same Line* were meant for, and a [business rule](windows/rules.md) for what the *Logic* settings were meant for (a rule can refuse a save with a message when a field is wrong for the record's state).

## Administration that is read-only in the browser

| Window | Today |
| --- | --- |
| [User Administration](windows/users.md) | Lists accounts. Roles are granted through the API. |
| [Role Administration](windows/roles.md) | Lists roles. Roles and their window access are created through the API. |
| [Reports](windows/reports.md) | Runs the reports the model declares; adding one means editing the model. |
