---
name: procurement-domain
description: What the records of Procurement are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Procurement, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Procurement

Procurement and Sourcing, built on the CEDM common foundation.

Everything below is the application's own description of itself, taken from the model it was generated from. Use these names when you talk to the person, and pass the record type's name as `entity` to the tools.

## Records

### Address

A structured postal or physical address for a party or location, held once so it can be reused wherever it is needed. Addresses are reusable master data, yet an address printed on an issued invoice or shipment is historical evidence. This entity therefore holds the current address while documents keep their own copy of what was printed. Created when a party or location needs an address, selected when documents are prepared, and retired when it is no longer valid; read by invoicing, shipping, tax and mailing processes. An address is placed through its Country, optional StateProvince and City,…

Readable by every signed-in person.

Fields:
  - **Address Type** (required, one of the Address Address Type values) — The purpose for which the address is used. Chosen when the address is created and used to pick the right address for a document, such as BILLING for invoices and SHIPPING for deliveries. A private home address. A place of business or offic…
  - **Line1** (required) — The first line of the street address, usually building number and street. Entered by the person maintaining the address; printed on labels and documents.
  - **Line2** — An optional second address line, such as a suite, unit or floor. Filled when line 1 is not enough to find the exact delivery point.
  - **Line3** — An optional third address line for additional delivery details. Rarely used; kept for countries and carriers whose formats need more than two lines.
  - **City Name** — The name of the town or locality when it is not in the list of cities. Filled only when no city can be chosen; leave it empty when the city is picked from the list. Stands in for the city relationship; an address states one or the other.
  - **Postal Code** — The postal or ZIP code of the address. Entered according to the country's format; used for delivery, tax zones and distance calculation.
  - **Latitude** — The north-south position of the address on the earth in decimal degrees, from -90 to 90. Optional; filled by geocoding for mapping and routing. Must stay within -90 to 90.
  - **Longitude** — The east-west position of the address on the earth in decimal degrees, from -180 to 180. Optional; filled by geocoding for mapping and routing. Must stay within -180 to 180.
  - **Is Primary** (required) — Marks the address a party or location uses by default for its address type. Set by the person maintaining addresses; at most one active primary address of each type applies per party or location, and it is the one documents pick unless tol…
  - **Status** (required, one of the Address Status values) — Whether the address may still be used for new business. Changed by data stewards; selection lists offer only ACTIVE addresses. Valid and available for new documents. Temporarily not offered, for example while a move is being confirmed; it…
  - **Party** (a Party) — The party that uses or maintains this address. Set when a party's address is added; used to find a party's addresses and pick the effective one. At most one party; an address being prepared may have none yet. Supplies the party context for…
  - **Person** (a Person) — The Person this Address belongs to.
  - **Organization** (a Organization) — The Organization this Address belongs to.
  - **Country** (required, a Country) — The country the address is in. Chosen first; it sets the address format and narrows the states and cities offered. Exactly one country is required. Settles the format, tax and trade rules that apply to the address. Every address names its…
  - **State Province** (a State Province) — The state, province or equivalent division the address is in. Chosen after the country, from that country's divisions. At most one; some countries have no divisions in the list. Must belong to the address's own country. Must be a division…
  - **City** (a City) — The city the address is in, chosen from the list. Chosen after the state or province; use the city name field only when the city is not listed. At most one. Must belong to the address's own country, and to its state or province where one i…
  - **Supplier** (a Supplier) — The Supplier this Address belongs to.

### Address Address Type

The values of address address type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Address Status

The values of address status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Attachment

A file or other content attached to an enterprise record, with its content identity and provenance kept for audit. Supporting documents, photos and scans back up decisions. Keeping them as governed records, rather than loose files, proves what was attached to what and when, and lets the same content be recognised if it is attached twice. Added when a user or system attaches evidence to a record; read when someone needs to see or verify the supporting document. An attachment is linked to the record it supports; the same file may be attached to more than one. Once attached, the content is evide…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the attachment became part of the record. Set when the file is attached; used to show what evidence existed at a given moment.

### Business Unit

A major business, division, product line or operating segment within an organisation. Business units are how a large organisation divides its activity for management and reporting. They let results, budgets and responsibility be assigned to a meaningful segment rather than to the organisation as a whole. Defined by management and finance; assigned to people, transactions and budgets; read when reporting by segment. Each business unit belongs to one Organization and groups the work and results of one part of it. A business unit keeps its code and identity stable. Reorganisations are recorded e…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short reference for the unit, such as CE or EMEA-RETAIL. Assigned by finance and used on reports and in postings; kept stable because history relies on it.
  - **Name** (required) — The full name of the business unit, as it appears in the organisation's structure and management accounts. Entered by management or finance when the unit is created; shown in organisation charts, selectors and segment reports.
  - **Organization** (required, a Organization) — The organisation to which the unit belongs. Set when the unit is created. Exactly one organisation; a unit cannot stand alone. Rolls the unit's results up into its parent organisation.

### Calendar

A calendar that defines business dates, working days, holidays and time-control rules used for planning and operations. Whether a date counts as a working day is not obvious: it depends on region, industry and company. A calendar states that explicitly, so due dates, delivery promises and schedules all agree. Maintained by administrators; referenced by schedulers, service-level calculations and planning when they need to know which days count. Locations, teams, contracts and schedules point to the calendar that governs their working days. A calendar's code and identity stay stable. Changes to…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short reference for the calendar, such as DE-NAT. Assigned by the administrator; used in configuration and reports; kept stable.
  - **Name** (required) — The descriptive name of the calendar, such as UK Working Days or Group Fiscal Calendar. Entered by the administrator who maintains it; shown wherever a schedule, service level or plan asks which calendar applies.

### City

Loaded from the GeoNames reference data rather than typed by users; chosen on addresses, locations and offices, and read to sort, filter and map records by place. A city: every national capital and every city of 750 thousand or more, from GeoNames, linked to its country and, for the United States and Canada, to its state or province. A city: every national capital and every city of 750 thousand or more, from GeoNames, linked to its country and, for the United States and Canada, to its state or province. Chosen from the list wherever a record needs a place, code or currency; maintained by an a…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The city's code: its country code and its name in capitals, such as FR-PARIS. Quoted beside the name in lists; integration with other systems. Unique; the country prefix keeps cities of one name in different countries apart.
  - **Name** (required) — The city's name in English, as it is written on addresses and in place lists. Loaded with the reference data; shown in lists, pickers and address lines, and narrowed by the country and state chosen. Not unique: two countries can have a cit…
  - **Population** — The population figure recorded in the GeoNames registry when the data was loaded. Used to rank and size cities in lists and pickers; it is an approximate registry value, not a current census count. Describes the city only.
  - **Latitude** — The city's north-south position in decimal degrees, with north positive and south negative. Loaded with the reference data; paired with longitude to place the city on maps and measure distances. Describes the city only.
  - **Longitude** — The city's east-west position in decimal degrees, with east positive and west negative. Loaded with the reference data; paired with latitude to place the city on maps and measure distances. Describes the city only.
  - **Timezone** — The IANA time zone the city keeps, such as Europe/Paris. Showing local times for the city. Describes the city only.
  - **Is Capital** — Marks the city as the capital of its country in the reference data. Loaded with the reference data; lists use it to highlight or sort capitals first when people choose a city. At most one capital per country in this list.
  - **Country** (required, a Country) — Exactly one country; a city belongs to a single country. The country the city is in. Chosen first; the cities offered are those of that country. A city is narrowed by its country, and by its state where it has one.
  - **State Province** (a State Province) — The state or province the city is in, where the registry says which. Chosen after the country; narrows the cities offered. A city has at most one state or province; outside the United States and Canada the list leaves it empty. The state o…

### Contact Point

A communication endpoint for a party, such as an email address, telephone number, web address or other channel. Reaching someone requires a specific address. A contact point holds each one with its own status, so messages go to working endpoints and old ones are not lost. Added when a party gives an email, phone or other channel; read by communications, notifications and service processes. Each contact point belongs to one Party, which may have several. Code and identity stay stable, and an endpoint that is retired remains in history. The billing team's email address invoices@acme.example, re…

Readable by every signed-in person.

Fields:
  - **Code** (required) — A short reference for the contact point. Assigned or imported; stays stable so integrations can match it.
  - **Name** (required) — A descriptive label for the endpoint, such as Head office switchboard. Shown wherever contact points are listed.
  - **Party** (required, a Party) — The party the endpoint belongs to. Set when the endpoint is added. Exactly one party; each endpoint has one owner. Lets communications find the right channel for a party.

### Country

Read by address forms, tax and trade rules, localization and reports; changed only by an administrator when the ISO registry changes. A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. Chosen from the list wherever a record needs a place, code or currency; maintained by an administrator when a registry changes.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The two-letter ISO 3166-1 code, such as US or DE. Search, integration and reporting; stored on nothing else, because records point at the country itself. Unique; a state or province and a city belong to a country through it.
  - **Alpha3** — The three-letter ISO 3166-1 code, such as USA or DEU. Trade and customs documents, which use the long form. Unique among countries.
  - **Numeric Code** — The three-digit ISO 3166-1 numeric code, such as 840. Banking and statistical exchange formats. Unique among countries.
  - **Name** (required) — The country's short name in English. Shown in lists, on addresses and on reports. Does not replace the code as the stable key.
  - **Phone Code** — The international dialling prefix for the country, held without the plus sign, such as 44 or 1. Used to validate and format telephone numbers entered against addresses and contacts, so the same number reads the same everywhere. Belongs to…
  - **Currency** (a Currency) — The currency the country mainly uses. Chosen from the currency list; used to suggest a currency on records for the country. A country has at most one main currency; a currency can be the main one of many countries. Lets a default currency…

### Currency

Defines the monetary denomination that gives financial amounts their business meaning. Currency is not an amount. It defines the denomination in which an amount is stated and provides the reference needed for pricing, billing, settlement, banking, and accounting. Central to Product pricing, SalesOrder, Invoice, Payment, PaymentAllocation, BankTransaction, JournalEntry, ExchangeRate, and financial reporting. Product may carry reference pricing. SalesOrder establishes commercial amounts. Invoice establishes claims. Payment establishes settlement. PaymentAllocation applies settlement to claims.…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Three-letter business currency code, normally an ISO 4217 code where one exists. Used in documents, APIs, integrations, reports, pricing, banking, and accounting. Code identifies the denomination and is not an exchange rate or amount. Prov…
  - **Name** (required) — The name of the currency, such as Euro or US Dollar. Used in user interfaces, documents, reports, master-data management, and integrations. Describes the currency identified by code and currencyId. Provides understandable monetary context…
  - **Symbol** — Common display symbol for the currency. Used in user interfaces, customer documents, reports, and formatted amounts. Presentation metadata; it must not be used as the canonical currency identity. Improves human-readable display without aff…
  - **Decimal Places** (required) — Standard number of decimal places normally used when representing amounts in this currency. Used for amount formatting, rounding, validation, invoicing, payment processing, and accounting presentation. Transaction-specific precision or fin…
  - **Status** (required, one of the Currency Status values) — Available for use on new prices, documents and payments. Temporarily not offered, for example while a market is closed; it can be reactivated. No longer in use, such as a replaced national currency; historical amounts keep it. Controls whe…

### Currency Status

The values of currency status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Department

A unit of an organisation that groups people, positions, responsibilities and work. Departments are how people are organised day to day. They define reporting lines, budgets and responsibilities. Defined by HR and management; assigned to people and positions; used in reporting and approvals. A department belongs to an Organization (or one of its business units). Code and identity stay stable. Reorganisations are recorded explicitly so earlier reports do not change. The Accounts Payable department of the finance function.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short code of the department, such as FIN-AP. Used in postings and reports; kept stable.
  - **Name** (required) — The name of the department as the organisation calls it, such as Finance or Field Operations. Entered by an administrator; shown in organisation charts, on documents and in reports that group people and costs by department.
  - **Organization** (required, a Organization) — Chosen when the department is created; reporting lines, headcount and budgets roll up through the organisation it belongs to. The organisation the department belongs to. Exactly one organisation: a department is part of a single organisati…

### Exchange Rate

Represents an auditable conversion rate between two currencies for a defined time and business purpose. ExchangeRate is the conversion context between Currency denominations; it is not itself money, a payment, or an accounting entry. Used by multi-currency orders, invoices, payments, payment allocations, bank reconciliation, accounting, consolidation, and financial reporting. Currency defines denominations. Money carries amount plus currency. ExchangeRate provides the conversion between two Money values. PaymentAllocation and accounting consume the rate when cross-currency conversion is permi…

Readable by every signed-in person.

Fields:
  - **From Currency** (required, a Currency) — Currency from which an amount is converted. Identifies the source denomination of the monetary amount being converted. Must differ from toCurrency for a meaningful exchange-rate conversion. Identifies the currency of the source Money value…
  - **To Currency** (required, a Currency) — Currency into which an amount is converted. Identifies the target denomination of the converted monetary amount. Conversion direction is from fromCurrency to toCurrency; reversing the direction requires an appropriate inverse rate rather t…
  - **Rate** (required) — Positive conversion factor that expresses how much target currency corresponds to one unit of source currency under this rate convention. Used to calculate converted monetary amounts while preserving the declared direction. Must always be…
  - **Rate Type** (required, one of the Exchange Rate Rate Type values) — The market rate at a moment in time. A rate fixed by agreement with a counterparty. The rate published for a business day. An average or closing rate for a month. A rate set by the finance team for ledger translation. Any other rate define…
  - **Effective At** (required) — Date and time from which the exchange rate is applicable under its rate policy. Used to select the correct rate for a transaction, settlement, or accounting event. A rate without an effective time cannot be reliably reproduced when rates c…
  - **Expires At** — Optional end of the period during which the rate is valid. Used to prevent application of expired rates. When supplied, expiresAt must be later than effectiveAt. Defines the rate's validity window for transaction and reporting calculations.
  - **Source** (required) — Identifies the provider or business authority from which the rate was obtained. Used for audit, reconciliation, regulatory reporting, and rate governance. Source identifies provenance; it does not by itself determine which rate is applicab…
  - **Status** (required, one of the Exchange Rate Status values) — Being prepared; not yet used. In force and usable for conversion. Its validity period has ended; kept for past conversions. Withdrawn; must not be used. Lifecycle state of the exchange-rate record. Used by conversion services to determine…

