---
title: "Purchase Order"
sidebar_label: "Purchase Order"
sidebar_position: 27
description: "Represents one measurable procurement commitment and its accumulated fulfillment, billing and reverse-fulfillment state."
---

# Purchase Order

Represents one measurable procurement commitment and its accumulated fulfillment, billing and reverse-fulfillment state. PurchaseOrderLine states what the buyer committed to purchase. GoodsReceiptLine records receipt. SupplierReturnLine records subsequent reversal. InvoiceLine records supplier claim. Purchasing, supplier communication, receiving, inventory, supplier returns, accounts payable, budgeting and three-way matching. PurchaseOrder supplies supplier and commercial context; GoodsReceiptLine supplies accepted fulfillment; SupplierReturnLine supplies reverse quantity; SupplierCreditNoteLine supplies financial adjustment. Pricing → commitment → receipt → acceptance → InventoryMovement; if goods are returned, eligible accepted quantity → SupplierReturnLine → InventoryMovement reversal → SupplierCreditNoteLine. Historical commitment remains unchanged. Created → approved/issued → partially/fully received → optionally partially/fully returned → billed/closed according to policy. Historical commercial evidence remains reproducible. A line commits to 100 units, 94 are accepted, and three are later returned. receivedQuantity remains the receipt projection, acceptedQuantity remains accepted fulfillment evidence, returnedQuantity becomes three from posted return events, and the original quantity/price remain unchanged.

## Finding records

Lines are added from the parent: open a **Purchase Order** and choose the **Purchase Order** tab.

The list shows Line Number, Quantity, Unit Price, Line Amount, Received Quantity, Accepted Quantity, Returned Quantity, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Purchase Order** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | The line number of the purchase order line: a whole number the business records on it. Entered or maintained when a purchase order line is created or changed; shown on its form and available to search and reports. Read together with the purchase order line's other fields and its relationships; it is not meaningful on its own. Required: a purchase order line cannot be understood without its line number. |
| Quantity | Amount | Required | The quantity of the purchase order line: a number the business records on it. Entered or maintained when a purchase order line is created or changed; shown on its form and available to search and reports. Read together with the purchase order line's other fields and its relationships; it is not meaningful on its own. Required: a purchase order line cannot be understood without its quantity. |
| Unit Price | Amount | Required | The unit price of the purchase order line: a value the business records on it. Entered or maintained when a purchase order line is created or changed; shown on its form and available to search and reports. Read together with the purchase order line's other fields and its relationships; it is not meaningful on its own. Required: a purchase order line cannot be understood without its unit price. |
| Line Amount | Amount | Required | The line amount of the purchase order line: a value the business records on it. Entered or maintained when a purchase order line is created or changed; shown on its form and available to search and reports. Read together with the purchase order line's other fields and its relationships; it is not meaningful on its own. Required: a purchase order line cannot be understood without its line amount. |
| Received Quantity | Amount | Required | The received quantity of the purchase order line: a number the business records on it. Entered or maintained when a purchase order line is created or changed; shown on its form and available to search and reports. Read together with the purchase order line's other fields and its relationships; it is not meaningful on its own. Required: a purchase order line cannot be understood without its received quantity. |
| Accepted Quantity | Amount | Required | The accepted quantity of the purchase order line: a number the business records on it. Entered or maintained when a purchase order line is created or changed; shown on its form and available to search and reports. Read together with the purchase order line's other fields and its relationships; it is not meaningful on its own. Required: a purchase order line cannot be understood without its accepted quantity. |
| Returned Quantity | Amount | Required | The returned quantity of the purchase order line: a number the business records on it. Entered or maintained when a purchase order line is created or changed; shown on its form and available to search and reports. Read together with the purchase order line's other fields and its relationships; it is not meaningful on its own. Required: a purchase order line cannot be understood without its returned quantity. |
| Outstanding Quantity | Amount | Required | The outstanding quantity of the purchase order line: a number the business records on it. Entered or maintained when a purchase order line is created or changed; shown on its form and available to search and reports. Read together with the purchase order line's other fields and its relationships; it is not meaningful on its own. Required: a purchase order line cannot be understood without its outstanding quantity. |
| Price Source | Choice | Optional | Source used to determine procurement price. Supports audit, spend analysis and supplier negotiations. Does not replace transaction-time unitPrice. Explains price determination. The price source of the purchase order line is price list; set it when that is what the business means for this record. The price source of the purchase order line is contract; set it when that is what the business means for this record. The price source of the purchase order line is supplier agreement; set it when that is what the business means for this record. The price source of the purchase order line is quotation; set it when that is what the business means for this record. The price source of the purchase order line is manual; set it when that is what the business means for this record. The price source of the purchase order line is other; set it when that is what the business means for this record. Choose one: Price list, Contract, Supplier agreement, Quotation, Manual, Other. |
| Price Determined At | Date and time | Optional | Time at which effective purchase price was determined. Supports effective-dated pricing and audit. Distinct from PurchaseOrder creation time. Anchors commercial pricing evidence. |
| Unit Of Measure | Lookup | Optional | Unit used to quantify the commitment. Defines how quantity is interpreted. Must reconcile with receiving and return conversions. Pick a record from **Unit Of Measure**. |
| Purchase Order | Lookup | Required | Parent procurement commitment. Supplies supplier, organization, currency and lifecycle context. Controls commitment and closure. Pick a record from **Purchase Order**. |
| Product | Lookup | Required | Product or item being procured. Identifies what was committed. Must reconcile across receipt, return and invoice evidence. Pick a record from **Product**. |

## How it connects to other records

A purchase order is a line of a **Purchase Order**. It has no window of its own: open the purchase order and use the **Purchase Order** tab to see and add lines.
- A purchase order belongs to one **Unit Of Measure**.
- A purchase order belongs to one **Purchase Order**.
- A purchase order has many **Invoice** records.
- A purchase order belongs to one **Product**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Purchase order line invariants before create | before a purchase order is created | 100 |
| Purchase order line invariants before update | before a purchase order is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Purchase Order** window. Access is granted by role under [Roles and access](/administration/access/).
