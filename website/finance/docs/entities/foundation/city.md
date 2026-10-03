---
title: "City"
sidebar_label: "City"
sidebar_position: 8
description: "A city: every national capital and every city of 750 thousand or more, from GeoNames, linked to its country and, for the United States and Canada, to its state or province."
---

# City

A city: every national capital and every city of 750 thousand or more, from GeoNames, linked to its country and, for the United States and Canada, to its state or province. Give every application the same governed list, so a place or code means one thing across the enterprise. A city: every national capital and every city of 750 thousand or more, from GeoNames, linked to its country and, for the United States and Canada, to its state or province. Chosen from the list wherever a record needs a place, code or currency; maintained by an administrator when a registry changes. Referenced by addresses, parties, products and documents; related entities narrow each other (a city belongs to a state or province, which belongs to a country). Seeded from the common CEDM specification; changed only by an administrator, and a retired value stays on the records that carry it. Address capture, party onboarding, tax and trade determination, reporting. A shipping address in a named city, state and country.

## Finding records

Open **City** from the menu or from its card on the dashboard.

![The City list](/img/entities/city-list.jpg)

The list shows Code, Name, Population, Latitude, Longitude, Timezone, Is Capital, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The City form](/img/entities/city-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Name**, **Country**.
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
| Code | Text | Required, Unique, Up to 80 characters | The city's code: its country code and its name in capitals, such as FR-PARIS. Quoted beside the name in lists; integration with other systems. Unique; the country prefix keeps cities of one name in different countries apart. Required. |
| Name | Text | Required, Up to 200 characters | The city's name in English. Shown in lists and on addresses. Not unique: two countries can have a city of one name. Required. |
| Population | Whole number | Optional | The registry's population figure. Ordering and sizing; not a current census count. Describes the city only. |
| Latitude | Amount | Optional | Latitude in degrees, north positive. Maps and distance. Describes the city only. |
| Longitude | Amount | Optional | Longitude in degrees, east positive. Maps and distance. Describes the city only. |
| Timezone | Text | Up to 64 characters | The IANA time zone the city keeps, such as Europe/Paris. Showing local times for the city. Describes the city only. |
| Is Capital | Yes / No | Optional | Whether the city is its country's capital. Highlighting the capital in lists. At most one capital per country in this list. |
| Country | Lookup | Required | The country the city is in. Chosen first; the cities offered are those of that country. Every city belongs to exactly one country. A city is narrowed by its country, and by its state where it has one. Pick a record from **Country**. |
| State Province | Lookup | Optional | The state or province the city is in, where the registry says which. Chosen after the country; narrows the cities offered. A city has at most one state or province; outside the United States and Canada the list leaves it empty. The state of a city must be a division of the city's own country. Pick a record from **State Province**. The choices narrow to the “Country” you have entered. |

## How it connects to other records
- A city has many **Address** records.
- A city belongs to one **Country**.
- A city belongs to one **State Province**.

## Who may use it

Anyone who holds a role with access to the **City** window. Access is granted by role under [Roles and access](/administration/access/).