### Exchange Rate Rate Type

The values of exchange rate rate type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Exchange Rate Status

The values of exchange rate status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Goods Receipt

A record that goods or services ordered on a purchase order have arrived, with evidence of what was received, accepted and rejected. Receiving is the moment a purchase becomes real. The goods receipt says what physically arrived against the order, what passed inspection and what did not, so stock, supplier payment and returns can all rely on it. Created at the dock when a delivery arrives; inspected; accepted or rejected; read by purchasing, warehouse and accounts payable. A receipt answers a PurchaseOrder from a Supplier, has GoodsReceiptLines, creates InventoryMovements, supports Invoice ma…

Readable by every signed-in person.

Fields:
  - **Receipt Number** (required) — The receipt number printed on the delivery note and used in the warehouse. Allocated from a number series; unique. Identifies the receipt in warehouse and supplier operations. Distinct from SupplierReturn.returnNumber and PurchaseOrder num…
  - **Receipt Date** (required) — The date and time the goods arrived. Recorded at the dock; determines stock availability and supplier performance. Establishes receiving chronology. Distinct from later SupplierReturn.returnDate. Anchors original receipt evidence.
  - **Status** (required, one of the Goods Receipt Status values) — How far the receipt has progressed from preparation through counting and inspection to a final decision. Moved by warehouse and quality staff; accounts payable matches invoices only against receipts that were accepted. Being prepared befor…
  - **Received Quantity** (required) — The total quantity counted at the dock across all lines of the receipt. Calculated from the receipt lines rather than typed in; purchasing compares it with the ordered quantity. Sum of line received quantities. SupplierReturn eligibility i…
  - **Accepted Quantity** (required) — The total quantity accepted into stock. Calculated from the lines; never more than the received quantity. Sum of line accepted quantities that may become inventory. SupplierReturnLine eligibility is normally based on accepted quantity and…
  - **Notes** — Remarks about the delivery, such as damage or discrepancies. Free text written by the receiving clerk. Human-readable context for receipt exceptions or inspection. Does not replace structured disposition or return evidence. Supports review.
  - **Supplier** (required, a Supplier) — The supplier that delivered the goods. Set from the purchase order. Supplier performance is measured on receipts. Identifies the commercial party responsible for the delivery.
  - **Purchase Order** (required, a Purchase Order) — The purchase order the delivery answers. Selected at receiving. Receipts close the order's open quantities. Connects received goods to what was ordered.
  - **Supplier Claim** (a Supplier Claim) — The SupplierClaim this GoodsReceipt belongs to.
  - **Supplier Performance Assessment** (a Supplier Performance Assessment) — The SupplierPerformanceAssessment this GoodsReceipt belongs to.

Line items — **Goods Receipt Line**: kept inside each Goods Receipt and reached by opening it, never on their own. Provides the line-level bridge between ordered quantity, received quantity, accepted inventory, supplier invoice matching and later supplier returns. GoodsReceiptLine is the actual receipt result. PurchaseOrderLine is commitment. InventoryMovement is stock consequence. InvoiceLine is financial clai…

### Goods Receipt Status

The values of goods receipt status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Invoice

Represents a formal financial claim and its controlled settlement and adjustment state. Invoice records what was originally claimed. Payment records money moved. PaymentAllocation records how money is applied. CreditNote, SupplierCreditNote, and SupplierDebitNote record separate authorized financial adjustments; their application entities record claim-level consumption. Used by order-to-cash, procure-to-pay, accounting, tax, collections, payments, reconciliation, customer credit, supplier recovery and audit. SalesOrder provides commercial commitment, Shipment or delivery provides fulfillment…

Readable by every signed-in person.

Fields:
  - **Invoice Number** (required) — The number printed on the invoice, by which customer and supplier refer to it. Identifier communicated to customers, suppliers, tax authorities, and financial operations. Used in documents, statements, reconciliation, collections, payables…
  - **Invoice Date** (required) — Accounting and commercial date assigned to the invoice. Establishes the date used for financial chronology and applicable billing and tax rules. Used for accounting periods, tax, payment-term calculation, aging, reporting, and reconciliati…
  - **Due Date** — Transaction-level date by which the claim is expected to be settled. Result of applying the effective PaymentTerm and due-date basis to the invoice. Drives aging, collections, cash forecasting, and payment planning. PaymentTerm is policy;…
  - **Invoice Type** (required, one of the Invoice Invoice Type values) — An invoice the organisation issues to a customer for goods or services supplied. An invoice the organisation receives from a supplier. A document that reduces what is owed under an earlier invoice. A document that increases what is owed un…
  - **Status** (required, one of the Invoice Status values) — Being prepared; not yet sent and not yet part of the receivables. Sent or recorded; the amount is now owed and due by its due date. Part of the amount has been settled by payments or credits. Fully settled. A final state. Past its due date…
  - **Currency** (required, a Currency) — Currency denomination shared by the invoice's monetary values. Defines the monetary denomination of the claim and its calculated totals. Used for accounting, payment allocation, tax, reconciliation, reporting, and credit or debit adjustmen…
  - **Subtotal** (required) — Aggregate of invoice line amounts before document-level tax and other applicable document adjustments. Represents the pre-tax financial base derived from invoice lines after line-level pricing treatment. Used for tax calculation, accountin…
  - **Discount Amount** (required) — Aggregate document-level discount applied after applicable line pricing and before taxable base where policy requires. Represents a document-level reduction distinct from line-level discounts and settlement discounts. Used for invoice calc…
  - **Taxable Amount** (required) — Aggregate monetary base on which applicable invoice taxes are calculated. Represents the amount subject to tax after applicable discounts and exemptions. Used for tax calculation, tax reporting, audit, and reconciliation. Must reconcile wi…
  - **Tax Amount** (required) — Aggregate tax amount calculated under applicable TaxRules and transaction tax determinations. Represents tax charged or otherwise recognized on the claim, not the taxable base. Used for tax reporting, invoice totals, accounting, and reconc…
  - **Total Amount** (required) — Total financial claim after applicable line values, discounts, taxes, credits, debits, and document adjustments. Represents the amount owed under the original invoice before settlement allocations and later adjustment applications. Used fo…
  - **Amount Settled** (required) — Projection of active settlement amounts applied to this invoice. Represents how much of the claim is settled according to active PaymentAllocation records. Used to calculate outstanding balance and derive settlement status. Not an independ…
  - **Amount Credited** (required) — Projection of active CreditNote amounts applied against this invoice claim. Represents authorized financial reductions supported by posted CreditNote evidence. Used for customer balance, invoice settlement, statements, reconciliation and r…
  - **Amount Outstanding** (required) — Projection of the portion of the invoice claim that remains unsettled after authorized credits and debits. Represents current open exposure under the applicable accounting and rounding policy. Drives collections, payment allocation, aging,…
  - **Supplier** (a Supplier) — Supplier associated with a purchase invoice. Identifies the party to whom a payable claim relates. Supports payables, supplier statements, procurement reconciliation, tax, and payment processing. Required for PURCHASE invoices unless anoth…
  - **Purchase Order** (a Purchase Order) — Procurement commitment against which a supplier invoice may be evaluated. Connects supplier commitment to the resulting payable claim. Supports three-way matching and accounts payable controls. PurchaseOrder is commitment; GoodsReceipt is…
  - **Supplier Claim** (a Supplier Claim) — The SupplierClaim this Invoice belongs to.
  - **Supplier Return** (a Supplier Return) — The SupplierReturn this Invoice belongs to.

Line items — **Invoice Line**: kept inside each Invoice and reached by opening it, never on their own. Represents one immutable financial claim line with reproducible calculation evidence and explicit customer and supplier adjustment references. InvoiceLine is the historical financial result. Current Product, DiscountRule, TaxRule, UOM and pricing master data are inputs to future transactions, not l…

### Invoice Invoice Type

The values of invoice invoice type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Invoice Line Matching Status

The values of invoice line matching status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Invoice Status

The values of invoice status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Language

A language used for localisation, communication preferences, content and reporting. People read and write in different languages. A language record lets the application offer translations, remember preferences and tag content with the language it is written in. Loaded from the standard language registry; chosen on user profiles, documents and messages. Parties, users and content refer to a language; the language itself depends on nothing. Code and identity stay stable, and history is never silently rewritten. English, with code en.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The two-letter ISO 639-1 code of the language, such as en or de. Taken from the standard; unique; used in locale settings and APIs.
  - **Name** (required) — The English name of the language, such as French or Portuguese. Loaded from the language reference data; it is shown in language pick-lists and reports, while the code remains the identifier.

### Legal Entity

A legally recognised organisation or person that can hold rights and obligations, registrations, contracts, assets, liabilities or filings. Contracts are signed and taxes are paid by legal entities, not by business units. Knowing exactly which entity is involved determines liability, reporting and registration duties. Registered when an entity is formed or acquired; referenced by contracts, filings and ledgers. Contracts, filings and accounting books refer to the legal entity. Finalised evidence and effective history are preserved; changes such as name changes or mergers are recorded explicit…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the entity was formed, or its record took effect. Set from the registration data.

### Location

A physical or logical place where resources, activities, stock, services or organisational operations are situated. Almost everything in a business happens somewhere. The location is the shared reference for that: sites, warehouses, stores, offices, ports and even virtual places, arranged in a hierarchy so addresses, stock and assets can all point to the same place. Created when a place becomes relevant; arranged under parent locations; referenced by assets, stock, facilities and addresses; read by logistics, facilities and reporting. A location may sit within a parent Location with children…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the place in the organisation's site list, such as NL-RTM-DC1. Unique; assigned by the administrator and used in integrations and labels.
  - **Name** (required) — The name by which people refer to the place, such as Rotterdam Depot. Entered by the administrator when the location is created; shown in lists, maps and documents, and may be changed without breaking references.
  - **Location Type** (required, one of the Location Location Type values) — A geographic site that may contain several buildings. A building or area for storing goods. A retail outlet where goods are sold to customers. A place where office work is done. A place where goods are made. An open area for storing or sta…
  - **Status** (required, one of the Location Status values) — Expected but not yet in use. In use and offered for new assignments. Temporarily not used but expected to return to service. Closed down, with no new assignments but history kept. Removed from use altogether. A final state. Whether the pla…
  - **Address** (a Address) — The postal address of the location. Chosen from the address list; used for deliveries, mapping and tax.
  - **Parent Location** (a Location) — The place that contains this one, such as the site that holds a warehouse. Set to build the hierarchy; a top-level place has none.
  - **Organization** (a Organization) — The organisation that operates the place. Set where operation is clear. At most one operating organisation. Determines responsibility and reporting.
  - **Product** (a Product) — The Product this Location belongs to.

### Location Location Type

The values of location location type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Location Status

The values of location status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Organization

Organization is the organizational specialization of Party, not an independent party identity or business role. Party identifies who the organization is; Organization describes intrinsic organizational structure; PartyRole describes how it participates; Customer and Supplier provide commercial behavior. Used across sales, procurement, finance, logistics, contracts, compliance, HR, and enterprise hierarchy. Party → Organization provides identity specialization. Party → PartyRole provides participation. Customer/Supplier must not create duplicate Party identities. Create/maintain Party → create…

Readable by every signed-in person.

Fields:
  - **Party** (required, a Party) — Canonical Party identity represented by this Organization specialization. Connects organizational details to the shared Party identity used by all roles and transactions. One Party may have exactly one Organization specialization when part…
  - **Code** (required) — Business code for the organization within its governed business context. Used for operations, reporting, integrations, and organizational selection. Code is not the canonical Party identity and uniqueness is governed by organization scope.…
  - **Name** (required) — Common organizational name used in business operations. Used in search, forms, reports, documents, and transactions. LegalName may differ and provides formal legal identity. Provides human-readable organizational identification.
  - **Organization Type** (required, one of the Organization Organization Type values) — Classifies the organizational structure represented by the specialization, from whole enterprise down to department or branch. Used for hierarchy, authorization, reporting, transaction scope, and organizational selection; chosen when the u…
  - **Status** (required, one of the Organization Status values) — Lifecycle of the organizational specialization, deciding whether the unit may be selected in new transactions. Controls whether the organization can normally be selected as an organizational scope; set by master-data staff. The organizatio…
  - **Legal Name** — Formal legal name of the organization. Used for contracts, invoices, tax, regulatory reporting, and legal documentation. LegalName is distinct from the operational name. Supplies legal presentation and compliance context.
  - **Registration Number** — Registration identifier assigned by a competent authority. Used for legal verification, compliance, tax, and integrations. Registration number identifies the organization in an external legal system, not in CEDM. Supports identity verifica…
  - **Tax Identifier** — Tax identifier applicable to the organization in a relevant jurisdiction. Used for tax determination, invoices, reporting, and compliance. Tax identity may vary by jurisdiction and should not replace Party identity. Supports tax-rule appli…
  - **Party Type** (required, one of the Organization Party Type values) — Identifies whether the party is a person or an organization. Determines which party specialization is applicable and prevents business processes from interpreting an organization as an individual or vice versa. Used to select Person or Org…
  - **Display Name** (required) — The business-facing name by which the party is normally displayed and recognized. Provides a consistent human-readable representation independent of whether the party is a person or organization. Used in forms, search results, documents, t…
  - **External Reference** — An identifier assigned to the party by an external system or business partner. Preserves a cross-system identity that allows CEDM to reconcile a party with another master-data system. Used for integrations, migration, reconciliation, EDI,…
  - **Person** (a Person) — The Person this Organization belongs to.
  - **Parent Organization** (a Organization) — Immediate parent organizational unit. Supports enterprise hierarchy and organizational scope. Zero or one immediate parent. Determines inherited organizational context where explicitly supported.

### Organization Organization Type

The values of organization organization type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Organization Party Type

The values of organization party type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Organization Status

The values of organization status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Party

