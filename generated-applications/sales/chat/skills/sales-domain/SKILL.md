---
name: sales-domain
description: What the records of Sales are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Sales, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Sales

Sales and Order Management, built on the CEDM common foundation.

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

### Brand

Governed product brand reference master. Brand describes commercial/manufacturer identity; it is distinct from ProductCategory taxonomy and Product identity. PIM, catalog, sourcing, sales, e-commerce, service and analytics. Products and variants reference Brand; category remains independent classification. Active → inactive → active or retired. Lifecycle/name changes update future catalog/master usage while preserving historical references.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short unique code identifying the brand across catalogue, sourcing and integration systems. Assigned by master-data governance when the brand is created; used as the stable key when products and feeds name the brand. Stable business/in…
  - **Name** (required) — The brand's display name as customers and buyers know it, such as the manufacturer's trading name. Shown on catalogue pages, documents and search results, and used to group sales and sourcing reports by brand. Customer/supplier-facing mark…
  - **Status** (required, one of the Brand Status values) — Whether the brand is in use, paused, or withdrawn from the catalogue. Set by master-data governance; only active brands are offered for new products, and retired ones are kept for history. In use and available for assignment to products. T…

### Brand Status

The values of brand status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Name** (required) — The full name of the business unit, as it appears in the organisation's structure and management accounts. Entered by management or finance when the unit is created; shown in organisation charts, selectors and segment reports.
  - **Organization** (required, a Organization) — The organisation to which the unit belongs. Set when the unit is created. Exactly one organisation; a unit cannot stand alone. Rolls the unit's results up into its parent organisation.

### Calendar

A calendar that defines business dates, working days, holidays and time-control rules used for planning and operations. Whether a date counts as a working day is not obvious: it depends on region, industry and company. A calendar states that explicitly, so due dates, delivery promises and schedules all agree. Maintained by administrators; referenced by schedulers, service-level calculations and planning when they need to know which days count. Locations, teams, contracts and schedules point to the calendar that governs their working days. A calendar's code and identity stay stable. Changes to…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short reference for the calendar, such as DE-NAT. Assigned by the administrator; used in configuration and reports; kept stable.
  - **Name** (required) — The descriptive name of the calendar, such as UK Working Days or Group Fiscal Calendar. Entered by the administrator who maintains it; shown wherever a schedule, service level or plan asks which calendar applies.

### Campaign

A marketing or outreach initiative aimed at an audience over a defined period, with its responses and outcomes measured. Campaigns are how an organisation deliberately reaches out to win or retain customers. Recording them lets the business see what was done, who was targeted and what it achieved. Planned and launched by marketing; linked to audiences, activities and opportunities; reviewed when results are analysed. A campaign connects to the parties it targets, the activities carried out and the opportunities it generates. Campaigns are planned, run and closed. History is preserved so resul…

Readable by every signed-in person.

Fields:
  - **Code** — A short reference for the campaign, such as SPRING26-WINBACK. Assigned by marketing and used in tracking links, reports and attribution.

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

### Contact

A person recorded in a business relationship, such as a contact at a customer, prospect, supplier or partner. Selling and service happen between people. A contact says who the person is in a relationship, which account they belong to, and gives a stable place to hang conversations and activities. Created when a person is added to a customer or partner account; read by sales and service staff when they reach out. A contact is a Person associated with an Account; the Person record holds the identity and the contact adds the business context. Changes and retries preserve history and do not dupli…

Readable by every signed-in person.

Fields:
  - **Code** — An optional short reference for the contact, often from an import or an external CRM. Used to match records during synchronisation.
  - **Person** (required, a Person) — The person who is the contact. Chosen when the contact is created; supplies name and personal details. Exactly one person; a contact is always a specific human being. Keeps personal identity in one place so the same person can be a contact…

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

### Customer

Represents the commercial customer role of a Party. Party identifies who the party is; PartyRole establishes a role; Customer governs buyer-specific commercial behavior and controls. Central to sales order-to-cash, pricing, billing, receivables, collections, service, and customer analytics. Customer connects to SalesOrder, Invoice, Payment, PaymentAllocation through those transaction entities while retaining the underlying Party identity. Customer onboarding → eligibility/credit → SalesOrder → fulfillment → Invoice → Payment → PaymentAllocation → receivables settlement. Customer status constr…

Readable by every signed-in person.

