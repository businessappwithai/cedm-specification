---
title: "Quotation"
sidebar_label: "Quotation"
sidebar_position: 21
description: "Preserves the commercial terms offered to a customer and the evidence needed when those terms become an order."
---

# Quotation

Preserves the commercial terms offered to a customer and the evidence needed when those terms become an order. QuotationLine is a transaction-time commercial snapshot, not merely a pointer to current pricing master data. Quotation, negotiation, approval, sales conversion, margin analysis, audit, and customer communication. Product and UnitOfMeasure provide master context; the Quotation supplies customer and currency context; pricing sources explain determination but do not replace the stored effective price. Product/customer/pricing inputs → price determination → QuotationLine snapshot → quotation approval → optional conversion to SalesOrderLine. Master-data changes affect future quotations unless an explicit repricing workflow is invoked. Draft → priced → approved/issued → accepted/rejected/expired. Once accepted, commercial evidence is preserved. A customer quotation is priced at USD 125 per unit using a customer agreement. The agreement later changes to USD 130. An accepted quotation remains at USD 125 unless the customer explicitly accepts a controlled repricing/revision.

## Finding records

Lines are added from the parent: open a **Quotation** and choose the **Quotation** tab.

The list shows Line Number, Quantity, Unit Price, Amount, Discount Amount, Price Source, Price Determined At, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Quotation** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | The line number of the quotation line: a whole number the business records on it. Entered or maintained when a quotation line is created or changed; shown on its form and available to search and reports. Read together with the quotation line's other fields and its relationships; it is not meaningful on its own. Required: a quotation line cannot be understood without its line number. |
| Quantity | Amount | Required | The quantity of the quotation line: a number the business records on it. Entered or maintained when a quotation line is created or changed; shown on its form and available to search and reports. Read together with the quotation line's other fields and its relationships; it is not meaningful on its own. Required: a quotation line cannot be understood without its quantity. |
| Unit Price | Amount | Required | Transaction-time quoted price per unit, including its currency. Used for quotation valuation and, when accepted, as source evidence for downstream SalesOrder pricing. Must be interpreted with the quotation currency and UnitOfMeasure. Price determination may source a current price rule, but the accepted quotation retains this effective price. Required for a financially valued quotation line. |
| Amount | Amount | Required | Calculated gross commercial value of the quotation line before any separately represented adjustments. Supports quotation totals and conversion validation. Currency must match unitPrice and the quotation currency under the quotation's pricing policy. Provides a reproducible quoted amount. Required for a financially valued quotation line. |
| Discount Amount | Amount | Optional | Transaction-time discount amount granted on the quoted line. Preserves the commercial concession used to derive the net amount. Must use the quotation currency. Prevents later DiscountRule changes from rewriting an accepted quotation. Optional when no discount applies. |
| Price Source | Choice | Optional | Records the business source used to determine the quoted price. Supports audit, margin analysis, pricing explanation, and downstream conversion. Source metadata does not replace the transaction-time unitPrice. Explains why the quoted price was selected. Optional when the quotation does not require source attribution. The price source of the quotation line is price list; set it when that is what the business means for this record. The price source of the quotation line is contract; set it when that is what the business means for this record. The price source of the quotation line is customer agreement; set it when that is what the business means for this record. The price source of the quotation line is manual; set it when that is what the business means for this record. The price source of the quotation line is promotion; set it when that is what the business means for this record. The price source of the quotation line is other; set it when that is what the business means for this record. Choose one: Price list, Contract, Customer agreement, Manual, Promotion, Other. |
| Price Determined At | Date and time | Optional | Timestamp at which the quoted price was determined. Supports effective-dated pricing audit and reproducibility. Distinct from quotation creation time when pricing is recalculated or manually overridden. Provides temporal evidence for price determination. Optional only where the quotation process does not capture determination timing. |
| Description | Text | Up to 1000 characters | The description of the quotation line: a value the business records on it. Entered or maintained when a quotation line is created or changed; shown on its form and available to search and reports. Read together with the quotation line's other fields and its relationships; it is not meaningful on its own. |
| Quotation | Lookup | Required | Links a quotation line to quotation, the quotation it relates to. Chosen from the existing quotation records when the quotation line is created or edited. A quotation line has exactly one quotation in this role. Lets the quotation line be found from, and reported with, its quotation. Pick a record from **Quotation**. |
| Product | Lookup | Optional | Links a quotation line to product, the product it relates to. Chosen from the existing product records when the quotation line is created or edited. A quotation line has at most one product in this role. Lets the quotation line be found from, and reported with, its product. Pick a record from **Product**. |
| Unit Of Measure | Lookup | Optional | Links a quotation line to unit of measure, the unit of measure it relates to. Chosen from the existing unit of measure records when the quotation line is created or edited. A quotation line has at most one unit of measure in this role. Lets the quotation line be found from, and reported with, its unit of measure. Pick a record from **Unit Of Measure**. |

## How it connects to other records

A quotation is a line of a **Quotation**. It has no window of its own: open the quotation and use the **Quotation** tab to see and add lines.
- A quotation belongs to one **Quotation**.
- A quotation belongs to one **Product**.
- A quotation belongs to one **Unit Of Measure**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Quotation line invariants before create | before a quotation is created | 100 |
| Quotation line invariants before update | before a quotation is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Quotation** window. Access is granted by role under [Roles and access](/administration/access/).
