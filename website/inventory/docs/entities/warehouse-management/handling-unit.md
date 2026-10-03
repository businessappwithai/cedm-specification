---
title: "Handling Unit"
sidebar_label: "Handling Unit"
sidebar_position: 1
description: "Physical logistics identity for grouping and moving inventory."
---

# Handling Unit

Physical logistics identity for grouping and moving inventory. HandlingUnit represents the package/pallet/tote being handled; InventoryMovement remains authoritative for stock quantity/location. Receiving, putaway, replenishment, picking, packing, staging, loading, shipment and tracking. Can occupy InventoryLocation, nest inside another HandlingUnit and join Shipment. Created/received → stored/moved → picked/packed → staged/shipped → unpacked/closed or reused. Location/shipment/nesting changes must reconcile with warehouse execution and cannot silently move underlying stock.

## Finding records

Open **Handling Unit** from the menu or from its card on the dashboard.

![The Handling Unit list](/img/entities/handling-unit-list.jpg)

The list shows Handling Unit Number, Type, Inventory Location, Parent Handling Unit, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Handling Unit form](/img/entities/handling-unit-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Handling Unit Number**, **Type**.
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
| Handling Unit Number | Text | Required, Unique, Up to 150 characters | Scannable operational handling-unit reference. Label/barcode identifier used in physical execution. WMS scanning and logistics documents. Distinct from Shipment or inventory movement number. Required. |
| Type | Choice | Required | Physical handling-unit classification. Describes packaging/handling form. Capacity, equipment, packing and carrier planning. Does not determine contents by itself. Palletized logistics unit. Carton/box. Reusable tote/bin. Roll cage or similar unit. Drum/container. General package. Governed other type. Required. Choose one: Pallet, Carton, Tote, Cage, Drum, Package, Other. |
| Inventory Location | Lookup | Optional | Current warehouse location when stored. Provides operational custody position. Putaway, picking and count. Optional while in transit/shipped. Changes must reconcile to execution evidence. Pick a record from **Warehouse**. |
| Parent Handling Unit | Lookup | Optional | Outer handling unit containing this unit. Supports pallet/carton/tote nesting. Packing and logistics hierarchy. At most one parent. Nesting must remain acyclic. Pick a record from **Parent Handling Unit**. |

## How it connects to other records
- A handling unit belongs to one **Warehouse**.
- A handling unit has many **Handling Unit** records.
- A handling unit has many **Putaway** records.
- A handling unit has many **Picking** records.
- A handling unit has many **Packing** records.

## Who may use it

Anyone who holds a role with access to the **Handling Unit** window. Access is granted by role under [Roles and access](/administration/access/).
