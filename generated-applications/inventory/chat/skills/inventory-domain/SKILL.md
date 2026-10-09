---
name: inventory-domain
description: What the records of Inventory are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Inventory, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Inventory

Inventory and Warehouse, built on the CEDM common foundation.

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

### Dock Dock Type

The values of dock dock type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Handling Unit

Physical logistics identity for grouping and moving inventory. HandlingUnit represents the package/pallet/tote being handled; InventoryMovement remains authoritative for stock quantity/location. Receiving, putaway, replenishment, picking, packing, staging, loading, shipment and tracking. Can occupy InventoryLocation, nest inside another HandlingUnit and join Shipment. Created/received → stored/moved → picked/packed → staged/shipped → unpacked/closed or reused. Location/shipment/nesting changes must reconcile with warehouse execution and cannot silently move underlying stock.

Readable by every signed-in person.

Fields:
  - **Handling Unit Number** (required) — Scannable operational handling-unit reference. Label/barcode identifier used in physical execution. WMS scanning and logistics documents. Distinct from Shipment or inventory movement number.
  - **Type** (required, one of the Handling Unit Type values) — Physical handling-unit classification. Describes packaging/handling form. Capacity, equipment, packing and carrier planning. Does not determine contents by itself. Palletized logistics unit. Carton/box. Reusable tote/bin. Roll cage or simi…
  - **Inventory Location** (a Inventory Location) — Current warehouse location when stored. Provides operational custody position. Putaway, picking and count. Optional while in transit/shipped. Changes must reconcile to execution evidence.
  - **Parent Handling Unit** (a Handling Unit) — Outer handling unit containing this unit. Supports pallet/carton/tote nesting. Packing and logistics hierarchy. At most one parent. Nesting must remain acyclic.

### Handling Unit Type

The values of handling unit type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Inventory Adjustment

An authorised correction of an evidenced stock discrepancy, whose quantity change is carried out by a stock movement. Stock records and shelves drift apart. An adjustment is the controlled way of putting them back in line: it states why, by how much and who approved it, and the actual change is posted as a movement so the stock ledger stays a complete history. Created after a count or investigation shows a discrepancy; approved; posted; read by warehouse management, finance and auditors. An adjustment concerns one Product at one InventoryLocation, may arise from an InventoryCount, and results…

Readable by every signed-in person.

Fields:
  - **Adjustment Number** (required) — The document number of the adjustment. Allocated from a number series; unique; used on approvals and audit reports. Operational/audit identifier. Distinct from movement number.
  - **Quantity Delta** (required) — The change to the recorded quantity: positive to add stock, negative to remove it. Entered or derived from a count; posted as a movement when approved. Positive increases and negative decreases the evidenced stock position. Must be support…
  - **Reason Code** (required) — The reason for the correction, such as counting variance, damage or theft. Chosen from the organisation's list; reports analyse shrinkage by reason. Explains why ledger stock differs from evidenced reality. Must not be used to conceal ordi…
  - **Inventory Movement** (required, a Inventory Movement) — The stock movement that carries out the correction. Created when the adjustment is posted; read to trace the stock change to its authorisation. Exactly one movement: each approved adjustment is posted as a single movement. Keeps the stock…
  - **Inventory Count** (a Inventory Count) — The count that revealed the discrepancy. Linked where the adjustment follows from a physical count. At most one count; some adjustments arise from damage reports or investigations. Provides the evidence for the correction. Connects observe…
  - **Product** (required, a Product) — The product whose recorded quantity is corrected. Set when the adjustment is created. Exactly one product: stock is corrected product by product. Determines which stock balance is changed. Identifies affected inventory item.
  - **Inventory Location** (required, a Inventory Location) — The stock location where the quantity is corrected. Set when the adjustment is created. Exactly one location: the quantity belongs to a specific place. Determines which location's balance is changed. Defines physical/accountable stock cont…

### Inventory Count

Physical inventory observation used for controlled reconciliation. A count states what was observed; it does not rewrite what the ledger says happened. Cycle count, annual stocktake, serial verification and inventory-control audit. Product/location/lot/serial define count scope; InventoryAdjustment resolves approved variance. Planned/performed → reviewed → reconciled → closed; evidence retained. Approved variance may create adjustments; observations themselves never post inventory.

Readable by every signed-in person.

