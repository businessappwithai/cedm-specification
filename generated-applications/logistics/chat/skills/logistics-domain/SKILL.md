---
name: logistics-domain
description: What the records of Logistics are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Logistics, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Logistics

Transportation and Logistics, built on the CEDM common foundation.

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
  - **Customer** (a Customer) — The Customer this Address belongs to.

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

### Carrier

A logistics provider that transports shipments, consignments or loads. Goods usually move on someone else's trucks, ships or planes. A carrier record identifies that provider and gives bookings, tracking and freight invoices a single party to refer to. Created when a transport provider is approved for use; selected when shipments are booked; read for service performance and freight costs. A carrier is a Party acting in the transport role; shipments and consignments are assigned to it. Changes and retries preserve history, and a carrier's past shipments remain linked to it after it stops being…

Readable by every signed-in person.

Fields:
  - **Code** — The carrier's short code, such as the SCAC code used in North American freight. Entered when the carrier is set up; used on shipping documents and in EDI messages.
  - **Party** (required, a Party) — Exactly one party: the carrier role is played by a single legal or natural person. Canonical party providing carrier service. Separates logistics role from Party identity. Shipment tendering and performance. Carrier eligibility derives fro…

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

### Consignment

A grouping of goods handed to a carrier under common transport responsibility and commercial terms. A consignment is what the carrier is actually asked to move: one set of goods, from one sender, under one contract of carriage. It is the unit that is tracked, insured and billed. Created when goods are tendered to a carrier; tracked until delivery; read for status, proof of delivery and freight charges. A consignment is carried by a Carrier and contains one or more shipments. Changes and retries keep history and do not duplicate the commercial, physical or financial effects of the consignment.…

Readable by every signed-in person.

Fields:
  - **Code** — The consignment or waybill number given to the grouping. Used by the carrier and customer to track and reference the movement.

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

### Customer

Represents the commercial customer role of a Party. Party identifies who the party is; PartyRole establishes a role; Customer governs buyer-specific commercial behavior and controls. Central to sales order-to-cash, pricing, billing, receivables, collections, service, and customer analytics. Customer connects to SalesOrder, Invoice, Payment, PaymentAllocation through those transaction entities while retaining the underlying Party identity. Customer onboarding → eligibility/credit → SalesOrder → fulfillment → Invoice → Payment → PaymentAllocation → receivables settlement. Customer status constr…

Readable by every signed-in person.

Fields:
  - **Party Role** (required, a Party Role) — Links Customer to its underlying PartyRole. Resolves common party identity and role information. Customer is a role specialization and must not duplicate Party identity. Supplies common party context to customer-facing workflows.
  - **Customer Code** (required) — Human-facing customer business code. Used in orders invoices statements integrations and communication. Distinct from customerId and external legal identifiers. Supports customer selection and transaction recognition.
  - **Customer Type** (one of the Customer Customer Type values) — A private consumer. A company or other commercial organisation. A public authority or agency. Another unit of the organisation itself, supplied through internal sales. A customer that fits none of the above. Commercial classification of th…
  - **Credit Status** (one of the Customer Credit Status values) — Credit has not been assessed; trading is on the default terms. Credit has been assessed and approved up to the credit limit. Credit is paused pending review; new credit-bearing orders need approval. Credit is refused; no new credit-bearing…
  - **Credit Limit** — Authorized monetary credit exposure limit. Used in credit checks exposure monitoring and risk reporting. Must be interpreted with currency outstanding exposure payment terms and credit status. Provides one input to credit authorization bef…
  - **Payment Terms** — Default settlement policy for customer invoices. Used by SalesOrder Invoice receivables collections and cash forecasting. May be overridden by authorized contract or transaction-level terms. Supplies default due-date expectations to order…
  - **Status** (required, one of the Customer Status values) — A customer the organisation can sell to. Dormant, with no new business expected; can be reactivated. Held back from new business, for example for non-payment or compliance reasons. Closed for good; history is kept. Lifecycle state of the c…
  - **Party** (required, a Party) — The party that holds the role. Set when the role is assigned and not changed. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back to the canonical identity.
  - **Role Type** (required, one of the Customer Role Type values) — The kind of role the party plays. Chosen when the role is assigned; decides which specialised record (customer, supplier and so on) is expected. Buys from the organisation. Sells to the organisation. Works for the organisation. A business…
  - **Code** — An optional code for the role. Used by integrations that identify the role separately from the party. Identifies the role instance and must not replace Party or specialized role identifiers.
  - **Valid From** — The first date on which the role applies. Set when the role is assigned. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a newly established role.
  - **Valid To** — The last date on which the role applies. Set when the role ends. Historical transactions may continue referencing the role after validTo. Prevents new use after role expiration while preserving historical attribution.
  - **Organization** (a Organization) — Optional organizational scope in which the role is recognized. Supports multi-enterprise, subsidiary, business-unit, and operating-context scenarios. Zero means global/context-independent; one means explicitly scoped to one organization. D…

