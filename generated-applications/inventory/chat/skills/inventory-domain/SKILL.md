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

### Handling Unit

Physical logistics identity for grouping and moving inventory. HandlingUnit represents the package/pallet/tote being handled; InventoryMovement remains authoritative for stock quantity/location. Receiving, putaway, replenishment, picking, packing, staging, loading, shipment and tracking. Can occupy InventoryLocation, nest inside another HandlingUnit and join Shipment. Created/received → stored/moved → picked/packed → staged/shipped → unpacked/closed or reused. Location/shipment/nesting changes must reconcile with warehouse execution and cannot silently move underlying stock.

Readable by every signed-in person.

Fields:
  - **Handling Unit Number** (required) — Scannable operational handling-unit reference. Label/barcode identifier used in physical execution. WMS scanning and logistics documents. Distinct from Shipment or inventory movement number. Required.
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

Controlled discrepancy correction with explicit evidence and stock posting. InventoryAdjustment authorizes why stock should be corrected; InventoryMovement remains the physical ledger. Cycle counts, reconciliation, damage/loss corrections and audited inventory control. Usually follows InventoryCount but may use other authorized evidence. Proposed → approved → posted → immutable historical evidence. Posting updates balances and variance analytics; corrections compensate rather than rewrite.

Readable by every signed-in person.

Fields:
  - **Adjustment Number** (required) — Human-facing adjustment reference. Operational/audit identifier. Approval, investigation and reconciliation. Distinct from movement number. Required.
  - **Quantity Delta** (required) — Signed quantity correction. Positive increases and negative decreases the evidenced stock position. Inventory reconciliation. Must be supported by reason and evidence. Required.
  - **Reason Code** (required) — Controlled reason for correction. Explains why ledger stock differs from evidenced reality. Approval, root-cause and audit. Must not be used to conceal ordinary receipts/issues. Required.
  - **Inventory Movement** (required, a Inventory Movement) — Authoritative stock-ledger correction. Implements approved quantity delta. Balance reconciliation and audit. Exactly one posting for executed adjustment. Must be idempotent and match product/location/quantity.
  - **Inventory Count** (a Inventory Count) — Count evidence causing correction. Connects observed discrepancy to adjustment. Cycle-count audit. Optional for non-count adjustments. Delta must reconcile with approved count variance.
  - **Product** (required, a Product) — Product being corrected. Identifies affected inventory item. Reconciliation. Exactly one Product. Must match movement.
  - **Inventory Location** (required, a Inventory Location) — Location whose stock is corrected. Defines physical/accountable stock context. Count and reconciliation. Exactly one location. Must match movement.

### Inventory Count

Physical inventory observation used for controlled reconciliation. A count states what was observed; it does not rewrite what the ledger says happened. Cycle count, annual stocktake, serial verification and inventory-control audit. Product/location/lot/serial define count scope; InventoryAdjustment resolves approved variance. Planned/performed → reviewed → reconciled → closed; evidence retained. Approved variance may create adjustments; observations themselves never post inventory.

Readable by every signed-in person.

Fields:
  - **Count Number** (required) — Human-facing count reference. Operational identifier for count activity. Warehouse execution and audit. Distinct from adjustment reference. Required.
  - **Counted Quantity** (required) — Quantity physically/systematically observed. Evidence of stock reality at count time. Variance calculation and approval. Does not itself alter InventoryBalance. Required.
  - **Counted At** (required) — Effective observation time. Anchors the count against ledger chronology. Cutoff and reconciliation. Movements around count time require controlled cutoff treatment. Required.
  - **Product** (required, a Product) — Product counted. Identifies observed item. Reconciliation. Exactly one Product. Must match stock context.
  - **Inventory Location** (required, a Inventory Location) — Location counted. Defines physical/accountable stock scope. Cycle counting and stocktake. Exactly one location. Ledger cutoff uses this location.
  - **Lot** (a Lot) — Lot counted where applicable. Preserves batch-specific observation. Traceability and reconciliation. Required under lot-controlled count scope. Variance is lot-specific.

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
  - **Movement Number** (required) — Human-facing inventory movement reference. Used by warehouse operators, inventory controllers, auditors and integrations. Distinct from Product and source transaction numbers. Traces stock change from execution through reconciliation. Requ…
  - **Movement Type** (required, one of the Inventory Movement Movement Type values) — Identifies inventory operation and state transition. Determines how on-hand, reserved, available and location balances change. Movement type describes inventory effect; relatedTransaction and supplierReturnLine explain business reason wher…
  - **Quantity** (required) — Quantity affected by the inventory event. Drives balance changes and allocation calculations. Interpreted with Product, UOM, movementType and source/target locations. Changes physical quantity for receipt/issue/transfer/return and commitme…
  - **Movement Date** (required) — Timestamp at which inventory event is recognized. Stock history, period-end balances, reporting, audit and reconciliation. Distinct from source order date and record creation timestamp. Establishes effective chronology. Required.
  - **Reason** — Business explanation for movement. Audit, investigation, approval and reporting. Supplements movementType and source relationships. Especially important for adjustments, returns and exceptions. Optional when source context fully explains e…
  - **Unit Of Measure** (a Unit Of Measure) — The UnitOfMeasure this InventoryMovement belongs to.
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