The foundational CEDM business concept for an identifiable person or organization participating in business. Party separates who an actor is from the roles that actor performs. The same party can be a customer, supplier, employee, owner, provider, or contract party without creating duplicate identities. Used as the identity foundation for onboarding, customer management, procurement, sales, finance, logistics, HR, healthcare, contracts, compliance, and audit. Party connects to Person or Organization for intrinsic identity details and to PartyRole for business roles. Transactions and domain en…

Readable by every signed-in person.

Fields:
  - **Party Type** (required, one of the Party Party Type values) — Identifies whether the party is a person or an organization. Determines which party specialization is applicable and prevents business processes from interpreting an organization as an individual or vice versa. Used to select Person or Org…
  - **Display Name** (required) — The business-facing name by which the party is normally displayed and recognized. Provides a consistent human-readable representation independent of whether the party is a person or organization. Used in forms, search results, documents, t…
  - **Status** (required, one of the Party Status values) — Controls whether the party may participate in new business activity. Represents the operational lifecycle of the party relationship with the enterprise, not the party's legal existence. Used by onboarding, transaction validation, account m…
  - **External Reference** — An identifier assigned to the party by an external system or business partner. Preserves a cross-system identity that allows CEDM to reconcile a party with another master-data system. Used for integrations, migration, reconciliation, EDI,…

### Party Party Type

The values of party party type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Party Relationship

A time-bound relationship between two parties that describes how they stand to each other in business, legal, household, employment or another way. Parties are connected to each other: a company to its subsidiary, a person to their employer, one household member to another. Recording the relationship, with its dates, lets the organisation see who is connected to whom and since when. Created when a relationship is established; ended when it stops; read by sales, compliance and customer service. A relationship runs from one Party to another. Code and identity stay stable, and the relationship's…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the relationship type or instance, such as SUBSIDIARY_OF. Chosen from the relationship list; used in queries and rules.
  - **Name** (required) — A readable description of the relationship, such as Acme Ltd is subsidiary of Acme Group. Entered when the relationship is created; shown in party views and lists so users can understand the link at a glance.
  - **From Party** (required, a Party) — The party at the origin of the relationship. Chosen when the relationship is created. Exactly one origin party: a relationship always starts at a particular party. Together with the other party it identifies the relationship.

### Party Role

The bridge between stable Party identity and contextual business participation. Party answers who the actor is; PartyRole answers how that actor participates; Customer and Supplier add role-specific commercial behavior. Foundation for sales, procurement, employment, logistics, ownership, contracts, finance, and relationship management. Customer and Supplier specialize PartyRole. Party identity is never duplicated in those specializations. Transaction entities should retain the role context that was effective when the transaction was created or confirmed. Party onboarding → PartyRole creation…

Readable by every signed-in person.

Fields:
  - **Party** (required, a Party) — The party that holds the role. Set when the role is assigned and not changed. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back to the canonical identity.
  - **Role Type** (required, one of the Party Role Role Type values) — The kind of role the party plays, such as customer, supplier, employee or partner. Chosen when the role is assigned; decides which specialised record (customer, supplier and so on) carries its detail. The party buys goods or services from…
  - **Code** — An optional code for the role. Used by integrations that identify the role separately from the party. Identifies the role instance and must not replace Party or specialized role identifiers.
  - **Valid From** — The first date on which the role applies. Set when the role is assigned. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a newly established role.
  - **Valid To** — The last date on which the role still applies to the party. Set when the role ends, such as a contract expiry; empty while open-ended, and later use of the role is refused. Historical transactions may continue referencing the role after va…
  - **Status** (required, one of the Party Role Status values) — Whether the party currently holds the role and may be used in it. Set by master-data staff; only active roles are offered in selections, and expired is reached when the validity ends. The party currently holds the role. Dormant but may res…
  - **Person** (a Person) — The Person this PartyRole belongs to.
  - **Organization** (a Organization) — Optional organizational scope in which the role is recognized. Supports multi-enterprise, subsidiary, business-unit, and operating-context scenarios. Zero means global/context-independent; one means explicitly scoped to one organization. D…

### Party Role Role Type

The values of party role role type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Party Role Status

The values of party role status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Party Status

The values of party status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Person

Person is the individual specialization of Party, not a business role. Party identifies the individual; Person supplies intrinsic individual details; PartyRole determines how the person participates. Used for customers, employees, agents, owners, contractors, and other roles without duplicating individual identity. Party → Person establishes intrinsic identity; Party → PartyRole establishes business participation; Organization links provide employment or other organizational context. Create/maintain Party → create Person specialization → establish PartyRole → apply role-specific qualification…

Readable by every signed-in person.

Fields:
  - **Party** (required, a Party) — Canonical Party identity represented by this Person specialization. Connects person-specific data to common Party identity and all PartyRoles. Exactly one Person specialization may represent a Party classified as PERSON. Ensures transactio…
  - **Title** — The honorific or personal title used before the person's name, such as Dr, Prof or Ms. Entered when known and optional; printed in letters, documents and formal presentation of the name. presentation attribute. supports person display.
  - **Given Name** (required) — The person's first or given name, as it appears on their identity documents. Required; entered at registration and used with the family name for identity matching, documents and correspondence. intrinsic person identity. identification.
  - **Middle Name** — Any middle or additional given names the person carries, when they are used officially. Optional; entered only when needed to tell people apart or to match identity documents and legal records. intrinsic person identity. identification.
  - **Family Name** (required) — The person's family name or surname, as it appears on their identity documents. Required; entered at registration and used with the given name for identity matching, documents and correspondence. intrinsic person identity. identification.
  - **Preferred Name** — The name the person likes to be called, which may differ from their legal given name. Optional; chosen by the person and used for greetings, display in screens and informal communication, never for legal documents. presentation not canonic…
  - **Date Of Birth** — The person's date of birth, recorded where age or verified identity matters to a process. Optional and sensitive; collected only where needed, for example for age checks, payroll or identity verification. sensitive person attribute subject…
  - **Gender** (one of the Person Gender values) — The person's gender as recorded for the organisation's lawful purposes. Entered only where there is a need and a lawful basis, normally by the person; never used to decide eligibility. The person identifies and is recorded as female. The p…
  - **Nationality** (a Country) — The country whose nationality the person holds. Chosen from the list of countries; used by identity and compliance processes. Not Party identity; process-specific.
  - **Party Type** (required, one of the Person Party Type values) — Identifies whether the party is a person or an organization. Determines which party specialization is applicable and prevents business processes from interpreting an organization as an individual or vice versa. Used to select Person or Org…
  - **Display Name** (required) — The business-facing name by which the party is normally displayed and recognized. Provides a consistent human-readable representation independent of whether the party is a person or organization. Used in forms, search results, documents, t…
  - **Status** (required, one of the Person Status values) — Controls whether the party may participate in new business activity. Represents the operational lifecycle of the party relationship with the enterprise, not the party's legal existence. Used by onboarding, transaction validation, account m…
  - **External Reference** — An identifier assigned to the party by an external system or business partner. Preserves a cross-system identity that allows CEDM to reconcile a party with another master-data system. Used for integrations, migration, reconciliation, EDI,…

### Person Gender

The values of person gender, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Person Party Type

The values of person party type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Person Status

The values of person status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Product

A canonical business offering or managed item that can be bought, sold, stocked, consumed, delivered or subscribed to, and that other processes refer to. Product is the shared definition of what the business deals in. Sales, purchasing, stock, manufacturing and finance all refer to the same product record, so a price, a stock level and an invoice line are about the same thing. Created by product management when an item enters the catalogue; maintained over its life; referenced on almost every order, movement and invoice line. A product belongs to a ProductCategory and Brand, is supplied by Su…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code by which staff and systems name the product. Unique; assigned by product management and used in orders, price lists and integrations.
  - **Name** (required) — The name of the product as shown to users and customers. Shown in catalogues, on documents and in search results.
  - **Description** — A longer description of what the product is. Written by product management; used on websites, quotes and datasheets.
  - **Product Type** (required, one of the Product Product Type values) — What kind of offering the product is, which decides how it is bought, stocked and delivered. Chosen on creation; stock rules apply only to physical types. A finished physical item that is bought or sold and held in stock. A raw material or…
  - **Status** (required, one of the Product Status values) — Whether the product can currently be traded. Set by product management; new orders are accepted only for ACTIVE products. Being set up; not yet tradable. Available for ordinary trading. Being phased out; existing stock may be sold but it i…
  - **Sku** — The stock-keeping unit code used in warehouses and on retail systems. Assigned at creation; printed on labels and scanned during handling.
  - **Unit Of Measure** (a Unit Of Measure) — The base unit in which the product is counted, such as each or kilogram. Chosen on creation; stock and order quantities are converted to it.
  - **Standard Price** — The standard selling price of the product. Set by pricing; quotes and orders start from it before discounts.
  - **Tax Category** — The tax category that decides how the product is taxed. Chosen on creation; tax rules look it up when documents are priced.
  - **Currency** (a Currency) — The Currency this Product belongs to.

### Product Product Type

The values of product product type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Product Status

The values of product status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Purchase Order

Represents the formal commercial procurement commitment between a buying organization and a Supplier. PurchaseOrder establishes what the Supplier is expected to provide; it is not proof that goods arrived or that later returns occurred. Purchasing, supplier management, receiving, warehouse operations, accounts payable, budgeting, inventory planning and analytics. PurchaseRequisition represents internal demand. PurchaseOrder converts approved demand into an external commitment. PurchaseOrderLine specifies the commitment. GoodsReceipt records actual receipt and acceptance. InventoryMovement rec…

Readable by every signed-in person.

Fields:
  - **Order Number** (required) — The human-facing procurement reference quoted by the buyer and supplier for this order. Assigned when the order is created and unique; used by buyers, suppliers, receiving, accounts payable and integrations to find it. Business reference d…
  - **Order Date** (required) — Date and time the procurement commitment is created or issued. Supports chronology, approval, reporting and reconciliation. Distinct from requested delivery, receipt, return, invoice and payment dates. Anchors the commitment lifecycle.
  - **Status** (required, one of the Purchase Order Status values) — Where the purchase commitment stands from draft through issue, receipt and closure. Moved by buyers, approvers and receiving; controls authorisation, issuing, cancellation and closure, and cancelled and closed are final. Being prepared by…
  - **Currency** (a Currency) — Currency qualifying order monetary values. Used for pricing, totals, invoice matching, supplier credit calculation and financial reporting. Qualifies amounts and does not identify Supplier or Product.
  - **Requested Delivery Date** — The date by which the buyer asks the supplier to deliver the goods or complete the service. Entered by the buyer and communicated to the supplier; receiving and planners use it to expect arrivals and chase late orders. A request, not proof…
  - **Total Amount** — Order-level value derived from committed lines and commercial adjustments. Used for approval, budget, supplier commitment and invoice reconciliation. Must reconcile with PurchaseOrderLine values and currencyId.
  - **Supplier** (required, a Supplier) — Supplier receiving the procurement commitment. Drives sourcing, delivery, receiving, supplier performance, returns and accounts payable. GoodsReceipt and SupplierReturn supplier should normally match this supplier.
  - **Request For Quotation** (a Request For Quotation) — Sourcing solicitation from which this order was awarded when applicable. Preserves demand-to-source-to-order traceability. Procurement compliance, price validation, and audit. Optional for direct or non-RFQ procurement. Supplies sourcing c…
  - **Supplier Quotation** (a Supplier Quotation) — Accepted supplier offer forming the commercial basis of this order when applicable. Preserves awarded price and term provenance. Order verification, three-way sourcing audit, and supplier analysis. Optional where procurement does not use s…
  - **Organization** (a Organization) — The buying organization that issues the order and is committed to pay for it. Chosen when the order is created; decides which legal entity, budget, tax rules and approvals apply to the purchase. At most one organization: the buyer is a sin…
  - **Delivery Location** (a Location) — The place where the ordered goods are to be delivered or the service performed. Chosen by the buyer; receiving, logistics planning and the supplier's dispatch use it to route the delivery. At most one delivery location per order; a single…
  - **Supplier Performance Assessment** (a Supplier Performance Assessment) — The SupplierPerformanceAssessment this PurchaseOrder belongs to.

Line items — **Purchase Order Line**: kept inside each Purchase Order and reached by opening it, never on their own. One item ordered on a purchase order, with the quantity, price and the progress of receipt, invoicing and return. The line is where the commitment is made precise: which product, how many, at what price and from what source. It keeps the price as agreed at the time and tracks what has since arrived…

### Purchase Order Line Price Source

The values of purchase order line price source, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Purchase Order Status

The values of purchase order status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Purchase Requisition

Represents internal demand for goods or services before that demand becomes an external procurement commitment. PurchaseRequisition is the demand and authorization layer of procurement. It answers what the organization needs, why it is needed, who requested it, and whether the organization authorized procurement. PurchaseOrder answers what was actually committed to a Supplier. Used by employees, managers, budget owners, procurement teams, sourcing functions, inventory planners, maintenance organizations, and approval workflows. PurchaseRequisition connects requester, organization, requested l…

Readable by every signed-in person.

Fields:
  - **Requisition Number** (required) — The business-facing reference used by employees, procurement teams, approvers, and reports to identify the request. Used in approval forms, sourcing communication, procurement reports, and links between internal demand and downstream purch…
  - **Requisition Date** (required) — The date on which the internal procurement demand was formally created. Used for demand aging, approval turnaround, budgeting, sourcing analysis, and procurement planning. It represents internal demand creation and is distinct from Purchas…
  - **Status** (required, one of the Purchase Requisition Status values) — Controls the lifecycle of the internal procurement request and whether it may progress toward sourcing or ordering. Drives approval workflow, buyer action, sourcing eligibility, conversion to PurchaseOrder, reporting, and cancellation rule…
  - **Justification** — The business reason explaining why the requested goods or services are needed. Used by approvers to evaluate necessity, budget owners to validate spend, and procurement teams to understand sourcing context. Justification explains the reaso…
  - **Requester** (required, a Party) — Identifies the person or party that originated the procurement demand. Used for approval routing, clarification, accountability, notifications, and audit. Exactly one requester is responsible for originating the requisition. Requester is t…
  - **Organization** (a Organization) — Identifies the organizational context responsible for the procurement demand. Used for budget ownership, approval routing, purchasing policy, cost attribution, and reporting. Zero or one organization may be explicit when inherited from the…
  - **Supplier** (a Supplier) — Identifies a preferred or known Supplier when the requester or procurement process already has a supplier in mind. Used for preferred-supplier sourcing, direct procurement, catalog requests, and buyer guidance. Optional because supplier se…