### Customer Credit Status

The values of customer credit status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Customer Customer Type

The values of customer customer type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Customer Role Type

The values of customer role type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Customer Status

The values of customer status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Delivery

The record that shipped goods were handed over to a destination or recipient. A shipment is not finished when it leaves; it is finished when someone receives it. The delivery is the proof of that handover, which settles disputes and triggers invoicing. Created when the carrier confirms handover; read by customer service, finance and claims. Each delivery belongs to one Shipment and records its final handover. Changes and retries preserve the evidence and never duplicate downstream effects such as invoicing. Pallet delivery signed for by the receiving clerk at 14:20 on Thursday.

Readable by every signed-in person.

Fields:
  - **Code** — The reference of the delivery, often the carrier's proof-of-delivery number. Entered on confirmation of handover; used in customer queries.
  - **Shipment** (required, a Shipment) — Exactly one shipment: a delivery is the final handover of a single shipment. Shipment observed by this event. Connects logistics evidence to transport transaction. Tracking and delivery proof. Event must not silently rewrite prior shipment…

### Delivery Attempt

An immutable record of one attempt to deliver a message or event payload to an integration endpoint. Integrations fail and retry. Recording each attempt, with its outcome, lets operators see what was tried, diagnose failures and prove a message was delivered. Written automatically for each attempt; read by integration operators and in incident reviews. Each attempt links a Message and the IntegrationEndpoint it was sent to. An attempt is final once recorded; the next try is a new attempt. Retries must not duplicate business effects downstream. Attempt 2 to post an order event to a partner's e…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the attempt was made. Set automatically; attempts are ordered by it when diagnosing a failure.
  - **Message** (required, a Message) — Exactly one message: every attempt tries to deliver a particular message. Message being delivered. Supplies immutable payload identity. Retry and delivery audit. Retries create distinct attempts and must not duplicate business effects.
  - **Endpoint** (required, a Integration Endpoint) — Exactly one endpoint: every attempt targets a specific destination. Destination endpoint attempted. Defines delivery target. Integration operations. Configuration changes do not rewrite historical attempts.

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

### Freight Charge

A charge for transportation or logistics services attributable to a shipment, consignment, load or carrier service. Freight cost is a real part of the price of goods. Recording each charge against the movement that caused it lets the cost be checked against the carrier's invoice and allocated to the right product or customer. Created from carrier rates or invoices; checked and allocated; read by logistics and finance. A charge may relate to a Shipment. Changes and retries preserve history and do not duplicate downstream commercial or financial effects. A 420.00 line-haul charge for a full tru…

Readable by every signed-in person.

Fields:
  - **Code** — The reference of the charge, often the carrier's charge code. Used to match against the carrier's invoice.
  - **Shipment** (a Shipment) — The shipment on which the charge is incurred. Set when the charge is attributed. At most one shipment; some charges are not tied to a single shipment. Drives landed-cost calculation. Attributes logistics cost.