Fields:
  - **Party Role** (required, a Party Role) — The link to the party role that makes this party a customer. Set when the customer is created; the party's name, addresses and contacts are read through it and are not copied here. Customer is a role specialization and must not duplicate P…
  - **Customer Code** (required) — The short code staff and systems use to refer to this customer. Assigned when the customer is set up; quoted on orders, invoices and statements and used in integrations, and different from the system id. Distinct from customerId and extern…
  - **Customer Type** (one of the Customer Customer Type values) — The commercial kind of buyer, such as a private consumer, a company or a public body. Chosen by sales when the customer is created; it steers pricing, credit rules, tax handling and reporting segments. A private consumer buying for persona…
  - **Credit Status** (one of the Customer Credit Status values) — The credit-control decision currently in force for this customer. Set by credit control after review; order authorisation, receivables and collections check it before releasing credit-bearing orders. Credit has not been assessed; trading i…
  - **Credit Limit** — Authorized monetary credit exposure limit. Used in credit checks exposure monitoring and risk reporting. Must be interpreted with currency outstanding exposure payment terms and credit status. Provides one input to credit authorization bef…
  - **Payment Terms** (a Payment Term) — Default settlement policy for customer invoices. Used by SalesOrder Invoice receivables collections and cash forecasting. May be overridden by authorized contract or transaction-level terms. Supplies default due-date expectations to order…
  - **Status** (required, one of the Customer Status values) — Whether the customer relationship is open for business, dormant, held back or closed. Moved by sales or finance; it decides whether new orders may be taken, while past transactions stay attributed to the customer. A customer the organisati…
  - **Party** (required, a Party) — The party that holds the role. Set when the role is assigned and not changed. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back to the canonical identity.
  - **Role Type** (required, one of the Customer Role Type values) — The kind of role the party plays, such as customer, supplier, employee or partner. Chosen when the role is assigned; decides which specialised record (customer, supplier and so on) carries its detail. The party buys goods or services from…
  - **Code** — An optional code for the role. Used by integrations that identify the role separately from the party. Identifies the role instance and must not replace Party or specialized role identifiers.
  - **Valid From** — The first date on which the role applies. Set when the role is assigned. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a newly established role.
  - **Valid To** — The last date on which the role still applies to the party. Set when the role ends, such as a contract expiry; empty while open-ended, and later use of the role is refused. Historical transactions may continue referencing the role after va…
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

### Customer Return

Coordinates the controlled reversal of a customer fulfillment while preserving original commercial, inventory and financial history. A return is a new business event caused by a prior sale; it is not deletion or mutation of the original sale. A CreditNote is the separate financial consequence. Customer service, reverse logistics, warehouse receiving, quality, inventory, credit processing, accounts receivable and audit. SalesOrder/SalesOrderLine identify original demand, Shipment identifies prior logistics, Invoice identifies financial claims, CustomerReturnLine identifies returned quantities,…

Readable by every signed-in person.

Fields:
  - **Return Number** (required) — The number the customer and warehouse quote for the return, often called an RMA number. Identifies the return for customer service, warehouse and finance operations. Used in return authorization, transport, receiving, inspection, credit an…
  - **Status** (required, one of the Customer Return Status values) — Where the return stands, from request and authorisation through transport, receipt, inspection and completion. Moved by customer service and the warehouse; it controls what may happen next but does not itself change stock or invoices. Bein…
  - **Return Date** (required) — Date and time the return event was initiated or recognized. Anchors return chronology independently from receipt and credit-note dates. Used for service metrics, logistics, audit and policy evaluation. Distinct from shipment, receipt, disp…
  - **Reason Code** — Business reason supplied for the customer return. Explains why goods or services are being returned. Used for approval, quality, analytics, warranty and customer service. May differ from the financial CreditNote.reasonCode. Supports eligib…
  - **Notes** — Free-text remarks about the return, such as damage seen on arrival or what the customer said. Written by customer service or warehouse staff for colleagues and audit; the facts that matter are held in structured fields. Captures informatio…
  - **Customer** (required, a Customer) — Customer requesting or receiving the return process. Identifies the party associated with the reverse transaction. Supports authorization, logistics, credit and customer service. Supplies party eligibility and financial context.
  - **Sales Order** (a Sales Order) — Original sales commitment associated with the returned goods or services. Connects reverse fulfillment to the original customer demand. Supports eligibility and fulfillment reconciliation. Provides original commitment context for return va…

Line items — **Customer Return Line**: kept inside each Customer Return and reached by opening it, never on their own. Quantity-level return evidence connecting returned goods to original fulfillment, disposition, inventory and financial adjustment. CustomerReturnLine explains exactly what quantity came back and what happened to it. It does not itself move inventory or issue a credit. Reverse logistics, quality, in…

### Customer Return Line Disposition

The values of customer return line disposition, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Customer Return Status

The values of customer return status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Department

