---
name: manufacturing-domain
description: What the records of Manufacturing are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Manufacturing, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Manufacturing

Manufacturing, built on the CEDM common foundation.

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

### Bill Of Material

The recipe for a product: the components and quantities needed to produce or assemble it. A bill of material turns a product design into something the factory can plan and cost. It says what must be bought or made, and how much, to produce one unit, so material requirements, purchasing and product cost all follow from it. Created by engineering when a product is designed and revised when the design or process changes; read by planning, purchasing, production and costing. The bill belongs to one Product and is made up of BOMComponent lines, each naming a component product and its quantity. A b…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The reference by which engineering and planning name the bill, such as BOM-1042. Entered when the bill is created and used in searches and documents; unique across bills.
  - **Bom Version** (required) — The revision of the bill, for example 2.0, so earlier production can be traced to the recipe that applied. Incremented by engineering when the components or quantities change; production records the version used.
  - **Status** (required, one of the Bill Of Material Status values) — Whether the bill is still being written, in force for production, or replaced. Moved by engineering; planning and production use ACTIVE bills. Being prepared; not yet usable for production. Released and in force; planning and production ma…
  - **Effective From** — The first date on which the bill may be used. Set at release so a new design can be prepared in advance and take over on a known date.
  - **Effective To** — The last date on which the bill may be used. Set when a replacement takes over; must not be earlier than the effective-from date.
  - **Product** (required, a Product) — The product that this bill describes how to make. Chosen when the bill is created; a product can have several bills over time or for alternative ways of making it. Exactly one product: a bill is the recipe for a single finished item. Ties…

Line items — **BOM Component**: kept inside each Bill Of Material and reached by opening it, never on their own. One line of a bill of material: a product or material that is needed, in what quantity, at what stage of the build. A bill of material is only as useful as its lines. Each component line says what goes into the finished product, how much, and how much extra to allow for waste, which is what materia…

### Bill Of Material Status

The values of bill of material status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Business Unit

A major business, division, product line or operating segment within an organisation. Business units are how a large organisation divides its activity for management and reporting. They let results, budgets and responsibility be assigned to a meaningful segment rather than to the organisation as a whole. Defined by management and finance; assigned to people, transactions and budgets; read when reporting by segment. Each business unit belongs to one Organization and groups the work and results of one part of it. A business unit keeps its code and identity stable. Reorganisations are recorded e…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short reference for the unit, such as CE or EMEA-RETAIL. Assigned by finance and used on reports and in postings; kept stable because history relies on it.
  - **Name** (required) — The full name of the unit. Shown in organisation charts and management reports.
  - **Organization** (required, a Organization) — The organisation to which the unit belongs. Set when the unit is created. Exactly one organisation; a unit cannot stand alone. Rolls the unit's results up into its parent organisation.

### Calendar

A calendar that defines business dates, working days, holidays and time-control rules used for planning and operations. Whether a date counts as a working day is not obvious: it depends on region, industry and company. A calendar states that explicitly, so due dates, delivery promises and schedules all agree. Maintained by administrators; referenced by schedulers, service-level calculations and planning when they need to know which days count. Locations, teams, contracts and schedules point to the calendar that governs their working days. A calendar's code and identity stay stable. Changes to…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short reference for the calendar, such as DE-NAT. Assigned by the administrator; used in configuration and reports; kept stable.
  - **Name** (required) — The descriptive name of the calendar. Shown wherever a calendar is chosen.

### City

A city: every national capital and every city of 750 thousand or more, from GeoNames, linked to its country and, for the United States and Canada, to its state or province. A city: every national capital and every city of 750 thousand or more, from GeoNames, linked to its country and, for the United States and Canada, to its state or province. Chosen from the list wherever a record needs a place, code or currency; maintained by an administrator when a registry changes.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The city's code: its country code and its name in capitals, such as FR-PARIS. Quoted beside the name in lists; integration with other systems. Unique; the country prefix keeps cities of one name in different countries apart.
  - **Name** (required) — The city's name in English. Shown in lists and on addresses. Not unique: two countries can have a city of one name.
  - **Population** — The registry's population figure. Ordering and sizing; not a current census count. Describes the city only.
  - **Latitude** — Latitude in degrees, north positive. Maps and distance. Describes the city only.
  - **Longitude** — Longitude in degrees, east positive. Maps and distance. Describes the city only.
  - **Timezone** — The IANA time zone the city keeps, such as Europe/Paris. Showing local times for the city. Describes the city only.
  - **Is Capital** — Whether the city is its country's capital. Highlighting the capital in lists. At most one capital per country in this list.
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

A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. Chosen from the list wherever a record needs a place, code or currency; maintained by an administrator when a registry changes.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The two-letter ISO 3166-1 code, such as US or DE. Search, integration and reporting; stored on nothing else, because records point at the country itself. Unique; a state or province and a city belong to a country through it.
  - **Alpha3** — The three-letter ISO 3166-1 code, such as USA or DEU. Trade and customs documents, which use the long form. Unique among countries.
  - **Numeric Code** — The three-digit ISO 3166-1 numeric code, such as 840. Banking and statistical exchange formats. Unique among countries.
  - **Name** (required) — The country's short name in English. Shown in lists, on addresses and on reports. Does not replace the code as the stable key.
  - **Phone Code** — The international dialling prefix, without the plus sign. Validating and formatting telephone numbers. Belongs to the country; several countries can share a prefix.
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
  - **Name** (required) — The name of the department. Shown in organisation charts and on documents.
  - **Organization** (required, a Organization) — The organisation the department belongs to. Exactly one organisation: a department is part of a single organisation. Places the department in the reporting structure.

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

### Inventory Movement