### Fulfillment

A record that connects sales demand to the steps that satisfy it: reservation, picking, packing, shipping, delivery and completion. A customer order is only done when the goods arrive. Fulfilment ties together the warehouse and transport steps that happen between the order and the delivery, so progress can be seen in one place. Opened when an order is released for fulfilment; updated as each step completes; read by customer service and warehouse supervisors. Fulfilment follows the sales demand and links to the reservations, shipments and deliveries that carry it out. Changes and retries prese…

Readable by every signed-in person.

Fields:
  - **Code** — The reference by which the fulfilment is tracked, often derived from the order number. Used by customer service when answering "where is my order".

### Integration Endpoint

A logical endpoint through which messages or business events are exchanged with an internal or external system. Systems talk to each other through addresses and agreed channels. An endpoint record names one such channel and how it is used, so that deliveries can be routed, retried and audited against a known destination. Registered when a connection to another system is set up; referenced by delivery attempts; read by integration operators when diagnosing failures. Delivery attempts target an endpoint, and messages are routed to it by subscription. Delivery retries and corrections keep audita…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the endpoint was registered or last took effect. Set on registration or when its configuration changes; operators use it to tell which configuration applied to an old delivery.

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
  - **Shipment** (a Shipment) — The Shipment this InventoryMovement belongs to.
  - **Shipment Line** (a Shipment Line) — Shipment line associated with this inventory event when logistics execution applies. Preserves line-level transport-to-stock provenance. Dispatch, transfer, receipt reconciliation, claims, and audit. Optional for inventory events unrelated…
  - **Product** (required, a Product) — Product whose inventory state is affected. Connects event to product master, units and policies. Exactly one product is affected. Identifies stock item.
  - **Party** (a Party) — Party associated with inventory event when ownership or custody matters. Supplier receipts, customer returns, consignment and audit. Optional for internal movements. Connects event to external party.

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

### Load

A grouping of shipments, consignments, handling units or containers that are assigned together to one transport execution. Freight moves in loads, not in single orders. Grouping what travels together lets the carrier, the dock and the customer see one planned movement and track it as such. Created by transport planning; filled as shipments are assigned; handed to a carrier; read by dispatch and the warehouse. A load groups Shipments and Consignments under one carrier movement. Changes and retries preserve history and do not duplicate commercial, physical or financial effects. A full trailer c…

Readable by every signed-in person.

Fields:
  - **Code** — The load number printed on the loading list. Allocated by transport planning; used by drivers and the dock.

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

### Message

An integration message envelope that keeps the payload identity, direction, correlation, processing state and delivery evidence of a message exchanged with another system. Systems exchange messages, and things go wrong. Keeping each message as a record lets operators see what was sent or received, whether it was processed and what happened on delivery, and replay it safely. Written when a message is sent or received; updated as it is processed; read by integration operators and in incident reviews. A message is delivered to IntegrationEndpoints through DeliveryAttempts. Delivery retries and c…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the message was created or received. Set by the integration layer; used to order messages and to measure latency.

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
  - **Trip** (a Trip) — The Trip this Party belongs to.

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

### Route

A planned path of transport stops used to move shipments or run a fleet. A route fixes the order in which stops are visited so deliveries and collections can be planned, driven and compared with what actually happened. Planned by logistics; used by dispatch and drivers. A route is made of ordered stops. A route is planned, used, and withdrawn when no longer run. Past trips keep their route. Route R-NORTH visits five depots in order from the warehouse each morning.

Readable by every signed-in person.

Fields:
  - **Code** — The short code of the route, such as R-NORTH. Used by dispatch and drivers.

### Sales Order