A unit of an organisation that groups people, positions, responsibilities and work. Departments are how people are organised day to day. They define reporting lines, budgets and responsibilities. Defined by HR and management; assigned to people and positions; used in reporting and approvals. A department belongs to an Organization (or one of its business units). Code and identity stay stable. Reorganisations are recorded explicitly so earlier reports do not change. The Accounts Payable department of the finance function.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short code of the department, such as FIN-AP. Used in postings and reports; kept stable.
  - **Name** (required) — The name of the department as the organisation calls it, such as Finance or Field Operations. Entered by an administrator; shown in organisation charts, on documents and in reports that group people and costs by department.
  - **Organization** (required, a Organization) — Chosen when the department is created; reporting lines, headcount and budgets roll up through the organisation it belongs to. The organisation the department belongs to. Exactly one organisation: a department is part of a single organisati…

### Discount Rule

Defines reusable discount policy while leaving the actual applied discount as transaction evidence. A DiscountRule is a pricing policy; it is not the discount amount recorded on an order or invoice. Supports customer pricing, promotions, contracts, sales orders, purchase agreements, and invoicing. Product and pricing context determine the eligible base. DiscountRule determines the reduction. Tax rules then operate on the applicable taxable base according to jurisdiction and policy. Product/price → eligible discount rule → calculate discount → gross amount minus discount → taxable base → tax →…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Business identifier for the discount rule. Used in configuration, pricing, order entry, promotions, contracts, and integrations. Identifies the reusable rule, not its eventual transaction result. Allows a qualifying transaction to resolve…
  - **Name** (required) — The descriptive name of the rule, such as Volume discount 10%. Used by business users when configuring or reviewing pricing. Describes the policy represented by the rule. Makes discount selection understandable during price determination.
  - **Method** (required, one of the Discount Rule Method values) — The value is a percentage taken off the price. The value is a fixed amount in the rule's currency taken off the price. Defines how the discount is calculated. Determines whether the rule reduces an amount by a percentage or fixed monetary…
  - **Value** (required) — The size of the discount, read as a percentage or a money amount depending on the rule's method. Set by pricing staff; for a percentage method it is the percent taken off, for a fixed-amount method it is money in the rule's currency. For P…
  - **Currency** (a Currency) — Currency applicable when the discount method is FIXED_AMOUNT. Defines the denomination of a fixed discount. Not required for percentage discounts. Enables fixed discounts to be compared with the transaction's monetary base under valid curr…
  - **Priority** — Ordering value used when multiple discount rules qualify. Supports deterministic discount selection or stacking policy. Priority does not itself authorize stacking; the applicable pricing policy must define whether rules can combine. Helps…
  - **Status** (required, one of the Discount Rule Status values) — Being defined; not yet applied. Applied to qualifying prices and transactions. Temporarily not applied; can be reactivated. No longer applied; kept so past prices can be explained. Controls whether the rule can be selected for new price ca…

### Discount Rule Method

The values of discount rule method, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Discount Rule Status

The values of discount rule status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Language

A language used for localisation, communication preferences, content and reporting. People read and write in different languages. A language record lets the application offer translations, remember preferences and tag content with the language it is written in. Loaded from the standard language registry; chosen on user profiles, documents and messages. Parties, users and content refer to a language; the language itself depends on nothing. Code and identity stay stable, and history is never silently rewritten. English, with code en.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The two-letter ISO 639-1 code of the language, such as en or de. Taken from the standard; unique; used in locale settings and APIs.
  - **Name** (required) — The English name of the language, such as French or Portuguese. Loaded from the language reference data; it is shown in language pick-lists and reports, while the code remains the identifier.

### Lead

A prospective customer or business opportunity before it has been qualified. Sales teams cannot chase every enquiry equally. A lead records a possible customer and where it came from, so the team can decide which are worth pursuing and measure how well each source performs. Created from forms, events, referrals or imports; qualified by sales; converted into a customer and opportunity or discarded; read by sales managers. A lead may identify a Party or Customer, is owned by a Party (the salesperson), and may become an Opportunity. A lead is new, goes through qualification, and ends qualified a…

Readable by every signed-in person.

Fields:
  - **Lead Number** (required) — The reference number that identifies this prospective customer or opportunity before it has been qualified. Allocated by the system when the lead is created; unique, never reused, and quoted by sales staff in follow-up and reports.
  - **Status** (required, one of the Lead Status values) — How far the sales team has worked the lead, from first contact to conversion or loss. Moved by sales as it is qualified; a qualified lead can be converted into an opportunity, while disqualified, converted and lost leads are not worked aga…
  - **Source** — Where the lead came from, such as web, event or referral. Chosen at capture; used to measure which channels produce customers.
  - **Estimated Value** — The potential revenue sales expects if the lead becomes a customer, in the lead's currency. Estimated by the salesperson and revised as the lead is qualified; sales managers use it to prioritise effort and forecast the pipeline.
  - **Party** (a Party) — The person or organisation the lead is about. Linked once the prospect is identified. At most one party; a lead may be captured before the prospect is identified. Keeps contact details in one place.
  - **Customer** (a Customer) — The customer record, once the lead has become one. Set on conversion. At most one customer. Records the outcome of conversion.
  - **Opportunity** (a Opportunity) — The opportunity created from the lead. Set on conversion. At most one opportunity. Links pipeline to the leads that created it.

