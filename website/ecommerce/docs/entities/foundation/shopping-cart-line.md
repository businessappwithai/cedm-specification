---
title: "Shopping Cart"
sidebar_label: "Shopping Cart"
sidebar_position: 20
description: "Represents a ecommerce detail entity called ShoppingCartLine within the CEDM business model."
---

# Shopping Cart

Represents a ecommerce detail entity called ShoppingCartLine within the CEDM business model. ShoppingCartLine is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate ShoppingCartLine records. The entity participates in a wider business graph through relationships with ShoppingCart, Product. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical ShoppingCartLine record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Lines are added from the parent: open a **Shopping Cart** and choose the **Shopping Cart** tab.

The list shows Quantity, Unit Price, Cart, Product, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Shopping Cart** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Quantity | Amount | Required | The amount of the referenced item expressed in the applicable unit of measure. It is used by calculations, inventory, planning, fulfillment, or other quantity-based processes. Used when creating, reviewing, searching, validating, reporting on, or integrating ShoppingCartLine records, where applicable. Its meaning is specific to ShoppingCartLine; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Unit Price | Amount | Optional | Captures the business meaning of unit price for the ShoppingCartLine. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating ShoppingCartLine records, where applicable. Its meaning is specific to ShoppingCartLine; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Cart | Lookup | Required | Connects ShoppingCartLine to ShoppingCart so related business context can be navigated and enforced. Used when processes need to find or reason about ShoppingCart records associated with a ShoppingCartLine. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Shopping Cart**. |
| Product | Lookup | Required | Connects ShoppingCartLine to Product so related business context can be navigated and enforced. Used when processes need to find or reason about Product records associated with a ShoppingCartLine. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Product**. |

## How it connects to other records

A shopping cart is a line of a **Shopping Cart**. It has no window of its own: open the shopping cart and use the **Shopping Cart** tab to see and add lines.
- A shopping cart belongs to one **Shopping Cart**.
- A shopping cart belongs to one **Product**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Shopping cart line invariants before create | before a shopping cart is created | 100 |
| Shopping cart line invariants before update | before a shopping cart is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Shopping Cart** window. Access is granted by role under [Roles and access](/administration/access/).