Line items — **Purchase Requisition Line**: kept inside each Purchase Requisition and reached by opening it, never on their own. Represents one measurable internal procurement demand before it becomes an external supplier commitment. PurchaseRequisitionLine is where a business need becomes specific enough for procurement to source, approve, compare, and eventually order. It is demand, not yet a purchase obligation. Used by r…

### Purchase Requisition Status

The values of purchase requisition status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Request For Quotation

Governs solicitation of supplier offers for approved procurement demand. PurchaseRequisition authorizes internal demand; RequestForQuotation solicits offers; SupplierQuotation records offers; PurchaseOrder creates the external commitment. Strategic sourcing, competitive procurement, supplier selection, negotiation, compliance, and audit. Bridges requisitions and suppliers to comparable responses and resulting purchase orders. Draft → issued → closed/awarded, with cancellation. Demand or supplier eligibility changes revalidate open sourcing; awarded history remains auditable and downstream ord…

Readable by every signed-in person.

Fields:
  - **Rfq Number** (required) — The reference that buyers and suppliers quote when discussing this request, such as RFQ-2026-0142. Allocated by the buyer on creation and unique across requests; printed on the invitation and used to match replies. Identifies the solicitat…
  - **Issued At** — The date and time the request was formally sent to suppliers. Set when the status moves from DRAFT to ISSUED; the response window and sourcing timeline are measured from it. Establishes when suppliers were invited to respond. Distinct from…
  - **Response Due At** — The deadline by which suppliers must return their quotations. Set by the buyer before issue and stated to suppliers; replies after it are late and handled under the late-response policy. Defines the normal competitive response window. Does…
  - **Status** (required, one of the Request For Quotation Status values) — The stage the request has reached, from preparation through supplier responses to award. Starts as DRAFT and is moved by the buyer; it controls whether suppliers may respond and whether an award can be made. Being prepared by the buyer; no…

Line items — **Request For Quotation Line**: kept inside each Request For Quotation and reached by opening it, never on their own. Line-level bridge from approved procurement demand to comparable supplier offers. The RFQ header controls the sourcing event; this line defines exactly what is being sourced. Strategic sourcing, competitive bids, services procurement, award allocation, and audit. PurchaseRequisitionLine supplies de…

### Request For Quotation Status

The values of request for quotation status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### State Province

A first-level division of a country, such as a state, province or region, from the ISO 3166-2 registry. States and provinces give addresses a standard, checkable subdivision. Choosing from this list avoids misspelt regions and lets reports group by region. Maintained as reference data; chosen in addresses; read by tax, shipping and reports. A state or province belongs to one country and contains cities. Entries are loaded from the standard and rarely change; when a division is abolished it is withdrawn without deleting history. "California" belongs to the United States and contains cities suc…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The ISO 3166-2 code, the country code and the division's own, such as US-CA. Search, integration and reporting. Unique; begins with the code of the country it belongs to.
  - **Name** (required) — The English name of the division, such as California or Bavaria. Shown in lists and on addresses; it is a label only, so integrations should use the ISO code as the stable key. Does not replace the code as the stable key.
  - **Subdivision Type** — What the registry calls the division in its country: State, Province, Region, Territory and so on. Labelling the field for users of that country. Describes this division only.
  - **Country** (required, a Country) — The country the division belongs to. Chosen first; the divisions offered are those of that country. Every state or province belongs to exactly one country. A city and an address are narrowed by the country before the state.

### Supplier

Represents the procurement-facing role of a Party that supplies business inputs and participates in reverse procurement, supplier claims, financial recovery and performance governance. Party provides identity, PartyRole provides the role, and Supplier adds procurement-specific qualification, terms and transaction history. SupplierClaim captures the case; SupplierClaimResolution captures the remedy; downstream transactions execute it; SupplierPerformanceAssessment interprets accumulated evidence for governance. Central to source-to-pay, sourcing, procurement, receiving, supplier returns, quali…

Readable by every signed-in person.

Fields:
  - **Party Role** (required, a Party Role) — Points to the party role this supplier record specializes, tying the sourcing profile to the underlying party. Set once at creation and never reassigned; unique, so a party role has at most one supplier profile, and names and addresses are…
  - **Supplier Code** (required) — Enterprise supplier business reference. Used on purchase orders receipts invoices returns credits payments claims portals reports and integrations. Distinct from legal name and external registration identifiers. Identifies the supplier acr…
  - **Supplier Type** (one of the Supplier Supplier Type values) — Classifies what kind of organization or person the supplier is, for due diligence and reporting. Chosen at onboarding; it influences which qualification checks, tax treatment and spend reports apply to the supplier. A natural person or sol…
  - **Qualification Status** (one of the Supplier Qualification Status values) — Records whether the supplier has been vetted and cleared to receive orders under sourcing policy. Updated by procurement or compliance after due diligence; buyers check it before issuing requests for quotation or orders. No qualification r…
  - **Payment Terms** — Default supplier settlement policy. Used by PurchaseOrder Invoice payables payment scheduling and cash forecasting. Transaction or contract terms may override the default. Supplies default payable timing.
  - **Status** (required, one of the Supplier Status values) — The operational state of the supplier record, showing whether it can currently be dealt with. Set by procurement; ACTIVE suppliers appear in pickers, while blocked or retired ones are refused on new transactions. The supplier is open for b…
  - **Party** (required, a Party) — The party that holds the role. Set when the role is assigned and not changed. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back to the canonical identity.
  - **Role Type** (required, one of the Supplier Role Type values) — The kind of role the party plays, such as customer, supplier, employee or partner. Chosen when the role is assigned; decides which specialised record (customer, supplier and so on) carries its detail. The party buys goods or services from…
  - **Code** — An optional code for the role. Used by integrations that identify the role separately from the party. Identifies the role instance and must not replace Party or specialized role identifiers.
  - **Valid From** — The first date on which the role applies. Set when the role is assigned. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a newly established role.
  - **Valid To** — The last date on which the role still applies to the party. Set when the role ends, such as a contract expiry; empty while open-ended, and later use of the role is refused. Historical transactions may continue referencing the role after va…
  - **Organization** (a Organization) — Optional organizational scope in which the role is recognized. Supports multi-enterprise, subsidiary, business-unit, and operating-context scenarios. Zero means global/context-independent; one means explicitly scoped to one organization. D…

### Supplier Claim

Provides a formal auditable case for supplier-related quality or commercial recovery while keeping the decision and physical/financial consequences as separate controlled records. SupplierClaim explains what went wrong and what recovery was requested or agreed. SupplierClaimResolution records the authorized remedy. SupplierReturn handles physical reversal; SupplierCreditNote or SupplierDebitNote handles financial adjustment; Payment handles cash movement. Supplier quality procurement warranty dispute management recovery supplier scorecards accounts payable and audit. PurchaseOrder GoodsReceip…

Readable by every signed-in person.

Fields:
  - **Claim Number** (required) — The number of the claim, such as SCL-0231. Identifies the claim for procurement quality and supplier communication. Used in correspondence investigations reporting and reconciliation. Distinct from PurchaseOrder GoodsReceipt Invoice Suppli…
  - **Claim Date** (required) — Date and time the claim was raised. Establishes when the organization formally asserted the supplier issue. Supports SLA measurement dispute aging supplier performance and audit. Distinct from receipt inspection return resolution and finan…
  - **Status** (required, one of the Supplier Claim Status values) — Where the claim is in review and settlement. Being prepared; not yet sent to the supplier. Raised with the supplier and awaiting review. Being assessed by the supplier or the buyer. The supplier accepts the claim in full. The supplier acce…
  - **Claim Type** (required, one of the Supplier Claim Claim Type values) — The main nature of the claim, such as quality, damage, shortage or a commercial dispute. Chosen when the claim is opened; it drives routing, required evidence, supplier scorecards and analytics. Goods or services do not meet quality or spe…
  - **Claimed Amount** — Financial value asserted by the organization in the claim. Represents requested or estimated monetary recovery before supplier agreement or final adjustment. Supports negotiation exposure reporting and recovery analysis. It is not an accou…
  - **Resolution Code** (one of the Supplier Claim Resolution Code values) — The outcome agreed for the claim. Nothing further is done. The supplier sends replacement goods. The goods are repaired. The goods are returned to the supplier. The supplier issues a credit. The buyer raises a debit adjustment. The price i…
  - **Notes** — Free-text narrative of the claim, covering what happened and what was discussed with the supplier. Written by the claim handler and updated during investigation; supports escalation and audit but should not replace structured fields. Recor…
  - **Supplier** (required, a Supplier) — Supplier against whom the claim is raised. Identifies the external party responsible for the disputed supply or service. Supports communication scorecards recovery and escalation. Supplies supplier qualification and commercial context.
  - **Purchase Order** (a Purchase Order) — Procurement commitment associated with the claim. Connects the supplier issue to the original purchasing commitment. Supports contractual price and quantity investigation. Supplies commercial source evidence.
  - **Supplier Performance Assessment** (a Supplier Performance Assessment) — The SupplierPerformanceAssessment this SupplierClaim belongs to.

### Supplier Claim Claim Type

The values of supplier claim claim type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Claim Resolution

Converts a supplier claim decision into a controlled auditable execution plan without conflating the case remedy and resulting transactions. SupplierClaim explains the problem; SupplierClaimResolution records the agreed remedy; SupplierReturn SupplierCreditNote SupplierDebitNote and Payment execute distinct physical or financial consequences. Supplier dispute management procurement recovery accounts payable quality logistics and audit. The resolution bridges case management and execution while preserving independent transaction histories. SupplierClaim accepted → remedy negotiated → SupplierC…

Readable by every signed-in person.

Fields:
  - **Resolution Number** (required) — The business reference of the resolution decision, used with the supplier and internal teams. Assigned when the resolution is drafted; unique; quoted in approvals, correspondence and reconciliation, and distinct from the claim number. Iden…
  - **Resolution Date** (required) — The date and time the agreed remedy was authorized and became effective. Set at approval; used for SLA reporting and financial control, and it anchors the start of downstream execution. Establishes when the agreed remedy became effective.…
  - **Resolution Type** (required, one of the Supplier Claim Resolution Resolution Type values) — The remedy agreed with the supplier for the claim, such as replacement, credit or cash recovery. Chosen when the resolution is drafted; it routes the downstream work and decides which execution evidence is required. The claim was reviewed…
  - **Status** (required, one of the Supplier Claim Resolution Status values) — How far the agreed remedy has been carried out, from draft and approval to execution or failure. Starts as DRAFT; approval releases the downstream work, and the status shows whether the required consequences completed. The resolution is be…
  - **Approved Amount** — The money the organization is authorized to recover from the supplier under this resolution. Set at approval from the negotiated outcome; it is the target that credit notes, debit notes or payments are reconciled against. Defines the finan…
  - **Supplier** (a Supplier) — The Supplier this SupplierClaimResolution belongs to.
  - **Supplier Claim** (required, a Supplier Claim) — Supplier claim being resolved. Connects the remedy to the case and evidence that established the issue. Claim closure and audit. Supplies authoritative case context.
  - **Supplier Performance Assessment** (a Supplier Performance Assessment) — The SupplierPerformanceAssessment this SupplierClaimResolution belongs to.

### Supplier Claim Resolution Code

The values of supplier claim resolution code, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Claim Resolution Resolution Type

The values of supplier claim resolution resolution type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Claim Resolution Status

The values of supplier claim resolution status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Claim Status

The values of supplier claim status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Credit Note

Represents an explicit financial reduction of supplier payable exposure while preserving original procurement invoice claim resolution and return history. SupplierClaim explains the issue; SupplierClaimResolution authorizes the remedy; SupplierReturn is the physical event; SupplierCreditNote records the financial consequence; SupplierCreditNoteApplication records consumption against invoices; JournalEntry records accounting recognition. Accounts payable procurement supplier reconciliation claims tax accounting and audit. SupplierReturn records physical reversal, SupplierClaim records the case…

Readable by every signed-in person.

Fields:
  - **Credit Note Number** (required) — The reference printed on the credit document, used by the supplier and by payables staff. Entered from the supplier's document or assigned on recognition; unique; used to match the credit to statements and integrations. Identifies the cred…
  - **Credit Note Date** (required) — The effective date of the credit, which decides the accounting and tax period it falls in. Entered when the credit is recorded; payable aging and tax reporting use it, and it can differ from the application date. Establishes financial chro…
  - **Status** (required, one of the Supplier Credit Note Status values) — The stage of the credit from preparation and approval through posting, application against invoices, or cancellation. Starts as DRAFT; payables staff approve and post it, and the applied states follow the invoice applications made against…
  - **Currency** (required, a Currency) — The currency in which every amount on the credit note is expressed. Chosen when the credit is created, normally the original invoice currency; applying it to an invoice in another currency needs an exchange rate. Defines monetary denominat…
  - **Subtotal** (required) — The credit value before tax, summed from the credit lines. Calculated from the lines; tax is computed on it and it is reconciled with the lines before posting. Pre-tax reduction derived from credit lines. Feeds total credit calculation.
  - **Tax Amount** (required) — The tax reversed or adjusted by this credit, summed from the lines. Calculated from the credit lines; defaults to zero and is used in tax reporting and accounting. Tax correction associated with credited value. Contributes to total credit.
  - **Total Amount** (required) — The total payable reduction the credit note represents, including tax. Calculated as subtotal plus tax; it is the most credit that can be applied to invoices and is shown on supplier statements. Financial value recognized as credit against…
  - **Amount Applied** (required) — Portion of supplier credit already applied to payable claims. Separates credit created from portion consumed against invoices. Drives open credit and payable reconciliation. Must reconcile with active SupplierCreditNoteApplication records.…
  - **Amount Unapplied** (required) — The credit still available, being the total less what active applications have consumed. Maintained as applications and reversals are recorded; payables staff use it to find credit to offset or request as a refund. Available credit exposur…
  - **Supplier** (required, a Supplier) — Supplier associated with the credit. Identifies supplier whose payable exposure is reduced. Payables and supplier statements. Reconciles source Invoice SupplierClaim and SupplierReturn context.
  - **Supplier Claim** (a Supplier Claim) — Supplier claim supporting the credit. Connects the financial adjustment to the business case and evidence for recovery. Claim resolution audit and reconciliation. Provides case context for credit authorization.
  - **Supplier Claim Resolution** (a Supplier Claim Resolution) — Authorized claim resolution that approved this credit remedy. Connects the credit to the controlled decision authorizing the financial recovery. Governance approval execution tracking and claim closure. Supplies execution mandate for CREDI…
  - **Source Return** (a Supplier Return) — Supplier return that caused the credit. Connects financial adjustment to physical reverse-procurement event. Return-to-credit traceability and approval. Provides return eligibility evidence.