Fields:
  - **Count Number** (required) — The document number of the count. Allocated from a number series; unique; printed on count sheets. Operational identifier for count activity. Distinct from adjustment reference.
  - **Counted Quantity** (required) — The quantity actually found on the shelf. Entered by the counter; compared with the system quantity to find the variance. Evidence of stock reality at count time. Does not itself alter InventoryBalance.
  - **Counted At** (required) — When the count was made. Entered with the count; the system quantity at that time is the comparison. Anchors the count against ledger chronology. Movements around count time require controlled cutoff treatment.
  - **Product** (required, a Product) — The product that was counted. Set when the count is entered. Exactly one product: each count line observes one item. Identifies which balance the count tests. Identifies observed item.
  - **Inventory Location** (required, a Inventory Location) — The location where the count was made. Set when the count is entered. Exactly one location. Identifies which balance the count tests. Defines physical/accountable stock scope.
  - **Lot** (a Lot) — Lot counted where applicable. Preserves batch-specific observation. Traceability and reconciliation. Required under lot-controlled count scope. Variance is lot-specific.

### Inventory Item

Governs how a Product participates in inventory without duplicating Product identity or current stock quantities. InventoryItem is the inventory-control master. Product says what the item is; InventoryBalance says how much is currently present; InventoryMovement explains how quantity changed. Inventory setup, WMS, replenishment, manufacturing, maintenance spares, fulfillment, planning, audit and integration. Links Product and UnitOfMeasure policy to InventoryBalance and InventoryMovement evidence and may be scoped to an Organization. Draft setup becomes active, may be temporarily blocked, and…

Readable by every signed-in person.

Fields:
  - **Item Code** (required) — The stock-keeping code under which the product is managed in inventory. Assigned when the item is set up and unique; used by the warehouse and in replenishment and count documents. Operational code used to identify the stock-control profil…
  - **Status** (required, one of the Inventory Item Status values) — Whether the product may currently be stocked and moved. Set by inventory control; movements are allowed only for ACTIVE items. Being set up; not yet stocked. Available for stocking and movements. Temporarily barred from movements, for exam…
  - **Safety Stock Quantity** — Minimum planning buffer quantity. Target stock retained to absorb uncertainty rather than current on-hand quantity. Replenishment and shortage planning. Interpreted in the stocking UOM.
  - **Reorder Point Quantity** — Quantity threshold at which replenishment should be considered. Planning trigger rather than an inventory event. Replenishment, MRP and exception reporting. Compared with governed available or projected quantity in the stocking UOM.
  - **Allow Negative Inventory** (required) — Whether controlled inventory may temporarily become negative. Explicit exception policy for shortage posting. Inventory validation and exception governance. Does not remove reconciliation and attributable movement requirements.
  - **Product** (required, a Product) — The product this inventory profile governs. Set when the item is created. Exactly one product: the profile says how that product is stocked. Separates how a product is described from how it is stocked. Product defines material identity whi…
  - **Stocking Uom** (required, a Unit Of Measure) — The unit of measure in which the product is counted and stocked. Set when the item is created; all quantities for the item are expressed in it. Exactly one stocking unit, so that every quantity is unambiguous. Other units are converted to…
  - **Organization** (a Organization) — Organization for which this inventory profile applies. Allows organization-specific control of the same Product. Multi-company inventory policy and reporting. Optional when policy is enterprise-wide. Organization changes affect future oper…

### Inventory Item Status

The values of inventory item status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Inventory Location Location Type

The values of inventory location location type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Inventory Location Status

The values of inventory location status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Inventory Item** (a Inventory Item) — Inventory-control profile under which this movement was posted. Preserves the stock-policy context used to authorize the event. Policy validation, audit, reconciliation and integration. Optional for historical or transitional events; gover…
  - **Inventory Balance** (a Inventory Balance) — The InventoryBalance this InventoryMovement belongs to.
  - **Product** (required, a Product) — Product whose inventory state is affected. Connects event to product master, units and policies. Exactly one product is affected. Identifies stock item.
  - **Source Location** (a Inventory Location) — Location from which inventory is removed or transferred. Transfer, issue and return-to-supplier reconciliation. Optional for inbound movements from outside network. Required when stock leaves an internal location.
  - **Party** (a Party) — Party associated with inventory event when ownership or custody matters. Supplier receipts, customer returns, consignment and audit. Optional for internal movements. Connects event to external party.
  - **Lot** (a Lot) — Lot identity carried by this movement when the Product is lot-controlled. Preserves batch genealogy through every stock event. Traceability, expiry, quality, recall, and reconciliation. Optional for products not requiring lot control. Lot…
  - **Inventory Transfer** (a Inventory Transfer) — Transfer authorization causing this relocation event. Explains source/target relocation purpose. Transfer reconciliation and audit. Optional outside controlled transfer. Product, locations, quantity, lot and serial must reconcile.

