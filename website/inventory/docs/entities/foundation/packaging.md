---
title: "Product"
sidebar_label: "Product"
sidebar_position: 20
description: "Product packaging and pack-quantity master."
---

# Product

Product packaging and pack-quantity master. Packaging describes commercial/logistics containment; HandlingUnit identifies an actual pallet/carton/tote/package occurrence. PIM, procurement, sales, WMS, shipping and labeling. Product defines contents, UOM defines quantity semantics, HandlingUnit represents physical execution instances. Created/activated → revised/retired under controlled master-data change.

## Finding records

Lines are added from the parent: open a **Product** and choose the **Product** tab.

The list shows Code, Quantity Per Package, Product, Unit Of Measure, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Product** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Code | Text | Required, Up to 100 characters | Packaging configuration code. Operational identifier for pack form. Catalog, labels and integration. Unique within applicable Product context. Required. |
| Quantity Per Package | Amount | Required | Product quantity contained in one package. Defines pack conversion. Ordering, storage, picking and shipping. Interpreted with UnitOfMeasure. Required. |
| Product | Lookup | Required | Product packaged. Defines package contents. PIM and logistics. Exactly one Product. Product eligibility applies. Pick a record from **Product**. |
| Unit Of Measure | Lookup | Required | Measurement unit for quantityPerPackage. Makes pack quantity unambiguous. Conversion and validation. Exactly one UOM. Must be compatible with Product quantity semantics. Pick a record from **Unit Of Measure**. |

## How it connects to other records

A product is a line of a **Product**. It has no window of its own: open the product and use the **Product** tab to see and add lines.
- A product belongs to one **Product**.
- A product belongs to one **Unit Of Measure**.

## Who may use it

Anyone who holds a role with access to the **Product** window. Access is granted by role under [Roles and access](/administration/access/).
