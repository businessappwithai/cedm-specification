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

Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. Address is reusable master data, but an address printed on an issued invoice, shipment, order, or other historical document is transaction evidence and must remain reproducible even if the master address changes. Supports Party, Organization, Customer, Supplier, Location, order, fulfillment, invoicing, taxation, shipping, reporting, and integration workflows. Party and Location may reuse an Address. Operational documents should resolve the effective address at tra…

Readable by every signed-in person.

Fields:
  - **Address Type** (required, one of the Address Address Type values) — The address type of the address: a value the business records on it. Entered or maintained when a address is created or changed; shown on its form and available to search and reports. Read together with the address's other fields and its r…
  - **Line1** (required) — The line1 of the address: a value the business records on it. Entered or maintained when a address is created or changed; shown on its form and available to search and reports. Read together with the address's other fields and its relation…
  - **Line2** — The line2 of the address: a value the business records on it. Entered or maintained when a address is created or changed; shown on its form and available to search and reports. Read together with the address's other fields and its relation…
  - **Line3** — The line3 of the address: a value the business records on it. Entered or maintained when a address is created or changed; shown on its form and available to search and reports. Read together with the address's other fields and its relation…
  - **City Name** — The name of the town or locality when it is not in the list of cities. Filled only when no city can be chosen; leave it empty when the city is picked from the list. Stands in for the city relationship; an address states one or the other.
  - **Postal Code** — The postal code of the address: a value the business records on it. Entered or maintained when a address is created or changed; shown on its form and available to search and reports. Read together with the address's other fields and its re…
  - **Latitude** — The latitude of the address: a number the business records on it. Entered or maintained when a address is created or changed; shown on its form and available to search and reports. Read together with the address's other fields and its rela…
  - **Longitude** — The longitude of the address: a number the business records on it. Entered or maintained when a address is created or changed; shown on its form and available to search and reports. Read together with the address's other fields and its rel…
  - **Is Primary** (required) — The is primary of the address: a yes/no indicator the business records on it. Entered or maintained when a address is created or changed; shown on its form and available to search and reports. Read together with the address's other fields…
  - **Status** (required, one of the Address Status values) — The status of the address: a value the business records on it. Entered or maintained when a address is created or changed; shown on its form and available to search and reports. Read together with the address's other fields and its relatio…
  - **Party** (a Party) — Party that maintains or uses this reusable address. Provides party master-data context for address selection.
  - **Person** (a Person) — The Person this Address belongs to.
  - **Organization** (a Organization) — The Organization this Address belongs to.
  - **Country** (required, a Country) — The country the address is in. Chosen from the list of countries; the states and cities offered are narrowed by it. Exactly one country. Every address names its country, which settles the format, tax and trade rules that apply to it.
  - **State Province** (a State Province) — The state, province or equivalent division the address is in. Chosen after the country, from the divisions of that country. At most one; some countries have no divisions in the list. Must be a division of the address's own country.
  - **City** (a City) — The city the address is in, chosen from the list. Chosen after the state or province, from the cities of that division or country; use the city name field when the city is not listed. At most one. Must be a city of the address's own countr…
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

A governed file or content attachment associated with an enterprise record while preserving content identity and audit provenance. Provide durable, implementation-neutral governance semantics for Attachment. A governed file or content attachment associated with an enterprise record while preserving content identity and audit provenance. Used in contracts, documents, governance, compliance, risk, legal, service, finance, or audit workflows where applicable. Connects authoritative business records to controlled lifecycle, evidence, findings, and downstream remediation without replacing source t…

Readable by every signed-in person.

Fields:
  - **Effective At** — Time at which this record becomes effective or evidentially applicable. Establishes temporal business meaning. Lifecycle, audit and reporting. Does not rewrite earlier effective evidence. Optional when lifecycle does not require a separate…

### Business Unit

A governed organizational unit representing a major business, division, line, or operating segment within an Organization. Provide a canonical enterprise representation with stable identity and governed semantics. A governed organizational unit representing a major business, division, line, or operating segment within an Organization. Used whenever enterprise processes need this concept as controlled master or reference data. Referenced by compatible domain entities and workflows while preserving a single canonical identity. Created under governance, maintained through controlled changes, and…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code for BusinessUnit. Human and integration-friendly identifier. Search, configuration, exchange and reporting. Unique within its governing context according to policy. Required.
  - **Name** (required) — Human-readable name of BusinessUnit. Communicates the concept to business users. UI, documents and reports. Does not replace immutable identity. Required.
  - **Organization** (required, a Organization) — Governing Organization context for this record. Establishes ownership and enterprise context. Authorization, reporting and workflow. Exactly one Organization. Referenced workflows must remain compatible with governing context.

### Calendar

A governed calendar defining business dates, working days, holidays, and time-control semantics for planning and operational processes. Provide a canonical enterprise representation with stable identity and governed semantics. A governed calendar defining business dates, working days, holidays, and time-control semantics for planning and operational processes. Used whenever enterprise processes need this concept as controlled master or reference data. Referenced by compatible domain entities and workflows while preserving a single canonical identity. Created under governance, maintained throu…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code for Calendar. Human and integration-friendly identifier. Search, configuration, exchange and reporting. Unique within its governing context according to policy. Required.
  - **Name** (required) — Human-readable name of Calendar. Communicates the concept to business users. UI, documents and reports. Does not replace immutable identity. Required.

### City

A city: every national capital and every city of 750 thousand or more, from GeoNames, linked to its country and, for the United States and Canada, to its state or province. Give every application the same governed list, so a place or code means one thing across the enterprise. A city: every national capital and every city of 750 thousand or more, from GeoNames, linked to its country and, for the United States and Canada, to its state or province. Chosen from the list wherever a record needs a place, code or currency; maintained by an administrator when a registry changes. Referenced by addres…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The city's code: its country code and its name in capitals, such as FR-PARIS. Quoted beside the name in lists; integration with other systems. Unique; the country prefix keeps cities of one name in different countries apart. Required.
  - **Name** (required) — The city's name in English. Shown in lists and on addresses. Not unique: two countries can have a city of one name. Required.
  - **Population** — The registry's population figure. Ordering and sizing; not a current census count. Describes the city only.
  - **Latitude** — Latitude in degrees, north positive. Maps and distance. Describes the city only.
  - **Longitude** — Longitude in degrees, east positive. Maps and distance. Describes the city only.
  - **Timezone** — The IANA time zone the city keeps, such as Europe/Paris. Showing local times for the city. Describes the city only.
  - **Is Capital** — Whether the city is its country's capital. Highlighting the capital in lists. At most one capital per country in this list.
  - **Country** (required, a Country) — The country the city is in. Chosen first; the cities offered are those of that country. Every city belongs to exactly one country. A city is narrowed by its country, and by its state where it has one.
  - **State Province** (a State Province) — The state or province the city is in, where the registry says which. Chosen after the country; narrows the cities offered. A city has at most one state or province; outside the United States and Canada the list leaves it empty. The state o…

### Contact Point

A governed communication endpoint such as email address, telephone number, web endpoint, or other contact channel associated with a Party. Provide a canonical enterprise representation with stable identity and governed semantics. A governed communication endpoint such as email address, telephone number, web endpoint, or other contact channel associated with a Party. Used whenever enterprise processes need this concept as controlled master or reference data. Referenced by compatible domain entities and workflows while preserving a single canonical identity. Created under governance, maintained…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code for ContactPoint. Human and integration-friendly identifier. Search, configuration, exchange and reporting. Unique within its governing context according to policy. Required.
  - **Name** (required) — Human-readable name of ContactPoint. Communicates the concept to business users. UI, documents and reports. Does not replace immutable identity. Required.
  - **Party** (required, a Party) — Governing Party context for this record. Establishes ownership and enterprise context. Authorization, reporting and workflow. Exactly one Party. Referenced workflows must remain compatible with governing context.

### Country

A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. Give every application the same governed list, so a place or code means one thing across the enterprise. A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. Chosen from the list wherever a record needs a place, code or currency; maintained by an administrator when a registry changes. Referenced by addresses, parties, products and documents; related entities narrow each oth…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The two-letter ISO 3166-1 code, such as US or DE. Search, integration and reporting; stored on nothing else, because records point at the country itself. Unique; a state or province and a city belong to a country through it. Required.
  - **Alpha3** — The three-letter ISO 3166-1 code, such as USA or DEU. Trade and customs documents, which use the long form. Unique among countries.
  - **Numeric Code** — The three-digit ISO 3166-1 numeric code, such as 840. Banking and statistical exchange formats. Unique among countries.
  - **Name** (required) — The country's short name in English. Shown in lists, on addresses and on reports. Does not replace the code as the stable key. Required.
  - **Phone Code** — The international dialling prefix, without the plus sign. Validating and formatting telephone numbers. Belongs to the country; several countries can share a prefix.
  - **Currency** (a Currency) — The currency the country mainly uses. Chosen from the currency list; used to suggest a currency on records for the country. A country has at most one main currency; a currency can be the main one of many countries. Lets a default currency…

### Currency

