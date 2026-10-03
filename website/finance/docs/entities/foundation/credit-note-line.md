---
title: "Credit Note"
sidebar_label: "Credit Note"
sidebar_position: 11
description: "Represents one auditable financial adjustment detail and its source evidence."
---

# Credit Note

Represents one auditable financial adjustment detail and its source evidence. CreditNoteLine translates an eligible original invoice or return into a specific credited value while preserving historical source facts. Return credits, billing corrections, tax adjustments, customer concessions and audit. InvoiceLine is the original financial evidence; CustomerReturnLine is the reverse-fulfillment evidence; CreditNoteLine is the new financial result. Validate source → determine eligible quantity/value → apply return and pricing/tax policy → snapshot evidence → calculate line credit → approve → post through CreditNote. Corrections use reversal/replacement. Draft → calculated → approved → posted, with controlled reversal after posting. Three returned units are eligible for credit at the original transaction value. CreditNoteLine records quantity 3, preserves the source InvoiceLine and CustomerReturnLine, recalculates applicable tax, and contributes its total to CreditNote without changing the original invoice line.

## Finding records

Lines are added from the parent: open a **Credit Note** and choose the **Credit Note** tab.

The list shows Line Number, Quantity, Unit Price, Subtotal, Discount Amount, Taxable Amount, Tax Amount, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Credit Note** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Business sequence number within the CreditNote. Orders the adjustment details for document presentation and audit. Used for documents, reconciliation and integrations. Unique within the parent CreditNote and independent of original InvoiceLine.lineNumber. Supports deterministic document reconstruction. Required for line identification. |
| Quantity | Amount | Optional | Quantity being financially credited when the adjustment is quantity-based. Represents the credited quantity, which may be less than or equal to the returned quantity or originally billed quantity. Used for return credits, quantity corrections and reconciliation. Must reconcile with eligible source InvoiceLine and CustomerReturnLine quantities. Feeds line valuation where credit is quantity-derived. Optional for purely monetary corrections. |
| Unit Price | Amount | Optional | Transaction-time unit value used to calculate the credit where applicable. Preserves the original or policy-approved value rather than using mutable current pricing. Supports reproducibility, dispute resolution and audit. Should reconcile with source InvoiceLine pricing evidence or authorized return-credit policy. Supplies valuation evidence for quantity-based credits. Optional for fixed monetary adjustments. |
| Subtotal | Amount | Required | Pre-tax monetary credit represented by this line. The line's financial base before credited tax. Used for CreditNote calculation, accounting and reconciliation. Must reconcile with quantity, unitPrice, discounts and source evidence where applicable. Feeds taxable amount and total line credit. Required for deterministic financial calculation. |
| Discount Amount | Amount | Required | Discount component included in determining the credited line value. Preserves the applicable discount treatment from the original transaction or return policy. Used for reconciliation and tax calculation. Must not be confused with a new settlement discount. Determines the credited taxable base according to policy. Required, including zero when no discount applies. |
| Taxable Amount | Amount | Required | Taxable base of the credited line. Amount to which applicable tax treatment is applied for the credit. Used for tax reporting and accounting. Must reconcile with original InvoiceLine tax treatment or authorized correction policy. Feeds credited tax calculation. Required for tax determinism. |
| Tax Amount | Amount | Required | Tax amount reversed or credited on this line. Represents the tax consequence of the credited value. Used for tax reporting, accounting and reconciliation. Must reconcile with applicable TaxRule and source invoice tax evidence. Contributes to the line's total credit. Required, including zero when no tax applies. |
| Total Amount | Amount | Required | Total credit represented by this line including applicable tax. Financial reduction attributable to this specific adjustment detail. Aggregated into CreditNote.totalAmount and used for accounting/application. Does not mutate the original InvoiceLine amount. Provides authoritative line contribution to the CreditNote total. Required for document reconciliation. |
| Pricing Evidence | JSON | Optional | Snapshot of material valuation inputs used for the credited amount. Preserves original price, source, effective date or authorized override required to reproduce the credit. Supports audit and dispute resolution. Connects valuation to original InvoiceLine evidence without making the credit depend on current price master data. Provides historical calculation evidence. |
| Tax Evidence | JSON | Optional | Snapshot of material tax inputs used to determine credited tax. Preserves tax rule/version, jurisdiction, rate, base and rounding used for the adjustment. Supports tax audit and historical reproducibility. Should reconcile with source InvoiceLine tax evidence and applicable correction policy. Supports deterministic tax calculation and posting. |
| Invoice Line | Lookup | Optional | Original billed line from which the credit is derived or corrected. Preserves the financial claim basis without modifying its historical values. Supports return credit, billing correction, tax correction and audit. Supplies eligible quantity, price, discount and tax evidence. Pick a record from **Invoice**. |
| Credit Note | Lookup | Required | Parent financial adjustment document containing this line. Establishes the document context for the adjustment detail. Supports aggregation, approval, posting and audit. Line totals feed the parent CreditNote totals and lifecycle. Pick a record from **Credit Note**. |

## How it connects to other records

A credit note is a line of a **Credit Note**. It has no window of its own: open the credit note and use the **Credit Note** tab to see and add lines.
- A credit note belongs to one **Invoice**.
- A credit note belongs to one **Credit Note**.
- A credit note has many **Tax Rule** records.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Credit note line invariants before create | before a credit note is created | 100 |
| Credit note line invariants before update | before a credit note is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Credit Note** window. Access is granted by role under [Roles and access](/administration/access/).