### Lead Status

The values of lead status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Opportunity

A qualified potential commercial transaction that the sales team is working to win. The sales pipeline is made of opportunities. Each one records who might buy, how likely it is and what it is worth, so the team can focus effort and forecast revenue. Created when a lead is qualified; advanced through stages; won or lost; read by sales managers for forecasting. An opportunity is for a Customer, owned by a Party (the salesperson), may come from a Lead and may end in a SalesOrder. An opportunity moves through qualification, discovery, proposal and negotiation and ends won or lost. A proposal may…

Readable by every signed-in person.

Fields:
  - **Opportunity Number** (required) — The human-readable reference of the sales opportunity, such as OPP-2026-0142, used in conversation and reporting. Allocated automatically on creation and kept unique; sales staff quote it in quotes, forecasts and pipeline reviews.
  - **Name** (required) — A descriptive name, such as Retail Co - Platform renewal. Entered by the salesperson; shown in pipeline views.
  - **Stage** (required, one of the Opportunity Stage values) — How far the opportunity has progressed. Moved by the salesperson as the deal advances; stage drives the default probability. Checking that the buyer has need, budget and authority. Understanding the buyer's requirements in detail. A propos…
  - **Probability** — The estimated chance of winning, as a percentage from 0 to 100. Set by the salesperson or defaulted from the stage; weighted forecasts multiply value by it.
  - **Expected Value** — The expected value of the deal if won. Estimated by the salesperson and refined as the proposal firms up.
  - **Expected Close Date** — The date by which the deal is expected to be decided. Set by the salesperson; pipeline reports bucket opportunities by it.
  - **Customer** (a Customer) — The customer who may buy. Set when the buyer is known. At most one customer; early opportunities may not yet be linked to one. Connects the pipeline to the account.
  - **Owner** (a Party) — The salesperson responsible. Assigned by sales management. At most one owner. Gives accountability for the deal.
  - **Sales Order** (a Sales Order) — The sales order placed when the opportunity is won. Linked on winning. At most one sales order. Connects forecast to actual revenue.

### Opportunity Stage

The values of opportunity stage, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Payment Term

Defines reusable commercial rules for when financial obligations become due and when early-settlement benefits or operational grace periods apply. PaymentTerm is a policy definition; an actual Invoice due date is a transaction-level result calculated from that policy and the applicable business event. Central to customer credit, supplier procurement, SalesOrder, PurchaseOrder, Invoice, receivables, payables, collections, cash forecasting, and payment scheduling. Customer and Supplier provide default role-level terms. SalesOrder and PurchaseOrder provide transaction context. Invoice derives an…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Business code for the payment-term policy, such as NET30 or DUE_ON_RECEIPT. Used in customer/supplier master data, order entry, procurement, invoices, reports, and integrations. Code identifies the reusable policy; it is not itself a due d…
  - **Name** (required) — Human-readable name of the settlement-timing policy. Used in configuration, forms, documents, reporting, and user selection. Describes the policy represented by code and paymentTermId. Makes commercial settlement conditions understandable…
  - **Due Days** (required) — Number of calendar days normally added to the applicable due-date base event to calculate contractual payment due date. Used by Invoice and receivables/payables processes to calculate expected settlement dates. Must be interpreted with due…
  - **Due Date Basis** (required, one of the Payment Term Due Date Basis values) — Defines the business event from which dueDays is calculated. Used by invoicing, accounts receivable, accounts payable, collections, and cash-flow forecasting. The basis event comes from the applicable transaction workflow and may differ be…
  - **Discount Days** — Number of days during which an early-payment discount may be available. Used by receivables, payables, payment scheduling, cash forecasting, and discount calculation. Applies only when an early-payment discount rate or amount is also defin…
  - **Discount Percent** — Percentage reduction available when the applicable obligation is settled within the discount window. Used for payment planning, invoice presentation, cash forecasting, and settlement calculation. Must be interpreted together with discountD…
  - **Grace Days** — Additional days allowed after the nominal due date before a policy considers the obligation overdue for a defined process. Used by collections, credit control, late-payment reporting, and supplier payment management. Grace period does not…
  - **Description** — Human-readable explanation of the payment policy and its operational interpretation. Used in configuration, audit, transaction review, and user guidance. Supplements structured rules and must not be the sole source for due-date calculation.
  - **Status** (required, one of the Payment Term Status values) — Controls whether the payment-term policy can be selected for new transactions. Used by customer/supplier maintenance, order capture, procurement, invoicing, and contracts. Retiring a term must not change historical transaction due dates th…

### Payment Term Due Date Basis

The values of payment term due date basis, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Payment Term Status

