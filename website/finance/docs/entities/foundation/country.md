---
title: "Country"
sidebar_label: "Country"
sidebar_position: 10
description: "A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting."
---

# Country

A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. Give every application the same governed list, so a place or code means one thing across the enterprise. A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. Chosen from the list wherever a record needs a place, code or currency; maintained by an administrator when a registry changes. Referenced by addresses, parties, products and documents; related entities narrow each other (a city belongs to a state or province, which belongs to a country). Seeded from the common CEDM specification; changed only by an administrator, and a retired value stays on the records that carry it. Address capture, party onboarding, tax and trade determination, reporting. A shipping address in a named city, state and country.

## Finding records

Open **Country** from the menu or from its card on the dashboard.

![The Country list](/img/entities/country-list.jpg)

The list shows Code, Alpha3, Numeric Code, Name, Phone Code, Currency, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Country form](/img/entities/country-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Name**.
3. For a dropdown that points at another window, pick the matching record; if the record you need does not exist yet, create it in its own window first. A dropdown may narrow to what you have already chosen, for example the states of the chosen country.
4. Choose **Create** (or **Save** in the toolbar). You return to the record, and it appears at the top of the list. If something is wrong the form says which field and why, and nothing is saved.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Code | Text | Required, Unique, Up to 2 characters | The two-letter ISO 3166-1 code, such as US or DE. Search, integration and reporting; stored on nothing else, because records point at the country itself. Unique; a state or province and a city belong to a country through it. Required. |
| Alpha3 | Text | Up to 3 characters | The three-letter ISO 3166-1 code, such as USA or DEU. Trade and customs documents, which use the long form. Unique among countries. |
| Numeric Code | Text | Up to 3 characters | The three-digit ISO 3166-1 numeric code, such as 840. Banking and statistical exchange formats. Unique among countries. |
| Name | Text | Required, Up to 300 characters | The country's short name in English. Shown in lists, on addresses and on reports. Does not replace the code as the stable key. Required. |
| Phone Code | Telephone | Up to 20 characters | The international dialling prefix, without the plus sign. Validating and formatting telephone numbers. Belongs to the country; several countries can share a prefix. |
| Currency | Lookup | Optional | The currency the country mainly uses. Chosen from the currency list; used to suggest a currency on records for the country. A country has at most one main currency; a currency can be the main one of many countries. Lets a default currency follow the country chosen on an address. Pick a record from **Currency**. |

## How it connects to other records
- A country has many **Address** records.
- A country belongs to one **Currency**.
- A country has many **State Province** records.
- A country has many **City** records.

## Who may use it

Anyone who holds a role with access to the **Country** window. Access is granted by role under [Roles and access](/administration/access/).
