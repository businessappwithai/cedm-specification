---
title: "Product Attribute"
sidebar_label: "Product Attribute"
sidebar_position: 2
description: "Reusable semantic definition of a product characteristic."
---

# Product Attribute

Reusable semantic definition of a product characteristic. ProductAttribute defines what a characteristic means; product/variant data supplies its value. PIM, catalog, configuration, search, procurement, sales and integration. Supports Product and ProductVariant without replacing category, brand or quality characteristics. Governed definition evolves through controlled version/change management.

## Finding records

Open **Product Attribute** from the menu or from its card on the dashboard.

![The Product Attribute list](/img/entities/product-attribute-list.jpg)

The list shows Code, Name, Value Type, Variant Defining, Product, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Product Attribute form](/img/entities/product-attribute-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Name**, **Value Type**, **Variant Defining**.
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
| Code | Text | Required, Unique, Up to 100 characters | Governed attribute code. Stable business/integration identifier. PIM schemas and APIs. Unique across governed attribute namespace. Required. |
| Name | Text | Required, Up to 300 characters | Human-readable attribute name. Explains characteristic to users. Forms, catalog and search. Presentation metadata for stable definition. Required. |
| Value Type | Choice | Required | Permitted value representation. Controls how values are validated/interpreted. PIM validation and UI generation. ENUM/REFERENCE require governed supporting semantics. Text value. Whole number. Numeric decimal. True/false. Calendar date. Timestamp. Controlled choice. Reference to governed master. Required. Choose one: String, Integer, Decimal, Boolean, Date, Datetime, Enum, Reference. |
| Variant Defining | Yes / No | Required | Whether attribute participates in variant uniqueness. Distinguishes configuration options from descriptive attributes. Variant generation and validation. Variant-defining values form a unique configuration under Product. Required. |
| Product | Lookup | Optional | The Product this ProductAttribute belongs to. Pick a record from **Product**. |

## How it connects to other records
- A product attribute belongs to one **Product**.

## Who may use it

Anyone who holds a role with access to the **Product Attribute** window. Access is granted by role under [Roles and access](/administration/access/).