Represents one auditable change to inventory state, including stock reductions caused by supplier returns. InventoryMovement is the event ledger from which InventoryBalance is maintained. SupplierReturnLine is the operational authorization for supplier-return quantity; InventoryMovement is the physical stock consequence. Receiving, warehouse execution, procurement, order fulfillment, maintenance, customer and supplier returns, stock counting, reconciliation and analytics. Product identifies what is stocked. InventoryLocation identifies where. InventoryBalance is current state. InventoryMoveme…

Readable by every signed-in person.

Fields:
  - **Movement Number** (required) — The document number of the stock movement. Allocated from a number series; unique; printed on goods documents and used in audits. Distinct from Product and source transaction numbers. Traces stock change from execution through reconciliati…
  - **Movement Type** (required, one of the Inventory Movement Movement Type values) — Stock arrives, for example from a supplier or production. Stock leaves, for example to a customer or to production. Stock moves from one location to another. Quantity is corrected after a count or an investigation. Stock comes back from a…
  - **Quantity** (required) — Quantity affected by the inventory event. Drives balance changes and allocation calculations. Interpreted with Product, UOM, movementType and source/target locations. Changes physical quantity for receipt/issue/transfer/return and commitme…
  - **Movement Date** (required) — Timestamp at which inventory event is recognized. Stock history, period-end balances, reporting, audit and reconciliation. Distinct from source order date and record creation timestamp. Establishes effective chronology.
  - **Reason** — Business explanation for movement. Audit, investigation, approval and reporting. Supplements movementType and source relationships. Especially important for adjustments, returns and exceptions.
  - **Unit Of Measure** (a Unit Of Measure) — The UnitOfMeasure this InventoryMovement belongs to.
  - **Product** (required, a Product) — Product whose inventory state is affected. Connects event to product master, units and policies. Exactly one product is affected. Identifies stock item.
  - **Lot** (a Lot) — Lot identity carried by this movement when the Product is lot-controlled. Preserves batch genealogy through every stock event. Traceability, expiry, quality, recall, and reconciliation. Optional for products not requiring lot control. Lot…
  - **Party** (a Party) — Party associated with inventory event when ownership or custody matters. Supplier receipts, customer returns, consignment and audit. Optional for internal movements. Connects event to external party.
  - **Scrap** (a Scrap) — Manufacturing scrap transaction causing this stock reduction when applicable. Explains the governed production-loss reason for stock decrease. Yield, costing, quality and inventory reconciliation. Optional outside manufacturing scrap or wh…

### Inventory Movement Movement Type

The values of inventory movement movement type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Name** (required) — The name of the language in English. Shown in language pick-lists.

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
  - **Name** (required) — The name people use for the place. Shown in lists, maps and documents.
  - **Location Type** (required, one of the Location Location Type values) — What kind of place it is. Chosen at creation; decides which processes can use the location. A geographic site that may contain several buildings. A building or area for storing goods. A retail outlet. A place where office work is done. A p…
  - **Status** (required, one of the Location Status values) — Whether the place is in use. Set by the administrator; only ACTIVE locations are offered for new assignments. Expected but not yet in use. In use. Temporarily not used. Closed down. Removed from use altogether. A final state.
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

### Lot

Batch-level inventory identity for end-to-end genealogy and recall. Product identifies what an item is; Lot identifies which production or receipt batch a quantity belongs to. Inventory, WMS, manufacturing, quality, procurement, sales fulfillment, expiry management, recall, and regulatory traceability. Lot follows Product quantities through InventoryMovement and InventoryBalance and may later connect to receipt, production, shipment, inspection, and certificate evidence. Created/received → active or quarantined → released/held → consumed/expired/rejected → closed. Status, expiry, or quality c…

Readable by every signed-in person.

Fields:
  - **Lot Number** (required) — The batch or lot number by which the quantity is traced, as printed on the label. Assigned at production or receipt; unique per product; used for recalls and first-expired-first-out picking. Traceability code used operationally and externa…
  - **Manufactured At** — When the lot was produced. Entered at production or from the supplier's documents; the start of shelf life. Anchors production age and provenance. Distinct from receipt date.
  - **Expires At** — When the lot must no longer be used or sold. Calculated from manufacture date and shelf life, or taken from the supplier; stock past it is blocked. Controls eligibility where shelf life applies. Does not itself post inventory movement.
  - **Status** (required, one of the Lot Status values) — Whether the lot may be used. Set by quality and inventory control; only usable statuses allow picking and shipping. In stock and usable under normal rules. Temporarily blocked, for example during an enquiry; it can be released again. Held…
  - **Product** (required, a Product) — The product that the lot is a batch of. Set when the lot is created. Exactly one product: a lot groups units of a single item. Gives the lot its specification and shelf life. Defines item identity for all lot quantities.

### Lot Status

The values of lot status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Manufacturing Work Order

Canonical CEDM production-order transaction. ManufacturingWorkOrder authorizes production; BOM defines material expectations; Routing defines process expectations; execution transactions preserve actual material, output and scrap evidence. MRP, scheduling, shop-floor execution, inventory, costing, quality, genealogy and project manufacturing. Product is output; BOM and Routing are controlled definitions; MaterialIssue consumes inputs; ProductionReceipt accepts outputs; Scrap explains governed losses. Planned → released → in progress → completed → closed, with controlled cancellation. Release…

Readable by every signed-in person.

