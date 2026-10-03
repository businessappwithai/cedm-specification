---
title: "Request For Quotation"
sidebar_label: "Request For Quotation"
sidebar_position: 25
description: "Line-level bridge from approved procurement demand to comparable supplier offers."
---

# Request For Quotation

Line-level bridge from approved procurement demand to comparable supplier offers. The RFQ header controls the sourcing event; this line defines exactly what is being sourced. Strategic sourcing, competitive bids, services procurement, award allocation, and audit. PurchaseRequisitionLine supplies demand; SupplierQuotationLine supplies responses; PurchaseOrderLine executes awarded commitment. Prepared with RFQ, issued for response, closed/awarded with sourcing event, retained historically. Issued-line changes revalidate supplier responses and downstream awards without rewriting historical submissions.

## Finding records

Lines are added from the parent: open a **Request For Quotation** and choose the **Request For Quotation** tab.

The list shows Line Number, Requested Quantity, Description, Requisition Line, Request For Quotation, Product, Unit Of Measure, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Request For Quotation** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Business sequence within the RFQ. Human-facing reference for the requirement. Supplier communication, response matching, and audit. Unique within the parent RFQ. Required. |
| Requested Quantity | Amount | Required | Quantity suppliers are requested to quote. Defines the sourcing magnitude for this requirement. Bid comparison and award allocation. Must reconcile with originating requisition demand and UOM. Required. |
| Description | Text | Required, Up to 2000 characters | Sourcing description and requirement detail. Communicates what suppliers must price or propose. Solicitation and comparison. Supplements Product and originating demand. Required. |
| Requisition Line | Lookup | Optional | Approved internal demand being sourced. Preserves exact demand provenance. Demand reconciliation and audit. Optional only for authorized sourcing not originating from a requisition line. Supplies requested product, quantity, and need context. Pick a record from **Purchase Requisition**. |
| Request For Quotation | Lookup | Required | Parent sourcing solicitation. Supplies invited suppliers, deadlines, and sourcing lifecycle. RFQ execution and audit. Exactly one parent RFQ. Controls solicitation lifecycle. Pick a record from **Request For Quotation**. |
| Product | Lookup | Optional | Standardized product being sourced. Identifies the requested item when master data exists. Supplier comparison and order conversion. Optional for free-text services. Must reconcile with originating demand. Pick a record from **Product**. |
| Unit Of Measure | Lookup | Optional | Unit qualifying requestedQuantity. Makes sourcing quantity comparable. Quote normalization and conversion. Optional only when quantity semantics are otherwise unambiguous. Supports compatible quotation and order units. Pick a record from **Unit Of Measure**. |

## How it connects to other records

A request for quotation is a line of a **Request For Quotation**. It has no window of its own: open the request for quotation and use the **Request For Quotation** tab to see and add lines.
- A request for quotation belongs to one **Purchase Requisition**.
- A request for quotation belongs to one **Request For Quotation**.
- A request for quotation belongs to one **Product**.
- A request for quotation belongs to one **Unit Of Measure**.
- A request for quotation has many **Supplier Quotation** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Request for quotation line invariants before create | before a request for quotation is created | 100 |
| Request for quotation line invariants before update | before a request for quotation is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Request For Quotation** window. Access is granted by role under [Roles and access](/administration/access/).
