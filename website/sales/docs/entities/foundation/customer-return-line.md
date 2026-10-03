---
title: "Customer Return"
sidebar_label: "Customer Return"
sidebar_position: 9
description: "Quantity-level return evidence connecting returned goods to original fulfillment, disposition, inventory and financial adjustment."
---

# Customer Return

Quantity-level return evidence connecting returned goods to original fulfillment, disposition, inventory and financial adjustment. CustomerReturnLine explains exactly what quantity came back and what happened to it. It does not itself move inventory or issue a credit. Reverse logistics, quality, inventory, customer service, credit processing and audit. SalesOrderLine identifies the original commitment; InvoiceLine identifies the financial claim; InventoryMovement records physical consequences; CreditNoteLine records the financial consequence. Return authorization → returned quantity → receipt → inspection → disposition → restock/quarantine/repair/scrap → credit eligibility → CreditNoteLine → CreditNote posting. Each consequence is posted through its authoritative workflow. Pending → inspected → dispositioned → posted/completed, with controlled correction if necessary. Changes to source fulfillment, invoice, product, UOM or policy revalidate open return lines. Posted physical or financial effects are corrected through compensating events. Five units returned: three restocked, one quarantined and one scrapped. Only three generate unrestricted positive inventory movement. An approved USD 590 credit becomes a CreditNoteLine and is posted through CreditNote without changing the original InvoiceLine.

## Finding records

Lines are added from the parent: open a **Customer Return** and choose the **Customer Return** tab.

The list shows Line Number, Quantity Returned, Quantity Restocked, Quantity Quarantined, Quantity To Repair, Quantity Scrapped, Disposition, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Customer Return** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Sequence number of the line within the CustomerReturn. Identifies the line for operational documents and reconciliation. Used in return documents, receiving and audit. Unique within the parent return and independent of SalesOrderLine or InvoiceLine numbering. Supports deterministic return reconstruction. Required for line identification. |
| Quantity Returned | Amount | Required | Quantity physically or contractually returned for this line. Establishes the quantity subject to inspection and disposition. Used for return validation, inventory and financial eligibility. Must be supported by prior fulfillment evidence and cannot automatically become inventory or credit. Feeds disposition quantities and potential credit calculation. Required because a return line must represent a quantity or equivalent source value. |
| Quantity Restocked | Amount | Required | Quantity accepted for unrestricted restocking. Represents returned goods approved to re-enter unrestricted inventory. Drives positive InventoryMovement posting. Must be a component of quantityReturned and is the only disposition component eligible for unrestricted stock. Creates the inventory consequence after disposition approval. Required as zero when none is restocked. |
| Quantity Quarantined | Amount | Required | Quantity placed into restricted or quarantine inventory. Represents returned goods requiring further inspection or controlled handling. Supports quality and restricted inventory workflows. Does not increase unrestricted available inventory. Drives restricted disposition workflow. Required as zero when none is quarantined. |
| Quantity To Repair | Amount | Required | Quantity routed to repair or refurbishment. Represents goods that require a repair process before any future stock disposition. Supports maintenance/repair work orders and inventory control. Does not directly create unrestricted stock. Drives repair workflow and later disposition. Required as zero when none is routed to repair. |
| Quantity Scrapped | Amount | Required | Quantity approved for scrap or disposal. Represents returned goods that will not return to saleable inventory. Supports disposal, environmental controls and inventory adjustment. Does not increase unrestricted available inventory. Drives authorized disposal and inventory adjustment. Required as zero when none is scrapped. |
| Disposition | Choice | Required | Physical disposition assigned after inspection of returned goods. Determines what operational path the returned quantity follows. Drives inventory, quality, repair and disposal processing. Distinct from return reason and financial credit reason. Determines authoritative InventoryMovement or downstream workflow. Required to prevent ambiguous physical treatment. The disposition of the customer return line is pending; set it when that is what the business means for this record. The disposition of the customer return line is restock; set it when that is what the business means for this record. The disposition of the customer return line is quarantine; set it when that is what the business means for this record. The disposition of the customer return line is repair; set it when that is what the business means for this record. The disposition of the customer return line is scrap; set it when that is what the business means for this record. The disposition of the customer return line is mixed; set it when that is what the business means for this record. Choose one: Pending, Restock, Quarantine, Repair, Scrap, Mixed. |
| Approved Credit Amount | Amount | Optional | Maximum financial credit approved for this return line under applicable policy. Provides the financial eligibility basis consumed by CreditNoteLine; it is not itself a posted credit. Supports customer credit calculation, approval and audit. Must reconcile with original InvoiceLine pricing/tax evidence and must not mutate the invoice. Limits return-based CreditNoteLine credit unless a separate authorized adjustment applies. Optional when the return has no financial credit consequence. |
| Customer Return | Lookup | Required | Parent return containing this returned quantity detail. Establishes the authorization and lifecycle context. Supports return processing and completion. Parent lifecycle coordinates this line's processing. Pick a record from **Customer Return**. |
| Sales Order Line | Lookup | Required | Original sales commitment line against which the return is validated. Identifies the demand and fulfillment quantity being reversed. Supports eligibility and fulfillment reconciliation. Supplies original ordered and fulfilled context. Pick a record from **Sales Order**. |

## How it connects to other records

A customer return is a line of a **Customer Return**. It has no window of its own: open the customer return and use the **Customer Return** tab to see and add lines.
- A customer return belongs to one **Customer Return**.
- A customer return belongs to one **Sales Order**.

## Who may use it

Anyone who holds a role with access to the **Customer Return** window. Access is granted by role under [Roles and access](/administration/access/).
