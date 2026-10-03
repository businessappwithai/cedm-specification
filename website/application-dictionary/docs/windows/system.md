---
title: "System Configuration"
slug: /system
sidebar_position: 14
description: "Application-wide settings."
---

# System Configuration

**Open it:** dashboard → Application Dictionary → *System Configuration* (`/admin/system`).

Settings are key/value pairs that apply to the whole application.

![System Configuration](/img/system.jpg)

The list shows **Category**, **Key**, **Value**, **Description** and **Active**. A fresh application has:

| Category | Key | What it does |
| --- | --- | --- |
| identity | `app_name` | The application's name, shown in the header and on the sign-in page. |
| identity | `app_description` | What the application is for. |
| ai | `ai_base_url` | The address of the OpenAI-compatible endpoint the assistant (**Ask**) uses. Business data is sent to this endpoint when someone asks a question, so set it deliberately. |
| ai | `ai_model` | The model name sent to that endpoint. |
| ai | `ai_api_key` | The bearer token for it. Marked sensitive. |
| sync | `electric_url` | The address of the ElectricSQL shape service, when the dictionary is synced to the browser. Empty by default. |

## Change a setting

Click a row to open the record, choose **Edit**, change the **Value** and **Save Changes**.

![A setting record](/img/system-record.jpg)

| Field | What it means |
| --- | --- |
| **Key** | The setting's name. |
| **Value** | What it is set to. |
| **Description** | What it does. |
| **Category** | Groups settings in the list. |
| **Data Type** | How the value is read (text, number, yes/no…). |
| **Sensitive** | A sensitive value is not shown back in full. |
| **Active** | An inactive setting is ignored. |

:::caution
Changing the **Value** of `ai_base_url` redirects the assistant to another server. Only an administrator can change it, and the change is written to the audit trail.
:::