A customer's firm commitment to buy specified products or services on stated commercial terms and delivery needs. The sales order is the contract in operational form. It fixes what was ordered, by whom, at what price and for when, and drives allocation of stock, shipment and invoicing, so everything downstream can be traced back to what the customer agreed. Entered by sales or placed online; confirmed by the business; read by warehouse, shipping and finance. An order is for one customer, has lines, may name an organisation and delivery location, and is followed by shipments and invoices. An o…

Readable by every signed-in person.

Fields:
  - **Order Number** (required) — The number the customer sees, such as SO-10482. Unique; quoted on confirmations and invoices. Used to find the order from any following document.
  - **Order Date** (required) — When the order was placed. Set on entry; sales are reported by it. Compared with the requested delivery date.
  - **Status** (required, one of the Sales Order Status values) — Being entered; not yet binding on either side. Accepted by the business; the commitment stands. Stock has been reserved to meet the order. Part of the order has been shipped. Everything ordered has been delivered. A final state. Withdrawn…
  - **Currency** (a Currency) — Chosen when the order is created; all amounts are in it. Read with the total. The currency id of the sales order: a link to another record the business records on it.
  - **Requested Delivery Date** — Entered from the customer's request; used to plan allocation and shipping. Compared with the promised and actual shipment dates. The requested delivery date of the sales order: a calendar date the business records on it.
  - **Total Amount** — The total value of the order after discounts and tax. Calculated from the lines. Matched with the invoiced amount.
  - **Customer** (required, a Customer) — An order is placed by a single customer, who is the one shipped to and invoiced unless stated otherwise. The customer who placed the order. Chosen when the order is created. Decides who is shipped to and invoiced.
  - **Organization** (a Organization) — The selling organisation that takes the order. Chosen when the business has several companies. At most one organisation. Decides whose accounts record the sale.
  - **Delivery Location** (a Location) — Chosen when delivery is not to the customer's default address. The place the goods are to be delivered. At most one location; empty uses the customer's address. Used by shipping.

Line items — **Sales Order Line**: kept inside each Sales Order and reached by opening it, never on their own. One product or service on a sales order, with its quantity, price, discount, tax and fulfilment progress. The line is the precise commitment: what, how many, at what price from which source. It tracks how much has been reserved, shipped and billed, so each line can be followed to completion and the…

### Sales Order Line Price Source

The values of sales order line price source, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Sales Order Status

The values of sales order status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Shipment

Represents physical logistics execution bridging commercial fulfillment and transport while keeping inventory and financial state under their authoritative workflows. Shipment answers how goods are physically moved. It is not itself the inventory ledger, SalesOrder fulfillment ledger, GoodsReceipt acceptance, or financial settlement. Transportation, warehouse operations, procurement, order fulfillment, carrier management, customs, customer service and container logistics. SalesOrder supplies outbound demand, PurchaseOrder supplies inbound procurement context, Container supplies equipment, Loc…

Readable by every signed-in person.

Fields:
  - **Shipment Number** (required) — Read with the carrier's reference to follow a delivery. Unique; quoted to carriers and customers. The shipment number of the shipment: a value the business records on it.
  - **Shipment Type** (required, one of the Shipment Shipment Type values) — The direction of the movement. Chosen when the shipment is created; decides which orders can link. Read with the origin and destination. Goods arriving from a supplier. Goods going to a customer. Goods moving between the business's own loc…
  - **Status** (required, one of the Shipment Status values) — Intended; no transport is booked. A carrier is booked and a date agreed. On its way. Arrived at the destination. A final state. Called off before delivery. A final state. Delayed or damaged; needs a decision. Operational execution state of…
  - **Planned Date** — The date the shipment is planned to be delivered. Set when booked; used to plan receiving and dispatch. Compared with the actual date.
  - **Actual Date** — The date the shipment was actually delivered. Set on delivery. Gives the delivery performance.
  - **Tracking Reference** — The carrier's tracking number. Entered when booked; given to the customer. Used to follow the shipment.
  - **Origin** (a Location) — The place the goods leave from. Chosen when planned. At most one location. Starts the journey.
  - **Carrier** (a Party) — The party transporting the goods. Chosen when booked. At most one carrier. Who is paid and tracked.
  - **Sales Order** (a Sales Order) — The sales order the shipment delivers. Chosen for outbound shipments. At most one order. Links delivery to the sale.
  - **Sales Order Line** (a Sales Order Line) — The SalesOrderLine this Shipment belongs to.