Fields:
  - **Order Number** (required) — Human-facing production-order reference. Operational identifier used across planning and shop-floor execution. Scheduling, material staging, production, quality, costing, and audit. Distinct from inventory transaction references.
  - **Quantity** (required) — Authorized target output quantity. Defines planned production magnitude. Material planning, capacity, completion and variance. Interpreted with output Product and UOM policy.
  - **Planned Start** — Planned production start. Scheduling expectation rather than execution evidence. Capacity and material planning. Actual events are recorded separately.
  - **Planned End** — Planned production completion. Scheduling target for output availability. Capacity, promise and planning. Must not precede plannedStart.
  - **Status** (required, one of the Manufacturing Work Order Status values) — Manufacturing order lifecycle state. Controls authorization and execution eligibility. Planning, shop-floor control, inventory and costing. Posted execution evidence is not reversed by changing header status. Being planned and not executab…
  - **Product** (required, a Product) — Product authorized as manufacturing output. Defines what the work order produces. Planning, output receipt and genealogy. Exactly one output Product. ProductionReceipt Product must reconcile.
  - **Location** (a Location) — Primary production location. Places execution within the operating network. Scheduling, staging and reporting. Optional for distributed/virtual production. Constrains material and resource execution where applicable.
  - **Bill Of Material** (a Bill Of Material) — Effective material structure governing planned component demand. Defines expected inputs. Material planning, issue validation, variance and genealogy. Optional for processes without formal BOM. RELEASED work preserves the effective BOM ver…
  - **Routing** (a Routing) — Effective process definition governing production execution. Defines ordered operations and resource expectations. Scheduling, execution, costing and audit. Optional for simple production without formal routing. RELEASED work preserves the…

### Manufacturing Work Order Status

The values of manufacturing work order status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Material Issue

A record that component material was issued, or staged, to a manufacturing work order, with the stock effect carried out by a stock movement. Production consumes material, and the books must show exactly which material went to which job. The issue states what was supplied to the work order, from which lot, and ties it to the stock movement that reduced inventory. Created when a storekeeper issues components to a job; read by production control, costing and traceability. An issue is for one ManufacturingWorkOrder and one Product, may follow a BOMComponent line, may name a Lot or SerialNumbers,…

Readable by every signed-in person.

Fields:
  - **Issue Number** (required) — The document number of the issue, printed on the pick list. Allocated from a number series; unique; used by storekeepers and in audits. Operational traceability identifier. Distinct from inventory movement number.
  - **Quantity** (required) — The quantity of the component issued to the work order. Entered at issue; the stock movement posts the same quantity and the work order's consumed quantity increases by it. Amount authorized for production consumption. Interpreted with com…
  - **Issued At** (required) — When the material left the store for production. Set at issue; the consumption is costed as of this time. Establishes production consumption chronology. Must align with attributable movement.
  - **Work Order** (required, a Manufacturing Work Order) — The manufacturing work order that receives the material. Chosen when the issue is made. Exactly one work order: material is issued to one production job at a time. Adds the material to the job's actual consumption and cost. Identifies auth…
  - **Bom Component** (a BOM Component) — The bill-of-material line that the issue satisfies. Linked where the issue follows the bill; left empty for substitutions or extras. At most one component line. Lets production compare actual to planned consumption. Connects actual issue t…
  - **Product** (required, a Product) — The component product that is issued. Chosen when the issue is made. Exactly one product: each issue supplies a single item. Determines which stock is reduced. Identifies consumed item.
  - **Lot** (a Lot) — The lot that the material is taken from. Chosen for lot-controlled components. At most one lot. Provides traceability from the finished goods back to the material lot. Preserves input batch genealogy.
  - **Inventory Movement** (required, a Inventory Movement) — The stock movement that carried out the issue. Created when the issue is posted; read to trace the stock effect. Exactly one movement: each posted issue is one stock transaction. Keeps the stock ledger and the work order consistent. Invent…

### Organization

Organization is the organizational specialization of Party, not an independent party identity or business role. Party identifies who the organization is; Organization describes intrinsic organizational structure; PartyRole describes how it participates; Customer and Supplier provide commercial behavior. Used across sales, procurement, finance, logistics, contracts, compliance, HR, and enterprise hierarchy. Party → Organization provides identity specialization. Party → PartyRole provides participation. Customer/Supplier must not create duplicate Party identities. Create/maintain Party → create…

Readable by every signed-in person.

Fields:
  - **Party** (required, a Party) — Canonical Party identity represented by this Organization specialization. Connects organizational details to the shared Party identity used by all roles and transactions. One Party may have exactly one Organization specialization when part…
  - **Code** (required) — Business code for the organization within its governed business context. Used for operations, reporting, integrations, and organizational selection. Code is not the canonical Party identity and uniqueness is governed by organization scope.…
  - **Name** (required) — Common organizational name used in business operations. Used in search, forms, reports, documents, and transactions. LegalName may differ and provides formal legal identity. Provides human-readable organizational identification.
  - **Organization Type** (required, one of the Organization Organization Type values) — The top-level body, such as a group or corporation. A legal company. A business division with its own results. A major part of the organisation. A functional unit. A local office or branch. A company controlled by another. Any other organi…
  - **Status** (required, one of the Organization Status values) — Being set up; not yet in use. In use. Temporarily not in use; can be reactivated. Closed; kept for history. A final state. Lifecycle of the organizational specialization. Controls whether the organization can normally be selected as an org…
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
  - **Name** (required) — A description of the relationship. Shown in party views.
  - **From Party** (required, a Party) — The party at the origin of the relationship. Chosen when the relationship is created. Exactly one origin party: a relationship always starts at a particular party. Together with the other party it identifies the relationship.

### Party Role

The bridge between stable Party identity and contextual business participation. Party answers who the actor is; PartyRole answers how that actor participates; Customer and Supplier add role-specific commercial behavior. Foundation for sales, procurement, employment, logistics, ownership, contracts, finance, and relationship management. Customer and Supplier specialize PartyRole. Party identity is never duplicated in those specializations. Transaction entities should retain the role context that was effective when the transaction was created or confirmed. Party onboarding → PartyRole creation…

Readable by every signed-in person.