The values of payment term status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Pricing

A pricing definition or decision context that establishes base prices and the conditions under which they apply, before discounts, promotions, quotes or orders. Price is not a single number: it depends on product, customer, quantity and date. A pricing definition holds those conditions so orders and quotes can find the right base price and explain it. Maintained by pricing managers; looked up when quotes and orders are priced. Quotes, orders and discount rules start from the base price that this definition gives. Changes and retries preserve historical evidence and do not duplicate commercial…

Readable by every signed-in person.

Fields:
  - **Code** — The reference of the pricing definition, such as LIST-EU-2026. Assigned by pricing managers; used to select the pricing.

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
  - **Category** (a Product Category) — The category the product is classified in. Chosen on creation; used for assortment and reporting. At most one category; uncategorised products are allowed while being set up. Places the product in the catalogue hierarchy.
  - **Brand** (a Brand) — At most one brand under which the product is marketed. Commercial/manufacturer brand of Product. Supplies market identity independently of category. PIM, catalog, sales, sourcing and reporting. Brand lifecycle affects future catalog/master…

### Product Category

A node in the product taxonomy that organises products for assortment, reporting, purchasing, sales, stock and analysis. Categories let people browse and report on products in groups, such as Power Tools within Hardware. They make the catalogue navigable and let rules and reports apply to a whole group instead of product by product. Maintained by product management; chosen on each product; read by navigation, reports and rules. Categories form a tree through parent and child categories, and group Products. A category is active while used, can be inactive for a time, and is retired when withdr…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the category, such as PT-CORDLESS. Unique; used in imports and reports.
  - **Name** (required) — The name of the category as shown in navigation. Shown in catalogues and filters.
  - **Description** — A description of what kinds of products belong in the category and where its boundary lies. Written by product managers when the category is created; helps people classify new products consistently and choose between similar categories.
  - **Status** (required, one of the Product Category Status values) — Whether the category is in use. Set by product management; only ACTIVE categories are offered for new products. Available for classifying products. Temporarily not offered; can be reactivated. No longer used; kept for history. A final stat…
  - **Parent Category** (a Product Category) — The category that contains this one. Chosen to place the category in the tree. At most one parent; a top-level category has none. Lets reports roll up from sub-categories to broader groups.

### Product Category Status

The values of product category status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Promotion

A time-limited commercial offer that changes price, benefit, bundle or fulfilment terms for eligible customers without rewriting base pricing. A promotion lets the business run offers such as a seasonal discount, a bundle or free delivery, for a defined period and audience. Because it sits beside base pricing, ending it restores normal prices and the history of what each order received is kept. Defined by marketing or commercial staff; applied by order and pricing processes; read by sales and finance reporting. A promotion is applied to orders and invoices that qualify and is described by its…

Readable by every signed-in person.

Fields:
  - **Code** — The short code of the promotion, such as SPRING10. Entered by customers or staff where a code is needed; unique. Quoted on orders that received the offer.

### Prospect

A potential customer that has been identified but is not yet qualified as a lead or established as a customer. A prospect is the earliest stage of a sales relationship. Recording it lets the business keep track of who it hopes to win before any qualification effort is spent, and decide later whether to promote it to a lead or drop it. Created by sales or marketing from lists, events or referrals; read by sales when deciding whom to pursue. A prospect is the sales state of one party, which holds the name and contact details. A prospect is recorded, then either qualified onward as a lead or lef…

Readable by every signed-in person.

Fields:
  - **Code** — The short code of the prospect, such as PRS-0192. Used in lists and imports; unique where used. Read with the party's name to identify the prospect.
  - **Party** (required, a Party) — The prospect is the sales state of exactly one party, so contact details are held once on the party. Party represented by prospect. Supplies canonical person/organization identity. CRM qualification and deduplication. Qualification may cre…

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
  - **Organization** (a Organization) — The buying organization that issues the order and is committed to pay for it. Chosen when the order is created; decides which legal entity, budget, tax rules and approvals apply to the purchase. At most one organization: the buyer is a sin…
  - **Delivery Location** (a Location) — The place where the ordered goods are to be delivered or the service performed. Chosen by the buyer; receiving, logistics planning and the supplier's dispatch use it to route the delivery. At most one delivery location per order; a single…
  - **Payment Term** (a Payment Term) — The PaymentTerm this PurchaseOrder belongs to.

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

### Quotation

A commercial offer to a customer that specifies products or services, quantities, prices, terms and how long it is valid. A quotation lets the business commit to a price before an order exists. The customer can accept it within its validity, and the accepted lines carry over to the order so the agreed price and terms are not retyped or disputed later. Prepared by sales; submitted to the customer; read by sales managers, finance and order entry. A quotation is for one customer, may come from an opportunity, has one or more lines and may name payment terms. A quotation is drafted and submitted.…

