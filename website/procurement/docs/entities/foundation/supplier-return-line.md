---
title: "Supplier Return"
sidebar_label: "Supplier Return"
sidebar_position: 30
description: "Defines exactly what previously accepted procurement quantity is being returned and connects that quantity to quality, physical and financial consequences."
---

# Supplier Return

Defines exactly what previously accepted procurement quantity is being returned and connects that quantity to quality, physical and financial consequences. SupplierReturnLine is the bridge between accepted receiving evidence and quality, reverse inventory and payable workflows. Reverse logistics, supplier claims, quality, warehouse control and accounts payable. PurchaseOrderLine states the commitment; GoodsReceiptLine states accepted fulfillment; QualityInspection provides quality evidence; SupplierReturnLine states reversal; InventoryMovement records stock reduction; SupplierCreditNoteLine records payable adjustment. Validate eligible receipt quantity → inspect where required → authorize return → execute physical return → post InventoryMovement → assess supplier credit → post SupplierCreditNoteLine. Changes to receipt eligibility, inspection result, product, UOM or approved credit affecting an open line trigger revalidation of dependent return, inventory and financial workflows. Three defective units from a five-unit accepted receipt are returned. QualityInspection records the failed result and return disposition, this line records quantityReturned=3, inventory is reduced by three through an attributable movement, and any approved supplier credit is calculated from the original invoice evidence.

## Finding records

Lines are added from the parent: open a **Supplier Return** and choose the **Supplier Return** tab.

The list shows Line Number, Quantity Returned, Approved Credit Amount, Disposition, Purchase Order Line, Supplier Return, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Supplier Return** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Sequence number of the return line within SupplierReturn. Provides human-readable ordering of returned items. Used in documents, warehouse operations and reconciliation. Unique within the parent return, not globally. Identifies a line during approval and execution. Required for deterministic line identification. |
| Quantity Returned | Amount | Required | Quantity of previously accepted goods being returned to the supplier. Measures the physical quantity leaving the organization through the reverse procurement process. Drives eligibility, inventory reversal and supplier credit calculation. Must reconcile to eligible GoodsReceiptLine accepted quantity and UOM. Primary quantity input for return execution. Required because a return line without quantity has no physical meaning. |
| Approved Credit Amount | Amount | Optional | Maximum or approved financial amount eligible for supplier credit for this return line. Separates the financial claim from the physical quantity returned. Feeds SupplierCreditNote calculation and accounts-payable reconciliation. Must be derived using original transaction price, tax, discount, currency and return policy rather than current supplier pricing. Provides controlled input to financial adjustment after applicable approval. Optional where no supplier credit is expected. |
| Disposition | Choice | Required | Operational result governing how the returned procurement quantity is handled. Identifies whether the quantity is actually being returned to the supplier or requires exception processing. Supports warehouse and supplier-claim workflows. Distinct from the original GoodsReceipt acceptance status and any QualityInspection disposition. Controls whether the normal supplier-return workflow may proceed. Required for controlled physical processing. The disposition of the supplier return line is return to supplier; set it when that is what the business means for this record. The disposition of the supplier return line is rejected; set it when that is what the business means for this record. The disposition of the supplier return line is exception; set it when that is what the business means for this record. Choose one: Return to supplier, Rejected, Exception. |
| Purchase Order Line | Lookup | Required | Original procurement commitment associated with the returned item. Identifies what was originally ordered. Supplies product, UOM and commercial context. Pick a record from **Purchase Order**. |
| Supplier Return | Lookup | Required | Parent reverse-procurement transaction containing this line. Supplies supplier, authorization and overall lifecycle context. Controls whether this line may execute. Pick a record from **Supplier Return**. |

## How it connects to other records

A supplier return is a line of a **Supplier Return**. It has no window of its own: open the supplier return and use the **Supplier Return** tab to see and add lines.
- A supplier return belongs to one **Purchase Order**.
- A supplier return is linked to many **Goods Receipt** records.
- A supplier return has many **Supplier Credit Note** records.
- A supplier return belongs to one **Supplier Return**.
- A supplier return has many **Invoice** records.

## Who may use it

Anyone who holds a role with access to the **Supplier Return** window. Access is granted by role under [Roles and access](/administration/access/).
