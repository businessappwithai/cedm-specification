---
title: "Goods Receipt"
sidebar_label: "Goods Receipt"
sidebar_position: 11
description: "Provides the line-level bridge between ordered quantity, received quantity, accepted inventory, supplier invoice matching and later supplier returns."
---

# Goods Receipt

Provides the line-level bridge between ordered quantity, received quantity, accepted inventory, supplier invoice matching and later supplier returns. GoodsReceiptLine is the actual receipt result. PurchaseOrderLine is commitment. InventoryMovement is stock consequence. InvoiceLine is financial claim. SupplierReturnLine records a later reversal of eligible accepted quantity. Receiving, quality, procurement, inventory, supplier management, accounts payable, invoice matching, supplier returns and audit. PurchaseOrderLine defines ordered product/quantity/price. Accepted receipt creates inventory and fulfillment consequences. Invoice matching relies on accepted evidence. SupplierReturnLine consumes remaining eligible accepted quantity and SupplierCreditNoteLine may record financial reduction. PurchaseOrderLine → GoodsReceiptLine → inspection/disposition → accepted → InventoryMovement/InventoryBalance and PO fulfillment. Later eligible accepted quantity → SupplierReturnLine → attributable inventory reduction → SupplierCreditNoteLine → payable application. Original receipt evidence remains immutable. Draft → recorded → inspected/dispositioned → accepted/rejected/partially accepted → inventory posted → historical evidence. Corrections use compensating events. Receipt posting and supplier-return consumption must use stable line/disposition identities so retries cannot duplicate inventory or returned quantity. A PO orders 100 units. Receipt accepts 94 and rejects 2. Later 10 accepted units are returned. SupplierReturnLine references this receipt line for 10; inventory is reduced by an attributable movement and the original acceptedQuantity remains 94.

## Finding records

Lines are added from the parent: open a **Goods Receipt** and choose the **Goods Receipt** tab.

The list shows Line Number, Received Quantity, Accepted Quantity, Rejected Quantity, Pending Inspection Quantity, Unit Price, Notes, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Goods Receipt** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Sequence number within the receipt. Identifies the receiving line. Documents and audit. Distinct from PurchaseOrderLine and SupplierReturnLine numbering. Supports deterministic receipt reconstruction. Required. |
| Received Quantity | Amount | Required | Quantity physically recorded as received. Preserves original receipt quantity. Receiving and audit. SupplierReturn eligibility is based on accepted quantity, not rejected or pending quantity. Provides physical receipt evidence. Required. |
| Accepted Quantity | Amount | Required | Quantity accepted after receiving controls. Represents quantity eligible for normal inventory posting and normally later supplier return. Inventory, PO fulfillment, matching and supplier returns. SupplierReturnLine quantity cannot normally exceed accepted quantity remaining after prior returns. Provides authoritative eligibility basis. Required. |
| Rejected Quantity | Amount | Required | Quantity rejected at receipt. Records quantity not accepted into normal inventory. Quality and supplier dispute processing. Rejected quantity is not normally eligible for a supplier return because it was not accepted inventory; explicit exception workflows may differ. Provides disposition evidence. Required. |
| Pending Inspection Quantity | Amount | Required | Quantity awaiting inspection or disposition. Records unresolved receipt quantity. Quality, receiving and inventory controls. Pending quantity cannot normally be returned as accepted stock until controlled disposition establishes eligibility. Blocks premature supplier-return eligibility. Required. |
| Unit Price | Amount | Optional | Procurement price basis applicable at receipt time. Supports receipt valuation, accruals and invoice matching. Normally inherited from PurchaseOrderLine but may reflect authorized receipt-specific adjustment. Provides financial context without replacing PO commitment. |
| Notes | Text | Up to 2000 characters | Receiving notes and line-specific context. Explains exceptions or inspection findings. Operations and audit. Does not replace structured disposition or return evidence. Supports review. Optional. |
| Unit Of Measure | Lookup | Required | Unit used for receipt quantities. Defines measurement semantics. Receiving, inventory and return quantity conversion. Supplies conversion context. Pick a record from **Unit Of Measure**. |
| Purchase Order Line | Lookup | Required | Procurement commitment fulfilled by this receipt line. Connects actual receipt to ordered product and quantity. Fulfillment, matching and return eligibility. Supplies source commitment context. Pick a record from **Purchase Order**. |
| Goods Receipt | Lookup | Required | Parent receipt containing this line. Provides document context for original receipt evidence. Receiving, inventory and audit. Parent receipt controls header lifecycle. Pick a record from **Goods Receipt**. |
| Product | Lookup | Required | Product received on this line. Identifies stock item. Receiving, inventory, quality and returns. Determines item identity for movements and returns. Pick a record from **Product**. |

## How it connects to other records

A goods receipt is a line of a **Goods Receipt**. It has no window of its own: open the goods receipt and use the **Goods Receipt** tab to see and add lines.
- A goods receipt belongs to one **Unit Of Measure**.
- A goods receipt belongs to one **Purchase Order**.
- A goods receipt belongs to one **Goods Receipt**.
- A goods receipt belongs to one **Product**.
- A goods receipt is linked to many **Invoice** records.
- A goods receipt is linked to many **Supplier Return** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Goods receipt line invariants before create | before a goods receipt is created | 100 |
| Goods receipt line invariants before update | before a goods receipt is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Goods Receipt** window. Access is granted by role under [Roles and access](/administration/access/).
