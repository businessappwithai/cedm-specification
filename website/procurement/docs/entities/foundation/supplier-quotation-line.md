---
title: "Supplier Quotation"
sidebar_label: "Supplier Quotation"
sidebar_position: 29
description: "Line-level supplier offer used for sourcing comparison and controlled conversion to purchase commitment."
---

# Supplier Quotation

Line-level supplier offer used for sourcing comparison and controlled conversion to purchase commitment. SupplierQuotationLine is commercial evidence, while PurchaseOrderLine is the binding procurement commitment. Bid comparison, negotiation, split award, purchase-order generation, compliance, and audit. Answers RequestForQuotationLine and may produce one or more PurchaseOrderLines. Received → evaluated → accepted/partially accepted/rejected → retained as sourcing evidence. Offer or award changes revalidate downstream unissued commitments; issued commitments require controlled amendments.

## Finding records

Lines are added from the parent: open a **Supplier Quotation** and choose the **Supplier Quotation** tab.

The list shows Line Number, Offered Quantity, Unit Price, Promised Date, Award Status, Request For Quotation Line, Supplier Quotation, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Supplier Quotation** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Sequence within the supplier quotation. Human-facing offer-line reference. Comparison and supplier communication. Unique within SupplierQuotation. Required. |
| Offered Quantity | Amount | Required | Quantity the supplier offers to provide. States supply coverage for the RFQ requirement. Award allocation and order conversion. Interpreted using UnitOfMeasure. Required. |
| Unit Price | Amount | Required | Transaction-time offered unit price. Preserves the supplier's commercial offer for comparison and later verification. Bid analysis, negotiation, award, and purchase-order pricing. Historical offer evidence rather than mutable supplier master pricing. Required. |
| Promised Date | Date | Optional | Supplier's offered delivery or completion date. Records the delivery promise used during award evaluation. Lead-time comparison and order conversion. Distinct from actual receipt date. Optional when no date is offered. |
| Award Status | Choice | Required | Award state of this offer line. Records whether and to what extent this response was selected. Award workflow and split sourcing. Selection authorizes conversion but does not itself create a PurchaseOrderLine. Not yet decided. Selected for the governed quantity. Selected for part of offered quantity. Not selected. Required. Choose one: Pending, Accepted, Partially accepted, Rejected. |
| Request For Quotation Line | Lookup | Required | Exact sourcing requirement answered. Enables like-for-like line comparison. Award analysis and traceability. Exactly one RFQ line is answered. Supplies requested product and quantity context. Pick a record from **Request For Quotation**. |
| Supplier Quotation | Lookup | Required | Parent supplier offer. Supplies supplier, validity, and response lifecycle. Sourcing governance and audit. Exactly one parent quotation. Controls offer eligibility. Pick a record from **Supplier Quotation**. |
| Product | Lookup | Optional | Product offered. Confirms or proposes the item satisfying the requirement. Technical/commercial comparison. Optional for service/free-text requirements. Must satisfy approved substitution policy. Pick a record from **Product**. |
| Unit Of Measure | Lookup | Optional | Unit qualifying offered quantity and price. Makes offer quantities commercially comparable. Normalization and order conversion. Optional only where unambiguous. Conversion must use governed UOM rules. Pick a record from **Unit Of Measure**. |

## How it connects to other records

A supplier quotation is a line of a **Supplier Quotation**. It has no window of its own: open the supplier quotation and use the **Supplier Quotation** tab to see and add lines.
- A supplier quotation belongs to one **Request For Quotation**.
- A supplier quotation belongs to one **Supplier Quotation**.
- A supplier quotation belongs to one **Product**.
- A supplier quotation belongs to one **Unit Of Measure**.
- A supplier quotation has many **Purchase Order** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Supplier quotation line invariants before create | before a supplier quotation is created | 100 |
| Supplier quotation line invariants before update | before a supplier quotation is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Supplier Quotation** window. Access is granted by role under [Roles and access](/administration/access/).
