---
title: "Warehouse"
sidebar_label: "Warehouse"
sidebar_position: 25
description: "Operational grouping between Warehouse and InventoryLocation."
---

# Warehouse

Operational grouping between Warehouse and InventoryLocation. Warehouse is the facility, WarehouseZone is the process/storage area, InventoryLocation is the stock-control position. Receiving, putaway, reserve/pick storage, quarantine, returns, staging and shipping. Zone rules guide InventoryTransfer and WMS tasks but do not themselves alter inventory. Configured → active/restricted → retired while historical transactions retain zone context. Zone control changes revalidate future putaway/picking/transfer destinations without rewriting completed movements.

## Finding records

Lines are added from the parent: open a **Warehouse** and choose the **Warehouse** tab.

The list shows Zone Code, Zone Type, Warehouse, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Warehouse** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Zone Code | Text | Required, Up to 100 characters | Human-facing zone code. Operational identifier used by warehouse workers and systems. Routing, labels and reporting. Unique within Warehouse. Required. |
| Zone Type | Choice | Required | Primary operational purpose of zone. Governs eligible warehouse processes and stock. Putaway/picking routing and compliance. Location-level controls may further restrict eligibility. Inbound receiving area. Bulk/reserve storage. Forward picking area. Temporary process staging. Outbound dispatch area. Restricted inventory pending disposition. Reverse-logistics processing. Temperature-controlled storage. Controlled hazardous-material area. General-purpose storage/handling. Required. Choose one: Receiving, Reserve, Picking, Staging, Shipping, Quarantine, Returns, Cold storage, Hazardous, General. |
| Warehouse | Lookup | Required | Parent warehouse. Supplies facility and operating context. WMS hierarchy. Exactly one Warehouse. Warehouse status constrains zone use. Pick a record from **Warehouse**. |

## How it connects to other records

A warehouse is a line of a **Warehouse**. It has no window of its own: open the warehouse and use the **Warehouse** tab to see and add lines.
- A warehouse has many **Warehouse** records.
- A warehouse belongs to one **Warehouse**.

## Who may use it

Anyone who holds a role with access to the **Warehouse** window. Access is granted by role under [Roles and access](/administration/access/).