Fields:
  - **Party** (required, a Party) — The party that holds the role. Set when the role is assigned and not changed. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back to the canonical identity.
  - **Role Type** (required, one of the Party Role Role Type values) — The kind of role the party plays. Chosen when the role is assigned; decides which specialised record (customer, supplier and so on) is expected. Buys from the organisation. Sells to the organisation. Works for the organisation. A business…
  - **Code** — An optional code for the role. Used by integrations that identify the role separately from the party. Identifies the role instance and must not replace Party or specialized role identifiers.
  - **Valid From** — The first date on which the role applies. Set when the role is assigned. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a newly established role.
  - **Valid To** — The last date on which the role applies. Set when the role ends. Historical transactions may continue referencing the role after validTo. Prevents new use after role expiration while preserving historical attribution.
  - **Status** (required, one of the Party Role Status values) — Whether the role is currently held. Set by master-data staff. The party currently holds the role. Dormant but may resume. Ended; kept for history. A final state. Role status is independent of Party.status and other PartyRole statuses. ACTI…
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
  - **Title** — Personal title. documents and presentation. presentation attribute. supports person display.
  - **Given Name** (required) — Given name. identity and documents. intrinsic person identity. identification.
  - **Middle Name** — Middle name. identity and documents. intrinsic person identity. identification.
  - **Family Name** (required) — Family name. identity and documents. intrinsic person identity. identification.
  - **Preferred Name** — Preferred display name. communication and UI. presentation not canonical identity. human interaction.
  - **Date Of Birth** — Date of birth. processes requiring verified individual identity. sensitive person attribute subject to access policy. eligibility/verification where applicable.
  - **Gender** (one of the Person Gender values) — The person's gender as recorded for the organisation's purposes. Entered only where there is a need and a lawful basis; never used to decide eligibility unless the law requires it. Identifies as female. Identifies as male. Identifies as ne…
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

Line items — **Product Lifecycle**: kept inside each Product and reached by opening it, never on their own. A dated record of a change in a product's lifecycle status, with the reason, so it is clear why and when a product became eligible or ineligible for trade. A product's status changes, such as from active to discontinued, and the reasons matter. Keeping each change as an effective-dated record allow…

### Production Receipt

An auditable record that a quantity of accepted product came out of a manufacturing work order and into stock. A receipt is the moment production becomes inventory. It ties the quantity made to the work order, the product, any lot or serial numbers and the quality inspection that accepted it, and it is backed by an inventory movement so stock rises by exactly what was received. Created by the shop floor or production control when finished goods are reported; read by inventory, costing and quality. A receipt belongs to one work order and one product, may name a lot, serial numbers and an inspe…

Readable by every signed-in person.

Fields:
  - **Receipt Number** (required) — The business number printed on the receipt, such as PR-2041. Quoted on the work order and on stock documents. Operational identifier for output posting. Shop floor, warehouse, quality, and audit.
  - **Quantity** (required) — The accepted quantity added to stock. Rejected output is not counted here. Entered when output is reported; must be positive; drives the inventory increase and unit cost. Compared with the quantity planned on the work order to show how muc…
  - **Received At** (required) — When the output entered stock, which decides the period it is costed and reported in. Defaults to the time of entry; reports and costing group by it. Matches the movement date on the linked inventory movement. Effective output receipt time.
  - **Work Order** (required, a Manufacturing Work Order) — The manufacturing work order that produced this output. Chosen when the receipt is entered; the work order's completed quantity follows from its receipts. Exactly one work order; a receipt cannot exist without its source. Links output back…
  - **Product** (required, a Product) — The product that was produced and received. Normally taken from the work order; read by stock and costing. Exactly one product per receipt. Identifies what stock increases. Identifies output inventory item.
  - **Lot** (a Lot) — At most one lot; empty for products that are not lot tracked. Output production lot. Groups produced quantity for genealogy/quality/recall. Traceability and quality release. May remain quarantined pending required quality evidence.
  - **Quality Inspection** (a Quality Inspection) — At most one inspection; empty when the product needs none. Inspection evidence governing output acceptance/release. Separates production from quality disposition. Release and compliance. Required quality gates constrain availability.
  - **Inventory Movement** (required, a Inventory Movement) — Created with the receipt; read to trace the stock effect. Exactly one movement, which carries the stock increase. Posted stock event implementing output receipt. InventoryMovement remains authoritative inventory ledger. Must reconcile prod…

### Production Record

A recorded quantity of output produced or extracted by an operational process, such as a shift's output at a site. A production record is the operation's own account of what it produced, when and where. It lets management track output against plan, verify it before it is relied on, and reject figures that prove wrong, without yet being an accounting entry. Entered by site or production staff; verified by a supervisor; read by planning, reporting and yield analysis. A record names the product produced and may name the location, mining site or work order that produced it. A record is planned, r…

Readable by every signed-in person.

Fields:
  - **Production Date** (required) — The date and time the output was produced. Entered with the record; used to place output in a shift, day or period. Compared with the planned schedule of the work order or site.
  - **Quantity** (required) — The amount produced, in the product's unit of measure. Must be greater than zero; entered when output is reported and summed in reports. Totals by product, site and period form production figures.
  - **Status** (required, one of the Production Record Status values) — Where the record is in its review. Starts as PLANNED; moves to RECORDED when output is reported, then VERIFIED or REJECTED. Only verified records should feed official output figures. Output is expected but not yet reported. Output has been…
  - **Product** (required, a Product) — The product that was produced. Chosen when the record is entered; used to total output by product. Exactly one product per record. Output is always about one product, so figures can be added up by product.
  - **Location** (a Location) — The location where the output was produced or stored. Chosen when output is attributed to a place. At most one location; empty if unplaced. Lets output be reported by place when no mining site applies.
  - **Work Order** (a Manufacturing Work Order) — The manufacturing work order the output belongs to. Chosen when output comes from a manufacturing job. At most one work order; empty for output outside a job. Ties reported output to the job that is meant to produce it.

### Production Record Status

The values of production record status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Product Lifecycle Lifecycle Status