Controls the commitment of available inventory to demand while separating reservation state from physical stock movement. Reservation means stock is committed, not physically moved. Physical movement occurs only when an authorized fulfillment or inventory movement workflow posts it. Sales fulfillment, maintenance demand, allocation, picking, replenishment, production and inventory control. Product identifies stock, InventoryLocation identifies where it is reserved, InventoryBalance supplies available state, and SalesOrderLine supplies one possible demand source. Demand approved → availability…

Readable by every signed-in person.

Fields:
  - **Quantity Reserved** (required) — The quantity reserved of the inventory reservation: a number the business records on it. Entered or maintained when a inventory reservation is created or changed; shown on its form and available to search and reports. Read together with th…
  - **Quantity Consumed** (required) — The quantity consumed of the inventory reservation: a number the business records on it. Entered or maintained when a inventory reservation is created or changed; shown on its form and available to search and reports. Read together with th…
  - **Quantity Released** (required) — The quantity released of the inventory reservation: a number the business records on it. Entered or maintained when a inventory reservation is created or changed; shown on its form and available to search and reports. Read together with th…
  - **Status** (required, one of the Inventory Reservation Status values) — The status of the inventory reservation: a value the business records on it. Entered or maintained when a inventory reservation is created or changed; shown on its form and available to search and reports. Read together with the inventory…
  - **Priority** — The priority of the inventory reservation: a whole number the business records on it. Entered or maintained when a inventory reservation is created or changed; shown on its form and available to search and reports. Read together with the i…
  - **Expires At** — The expires at of the inventory reservation: a point in time the business records on it. Entered or maintained when a inventory reservation is created or changed; shown on its form and available to search and reports. Read together with th…
  - **Product** (required, a Product) — Links a inventory reservation to product, the product it relates to. Chosen from the existing product records when the inventory reservation is created or edited. A inventory reservation has exactly one product in this role. Lets the inven…
  - **Inventory Location** (required, a Inventory Location) — Links a inventory reservation to inventory location, the inventory location it relates to. Chosen from the existing inventory location records when the inventory reservation is created or edited. A inventory reservation has exactly one inv…
  - **Inventory Balance** (required, a Inventory Balance) — Links a inventory reservation to inventory balance, the inventory balance it relates to. Chosen from the existing inventory balance records when the inventory reservation is created or edited. A inventory reservation has exactly one invent…

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

Warehouse/inventory relocation authorization separated from stock ledger events. InventoryTransfer explains why and where stock should move; InventoryMovement records what stock actually changed location. Putaway, replenishment, staging, inter-bin relocation and controlled warehouse transfers. Product/Lot/Serial identify stock; InventoryLocation supplies origin/destination; InventoryMovement provides authoritative physical effect. Planned → released → in progress → completed or cancelled. Release reserves/validates eligible stock where policy requires; execution updates balances only through…

Readable by every signed-in person.

