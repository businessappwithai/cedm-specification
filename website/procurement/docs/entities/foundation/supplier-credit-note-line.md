---
title: "Supplier Credit Note"
sidebar_label: "Supplier Credit Note"
sidebar_position: 27
description: "Provides the auditable quantity, value, discount and tax detail behind a supplier payable adjustment."
---

# Supplier Credit Note

Provides the auditable quantity, value, discount and tax detail behind a supplier payable adjustment. It is the financial mirror of an original supplier invoice line for the credited portion, not a replacement of that line. Accounts payable, tax, supplier reconciliation, audit and accounting. SupplierReturnLine explains the physical cause; InvoiceLine explains the original financial claim; SupplierCreditNoteLine explains the approved financial reduction. Identify eligible invoice evidence → determine credited quantity/value → apply original pricing and tax evidence → calculate credit → approve → post to SupplierCreditNote. Three units originally invoiced at EUR 100 are returned. The line preserves quantity 3 and original price EUR 100, applies the applicable historical discount/tax treatment, and contributes the resulting amount to the supplier credit note.

## Finding records

Lines are added from the parent: open a **Supplier Credit Note** and choose the **Supplier Credit Note** tab.

The list shows Line Number, Quantity, Unit Price, Gross Amount, Discount Amount, Taxable Amount, Tax Amount, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Supplier Credit Note** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Sequence number within the supplier credit note. Provides deterministic document ordering. Used in credit documents and reconciliation. Identifies the line during approval and posting. Required for deterministic document structure. |
| Quantity | Amount | Optional | Quantity to which the supplier credit relates. Connects the financial adjustment to a returned or otherwise adjusted quantity. Supports quantity/value reconciliation. Must reconcile with eligible SupplierReturnLine quantity where return-originated. Supports credit calculation. Optional for purely monetary adjustments. |
| Unit Price | Amount | Optional | Original transaction-time unit price used to value the credited quantity. Preserves historical commercial value rather than current supplier pricing. Supports audit and reproducible credit calculation. Feeds gross credit calculation. Optional when the adjustment is not quantity-based. |
| Gross Amount | Amount | Required | Gross credited value before discount and tax adjustments. Represents the value of the credited transaction component. Supports calculation and reconciliation. Feeds net taxable credit calculation. Required for financial calculation. |
| Discount Amount | Amount | Required | Discount component reversed or adjusted on the credited value. Preserves the original transaction discount treatment. Supports reproducibility and reconciliation. Reduces the applicable credit base. Required, including zero. |
| Taxable Amount | Amount | Required | Taxable base of the supplier credit line. Amount to which applicable tax reversal or adjustment applies. Supports tax and accounting reconciliation. Feeds tax calculation. Required for deterministic tax treatment. |
| Tax Amount | Amount | Required | Tax component of the supplier credit line. Reverses or adjusts tax associated with the credited amount. Supports tax reporting and accounting. Contributes to line total. Required, including zero. |
| Net Amount | Amount | Required | Total financial value of this supplier credit line. Represents the payable reduction attributable to the line. Feeds SupplierCreditNote totals and payable reconciliation. Authoritative line contribution to the credit. Required. |
| Supplier Credit Note | Lookup | Required | Parent supplier credit document. Supplies supplier, currency and lifecycle context. Controls whether the line may be posted. Pick a record from **Supplier Credit Note**. |
| Supplier Return Line | Lookup | Optional | Return line that caused the credit. Connects financial adjustment to physical reverse procurement. Supplies approved quantity and credit eligibility. Pick a record from **Supplier Return**. |
| Invoice Line | Lookup | Optional | Original supplier invoice line being financially adjusted. Preserves traceability to the original payable claim. Supplies original price, discount, tax and amount evidence. Pick a record from **Invoice**. |

## How it connects to other records

A supplier credit note is a line of a **Supplier Credit Note**. It has no window of its own: open the supplier credit note and use the **Supplier Credit Note** tab to see and add lines.
- A supplier credit note belongs to one **Supplier Credit Note**.
- A supplier credit note belongs to one **Supplier Return**.
- A supplier credit note belongs to one **Invoice**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Supplier credit note line invariants before create | before a supplier credit note is created | 100 |
| Supplier credit note line invariants before update | before a supplier credit note is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Supplier Credit Note** window. Access is granted by role under [Roles and access](/administration/access/).
