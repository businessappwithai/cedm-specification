---
title: "Purchase Requisition"
sidebar_label: "Purchase Requisition"
sidebar_position: 24
description: "Represents one measurable internal procurement demand before it becomes an external supplier commitment."
---

# Purchase Requisition

Represents one measurable internal procurement demand before it becomes an external supplier commitment. PurchaseRequisitionLine is where a business need becomes specific enough for procurement to source, approve, compare, and eventually order. It is demand, not yet a purchase obligation. Used by requesters, approvers, buyers, sourcing teams, inventory planners, and procurement workflows. PurchaseRequisition provides internal authorization context. Product and UnitOfMeasure provide meaning to the requested quantity. If approved and sourced, this demand may be transformed into one or more PurchaseOrderLines; the resulting order line is a separate commercial commitment and must retain traceability to the originating demand. A line begins as requested demand, participates in requisition review and approval, may be sourced or rejected, and may result in a purchase-order commitment. A requisition line can be partially ordered when demand is fulfilled through multiple suppliers, deliveries, or purchase orders. A depot technician requests 20 replacement door seals needed by a specified date. The line references the standardized seal Product and its unit, while the description records the equipment/application requirement. Procurement may source the demand from an approved Supplier and create a PurchaseOrderLine for the quantity actually committed.

## Finding records

Lines are added from the parent: open a **Purchase Requisition** and choose the **Purchase Requisition** tab.

The list shows Line Number, Quantity, Requested Date, Description, Requisition, Product, Unit Of Measure, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Purchase Requisition** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | The business sequence number identifying the demand line within its PurchaseRequisition. Used by requesters, approvers, buyers, documents, and integrations to refer to a specific requested item or service. Meaningful only within the containing requisition; it is not a global identifier. Required for human-readable requisition processing. |
| Quantity | Amount | Required | The quantity of goods, materials, assets, or service units requested by the requester. Used for approval, sourcing, supplier quotation, planning, and eventual conversion into a purchase commitment. Quantity requires Product and UnitOfMeasure context to be meaningful and may differ from the quantity eventually ordered. Required because procurement demand must state the requested magnitude. |
| Requested Date | Date | Optional | The date by which the requester needs the requested goods or service to be available or completed. Used for prioritization, sourcing, purchasing lead-time analysis, supplier selection, and delivery planning. This is an internal need date and is distinct from the PurchaseOrder requestedDeliveryDate, Supplier promise date, and actual receipt date. Optional when the requester has no fixed need-by date. |
| Description | Text | Required, Up to 1000 characters | The human-readable description of the requested item or service, including requirements that may not be represented by the Product reference alone. Used by approvers and buyers to understand the demand, obtain quotations, clarify specifications, and communicate requirements to suppliers. Description supplements Product; it must not silently replace a known Product identity when standardized master data exists. Required because procurement demand must remain understandable even when product master data is incomplete. |
| Requisition | Lookup | Required | Identifies the PurchaseRequisition that owns this internal procurement demand. Supplies requester, organization, approval, supplier preference, and requisition lifecycle context. Every requisition line belongs to exactly one PurchaseRequisition. The parent requisition controls the internal authorization context; the line provides the measurable demand. Pick a record from **Purchase Requisition**. |
| Product | Lookup | Optional | Identifies the standardized Product being requested when the demand can be expressed using product master data. Enables sourcing, catalog selection, inventory checks, specification validation, and conversion to a PurchaseOrderLine. Zero or one Product may be referenced because some requisitions begin as free-text or service requirements. A missing Product does not invalidate the demand; it indicates that purchasing may need to identify or create the appropriate product definition. Pick a record from **Product**. |
| Unit Of Measure | Lookup | Optional | Defines the unit in which the requested quantity is expressed. Used to interpret quantities during approval, sourcing, quotation comparison, ordering, receipt, and conversion. Zero or one unit may be specified; the product's default unit may be inherited where applicable. UnitOfMeasure gives semantic meaning to quantity and supports conversion when the ordered unit differs from the requested unit. Pick a record from **Unit Of Measure**. |

## How it connects to other records

A purchase requisition is a line of a **Purchase Requisition**. It has no window of its own: open the purchase requisition and use the **Purchase Requisition** tab to see and add lines.
- A purchase requisition belongs to one **Purchase Requisition**.
- A purchase requisition belongs to one **Product**.
- A purchase requisition belongs to one **Unit Of Measure**.
- A purchase requisition has many **Request For Quotation** records.
- A purchase requisition has many **Purchase Order** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Purchase requisition line invariants before create | before a purchase requisition is created | 100 |
| Purchase requisition line invariants before update | before a purchase requisition is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Purchase Requisition** window. Access is granted by role under [Roles and access](/administration/access/).