Fields:
  - **Transfer Number** (required) — Human-facing transfer reference. Operational identifier for relocation work. Warehouse execution and reconciliation. Distinct from movement numbers. Required.
  - **Requested Quantity** (required) — Quantity authorized for relocation. Defines transfer demand. Execution and variance reconciliation. Interpreted with Product and traceability identities. Required.
  - **Status** (required, one of the Inventory Transfer Status values) — Transfer lifecycle state. Controls warehouse execution eligibility. Transfer orchestration and audit. Posted movements remain immutable regardless of header state. Prepared but not executable. Authorized. Physical relocation underway. Auth…
  - **Product** (required, a Product) — Product being relocated. Defines inventory item affected. Validation and reconciliation. Exactly one Product. All movements must match.
  - **Source Location** (required, a Inventory Location) — Location inventory leaves. Defines transfer origin. Availability and warehouse execution. Exactly one source. Must differ from target and hold eligible stock.
  - **Lot** (a Lot) — Lot being transferred. Preserves batch identity across relocation. Traceability and FEFO. Required under lot-control policy. Source/target stock remains same lot.

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
  - **Lot Number** (required) — Business-facing lot or batch identifier. Traceability code used operationally and externally. Receiving, labels, picking, quality, recall, and certificates. Uniqueness is governed with Product and organizational policy. Required.
  - **Manufactured At** — Time the lot was manufactured or produced. Anchors production age and provenance. Shelf-life, quality, genealogy, and recall. Distinct from receipt date. Optional when unknown or not applicable.
  - **Expires At** — Expiry or use-by time for the lot. Controls eligibility where shelf life applies. FEFO allocation, quarantine, disposal, and compliance. Does not itself post inventory movement. Optional for non-expiring products.
  - **Status** (required, one of the Lot Status values) — Governed usability state of the lot. Controls allocation and operational eligibility while preserving stock history. Quality release, warehouse allocation, production, recall, and disposition. Status restrictions affect availability but do…
  - **Product** (required, a Product) — Product represented by this lot. Defines item identity for all lot quantities. Inventory and quality validation. Exactly one Product. Movements and balances must use the same product.

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

### Packing

Warehouse packaging execution between picking and shipping. Packing establishes physical package composition/readiness; Shipment and InventoryMovement separately govern transport and stock effects. Fulfillment, package labeling, staging, carrier handoff and traceability. Picking supplies goods; HandlingUnit identifies package; Shipment/ShipmentLine supply transport context. Planned → in progress → packed, cancelled or exception.

Readable by every signed-in person.

Fields:
  - **Packed Quantity** (required) — Quantity confirmed packed. Measures goods prepared for transport. Shipment readiness and reconciliation. Must not exceed eligible picked quantity. Required.
  - **Status** (required, one of the Packing Status values) — Packing task state. Controls packaging workflow. WMS and shipping readiness. PACKED is not dispatch/delivery evidence. Awaiting work. Packaging underway. Confirmed complete. Terminated. Requires resolution. Required.
  - **Picking** (a Picking) — Pick task supplying goods. Preserves pick-to-pack provenance. Fulfillment reconciliation. Optional for packing not driven by a single pick. Packed quantity cannot exceed eligible picked quantity.
  - **Handling Unit** (required, a Handling Unit) — Package/pallet/tote receiving packed goods. Establishes physical logistics identity. Labels, staging, loading and tracking. Exactly one target handling unit per packing record. Contents/custody remain traceable.

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

### Picking

Warehouse inventory-selection task for authorized demand. Picking selects/handles committed stock; inventory and fulfillment ledgers remain authoritative separately. Sales fulfillment, production staging, transfer and service demand. Reservation supplies commitment; InventoryLocation supplies source; ShipmentLine may supply outbound demand. Planned → released → in progress → picked/short, cancelled or exception.

Readable by every signed-in person.

Fields:
  - **Quantity** (required) — Quantity directed to pick. Defines execution demand. Pick confirmation and variance. Must reconcile with reservation and inventory events. Required.
  - **Status** (required, one of the Picking Status values) — Picking execution state. Controls warehouse task progression. Wave/pick orchestration. PICKED is warehouse evidence, not shipment delivery. Proposed. Authorized. Being picked. Required quantity confirmed. Quantity short. Terminated. Requir…
  - **Reservation** (a Inventory Reservation) — Inventory commitment supplying pick demand. Prevents picking unallocated demand where reservation is required. Fulfillment. Optional under non-reservation workflows. Consumption must reconcile.
  - **Source Location** (required, a Inventory Location) — Storage position picked from. Defines source custody. WMS execution. Exactly one source. Must hold eligible stock.
  - **Handling Unit** (a Handling Unit) — Handling unit used for picked stock. Supports tote/carton/pallet execution. Scanning and packing. Optional. Custody must reconcile.
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