The values of product lifecycle lifecycle status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Quality Inspection

Represents a quality inspection and its controlled sampling, measurements, result and disposition across inbound receiving and supplier-return workflows. QualityInspection provides the execution context and overall decision; InspectionSample records the actual selected sample; QualityMeasurement records individual factual observations. The inspection does not itself perform inventory or financial changes. Receiving quality, supplier quality, acceptance sampling, returns, quarantine, nonconformance, corrective action, compliance and audit. QualityPlan/QualityPlanCharacteristic define controls;…

Readable by every signed-in person.

Fields:
  - **Inspection Number** (required) — Business-facing inspection reference. Identifies the inspection in quality operations and audit. Quality records, supplier disputes and reporting. Distinct from GoodsReceipt.receiptNumber and SupplierReturn.returnNumber. Provides human-rec…
  - **Inspection Date** (required) — Date and time inspection was performed or initiated. Establishes quality chronology. Audit, release, supplier performance and compliance. May occur after receipt or return authorization and before final disposition. Anchors inspection evid…
  - **Status** (required, one of the Quality Inspection Status values) — Raised and not yet started. Samples are being taken and measured. The goods met every requirement. A final state. The goods did not meet the requirements. A final state. Passed only with conditions, awaiting a decision on release. The insp…
  - **Result** (one of the Quality Inspection Result values) — Every measured characteristic was within its limits. At least one characteristic was outside its limits. Acceptable only if a stated condition is met. The result of the quality inspection is not tested; set it when that is what the busines…
  - **Disposition** (one of the Quality Inspection Disposition values) — Release the goods for use or sale. Accept the goods into stock. Refuse the goods. Hold the goods apart until a decision is made. Send the goods back to the supplier. Correct the goods so they meet the requirement. Repair the goods to a usa…
  - **Notes** — Inspection observations and supporting context. Records qualitative evidence not represented by structured measurements. Quality review, supplier disputes and audit. Complements QualityMeasurement, InspectionSample and Nonconformance; does…
  - **Product** (a Product) — Product being inspected. Identifies material subject to quality evaluation. Quality history, supplier performance and disposition. Supplies item context.
  - **Inspector** (a Party) — Party performing or accountable for inspection. Identifies inspector or quality authority. Accountability, audit and compliance. Provides execution responsibility.

### Quality Inspection Disposition

The values of quality inspection disposition, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Quality Inspection Result

The values of quality inspection result, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Quality Inspection Status

The values of quality inspection status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Routing

Versioned definition of manufacturing process sequence. BillOfMaterial defines what materials are required; Routing defines how the output is produced. MRP, scheduling, costing, shop-floor execution, quality, and traceability. Product is the output; Operations define steps; WorkCenters provide capacity; ManufacturingWorkOrder executes a selected version. Draft → active → suspended/obsolete with versioned replacement. Routing changes revalidate planned/unreleased work; released/completed work retains historical version.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Business routing code. Human-recognizable process identifier. Engineering and production planning. Combined with version identifies controlled process definition.
  - **Routing Version** (required) — Controlled routing revision. Preserves which process definition governed production. Effectivity, audit, and reproducibility. Released work snapshots or references an effective version.
  - **Status** (required, one of the Routing Status values) — Whether the process definition may be used for production. Being defined; not yet usable. Approved for production. Temporarily withdrawn from use. Superseded or no longer used. A final state. Controls eligibility for new production release…
  - **Product** (required, a Product) — Output Product this routing produces. Associates process definition with manufactured item. Planning and production release. Exactly one output Product. Must match work-order output.

Line items — **Operation**: kept inside each Routing and reached by opening it, never on their own. A sequenced step in a manufacturing routing that defines the work, the resource that does it, its standard time and any quality requirements. Production planning breaks a product's manufacture into steps. Each operation says what is done, where and how long it should take, which gives planners thei…

### Routing Status

The values of routing status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Scrap

Governed manufacturing loss/disposition evidence. Scrap explains rejected or lost quantity; it is distinct from accepted ProductionReceipt and from InventoryMovement, which remains the stock ledger. Yield, manufacturing variance, quality, costing, genealogy, inventory and continuous improvement. ManufacturingWorkOrder supplies context; Nonconformance may explain quality cause; Lot/Serial preserve genealogy; InventoryMovement records stock consequence when applicable. Recorded → validated/authorized → inventory/quality reconciled → immutable historical evidence. Scrap updates yield/cost/qualit…

Readable by every signed-in person.

Fields:
  - **Scrap Number** (required) — The number of the scrap record, such as SCR-0412. Operational identifier for production loss. Shop-floor reporting, quality, costing and audit. Distinct from inventory movement reference.
  - **Quantity** (required) — Quantity classified as scrap. Quantifies governed production loss or rejected material. Yield, variance, costing and inventory. Interpreted with Product/UOM/lot/serial context.
  - **Reason Code** (required) — Governed reason for scrap. Classifies why material/output was lost or rejected. Quality analysis, costing and continuous improvement. Should align with controlled reason taxonomy.
  - **Scrapped At** (required) — Effective scrap time. Establishes production-loss chronology. Cost period, genealogy and audit. Must align with related execution evidence.
  - **Work Order** (required, a Manufacturing Work Order) — Each scrap record belongs to one work order, which carries the cost of the loss. Production order under which scrap occurred. Supplies production authorization and planned context. Yield and variance reconciliation. Scrap contributes to co…
  - **Product** (required, a Product) — A scrap record is for one product; scrap of several products is recorded separately. Material or output being scrapped. Identifies the item affected. Inventory, costing, quality and analysis. Must reconcile with work-order input/output con…
  - **Lot** (a Lot) — Lot affected by scrap. Preserves batch genealogy and disposition. Recall, quality and inventory. Required under lot-control policy. Lot quantity/state must reconcile.

### Serial Number