Readable by every signed-in person.

Fields:
  - **Quotation Number** (required) — The number printed on the quotation, such as Q-2026-0415. Unique; quoted by the customer when accepting. Read by sales and order entry to find the offer.
  - **Quotation Date** (required) — Set to the issue date; the validity period is measured from it. Compared with the validity date. Records the business date associated with the quotation. It is used in chronology, eligibility, scheduling, reporting, and related business ru…
  - **Valid Until** — The last date on which the customer may accept the offer. Must not be before the quotation date; expired offers can no longer be accepted. Drives expiry.
  - **Status** (required, one of the Quotation Status values) — Where the quotation stands with the customer. Starts as DRAFT; moved by sales and by the customer's reply. Only submitted quotations can be accepted. Being prepared; the customer has not seen it. Sent to the customer and awaiting a reply.…
  - **Currency** (required, a Currency) — The currency the offer is made in. Chosen when the quotation is created; all line amounts are in it. Read with the total to state the offer's value.
  - **Total Amount** (required) — The total value of the offer, the sum of its lines less discounts. Calculated; must not be negative. Compared with the opportunity's expected value.
  - **Customer** (required, a Customer) — The customer the offer is made to. Chosen when the quotation is created. Exactly one customer; an offer is addressed to a single customer. Decides who may accept it and who is invoiced afterwards.
  - **Opportunity** (a Opportunity) — The sales opportunity the quotation was prepared for. Chosen when the offer follows a tracked opportunity. At most one opportunity; empty for an unsolicited offer. Lets the pipeline show which quotes belong to which deal.
  - **Payment Terms** (a Payment Term) — The payment terms offered with the quote. Chosen from the standard terms. At most one set of terms; empty uses the customer's default. Carried to the order and invoice if accepted.

Line items — **Quotation Line**: kept inside each Quotation and reached by opening it, never on their own. Preserves the commercial terms offered to a customer and the evidence needed when those terms become an order. QuotationLine is a transaction-time commercial snapshot, not merely a pointer to current pricing master data. Quotation, negotiation, approval, sales conversion, margin analysis, audit, an…

### Quotation Line Price Source

The values of quotation line price source, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Quotation Status

The values of quotation status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Sales Order

A customer's firm commitment to buy specified products or services on stated commercial terms and delivery needs. The sales order is the contract in operational form. It fixes what was ordered, by whom, at what price and for when, and drives allocation of stock, shipment and invoicing, so everything downstream can be traced back to what the customer agreed. Entered by sales or placed online; confirmed by the business; read by warehouse, shipping and finance. An order is for one customer, has lines, may name an organisation and delivery location, and is followed by shipments and invoices. An o…

Readable by every signed-in person.

Fields:
  - **Order Number** (required) — The number the customer sees, such as SO-10482. Unique; quoted on confirmations and invoices. Used to find the order from any following document.
  - **Order Date** (required) — The date and time the customer's order was placed. Set when the order is entered or received; sales reporting, delivery promises and payment terms are counted from it. Compared with the requested delivery date.
  - **Status** (required, one of the Sales Order Status values) — Being entered; not yet binding on either side. Accepted by the business; the commitment stands. Stock has been reserved to meet the order. Part of the order has been shipped. Everything ordered has been delivered. A final state. Withdrawn…
  - **Currency** (a Currency) — Chosen when the order is created; all amounts are in it. Read with the total. The currency id of the sales order: a link to another record the business records on it.
  - **Requested Delivery Date** — Entered from the customer's request; used to plan allocation and shipping. Compared with the promised and actual shipment dates. The requested delivery date of the sales order: a calendar date the business records on it.
  - **Total Amount** — The total value of the order after discounts and tax. Calculated from the lines. Matched with the invoiced amount.
  - **Customer** (required, a Customer) — An order is placed by a single customer, who is the one shipped to and invoiced unless stated otherwise. The customer who placed the order. Chosen when the order is created. Decides who is shipped to and invoiced.
  - **Organization** (a Organization) — The selling organisation that takes the order. Chosen when the business has several companies. At most one organisation. Decides whose accounts record the sale.
  - **Delivery Location** (a Location) — Chosen when delivery is not to the customer's default address. The place the goods are to be delivered. At most one location; empty uses the customer's address. Used by shipping.
  - **Payment Term** (a Payment Term) — The PaymentTerm this SalesOrder belongs to.

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
  - **Payment Terms** (a Payment Term) — Default supplier settlement policy. Used by PurchaseOrder Invoice payables payment scheduling and cash forecasting. Transaction or contract terms may override the default. Supplies default payable timing.
  - **Status** (required, one of the Supplier Status values) — The operational state of the supplier record, showing whether it can currently be dealt with. Set by procurement; ACTIVE suppliers appear in pickers, while blocked or retired ones are refused on new transactions. The supplier is open for b…
  - **Party** (required, a Party) — The party that holds the role. Set when the role is assigned and not changed. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back to the canonical identity.
  - **Role Type** (required, one of the Supplier Role Type values) — The kind of role the party plays, such as customer, supplier, employee or partner. Chosen when the role is assigned; decides which specialised record (customer, supplier and so on) carries its detail. The party buys goods or services from…
  - **Code** — An optional code for the role. Used by integrations that identify the role separately from the party. Identifies the role instance and must not replace Party or specialized role identifiers.
  - **Valid From** — The first date on which the role applies. Set when the role is assigned. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a newly established role.
  - **Valid To** — The last date on which the role still applies to the party. Set when the role ends, such as a contract expiry; empty while open-ended, and later use of the role is refused. Historical transactions may continue referencing the role after va…
  - **Organization** (a Organization) — Optional organizational scope in which the role is recognized. Supports multi-enterprise, subsidiary, business-unit, and operating-context scenarios. Zero means global/context-independent; one means explicitly scoped to one organization. D…