Line items — **Packaging**: kept inside each Product and reached by opening it, never on their own. Product packaging and pack-quantity master. Packaging describes commercial/logistics containment; HandlingUnit identifies an actual pallet/carton/tote/package occurrence. PIM, procurement, sales, WMS, shipping and labeling. Product defines contents, UOM defines quantity semantics, HandlingUnit repr…

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
  - **Quantity** (required) — Quantity directed for storage. Defines task execution quantity. Putaway confirmation and variance. Must reconcile with transfer/movement. Required.
  - **Status** (required, one of the Putaway Status values) — Putaway task state. Controls executable storage work. WMS orchestration. Completion alone does not alter stock without inventory posting. Proposed. Authorized. Being executed. Confirmed and reconciled. Terminated. Requires resolution. Requ…
  - **Product** (required, a Product) — Product being stored. Identifies handled inventory. Location eligibility. Exactly one Product. Must match transfer.
  - **Source Location** (required, a Inventory Location) — Receiving/staging origin. Current controlled position. Execution. Exactly one source. Must contain eligible stock.
  - **Handling Unit** (a Handling Unit) — Physical pallet/carton/tote moved as unit. Supports scan-based execution. WMS mobility. Optional for loose stock. Handling-unit location must reconcile.
  - **Inventory Transfer** (required, a Inventory Transfer) — Inventory relocation authorization/execution associated with putaway. Separates warehouse task from stock ledger. Reconciliation. Exactly one governed transfer. Completed task must reconcile to posted movement.
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
  - **Serial Code** (required) — Business/manufacturer serial identifier. Operational code used to recognize the individual unit. Scanning, receiving, picking, shipment, service, returns, and warranty. Uniqueness is governed for the Product or global namespace. Required.
  - **Status** (required, one of the Serial Number Status values) — Operational lifecycle state of the serialized unit. Controls eligibility and custody transitions for the individual unit. Allocation, shipment, service, returns, and disposal. Status is reconciled from authoritative business and inventory…
  - **Inventory Transfer** (a Inventory Transfer) — The InventoryTransfer this SerialNumber belongs to.
  - **Inventory Count** (a Inventory Count) — The InventoryCount this SerialNumber belongs to.
  - **Product** (required, a Product) — Product model represented by the serial. Defines the standardized item type. Validation and master-data context. Exactly one Product. Every serial movement must use the same Product.
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