Defines the monetary denomination that gives financial amounts their business meaning. Currency is not an amount. It defines the denomination in which an amount is stated and provides the reference needed for pricing, billing, settlement, banking, and accounting. Central to Product pricing, SalesOrder, Invoice, Payment, PaymentAllocation, BankTransaction, JournalEntry, ExchangeRate, and financial reporting. Product may carry reference pricing. SalesOrder establishes commercial amounts. Invoice establishes claims. Payment establishes settlement. PaymentAllocation applies settlement to claims.…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Three-letter business currency code, normally an ISO 4217 code where one exists. Used in documents, APIs, integrations, reports, pricing, banking, and accounting. Code identifies the denomination and is not an exchange rate or amount. Prov…
  - **Name** (required) — Human-readable currency name. Used in user interfaces, documents, reports, master-data management, and integrations. Describes the currency identified by code and currencyId. Provides understandable monetary context to business users. Requ…
  - **Symbol** — Common display symbol for the currency. Used in user interfaces, customer documents, reports, and formatted amounts. Presentation metadata; it must not be used as the canonical currency identity. Improves human-readable display without aff…
  - **Decimal Places** (required) — Standard number of decimal places normally used when representing amounts in this currency. Used for amount formatting, rounding, validation, invoicing, payment processing, and accounting presentation. Transaction-specific precision or fin…
  - **Status** (required, one of the Currency Status values) — Controls whether the currency is available for new monetary transactions. Used by pricing, order, invoicing, payment, banking, and accounting validation. Retiring a currency must not invalidate historical transactions expressed in that cur…

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

A governed organizational unit grouping people, positions, responsibilities, and work within an Organization or BusinessUnit. Provide a canonical enterprise representation with stable identity and governed semantics. A governed organizational unit grouping people, positions, responsibilities, and work within an Organization or BusinessUnit. Used whenever enterprise processes need this concept as controlled master or reference data. Referenced by compatible domain entities and workflows while preserving a single canonical identity. Created under governance, maintained through controlled change…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code for Department. Human and integration-friendly identifier. Search, configuration, exchange and reporting. Unique within its governing context according to policy. Required.
  - **Name** (required) — Human-readable name of Department. Communicates the concept to business users. UI, documents and reports. Does not replace immutable identity. Required.
  - **Organization** (required, a Organization) — Governing Organization context for this record. Establishes ownership and enterprise context. Authorization, reporting and workflow. Exactly one Organization. Referenced workflows must remain compatible with governing context.

### Exchange Rate

Represents an auditable conversion rate between two currencies for a defined time and business purpose. ExchangeRate is the conversion context between Currency denominations; it is not itself money, a payment, or an accounting entry. Used by multi-currency orders, invoices, payments, payment allocations, bank reconciliation, accounting, consolidation, and financial reporting. Currency defines denominations. Money carries amount plus currency. ExchangeRate provides the conversion between two Money values. PaymentAllocation and accounting consume the rate when cross-currency conversion is permi…

Readable by every signed-in person.

Fields:
  - **From Currency** (required, a Currency) — Currency from which an amount is converted. Identifies the source denomination of the monetary amount being converted. Must differ from toCurrency for a meaningful exchange-rate conversion. Identifies the currency of the source Money value…
  - **To Currency** (required, a Currency) — Currency into which an amount is converted. Identifies the target denomination of the converted monetary amount. Conversion direction is from fromCurrency to toCurrency; reversing the direction requires an appropriate inverse rate rather t…
  - **Rate** (required) — Positive conversion factor that expresses how much target currency corresponds to one unit of source currency under this rate convention. Used to calculate converted monetary amounts while preserving the declared direction. Must always be…
  - **Rate Type** (required, one of the Exchange Rate Rate Type values) — Classifies the business purpose and provenance context of the exchange rate. Used to select an appropriate rate according to transaction and accounting policy. Different workflows may require different rate types; a spot rate must not auto…
  - **Effective At** (required) — Date and time from which the exchange rate is applicable under its rate policy. Used to select the correct rate for a transaction, settlement, or accounting event. A rate without an effective time cannot be reliably reproduced when rates c…
  - **Expires At** — Optional end of the period during which the rate is valid. Used to prevent application of expired rates. When supplied, expiresAt must be later than effectiveAt. Defines the rate's validity window for transaction and reporting calculations…
  - **Source** (required) — Identifies the provider or business authority from which the rate was obtained. Used for audit, reconciliation, regulatory reporting, and rate governance. Source identifies provenance; it does not by itself determine which rate is applicab…
  - **Status** (required, one of the Exchange Rate Status values) — Lifecycle state of the exchange-rate record. Used by conversion services to determine whether a rate may be applied. Historical calculations retain the rate record even after it expires. Prevents use of draft, cancelled, or expired rates w…

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

Controlled receiving document whose line evidence establishes original fulfillment and eligible basis for later supplier returns. GoodsReceipt is the fulfillment bridge between PurchaseOrder commitment and accepted inventory/service. SupplierReturn is a later reverse-procurement event that consumes eligible accepted receipt evidence without rewriting it. Receiving, warehouse operations, procurement, quality, supplier management, accounts payable, inventory control, three-way matching and supplier returns. PurchaseOrder is the commitment. GoodsReceiptLine is actual receipt/disposition evidence…

Readable by every signed-in person.

Fields:
  - **Receipt Number** (required) — Human-facing receiving reference. Identifies the receipt in warehouse and supplier operations. Documents, audit, matching and return processing. Distinct from SupplierReturn.returnNumber and PurchaseOrder number. Provides operational refer…
  - **Receipt Date** (required) — Date and time the receipt was recorded. Establishes receiving chronology. Inventory history, procurement, matching and audit. Distinct from later SupplierReturn.returnDate. Anchors original receipt evidence. Required.
  - **Status** (required, one of the Goods Receipt Status values) — Controlled receiving-document lifecycle state. Indicates whether receipt evidence can affect fulfillment and inventory. Controls receiving progression and authorized corrections. SupplierReturn is a later reverse-procurement event and does…
  - **Received Quantity** (required) — Total quantity physically recorded as received. Sum of line received quantities. Receiving and audit. SupplierReturn eligibility is derived from accepted receipt evidence, not received quantity alone. Provides original physical receipt bas…
  - **Accepted Quantity** (required) — Quantity accepted after receiving controls. Sum of line accepted quantities that may become inventory. Inventory posting, PO fulfillment and invoice matching. SupplierReturnLine eligibility is normally based on accepted quantity and subseq…
  - **Notes** — Receiving notes and operational context. Human-readable context for receipt exceptions or inspection. Operations and audit. Does not replace structured disposition or return evidence. Supports review. Optional.
  - **Supplier** (required, a Supplier) — Supplier that delivered the receipt. Identifies the commercial party responsible for the delivery. Receiving, procurement, audit and supplier return processing. Supplies supplier context for subsequent returns.
  - **Purchase Order** (required, a Purchase Order) — Procurement commitment fulfilled by this receipt. Connects received goods to what was ordered. Receiving, fulfillment, matching and supplier return eligibility. Supplies original procurement context.
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
  - **Invoice Number** (required) — Business-facing invoice reference. Identifier communicated to customers, suppliers, tax authorities, and financial operations. Used in documents, statements, reconciliation, collections, payables, and integrations. Distinct from invoiceId…
  - **Invoice Date** (required) — Accounting and commercial date assigned to the invoice. Establishes the date used for financial chronology and applicable billing and tax rules. Used for accounting periods, tax, payment-term calculation, aging, reporting, and reconciliati…
  - **Due Date** — Transaction-level date by which the claim is expected to be settled. Result of applying the effective PaymentTerm and due-date basis to the invoice. Drives aging, collections, cash forecasting, and payment planning. PaymentTerm is policy;…
  - **Invoice Type** (required, one of the Invoice Invoice Type values) — Defines the commercial direction and accounting nature of the invoice document. Determines whether the document establishes a receivable, payable, or adjustment. Used by accounting, tax, receivables, payables, matching, and reporting. Must…
  - **Status** (required, one of the Invoice Status values) — Lifecycle state of the financial claim. Indicates whether the claim is being prepared, outstanding, settled, overdue, cancelled, or voided. Controls issuance, settlement, aging, cancellation, reporting, and accounting workflows. PaymentAll…
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

A governed language reference used for localization, communication preferences, content, and reporting. Provide a canonical enterprise representation with stable identity and governed semantics. A governed language reference used for localization, communication preferences, content, and reporting. Used whenever enterprise processes need this concept as controlled master or reference data. Referenced by compatible domain entities and workflows while preserving a single canonical identity. Created under governance, maintained through controlled changes, and retired or superseded without rewriti…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code for Language. Human and integration-friendly identifier. Search, configuration, exchange and reporting. Unique within its governing context according to policy. Required.
  - **Name** (required) — Human-readable name of Language. Communicates the concept to business users. UI, documents and reports. Does not replace immutable identity. Required.

### Legal Entity

A legally recognized organization or person capable of holding rights, obligations, registrations, contracts, assets, liabilities, or filings. Provide canonical governance semantics for LegalEntity. A legally recognized organization or person capable of holding rights, obligations, registrations, contracts, assets, liabilities, or filings. Used in enterprise risk, legal, compliance, audit, contract, incident, and remediation processes where applicable. Connects risks, controls, parties, legal matters, agreements, obligations, evidence and outcomes without replacing their authoritative histori…

Readable by every signed-in person.

Fields:
  - **Occurred At** — Effective occurrence or assessment time where applicable. Anchors temporal evidence. Chronology, reporting and audit. Historical timing is not silently rewritten. Optional when the concept is a standing master or future obligation.

### Location