### Supplier Qualification Status

The values of supplier qualification status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Brand Status

- **ACTIVE** — In use and available for assignment to products.
- **INACTIVE** — Temporarily not offered, for example while a licence is renegotiated; it can be reactivated.
- **RETIRED** — No longer used; kept so historical sales and catalogue records remain accurate. A final state.

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

- **INDIVIDUAL** — A private consumer buying for personal use rather than for a business.
- **BUSINESS** — A company or other commercial organisation buying for its own operations.
- **GOVERNMENT** — A public authority or agency, often with its own procurement and payment rules.
- **INTERNAL** — Another unit of the organisation itself, supplied through internal sales.
- **OTHER** — A customer that fits none of the other kinds.

### Customer Return Line Disposition

- **PENDING** — No decision has been made yet.
- **RESTOCK** — The goods are put back into saleable stock.
- **QUARANTINE** — The goods are held apart pending a quality decision.
- **REPAIR** — The goods are sent for repair.
- **SCRAP** — The goods are written off and disposed of.
- **MIXED** — Different quantities of the line have different decisions.

### Customer Return Status

- **DRAFT** — Being prepared; not yet authorised.
- **AUTHORIZED** — Approved by the seller; the customer may send the goods back.
- **IN TRANSIT** — The goods are on their way back.
- **RECEIVED** — The goods have arrived at the returns location.
- **INSPECTION PENDING** — Waiting for the returned goods to be inspected.
- **DISPOSITIONED** — Each line has a decision: restock, quarantine, repair or scrap.
- **COMPLETED** — All physical and financial effects are done.
- **CANCELLED** — Withdrawn before completion; no effects remain.
- **EXCEPTION** — Held because something went wrong, such as damage or a missing item, and needs a decision.

### Customer Role Type

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

### Customer Status

- **ACTIVE** — A customer the organisation can sell to.
- **INACTIVE** — Dormant, with no new business expected; can be reactivated.
- **BLOCKED** — Held back from new business, for example for non-payment or compliance reasons.
- **RETIRED** — Closed for good; history is kept.

### Discount Rule Method

- **PERCENTAGE** — The value is a percentage taken off the price.
- **FIXED AMOUNT** — The value is a fixed amount in the rule's currency taken off the price.

### Discount Rule Status

- **DRAFT** — Being defined; not yet applied.
- **ACTIVE** — Applied to qualifying prices and transactions.
- **INACTIVE** — Temporarily not applied; can be reactivated.
- **RETIRED** — No longer applied; kept so past prices can be explained.

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

### Lead Status

- **NEW** — Captured but not yet worked.
- **QUALIFYING** — Being assessed for fit and interest.
- **QUALIFIED** — Confirmed as a genuine prospect.
- **DISQUALIFIED** — Judged not to be a fit. A final state.
- **CONVERTED** — Turned into a customer and opportunity. A final state.
- **LOST** — The prospect went elsewhere or stopped responding. A final state.

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

### Opportunity Stage

- **QUALIFICATION** — Checking that the buyer has need, budget and authority.
- **DISCOVERY** — Understanding the buyer's requirements in detail.
- **PROPOSAL** — A proposal or quote has been sent.
- **NEGOTIATION** — Terms and price are being negotiated.
- **WON** — The buyer has agreed to buy. A final state.
- **LOST** — The deal was lost to a competitor or abandoned. A final state.

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

### Payment Term Due Date Basis

- **INVOICE DATE** — Due date is calculated from the invoice issue/accounting date according to policy.
- **DELIVERY DATE** — Due date is calculated from the applicable delivery event.
- **RECEIPT DATE** — Due date is calculated from accepted receipt evidence, typically in procurement.
- **MONTH END** — Due date is calculated according to month-end terms and the configured day-offset interpretation.
- **CUSTOM** — A transaction or agreement-specific rule supplies the due-date basis and calculation.