A first-level division of a country — a state, province, region, territory or equivalent — from the ISO 3166-2 registry. Give every application the same governed list, so a place or code means one thing across the enterprise. A first-level division of a country — a state, province, region, territory or equivalent — from the ISO 3166-2 registry. Chosen from the list wherever a record needs a place, code or currency; maintained by an administrator when a registry changes. Referenced by addresses, parties, products and documents; related entities narrow each other (a city belongs to a state or p…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The ISO 3166-2 code, the country code and the division's own, such as US-CA. Search, integration and reporting. Unique; begins with the code of the country it belongs to. Required.
  - **Name** (required) — The division's name in English. Shown in lists and on addresses. Does not replace the code as the stable key. Required.
  - **Subdivision Type** — What the registry calls the division in its country: State, Province, Region, Territory and so on. Labelling the field for users of that country. Describes this division only.
  - **Country** (required, a Country) — The country the division belongs to. Chosen first; the divisions offered are those of that country. Every state or province belongs to exactly one country. A city and an address are narrowed by the country before the state.

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

### Warehouse

Represents a managed facility where inventory is physically or operationally received, stored, controlled, fulfilled, and dispatched. Warehouse is more than an address: it is an operational capability with storage structure, inventory processes, capacity constraints, and an operating lifecycle. It provides the facility context in which InventoryLocation and InventoryMovement events occur. Used by procurement, receiving, inventory control, warehouse management, order fulfillment, shipping, transportation, capacity planning, and stock reporting. Warehouse specializes Location for inventory oper…

Readable by every signed-in person.

Fields:
  - **Location** (required, a Location) — Identifies the Location record that supplies the address and geographic context for the warehouse. Used for routing, delivery, tax, service coverage, mapping, and operational location management. Warehouse specializes Location; this refere…
  - **Warehouse Code** (required) — The organization-assigned business code used by warehouse personnel and systems to identify the facility. Used in inventory documents, receiving, picking, shipping, integrations, labels, reports, and warehouse routing. It is a human/system…
  - **Warehouse Type** (required, one of the Warehouse Warehouse Type values) — Classifies the operating model and handling characteristics of the warehouse. Drives storage rules, temperature controls, customs controls, fulfillment workflows, capacity planning, and reporting. Type describes operational capability and…
  - **Capacity** — The nominal storage or handling capacity of the warehouse under a defined capacity measurement convention. Used for capacity planning, utilization reporting, allocation, expansion analysis, and operational constraints. Capacity must be int…
  - **Status** (required, one of the Warehouse Status values) — The operating lifecycle state of the warehouse and whether it can participate in normal inventory processes. Controls receiving, storage, picking, shipping, allocation, and operational reporting. Warehouse status describes facility availab…
  - **Code** (required) — The code of the location: a value the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the location's other fields and its relati…
  - **Name** (required) — The name of the location: a value the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the location's other fields and its relati…
  - **Location Type** (required, one of the Warehouse Location Type values) — The location type of the location: a value the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the location's other fields and i…
  - **Address** (a Address) — The address id of the location: a link to another record the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the location's othe…
  - **Parent Location** (a Location) — The parent location id of the location: a link to another record the business records on it. Entered or maintained when a location is created or changed; shown on its form and available to search and reports. Read together with the locatio…
  - **Organization** (a Organization) — Links a location to organization, the organization it relates to. Chosen from the existing organization records when the location is created or edited. A location has at most one organization in this role. Lets the location be found from,…

Line items — **Inventory Location**: kept inside each Warehouse and reached by opening it, never on their own. Granular inventory position whose lifecycle controls future execution while preserving historical inventory state. A location is operational infrastructure, not merely an address. Changing its status can affect receiving, put-away, reservations, picking, transfers, replenishment and shipment stagin…

Line items — **Warehouse Zone**: kept inside each Warehouse and reached by opening it, never on their own. Operational grouping between Warehouse and InventoryLocation. Warehouse is the facility, WarehouseZone is the process/storage area, InventoryLocation is the stock-control position. Receiving, putaway, reserve/pick storage, quarantine, returns, staging and shipping. Zone rules guide InventoryTransfe…

Line items — **Dock**: kept inside each Warehouse and reached by opening it, never on their own. Warehouse loading/receiving execution resource. Dock is a physical process resource, not an inventory location unless separately represented by stagingLocation. Inbound, outbound, cross-dock, appointment, staging and loading workflows. Warehouse owns operational context; InventoryLocation supplies…

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
  - **Wave Number** (required) — Human-facing wave reference. Operational identifier for grouped work. Warehouse planning and reporting. Distinct from task and shipment identifiers. Required.
  - **Status** (required, one of the Wave Status values) — Wave orchestration state. Controls grouped task release and closure. WMS execution. Wave completion cannot substitute for task or inventory evidence. Work being grouped. Tasks authorized. Tasks executing. Included work reconciled. Remainin…
  - **Warehouse** (required, a Warehouse) — Warehouse executing wave. Defines operating facility. Labor/task orchestration. Exactly one Warehouse. Included tasks must be compatible with warehouse.

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

### Dock Dock Type

- **INBOUND** — Receiving-focused.
- **OUTBOUND** — Shipping-focused.
- **BIDIRECTIONAL** — Supports both directions.
- **CROSS DOCK** — Supports direct inbound-to-outbound flow.

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

### Handling Unit Type

- **PALLET** — Palletized logistics unit.
- **CARTON** — Carton/box.
- **TOTE** — Reusable tote/bin.
- **CAGE** — Roll cage or similar unit.
- **DRUM** — Drum/container.
- **PACKAGE** — General package.
- **OTHER** — Governed other type.

### Inventory Location Location Type

- **RECEIVING** — The location type of the inventory location is receiving; set it when that is what the business means for this record.
- **BIN** — The location type of the inventory location is bin; set it when that is what the business means for this record.
- **SHELF** — The location type of the inventory location is shelf; set it when that is what the business means for this record.
- **RACK** — The location type of the inventory location is rack; set it when that is what the business means for this record.
- **FLOOR** — The location type of the inventory location is floor; set it when that is what the business means for this record.
- **PICK** — The location type of the inventory location is pick; set it when that is what the business means for this record.
- **STAGING** — The location type of the inventory location is staging; set it when that is what the business means for this record.
- **QUARANTINE** — The location type of the inventory location is quarantine; set it when that is what the business means for this record.
- **YARD SLOT** — The location type of the inventory location is yard slot; set it when that is what the business means for this record.
- **OTHER** — The location type of the inventory location is other; set it when that is what the business means for this record.

### Inventory Location Status

- **ACTIVE** — The status of the inventory location is active; set it when that is what the business means for this record.
- **BLOCKED** — The status of the inventory location is blocked; set it when that is what the business means for this record.
- **INACTIVE** — The status of the inventory location is inactive; set it when that is what the business means for this record.

### Inventory Movement Movement Type

- **RECEIPT** — Accepted inbound quantity becomes inventory at a target location.
- **ISSUE** — Quantity leaves available inventory for shipment, consumption, maintenance, production or authorized outbound use.
- **TRANSFER** — Quantity moves between inventory locations.
- **ADJUSTMENT** — Quantity is corrected through approved reconciliation.
- **RETURN** — Previously controlled quantity is returned or otherwise processed under return semantics.
- **RESERVATION** — Quantity is committed to demand without physical movement.
- **RELEASE** — Previous reservation is removed.

### Inventory Reservation Status

- **PENDING** — The status of the inventory reservation is pending; set it when that is what the business means for this record.
- **ACTIVE** — The status of the inventory reservation is active; set it when that is what the business means for this record.
- **PARTIALLY CONSUMED** — The status of the inventory reservation is partially consumed; set it when that is what the business means for this record.
- **RELEASED** — The status of the inventory reservation is released; set it when that is what the business means for this record.
- **CONSUMED** — The status of the inventory reservation is consumed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the inventory reservation is cancelled; set it when that is what the business means for this record.
- **EXPIRED** — The status of the inventory reservation is expired; set it when that is what the business means for this record.

### Inventory Transfer Status

- **PLANNED** — Prepared but not executable.
- **RELEASED** — Authorized.
- **IN PROGRESS** — Physical relocation underway.
- **COMPLETED** — Authorized quantity reconciled.
- **CANCELLED** — Remaining work terminated.

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

### Lot Status

- **ACTIVE** — Operationally recognized.
- **HOLD** — Temporarily restricted.
- **QUARANTINED** — Segregated pending decision.
- **RELEASED** — Approved for governed use.
- **EXPIRED** — Past governed shelf life.
- **REJECTED** — Not approved for intended use.
- **CONSUMED** — Quantity fully consumed under tracked processes.
- **CLOSED** — Traceability lifecycle closed.

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

### Packing Status

- **PLANNED** — Awaiting work.
- **IN PROGRESS** — Packaging underway.
- **PACKED** — Confirmed complete.
- **CANCELLED** — Terminated.
- **EXCEPTION** — Requires resolution.

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

### Picking Status

- **PLANNED** — Proposed.
- **RELEASED** — Authorized.
- **IN PROGRESS** — Being picked.
- **PICKED** — Required quantity confirmed.
- **SHORT** — Quantity short.
- **CANCELLED** — Terminated.
- **EXCEPTION** — Requires resolution.

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

### Putaway Status

- **PLANNED** — Proposed.
- **RELEASED** — Authorized.
- **IN PROGRESS** — Being executed.
- **COMPLETED** — Confirmed and reconciled.
- **CANCELLED** — Terminated.
- **EXCEPTION** — Requires resolution.

### Serial Number Status

- **EXPECTED** — Known before receipt.
- **AVAILABLE** — Eligible inventory.
- **RESERVED** — Committed to demand.
- **IN TRANSIT** — Under logistics movement.
- **INSTALLED** — Deployed or installed.
- **CONSUMED** — Used in a process.
- **RETURNED** — Entered governed return flow.
- **QUARANTINED** — Restricted pending decision.
- **SCRAPPED** — Physically disposed as scrap.
- **RETIRED** — Lifecycle closed.

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

### Warehouse Location Type

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

### Inventory Reservation — Inventory Reservation Lifecycle

Starts at **PENDING**.
Final: **CONSUMED**, **CANCELLED**, **EXPIRED**.

Moves:
- PENDING → ACTIVE (Activate)
- ACTIVE → PARTIALLY CONSUMED (Mark Partially Consumed)
- PARTIALLY CONSUMED → RELEASED (Release)
- RELEASED → CONSUMED (Consume)
- PENDING → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)
- PARTIALLY CONSUMED → CANCELLED (Cancel)
- RELEASED → CANCELLED (Cancel)
- ACTIVE → EXPIRED (Expire)
- PARTIALLY CONSUMED → EXPIRED (Expire)
- RELEASED → EXPIRED (Expire)

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
Final: **CONSUMED**, **EXPIRED**, **REJECTED**.