### Inventory Movement Movement Type

The values of inventory movement movement type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Inventory Reservation

An authorised commitment of available stock to a demand, which does not change the physical quantity on hand. Promising stock to a customer or job must not depend on luck. A reservation sets the quantity aside so the same units are not promised twice, while the stock stays where it is until it is picked. Created when an order or job is committed; consumed when the stock is issued; released or expired when the demand goes away; read by order promising and picking. A reservation is for a Product at an InventoryLocation, held against an InventoryBalance, and usually serves a SalesOrderLine. A re…

Readable by every signed-in person.

Fields:
  - **Quantity Reserved** (required) — The quantity that is set aside. Set when the reservation is made; it reduces the available quantity of the balance.
  - **Quantity Consumed** (required) — The quantity of the reservation that has been issued. Increases as picks are confirmed; never more than the quantity reserved.
  - **Quantity Released** (required) — The quantity of the reservation that has been given back to availability. Increases when part of the demand is cancelled or the reservation expires.
  - **Status** (required, one of the Inventory Reservation Status values) — How much of the reservation is still holding stock. Moved by order management and picking. Requested but not yet holding stock. Holding stock for its demand. Part of the stock has been issued; the rest is still held. The remaining stock ha…
  - **Priority** — The reservation's priority when stock is short. Lower numbers are served first; defaults to 100.
  - **Expires At** — When the reservation lapses if it has not been used. Set by the order promise; expired reservations return stock to availability.
  - **Product** (required, a Product) — Exactly one product: a reservation commits stock of a single item. The product that is reserved. Set when the reservation is made. Identifies the stock being committed.
  - **Inventory Location** (required, a Inventory Location) — The location from which stock is reserved. Chosen by the allocation process. Exactly one location, since stock is committed at a specific place. Tells pickers where to go.
  - **Inventory Balance** (required, a Inventory Balance) — The stock balance from which the reservation draws. Set when the reservation is made; its reserved quantity is increased. Exactly one balance: the reservation commits a particular pool of stock. Keeps available quantity correct.

### Inventory Reservation Status

The values of inventory reservation status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Inventory Transfer

An authorisation to move stock from one location to another, with the actual stock change carried out by movements. Moving stock between places is routine but risky; goods can go missing in transit. A transfer states what should move, from where to where, and its progress, so both ends can reconcile. Planned by inventory control or replenishment; released to the warehouse; completed when received; read by warehouse staff and planners. A transfer is for a Product between two InventoryLocations, may name a Lot or SerialNumbers and is carried out by InventoryMovements. A transfer is planned, rel…

Readable by every signed-in person.

Fields:
  - **Transfer Number** (required) — The document number of the transfer. Allocated from a number series; unique; printed on the transfer order. Operational identifier for relocation work. Distinct from movement numbers.
  - **Requested Quantity** (required) — The quantity that is to be moved. Set when planned; the movements carry out the quantity actually moved. Defines transfer demand. Interpreted with Product and traceability identities.
  - **Status** (required, one of the Inventory Transfer Status values) — How far the transfer has progressed. Moved by the warehouse. Requested and not yet released. Released to the warehouse for execution. Goods are moving. Received at the target. A final state. Withdrawn. A final state. Controls warehouse exe…
  - **Product** (required, a Product) — The product that is moved. Set when planned. Exactly one product per transfer. Identifies the stock to move. Defines inventory item affected.
  - **Source Location** (required, a Inventory Location) — Exactly one source: a transfer takes stock from a single location, and a multi-source move is several transfers. The location the stock leaves. Set when planned. Determines where stock is picked. Defines transfer origin.
  - **Lot** (a Lot) — The lot being moved, if the product is lot-controlled. Chosen when the lot matters. At most one lot. Keeps traceability across the move. Preserves batch identity across relocation.

### Inventory Transfer Status

The values of inventory transfer status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Warehouse** (a Warehouse) — The Warehouse this Location belongs to.

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

### Packing

