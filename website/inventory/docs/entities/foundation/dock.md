---
title: "Warehouse"
sidebar_label: "Warehouse"
sidebar_position: 26
description: "Warehouse loading/receiving execution resource."
---

# Warehouse

Warehouse loading/receiving execution resource. Dock is a physical process resource, not an inventory location unless separately represented by stagingLocation. Inbound, outbound, cross-dock, appointment, staging and loading workflows. Warehouse owns operational context; InventoryLocation supplies stock-control context; Shipment supplies transport work. Configured → active/restricted → retired with historical execution retained.

## Finding records

Lines are added from the parent: open a **Warehouse** and choose the **Warehouse** tab.

The list shows Dock Code, Dock Type, Warehouse, Staging Location, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

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
| Dock Code | Text | Required, Up to 100 characters | Operational dock code. Human/scanner identifier for the physical position. Yard and warehouse execution. Unique within Warehouse. Required. |
| Dock Type | Choice | Required | Allowed dock operating purpose. Controls eligible receiving/shipping work. Scheduling and execution. Warehouse policy may add constraints. Receiving-focused. Shipping-focused. Supports both directions. Supports direct inbound-to-outbound flow. Required. Choose one: Inbound, Outbound, Bidirectional, Cross dock. |
| Warehouse | Lookup | Required | Parent warehouse. Supplies facility context. Dock scheduling and control. Exactly one Warehouse. Warehouse status constrains dock use. Pick a record from **Warehouse**. |
| Staging Location | Lookup | Optional | Default inventory staging position associated with dock. Connects loading resource to stock-control location. Receiving and shipping staging. Optional. Physical stock changes still require InventoryMovement. Pick a record from **Warehouse**. |

## How it connects to other records

A warehouse is a line of a **Warehouse**. It has no window of its own: open the warehouse and use the **Warehouse** tab to see and add lines.
- A warehouse belongs to one **Warehouse**.

## Who may use it

Anyone who holds a role with access to the **Warehouse** window. Access is granted by role under [Roles and access](/administration/access/).