Moves:
- ACTIVE → HOLD (Mark Hold)
- HOLD → RELEASED (Release)
- RELEASED → CLOSED (Close)
- CLOSED → CONSUMED (Consume)
- HOLD → QUARANTINED (Quarantine)
- QUARANTINED → HOLD (Release)
- RELEASED → QUARANTINED (Quarantine)
- QUARANTINED → RELEASED (Release)
- HOLD → EXPIRED (Expire)
- RELEASED → EXPIRED (Expire)
- QUARANTINED → EXPIRED (Expire)
- ACTIVE → REJECTED (Reject)
- HOLD → REJECTED (Reject)
- RELEASED → REJECTED (Reject)
- QUARANTINED → REJECTED (Reject)

### Serial Number — Serial Number Lifecycle

Starts at **EXPECTED**.
Final: **RETURNED**, **SCRAPPED**, **RETIRED**.

Moves:
- EXPECTED → AVAILABLE (Mark Available)
- AVAILABLE → RESERVED (Reserve)
- RESERVED → IN TRANSIT (Mark In Transit)
- IN TRANSIT → INSTALLED (Mark Installed)
- INSTALLED → CONSUMED (Consume)
- CONSUMED → RETURNED (Mark Returned)
- AVAILABLE → QUARANTINED (Quarantine)
- QUARANTINED → AVAILABLE (Release)
- RESERVED → QUARANTINED (Quarantine)
- QUARANTINED → RESERVED (Release)
- IN TRANSIT → QUARANTINED (Quarantine)
- QUARANTINED → IN TRANSIT (Release)
- AVAILABLE → SCRAPPED (Mark Scrapped)
- RESERVED → SCRAPPED (Mark Scrapped)
- IN TRANSIT → SCRAPPED (Mark Scrapped)
- QUARANTINED → SCRAPPED (Mark Scrapped)
- EXPECTED → RETIRED (Retire)
- AVAILABLE → RETIRED (Retire)
- RESERVED → RETIRED (Retire)
- IN TRANSIT → RETIRED (Retire)
- QUARANTINED → RETIRED (Retire)
- INSTALLED → RETIRED (Retire)
- CONSUMED → RETIRED (Retire)

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
Final: **CANCELLED**.

Moves:
- PLANNED → RELEASED (Release)
- RELEASED → IN PROGRESS (Start)
- IN PROGRESS → PICKED (Mark Picked)
- PICKED → SHORT (Mark Short)
- RELEASED → EXCEPTION (Mark Exception)
- EXCEPTION → RELEASED (Resolve Exception)
- IN PROGRESS → EXCEPTION (Mark Exception)
- EXCEPTION → IN PROGRESS (Resolve Exception)
- PICKED → EXCEPTION (Mark Exception)
- EXCEPTION → PICKED (Resolve Exception)
- SHORT → EXCEPTION (Mark Exception)
- EXCEPTION → SHORT (Resolve Exception)
- PLANNED → CANCELLED (Cancel)
- RELEASED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)
- PICKED → CANCELLED (Cancel)
- SHORT → CANCELLED (Cancel)
- EXCEPTION → CANCELLED (Cancel)

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

- **User** — reads 81 of 81 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