Unit-level identity and custody traceability for serialized products. Product identifies the type, Lot identifies a batch, and SerialNumber identifies one physical unit. Inventory, warehouse, logistics, manufacturing, service, maintenance, warranty, returns, recall, and asset management. SerialNumber travels through InventoryMovement and may be associated with a Lot while preserving unique unit identity. Expected → available/reserved → in transit/installed/consumed/returned/quarantined → scrapped/retired as applicable. Status and custody changes revalidate inventory, reservation, shipment, se…

Readable by every signed-in person.

Fields:
  - **Serial Code** (required) — Business/manufacturer serial identifier. Operational code used to recognize the individual unit. Scanning, receiving, picking, shipment, service, returns, and warranty. Uniqueness is governed for the Product or global namespace.
  - **Status** (required, one of the Serial Number Status values) — Announced but not yet received. In stock and free to use. Set aside for an order or job. On its way between places. Fitted at a customer or on equipment. Used up. A final state. Sent back and awaiting a decision. Held apart pending a decis…
  - **Product** (required, a Product) — Each serial number belongs to one product; the same number on another product is a different unit. Product model represented by the serial. Defines the standardized item type. Validation and master-data context. Every serial movement must…
  - **Material Issue** (a Material Issue) — The MaterialIssue this SerialNumber belongs to.
  - **Production Receipt** (a Production Receipt) — The ProductionReceipt this SerialNumber belongs to.
  - **Lot** (a Lot) — Lot or batch from which this serialized unit originates when applicable. Connects unit identity to batch genealogy. Recall, quality, manufacturing, and provenance. Optional for products not lot-controlled. Serial and lot provenance must re…
  - **Scrap** (a Scrap) — The Scrap this SerialNumber belongs to.

### Serial Number Status

The values of serial number status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Name** (required) — The division's name in English. Shown in lists and on addresses. Does not replace the code as the stable key.
  - **Subdivision Type** — What the registry calls the division in its country: State, Province, Region, Territory and so on. Labelling the field for users of that country. Describes this division only.
  - **Country** (required, a Country) — The country the division belongs to. Chosen first; the divisions offered are those of that country. Every state or province belongs to exactly one country. A city and an address are narrowed by the country before the state.

### Task

A discrete unit of business work performed by a person, organisation, system or workflow participant. Tasks are how work is handed out and tracked, whether a person must act or a system step must run. Their type, status, owner and dates show what is waiting, what is stuck and what is done. Created by people or workflows; picked up by assignees; read by managers and reports. A task may belong to a workflow, an assignee, an organisation and a related document. A task is created, becomes ready, is assigned and worked, and ends completed, cancelled or failed. It may be blocked and resumed. All th…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the task, such as TASK-0042. Used in lists and notifications.
  - **Name** (required) — A short statement of the work. Shown on to-do lists.
  - **Description** — Details of what must be done. Read by the assignee.
  - **Task Type** (required, one of the Task Task Type values) — The kind of work the task is. Chosen when created; decides who or what performs it. Work done by a person. A step run automatically. A person must approve or refuse something. A choice that decides the path. A message to be sent. A script…
  - **Status** (required, one of the Task Status values) — Where the task is. Starts as CREATED; moved as it is worked. Recorded and not yet ready. Ready to be picked up. Given to someone. Being worked. Cannot proceed until something is resolved. Done. A final state. No longer needed. A final stat…
  - **Priority** (required, one of the Task Priority values) — How urgent the task is. Set when created; used to order work. Can wait. Ordinary priority. Do ahead of normal work. Do immediately.
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

### Work Center

Manufacturing capacity resource used by routing and execution. WorkCenter represents where or by which resource an Operation is performed. Manufacturing planning, scheduling, dispatch, costing, maintenance coordination, and analytics. Operation defines work; Routing sequences work; ManufacturingWorkOrder executes it. Active → temporarily unavailable/maintenance → active or retired. Capacity/status changes revalidate affected schedules and unreleased work without rewriting completed execution.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Human-facing work-center code. Operational identifier used in manufacturing plans and execution. Scheduling, dispatching, reporting, and integration. Unique within its manufacturing context.
  - **Name** (required) — Descriptive work-center name. Communicates the resource function to planners and operators. Planning and execution UI/reporting. Complements the stable code.
  - **Capacity Per Hour** — Nominal output or processing capacity per hour. Planning assumption for finite or rough-cut scheduling. Capacity planning and schedule feasibility. Actual execution is captured separately.
  - **Status** (required, one of the Work Center Status values) — Available for scheduling production. Not scheduled for now; can be reactivated. Out of use for servicing. No longer used. A final state. Operational eligibility of the work center. Controls whether new work may be scheduled or executed. Sc…
  - **Location** (a Location) — Physical or organizational location of the resource. Places manufacturing capacity within the operating network. Scheduling, material staging, and reporting. Optional for virtual or pooled resources. Location eligibility constrains executi…

### Work Center Status

The values of work center status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Bill Of Material Status

- **DRAFT** — Being prepared; not yet usable for production.
- **ACTIVE** — Released and in force; planning and production may use it.
- **OBSOLETE** — Replaced or withdrawn; kept for history and for orders already produced from it.

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

### Inventory Movement Movement Type

- **RECEIPT** — Stock arrives, for example from a supplier or production.
- **ISSUE** — Stock leaves, for example to a customer or to production.
- **TRANSFER** — Stock moves from one location to another.
- **ADJUSTMENT** — Quantity is corrected after a count or an investigation.
- **RETURN** — Stock comes back from a customer or is returned to a supplier.
- **RESERVATION** — Stock is set aside for a demand without moving.
- **RELEASE** — A reservation is withdrawn and the stock becomes available again.

### Location Location Type