A warehouse task that groups picked goods into handling units and prepares them for shipment, keeping line, lot, serial, quantity and package traceability. Between picking and shipping, goods are put into boxes, cartons or pallets. Packing records which goods went into which package, so the customer's shipment is complete and any item can be traced to its package. Created when picked goods are ready to be packed; completed when packages are closed; read by shipping and customer service. Packing follows a Picking, fills a HandlingUnit and prepares a Shipment (and its lines). Packing is planned…

Readable by every signed-in person.

Fields:
  - **Packed Quantity** (required) — The quantity of goods put into the package. Entered or scanned as goods are packed; compared with the picked quantity. Measures goods prepared for transport. Must not exceed eligible picked quantity.
  - **Status** (required, one of the Packing Status values) — Where the packing task stands. Updated by packers. Created, not yet started. Packers are filling packages. Finished and ready to ship. Called off. A final state. Held because something is wrong, such as a shortage or damage. Controls packa…
  - **Picking** (a Picking) — The pick that supplied the goods. Linked when packing follows a pick. At most one picking. Confirms that what is packed matches what was picked. Preserves pick-to-pack provenance.
  - **Handling Unit** (required, a Handling Unit) — The package, carton or pallet that the goods go into. Chosen when packing starts. Exactly one handling unit: each packing task fills one package. Gives the package contents and its identity. Establishes physical logistics identity.

### Packing Status

The values of packing status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Picking

Warehouse inventory-selection task for authorized demand. Picking selects/handles committed stock; inventory and fulfillment ledgers remain authoritative separately. Sales fulfillment, production staging, transfer and service demand. Reservation supplies commitment; InventoryLocation supplies source; ShipmentLine may supply outbound demand. Planned → released → in progress → picked/short, cancelled or exception.

Readable by every signed-in person.

Fields:
  - **Quantity** (required) — The quantity to be picked. Set from the reservation or order line; the pick is confirmed against it. Defines execution demand. Must reconcile with reservation and inventory events.
  - **Status** (required, one of the Picking Status values) — Where the pick task stands. Updated by warehouse staff and handheld devices. Created, not yet released to the floor. Released to pickers. A picker is collecting the goods. All goods collected. A final state. Less than the requested quantit…
  - **Reservation** (a Inventory Reservation) — Inventory commitment supplying pick demand. Prevents picking unallocated demand where reservation is required. Fulfillment. Optional under non-reservation workflows. Consumption must reconcile.
  - **Source Location** (required, a Inventory Location) — Exactly one source location: each pick collects from a single storage position. Storage position picked from. Defines source custody. WMS execution. Must hold eligible stock.
  - **Handling Unit** (a Handling Unit) — At most one handling unit, the pallet or tote the goods are picked into. Handling unit used for picked stock. Supports tote/carton/pallet execution. Scanning and packing. Custody must reconcile.
  - **Wave** (a Wave) — The Wave this Picking belongs to.

### Picking Status

The values of picking status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

Line items — **Packaging**: kept inside each Product and reached by opening it, never on their own. A packaging configuration that defines how a product or variant is contained, counted and handled for buying, storing, selling and shipping. Goods are traded in packs, not just units: a carton of twelve, a pallet of forty cartons. The packaging record states these configurations so orders, stock an…

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

### Putaway

Directed inbound/staging-to-storage warehouse task. Putaway says where stock should be stored; InventoryTransfer/InventoryMovement prove physical relocation. Receiving, cross-dock exceptions, replenishment and storage optimization. InventoryLocation/Zone define eligibility; HandlingUnit supports physical execution. Planned → released → in progress → completed, cancelled or exception.

Readable by every signed-in person.

Fields:
  - **Quantity** (required) — Quantity directed for storage. Defines task execution quantity. Putaway confirmation and variance. Must reconcile with transfer/movement.
  - **Status** (required, one of the Putaway Status values) — Proposed. Released to the warehouse floor for a worker to carry out. Being executed. Confirmed and reconciled. Withdrawn before the stock was moved. A final state. Could not be completed as planned, for example the target was full; needs a…
  - **Product** (required, a Product) — Each putaway moves one product; a mixed pallet is split into one putaway per product. Product being stored. Identifies handled inventory. Location eligibility. Must match transfer.
  - **Source Location** (required, a Inventory Location) — The stock comes from a single source location, such as the receiving dock. Receiving/staging origin. Current controlled position. Execution. Must contain eligible stock.
  - **Handling Unit** (a Handling Unit) — Physical pallet/carton/tote moved as unit. Supports scan-based execution. WMS mobility. Optional for loose stock. Handling-unit location must reconcile.
  - **Inventory Transfer** (required, a Inventory Transfer) — Read to reconcile the putaway with the stock movement that physically relocated the goods. Inventory relocation authorization/execution associated with putaway. Separates warehouse task from stock ledger. Exactly one governed transfer. Com…
  - **Wave** (a Wave) — The Wave this Putaway belongs to.

