---
title: "Shipment"
sidebar_label: "Shipment"
sidebar_position: 24
description: "Line-level logistics execution connecting commercial demand to physical transport and inventory evidence."
---

# Shipment

Line-level logistics execution connecting commercial demand to physical transport and inventory evidence. ShipmentLine says what quantity moved in logistics; InventoryMovement says what happened to stock. Outbound fulfillment, inbound transport, transfers, returns, carrier operations, claims, and audit. Shipment supplies logistics context; order lines supply demand/commitment; InventoryMovement supplies stock effects. Planned → dispatched → delivered or exception/cancellation according to parent shipment. Quantity or source-line changes revalidate allocation, inventory, receiving, fulfillment, and delivery workflows.

## Finding records

Lines are added from the parent: open a **Shipment** and choose the **Shipment** tab.

The list shows Line Number, Planned Quantity, Dispatched Quantity, Delivered Quantity, Shipment, Product, Unit Of Measure, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Shipment** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Sequence within the shipment. Human-facing reference for shipped material. Packing, carrier documents, delivery, and audit. Unique within Shipment. Required. |
| Planned Quantity | Amount | Required | Quantity planned for logistics execution. Defines intended transport quantity before dispatch. Allocation, packing, capacity, and fulfillment. Must be compatible with product/UOM and eligible source demand. Required. |
| Dispatched Quantity | Amount | Required | Quantity physically dispatched. Records logistics execution quantity. Fulfillment and inventory reconciliation. Must reconcile with attributable issue/transfer movements. Required. |
| Delivered Quantity | Amount | Required | Quantity evidenced as delivered. Records transport completion at line level. Delivery confirmation, fulfillment, claims, and service. Delivery evidence does not itself post inventory or settle invoices. Required. |
| Shipment | Lookup | Required | Parent logistics movement. Supplies route, carrier, type, and lifecycle. Transport execution. Exactly one shipment. Controls dispatch and delivery progression. Pick a record from **Shipment**. |
| Product | Lookup | Required | Product being transported. Identifies material represented by quantities. Fulfillment and inventory traceability. Exactly one product. Must reconcile with source order and inventory events. Pick a record from **Product**. |
| Unit Of Measure | Lookup | Optional | Unit qualifying shipment quantities. Gives quantity semantics. Conversion, fulfillment, and audit. Optional when inherited unambiguously. Must be compatible with product and source transaction. Pick a record from **Unit Of Measure**. |
| Sales Order Line | Lookup | Optional | Outbound demand fulfilled by this line. Preserves exact sales fulfillment provenance. Order fulfillment and customer service. Optional for non-sales shipments. Delivered/dispatched quantities contribute only through governed fulfillment. Pick a record from **Sales Order**. |

## How it connects to other records

A shipment is a line of a **Shipment**. It has no window of its own: open the shipment and use the **Shipment** tab to see and add lines.
- A shipment belongs to one **Shipment**.
- A shipment belongs to one **Product**.
- A shipment belongs to one **Unit Of Measure**.
- A shipment belongs to one **Sales Order**.
- A shipment has many **Inventory Movement** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Shipment line invariants before create | before a shipment is created | 100 |
| Shipment line invariants before update | before a shipment is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Shipment** window. Access is granted by role under [Roles and access](/administration/access/).