- **SITE** — A geographic site that may contain several buildings.
- **WAREHOUSE** — A building or area for storing goods.
- **STORE** — A retail outlet.
- **OFFICE** — A place where office work is done.
- **FACTORY** — A place where goods are made.
- **YARD** — An open area for storing or staging equipment or containers.
- **PORT** — A harbour or terminal.
- **DEPOT** — A base for vehicles and equipment.
- **VIRTUAL** — A logical place with no physical presence, such as an online store.
- **OTHER** — Any other kind of place.

### Location Status

- **PLANNED** — Expected but not yet in use.
- **ACTIVE** — In use.
- **INACTIVE** — Temporarily not used.
- **CLOSED** — Closed down.
- **RETIRED** — Removed from use altogether. A final state.

### Lot Status

- **ACTIVE** — In stock and usable under normal rules.
- **HOLD** — Temporarily blocked, for example during an enquiry; it can be released again.
- **QUARANTINED** — Held apart pending a quality decision.
- **RELEASED** — Approved by quality for use.
- **EXPIRED** — Past its expiry date. A final state.
- **REJECTED** — Failed quality checks and not to be used. A final state.
- **CONSUMED** — Fully used up. A final state.
- **CLOSED** — Closed administratively with nothing left to track. A final state.

### Manufacturing Work Order Status

- **PLANNED** — Being planned and not executable.
- **RELEASED** — Authorized for governed execution.
- **IN PROGRESS** — Execution has begun.
- **COMPLETED** — Production execution is materially complete pending closure where applicable.
- **CLOSED** — Reconciled and administratively closed.
- **CANCELLED** — Terminated before remaining execution.

### Organization Organization Type

- **ENTERPRISE** — The top-level body, such as a group or corporation.
- **COMPANY** — A legal company.
- **BUSINESS UNIT** — A business division with its own results.
- **DIVISION** — A major part of the organisation.
- **DEPARTMENT** — A functional unit.
- **BRANCH** — A local office or branch.
- **SUBSIDIARY** — A company controlled by another.
- **OTHER** — Any other organised body.

### Organization Party Type

- **PERSON** — The party represents an individual human being.
- **ORGANIZATION** — The party represents a legal, commercial, governmental, nonprofit, or other organized body.

### Organization Status

- **DRAFT** — Being set up; not yet in use.
- **ACTIVE** — In use.
- **INACTIVE** — Temporarily not in use; can be reactivated.
- **RETIRED** — Closed; kept for history. A final state.

### Party Party Type

- **PERSON** — The party represents an individual human being.
- **ORGANIZATION** — The party represents a legal, commercial, governmental, nonprofit, or other organized body.

### Party Role Role Type

- **CUSTOMER** — Buys from the organisation.
- **SUPPLIER** — Sells to the organisation.
- **EMPLOYEE** — Works for the organisation.
- **PARTNER** — A business partner or reseller.
- **CARRIER** — Transports goods for the organisation.
- **AGENT** — Acts on behalf of the organisation or its customers.
- **CONTRACTOR** — Provides services under a contract.
- **OWNER** — Owns property or a share in the organisation.
- **INVESTOR** — Provides capital.
- **OTHER** — Any other role.

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

- **FEMALE** — Identifies as female.
- **MALE** — Identifies as male.
- **NON BINARY** — Identifies as neither exclusively male nor female.
- **OTHER** — Identifies in another way.
- **UNSPECIFIED** — Not stated or not collected.

### Person Party Type

- **PERSON** — The party represents an individual human being.
- **ORGANIZATION** — The party represents a legal, commercial, governmental, nonprofit, or other organized body.

### Person Status

- **ACTIVE** — The party is available for normal business participation.
- **INACTIVE** — The party is retained but is not normally eligible for new activity.
- **BLOCKED** — Business activity is restricted pending resolution of a business, risk, compliance, or operational condition.
- **RETIRED** — The party relationship is permanently ended for normal operational use while historical references remain valid.

### Production Record Status

- **PLANNED** — Output is expected but not yet reported.
- **RECORDED** — Output has been reported and awaits verification.
- **VERIFIED** — A supervisor has confirmed the figure. A final state.
- **REJECTED** — The figure was found wrong or the run cancelled. A final state.

### Product Lifecycle Lifecycle Status

- **DRAFT** — The product is being set up.
- **ACTIVE** — The product is available for ordinary trading.
- **DISCONTINUED** — The product is being phased out.
- **BLOCKED** — The product is temporarily barred from trading.
- **RETIRED** — The product is permanently removed from the catalogue.

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

### Quality Inspection Disposition

- **RELEASE** — Release the goods for use or sale.
- **ACCEPT** — Accept the goods into stock.
- **REJECT** — Refuse the goods.
- **QUARANTINE** — Hold the goods apart until a decision is made.
- **RETURN TO SUPPLIER** — Send the goods back to the supplier.
- **REWORK** — Correct the goods so they meet the requirement.
- **REPAIR** — Repair the goods to a usable condition.
- **SCRAP** — Destroy or write off the goods.
- **CONDITIONAL RELEASE** — The disposition of the quality inspection is conditional release; set it when that is what the business means for this record.

### Quality Inspection Result

- **PASS** — Every measured characteristic was within its limits.
- **FAIL** — At least one characteristic was outside its limits.
- **CONDITIONAL** — Acceptable only if a stated condition is met.
- **NOT TESTED** — The result of the quality inspection is not tested; set it when that is what the business means for this record.

### Quality Inspection Status

- **OPEN** — Raised and not yet started.
- **IN PROGRESS** — Samples are being taken and measured.
- **PASSED** — The goods met every requirement. A final state.
- **FAILED** — The goods did not meet the requirements. A final state.
- **CONDITIONAL** — Passed only with conditions, awaiting a decision on release.
- **CANCELLED** — The inspection was not carried out. A final state.

### Routing Status