### Putaway Status

The values of putaway status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Serial Number

Unit-level identity and custody traceability for serialized products. Product identifies the type, Lot identifies a batch, and SerialNumber identifies one physical unit. Inventory, warehouse, logistics, manufacturing, service, maintenance, warranty, returns, recall, and asset management. SerialNumber travels through InventoryMovement and may be associated with a Lot while preserving unique unit identity. Expected → available/reserved → in transit/installed/consumed/returned/quarantined → scrapped/retired as applicable. Status and custody changes revalidate inventory, reservation, shipment, se…

Readable by every signed-in person.

Fields:
  - **Serial Code** (required) — Business/manufacturer serial identifier. Operational code used to recognize the individual unit. Scanning, receiving, picking, shipment, service, returns, and warranty. Uniqueness is governed for the Product or global namespace.
  - **Status** (required, one of the Serial Number Status values) — Announced but not yet received. In stock and free to use. Set aside for an order or job. On its way between places. Fitted at a customer or on equipment. Used up. A final state. Sent back and awaiting a decision. Held apart pending a decis…
  - **Inventory Transfer** (a Inventory Transfer) — The InventoryTransfer this SerialNumber belongs to.
  - **Inventory Count** (a Inventory Count) — The InventoryCount this SerialNumber belongs to.
  - **Product** (required, a Product) — Each serial number belongs to one product; the same number on another product is a different unit. Product model represented by the serial. Defines the standardized item type. Validation and master-data context. Every serial movement must…
  - **Lot** (a Lot) — Lot or batch from which this serialized unit originates when applicable. Connects unit identity to batch genealogy. Recall, quality, manufacturing, and provenance. Optional for products not lot-controlled. Serial and lot provenance must re…

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

### Warehouse

Represents a managed facility where inventory is physically or operationally received, stored, controlled, fulfilled, and dispatched. Warehouse is more than an address: it is an operational capability with storage structure, inventory processes, capacity constraints, and an operating lifecycle. It provides the facility context in which InventoryLocation and InventoryMovement events occur. Used by procurement, receiving, inventory control, warehouse management, order fulfillment, shipping, transportation, capacity planning, and stock reporting. Warehouse specializes Location for inventory oper…

Readable by every signed-in person.

Fields:
  - **Location** (required, a Location) — Identifies the Location record that supplies the address and geographic context for the warehouse. Used for routing, delivery, tax, service coverage, mapping, and operational location management. Warehouse specializes Location; this refere…
  - **Warehouse Code** (required) — The organization-assigned business code used by warehouse personnel and systems to identify the facility. Used in inventory documents, receiving, picking, shipping, integrations, labels, reports, and warehouse routing. It is a human/system…
  - **Warehouse Type** (required, one of the Warehouse Warehouse Type values) — Classifies the operating model and handling characteristics of the warehouse. Drives storage rules, temperature controls, customs controls, fulfillment workflows, capacity planning, and reporting. Type describes operational capability and…
  - **Capacity** — The nominal storage or handling capacity of the warehouse under a defined capacity measurement convention. Used for capacity planning, utilization reporting, allocation, expansion analysis, and operational constraints. Capacity must be int…
  - **Status** (required, one of the Warehouse Status values) — The operating lifecycle state of the warehouse and whether it can participate in normal inventory processes. Controls receiving, storage, picking, shipping, allocation, and operational reporting. Warehouse status describes facility availab…
  - **Code** (required) — The code of the place in the organisation's site list, such as NL-RTM-DC1. Unique; assigned by the administrator and used in integrations and labels.
  - **Name** (required) — The name people use for the place. Shown in lists, maps and documents.
  - **Location Type** (required, one of the Warehouse Location Type values) — What kind of place it is. Chosen at creation; decides which processes can use the location. A geographic site that may contain several buildings. A building or area for storing goods. A retail outlet. A place where office work is done. A p…
  - **Address** (a Address) — The postal address of the location. Chosen from the address list; used for deliveries, mapping and tax.
  - **Parent Location** (a Location) — The place that contains this one, such as the site that holds a warehouse. Set to build the hierarchy; a top-level place has none.
  - **Organization** (a Organization) — The organisation that operates the place. Set where operation is clear. At most one operating organisation. Determines responsibility and reporting.