Line items — **Shipment Line**: kept inside each Shipment and reached by opening it, never on their own. Line-level logistics execution connecting commercial demand to physical transport and inventory evidence. ShipmentLine says what quantity moved in logistics; InventoryMovement says what happened to stock. Outbound fulfillment, inbound transport, transfers, returns, carrier operations, claims, and a…

### Shipment Shipment Type

The values of shipment shipment type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Shipment Status

The values of shipment status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Tracking Event

A timestamped observation of how a shipment or its containers and handling units are progressing. Tracking events give the shipment's trail: where it was and when. Because each is a fixed observation, the history can be trusted for delivery proof and delay analysis, and a correction is a new event. Created by carriers, scanners and staff; read by customer service and logistics. Each event belongs to one shipment. An event is recorded once and never changed. A mistaken one is followed by a correcting event. "Departed Leeds depot" recorded for shipment SH-1042 at 14:05 on 3 March.

Readable by every signed-in person.

Fields:
  - **Code** — The code of the event type, such as DEPARTED or DELIVERED. Gives events a consistent vocabulary across carriers. Entered by the source system; reports group by it. Read with the time and place.
  - **Shipment** (required, a Shipment) — Each event is about exactly one shipment, whose trail it extends. Shipment observed by this event. Connects logistics evidence to transport transaction. Tracking and delivery proof. Event must not silently rewrite prior shipment evidence.

### Trip

A planned or completed journey made by one or more travellers, made up of transport segments and bookings. A trip groups the legs, travellers and bookings of one journey so the whole can be planned, booked, followed and paid for together, and so expenses and approvals attach to the journey rather than to loose tickets. Created by the traveller or a travel arranger; read by approvers, finance and travel support. A trip has one or more travellers, is made of segments and is paid for through bookings. A trip is planned, booked, in progress while travelling and completed on return. It may be canc…

Readable by every signed-in person.

Fields:
  - **Trip Number** (required) — The number of the trip, such as TR-2026-077. Unique; quoted on expense claims and approvals. Read with the name.
  - **Name** — A short description of the trip. Entered by the traveller; shown in lists. Read by approvers.
  - **Start Date** (required) — The date the trip begins. Entered when planned. Not later than the end date.
  - **End Date** — The date the trip ends. Must not be before the start date. Gives the length of the trip.
  - **Status** (required, one of the Trip Status values) — Where the trip is. Starts as PLANNED; moved as it is booked and travelled. Intended; nothing is booked. Travel and accommodation are booked. The traveller is on the journey. The trip is finished. A final state. Called off. A final state.

Line items — **Trip Segment**: kept inside each Trip and reached by opening it, never on their own. One leg of a trip between an origin and a destination by a mode of transport. Segments give the route its detail, so each flight, train or drive can be booked, timed and followed separately, and delays can be seen on the leg where they happened. Added by the traveller or arranger; read by travel su…

### Trip Segment Mode

The values of trip segment mode, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Trip Segment Status

The values of trip segment status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Trip Status

The values of trip status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Vehicle

A vehicle or piece of transport equipment used to carry out logistics movements. Vehicles are the assets that move goods and containers. Recording each with its type, capacity and state lets dispatch know what is available, and lets movements, drivers and fuel be tied to the vehicle. Maintained by fleet managers; chosen on movements and trips; read by dispatch. A vehicle may have an operator and a home location, makes movements, and has drivers and fuel purchases. A vehicle is active while in service, goes to maintenance and returns, may be out of service, and is retired when disposed of. Ret…

