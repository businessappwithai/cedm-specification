---
title: "Inventory Location"
sidebar_label: "Inventory Location"
sidebar_position: 11
description: "Current inventory state projection maintained from authoritative inventory events and reservation workflows."
---

# Inventory Location

Current inventory state projection maintained from authoritative inventory events and reservation workflows. InventoryBalance answers the current operational question of what is on hand, reserved and available. InventoryMovement remains the historical ledger; reservation events explain commitment state. Inventory control, warehouse management, order fulfillment, purchasing, maintenance, replenishment, planning and availability. Product defines the stocked item, UnitOfMeasure defines quantity semantics, InventoryLocation defines where stock is held, InventoryMovement records physical/logical stock events, and reservation workflows govern committed quantity. Source transaction → authorization → posted inventory event → InventoryBalance projection. Reservations update commitment state without physical movement. Product/UOM/Location changes trigger dependent-workflow validation rather than direct balance mutation. Allocation and issue must protect against concurrent consumption of the same available quantity using transactional locking, optimistic concurrency or equivalent controls. Created when a Product/location combination becomes inventory-relevant → continuously projected from events → reconciled through controlled stock counts/adjustments → retained at zero when history remains relevant. 100 units are received, 20 are reserved, and 3 are issued. The projection becomes 97 on-hand and, depending on the reservation workflow, 17 reserved and 80 available. If the product UOM conversion later changes, existing stock is not silently reinterpreted; a controlled conversion/reconciliation workflow is required.

## Finding records

Lines are added from the parent: open a **Warehouse** and choose the **Inventory Location** tab.

The list shows Quantity On Hand, Quantity Reserved, Quantity Available, Last Updated At, Product, Inventory Location, Lot, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Inventory Location** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Quantity On Hand | Amount | Required | Physical quantity currently recorded as present at the location. Stock visibility, replenishment, counting, fulfillment and inventory control. Represents physical stock and is distinct from reserved and available quantities. Derived from posted receipt, issue, transfer, return and adjustment movements. |
| Quantity Reserved | Amount | Required | Portion of on-hand stock committed to approved demand. Allocation and fulfillment planning. Reservations normally do not change physical on-hand quantity. Derived from active reservation/release workflows and adjusted when fulfillment consumes or releases a reservation. |
| Quantity Available | Amount | Required | Quantity eligible for new allocation after reservations and applicable restrictions. Availability checks, fulfillment, replenishment and planning. Normally equals on-hand minus reserved before additional restrictions. Must be recalculated atomically with reservation and movement state changes. |
| Last Updated At | Date and time | Required | Timestamp of the latest material projection update. Concurrency, synchronization, cache freshness, audit and integration. Does not replace movement or reservation event timestamps. Supports stale-state detection during allocation and issue processing. |
| Product | Lookup | Required | Links a inventory balance to product, the product it relates to. Chosen from the existing product records when the inventory balance is created or edited. A inventory balance has exactly one product in this role. Lets the inventory balance be found from, and reported with, its product. Pick a record from **Product**. |
| Inventory Location | Lookup | Required | Links a inventory balance to inventory location, the inventory location it relates to. Chosen from the existing inventory location records when the inventory balance is created or edited. A inventory balance has exactly one inventory location in this role. Lets the inventory balance be found from, and reported with, its inventory location. Pick a record from **Warehouse**. |
| Lot | Lookup | Optional | Lot segment represented by this balance when lot-controlled. Separates stock state by batch for quality, expiry, and recall. Allocation, FEFO, recall, and reconciliation. Optional for non-lot-controlled products. Balance must reconcile to lot-attributed movements. Pick a record from **Lot**. |

## How it connects to other records

A inventory location is a line of a **Warehouse**. It has no window of its own: open the warehouse and use the **Inventory Location** tab to see and add lines.
- A inventory location belongs to one **Product**.
- A inventory location belongs to one **Warehouse**.
- A inventory location belongs to one **Lot**.
- A inventory location has many **Inventory Movement** records.
- A inventory location has many **Inventory Reservation** records.

## Who may use it

Anyone who holds a role with access to the **Inventory Location** window. Access is granted by role under [Roles and access](/administration/access/).