Line items — **Inventory Location**: kept inside each Warehouse and reached by opening it, never on their own. Granular inventory position whose lifecycle controls future execution while preserving historical inventory state. A location is operational infrastructure, not merely an address. Changing its status can affect receiving, put-away, reservations, picking, transfers, replenishment and shipment stagin…

Line items — **Warehouse Zone**: kept inside each Warehouse and reached by opening it, never on their own. Operational grouping between Warehouse and InventoryLocation. Warehouse is the facility, WarehouseZone is the process/storage area, InventoryLocation is the stock-control position. Receiving, putaway, reserve/pick storage, quarantine, returns, staging and shipping. Zone rules guide InventoryTransfe…

Line items — **Dock**: kept inside each Warehouse and reached by opening it, never on their own. A warehouse door, bay or loading position used for receiving, shipping, transfer and staging of goods. Trucks queue at docks, and a warehouse is only as fast as its docks. Each dock is a resource that is scheduled, assigned to a purpose and tied to the area where goods are staged. Defined by wareho…

### Warehouse Location Type

The values of warehouse location type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Warehouse Status

The values of warehouse status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Warehouse Warehouse Type

The values of warehouse warehouse type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Warehouse Zone Zone Type

The values of warehouse zone zone type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Wave

Warehouse work-release grouping for coordinated execution. Wave organizes tasks; it does not itself move inventory or fulfill orders. Labor planning, batch/zone picking, putaway and shipping-cutoff execution. Warehouse supplies facility; Picking and Putaway supply executable tasks. Planned to released to in progress to completed or cancelled.

Readable by every signed-in person.

Fields:
  - **Wave Number** (required) — The number of the wave, such as WV-2026-0412. Operational identifier for grouped work. Warehouse planning and reporting. Distinct from task and shipment identifiers.
  - **Status** (required, one of the Wave Status values) — Wave orchestration state. Controls grouped task release and closure. WMS execution. Wave completion cannot substitute for task or inventory evidence. Work being grouped. Tasks authorized. Tasks executing. Included work reconciled. Remainin…
  - **Warehouse** (required, a Warehouse) — Each wave is run in one warehouse. Warehouse executing wave. Defines operating facility. Labor/task orchestration. Included tasks must be compatible with warehouse.

### Wave Status

The values of wave status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Dock Dock Type

- **INBOUND** — Receiving goods from suppliers or transfers.
- **OUTBOUND** — Shipping goods to customers or other sites.
- **BIDIRECTIONAL** — Used for both receiving and shipping, as needed.
- **CROSS DOCK** — Goods move straight from inbound to outbound without being stored.

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

### Handling Unit Type

- **PALLET** — Palletized logistics unit.
- **CARTON** — Carton/box.
- **TOTE** — Reusable tote/bin.
- **CAGE** — Roll cage or similar unit.
- **DRUM** — Drum/container.
- **PACKAGE** — General package.
- **OTHER** — Governed other type.

### Inventory Item Status

- **DRAFT** — Being set up; not yet stocked.
- **ACTIVE** — Available for stocking and movements.
- **BLOCKED** — Temporarily barred from movements, for example pending a quality issue; it can be unblocked.
- **DISCONTINUED** — No longer stocked; the item is kept for history. A final state.

### Inventory Location Location Type

- **RECEIVING** — Where goods wait after arrival, before putaway.
- **BIN** — A small storage compartment.
- **SHELF** — A shelf position.
- **RACK** — A pallet rack position.
- **FLOOR** — A position on the floor, such as block stacking.
- **PICK** — A forward position from which orders are picked.
- **STAGING** — Where orders are gathered before loading.
- **QUARANTINE** — Where stock is held apart pending a quality decision.
- **YARD SLOT** — A slot in the outside yard.
- **OTHER** — Any other kind of position.

### Inventory Location Status

- **ACTIVE** — Open for receiving, storing and picking.
- **BLOCKED** — Temporarily barred from movements, for example for a count or a quality hold; it can be unblocked.
- **INACTIVE** — Not in use; no stock should be placed there, though it can be reactivated.