Readable by every signed-in person.

Fields:
  - **Registration Number** (required) — The registration or plate number. Unique; used on documents and checks. Read with the type.
  - **Vehicle Type** (required, one of the Vehicle Vehicle Type values) — The kind of vehicle. Chosen on creation; dispatch matches loads to it. Read with capacity. A road lorry. A tractor unit that pulls a trailer. A trailer without its own power. A forklift truck for yard and warehouse use. A crane for lifting…
  - **Capacity** — The load the vehicle can carry. Must not be negative; dispatch checks loads against it. Compared with the weight of the shipment.
  - **Status** (required, one of the Vehicle Status values) — Whether the vehicle is available. Starts as ACTIVE; moved by fleet managers. Available for use. In the workshop. Not usable, for example after a breakdown. Disposed of. A final state.
  - **Operator** (a Party) — The party that operates the vehicle. Chosen when operated by a contractor. At most one operator. Decides who is responsible for it.
  - **Location** (a Location) — The place the vehicle is based or currently at. Updated as it moves. At most one location. Used to plan pickups.

### Vehicle Status

The values of vehicle status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Vehicle Vehicle Type

The values of vehicle vehicle type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Customer Credit Status

- **NOT REVIEWED** — Credit has not been assessed; trading is on the default terms.
- **APPROVED** — Credit has been assessed and approved up to the credit limit.
- **ON HOLD** — Credit is paused pending review; new credit-bearing orders need approval.
- **BLOCKED** — Credit is refused; no new credit-bearing orders.

### Customer Customer Type

- **INDIVIDUAL** — A private consumer.
- **BUSINESS** — A company or other commercial organisation.
- **GOVERNMENT** — A public authority or agency.
- **INTERNAL** — Another unit of the organisation itself, supplied through internal sales.
- **OTHER** — A customer that fits none of the above.

### Customer Role Type

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

### Customer Status

- **ACTIVE** — A customer the organisation can sell to.
- **INACTIVE** — Dormant, with no new business expected; can be reactivated.
- **BLOCKED** — Held back from new business, for example for non-payment or compliance reasons.
- **RETIRED** — Closed for good; history is kept.

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

### Sales Order Line Price Source

- **PRICE LIST** — Taken from the price list.
- **CONTRACT** — Taken from a contract with the customer.
- **CUSTOMER AGREEMENT** — Taken from a standing customer agreement.
- **QUOTATION** — Taken from an accepted quotation.
- **MANUAL** — Entered by the salesperson.
- **PROMOTION** — Set by a promotion.
- **OTHER** — Determined some other way.

### Sales Order Status

- **DRAFT** — Being entered; not yet binding on either side.
- **CONFIRMED** — Accepted by the business; the commitment stands.
- **ALLOCATED** — Stock has been reserved to meet the order.
- **PARTIALLY FULFILLED** — Part of the order has been shipped.
- **FULFILLED** — Everything ordered has been delivered. A final state.
- **CANCELLED** — Withdrawn before fulfilment. A final state.

### Shipment Shipment Type

- **INBOUND** — Goods arriving from a supplier.
- **OUTBOUND** — Goods going to a customer.
- **TRANSFER** — Goods moving between the business's own locations.
- **RETURN** — Goods coming back from a customer or going back to a supplier.

### Shipment Status

- **PLANNED** — Intended; no transport is booked.
- **BOOKED** — A carrier is booked and a date agreed.
- **IN TRANSIT** — On its way.
- **DELIVERED** — Arrived at the destination. A final state.
- **CANCELLED** — Called off before delivery. A final state.
- **EXCEPTION** — Delayed or damaged; needs a decision.

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

### Trip Segment Mode

