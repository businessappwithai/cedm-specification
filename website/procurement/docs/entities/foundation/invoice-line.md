---
title: "Invoice"
sidebar_label: "Invoice"
sidebar_position: 13
description: "Represents one immutable financial claim line with reproducible calculation evidence and explicit customer and supplier adjustment references."
---

# Invoice

Represents one immutable financial claim line with reproducible calculation evidence and explicit customer and supplier adjustment references. InvoiceLine is the historical financial result. Current Product, DiscountRule, TaxRule, UOM and pricing master data are inputs to future transactions, not live dependencies of a posted line. CreditNoteLine and SupplierCreditNoteLine record later reductions separately. Billing, accounts payable, accounts receivable, procurement matching, tax, accounting, returns, credit processing, audit and settlement. Invoice provides claim context; Product/UOM identify and measure the billed item; DiscountRule and TaxRule explain policy; pricingEvidence, discountEvidence and taxEvidence preserve transaction-time results; PO/receipt relationships support three-way matching; CreditNoteLine records customer adjustment; SupplierCreditNoteLine records supplier adjustment. Determine transaction price → calculate gross → resolve discount → calculate taxable base → resolve tax → calculate tax → calculate net → snapshot evidence → matching/approval → post. If a customer or supplier return/correction occurs later, determine eligible adjustment → create corresponding credit line → post credit → apply through explicit application evidence. Subsequent master-data changes never rewrite posted history. Draft → calculated → matched/exception → approved → posted. After posting, historical calculation evidence is immutable and corrections use explicit financial documents or adjustments. Changes to Product/UOM/pricing/discount/tax masters require validation of future and open transactions but never silently modify posted InvoiceLines. Changes to procurement commitments, receipts, customer returns, supplier returns or credits can change downstream matching/adjustment eligibility through controlled reconciliation without rewriting the invoice calculation. A purchase invoice line is linked to a PurchaseOrderLine and accepted GoodsReceiptLine. If three received units are later returned to the supplier, SupplierReturnLine and SupplierCreditNoteLine reference this InvoiceLine; the original billed price and tax remain unchanged while the supplier credit is applied separately.

## Finding records

Lines are added from the parent: open a **Invoice** and choose the **Invoice** tab.