Line items — **Supplier Credit Note Line**: kept inside each Supplier Credit Note and reached by opening it, never on their own. Provides the auditable quantity, value, discount and tax detail behind a supplier payable adjustment. It is the financial mirror of an original supplier invoice line for the credited portion, not a replacement of that line. Accounts payable, tax, supplier reconciliation, audit and accounting. Suppl…

### Supplier Credit Note Application

Provides the auditable bridge by which a posted SupplierCreditNote is consumed against a purchase Invoice. SupplierCreditNote establishes the authorized payable reduction; Invoice remains the original claim; SupplierCreditNoteApplication records exactly where and how much of the credit was used. Accounts payable, supplier returns, supplier statements, invoice reconciliation, tax, audit and payment planning. SupplierCreditNoteLine explains source credit detail; InvoiceLine explains original payable detail; this entity records header-level application evidence; JournalEntry records accounting r…

Readable by every signed-in person.

Fields:
  - **Supplier Credit Amount** (required) — Portion of the SupplierCreditNote consumed by this application. Represents the source-side amount of supplier credit allocated to an invoice. Controls remaining unapplied supplier credit and reconciliation. Must use the SupplierCreditNote…
  - **Invoice Amount** (required) — Amount by which the purchase Invoice payable claim is reduced. Represents the target-side financial effect on the payable. Drives payable exposure and reconciliation. Must use the Invoice currency and may differ from supplierCreditAmount o…
  - **Exchange Rate** (a Exchange Rate) — Exchange rate used when supplier credit and invoice currencies differ. Preserves conversion evidence for cross-currency supplier credit application. Supports audit and reproducibility. Required for permitted cross-currency applications. Co…
  - **Applied At** (required) — Timestamp when the supplier credit application became effective. Establishes adjustment chronology. Supports accounting periods, supplier statements, audit and reconciliation. Distinct from SupplierCreditNoteDate and InvoiceDate. Determine…
  - **Status** (required, one of the Supplier Credit Note Application Status values) — Whether this application of supplier credit is being prepared, in force, reversed or cancelled. Starts as DRAFT; payables staff activate it to reduce the invoice, and a reversal is recorded as a new application. Prepared and not yet applie…
  - **Reversal Of Application** (a Supplier Credit Note Application) — Points to the earlier application of supplier credit that this record undoes. Set only on a correcting record; the original is never edited, so the history of the credit stays intact for audit. Links correction to the original payable adju…
  - **Supplier Credit Note** (required, a Supplier Credit Note) — Supplier credit note supplying the payable reduction. Identifies the authorized supplier financial credit being consumed. Supports payable reconciliation and supplier statements. Exactly one SupplierCreditNote supplies each application. Su…
  - **Invoice** (required, a Invoice) — Purchase Invoice receiving the payable reduction. Identifies the supplier claim whose exposure is reduced. Supports accounts payable, reconciliation and supplier statements. Exactly one Invoice is targeted. Supplies eligible payable exposu…

### Supplier Credit Note Application Status

The values of supplier credit note application status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Credit Note Status

The values of supplier credit note status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Debit Note

Represents a buyer-issued financial debit against a supplier while preserving the original payable claim supplier-claim history resolution decision and application evidence. SupplierClaim explains the issue, SupplierClaimResolution authorizes the remedy, SupplierDebitNote records the financial recovery, SupplierDebitNoteApplication allocates that recovery to payable claims, and JournalEntry provides accounting recognition. Payment remains the separate cash-movement concept. Accounts payable procurement recovery supplier disputes tax accounting and audit. SupplierClaim provides the case, Suppl…

Readable by every signed-in person.

Fields:
  - **Debit Note Number** (required) — The business reference of the debit note, used on supplier statements and in correspondence. Assigned when the debit is drafted; unique; distinct from the claim, purchase order, invoice and return numbers. Identifies the debit adjustment i…
  - **Debit Note Date** (required) — Effective date of the supplier debit adjustment. Establishes financial chronology and accounting or tax period. Period control reconciliation reporting and supplier communication. Distinct from claim resolution invoice return and payment d…
  - **Status** (required, one of the Supplier Debit Note Status values) — Drafted by the buyer and not yet approved. Accepted internally and ready to post. Recorded in the accounts; available to offset what the buyer owes. Part of the debit has been offset against invoices. The whole debit has been used. A final…
  - **Currency** (required, a Currency) — The currency in which all amounts of the debit note are expressed. Chosen when the debit is created; applying it to an invoice in another currency needs recorded exchange rate evidence. Defines the monetary denomination of the adjustment.…
  - **Subtotal** (required) — The value of the debit before tax, summed from its lines. Calculated from the debit lines; tax is computed on it and it is checked before the note is posted. Aggregate financial increase before applicable tax. Feeds totalAmount.
  - **Tax Amount** (required) — The tax component of the debit adjustment, summed from its lines. Calculated from the lines; defaults to zero and is used in tax reporting and accounting reconciliation. Represents applicable tax added to the adjustment. Contributes to tot…
  - **Total Amount** (required) — The total of the supplier debit adjustment, including tax. Calculated as subtotal plus tax; it is the most that can be applied to invoices and is shown to the supplier. Financial amount by which supplier-related recoverable exposure is inc…
  - **Amount Applied** (required) — Portion of the supplier debit recognized against eligible supplier payable claims. Tracks how much posted debit has been consumed by active SupplierDebitNoteApplication records. Reconciliation supplier statements and reporting. SupplierDeb…
  - **Amount Remaining** (required) — The part of the posted debit not yet applied to supplier invoices. Maintained as applications and reversals are recorded; it falls to zero when the debit is fully applied. Represents debit value still available for payable application or g…
  - **Supplier** (required, a Supplier) — Supplier responsible for the financial adjustment. Identifies the external party whose payable exposure is adjusted. Payables supplier communication and reconciliation. Establishes party context.
  - **Supplier Claim** (a Supplier Claim) — Supplier claim that provides the commercial or quality case for the debit. Connects financial adjustment to the case that established the recovery entitlement. Traceability approval and dispute management. Provides supporting evidence with…
  - **Supplier Claim Resolution** (a Supplier Claim Resolution) — Authorized claim resolution that approved this debit remedy. Connects the posted financial adjustment to the controlled decision that authorized the recovery. Governance approval audit and claim closure. Supplies the execution mandate for…

Line items — **Supplier Debit Note Line**: kept inside each Supplier Debit Note and reached by opening it, never on their own. Provides the auditable financial detail supporting one component of a SupplierDebitNote. The line explains exactly how a supplier recovery amount was calculated; it does not replace the original invoice supplier claim or claim resolution. Accounts payable supplier disputes accounting tax and audit.…

### Supplier Debit Note Application

Records the controlled application of a posted SupplierDebitNote against a specific supplier invoice payable claim. SupplierDebitNote establishes the financial adjustment; this entity records where that adjustment is consumed. It is not a Payment and does not rewrite the original Invoice. Accounts payable, supplier statements, reconciliation, audit, dispute resolution and financial integration. SupplierDebitNote is the source adjustment, Invoice is the target payable claim, ExchangeRate provides cross-currency evidence, and JournalEntry records accounting recognition separately. SupplierClaim…

Readable by every signed-in person.

Fields:
  - **Supplier Debit Amount** (required) — Amount of the supplier debit consumed by this application in debit-note currency. Defines the portion of the posted debit allocated to this payable claim. Reconciliation and remaining-amount calculation. May differ from invoiceAmount when…
  - **Invoice Amount** (required) — Amount of payable exposure reduced on the target invoice. Records the invoice-currency effect of the debit application. Accounts payable reconciliation and audit. Must reconcile to supplierDebitAmount using the recorded exchange rate when…
  - **Exchange Rate** (a Exchange Rate) — Exchange-rate evidence used when debit and invoice currencies differ. Provides reproducible conversion between application currencies. Accounting, tax, reconciliation and audit. Required for cross-currency application under policy. Determi…
  - **Applied At** (required) — The date and time the debit became effective against the target invoice. Set when the application is activated and not changed; it decides the accounting period and appears on supplier statements. Establishes settlement chronology. Anchors…
  - **Status** (required, one of the Supplier Debit Note Application Status values) — Whether this application of a supplier debit is being prepared, in force, reversed or cancelled. Starts as DRAFT; payables staff activate it to reduce the invoice, which also changes the debit's remaining balance. Prepared and not yet appl…
  - **Reversal Of Application** (a Supplier Debit Note Application) — Points to the earlier application of supplier debit that this record undoes. Set only on a correcting record; the original application is left unchanged so the audit trail stays complete. Provides explicit lineage for a corrective reversal…
  - **Supplier Debit Note** (required, a Supplier Debit Note) — Posted supplier debit being applied. Identifies the source financial adjustment. Remaining-balance and audit reconciliation. Supplies available debit amount and supplier context.
  - **Invoice** (required, a Invoice) — Supplier payable invoice receiving the debit application. Identifies the eligible original payable claim whose outstanding exposure is reduced. Accounts payable, reconciliation and supplier statements. Supplies target claim and currency co…

### Supplier Debit Note Application Status

The values of supplier debit note application status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Debit Note Status

The values of supplier debit note status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Performance Assessment

Provides a governed supplier scorecard that converts procurement, receipt, quality, claim, return and corrective-action evidence into an auditable performance assessment. Supplier remains the master relationship; operational transactions provide evidence; SupplierPerformanceAssessment interprets that evidence for governance without rewriting the underlying facts. Supplier qualification, sourcing, supplier reviews, performance management, corrective improvement, risk management and procurement analytics. PurchaseOrder and GoodsReceipt provide commercial and delivery evidence; QualityInspection…

Readable by every signed-in person.

Fields:
  - **Assessment Number** (required) — The human-facing reference of one supplier performance assessment, such as SPA-2026-Q2-014, quoted in review meetings. Assigned when the assessment is opened; unique across assessments, and used in scorecards, audit trails, review minutes…
  - **Assessment Date** (required) — Date on which the assessment is formally recorded. Establishes the governance point at which the evaluated performance becomes an assessment record. Supplier reviews, audit, reporting and decision chronology. Anchors approval and follow-up…
  - **Period Start** (required) — The first day of the window whose procurement, delivery and quality evidence is scored in this assessment. Set when the assessment is defined; evidence is counted only from this date, and it must not fall after the period end. Defines the…
  - **Period End** (required) — The last day of the evaluation window, closing the range of evidence the assessment scores. Set with the period start; transactions after this date are excluded, and trend reports compare successive periods by it. Defines the closing bound…
  - **Status** (required, one of the Supplier Performance Assessment Status values) — Where the assessment is in review and publication. Scores and notes are still being compiled. Under review by procurement or quality. Accepted and ready to publish. Shared with the supplier and used in decisions. Replaced by a later assess…
  - **Overall Score** — Aggregate supplier performance score for the assessment scope. Represents the governed result of the configured supplier scorecard calculation. Supplier ranking, sourcing decisions, escalation and trend analysis. Must be derived from defin…
  - **Rating** (one of the Supplier Performance Assessment Rating values) — The business grade given to the supplier once the overall score and governing criteria have been interpreted. Chosen by the reviewer or derived from the approved score; it drives supplier segmentation, review cadence and whether improvemen…
  - **Notes** — Free-text observations that explain the scores, record agreed context and capture points the figures do not show. Entered by the reviewer before approval; read by category managers and auditors alongside the evidence, and never a substitut…
  - **Supplier** (required, a Supplier) — Supplier being evaluated. Identifies the external party whose performance is assessed. Supplier governance, sourcing and improvement management. Supplies the master relationship and qualification context.

### Supplier Performance Assessment Rating

The values of supplier performance assessment rating, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Performance Assessment Status

The values of supplier performance assessment status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Qualification Status

The values of supplier qualification status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Quotation

Preserves a supplier's commercial response to governed sourcing. SupplierQuotation is evidence of an offer; RequestForQuotation is the solicitation; PurchaseOrder is the later commitment. Sourcing, bid comparison, negotiation, supplier selection, procurement compliance, and audit. Connects Supplier and RFQ to resulting PurchaseOrders without conflating offer and commitment. Received → under review → accepted/rejected/expired/withdrawn. Supplier qualification, RFQ changes, and validity changes revalidate open evaluation; accepted historical offers remain immutable evidence.

Readable by every signed-in person.

Fields:
  - **Quotation Number** (required) — The reference the supplier or the sourcing team uses to identify this quotation, such as Q-88214. Entered from the supplier's document; quoted in negotiation and order conversion, and unique per supplier where the supplier numbers its own…
  - **Submitted At** (required) — The moment the supplier's response was received or submitted to the buyer for the request for quotation. Recorded on receipt; compared with the request's closing time to judge late bids and to order offers chronologically. Establishes offe…
  - **Valid Until** — Last date on which the commercial offer remains valid. Defines the supplier's price/terms validity window. Award eligibility and purchase-order conversion. Expiry does not rewrite historical offer evidence.
  - **Total Amount** — The overall price the supplier is offering across all quotation lines, in the quoted currency. Entered or summed from the lines; used for side-by-side bid comparison and approval thresholds, and should reconcile with the line prices. Summa…
  - **Status** (required, one of the Supplier Quotation Status values) — Where the quotation stands in evaluation, from receipt through award decision or lapse. Moves as the sourcing team reviews it; only an accepted quotation may be converted to purchase orders. The quotation has been logged but evaluation has…
  - **Supplier** (required, a Supplier) — Supplier making the offer. Identifies the commercial counterparty candidate. Qualification, comparison, award, and performance analysis. Exactly one supplier owns the response. Must be eligible under sourcing policy.
  - **Request For Quotation** (required, a Request For Quotation) — RFQ answered by this offer. Supplies the governed solicitation and demand context. Comparison and audit. Every sourcing response belongs to exactly one RFQ. Defines requirements and eligible sourcing context.