- **AIR** — By aircraft.
- **RAIL** — By train.
- **ROAD** — By car or other road vehicle.
- **SEA** — By ship or ferry.
- **BUS** — By bus or coach.
- **WALK** — On foot.
- **OTHER** — By another means.

### Trip Segment Status

- **PLANNED** — Intended; nothing is booked.
- **BOOKED** — Travel is booked.
- **IN PROGRESS** — Under way.
- **COMPLETED** — Arrived. A final state.
- **CANCELLED** — Called off. A final state.

### Trip Status

- **PLANNED** — Intended; nothing is booked.
- **BOOKED** — Travel and accommodation are booked.
- **IN PROGRESS** — The traveller is on the journey.
- **COMPLETED** — The trip is finished. A final state.
- **CANCELLED** — Called off. A final state.

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

### Vehicle Status

- **ACTIVE** — Available for use.
- **MAINTENANCE** — In the workshop.
- **OUT OF SERVICE** — Not usable, for example after a breakdown.
- **RETIRED** — Disposed of. A final state.

### Vehicle Vehicle Type

- **TRUCK** — A road lorry.
- **TRACTOR** — A tractor unit that pulls a trailer.
- **TRAILER** — A trailer without its own power.
- **FORKLIFT** — A forklift truck for yard and warehouse use.
- **CRANE** — A crane for lifting loads.
- **OTHER** — A vehicle of another kind.

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

### Shipment — Shipment Lifecycle

Starts at **PLANNED**.
Final: **DELIVERED**, **CANCELLED**.

Moves:
- PLANNED → BOOKED (Book)
- BOOKED → IN TRANSIT (Mark In Transit)
- IN TRANSIT → DELIVERED (Deliver)
- BOOKED → EXCEPTION (Mark Exception)
- EXCEPTION → BOOKED (Resolve Exception)
- IN TRANSIT → EXCEPTION (Mark Exception)
- EXCEPTION → IN TRANSIT (Resolve Exception)
- PLANNED → CANCELLED (Cancel)
- BOOKED → CANCELLED (Cancel)
- IN TRANSIT → CANCELLED (Cancel)
- EXCEPTION → CANCELLED (Cancel)

### Vehicle — Vehicle Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → MAINTENANCE (Mark Maintenance)
- MAINTENANCE → ACTIVE (Return To Service)
- ACTIVE → OUT OF SERVICE (Mark Out Of Service)
- OUT OF SERVICE → ACTIVE (Return To Service)
- ACTIVE → RETIRED (Retire)
- MAINTENANCE → RETIRED (Retire)
- OUT OF SERVICE → RETIRED (Retire)

### Sales Order — Sales Order Lifecycle

Starts at **DRAFT**.
Final: **FULFILLED**, **CANCELLED**.

Moves:
- DRAFT → CONFIRMED (Confirm)
- CONFIRMED → ALLOCATED (Mark Allocated)
- ALLOCATED → PARTIALLY FULFILLED (Mark Partially Fulfilled)
- PARTIALLY FULFILLED → FULFILLED (Fulfil)
- DRAFT → CANCELLED (Cancel)
- CONFIRMED → CANCELLED (Cancel)
- ALLOCATED → CANCELLED (Cancel)
- PARTIALLY FULFILLED → CANCELLED (Cancel)

### Trip — Trip Lifecycle

Starts at **PLANNED**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- PLANNED → BOOKED (Book)
- BOOKED → IN PROGRESS (Start)
- IN PROGRESS → COMPLETED (Complete)
- PLANNED → CANCELLED (Cancel)
- BOOKED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)

### Trip Segment — Trip Segment Lifecycle

Starts at **PLANNED**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- PLANNED → BOOKED (Book)
- BOOKED → IN PROGRESS (Start)
- IN PROGRESS → COMPLETED (Complete)
- PLANNED → CANCELLED (Cancel)
- BOOKED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)

### Customer — Customer Lifecycle

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

## Roles

- **User** — reads 80 of 80 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