- **DRAFT** — Being defined; not yet usable.
- **ACTIVE** — Approved for production.
- **SUSPENDED** — Temporarily withdrawn from use.
- **OBSOLETE** — Superseded or no longer used. A final state.

### Serial Number Status

- **EXPECTED** — Announced but not yet received.
- **AVAILABLE** — In stock and free to use.
- **RESERVED** — Set aside for an order or job.
- **IN TRANSIT** — On its way between places.
- **INSTALLED** — Fitted at a customer or on equipment.
- **CONSUMED** — Used up. A final state.
- **RETURNED** — Sent back and awaiting a decision.
- **QUARANTINED** — Held apart pending a decision.
- **SCRAPPED** — Destroyed or written off. A final state.
- **RETIRED** — Taken out of service for good. A final state.

### Task Priority

- **LOW** — Can wait.
- **NORMAL** — Ordinary priority.
- **HIGH** — Do ahead of normal work.
- **CRITICAL** — Do immediately.

### Task Status

- **CREATED** — Recorded and not yet ready.
- **READY** — Ready to be picked up.
- **ASSIGNED** — Given to someone.
- **IN PROGRESS** — Being worked.
- **BLOCKED** — Cannot proceed until something is resolved.
- **COMPLETED** — Done. A final state.
- **CANCELLED** — No longer needed. A final state.
- **FAILED** — Could not be done. A final state.

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

### Work Center Status

- **ACTIVE** — Available for scheduling production.
- **INACTIVE** — Not scheduled for now; can be reactivated.
- **MAINTENANCE** — Out of use for servicing.
- **RETIRED** — No longer used. A final state.

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

### Bill Of Material — Bill Of Material Lifecycle

Starts at **DRAFT**.
Final: **OBSOLETE**.

Moves:
- DRAFT → ACTIVE (Activate)
- DRAFT → OBSOLETE (Mark Obsolete)
- ACTIVE → OBSOLETE (Mark Obsolete)

### Routing — Routing Lifecycle

Starts at **DRAFT**.
Final: **OBSOLETE**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → SUSPENDED (Suspend)
- SUSPENDED → ACTIVE (Resume)
- DRAFT → OBSOLETE (Mark Obsolete)
- ACTIVE → OBSOLETE (Mark Obsolete)
- SUSPENDED → OBSOLETE (Mark Obsolete)

### Work Center — Work Center Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → MAINTENANCE (Mark Maintenance)
- MAINTENANCE → ACTIVE (Return To Service)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)
- MAINTENANCE → RETIRED (Retire)

### Manufacturing Work Order — Manufacturing Work Order Lifecycle

Starts at **PLANNED**.
Final: **CLOSED**, **CANCELLED**.

Moves:
- PLANNED → RELEASED (Release)
- RELEASED → IN PROGRESS (Start)
- IN PROGRESS → COMPLETED (Complete)
- COMPLETED → CLOSED (Close)
- PLANNED → CANCELLED (Cancel)
- RELEASED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)

### Lot — Lot Lifecycle

Starts at **ACTIVE**.
Final: **CONSUMED**, **EXPIRED**, **REJECTED**, **CLOSED**.

Moves:
- ACTIVE → HOLD (Hold)
- ACTIVE → QUARANTINED (Quarantine)
- ACTIVE → CONSUMED (Consume)
- ACTIVE → EXPIRED (Expire)
- ACTIVE → CLOSED (Close)
- HOLD → ACTIVE (Release Hold)
- HOLD → QUARANTINED (Quarantine)
- QUARANTINED → RELEASED (Release)
- QUARANTINED → REJECTED (Reject)
- QUARANTINED → HOLD (Hold)
- RELEASED → HOLD (Hold)
- RELEASED → QUARANTINED (Quarantine)
- RELEASED → CONSUMED (Consume)
- RELEASED → EXPIRED (Expire)
- RELEASED → CLOSED (Close)

### Serial Number — Serial Number Lifecycle

Starts at **EXPECTED**.
Final: **CONSUMED**, **SCRAPPED**, **RETIRED**.

Moves:
- EXPECTED → AVAILABLE (Receive)
- AVAILABLE → RESERVED (Reserve)
- RESERVED → AVAILABLE (Release)
- RESERVED → IN TRANSIT (Ship)
- AVAILABLE → IN TRANSIT (Ship)
- IN TRANSIT → INSTALLED (Install)
- IN TRANSIT → AVAILABLE (Receive)
- INSTALLED → RETURNED (Return)
- IN TRANSIT → RETURNED (Return)
- RETURNED → AVAILABLE (Restock)
- RETURNED → QUARANTINED (Quarantine)
- AVAILABLE → QUARANTINED (Quarantine)
- QUARANTINED → AVAILABLE (Release)
- QUARANTINED → SCRAPPED (Scrap)
- AVAILABLE → SCRAPPED (Scrap)
- RETURNED → SCRAPPED (Scrap)
- AVAILABLE → CONSUMED (Consume)
- INSTALLED → RETIRED (Retire)

### Quality Inspection — Quality Inspection Lifecycle

Starts at **OPEN**.
Final: **PASSED**, **FAILED**, **CANCELLED**.

Moves:
- OPEN → IN PROGRESS (Start)
- IN PROGRESS → CONDITIONAL (Mark Conditional)
- CONDITIONAL → PASSED (Mark Passed)
- IN PROGRESS → FAILED (Fail)
- CONDITIONAL → FAILED (Fail)
- OPEN → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)
- CONDITIONAL → CANCELLED (Cancel)

### Production Record — Production Record Lifecycle

Starts at **PLANNED**.
Final: **VERIFIED**, **REJECTED**.

Moves:
- PLANNED → RECORDED (Record)
- RECORDED → VERIFIED (Verify)
- RECORDED → REJECTED (Reject)
- PLANNED → REJECTED (Reject)

## Roles

- **User** — reads 73 of 73 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