Line items — **Supplier Quotation Line**: kept inside each Supplier Quotation and reached by opening it, never on their own. Line-level supplier offer used for sourcing comparison and controlled conversion to purchase commitment. SupplierQuotationLine is commercial evidence, while PurchaseOrderLine is the binding procurement commitment. Bid comparison, negotiation, split award, purchase-order generation, compliance, and…

### Supplier Quotation Line Award Status

The values of supplier quotation line award status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Quotation Status

The values of supplier quotation status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Return

Coordinates the controlled reversal of accepted procurement fulfillment while preserving original purchasing, receiving, inventory, quality and financial history. A supplier return is a new reverse-procurement event; it does not delete or rewrite the original PurchaseOrder, GoodsReceipt or Invoice. Purchasing, warehouse operations, quality, supplier management, accounts payable and audit. PurchaseOrder identifies the commitment, GoodsReceipt identifies accepted receipt, SupplierReturnLine identifies returned quantity, QualityInspection provides quality evidence where required, InventoryMoveme…

Readable by every signed-in person.

Fields:
  - **Return Number** (required) — The number of the return, such as RTS-0219. Operational identifier communicated to warehouse staff and the supplier. Used for logistics, supplier communication, investigation and reconciliation. Distinct from the original purchase order, r…
  - **Status** (required, one of the Supplier Return Status values) — Where the return is, from authorisation to completion. Being prepared; not yet authorised. Approved to be sent back. On its way to the supplier. The supplier has taken delivery. Credit or replacement is settled. A final state. Withdrawn be…
  - **Return Date** (required) — Business timestamp for initiating the supplier return. Establishes the chronology of the reverse-procurement event. Supports logistics, audit, reporting and supplier claims. Distinct from original receipt date and supplier acceptance date.…
  - **Reason Code** — Reason for returning received goods to the supplier. Classifies defects, over-receipt, wrong item, damage, commercial rejection or other causes. Supports quality, supplier performance, warranty, claims and analytics. Explains why the retur…
  - **Supplier** (required, a Supplier) — Supplier to whom the goods are being returned. Identifies the external party receiving the returned goods. Supports authorization, logistics, supplier claims and payable reconciliation. Must normally agree with the source PurchaseOrder and…
  - **Purchase Order** (a Purchase Order) — Original procurement commitment associated with the returned goods. Connects the reverse event to the commercial purchase commitment. Supports quantity eligibility and procurement traceability. Supplies original commitment context; it is n…
  - **Supplier Claim** (a Supplier Claim) — The SupplierClaim this SupplierReturn belongs to.
  - **Supplier Claim Resolution** (a Supplier Claim Resolution) — The SupplierClaimResolution this SupplierReturn belongs to.
  - **Supplier Performance Assessment** (a Supplier Performance Assessment) — The SupplierPerformanceAssessment this SupplierReturn belongs to.

Line items — **Supplier Return Line**: kept inside each Supplier Return and reached by opening it, never on their own. Defines exactly what previously accepted procurement quantity is being returned and connects that quantity to quality, physical and financial consequences. SupplierReturnLine is the bridge between accepted receiving evidence and quality, reverse inventory and payable workflows. Reverse logistics, s…

### Supplier Return Line Disposition

The values of supplier return line disposition, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Return Status

The values of supplier return status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Role Type

The values of supplier role type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Status

The values of supplier status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Supplier Supplier Type

The values of supplier supplier type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Task

A discrete unit of business work performed by a person, organisation, system or workflow participant. Tasks are how work is handed out and tracked, whether a person must act or a system step must run. Their type, status, owner and dates show what is waiting, what is stuck and what is done. Created by people or workflows; picked up by assignees; read by managers and reports. A task may belong to a workflow, an assignee, an organisation and a related document. A task is created, becomes ready, is assigned and worked, and ends completed, cancelled or failed. It may be blocked and resumed. All th…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short business code that identifies the task in work queues, such as TSK-10482. Assigned when the task is created; quoted in assignments, escalations and reports, and used to find the task without its full name.
  - **Name** (required) — A short title stating what work the task asks someone or something to do. Entered by the creator or the workflow that spawned it; shown in queues and notifications, so it should read as an action.
  - **Description** — Fuller instructions explaining what is to be done, why, and any details the performer needs. Written by the creator; read by the assignee before starting, and updated if scope changes while the task is open.
  - **Task Type** (required, one of the Task Task Type values) — The kind of work the task is. Chosen when created; decides who or what performs it. Work done by a person. A step run automatically. A person must approve or refuse something. A choice that decides the path. A message to be sent. A script…
  - **Status** (required, one of the Task Status values) — Where the task stands, from creation through assignment and execution to completion, cancellation or failure. Moved by the assignee, workflow or system as work proceeds; completed, cancelled and failed tasks are closed to further work. The…
  - **Priority** (required, one of the Task Priority values) — How urgently the task should be worked relative to others in the same queue. Set by the creator or workflow rules; assignees and queue views sort by it, and it may raise escalations when overdue. Can wait behind other work without business…
  - **Due At** — Set when created; overdue tasks are flagged. Compared with the completion time. Records when the due event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities.
  - **Started At** — Set when work starts. Not later than the completion time. Records when the started event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities.
  - **Completed At** — Set when the task is completed; required for a completed task. Gives the time taken. Records when the completed event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities.
  - **Assignee** (a Party) — The person responsible for the task. Chosen when assigned. At most one assignee. Decides whose list it is on.
  - **Organization** (a Organization) — The organisation the task is for. Chosen when it concerns a unit. At most one organisation. Groups tasks by unit.

### Task Priority

The values of task priority, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Task Status

The values of task status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Task Task Type

The values of task task type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Unit Of Measure

Defines the measurement semantics that make numeric quantities comparable across CEDM workflows. A quantity without a valid unit is incomplete business information. UnitOfMeasure provides the dimension and conversion context needed to interpret quantities correctly. Central to Product, sales, procurement, receiving, inventory, fulfillment, invoicing, manufacturing, logistics, service, and reporting. Product supplies a default measurement context. Transaction lines may use compatible units. GoodsReceiptLine supplies received/accepted quantities. InventoryBalance and InventoryMovement require c…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Standard business code for the unit, such as EACH, KG, L, HOUR, or DAY. Used in forms, integrations, documents, validation, and quantity display. Code identifies the unit definition; it does not represent a conversion or quantity itself. U…
  - **Name** (required) — Human-readable name of the measurement unit. Used in user interfaces, reports, documents, catalogs, and search. Describes the unit definition identified by code and unitOfMeasureId. Provides understandable measurement context to business u…
  - **Symbol** — Standard display symbol for the unit. Used for compact display in documents, labels, reports, and interfaces. Symbol is presentation metadata and does not replace the canonical unit code. Improves human-readable representation of quantitie…
  - **Category** (required, one of the Unit Of Measure Category values) — A general count or quantity of items. A distance, such as metres or inches. A surface, such as square metres. A capacity, such as litres. A weight, such as kilograms or tonnes. A duration, such as hours or days. A number of discrete things…
  - **Conversion Factor** — Default multiplicative factor relating this unit to its base unit when a simple linear conversion applies. Defines a master conversion used for future quantity interpretation. Used for quantity conversion when no context-specific conversio…
  - **Base Unit** (a Unit Of Measure) — Identifies the canonical base unit against which this derived unit is normally converted. Supports standardized quantity storage and conversion. A derived unit belongs to the same dimensional category as its base unit. Provides the common…
  - **Status** (required, one of the Unit Of Measure Status values) — Available for use on products and documents. Not offered for now; can be reactivated. No longer used; kept for history. A final state. Controls whether the unit can be used for new transactions. Used by master-data validation and transacti…

### Unit Of Measure Category

The values of unit of measure category, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Unit Of Measure Status

The values of unit of measure status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

## Value lists

### Address Address Type

- **RESIDENTIAL** — A private home address.
- **BUSINESS** — A place of business or office.
- **BILLING** — Where invoices and statements are sent.
- **SHIPPING** — Where goods are delivered.
- **REGISTERED** — The official registered address of a legal entity.
- **POSTAL** — A mailing address such as a post office box.
- **OTHER** — Any purpose not listed.

### Address Status

- **ACTIVE** — Valid and available for new documents.
- **INACTIVE** — Temporarily not offered, for example while a move is being confirmed; it can be reactivated.
- **RETIRED** — No longer valid; kept only as history and in past documents.

### Currency Status

- **ACTIVE** — Available for use on new prices, documents and payments.
- **INACTIVE** — Temporarily not offered, for example while a market is closed; it can be reactivated.
- **RETIRED** — No longer in use, such as a replaced national currency; historical amounts keep it.

### Exchange Rate Rate Type

- **SPOT** — The market rate at a moment in time.
- **CONTRACT** — A rate fixed by agreement with a counterparty.
- **DAILY** — The rate published for a business day.
- **MONTHLY** — An average or closing rate for a month.
- **ACCOUNTING** — A rate set by the finance team for ledger translation.
- **CUSTOM** — Any other rate defined by policy.

### Exchange Rate Status

- **DRAFT** — Being prepared; not yet used.
- **ACTIVE** — In force and usable for conversion.
- **EXPIRED** — Its validity period has ended; kept for past conversions.
- **CANCELLED** — Withdrawn; must not be used.

### Goods Receipt Status

- **DRAFT** — Being prepared before the delivery is confirmed.
- **RECEIVED** — Delivery confirmed and counted at the dock.
- **INSPECTION PENDING** — Held until a quality inspection is done.
- **ACCEPTED** — All received quantity accepted into stock. A final state.
- **PARTIALLY ACCEPTED** — Some quantity accepted and the rest rejected. A final state.
- **REJECTED** — Refused entirely and returned or held. A final state.
- **CANCELLED** — Withdrawn before receipt was confirmed. A final state.

### Invoice Invoice Type

- **SALES** — An invoice the organisation issues to a customer for goods or services supplied.
- **PURCHASE** — An invoice the organisation receives from a supplier.
- **CREDIT NOTE** — A document that reduces what is owed under an earlier invoice.
- **DEBIT NOTE** — A document that increases what is owed under an earlier invoice.

### Invoice Line Matching Status

- **NOT APPLICABLE** — The line does not need matching, for example a sales invoice line.
- **UNMATCHED** — Not yet compared with the purchase order and goods receipt.
- **MATCHED** — Quantity and price agree with the order and receipt within tolerance.
- **PARTIALLY MATCHED** — Some of the line's quantity or amount agrees; the rest does not.
- **EXCEPTION** — A difference outside tolerance needs a decision.
- **WAIVED** — The difference was accepted by an authorised approver.

### Invoice Status

- **DRAFT** — Being prepared; not yet sent and not yet part of the receivables.
- **ISSUED** — Sent or recorded; the amount is now owed and due by its due date.
- **PARTIALLY PAID** — Part of the amount has been settled by payments or credits.
- **PAID** — Fully settled. A final state.
- **OVERDUE** — Past its due date with an amount still outstanding.
- **CANCELLED** — Withdrawn before it became effective. A final state.
- **VOID** — Cancelled after issue by a controlled process that keeps the original on record. A final state.

### Location Location Type

- **SITE** — A geographic site that may contain several buildings.
- **WAREHOUSE** — A building or area for storing goods.
- **STORE** — A retail outlet where goods are sold to customers.
- **OFFICE** — A place where office work is done.
- **FACTORY** — A place where goods are made.
- **YARD** — An open area for storing or staging equipment or containers.
- **PORT** — A harbour or terminal.
- **DEPOT** — A base for vehicles and equipment.
- **VIRTUAL** — A logical place with no physical presence, such as an online store.
- **OTHER** — Any other kind of place.

### Location Status

- **PLANNED** — Expected but not yet in use.
- **ACTIVE** — In use and offered for new assignments.
- **INACTIVE** — Temporarily not used but expected to return to service.
- **CLOSED** — Closed down, with no new assignments but history kept.
- **RETIRED** — Removed from use altogether. A final state.

### Organization Organization Type

- **ENTERPRISE** — The top-level group or enterprise that owns every other organizational unit beneath it.
- **COMPANY** — A separate legal entity or operating company, usually with its own registrations, books and tax identifiers.
- **BUSINESS UNIT** — A unit organized around a line of business or market, which may span several legal entities.
- **DIVISION** — A large internal division grouping departments under a common head or function.
- **DEPARTMENT** — A functional team within a company or division, such as finance or warehouse operations.
- **BRANCH** — A geographically separate office, store or site operating under a parent organization.
- **SUBSIDIARY** — A company controlled by a parent organization but trading as a separate legal entity.
- **OTHER** — A structure that fits none of the other types and is explained in its name or description.

### Organization Party Type

- **PERSON** — The party represents an individual human being.
- **ORGANIZATION** — The party represents a legal, commercial, governmental, nonprofit, or other organized body.

### Organization Status

- **DRAFT** — The organization is being set up and is not yet available for use in transactions.
- **ACTIVE** — The organization is in use and can be selected as an organizational scope in new records.
- **INACTIVE** — The organization is temporarily not selectable, for example while dormant, but its history is kept and it may return.
- **RETIRED** — The organization has been permanently closed or merged away and cannot be selected again. A final state.

### Party Party Type

- **PERSON** — The party represents an individual human being.
- **ORGANIZATION** — The party represents a legal, commercial, governmental, nonprofit, or other organized body.

### Party Role Role Type