Core location master with hierarchical, geographic, organizational, and lifecycle context. Location identifies where business activity or resources occur. It is distinct from Address: Location is the business place; Address describes its geographic/contact representation. Supports inventory, warehousing, yard/port operations, shipping, purchasing, sales, tax jurisdiction, service, logistics, and organizational processes. Organization provides operating ownership/context. Address provides geographic representation. Parent/child locations provide operational hierarchy. Dependent entities must r…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the location: a value the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the location's other fields and its relati…
  - **Name** (required) — The name of the location: a value the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the location's other fields and its relati…
  - **Location Type** (required, one of the Location Location Type values) — The location type of the location: a value the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the location's other fields and i…
  - **Status** (required, one of the Location Status values) — The status of the location: a value the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the location's other fields and its rela…
  - **Address** (a Address) — The address id of the location: a link to another record the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the location's othe…
  - **Parent Location** (a Location) — The parent location id of the location: a link to another record the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the locatio…
  - **Organization** (a Organization) — Links a location to organization, the organization it relates to. Chosen from the existing organization records when the location is created or edited. A location has at most one organization in this role. Lets the location be found from,…
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
  - **Name** (required) — Common organizational name used in business operations. Used in search, forms, reports, documents, and transactions. LegalName may differ and provides formal legal identity. Provides human-readable organizational identification. Required f…
  - **Organization Type** (required, one of the Organization Organization Type values) — Classifies the organizational structure represented by the specialization. Used for hierarchy, authorization, reporting, transaction scope, and organizational configuration. Organization type describes structure, not commercial role. Custo…
  - **Status** (required, one of the Organization Status values) — Lifecycle of the organizational specialization. Controls whether the organization can normally be selected as an organizational context. Organization status does not replace Party.status or PartyRole.status; all applicable states must perm…
  - **Legal Name** — Formal legal name of the organization. Used for contracts, invoices, tax, regulatory reporting, and legal documentation. LegalName is distinct from the operational name. Supplies legal presentation and compliance context. Optional when the…
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

A governed time-bounded relationship between two Parties describing a business, organizational, legal, household, customer, supplier, employment, or other role relationship. Provide a canonical enterprise representation with stable identity and governed semantics. A governed time-bounded relationship between two Parties describing a business, organizational, legal, household, customer, supplier, employment, or other role relationship. Used whenever enterprise processes need this concept as controlled master or reference data. Referenced by compatible domain entities and workflows while preser…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code for PartyRelationship. Human and integration-friendly identifier. Search, configuration, exchange and reporting. Unique within its governing context according to policy. Required.
  - **Name** (required) — Human-readable name of PartyRelationship. Communicates the concept to business users. UI, documents and reports. Does not replace immutable identity. Required.
  - **From Party** (required, a Party) — Governing Party context for this record. Establishes ownership and enterprise context. Authorization, reporting and workflow. Exactly one Party. Referenced workflows must remain compatible with governing context.

### Party Role

The bridge between stable Party identity and contextual business participation. Party answers who the actor is; PartyRole answers how that actor participates; Customer and Supplier add role-specific commercial behavior. Foundation for sales, procurement, employment, logistics, ownership, contracts, finance, and relationship management. Customer and Supplier specialize PartyRole. Party identity is never duplicated in those specializations. Transaction entities should retain the role context that was effective when the transaction was created or confirmed. Party onboarding → PartyRole creation…

Readable by every signed-in person.

Fields:
  - **Party** (required, a Party) — Identifies the underlying person or organization performing this role. Provides common identity without duplicating Party data. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back t…
  - **Role Type** (required, one of the Party Role Role Type values) — Defines the business capacity in which the Party participates. Determines specialized capabilities, policies, workflows, and validations. Separate from Party.partyType, which describes whether the participant is a person or organization. S…
  - **Code** — Optional business-context identifier for this role instance. Supports operational search, integrations, reports, and legacy references. Identifies the role instance and must not replace Party or specialized role identifiers. Optional when…
  - **Valid From** — Date from which this role is eligible for ordinary business processing. Used by eligibility and transaction validation. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a…
  - **Valid To** — Date after which the role is no longer normally eligible for new business processing. Used by eligibility, renewal, reporting, and expiry workflows. Historical transactions may continue referencing the role after validTo. Prevents new use…
  - **Status** (required, one of the Party Role Status values) — Operational lifecycle of the PartyRole relationship. Controls whether the role can normally participate in new transactions, assignments, or authorizations. Role status is independent of Party.status and other PartyRole statuses. ACTIVE pe…
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
  - **Title** — Personal title. documents and presentation. presentation attribute. supports person display. optional.
  - **Given Name** (required) — Given name. identity and documents. intrinsic person identity. identification. required.
  - **Middle Name** — Middle name. identity and documents. intrinsic person identity. identification. optional.
  - **Family Name** (required) — Family name. identity and documents. intrinsic person identity. identification. required.
  - **Preferred Name** — Preferred display name. communication and UI. presentation not canonical identity. human interaction. optional.
  - **Date Of Birth** — Date of birth. processes requiring verified individual identity. sensitive person attribute subject to access policy. eligibility/verification where applicable. optional.
  - **Gender** (one of the Person Gender values) — Gender classification where required by the business process. permitted business processes only. person attribute and not role. process-specific. optional. The gender of the person is female; set it when that is what the business means for…
  - **Nationality** (a Country) — The country whose nationality the person holds. Chosen from the list of countries; used by identity and compliance processes. Not Party identity; process-specific. Optional.
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

Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. Product defines what is offered or managed; transaction entities define occurrences. Master changes affect future eligibility and dependent open workflows, not completed historical facts. Central to catalog, pricing, sales, procurement, inventory, manufacturing, logistics, fulfillment, invoicing, tax, service, subscriptions, and analytics. Product connects to ProductCategory, Supplier, UnitOfMeasure, Location, demand, procurement, inventory state/events, and billing. Transaction…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the product: a value the business records on it. Entered or maintained when a product is created or changed; shown on its form and available to search and reports. Read together with the product's other fields and its relations…
  - **Name** (required) — The name of the product: a value the business records on it. Entered or maintained when a product is created or changed; shown on its form and available to search and reports. Read together with the product's other fields and its relations…
  - **Description** — The description of the product: a value the business records on it. Entered or maintained when a product is created or changed; shown on its form and available to search and reports. Read together with the product's other fields and its re…
  - **Product Type** (required, one of the Product Product Type values) — The product type of the product: a value the business records on it. Entered or maintained when a product is created or changed; shown on its form and available to search and reports. Read together with the product's other fields and its r…
  - **Status** (required, one of the Product Status values) — The status of the product: a value the business records on it. Entered or maintained when a product is created or changed; shown on its form and available to search and reports. Read together with the product's other fields and its relatio…
  - **Sku** — The sku of the product: a value the business records on it. Entered or maintained when a product is created or changed; shown on its form and available to search and reports. Read together with the product's other fields and its relationsh…
  - **Unit Of Measure** (a Unit Of Measure) — The unit of measure of the product: a link to another record the business records on it. Entered or maintained when a product is created or changed; shown on its form and available to search and reports. Read together with the product's ot…
  - **Standard Price** — The standard price of the product: a monetary amount the business records on it. Entered or maintained when a product is created or changed; shown on its form and available to search and reports. Read together with the product's other fiel…
  - **Tax Category** — The tax category of the product: a value the business records on it. Entered or maintained when a product is created or changed; shown on its form and available to search and reports. Read together with the product's other fields and its r…
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
  - **Order Number** (required) — Human-facing procurement reference. Used by buyers, suppliers, receiving, accounts payable and integrations. Business reference distinct from technical purchaseOrderId. Correlates procurement activity across systems. Required for operation…
  - **Order Date** (required) — Date and time the procurement commitment is created or issued. Supports chronology, approval, reporting and reconciliation. Distinct from requested delivery, receipt, return, invoice and payment dates. Anchors the commitment lifecycle. Req…
  - **Status** (required, one of the Purchase Order Status values) — Lifecycle state of the procurement commitment. Controls authorization, issuance, fulfillment, cancellation and closure. PurchaseOrder status does not prove physical receipt, supplier return or invoice settlement; those are separate facts.…
  - **Currency** (a Currency) — Currency qualifying order monetary values. Used for pricing, totals, invoice matching, supplier credit calculation and financial reporting. Qualifies amounts and does not identify Supplier or Product.
  - **Requested Delivery Date** — Buyer's requested delivery or completion date. Used for supplier communication and fulfillment planning. A request, not proof of actual receipt or return. Supports delivery planning.
  - **Total Amount** — Order-level value derived from committed lines and commercial adjustments. Used for approval, budget, supplier commitment and invoice reconciliation. Must reconcile with PurchaseOrderLine values and currencyId.
  - **Supplier** (required, a Supplier) — Supplier receiving the procurement commitment. Drives sourcing, delivery, receiving, supplier performance, returns and accounts payable. GoodsReceipt and SupplierReturn supplier should normally match this supplier.
  - **Request For Quotation** (a Request For Quotation) — Sourcing solicitation from which this order was awarded when applicable. Preserves demand-to-source-to-order traceability. Procurement compliance, price validation, and audit. Optional for direct or non-RFQ procurement. Supplies sourcing c…
  - **Supplier Quotation** (a Supplier Quotation) — Accepted supplier offer forming the commercial basis of this order when applicable. Preserves awarded price and term provenance. Order verification, three-way sourcing audit, and supplier analysis. Optional where procurement does not use s…
  - **Organization** (a Organization) — Buying organization responsible for the commitment. Supports authorization, legal entity, budget, tax and reporting.
  - **Delivery Location** (a Location) — Intended operational destination for ordered goods or services. Used for receiving and logistics planning.
  - **Supplier Performance Assessment** (a Supplier Performance Assessment) — The SupplierPerformanceAssessment this PurchaseOrder belongs to.