### Inventory Movement Movement Type

- **RECEIPT** — Stock arrives, for example from a supplier or production.
- **ISSUE** — Stock leaves, for example to a customer or to production.
- **TRANSFER** — Stock moves from one location to another.
- **ADJUSTMENT** — Quantity is corrected after a count or an investigation.
- **RETURN** — Stock comes back from a customer or is returned to a supplier.
- **RESERVATION** — Stock is set aside for a demand without moving.
- **RELEASE** — A reservation is withdrawn and the stock becomes available again.

### Inventory Reservation Status

- **PENDING** — Requested but not yet holding stock.
- **ACTIVE** — Holding stock for its demand.
- **PARTIALLY CONSUMED** — Part of the stock has been issued; the rest is still held.
- **RELEASED** — The remaining stock has been given back to availability. A final state.
- **CONSUMED** — All the reserved stock has been issued. A final state.
- **CANCELLED** — Withdrawn before it held stock. A final state.
- **EXPIRED** — Lapsed because the demand was not fulfilled in time. A final state.

### Inventory Transfer Status

- **PLANNED** — Requested and not yet released.
- **RELEASED** — Released to the warehouse for execution.
- **IN PROGRESS** — Goods are moving.
- **COMPLETED** — Received at the target. A final state.
- **CANCELLED** — Withdrawn. A final state.

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

### Packing Status

- **PLANNED** — Created, not yet started.
- **IN PROGRESS** — Packers are filling packages.
- **PACKED** — Finished and ready to ship.
- **CANCELLED** — Called off. A final state.
- **EXCEPTION** — Held because something is wrong, such as a shortage or damage.

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

### Picking Status

- **PLANNED** — Created, not yet released to the floor.
- **RELEASED** — Released to pickers.
- **IN PROGRESS** — A picker is collecting the goods.
- **PICKED** — All goods collected. A final state.
- **SHORT** — Less than the requested quantity was found; the pick can be retried after replenishment.
- **CANCELLED** — Called off. A final state.
- **EXCEPTION** — Held because of a problem such as damage or a blocked location.

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

### Putaway Status

- **PLANNED** — Proposed.
- **RELEASED** — Released to the warehouse floor for a worker to carry out.
- **IN PROGRESS** — Being executed.
- **COMPLETED** — Confirmed and reconciled.
- **CANCELLED** — Withdrawn before the stock was moved. A final state.
- **EXCEPTION** — Could not be completed as planned, for example the target was full; needs a decision.

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

### Warehouse Location Type

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

### Warehouse Status

- **PLANNED** — The facility is being prepared and is not yet available for normal warehouse operations.
- **ACTIVE** — The facility is operational and may accept the business processes allowed by its capabilities.
- **SUSPENDED** — Operations are temporarily restricted, for example because of maintenance, safety, regulatory, staffing, or operational conditions.
- **CLOSED** — The warehouse has ceased normal operations and should not receive new inventory transactions except controlled closure activities.

### Warehouse Warehouse Type

- **GENERAL** — A warehouse supporting ordinary storage and handling requirements without a specialized operating classification.
- **COLD STORAGE** — A facility or controlled area designed to maintain inventory within specified low-temperature conditions.
- **BONDED** — A facility operating under customs or bonded-storage controls where goods may remain subject to customs restrictions.
- **DISTRIBUTION** — A facility optimized for inbound receipt, order fulfillment, consolidation, cross-docking, and outbound distribution.
- **RETAIL** — A warehouse or backroom operation primarily supporting retail-store or direct retail fulfillment.
- **OTHER** — A warehouse whose operating model is not adequately represented by the standard classifications.

### Warehouse Zone Zone Type

- **RECEIVING** — Inbound receiving area.
- **RESERVE** — Bulk/reserve storage.
- **PICKING** — Forward picking area.
- **STAGING** — Temporary process staging.
- **SHIPPING** — Outbound dispatch area.
- **QUARANTINE** — Restricted inventory pending disposition.
- **RETURNS** — Reverse-logistics processing.
- **COLD STORAGE** — Temperature-controlled storage.
- **HAZARDOUS** — Controlled hazardous-material area.
- **GENERAL** — General-purpose storage/handling.

### Wave Status