- **CUSTOMER** — The party buys goods or services from the organization and is handled in sales and receivables.
- **SUPPLIER** — The party sells goods or services to the organization and is handled in procurement and payables.
- **EMPLOYEE** — The party works for the organization under an employment relationship.
- **PARTNER** — The party collaborates with the organization commercially, such as a reseller or alliance member.
- **CARRIER** — The party transports goods or people for the organization.
- **AGENT** — The party acts on behalf of the organization or of another party, usually for a commission.
- **CONTRACTOR** — The party provides labour or services under a contract rather than as an employee.
- **OWNER** — The party holds an ownership or beneficial interest in an asset or organization.
- **INVESTOR** — The party provides capital to the organization in return for a financial return or equity stake.
- **OTHER** — A role that fits none of the listed kinds and is explained in the role code or description.

### Party Role Status

- **ACTIVE** — The party currently holds the role.
- **INACTIVE** — Dormant but may resume.
- **EXPIRED** — Ended; kept for history. A final state.

### Party Status

- **ACTIVE** — The party is available for normal business participation.
- **INACTIVE** — The party is retained but is not normally eligible for new activity.
- **BLOCKED** — Business activity is restricted pending resolution of a business, risk, compliance, or operational condition.
- **RETIRED** — The party relationship is permanently ended for normal operational use while historical references remain valid.

### Person Gender

- **FEMALE** — The person identifies and is recorded as female.
- **MALE** — The person identifies and is recorded as male.
- **NON BINARY** — The person identifies as neither exclusively male nor exclusively female.
- **OTHER** — The person identifies in a way not covered by the other values.
- **UNSPECIFIED** — The gender is not recorded, because it was not needed or the person chose not to say.

### Person Party Type

- **PERSON** — The party represents an individual human being.
- **ORGANIZATION** — The party represents a legal, commercial, governmental, nonprofit, or other organized body.

### Person Status

- **ACTIVE** — The party is available for normal business participation.
- **INACTIVE** — The party is retained but is not normally eligible for new activity.
- **BLOCKED** — Business activity is restricted pending resolution of a business, risk, compliance, or operational condition.
- **RETIRED** — The party relationship is permanently ended for normal operational use while historical references remain valid.

### Product Product Type

- **GOOD** — A finished physical item that is bought or sold and held in stock.
- **MATERIAL** — A raw material or component consumed in production.
- **SERVICE** — Work performed for a customer, not held in stock.
- **SUBSCRIPTION** — A recurring entitlement billed on a schedule.
- **ASSET** — A durable item the business keeps and depreciates.
- **BUNDLE** — A package of other products sold together.
- **OTHER** — Anything else that is traded.

### Product Status

- **DRAFT** — Being set up; not yet tradable.
- **ACTIVE** — Available for ordinary trading.
- **DISCONTINUED** — Being phased out; existing stock may be sold but it is not reordered. A final state.
- **BLOCKED** — Temporarily barred from trading, for example during a quality or compliance issue.
- **RETIRED** — Removed from the catalogue; kept for history. A final state.

### Purchase Order Line Price Source

- **PRICE LIST** — Taken from the supplier's published price list in force at the time.
- **CONTRACT** — Taken from a negotiated contract with the supplier.
- **SUPPLIER AGREEMENT** — Taken from a standing supplier agreement covering repeat purchases.
- **QUOTATION** — Taken from a supplier quotation that the buyer accepted.
- **MANUAL** — Typed in by the buyer without a supporting agreement.
- **OTHER** — Determined in some other way not covered by the listed sources.

### Purchase Order Status

- **DRAFT** — Being prepared by the buyer; not yet binding on anyone.
- **APPROVED** — Authorised internally and ready to be sent to the supplier.
- **SENT** — Issued to the supplier, who is now expected to deliver.
- **PARTIALLY RECEIVED** — Some of the ordered quantity has been received and accepted; the rest is outstanding.
- **RECEIVED** — Everything required has been received and accepted.
- **CANCELLED** — The remaining commitment has been withdrawn. A final state.
- **CLOSED** — Receiving and invoicing are complete. A final state.

### Purchase Requisition Status

- **DRAFT** — The requester is preparing the demand and may still change it.
- **SUBMITTED** — The request has been submitted for review and approval.
- **APPROVED** — The organization has authorized the requested procurement demand, subject to sourcing and purchasing policy.
- **REJECTED** — The requested procurement demand was not approved.
- **ORDERED** — The approved demand has been converted into or otherwise satisfied by a PurchaseOrder or equivalent procurement commitment.
- **CLOSED** — The requisition lifecycle is complete and no further procurement action is required.
- **CANCELLED** — The request has been intentionally withdrawn before completion.

### Request For Quotation Status

- **DRAFT** — Being prepared by the buyer; not yet sent to any supplier.
- **ISSUED** — Sent to the invited suppliers, who may now submit quotations.
- **CLOSED** — The response period has ended and the quotations received are being compared.
- **AWARDED** — A supplier has been chosen and the request is complete. A final state.
- **CANCELLED** — Withdrawn without an award being made. A final state.

### Supplier Claim Claim Type

- **QUALITY** — Goods or services do not meet quality or specification requirements.
- **DAMAGE** — Goods arrived damaged or were damaged in transit or handling.
- **SHORTAGE** — Less was delivered than ordered or invoiced.
- **OVERAGE** — More was delivered than ordered, creating excess stock.
- **WRONG ITEM** — A different product from the one ordered was delivered.
- **WARRANTY** — A defect is claimed under the supplier's warranty after acceptance.
- **SERVICE** — A purchased service was not performed as agreed.
- **COMMERCIAL** — The dispute concerns price, terms or charges rather than the goods.
- **DELIVERY** — Goods arrived late, early or to the wrong place.
- **DOCUMENTATION** — Required certificates, invoices or paperwork are missing or wrong.
- **OTHER** — A claim that fits none of the other types, explained in the notes.

### Supplier Claim Resolution Code

- **NO ACTION** — Nothing further is done.
- **REPLACEMENT** — The supplier sends replacement goods.
- **REPAIR** — The goods are repaired.
- **RETURN** — The goods are returned to the supplier.
- **CREDIT** — The supplier issues a credit.
- **DEBIT ADJUSTMENT** — The buyer raises a debit adjustment.
- **PRICE ADJUSTMENT** — The price is reduced.
- **ACCEPTED EXCEPTION** — The buyer accepts the goods as they are.
- **REJECTED** — The claim was refused.

### Supplier Claim Resolution Resolution Type

- **NO ACTION** — The claim was reviewed and no remedy is owed or taken.
- **REPLACEMENT** — The supplier will deliver replacement goods or service for the faulty ones.
- **REPAIR** — The supplier will repair the faulty goods and return them.
- **RETURN** — The goods are returned to the supplier, which normally needs a SupplierReturn.
- **CREDIT** — The supplier issues a credit note that reduces what is owed to it.
- **DEBIT ADJUSTMENT** — The buyer raises a debit note against the supplier to recover the amount.
- **PRICE ADJUSTMENT** — The price of the supplied goods is reduced and the goods are kept.
- **CASH RECOVERY** — The supplier pays the agreed amount back as cash, evidenced by a Payment.
- **ACCEPTED EXCEPTION** — The buyer accepts the nonconformity as an approved exception without recovery.

### Supplier Claim Resolution Status

- **DRAFT** — The resolution is being prepared and has not been authorized.
- **APPROVED** — The remedy is authorized but execution has not started.
- **IN EXECUTION** — Downstream work such as returns, credits or payments is under way.
- **PARTIALLY EXECUTED** — Part of the remedy has been carried out and the rest is outstanding.
- **EXECUTED** — Every required consequence of the remedy is complete. A final state.
- **FAILED** — Execution could not be completed, for example because the supplier did not comply. A final state.
- **CANCELLED** — The resolution was withdrawn before completion. A final state.

### Supplier Claim Status

- **DRAFT** — Being prepared; not yet sent to the supplier.
- **OPEN** — Raised with the supplier and awaiting review.
- **UNDER REVIEW** — Being assessed by the supplier or the buyer.
- **ACCEPTED** — The supplier accepts the claim in full.
- **PARTIALLY ACCEPTED** — The supplier accepts part of the claim.
- **REJECTED** — The supplier refuses the claim. A final state.
- **RESOLVED** — The agreed remedy has been carried out.
- **CLOSED** — Finished and archived. A final state.
- **CANCELLED** — Withdrawn by the buyer. A final state.
- **ESCALATED** — Passed to a higher level because it is not agreed.

### Supplier Credit Note Application Status

- **DRAFT** — Prepared and not yet applied.
- **ACTIVE** — Applied against the invoice, reducing what is owed.
- **REVERSED** — Undone by a reversing application. A final state.
- **CANCELLED** — Withdrawn before it was applied. A final state.

### Supplier Credit Note Status

- **DRAFT** — The credit is being prepared and has no accounting effect.
- **APPROVED** — The credit is authorized but not yet posted to the ledger.
- **POSTED** — The credit is recognized in accounts payable and is available to apply.
- **PARTIALLY APPLIED** — Part of the credit has been applied to invoices and some remains available.
- **FULLY APPLIED** — The whole credit has been used against invoices.
- **CANCELLED** — The credit was withdrawn before posting and has no effect.
- **REVERSED** — The posted credit was undone by a reversing entry.

### Supplier Debit Note Application Status

- **DRAFT** — Prepared and not yet applied.
- **ACTIVE** — Applied against the invoice, reducing what is payable.
- **REVERSED** — Undone by a reversing application. A final state.
- **CANCELLED** — Withdrawn before it was applied. A final state.

### Supplier Debit Note Status

- **DRAFT** — Drafted by the buyer and not yet approved.
- **APPROVED** — Accepted internally and ready to post.
- **POSTED** — Recorded in the accounts; available to offset what the buyer owes.
- **PARTIALLY APPLIED** — Part of the debit has been offset against invoices.
- **FULLY APPLIED** — The whole debit has been used. A final state.
- **DISPUTED** — The supplier disputes the debit.
- **CANCELLED** — Withdrawn before posting. A final state.
- **REVERSED** — A posted debit undone by a reversing entry. A final state.

### Supplier Performance Assessment Rating

- **EXCELLENT** — Performance consistently exceeds expectations on delivery, quality and service; the supplier is a candidate for preferred status.
- **GOOD** — Performance meets expectations with only minor, isolated shortfalls that need no formal action.
- **ACCEPTABLE** — Performance is adequate overall but has gaps that are monitored at the next review.
- **NEEDS IMPROVEMENT** — Performance falls short of requirements and an improvement plan or corrective action is expected.
- **UNSATISFACTORY** — Performance is unacceptable and escalation, sourcing restriction or exit review is considered.

### Supplier Performance Assessment Status

- **DRAFT** — Scores and notes are still being compiled.
- **IN REVIEW** — Under review by procurement or quality.
- **APPROVED** — Accepted and ready to publish.
- **PUBLISHED** — Shared with the supplier and used in decisions.
- **SUPERSEDED** — Replaced by a later assessment. A final state.
- **CANCELLED** — Withdrawn. A final state.

### Supplier Qualification Status

- **NOT REVIEWED** — No qualification review has been carried out for this supplier yet.
- **PENDING** — A review is under way and the supplier is not yet cleared to receive orders.
- **QUALIFIED** — The supplier has passed review and may be used for sourcing and ordering.
- **SUSPENDED** — Qualification is temporarily withdrawn pending resolution of an issue.
- **DISQUALIFIED** — The supplier failed or lost qualification and must not be used for new orders.

### Supplier Quotation Line Award Status

- **PENDING** — The offer line has been received but no award decision has been made yet.
- **ACCEPTED** — The offer line is selected in full and may be converted to a purchase order line.
- **PARTIALLY ACCEPTED** — Only part of the offered quantity is selected, with the remainder awarded elsewhere or not needed.
- **REJECTED** — The offer line was not selected and will not produce a purchase commitment.

### Supplier Quotation Status

- **RECEIVED** — The quotation has been logged but evaluation has not started.
- **UNDER REVIEW** — Buyers are comparing prices, terms and delivery against other bids.
- **ACCEPTED** — The offer has been selected and may be converted into purchase orders.
- **REJECTED** — The offer was declined and will not be ordered from. A final state.
- **EXPIRED** — The validity date passed before the offer was accepted. A final state.
- **WITHDRAWN** — The supplier retracted the offer. A final state.

### Supplier Return Line Disposition

- **RETURN TO SUPPLIER** — The quantity is sent back for credit or replacement.
- **REJECTED** — The quantity is refused and stays with the supplier.
- **EXCEPTION** — The quantity is handled outside the normal return.

### Supplier Return Status

- **DRAFT** — Being prepared; not yet authorised.
- **AUTHORIZED** — Approved to be sent back.
- **IN TRANSIT** — On its way to the supplier.
- **RECEIVED BY SUPPLIER** — The supplier has taken delivery.
- **COMPLETED** — Credit or replacement is settled. A final state.
- **CANCELLED** — Withdrawn before it was sent. A final state.
- **EXCEPTION** — Problem with the return needing a decision.

### Supplier Role Type

- **CUSTOMER** — The party buys goods or services from the organization and is handled in sales and receivables.
- **SUPPLIER** — The party sells goods or services to the organization and is handled in procurement and payables.
- **EMPLOYEE** — The party works for the organization under an employment relationship.
- **PARTNER** — The party collaborates with the organization commercially, such as a reseller or alliance member.
- **CARRIER** — The party transports goods or people for the organization.
- **AGENT** — The party acts on behalf of the organization or of another party, usually for a commission.
- **CONTRACTOR** — The party provides labour or services under a contract rather than as an employee.
- **OWNER** — The party holds an ownership or beneficial interest in an asset or organization.
- **INVESTOR** — The party provides capital to the organization in return for a financial return or equity stake.
- **OTHER** — A role that fits none of the listed kinds and is explained in the role code or description.

### Supplier Status

- **ACTIVE** — The supplier is open for business and may be selected on new orders and quotation requests.
- **INACTIVE** — The supplier is dormant and hidden from selection but can be reactivated.
- **BLOCKED** — New transactions are barred, for example during a dispute or compliance hold.
- **RETIRED** — The relationship has ended and the record is kept for history only. A final state.