Line items — **Purchase Order Line**: kept inside each Purchase Order and reached by opening it, never on their own. Represents one measurable procurement commitment and its accumulated fulfillment, billing and reverse-fulfillment state. PurchaseOrderLine states what the buyer committed to purchase. GoodsReceiptLine records receipt. SupplierReturnLine records subsequent reversal. InvoiceLine records supplier clai…

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
  - **Rfq Number** (required) — Business-facing RFQ reference. Identifies the solicitation to buyers and suppliers. Supplier communication, comparison, reports, and audit. Distinct from requisition and purchase-order numbers. Correlates supplier responses. Required.
  - **Issued At** — Time the RFQ was formally issued. Establishes when suppliers were invited to respond. Sourcing chronology and response-window control. Distinct from demand approval and award time. Optional while draft.
  - **Response Due At** — Deadline for supplier responses. Defines the normal competitive response window. Supplier communication, late-response policy, and sourcing SLA. Does not itself award business. Optional when sourcing policy has no fixed deadline.
  - **Status** (required, one of the Request For Quotation Status values) — Lifecycle state of the RFQ. Controls solicitation, response, closure, and award behavior. Sourcing workflow and governance. Award does not itself create a supplier commitment; PurchaseOrder does. Being prepared. Open to invited supplier re…

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