The list shows Line Number, Quantity, Unit Price, Gross Amount, Discount Amount, Taxable Amount, Tax Amount, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Invoice** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | Sequence number within the invoice. Identifies the line for documents and reconciliation. Used in invoice presentation and audit. Unique within Invoice and distinct from CreditNoteLine and SupplierCreditNoteLine numbering. Supports deterministic document reconstruction. Required. |
| Quantity | Amount | Optional | Originally billed quantity. Preserves the historical quantity on the original claim. Used for billing, matching and return eligibility. CustomerReturnLine or SupplierReturnLine may reference eligible quantities and CreditNoteLine or SupplierCreditNoteLine may credit an eligible portion. Provides source quantity evidence. Optional for purely monetary lines. |
| Unit Price | Amount | Optional | Transaction-time billed price per unit. Captures the price actually used to value the invoice line, not today's master price. Supports invoice calculation, audit, price variance, settlement and credit calculation. Customer or supplier credit lines may preserve this as source valuation evidence; later pricing changes do not rewrite it. Provides authoritative historical pricing evidence for the invoice line. Optional for non-quantity monetary lines. |
| Gross Amount | Amount | Required | Gross monetary value before line discount and tax. Original calculated value of the billed line. Used for invoice reconciliation and credit evidence. Credit adjustment lines do not mutate this historical amount. Feeds original line calculation. Required. |
| Discount Amount | Amount | Required | Discount originally applied to the line. Historical line-level commercial reduction. Used for reproducibility, tax and credit calculation. Return credits use original discount evidence where policy requires. Contributes to original taxable and net values. Required, including zero. |
| Taxable Amount | Amount | Required | Original taxable base of the invoice line. Amount subjected to the original tax treatment. Used for tax audit and credit calculation. Credit adjustment tax evidence may derive from this historical treatment. Provides source tax basis. Required. |
| Tax Amount | Amount | Required | Tax originally recognized on the line. Historical tax component of the claim. Used for tax reporting, accounting and credit calculation. A credit line may reverse an eligible portion without editing this amount. Provides source tax evidence. Required, including zero. |
| Net Amount | Amount | Required | Original net financial value of the line after discount and applicable tax treatment. Historical line contribution to the Invoice total. Used for billing, accounting and credit reference. Credit adjustment lines record a separate reduction rather than changing netAmount. Provides immutable source value. Required. |
| Pricing Evidence | JSON | Optional | Snapshot of material pricing inputs used to determine the invoice line amount. Preserves source, effective date, and approved commercial context needed to reproduce pricing even when master data changes. Supports audit, dispute resolution, recalculation, credit calculation and integration. Links the invoice result to the effective transaction price without making the posted invoice depend on mutable pricing master data. |
| Discount Evidence | JSON | Optional | Snapshot of the discount policy inputs and result used on the invoice line. Preserves the applied discount rule/version, method, base, rate or fixed amount, and resulting discount. Supports audit and prevents later DiscountRule changes from altering historical calculations or credits. Provides reproducible discount calculation evidence. |
| Tax Evidence | JSON | Optional | Snapshot of the tax determination inputs and result used on the invoice line. Preserves tax rule/version, jurisdiction, rate, taxable base, rounding and calculated tax. Supports tax audit, compliance, dispute resolution and credit-note tax calculation. Prevents later TaxRule changes from rewriting posted invoice tax. |
| Description | Text | Up to 1000 characters | Human-readable description of the original billed line. Describes the billed good or service. Used on documents and audit. Complements Product and source transaction references. Supports document presentation. Optional descriptive context. |
| Matching Status | Choice | Required | Procurement matching state of the invoice line. Indicates whether the line agrees with applicable purchase and receipt evidence. Used for accounts payable controls and reconciliation. Independent from CreditNote and SupplierCreditNote status; a credit may correct a posted line after matching. Controls matching approval before posting. The matching status of the invoice line is not applicable; set it when that is what the business means for this record. The matching status of the invoice line is unmatched; set it when that is what the business means for this record. The matching status of the invoice line is matched; set it when that is what the business means for this record. The matching status of the invoice line is partially matched; set it when that is what the business means for this record. The matching status of the invoice line is exception; set it when that is what the business means for this record. The matching status of the invoice line is waived; set it when that is what the business means for this record. Choose one: Not applicable, Unmatched, Matched, Partially matched, Exception, Waived. |
| Unit Of Measure | Lookup | Optional | Unit in which the original quantity was billed. Defines measurement semantics for the historical quantity. Supports billing, fulfillment and return conversion. Provides source measurement context for eligible credits. Pick a record from **Unit Of Measure**. |
| Purchase Order Line | Lookup | Optional | Procurement line associated with a purchase invoice line. Connects payable billing to the original procurement commitment. Supports three-way matching and supplier-return traceability. Supplies source procurement evidence. Pick a record from **Purchase Order**. |
| Supplier Debit Note Line | Lookup | Optional | The SupplierDebitNoteLine this InvoiceLine belongs to. Pick a record from **Supplier Debit Note**. |
| Supplier Return Line | Lookup | Optional | The SupplierReturnLine this InvoiceLine belongs to. Pick a record from **Supplier Return**. |
| Product | Lookup | Optional | Product or service identified by the original invoice line. Identifies what was billed without making current product master data a live dependency of posted history. Supports billing, fulfillment and return traceability. Supplies source item context. Pick a record from **Product**. |
| Invoice | Lookup | Required | Parent invoice containing the original claim line. Provides financial document context. Supports billing, settlement, adjustment and audit. Parent claim owns the line's historical calculation. Pick a record from **Invoice**. |

## How it connects to other records

A invoice is a line of a **Invoice**. It has no window of its own: open the invoice and use the **Invoice** tab to see and add lines.
- A invoice belongs to one **Unit Of Measure**.
- A invoice belongs to one **Purchase Order**.
- A invoice is linked to many **Goods Receipt** records.
- A invoice has many **Supplier Credit Note** records.
- A invoice belongs to one **Supplier Debit Note**.
- A invoice belongs to one **Supplier Return**.
- A invoice belongs to one **Product**.
- A invoice belongs to one **Invoice**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Invoice line invariants before create | before a invoice is created | 100 |
| Invoice line invariants before update | before a invoice is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Invoice** window. Access is granted by role under [Roles and access](/administration/access/).