### Supplier Supplier Type

- **INDIVIDUAL** — A natural person or sole trader supplying goods or services in their own name.
- **BUSINESS** — A commercial company or partnership that supplies goods or services for profit.
- **GOVERNMENT** — A public authority or agency supplying goods, services or licences, often under statutory terms.
- **INTERNAL** — Another unit of the same enterprise supplying through intercompany arrangements.
- **OTHER** — A supplier that fits none of the other types, such as a charity or association.

### Task Priority

- **LOW** — Can wait behind other work without business impact.
- **NORMAL** — Standard urgency, handled in the ordinary course of work.
- **HIGH** — Needs prompt attention ahead of normal work.
- **CRITICAL** — Needs immediate action because delay causes serious business impact.

### Task Status

- **CREATED** — The task exists but is not yet ready to be picked up.
- **READY** — The task is released and waiting for someone to be assigned.
- **ASSIGNED** — A person or party has been given the task but has not started it.
- **IN PROGRESS** — The assignee is actively working on the task.
- **BLOCKED** — Work is held up by a dependency, missing input or decision.
- **COMPLETED** — The work was done as required. A final state.
- **CANCELLED** — The task was withdrawn before completion. A final state.
- **FAILED** — The task ended without achieving its result and needs follow-up elsewhere. A final state.

### Task Task Type

- **USER** — Work done by a person.
- **SYSTEM** — A step run automatically.
- **APPROVAL** — A person must approve or refuse something.
- **DECISION** — A choice that decides the path.
- **NOTIFICATION** — A message to be sent.
- **SCRIPT** — A script run by the system.
- **OTHER** — Work that fits no other type.

### Unit Of Measure Category

- **QUANTITY** — A general count or quantity of items.
- **LENGTH** — A distance, such as metres or inches.
- **AREA** — A surface, such as square metres.
- **VOLUME** — A capacity, such as litres.
- **MASS** — A weight, such as kilograms or tonnes.
- **TIME** — A duration, such as hours or days.
- **COUNT** — A number of discrete things, such as each or dozen.
- **CURRENCY** — A monetary unit used as a measure.
- **OTHER** — A unit that fits no other category.

### Unit Of Measure Status

- **ACTIVE** — Available for use on products and documents.
- **INACTIVE** — Not offered for now; can be reactivated.
- **RETIRED** — No longer used; kept for history. A final state.

## Lifecycles

A record with a lifecycle moves only along the moves listed — the application refuses any other, for every role. A **final** state is a completed transaction: the application refuses every change to such a record, including an administrator's. Say so when a record is final.

### Party — Party Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → BLOCKED (Block)
- BLOCKED → ACTIVE (Unblock)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)
- BLOCKED → RETIRED (Retire)

### Organization — Organization Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Party Role — Party Role Lifecycle

Starts at **ACTIVE**.
Final: **EXPIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → EXPIRED (Expire)
- INACTIVE → EXPIRED (Expire)

### Address — Address Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Location — Location Lifecycle

Starts at **PLANNED**.
Final: **CLOSED**, **RETIRED**.

Moves:
- PLANNED → ACTIVE (Activate)
- ACTIVE → CLOSED (Close)
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- PLANNED → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Currency — Currency Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Exchange Rate — Exchange Rate Lifecycle

Starts at **DRAFT**.
Final: **EXPIRED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → EXPIRED (Expire)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Unit Of Measure — Unit Of Measure Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Task — Task Lifecycle

Starts at **CREATED**.
Final: **COMPLETED**, **CANCELLED**, **FAILED**.

Moves:
- CREATED → READY (Mark Ready)
- READY → ASSIGNED (Assign)
- ASSIGNED → IN PROGRESS (Start)
- IN PROGRESS → COMPLETED (Complete)
- READY → BLOCKED (Block)
- BLOCKED → READY (Unblock)
- ASSIGNED → BLOCKED (Block)
- BLOCKED → ASSIGNED (Unblock)
- IN PROGRESS → BLOCKED (Block)
- BLOCKED → IN PROGRESS (Unblock)
- CREATED → CANCELLED (Cancel)
- READY → CANCELLED (Cancel)
- ASSIGNED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)
- BLOCKED → CANCELLED (Cancel)
- READY → FAILED (Fail)
- ASSIGNED → FAILED (Fail)
- IN PROGRESS → FAILED (Fail)
- BLOCKED → FAILED (Fail)

### Supplier — Supplier Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → BLOCKED (Block)
- BLOCKED → ACTIVE (Unblock)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)
- BLOCKED → RETIRED (Retire)

### Purchase Requisition — Purchase Requisition Lifecycle

Starts at **DRAFT**.
Final: **CLOSED**, **REJECTED**, **CANCELLED**.

Moves:
- DRAFT → SUBMITTED (Submit)
- SUBMITTED → APPROVED (Approve)
- APPROVED → ORDERED (Mark Ordered)
- ORDERED → CLOSED (Close)
- DRAFT → REJECTED (Reject)
- SUBMITTED → REJECTED (Reject)
- APPROVED → REJECTED (Reject)
- ORDERED → REJECTED (Reject)
- DRAFT → CANCELLED (Cancel)
- SUBMITTED → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- ORDERED → CANCELLED (Cancel)

### Request For Quotation — Request For Quotation Lifecycle

Starts at **DRAFT**.
Final: **AWARDED**, **CANCELLED**.

Moves:
- DRAFT → ISSUED (Issue)
- ISSUED → CLOSED (Close)
- CLOSED → AWARDED (Mark Awarded)
- DRAFT → CANCELLED (Cancel)
- ISSUED → CANCELLED (Cancel)

### Supplier Quotation — Supplier Quotation Lifecycle

Starts at **RECEIVED**.
Final: **REJECTED**, **EXPIRED**, **WITHDRAWN**.

Moves:
- RECEIVED → UNDER REVIEW (Review)
- UNDER REVIEW → ACCEPTED (Accept)
- RECEIVED → REJECTED (Reject)
- UNDER REVIEW → REJECTED (Reject)
- ACCEPTED → REJECTED (Reject)
- UNDER REVIEW → EXPIRED (Expire)
- ACCEPTED → EXPIRED (Expire)
- RECEIVED → WITHDRAWN (Withdraw)
- UNDER REVIEW → WITHDRAWN (Withdraw)
- ACCEPTED → WITHDRAWN (Withdraw)

### Purchase Order — Purchase Order Lifecycle

Starts at **DRAFT**.
Final: **CLOSED**, **CANCELLED**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → SENT (Mark Sent)
- SENT → PARTIALLY RECEIVED (Mark Partially Received)
- PARTIALLY RECEIVED → RECEIVED (Receive)
- RECEIVED → CLOSED (Close)
- DRAFT → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- SENT → CANCELLED (Cancel)
- PARTIALLY RECEIVED → CANCELLED (Cancel)
- RECEIVED → CANCELLED (Cancel)

### Goods Receipt — Goods Receipt Lifecycle

Starts at **DRAFT**.
Final: **ACCEPTED**, **PARTIALLY ACCEPTED**, **REJECTED**, **CANCELLED**.

Moves:
- DRAFT → RECEIVED (Receive)
- RECEIVED → INSPECTION PENDING (Send To Inspection)
- RECEIVED → ACCEPTED (Accept)
- RECEIVED → PARTIALLY ACCEPTED (Accept Partially)
- RECEIVED → REJECTED (Reject)
- INSPECTION PENDING → ACCEPTED (Accept)
- INSPECTION PENDING → PARTIALLY ACCEPTED (Accept Partially)
- INSPECTION PENDING → REJECTED (Reject)
- DRAFT → CANCELLED (Cancel)
- RECEIVED → CANCELLED (Cancel)

### Supplier Claim — Supplier Claim Lifecycle

Starts at **DRAFT**.
Final: **CLOSED**, **REJECTED**, **CANCELLED**.

Moves:
- DRAFT → OPEN (Open)
- OPEN → UNDER REVIEW (Review)
- OPEN → REJECTED (Reject)
- UNDER REVIEW → ACCEPTED (Accept)
- UNDER REVIEW → PARTIALLY ACCEPTED (Partially Accept)
- UNDER REVIEW → REJECTED (Reject)
- UNDER REVIEW → ESCALATED (Escalate)
- ESCALATED → ACCEPTED (Accept)
- ESCALATED → PARTIALLY ACCEPTED (Partially Accept)
- ESCALATED → REJECTED (Reject)
- ACCEPTED → RESOLVED (Resolve)
- PARTIALLY ACCEPTED → RESOLVED (Resolve)
- RESOLVED → CLOSED (Close)
- DRAFT → CANCELLED (Cancel)
- OPEN → CANCELLED (Cancel)
- UNDER REVIEW → CANCELLED (Cancel)
- ESCALATED → CANCELLED (Cancel)

### Supplier Claim Resolution — Supplier Claim Resolution Lifecycle

Starts at **DRAFT**.
Final: **EXECUTED**, **FAILED**, **CANCELLED**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → IN EXECUTION (Mark In Execution)
- IN EXECUTION → PARTIALLY EXECUTED (Mark Partially Executed)
- PARTIALLY EXECUTED → EXECUTED (Mark Executed)
- APPROVED → FAILED (Fail)
- IN EXECUTION → FAILED (Fail)
- PARTIALLY EXECUTED → FAILED (Fail)
- DRAFT → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- IN EXECUTION → CANCELLED (Cancel)
- PARTIALLY EXECUTED → CANCELLED (Cancel)

### Supplier Credit Note — Supplier Credit Note Lifecycle

Starts at **DRAFT**.
Final: **FULLY APPLIED**, **CANCELLED**, **REVERSED**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → POSTED (Post)
- POSTED → PARTIALLY APPLIED (Apply)
- POSTED → FULLY APPLIED (Apply)
- PARTIALLY APPLIED → FULLY APPLIED (Apply)
- DRAFT → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- POSTED → REVERSED (Reverse)
- PARTIALLY APPLIED → REVERSED (Reverse)

### Supplier Credit Note Application — Supplier Credit Note Application Lifecycle

Starts at **DRAFT**.
Final: **REVERSED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → REVERSED (Reverse)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Supplier Debit Note — Supplier Debit Note Lifecycle

Starts at **DRAFT**.
Final: **FULLY APPLIED**, **CANCELLED**, **REVERSED**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → POSTED (Post)
- POSTED → PARTIALLY APPLIED (Apply)
- POSTED → FULLY APPLIED (Apply)
- PARTIALLY APPLIED → FULLY APPLIED (Apply)
- POSTED → DISPUTED (Dispute)
- PARTIALLY APPLIED → DISPUTED (Dispute)
- DISPUTED → POSTED (Resolve)
- DISPUTED → REVERSED (Reverse)
- DRAFT → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- POSTED → REVERSED (Reverse)
- PARTIALLY APPLIED → REVERSED (Reverse)

### Supplier Debit Note Application — Supplier Debit Note Application Lifecycle

Starts at **DRAFT**.
Final: **REVERSED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → REVERSED (Reverse)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Supplier Performance Assessment — Supplier Performance Assessment Lifecycle

Starts at **DRAFT**.
Final: **SUPERSEDED**, **CANCELLED**.

Moves:
- DRAFT → IN REVIEW (Mark In Review)
- IN REVIEW → APPROVED (Approve)
- APPROVED → PUBLISHED (Publish)
- DRAFT → SUPERSEDED (Mark Superseded)
- IN REVIEW → SUPERSEDED (Mark Superseded)
- APPROVED → SUPERSEDED (Mark Superseded)
- PUBLISHED → SUPERSEDED (Mark Superseded)
- DRAFT → CANCELLED (Cancel)
- IN REVIEW → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- PUBLISHED → CANCELLED (Cancel)

### Supplier Return — Supplier Return Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → AUTHORIZED (Authorize)
- AUTHORIZED → IN TRANSIT (Mark In Transit)
- IN TRANSIT → RECEIVED BY SUPPLIER (Mark Received By Supplier)
- RECEIVED BY SUPPLIER → COMPLETED (Complete)
- AUTHORIZED → EXCEPTION (Mark Exception)
- EXCEPTION → AUTHORIZED (Resolve Exception)
- IN TRANSIT → EXCEPTION (Mark Exception)
- EXCEPTION → IN TRANSIT (Resolve Exception)
- RECEIVED BY SUPPLIER → EXCEPTION (Mark Exception)
- EXCEPTION → RECEIVED BY SUPPLIER (Resolve Exception)
- DRAFT → CANCELLED (Cancel)
- AUTHORIZED → CANCELLED (Cancel)
- IN TRANSIT → CANCELLED (Cancel)
- RECEIVED BY SUPPLIER → CANCELLED (Cancel)
- EXCEPTION → CANCELLED (Cancel)

### Product — Product Lifecycle

Starts at **DRAFT**.
Final: **DISCONTINUED**, **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → BLOCKED (Block)
- BLOCKED → ACTIVE (Unblock)
- DRAFT → DISCONTINUED (Discontinue)
- ACTIVE → DISCONTINUED (Discontinue)
- BLOCKED → DISCONTINUED (Discontinue)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- BLOCKED → RETIRED (Retire)

### Invoice — Invoice Lifecycle

Starts at **DRAFT**.
Final: **PAID**, **CANCELLED**, **VOID**.

Moves:
- DRAFT → ISSUED (Issue)
- ISSUED → PARTIALLY PAID (Mark Partially Paid)
- PARTIALLY PAID → PAID (Pay)
- ISSUED → OVERDUE (Mark Overdue)
- OVERDUE → ISSUED (Resume)
- PARTIALLY PAID → OVERDUE (Mark Overdue)
- OVERDUE → PARTIALLY PAID (Resume)
- DRAFT → CANCELLED (Cancel)
- ISSUED → CANCELLED (Cancel)
- PARTIALLY PAID → CANCELLED (Cancel)
- OVERDUE → CANCELLED (Cancel)
- DRAFT → VOID (Void)
- ISSUED → VOID (Void)
- PARTIALLY PAID → VOID (Void)
- OVERDUE → VOID (Void)

## Roles

- **User** — reads 97 of 97 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