### Payment Term Status

- **ACTIVE** — Available for normal new transaction use.
- **INACTIVE** — Temporarily unavailable for new selection.
- **RETIRED** — No longer available for new selection while historical references remain valid.

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

### Product Category Status

- **ACTIVE** — Available for classifying products.
- **INACTIVE** — Temporarily not offered; can be reactivated.
- **RETIRED** — No longer used; kept for history. A final state.

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

### Quotation Line Price Source

- **PRICE LIST** — Taken from the price list.
- **CONTRACT** — Taken from a contract with the customer.
- **CUSTOMER AGREEMENT** — Taken from a standing agreement with the customer.
- **MANUAL** — Entered by the salesperson.
- **PROMOTION** — Set by a promotion.
- **OTHER** — Determined some other way.

### Quotation Status

- **DRAFT** — Being prepared; the customer has not seen it.
- **SUBMITTED** — Sent to the customer and awaiting a reply.
- **ACCEPTED** — The customer accepted the offer. A final state.
- **REJECTED** — The customer declined it. A final state.
- **EXPIRED** — The validity date passed without a reply. A final state.
- **CANCELLED** — Withdrawn by the seller. A final state.

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

### Supplier Qualification Status

- **NOT REVIEWED** — No qualification review has been carried out for this supplier yet.
- **PENDING** — A review is under way and the supplier is not yet cleared to receive orders.
- **QUALIFIED** — The supplier has passed review and may be used for sourcing and ordering.
- **SUSPENDED** — Qualification is temporarily withdrawn pending resolution of an issue.
- **DISQUALIFIED** — The supplier failed or lost qualification and must not be used for new orders.

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

### Lead — Lead Lifecycle

Starts at **NEW**.
Final: **DISQUALIFIED**, **CONVERTED**, **LOST**.

Moves:
- NEW → QUALIFYING (Start Qualifying)
- NEW → DISQUALIFIED (Disqualify)
- NEW → LOST (Mark Lost)
- QUALIFYING → QUALIFIED (Qualify)
- QUALIFYING → DISQUALIFIED (Disqualify)
- QUALIFYING → LOST (Mark Lost)
- QUALIFIED → CONVERTED (Convert)
- QUALIFIED → DISQUALIFIED (Disqualify)
- QUALIFIED → LOST (Mark Lost)

### Opportunity — Opportunity Lifecycle

Starts at **QUALIFICATION**.
Final: **WON**, **LOST**.

Moves:
- QUALIFICATION → DISCOVERY (Advance)
- DISCOVERY → PROPOSAL (Advance)
- PROPOSAL → NEGOTIATION (Advance)
- NEGOTIATION → PROPOSAL (Revise Proposal)
- PROPOSAL → WON (Win)
- NEGOTIATION → WON (Win)
- QUALIFICATION → LOST (Lose)
- DISCOVERY → LOST (Lose)
- PROPOSAL → LOST (Lose)
- NEGOTIATION → LOST (Lose)

### Quotation — Quotation Lifecycle

Starts at **DRAFT**.
Final: **ACCEPTED**, **REJECTED**, **EXPIRED**, **CANCELLED**.

Moves:
- DRAFT → SUBMITTED (Submit)
- SUBMITTED → ACCEPTED (Accept)
- SUBMITTED → REJECTED (Reject)
- SUBMITTED → EXPIRED (Expire)
- DRAFT → CANCELLED (Cancel)
- SUBMITTED → CANCELLED (Cancel)

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

### Payment Term — Payment Term Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Product Category — Product Category Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Discount Rule — Discount Rule Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Customer Return — Customer Return Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → AUTHORIZED (Authorize)
- AUTHORIZED → IN TRANSIT (Ship Back)
- IN TRANSIT → RECEIVED (Receive)
- RECEIVED → INSPECTION PENDING (Send To Inspection)
- RECEIVED → DISPOSITIONED (Disposition)
- INSPECTION PENDING → DISPOSITIONED (Disposition)
- DISPOSITIONED → COMPLETED (Complete)
- AUTHORIZED → EXCEPTION (Raise Exception)
- IN TRANSIT → EXCEPTION (Raise Exception)
- RECEIVED → EXCEPTION (Raise Exception)
- INSPECTION PENDING → EXCEPTION (Raise Exception)
- EXCEPTION → AUTHORIZED (Resume)
- EXCEPTION → IN TRANSIT (Resume)
- EXCEPTION → RECEIVED (Resume)
- DRAFT → CANCELLED (Cancel)
- AUTHORIZED → CANCELLED (Cancel)
- EXCEPTION → CANCELLED (Cancel)

### Brand — Brand Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

## Roles

- **User** — reads 91 of 91 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