- **PLANNED** — Work being grouped.
- **RELEASED** — Tasks authorized.
- **IN PROGRESS** — Tasks executing.
- **COMPLETED** — Included work reconciled.
- **CANCELLED** — Remaining work terminated.

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

### Inventory Item — Inventory Item Lifecycle

Starts at **DRAFT**.
Final: **DISCONTINUED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → BLOCKED (Block)
- BLOCKED → ACTIVE (Unblock)
- DRAFT → DISCONTINUED (Discontinue)
- ACTIVE → DISCONTINUED (Discontinue)
- BLOCKED → DISCONTINUED (Discontinue)

### Inventory Reservation — Inventory Reservation Lifecycle

Starts at **PENDING**.
Final: **RELEASED**, **CONSUMED**, **CANCELLED**, **EXPIRED**.

Moves:
- PENDING → ACTIVE (Activate)
- PENDING → CANCELLED (Cancel)
- PENDING → EXPIRED (Expire)
- ACTIVE → PARTIALLY CONSUMED (Consume Part)
- ACTIVE → CONSUMED (Consume)
- PARTIALLY CONSUMED → CONSUMED (Consume)
- ACTIVE → RELEASED (Release)
- PARTIALLY CONSUMED → RELEASED (Release)
- ACTIVE → CANCELLED (Cancel)
- ACTIVE → EXPIRED (Expire)

### Inventory Transfer — Inventory Transfer Lifecycle

Starts at **PLANNED**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- PLANNED → RELEASED (Release)
- RELEASED → IN PROGRESS (Start)
- IN PROGRESS → COMPLETED (Complete)
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

### Inventory Location — Inventory Location Lifecycle

Starts at **ACTIVE**.

Moves:
- ACTIVE → BLOCKED (Block)
- BLOCKED → ACTIVE (Unblock)
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)

### Warehouse — Warehouse Lifecycle

Starts at **PLANNED**.
Final: **CLOSED**.

Moves:
- PLANNED → ACTIVE (Activate)
- ACTIVE → CLOSED (Close)
- ACTIVE → SUSPENDED (Suspend)
- SUSPENDED → ACTIVE (Resume)

### Putaway — Putaway Lifecycle

Starts at **PLANNED**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- PLANNED → RELEASED (Release)
- RELEASED → IN PROGRESS (Start)
- IN PROGRESS → COMPLETED (Complete)
- RELEASED → EXCEPTION (Mark Exception)
- EXCEPTION → RELEASED (Resolve Exception)
- IN PROGRESS → EXCEPTION (Mark Exception)
- EXCEPTION → IN PROGRESS (Resolve Exception)
- PLANNED → CANCELLED (Cancel)
- RELEASED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)
- EXCEPTION → CANCELLED (Cancel)

### Picking — Picking Lifecycle

Starts at **PLANNED**.
Final: **PICKED**, **CANCELLED**.

Moves:
- PLANNED → RELEASED (Release)
- RELEASED → IN PROGRESS (Start)
- IN PROGRESS → PICKED (Complete)
- IN PROGRESS → SHORT (Short Pick)
- SHORT → RELEASED (Retry)
- RELEASED → EXCEPTION (Raise Exception)
- IN PROGRESS → EXCEPTION (Raise Exception)
- EXCEPTION → RELEASED (Resolve)
- PLANNED → CANCELLED (Cancel)
- RELEASED → CANCELLED (Cancel)
- EXCEPTION → CANCELLED (Cancel)
- SHORT → CANCELLED (Cancel)

### Packing — Packing Lifecycle

Starts at **PLANNED**.
Final: **CANCELLED**.

Moves:
- PLANNED → IN PROGRESS (Start)
- IN PROGRESS → PACKED (Mark Packed)
- IN PROGRESS → EXCEPTION (Mark Exception)
- EXCEPTION → IN PROGRESS (Resolve Exception)
- PACKED → EXCEPTION (Mark Exception)
- EXCEPTION → PACKED (Resolve Exception)
- PLANNED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)
- PACKED → CANCELLED (Cancel)
- EXCEPTION → CANCELLED (Cancel)

### Wave — Wave Lifecycle

Starts at **PLANNED**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- PLANNED → RELEASED (Release)
- RELEASED → IN PROGRESS (Start)
- IN PROGRESS → COMPLETED (Complete)
- PLANNED → CANCELLED (Cancel)
- RELEASED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)

## Roles

- **User** — reads 83 of 83 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
