---
title: "Sales Order"
sidebar_label: "Sales Order"
sidebar_position: 22
description: "Authoritative commercial commitment at product/quantity level, reconciling transaction pricing with allocation, fulfillment and billing evidence."
---

# Sales Order

Authoritative commercial commitment at product/quantity level, reconciling transaction pricing with allocation, fulfillment and billing evidence. The line states what the customer agreed to buy and how it is priced. Reservations state committed stock, shipment/fulfillment events state what was delivered, and InvoiceLines state what was billed. Order management, allocation, warehouse fulfillment, shipment, invoicing, credit, margin, customer service and audit. SalesOrder supplies customer/currency context; Product/UOM define item and quantity semantics; InventoryReservation supplies allocation evidence; Shipment supplies transport/fulfillment evidence; InvoiceLine supplies financial claim evidence. Confirmed order line → availability → InventoryReservation → pick/issue → Shipment → accepted fulfillment → quantityFulfilled → billing. Cancellation/reduction releases or reconciles reservations and open shipments before changing remaining demand. Master-data changes trigger controlled revalidation. Draft → confirmed → allocated → partially fulfilled → fulfilled/cancelled. Historical pricing and fulfillment evidence remain reproducible. quantityAllocated follows reservation events; quantityFulfilled follows accepted fulfillment events; SalesOrder status follows line states; InvoiceLine follows billing policy; Product/UOM/pricing changes affect future or explicitly revalidated open work only. Reservation, fulfillment, cancellation and billing allocation require concurrency control and idempotency to prevent double allocation, double fulfillment or double billing. A line requests 20 units. Twenty are reserved, 12 are shipped and accepted, leaving 8 executable. quantityAllocated and quantityFulfilled are updated from their respective workflows. Cancelling the remaining 8 releases the reservation and cancels open work without reversing the accepted 12.

## Finding records

Lines are added from the parent: open a **Sales Order** and choose the **Sales Order** tab.

The list shows Line Number, Quantity, Quantity Fulfilled, Quantity Allocated, Unit Price, Discount Amount, Tax Amount, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Sales Order** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | The line number of the sales order line: a whole number the business records on it. Entered or maintained when a sales order line is created or changed; shown on its form and available to search and reports. Read together with the sales order line's other fields and its relationships; it is not meaningful on its own. Required: a sales order line cannot be understood without its line number. |
| Quantity | Amount | Required | The quantity of the sales order line: a number the business records on it. Entered or maintained when a sales order line is created or changed; shown on its form and available to search and reports. Read together with the sales order line's other fields and its relationships; it is not meaningful on its own. Required: a sales order line cannot be understood without its quantity. |
| Quantity Fulfilled | Amount | Required | The quantity fulfilled of the sales order line: a number the business records on it. Entered or maintained when a sales order line is created or changed; shown on its form and available to search and reports. Read together with the sales order line's other fields and its relationships; it is not meaningful on its own. Required: a sales order line cannot be understood without its quantity fulfilled. |
| Quantity Allocated | Amount | Required | The quantity allocated of the sales order line: a number the business records on it. Entered or maintained when a sales order line is created or changed; shown on its form and available to search and reports. Read together with the sales order line's other fields and its relationships; it is not meaningful on its own. Required: a sales order line cannot be understood without its quantity allocated. |
| Unit Price | Amount | Required | Agreed transaction-time price per unit including currency. Order valuation, invoicing, margin, credit and reconciliation. Must align with SalesOrder currency and UnitOfMeasure pricing basis. Authoritative commercial price for downstream billing unless controlled repricing occurs. |
| Discount Amount | Amount | Optional | Approved transaction-time discount amount. Reconciles net commercial value and invoice calculations. Currency must match order pricing currency. Preserves the concession actually granted rather than relying on current DiscountRule. |
| Tax Amount | Amount | Optional | Tax determined for the order line when tax is calculated at order stage. Supports order and invoice reconciliation. Determination may depend on Product, Customer, address, location, date and TaxRule. Preserves tax evidence when the order commits to a tax amount. |
| Line Amount | Amount | Required | Calculated commercial value of the line. Supports order totals, invoicing, credit and reporting. Must reconcile with pricing, discount, tax and rounding policy. Financial baseline for downstream billing and reconciliation. |
| Price Source | Choice | Optional | The price source of the sales order line: a value the business records on it. Entered or maintained when a sales order line is created or changed; shown on its form and available to search and reports. Read together with the sales order line's other fields and its relationships; it is not meaningful on its own. The price source of the sales order line is price list; set it when that is what the business means for this record. The price source of the sales order line is contract; set it when that is what the business means for this record. The price source of the sales order line is customer agreement; set it when that is what the business means for this record. The price source of the sales order line is quotation; set it when that is what the business means for this record. The price source of the sales order line is manual; set it when that is what the business means for this record. The price source of the sales order line is promotion; set it when that is what the business means for this record. The price source of the sales order line is other; set it when that is what the business means for this record. Choose one: Price list, Contract, Customer agreement, Quotation, Manual, Promotion, Other. |
| Price Determined At | Date and time | Optional | The price determined at of the sales order line: a point in time the business records on it. Entered or maintained when a sales order line is created or changed; shown on its form and available to search and reports. Read together with the sales order line's other fields and its relationships; it is not meaningful on its own. |
| Unit Of Measure | Lookup | Optional | Links a sales order line to unit of measure, the unit of measure it relates to. Chosen from the existing unit of measure records when the sales order line is created or edited. A sales order line has at most one unit of measure in this role. Lets the sales order line be found from, and reported with, its unit of measure. Pick a record from **Unit Of Measure**. |
| Sales Order | Lookup | Required | Links a sales order line to sales order, the sales order it relates to. Chosen from the existing sales order records when the sales order line is created or edited. A sales order line has exactly one sales order in this role. Lets the sales order line be found from, and reported with, its sales order. Pick a record from **Sales Order**. |
| Product | Lookup | Required | Links a sales order line to product, the product it relates to. Chosen from the existing product records when the sales order line is created or edited. A sales order line has exactly one product in this role. Lets the sales order line be found from, and reported with, its product. Pick a record from **Product**. |

## How it connects to other records

A sales order is a line of a **Sales Order**. It has no window of its own: open the sales order and use the **Sales Order** tab to see and add lines.
- A sales order belongs to one **Unit Of Measure**.
- A sales order belongs to one **Sales Order**.
- A sales order belongs to one **Product**.
- A sales order has many **Customer Return** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Sales order line invariants before create | before a sales order is created | 100 |
| Sales order line invariants before update | before a sales order is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Sales Order** window. Access is granted by role under [Roles and access](/administration/access/).
