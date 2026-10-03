---
title: "Supplier Debit Note"
sidebar_label: "Supplier Debit Note"
sidebar_position: 28
description: "Provides the auditable financial detail supporting one component of a SupplierDebitNote."
---

# Supplier Debit Note

Provides the auditable financial detail supporting one component of a SupplierDebitNote. The line explains exactly how a supplier recovery amount was calculated; it does not replace the original invoice supplier claim or claim resolution. Accounts payable supplier disputes accounting tax and audit. SupplierClaim supplies the business case, SupplierClaimResolution supplies authorization, InvoiceLine supplies original financial evidence, and SupplierDebitNote aggregates approved recovery lines. Gather source evidence → determine line basis → calculate amount and tax → validate against claim resolution → approve → post with parent SupplierDebitNote → reconcile payable. A supplier billed 100 units but 5 were not received. The SupplierClaimResolution authorizes a shortage recovery; a debit line records quantity 5 and the applicable transaction-time unit value with supporting InvoiceLine evidence.

## Finding records

Lines are added from the parent: open a **Supplier Debit Note** and choose the **Supplier Debit Note** tab.

The list shows Line Number, Quantity, Unit Price, Gross Amount, Tax Amount, Net Amount, Reason Code, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Supplier Debit Note** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Sequence number of the debit line within its SupplierDebitNote. Provides deterministic ordering and human-readable identification. Documents review and reconciliation. Unique within the parent debit note. Identifies the line during approval and posting. Required. |
| Quantity | Amount | Optional | Quantity to which the debit calculation applies when the adjustment is quantity-based. Measures affected goods or services for shortage overcharge damage or other quantity-driven recovery. Calculation reconciliation and audit. Must reconcile with relevant InvoiceLine GoodsReceiptLine or claim evidence when applicable. Supplies quantity basis for adjustment valuation. Optional for purely monetary adjustments. |
| Unit Price | Amount | Optional | Unit monetary value used to calculate a quantity-based debit. Captures the transaction-time valuation relevant to the recovery. Calculation and audit. Should derive from original commercial evidence rather than current master pricing. Supports reproducible line valuation. Optional for non-quantity adjustments. |
| Gross Amount | Amount | Required | Pre-tax financial amount of the debit line before applicable deductions or tax. Represents the base recovery attributable to this line. Total calculation accounting and reconciliation. Feeds taxableAmount and totalAmount. Required. |
| Tax Amount | Amount | Required | Tax component associated with the debit line. Represents applicable tax added to the adjustment. Tax reporting and accounting. Contributes to line and header total. Required including zero. |
| Net Amount | Amount | Required | Final financial amount represented by this debit line. Represents the line's gross adjustment plus applicable tax under governing calculation policy. Supplier reconciliation and accounting. Contributes to SupplierDebitNote.totalAmount. Required. |
| Reason Code | Text | Required, Up to 100 characters | Reason explaining why this particular debit amount is being raised. Provides line-level cause such as shortage overcharge damage or penalty. Supplier dispute reporting and recovery analytics. Complements SupplierClaim.claimType and source transaction evidence. Supports validation and approval. Required for line-level auditability. |
| Supplier Debit Note | Lookup | Required | Parent supplier debit note containing this line. Supplies supplier currency lifecycle and posting context. Controls whether the line can be posted. Pick a record from **Supplier Debit Note**. |
| Supplier Claim | Lookup | Optional | Claim evidence supporting the debit line. Connects the monetary adjustment to the supplier issue being recovered. Investigation approval and audit. Supplies justification for the debit. Pick a record from **Supplier Claim**. |
| Supplier Claim Resolution | Lookup | Optional | Authorized claim resolution supporting this debit line. Links the line to the approved recovery decision and its financial limit. Approval audit and claim closure. Supplies remedy authorization for DEBIT_ADJUSTMENT. Pick a record from **Supplier Claim Resolution**. |

## How it connects to other records

A supplier debit note is a line of a **Supplier Debit Note**. It has no window of its own: open the supplier debit note and use the **Supplier Debit Note** tab to see and add lines.
- A supplier debit note belongs to one **Supplier Debit Note**.
- A supplier debit note belongs to one **Supplier Claim**.
- A supplier debit note belongs to one **Supplier Claim Resolution**.
- A supplier debit note has many **Invoice** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Supplier debit note line invariants before create | before a supplier debit note is created | 100 |
| Supplier debit note line invariants before update | before a supplier debit note is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Supplier Debit Note** window. Access is granted by role under [Roles and access](/administration/access/).