A first-level division of a country — a state, province, region, territory or equivalent — from the ISO 3166-2 registry. Give every application the same governed list, so a place or code means one thing across the enterprise. A first-level division of a country — a state, province, region, territory or equivalent — from the ISO 3166-2 registry. Chosen from the list wherever a record needs a place, code or currency; maintained by an administrator when a registry changes. Referenced by addresses, parties, products and documents; related entities narrow each other (a city belongs to a state or p…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The ISO 3166-2 code, the country code and the division's own, such as US-CA. Search, integration and reporting. Unique; begins with the code of the country it belongs to. Required.
  - **Name** (required) — The division's name in English. Shown in lists and on addresses. Does not replace the code as the stable key. Required.
  - **Subdivision Type** — What the registry calls the division in its country: State, Province, Region, Territory and so on. Labelling the field for users of that country. Describes this division only.
  - **Country** (required, a Country) — The country the division belongs to. Chosen first; the divisions offered are those of that country. Every state or province belongs to exactly one country. A city and an address are narrowed by the country before the state.

### Supplier

Represents the procurement-facing role of a Party that supplies business inputs and participates in reverse procurement, supplier claims, financial recovery and performance governance. Party provides identity, PartyRole provides the role, and Supplier adds procurement-specific qualification, terms and transaction history. SupplierClaim captures the case; SupplierClaimResolution captures the remedy; downstream transactions execute it; SupplierPerformanceAssessment interprets accumulated evidence for governance. Central to source-to-pay, sourcing, procurement, receiving, supplier returns, quali…

Readable by every signed-in person.

Fields:
  - **Party Role** (required, a Party Role) — PartyRole backing the Supplier specialization. Navigates to common party identity and role information. Supplier must not duplicate Party identity. Supplies shared party context to procurement and financial workflows. Required for role spe…
  - **Supplier Code** (required) — Enterprise supplier business reference. Used on purchase orders receipts invoices returns credits payments claims portals reports and integrations. Distinct from legal name and external registration identifiers. Identifies the supplier acr…
  - **Supplier Type** (one of the Supplier Supplier Type values) — Classification of supplier relationship. Supports onboarding compliance tax contracting and reporting. Does not replace Party identity classification. Supplies supplier classification to procurement policy. Optional. The supplier type of t…
  - **Qualification Status** (one of the Supplier Qualification Status values) — Procurement qualification state. Controls sourcing eligibility and supplier governance. Qualification is distinct from master lifecycle status and may consume SupplierPerformanceAssessment evidence. Gates new procurement commitments while…
  - **Payment Terms** — Default supplier settlement policy. Used by PurchaseOrder Invoice payables payment scheduling and cash forecasting. Transaction or contract terms may override the default. Supplies default payable timing. Optional.
  - **Status** (required, one of the Supplier Status values) — Supplier relationship lifecycle state. Controls procurement eligibility. Historical transactions remain valid after state changes. New procurement return claim-resolution and performance workflows must evaluate status. Required for eligibi…
  - **Party** (required, a Party) — Identifies the underlying person or organization performing this role. Provides common identity without duplicating Party data. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back t…
  - **Role Type** (required, one of the Supplier Role Type values) — Defines the business capacity in which the Party participates. Determines specialized capabilities, policies, workflows, and validations. Separate from Party.partyType, which describes whether the participant is a person or organization. S…
  - **Code** — Optional business-context identifier for this role instance. Supports operational search, integrations, reports, and legacy references. Identifies the role instance and must not replace Party or specialized role identifiers. Optional when…
  - **Valid From** — Date from which this role is eligible for ordinary business processing. Used by eligibility and transaction validation. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a…
  - **Valid To** — Date after which the role is no longer normally eligible for new business processing. Used by eligibility, renewal, reporting, and expiry workflows. Historical transactions may continue referencing the role after validTo. Prevents new use…
  - **Organization** (a Organization) — Optional organizational scope in which the role is recognized. Supports multi-enterprise, subsidiary, business-unit, and operating-context scenarios. Zero means global/context-independent; one means explicitly scoped to one organization. D…

### Supplier Claim

Provides a formal auditable case for supplier-related quality or commercial recovery while keeping the decision and physical/financial consequences as separate controlled records. SupplierClaim explains what went wrong and what recovery was requested or agreed. SupplierClaimResolution records the authorized remedy. SupplierReturn handles physical reversal; SupplierCreditNote or SupplierDebitNote handles financial adjustment; Payment handles cash movement. Supplier quality procurement warranty dispute management recovery supplier scorecards accounts payable and audit. PurchaseOrder GoodsReceip…

Readable by every signed-in person.

Fields:
  - **Claim Number** (required) — Business-facing supplier claim reference. Identifies the claim for procurement quality and supplier communication. Used in correspondence investigations reporting and reconciliation. Distinct from PurchaseOrder GoodsReceipt Invoice Supplie…
  - **Claim Date** (required) — Date and time the claim was raised. Establishes when the organization formally asserted the supplier issue. Supports SLA measurement dispute aging supplier performance and audit. Distinct from receipt inspection return resolution and finan…
  - **Status** (required, one of the Supplier Claim Status values) — Lifecycle state of the supplier claim. Indicates whether the issue is being prepared investigated accepted disputed resolved or closed. Controls investigation supplier response settlement and escalation. Claim status is independent from Su…
  - **Claim Type** (required, one of the Supplier Claim Claim Type values) — Classification of the supplier issue. States the principal business nature of the claim. Drives routing evidence requirements supplier scorecards and analytics. May be supported by QualityInspection or receiving evidence and may result in…
  - **Claimed Amount** — Financial value asserted by the organization in the claim. Represents requested or estimated monetary recovery before supplier agreement or final adjustment. Supports negotiation exposure reporting and recovery analysis. It is not an accou…
  - **Resolution Code** (one of the Supplier Claim Resolution Code values) — Agreed outcome category of the supplier claim. Records the high-level outcome without itself executing the resulting transaction. Supports supplier performance recovery analytics and downstream workflow routing. Detailed authorization is r…
  - **Notes** — Additional claim narrative and investigation context. Records information not represented by structured fields. Supplier communication investigation escalation and audit. Complements structured inspection receipt invoice and return evidenc…
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
  - **Resolution Number** (required) — Human-facing resolution reference. Identifies the resolution decision for operational and supplier communication. Used in approvals correspondence reconciliation and audit. Distinct from the SupplierClaim claimNumber and downstream transac…
  - **Resolution Date** (required) — Date and time the resolution was authorized. Establishes when the agreed remedy became effective. SLA reporting audit and financial control. Anchors downstream execution. Required.
  - **Resolution Type** (required, one of the Supplier Claim Resolution Resolution Type values) — Authorized remedy for the supplier claim. Defines what outcome was agreed without itself executing the remedy. Routes downstream workflows and measures recovery outcomes. RETURN may require SupplierReturn; CREDIT may require SupplierCredit…
  - **Status** (required, one of the Supplier Claim Resolution Status values) — Lifecycle state of the resolution. Separates decision approval from execution and completion. Controls downstream work and claim closure. Resolution status does not replace SupplierClaim or downstream transaction statuses. Gates execution…
  - **Approved Amount** — Monetary recovery authorized by the resolution. Defines the financial amount expected from the agreed remedy. Supplier recovery and reconciliation. Not itself a credit note debit note or cash receipt; execution requires the appropriate fin…
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
  - **Credit Note Number** (required) — Business-facing supplier credit reference. Identifies the credit document for supplier communication and financial reconciliation. Used by accounts payable suppliers auditors and integrations. Correlates internal adjustment with external s…
  - **Credit Note Date** (required) — Effective date of supplier credit adjustment. Establishes financial chronology and applicable accounting/tax period. Payable aging tax reporting and period control. Anchors recognition of adjustment. Required.
  - **Status** (required, one of the Supplier Credit Note Status values) — Lifecycle state of supplier credit. Separates preparation authorization accounting recognition and application against supplier claims. Controls posting payable reconciliation and reversal. Status does not change original Invoice GoodsRece…
  - **Currency** (required, a Currency) — Currency in which supplier credit is denominated. Defines monetary denomination of adjustment. Payable reconciliation accounting tax and application. Qualifies all credit monetary values. Required.
  - **Subtotal** (required) — Credit value before applicable tax. Pre-tax reduction derived from credit lines. Tax calculation and reconciliation. Feeds total credit calculation. Required.
  - **Tax Amount** (required) — Tax component reversed or adjusted. Tax correction associated with credited value. Tax reporting and accounting reconciliation. Contributes to total credit. Required, including zero.
  - **Total Amount** (required) — Total payable reduction represented by supplier credit. Financial value recognized as credit against supplier exposure. Accounts payable reconciliation statements and accounting. Determines maximum adjustment available for application. Req…
  - **Amount Applied** (required) — Portion of supplier credit already applied to payable claims. Separates credit created from portion consumed against invoices. Drives open credit and payable reconciliation. Must reconcile with active SupplierCreditNoteApplication records.…
  - **Amount Unapplied** (required) — Remaining supplier credit not yet applied. Available credit exposure under policy. Future invoice application or supplier settlement/refund processing. Reconciles totalAmount less active applications. Required.
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
  - **Status** (required, one of the Supplier Credit Note Application Status values) — Lifecycle state of the supplier credit application. Indicates whether the application currently reduces payable exposure. Controls SupplierCreditNote and Invoice projections. SupplierCreditNote and Invoice statuses remain independent histo…
  - **Reversal Of Application** (a Supplier Credit Note Application) — Prior supplier credit application reversed by this record. Links correction to the original payable adjustment application. Supports audit and controlled reallocation. Reversal is a new historical event and does not edit the original. Enab…
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
  - **Debit Note Number** (required) — Human-facing supplier debit reference. Identifies the debit adjustment in supplier correspondence and financial operations. Used for reconciliation supplier statements audit and integrations. Distinct from supplier claim purchase order inv…
  - **Debit Note Date** (required) — Effective date of the supplier debit adjustment. Establishes financial chronology and accounting or tax period. Period control reconciliation reporting and supplier communication. Distinct from claim resolution invoice return and payment d…
  - **Status** (required, one of the Supplier Debit Note Status values) — Lifecycle state of the supplier debit adjustment. Separates preparation authorization accounting recognition application dispute and reversal. Controls posting payable reconciliation and supplier dispute workflows. Status does not alter or…
  - **Currency** (required, a Currency) — Currency in which debit amounts are denominated. Defines the monetary denomination of the adjustment. Accounting reconciliation supplier settlement and reporting. Cross-currency application requires explicit ExchangeRate evidence. Qualifie…
  - **Subtotal** (required) — Pre-tax value of the supplier debit adjustment. Aggregate financial increase before applicable tax. Calculation tax and reconciliation. Feeds totalAmount. Required.
  - **Tax Amount** (required) — Tax component associated with the debit adjustment. Represents applicable tax added to the adjustment. Tax reporting accounting and reconciliation. Contributes to totalAmount. Required including zero.
  - **Total Amount** (required) — Total supplier debit adjustment. Financial amount by which supplier-related recoverable exposure is increased. Accounts payable supplier settlement accounting and reconciliation. It is an adjustment, not a replacement for the original supp…
  - **Amount Applied** (required) — Portion of the supplier debit recognized against eligible supplier payable claims. Tracks how much posted debit has been consumed by active SupplierDebitNoteApplication records. Reconciliation supplier statements and reporting. SupplierDeb…
  - **Amount Remaining** (required) — Unapplied portion of the posted supplier debit. Represents debit value still available for payable application or governed settlement handling. Reconciliation supplier statements and resolution tracking. Determines whether the debit is ful…
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
  - **Applied At** (required) — Time the debit application became effective. Establishes settlement chronology. Period control, audit, supplier statements and reconciliation. Anchors the application event. Required.
  - **Status** (required, one of the Supplier Debit Note Application Status values) — Lifecycle state of the debit application. Separates preparation from effective application and later reversal. Controls payable projections and remaining debit balance. Application status does not replace SupplierDebitNote or Invoice statu…
  - **Reversal Of Application** (a Supplier Debit Note Application) — Prior application being reversed. Provides explicit lineage for a corrective reversal. Audit, reconciliation and error correction. Reversal is a new event and does not mutate the original application. Links compensating evidence to the pri…
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
  - **Assessment Number** (required) — Human-facing assessment reference. Identifies the performance evaluation for operational and supplier communication. Review meetings, supplier scorecards, audit and reporting. Distinct from supplierCode, claimNumber and purchase order numb…
  - **Assessment Date** (required) — Date on which the assessment is formally recorded. Establishes the governance point at which the evaluated performance becomes an assessment record. Supplier reviews, audit, reporting and decision chronology. Anchors approval and follow-up…
  - **Period Start** (required) — Beginning of the performance evaluation period. Defines the historical window from which performance evidence is evaluated. Score calculation, supplier comparison and trend reporting. Evidence transactions must fall within or be explicitly…
  - **Period End** (required) — End of the performance evaluation period. Defines the closing boundary of the performance evidence window. Score calculation, reporting and supplier review. Completes the assessment scope. Required.
  - **Status** (required, one of the Supplier Performance Assessment Status values) — Lifecycle state of the supplier performance assessment. Separates calculation, review, approval, publication and replacement of scorecard results. Controls whether the assessment may be changed or consumed by supplier governance. Does not…
  - **Overall Score** — Aggregate supplier performance score for the assessment scope. Represents the governed result of the configured supplier scorecard calculation. Supplier ranking, sourcing decisions, escalation and trend analysis. Must be derived from defin…
  - **Rating** (one of the Supplier Performance Assessment Rating values) — Interpreted supplier performance rating. Converts the approved score or governed assessment criteria into a business-facing performance category. Supplier segmentation, review cadence and improvement decisions. Rating is an assessment conc…
  - **Notes** — Qualitative context supporting the assessment. Records material observations, explanations or agreed context that structured scores do not capture. Supplier review, audit and improvement planning. Supplements but does not replace measurabl…
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
  - **Quotation Number** (required) — Supplier or sourcing reference for the offer. Human-facing identifier of the commercial response. Communication, comparison, order conversion, and audit. Scoped with supplier where supplier numbering is not globally unique. Required.
  - **Submitted At** (required) — Time the supplier response was received or submitted. Establishes offer chronology and deadline compliance. Sourcing governance and audit. Distinct from RFQ issue and purchase-order dates. Required.
  - **Valid Until** — Last date on which the commercial offer remains valid. Defines the supplier's price/terms validity window. Award eligibility and purchase-order conversion. Expiry does not rewrite historical offer evidence. Optional if no explicit expiry a…
  - **Total Amount** — Total offered commercial amount. Summarizes the supplier offer for comparison. Sourcing analysis, approvals, and order conversion. Must reconcile with detailed offer basis when line detail is modeled. Optional while offer pricing is incomp…
  - **Status** (required, one of the Supplier Quotation Status values) — Evaluation state of the supplier offer. Controls whether the response is pending, selected, rejected, expired, or withdrawn. Comparison and award workflow. ACCEPTED authorizes downstream conversion but PurchaseOrder remains the commitment.…
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
  - **Return Number** (required) — Human-facing supplier return reference. Operational identifier communicated to warehouse staff and the supplier. Used for logistics, supplier communication, investigation and reconciliation. Distinct from the original purchase order, recei…
  - **Status** (required, one of the Supplier Return Status values) — Lifecycle state of the supplier return. Indicates authorization, transport, supplier receipt, completion or controlled exception. Controls logistics, inventory and financial workflows. Return status does not itself reverse inventory or acc…
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

Represents a process runtime entity called Task within the CEDM business model. Task is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Task records. The entity participates in a wider business graph through relationships with Workflow, Party, Organization, Document. These relationships provide the context needed to interpret the record rather tha…

Readable by every signed-in person.

Fields:
  - **Code** (required) — A human-readable business code used to identify or reference the record in operational processes and integrations. Used when creating, reviewing, searching, validating, reporting on, or integrating Task records, where applicable. Its meani…
  - **Name** (required) — The human-readable name used by people, reports, searches, and related business processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Task records, where applicable. Its meaning is specific to Task;…
  - **Description** — A business description that explains the purpose, scope, or meaning of the record to users and downstream processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Task records, where applicable. Its mea…
  - **Task Type** (required, one of the Task Task Type values) — Captures the business meaning of task type for the Task. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating…
  - **Status** (required, one of the Task Status values) — The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Task record…
  - **Priority** (required, one of the Task Priority values) — Captures the business meaning of priority for the Task. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating,…
  - **Due At** — Records when the due event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating Task r…
  - **Started At** — Records when the started event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating Ta…
  - **Completed At** — Records when the completed event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating…
  - **Assignee** (a Party) — Connects Task to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a Task. The declared cardinality 0..1 expresses how many related records may p…
  - **Organization** (a Organization) — Connects Task to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a Task. The declared cardinality 0..1 expresses how many related…

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
  - **Category** (required, one of the Unit Of Measure Category values) — Defines the dimensional family of the unit. Prevents invalid conversions and supports dimensional validation. Conversion is valid only between compatible dimensions under the applicable conversion model. Used when validating Product, Sales…
  - **Conversion Factor** — Default multiplicative factor relating this unit to its base unit when a simple linear conversion applies. Defines a master conversion used for future quantity interpretation. Used for quantity conversion when no context-specific conversio…
  - **Base Unit** (a Unit Of Measure) — Identifies the canonical base unit against which this derived unit is normally converted. Supports standardized quantity storage and conversion. A derived unit belongs to the same dimensional category as its base unit. Provides the common…
  - **Status** (required, one of the Unit Of Measure Status values) — Controls whether the unit can be used for new transactions. Used by master-data validation and transaction entry. Retiring a unit must not invalidate historical quantities already recorded with that unit. New quantity-bearing transactions…

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

- **RESIDENTIAL** — The address type of the address is residential; set it when that is what the business means for this record.
- **BUSINESS** — The address type of the address is business; set it when that is what the business means for this record.
- **BILLING** — The address type of the address is billing; set it when that is what the business means for this record.
- **SHIPPING** — The address type of the address is shipping; set it when that is what the business means for this record.
- **REGISTERED** — The address type of the address is registered; set it when that is what the business means for this record.
- **POSTAL** — The address type of the address is postal; set it when that is what the business means for this record.
- **OTHER** — The address type of the address is other; set it when that is what the business means for this record.

### Address Status

- **ACTIVE** — The status of the address is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the address is inactive; set it when that is what the business means for this record.
- **RETIRED** — The status of the address is retired; set it when that is what the business means for this record.

### Currency Status

- **ACTIVE** — Available for normal financial activity.
- **INACTIVE** — Temporarily unavailable for new normal activity.
- **RETIRED** — No longer available for new normal activity while historical financial records remain valid.

### Exchange Rate Rate Type

- **SPOT** — Market or transaction-time conversion rate.
- **CONTRACT** — Rate established by an agreement or commercial contract.
- **DAILY** — Published daily rate for a defined business date.
- **MONTHLY** — Published rate intended for a defined monthly reporting period.
- **ACCOUNTING** — Rate designated by accounting policy for ledger translation or reporting.
- **CUSTOM** — Controlled rate established for a specific business purpose.

### Exchange Rate Status

- **DRAFT** — The status of the exchange rate is draft; set it when that is what the business means for this record.
- **ACTIVE** — The status of the exchange rate is active; set it when that is what the business means for this record.
- **EXPIRED** — The status of the exchange rate is expired; set it when that is what the business means for this record.
- **CANCELLED** — The status of the exchange rate is cancelled; set it when that is what the business means for this record.

### Goods Receipt Status

- **DRAFT** — The status of the goods receipt is draft; set it when that is what the business means for this record.
- **RECEIVED** — The status of the goods receipt is received; set it when that is what the business means for this record.
- **INSPECTION PENDING** — The status of the goods receipt is inspection pending; set it when that is what the business means for this record.
- **ACCEPTED** — The status of the goods receipt is accepted; set it when that is what the business means for this record.
- **PARTIALLY ACCEPTED** — The status of the goods receipt is partially accepted; set it when that is what the business means for this record.
- **REJECTED** — The status of the goods receipt is rejected; set it when that is what the business means for this record.
- **CANCELLED** — The status of the goods receipt is cancelled; set it when that is what the business means for this record.

### Invoice Invoice Type

- **SALES** — The invoice type of the invoice is sales; set it when that is what the business means for this record.
- **PURCHASE** — The invoice type of the invoice is purchase; set it when that is what the business means for this record.
- **CREDIT NOTE** — The invoice type of the invoice is credit note; set it when that is what the business means for this record.
- **DEBIT NOTE** — The invoice type of the invoice is debit note; set it when that is what the business means for this record.

### Invoice Line Matching Status

- **NOT APPLICABLE** — The matching status of the invoice line is not applicable; set it when that is what the business means for this record.
- **UNMATCHED** — The matching status of the invoice line is unmatched; set it when that is what the business means for this record.
- **MATCHED** — The matching status of the invoice line is matched; set it when that is what the business means for this record.
- **PARTIALLY MATCHED** — The matching status of the invoice line is partially matched; set it when that is what the business means for this record.
- **EXCEPTION** — The matching status of the invoice line is exception; set it when that is what the business means for this record.
- **WAIVED** — The matching status of the invoice line is waived; set it when that is what the business means for this record.

### Invoice Status

- **DRAFT** — Claim is being prepared and is not issued.
- **ISSUED** — Claim is formally outstanding.
- **PARTIALLY PAID** — Active settlement evidence covers part of the amount due after authorized adjustments.
- **PAID** — Active settlement evidence and authorized adjustments fully satisfy the claim under policy.
- **OVERDUE** — Claim remains outstanding after its due date.
- **CANCELLED** — Claim has been cancelled under authorized controls.
- **VOID** — Claim has been invalidated under accounting controls.

### Location Location Type

- **SITE** — The location type of the location is site; set it when that is what the business means for this record.
- **WAREHOUSE** — The location type of the location is warehouse; set it when that is what the business means for this record.
- **STORE** — The location type of the location is store; set it when that is what the business means for this record.
- **OFFICE** — The location type of the location is office; set it when that is what the business means for this record.
- **FACTORY** — The location type of the location is factory; set it when that is what the business means for this record.
- **YARD** — The location type of the location is yard; set it when that is what the business means for this record.
- **PORT** — The location type of the location is port; set it when that is what the business means for this record.
- **DEPOT** — The location type of the location is depot; set it when that is what the business means for this record.
- **VIRTUAL** — The location type of the location is virtual; set it when that is what the business means for this record.
- **OTHER** — The location type of the location is other; set it when that is what the business means for this record.

### Location Status

- **PLANNED** — The status of the location is planned; set it when that is what the business means for this record.
- **ACTIVE** — The status of the location is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the location is inactive; set it when that is what the business means for this record.
- **CLOSED** — The status of the location is closed; set it when that is what the business means for this record.
- **RETIRED** — The status of the location is retired; set it when that is what the business means for this record.

### Organization Organization Type

- **ENTERPRISE** — The organization type of the organization is enterprise; set it when that is what the business means for this record.
- **COMPANY** — The organization type of the organization is company; set it when that is what the business means for this record.
- **BUSINESS UNIT** — The organization type of the organization is business unit; set it when that is what the business means for this record.
- **DIVISION** — The organization type of the organization is division; set it when that is what the business means for this record.
- **DEPARTMENT** — The organization type of the organization is department; set it when that is what the business means for this record.
- **BRANCH** — The organization type of the organization is branch; set it when that is what the business means for this record.
- **SUBSIDIARY** — The organization type of the organization is subsidiary; set it when that is what the business means for this record.
- **OTHER** — The organization type of the organization is other; set it when that is what the business means for this record.

### Organization Party Type

- **PERSON** — The party represents an individual human being.
- **ORGANIZATION** — The party represents a legal, commercial, governmental, nonprofit, or other organized body.

### Organization Status

- **DRAFT** — The status of the organization is draft; set it when that is what the business means for this record.
- **ACTIVE** — The status of the organization is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the organization is inactive; set it when that is what the business means for this record.
- **RETIRED** — The status of the organization is retired; set it when that is what the business means for this record.

### Party Party Type

- **PERSON** — The party represents an individual human being.
- **ORGANIZATION** — The party represents a legal, commercial, governmental, nonprofit, or other organized body.

### Party Role Role Type

- **CUSTOMER** — The role type of the party role is customer; set it when that is what the business means for this record.
- **SUPPLIER** — The role type of the party role is supplier; set it when that is what the business means for this record.
- **EMPLOYEE** — The role type of the party role is employee; set it when that is what the business means for this record.
- **PARTNER** — The role type of the party role is partner; set it when that is what the business means for this record.
- **CARRIER** — The role type of the party role is carrier; set it when that is what the business means for this record.
- **AGENT** — The role type of the party role is agent; set it when that is what the business means for this record.
- **CONTRACTOR** — The role type of the party role is contractor; set it when that is what the business means for this record.
- **OWNER** — The role type of the party role is owner; set it when that is what the business means for this record.
- **INVESTOR** — The role type of the party role is investor; set it when that is what the business means for this record.
- **OTHER** — The role type of the party role is other; set it when that is what the business means for this record.

### Party Role Status

- **ACTIVE** — The status of the party role is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the party role is inactive; set it when that is what the business means for this record.
- **EXPIRED** — The status of the party role is expired; set it when that is what the business means for this record.

### Party Status

- **ACTIVE** — The party is available for normal business participation.
- **INACTIVE** — The party is retained but is not normally eligible for new activity.
- **BLOCKED** — Business activity is restricted pending resolution of a business, risk, compliance, or operational condition.
- **RETIRED** — The party relationship is permanently ended for normal operational use while historical references remain valid.

### Person Gender

- **FEMALE** — The gender of the person is female; set it when that is what the business means for this record.
- **MALE** — The gender of the person is male; set it when that is what the business means for this record.
- **NON BINARY** — The gender of the person is non binary; set it when that is what the business means for this record.
- **OTHER** — The gender of the person is other; set it when that is what the business means for this record.
- **UNSPECIFIED** — The gender of the person is unspecified; set it when that is what the business means for this record.

### Person Party Type

- **PERSON** — The party represents an individual human being.
- **ORGANIZATION** — The party represents a legal, commercial, governmental, nonprofit, or other organized body.

### Person Status

- **ACTIVE** — The party is available for normal business participation.
- **INACTIVE** — The party is retained but is not normally eligible for new activity.
- **BLOCKED** — Business activity is restricted pending resolution of a business, risk, compliance, or operational condition.
- **RETIRED** — The party relationship is permanently ended for normal operational use while historical references remain valid.

### Product Product Type

- **GOOD** — The product type of the product is good; set it when that is what the business means for this record.
- **MATERIAL** — The product type of the product is material; set it when that is what the business means for this record.
- **SERVICE** — The product type of the product is service; set it when that is what the business means for this record.
- **SUBSCRIPTION** — The product type of the product is subscription; set it when that is what the business means for this record.
- **ASSET** — The product type of the product is asset; set it when that is what the business means for this record.
- **BUNDLE** — The product type of the product is bundle; set it when that is what the business means for this record.
- **OTHER** — The product type of the product is other; set it when that is what the business means for this record.

### Product Status

- **DRAFT** — The status of the product is draft; set it when that is what the business means for this record.
- **ACTIVE** — The status of the product is active; set it when that is what the business means for this record.
- **DISCONTINUED** — The status of the product is discontinued; set it when that is what the business means for this record.
- **BLOCKED** — The status of the product is blocked; set it when that is what the business means for this record.
- **RETIRED** — The status of the product is retired; set it when that is what the business means for this record.

### Purchase Order Line Price Source

- **PRICE LIST** — The price source of the purchase order line is price list; set it when that is what the business means for this record.
- **CONTRACT** — The price source of the purchase order line is contract; set it when that is what the business means for this record.
- **SUPPLIER AGREEMENT** — The price source of the purchase order line is supplier agreement; set it when that is what the business means for this record.
- **QUOTATION** — The price source of the purchase order line is quotation; set it when that is what the business means for this record.
- **MANUAL** — The price source of the purchase order line is manual; set it when that is what the business means for this record.
- **OTHER** — The price source of the purchase order line is other; set it when that is what the business means for this record.

### Purchase Order Status

- **DRAFT** — Being prepared.
- **APPROVED** — Internally authorized.
- **SENT** — Communicated to Supplier.
- **PARTIALLY RECEIVED** — Some committed quantity accepted while outstanding fulfillment remains.
- **RECEIVED** — Required fulfillment accepted under policy.
- **CANCELLED** — Remaining commitment terminated.
- **CLOSED** — Required operational and financial processing complete.

### Purchase Requisition Status

- **DRAFT** — The requester is preparing the demand and may still change it.
- **SUBMITTED** — The request has been submitted for review and approval.
- **APPROVED** — The organization has authorized the requested procurement demand, subject to sourcing and purchasing policy.
- **REJECTED** — The requested procurement demand was not approved.
- **ORDERED** — The approved demand has been converted into or otherwise satisfied by a PurchaseOrder or equivalent procurement commitment.
- **CLOSED** — The requisition lifecycle is complete and no further procurement action is required.
- **CANCELLED** — The request has been intentionally withdrawn before completion.

### Request For Quotation Status

- **DRAFT** — Being prepared.
- **ISSUED** — Open to invited supplier responses.
- **CLOSED** — Response collection ended without final award state.
- **AWARDED** — One or more responses were selected for downstream commitment.
- **CANCELLED** — Sourcing request terminated.

### Supplier Claim Claim Type

- **QUALITY** — The claim type of the supplier claim is quality; set it when that is what the business means for this record.
- **DAMAGE** — The claim type of the supplier claim is damage; set it when that is what the business means for this record.
- **SHORTAGE** — The claim type of the supplier claim is shortage; set it when that is what the business means for this record.
- **OVERAGE** — The claim type of the supplier claim is overage; set it when that is what the business means for this record.
- **WRONG ITEM** — The claim type of the supplier claim is wrong item; set it when that is what the business means for this record.
- **WARRANTY** — The claim type of the supplier claim is warranty; set it when that is what the business means for this record.
- **SERVICE** — The claim type of the supplier claim is service; set it when that is what the business means for this record.
- **COMMERCIAL** — The claim type of the supplier claim is commercial; set it when that is what the business means for this record.
- **DELIVERY** — The claim type of the supplier claim is delivery; set it when that is what the business means for this record.
- **DOCUMENTATION** — The claim type of the supplier claim is documentation; set it when that is what the business means for this record.
- **OTHER** — The claim type of the supplier claim is other; set it when that is what the business means for this record.

### Supplier Claim Resolution Code

- **NO ACTION** — The resolution code of the supplier claim is no action; set it when that is what the business means for this record.
- **REPLACEMENT** — The resolution code of the supplier claim is replacement; set it when that is what the business means for this record.
- **REPAIR** — The resolution code of the supplier claim is repair; set it when that is what the business means for this record.
- **RETURN** — The resolution code of the supplier claim is return; set it when that is what the business means for this record.
- **CREDIT** — The resolution code of the supplier claim is credit; set it when that is what the business means for this record.
- **DEBIT ADJUSTMENT** — The resolution code of the supplier claim is debit adjustment; set it when that is what the business means for this record.
- **PRICE ADJUSTMENT** — The resolution code of the supplier claim is price adjustment; set it when that is what the business means for this record.
- **ACCEPTED EXCEPTION** — The resolution code of the supplier claim is accepted exception; set it when that is what the business means for this record.
- **REJECTED** — The resolution code of the supplier claim is rejected; set it when that is what the business means for this record.

### Supplier Claim Resolution Resolution Type

- **NO ACTION** — The resolution type of the supplier claim resolution is no action; set it when that is what the business means for this record.
- **REPLACEMENT** — The resolution type of the supplier claim resolution is replacement; set it when that is what the business means for this record.
- **REPAIR** — The resolution type of the supplier claim resolution is repair; set it when that is what the business means for this record.
- **RETURN** — The resolution type of the supplier claim resolution is return; set it when that is what the business means for this record.
- **CREDIT** — The resolution type of the supplier claim resolution is credit; set it when that is what the business means for this record.
- **DEBIT ADJUSTMENT** — The resolution type of the supplier claim resolution is debit adjustment; set it when that is what the business means for this record.
- **PRICE ADJUSTMENT** — The resolution type of the supplier claim resolution is price adjustment; set it when that is what the business means for this record.
- **CASH RECOVERY** — The resolution type of the supplier claim resolution is cash recovery; set it when that is what the business means for this record.
- **ACCEPTED EXCEPTION** — The resolution type of the supplier claim resolution is accepted exception; set it when that is what the business means for this record.

### Supplier Claim Resolution Status

- **DRAFT** — The status of the supplier claim resolution is draft; set it when that is what the business means for this record.
- **APPROVED** — The status of the supplier claim resolution is approved; set it when that is what the business means for this record.
- **IN EXECUTION** — The status of the supplier claim resolution is in execution; set it when that is what the business means for this record.
- **PARTIALLY EXECUTED** — The status of the supplier claim resolution is partially executed; set it when that is what the business means for this record.
- **EXECUTED** — The status of the supplier claim resolution is executed; set it when that is what the business means for this record.
- **FAILED** — The status of the supplier claim resolution is failed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the supplier claim resolution is cancelled; set it when that is what the business means for this record.

### Supplier Claim Status

- **DRAFT** — The status of the supplier claim is draft; set it when that is what the business means for this record.
- **OPEN** — The status of the supplier claim is open; set it when that is what the business means for this record.
- **UNDER REVIEW** — The status of the supplier claim is under review; set it when that is what the business means for this record.
- **ACCEPTED** — The status of the supplier claim is accepted; set it when that is what the business means for this record.
- **PARTIALLY ACCEPTED** — The status of the supplier claim is partially accepted; set it when that is what the business means for this record.
- **REJECTED** — The status of the supplier claim is rejected; set it when that is what the business means for this record.
- **RESOLVED** — The status of the supplier claim is resolved; set it when that is what the business means for this record.
- **CLOSED** — The status of the supplier claim is closed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the supplier claim is cancelled; set it when that is what the business means for this record.
- **ESCALATED** — The status of the supplier claim is escalated; set it when that is what the business means for this record.

### Supplier Credit Note Application Status

- **DRAFT** — The status of the supplier credit note application is draft; set it when that is what the business means for this record.
- **ACTIVE** — The status of the supplier credit note application is active; set it when that is what the business means for this record.
- **REVERSED** — The status of the supplier credit note application is reversed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the supplier credit note application is cancelled; set it when that is what the business means for this record.

### Supplier Credit Note Status

- **DRAFT** — The status of the supplier credit note is draft; set it when that is what the business means for this record.
- **APPROVED** — The status of the supplier credit note is approved; set it when that is what the business means for this record.
- **POSTED** — The status of the supplier credit note is posted; set it when that is what the business means for this record.
- **PARTIALLY APPLIED** — The status of the supplier credit note is partially applied; set it when that is what the business means for this record.
- **FULLY APPLIED** — The status of the supplier credit note is fully applied; set it when that is what the business means for this record.
- **CANCELLED** — The status of the supplier credit note is cancelled; set it when that is what the business means for this record.
- **REVERSED** — The status of the supplier credit note is reversed; set it when that is what the business means for this record.

### Supplier Debit Note Application Status

- **DRAFT** — The status of the supplier debit note application is draft; set it when that is what the business means for this record.
- **ACTIVE** — The status of the supplier debit note application is active; set it when that is what the business means for this record.
- **REVERSED** — The status of the supplier debit note application is reversed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the supplier debit note application is cancelled; set it when that is what the business means for this record.

### Supplier Debit Note Status

- **DRAFT** — The status of the supplier debit note is draft; set it when that is what the business means for this record.
- **APPROVED** — The status of the supplier debit note is approved; set it when that is what the business means for this record.
- **POSTED** — The status of the supplier debit note is posted; set it when that is what the business means for this record.
- **PARTIALLY APPLIED** — The status of the supplier debit note is partially applied; set it when that is what the business means for this record.
- **FULLY APPLIED** — The status of the supplier debit note is fully applied; set it when that is what the business means for this record.
- **DISPUTED** — The status of the supplier debit note is disputed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the supplier debit note is cancelled; set it when that is what the business means for this record.
- **REVERSED** — The status of the supplier debit note is reversed; set it when that is what the business means for this record.

### Supplier Performance Assessment Rating

- **EXCELLENT** — The rating of the supplier performance assessment is excellent; set it when that is what the business means for this record.
- **GOOD** — The rating of the supplier performance assessment is good; set it when that is what the business means for this record.
- **ACCEPTABLE** — The rating of the supplier performance assessment is acceptable; set it when that is what the business means for this record.
- **NEEDS IMPROVEMENT** — The rating of the supplier performance assessment is needs improvement; set it when that is what the business means for this record.
- **UNSATISFACTORY** — The rating of the supplier performance assessment is unsatisfactory; set it when that is what the business means for this record.

### Supplier Performance Assessment Status

- **DRAFT** — The status of the supplier performance assessment is draft; set it when that is what the business means for this record.
- **IN REVIEW** — The status of the supplier performance assessment is in review; set it when that is what the business means for this record.
- **APPROVED** — The status of the supplier performance assessment is approved; set it when that is what the business means for this record.
- **PUBLISHED** — The status of the supplier performance assessment is published; set it when that is what the business means for this record.
- **SUPERSEDED** — The status of the supplier performance assessment is superseded; set it when that is what the business means for this record.
- **CANCELLED** — The status of the supplier performance assessment is cancelled; set it when that is what the business means for this record.

### Supplier Qualification Status

- **NOT REVIEWED** — The qualification status of the supplier is not reviewed; set it when that is what the business means for this record.
- **PENDING** — The qualification status of the supplier is pending; set it when that is what the business means for this record.
- **QUALIFIED** — The qualification status of the supplier is qualified; set it when that is what the business means for this record.
- **SUSPENDED** — The qualification status of the supplier is suspended; set it when that is what the business means for this record.
- **DISQUALIFIED** — The qualification status of the supplier is disqualified; set it when that is what the business means for this record.

### Supplier Quotation Line Award Status

- **PENDING** — Not yet decided.
- **ACCEPTED** — Selected for the governed quantity.
- **PARTIALLY ACCEPTED** — Selected for part of offered quantity.
- **REJECTED** — Not selected.

### Supplier Quotation Status

- **RECEIVED** — Offer captured.
- **UNDER REVIEW** — Being evaluated.
- **ACCEPTED** — Selected through governed award.
- **REJECTED** — Not selected.
- **EXPIRED** — Validity elapsed.
- **WITHDRAWN** — Supplier withdrew the offer.

### Supplier Return Line Disposition

- **RETURN TO SUPPLIER** — The disposition of the supplier return line is return to supplier; set it when that is what the business means for this record.
- **REJECTED** — The disposition of the supplier return line is rejected; set it when that is what the business means for this record.
- **EXCEPTION** — The disposition of the supplier return line is exception; set it when that is what the business means for this record.

### Supplier Return Status

- **DRAFT** — The status of the supplier return is draft; set it when that is what the business means for this record.
- **AUTHORIZED** — The status of the supplier return is authorized; set it when that is what the business means for this record.
- **IN TRANSIT** — The status of the supplier return is in transit; set it when that is what the business means for this record.
- **RECEIVED BY SUPPLIER** — The status of the supplier return is received by supplier; set it when that is what the business means for this record.
- **COMPLETED** — The status of the supplier return is completed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the supplier return is cancelled; set it when that is what the business means for this record.
- **EXCEPTION** — The status of the supplier return is exception; set it when that is what the business means for this record.

### Supplier Role Type

- **CUSTOMER** — The role type of the party role is customer; set it when that is what the business means for this record.
- **SUPPLIER** — The role type of the party role is supplier; set it when that is what the business means for this record.
- **EMPLOYEE** — The role type of the party role is employee; set it when that is what the business means for this record.
- **PARTNER** — The role type of the party role is partner; set it when that is what the business means for this record.
- **CARRIER** — The role type of the party role is carrier; set it when that is what the business means for this record.
- **AGENT** — The role type of the party role is agent; set it when that is what the business means for this record.
- **CONTRACTOR** — The role type of the party role is contractor; set it when that is what the business means for this record.
- **OWNER** — The role type of the party role is owner; set it when that is what the business means for this record.
- **INVESTOR** — The role type of the party role is investor; set it when that is what the business means for this record.
- **OTHER** — The role type of the party role is other; set it when that is what the business means for this record.

### Supplier Status

- **ACTIVE** — The status of the supplier is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the supplier is inactive; set it when that is what the business means for this record.
- **BLOCKED** — The status of the supplier is blocked; set it when that is what the business means for this record.
- **RETIRED** — The status of the supplier is retired; set it when that is what the business means for this record.

### Supplier Supplier Type

- **INDIVIDUAL** — The supplier type of the supplier is individual; set it when that is what the business means for this record.
- **BUSINESS** — The supplier type of the supplier is business; set it when that is what the business means for this record.
- **GOVERNMENT** — The supplier type of the supplier is government; set it when that is what the business means for this record.
- **INTERNAL** — The supplier type of the supplier is internal; set it when that is what the business means for this record.
- **OTHER** — The supplier type of the supplier is other; set it when that is what the business means for this record.

### Task Priority

- **LOW** — Represents the low state or classification in the context of Task.
- **NORMAL** — Represents the normal state or classification in the context of Task.
- **HIGH** — Represents the high state or classification in the context of Task.
- **CRITICAL** — Represents the critical state or classification in the context of Task.

### Task Status

- **CREATED** — Represents the created state or classification in the context of Task.
- **READY** — Represents the ready state or classification in the context of Task.
- **ASSIGNED** — Represents the assigned state or classification in the context of Task.
- **IN PROGRESS** — Represents the in progress state or classification in the context of Task.
- **BLOCKED** — Represents the blocked state or classification in the context of Task.
- **COMPLETED** — Represents the completed state or classification in the context of Task.
- **CANCELLED** — Represents the cancelled state or classification in the context of Task.
- **FAILED** — Represents the failed state or classification in the context of Task.

### Task Task Type

- **USER** — Represents the user state or classification in the context of Task.
- **SYSTEM** — Represents the system state or classification in the context of Task.
- **APPROVAL** — Represents the approval state or classification in the context of Task.
- **DECISION** — Represents the decision state or classification in the context of Task.
- **NOTIFICATION** — Represents the notification state or classification in the context of Task.
- **SCRIPT** — Represents the script state or classification in the context of Task.
- **OTHER** — Represents the other state or classification in the context of Task.

### Unit Of Measure Category

- **QUANTITY** — The category of the unit of measure is quantity; set it when that is what the business means for this record.
- **LENGTH** — The category of the unit of measure is length; set it when that is what the business means for this record.
- **AREA** — The category of the unit of measure is area; set it when that is what the business means for this record.
- **VOLUME** — The category of the unit of measure is volume; set it when that is what the business means for this record.
- **MASS** — The category of the unit of measure is mass; set it when that is what the business means for this record.
- **TIME** — The category of the unit of measure is time; set it when that is what the business means for this record.
- **COUNT** — The category of the unit of measure is count; set it when that is what the business means for this record.
- **CURRENCY** — The category of the unit of measure is currency; set it when that is what the business means for this record.
- **OTHER** — The category of the unit of measure is other; set it when that is what the business means for this record.

### Unit Of Measure Status

- **ACTIVE** — The status of the unit of measure is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the unit of measure is inactive; set it when that is what the business means for this record.
- **RETIRED** — The status of the unit of measure is retired; set it when that is what the business means for this record.

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
Final: **REJECTED**, **CANCELLED**.

Moves:
- DRAFT → RECEIVED (Receive)
- RECEIVED → ACCEPTED (Accept)
- ACCEPTED → PARTIALLY ACCEPTED (Mark Partially Accepted)
- RECEIVED → INSPECTION PENDING (Mark Inspection Pending)
- INSPECTION PENDING → RECEIVED (Resume)
- ACCEPTED → INSPECTION PENDING (Mark Inspection Pending)
- INSPECTION PENDING → ACCEPTED (Resume)
- PARTIALLY ACCEPTED → INSPECTION PENDING (Mark Inspection Pending)
- INSPECTION PENDING → PARTIALLY ACCEPTED (Resume)
- DRAFT → REJECTED (Reject)
- RECEIVED → REJECTED (Reject)
- ACCEPTED → REJECTED (Reject)
- PARTIALLY ACCEPTED → REJECTED (Reject)
- INSPECTION PENDING → REJECTED (Reject)
- DRAFT → CANCELLED (Cancel)
- RECEIVED → CANCELLED (Cancel)
- ACCEPTED → CANCELLED (Cancel)
- PARTIALLY ACCEPTED → CANCELLED (Cancel)
- INSPECTION PENDING → CANCELLED (Cancel)

### Supplier Claim — Supplier Claim Lifecycle

Starts at **DRAFT**.
Final: **CLOSED**, **REJECTED**, **CANCELLED**.

Moves:
- DRAFT → OPEN (Open)
- OPEN → UNDER REVIEW (Review)
- UNDER REVIEW → ACCEPTED (Accept)
- ACCEPTED → PARTIALLY ACCEPTED (Mark Partially Accepted)
- PARTIALLY ACCEPTED → ESCALATED (Mark Escalated)
- ESCALATED → RESOLVED (Resolve)
- RESOLVED → CLOSED (Close)
- DRAFT → REJECTED (Reject)
- OPEN → REJECTED (Reject)
- UNDER REVIEW → REJECTED (Reject)
- ACCEPTED → REJECTED (Reject)
- PARTIALLY ACCEPTED → REJECTED (Reject)
- ESCALATED → REJECTED (Reject)
- DRAFT → CANCELLED (Cancel)
- OPEN → CANCELLED (Cancel)
- UNDER REVIEW → CANCELLED (Cancel)
- ACCEPTED → CANCELLED (Cancel)
- PARTIALLY ACCEPTED → CANCELLED (Cancel)
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
- POSTED → PARTIALLY APPLIED (Mark Partially Applied)
- PARTIALLY APPLIED → FULLY APPLIED (Mark Fully Applied)
- DRAFT → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- POSTED → CANCELLED (Cancel)
- PARTIALLY APPLIED → CANCELLED (Cancel)
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
- POSTED → PARTIALLY APPLIED (Mark Partially Applied)
- PARTIALLY APPLIED → DISPUTED (Mark Disputed)
- DISPUTED → FULLY APPLIED (Mark Fully Applied)
- DRAFT → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- POSTED → CANCELLED (Cancel)
- PARTIALLY APPLIED → CANCELLED (Cancel)
- DISPUTED → CANCELLED (Cancel)
- DISPUTED → REVERSED (Reverse)

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
