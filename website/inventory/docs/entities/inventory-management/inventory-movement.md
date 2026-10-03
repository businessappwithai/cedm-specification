---
title: "Inventory Movement"
sidebar_label: "Inventory Movement"
sidebar_position: 3
description: "Represents one auditable change to inventory state, including stock reductions caused by supplier returns."
---

# Inventory Movement

Represents one auditable change to inventory state, including stock reductions caused by supplier returns. InventoryMovement is the event ledger from which InventoryBalance is maintained. SupplierReturnLine is the operational authorization for supplier-return quantity; InventoryMovement is the physical stock consequence. Receiving, warehouse execution, procurement, order fulfillment, maintenance, customer and supplier returns, stock counting, reconciliation and analytics. Product identifies what is stocked. InventoryLocation identifies where. InventoryBalance is current state. InventoryMovement is historical event evidence. GoodsReceiptLine explains original accepted receipt. SupplierReturnLine explains later return quantity. SupplierCreditNote explains financial consequence separately. GoodsReceiptLine accepted → RECEIPT movement → InventoryBalance increase. Later SupplierReturn authorization → SupplierReturnLine execution → attributable ISSUE/RETURN movement reducing internal stock → SupplierCreditNote financial adjustment → payable application. Customer returns remain separately attributable through their own return workflow. Prepared → validated → posted → immutable history. Errors use compensating events. SupplierReturn quantity or disposition changes require movement eligibility/reconciliation before posting. Posted movement changes require reversal or compensating movement, never destructive editing. Ten accepted units are returned to a supplier from RACK-A. A movement records the exact quantity and source location and references SupplierReturnLine. A retry of the workflow does not create a second reduction. The supplier credit is accounted for separately.

## Finding records

Open **Inventory Movement** from the menu or from its card on the dashboard.

![The Inventory Movement list](/img/entities/inventory-movement-list.jpg)

The list shows Movement Number, Movement Type, Quantity, Movement Date, Reason, Unit Of Measure, Inventory Balance, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Inventory Movement form](/img/entities/inventory-movement-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Movement Number**, **Movement Type**, **Quantity**, **Movement Date**, **Product**.
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
| Movement Number | Text | Required, Unique, Up to 100 characters | Human-facing inventory movement reference. Used by warehouse operators, inventory controllers, auditors and integrations. Distinct from Product and source transaction numbers. Traces stock change from execution through reconciliation. Required. |
| Movement Type | Choice | Required | Identifies inventory operation and state transition. Determines how on-hand, reserved, available and location balances change. Movement type describes inventory effect; relatedTransaction and supplierReturnLine explain business reason where applicable. Maps business workflow outcomes to inventory ledger. Accepted inbound quantity becomes inventory at a target location. Quantity leaves available inventory for shipment, consumption, maintenance, production or authorized outbound use. Quantity moves between inventory locations. Quantity is corrected through approved reconciliation. Previously controlled quantity is returned or otherwise processed under return semantics. Quantity is committed to demand without physical movement. Previous reservation is removed. Required. Choose one: Receipt, Issue, Transfer, Adjustment, Return, Reservation, Release. |
| Quantity | Amount | Required | Quantity affected by the inventory event. Drives balance changes and allocation calculations. Interpreted with Product, UOM, movementType and source/target locations. Changes physical quantity for receipt/issue/transfer/return and commitment state for reservation/release. Required. |
| Movement Date | Date and time | Required | Timestamp at which inventory event is recognized. Stock history, period-end balances, reporting, audit and reconciliation. Distinct from source order date and record creation timestamp. Establishes effective chronology. Required. |
| Reason | Text | Up to 500 characters | Business explanation for movement. Audit, investigation, approval and reporting. Supplements movementType and source relationships. Especially important for adjustments, returns and exceptions. Optional when source context fully explains event. |
| Unit Of Measure | Lookup | Optional | The UnitOfMeasure this InventoryMovement belongs to. Pick a record from **Unit Of Measure**. |
| Inventory Balance | Lookup | Optional | The InventoryBalance this InventoryMovement belongs to. Pick a record from **Inventory Location**. |
| Product | Lookup | Required | Product whose inventory state is affected. Connects event to product master, units and policies. Exactly one product is affected. Identifies stock item. Pick a record from **Product**. |
| Source Location | Lookup | Optional | Location from which inventory is removed or transferred. Transfer, issue and return-to-supplier reconciliation. Optional for inbound movements from outside network. Required when stock leaves an internal location. Pick a record from **Warehouse**. |
| Party | Lookup | Optional | Party associated with inventory event when ownership or custody matters. Supplier receipts, customer returns, consignment and audit. Optional for internal movements. Connects event to external party. Pick a record from **Party**. |
| Lot | Lookup | Optional | Lot identity carried by this movement when the Product is lot-controlled. Preserves batch genealogy through every stock event. Traceability, expiry, quality, recall, and reconciliation. Optional for products not requiring lot control. Lot Product and movement Product must agree. Pick a record from **Lot**. |
| Inventory Transfer | Lookup | Optional | Transfer authorization causing this relocation event. Explains source/target relocation purpose. Transfer reconciliation and audit. Optional outside controlled transfer. Product, locations, quantity, lot and serial must reconcile. Pick a record from **Inventory Transfer**. |

## How it connects to other records
- A inventory movement belongs to one **Unit Of Measure**.
- A inventory movement belongs to one **Inventory Location**.
- A inventory movement belongs to one **Product**.
- A inventory movement belongs to one **Warehouse**.
- A inventory movement belongs to one **Party**.
- A inventory movement belongs to one **Lot**.
- A inventory movement is linked to many **Serial Number** records.
- A inventory movement belongs to one **Inventory Transfer**.
- A inventory movement has one **Inventory Adjustment**.

## Who may use it

Anyone who holds a role with access to the **Inventory Movement** window. Access is granted by role under [Roles and access](/administration/access/).
