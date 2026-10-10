---
name: maintenance-domain
description: What the records of Maintenance are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Maintenance, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Maintenance

Asset Maintenance and Reliability, built on the CEDM common foundation.

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

### Asset

Represents the long-lived business object for a durable resource whose identity, ownership, location, maintenance, financial treatment, and lifecycle must be managed over time. Asset is the instance-level concept used when an organization must manage a specific physical or accountable resource rather than merely a product type. A container, vehicle, machine, aircraft, or facility equipment item can be represented as an Asset when individual lifecycle and accountability matter. Used across asset management, maintenance, finance, depreciation, inventory, logistics, leasing, insurance, complianc…

Readable by every signed-in person.

Fields:
  - **Asset Number** (required) — The organization-assigned business identifier used to recognize an asset in operational and financial processes. Used by asset managers, maintenance teams, finance, warehouse operations, reports, documents, and users when referring to the…
  - **Name** (required) — A human-readable description of the asset used to identify it in lists, forms, reports, and operational communication. Supports search, maintenance screens, asset registers, reporting, and user recognition when an asset number alone is ins…
  - **Asset Type** (required) — Classifies the kind of durable resource represented by the asset, such as container, vehicle, machine, building equipment, or other capital-controlled resource. Drives asset policies, maintenance programs, depreciation treatment, reporting…
  - **Acquisition Date** — The business date on which the organization acquired or otherwise recognized control of the asset. Used for capitalization, depreciation start rules, asset aging, warranty analysis, lifecycle reporting, and ownership history. AcquisitionDa…
  - **Acquisition Cost** — The capitalized or recognized cost associated with acquiring the asset under the organization's accounting policy. Used as an input to capitalization, depreciation, book-value calculations, asset valuation, and financial reporting. Acquisi…
  - **Status** (required, one of the Asset Status values) — The lifecycle state describing whether the asset is planned, operational, temporarily unavailable, disposed, or retired. Controls operational availability, maintenance eligibility, reporting, depreciation policy, and downstream business ac…
  - **Serial Number** — The manufacturer or industry identifier permanently associated with the physical equipment when such an identifier exists. Used for equipment traceability, warranty, maintenance history, inspections, recalls, regulatory reporting, and phys…
  - **Owner** (a Organization) — Identifies the organization that legally or commercially owns the asset when ownership is relevant to the asset model. Used for ownership reporting, financial accountability, insurance, maintenance responsibility, leasing, and disposition.…
  - **Location** (a Location) — Identifies the current operational location at which the asset is recorded or physically situated. Used for maintenance dispatch, inventory visibility, asset tracking, utilization, inspections, and operational planning. Zero or one current…
  - **Product** (a Product) — Identifies the standardized product or equipment model from which the asset instance was created or classified. Used for technical specifications, spare-parts planning, maintenance standards, procurement, fleet classification, and analytic…
  - **Maintenance Plan** (a Maintenance Plan) — The MaintenancePlan this Asset belongs to.

### Asset Status

The values of asset status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Container

Represents a reusable intermodal freight container as a continuously identifiable physical logistics asset. Container is the equipment anchor connecting transport, depot, terminal, yard, maintenance, leasing, ownership, inventory, shipment, interchange, and commercial disposition processes. Used for gate events, yard placement, movement tracking, shipment assignment, inspection, repair, inventory, leasing, sale, scrap, and asset reporting. Party provides ownership context; Location provides present geographic context; YardSlot provides exact yard position; ContainerMovement provides chronolog…

Readable by every signed-in person.

Fields:
  - **Container Number** (required) — The industry-facing identification number assigned to the physical container. Used by carriers, terminals, depots, customs, gate operations, interchange messages, shipping documents, and customers to identify the equipment. It is the opera…
  - **Iso Code** — The standardized equipment code describing the container's equipment characteristics. Used for transport compatibility, yard allocation, vessel planning, depot handling, interchange, and equipment classification. Complements containerNumbe…
  - **Size Code** — The operational size classification of the container. Used for slot allocation, transport planning, pricing, capacity calculations, and TEU reporting. Size influences physical placement and transport constraints and should remain consisten…
  - **Container Type** — The functional equipment category of the container, such as dry, refrigerated, tank, or open-top equipment. Drives handling, power, inspection, safety, maintenance, shipment compatibility, and yard-placement rules. Type determines operatio…
  - **Tare Weight** — The empty weight of the container without cargo. Combined with cargo weight for gross-weight calculations, transport compliance, loading decisions, and interchange. It is an equipment characteristic and should be interpreted with the appli…
  - **Max Gross Weight** — The maximum permitted gross weight of the container and its cargo under the applicable equipment and operating rules. Used for loading, transport planning, safety, vessel/rail/road compliance, and handling decisions. Must be evaluated with…
  - **Manufacture Date** — The date on which the physical container equipment was manufactured. Used for equipment age, inspection, maintenance, depreciation, leasing, resale, and retirement analysis. Commonly combined with acquisition, depreciation, repair, and dis…
  - **Status** (required, one of the Container Status values) — The current lifecycle state governing whether the container is available for ordinary operational use. Controls equipment allocation, yard placement, shipment assignment, repair workflows, disposition, and exception handling. Status is an…
  - **Inventory Status** — The equipment's inventory classification within the owning or managing organization's asset inventory process. Supports fleet availability, ownership/lease reporting, depot inventory, and disposition workflows. Inventory classification is…
  - **Owner** (a Party) — Identifies the party that owns the physical equipment or is recorded as its commercial owner. Supports asset accounting, leasing, billing, maintenance responsibility, sale, and fleet reporting. At most one owner is represented at a point i…
  - **Current Location** (a Location) — Identifies the current physical or operational location of the container. Provides present-state visibility for routing, pickup, inventory, customer service, and exception handling. A container has at most one current location at a point i…

### Container Status

The values of container status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Equipment

A maintainable piece of equipment, linked to an asset where the financial record and the maintenance record describe the same thing. The finance team sees a capitalised asset; the maintenance team sees a machine with a service history. Equipment is the maintenance identity of that machine, so work orders and meters attach to it while the asset keeps the financial view. Created when a machine needs maintenance tracking; read by maintenance planners and technicians. Equipment may be linked to an Asset; maintenance work orders and meters refer to the equipment. Finalised financial and lifecycle…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the equipment record took effect, usually when it was put into service. Set at registration; maintenance history is counted from it.
  - **Asset** (a Asset) — The fixed asset that represents the same machine in the financial records. Set where the machine is capitalised. At most one asset; consumable or leased equipment may have none. Keeps maintenance and financial records of the same machine c…
  - **Spare Part** (a Spare Part) — The SparePart this Equipment belongs to.

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

### Failure

An observed failure of equipment or an asset, recording the symptom, when it occurred, its effect and the maintenance context. Reliability engineering starts with knowing what failed, when and how badly. A failure record keeps that observation separate from the repair work, so the history of what went wrong is not lost when it is fixed. Raised by operators or technicians when something breaks; linked to the repair work order; analysed for causes and trends. A failure concerns one piece of Equipment; repairs and cause analysis refer back to it. Finalised evidence is corrected by compensating o…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the failure occurred. Entered by the person reporting it; used to measure time between failures and downtime.
  - **Equipment** (required, a Equipment) — The equipment that failed. Chosen when the failure is raised. Exactly one equipment item: a failure is always a failure of something specific. Builds the failure history of each machine. Defines affected maintainable object.

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

### Maintenance Plan

A preventive or condition-based schedule and policy for maintaining assets. Equipment fails less and lasts longer when it is looked after on a plan. The plan states what to do and how often, so work orders are raised automatically instead of when something breaks. Defined by maintenance engineers; linked to assets and meters; read by planners who generate work orders from it. A plan applies to Assets and Products, and may be triggered by Meters. A plan is drafted, becomes active when approved, can be suspended, and is retired when replaced or no longer needed. Work orders already raised stay…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the plan, such as PM-FORK-500. Unique; used on work orders and reports.
  - **Name** (required) — The descriptive name of the maintenance plan, such as quarterly compressor service. Entered by maintenance engineering; shown in planners' lists and on the work orders the plan generates.
  - **Maintenance Type** (required, one of the Maintenance Plan Maintenance Type values) — The approach the plan takes to maintenance. Chosen at creation; decides how work is triggered. Work done at fixed intervals whether or not anything is wrong. Work done when a measured condition crosses a threshold. Work done when analysis…
  - **Frequency Value** — How often the plan's work is due, in the unit given by the frequency unit. Entered by the engineer; positive. For example 500 with unit hours.
  - **Frequency Unit** (one of the Maintenance Plan Frequency Unit values) — The unit in which the plan's frequency is measured, such as calendar days or operating hours. Chosen together with the frequency value; the scheduler uses it to decide when the next work order is due. Operating hours, counted from the asse…
  - **Status** (required, one of the Maintenance Plan Status values) — Whether the plan is currently generating maintenance work. Set by maintenance engineering; only ACTIVE plans create work orders, and RETIRED plans stay on record for the orders already raised. Being prepared; not generating work. In force;…

### Maintenance Plan Frequency Unit

The values of maintenance plan frequency unit, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Maintenance Plan Maintenance Type

The values of maintenance plan maintenance type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Maintenance Plan Status

The values of maintenance plan status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Maintenance Work Order

A controlled instruction and record for inspecting, maintaining, correcting or repairing an asset: what work is required, who does it, when, and how it was completed. Maintenance is only effective if it is directed and recorded. The work order is the instruction to a technician and the evidence of what was done, which feeds cost, history and reliability analysis. Raised from a request, a plan or a failure; planned and assigned; executed; completed; read by planners, technicians and finance. A work order concerns an Asset, may come from a MaintenancePlan, is assigned to a Party, takes place at…

Readable by every signed-in person.

Fields:
  - **Work Order Number** (required) — The number printed on the job card. Allocated on creation; unique; used by technicians and in cost reports. It is a business reference rather than the technical identity and remains the primary operational reference for people.
  - **Work Type** (required, one of the Maintenance Work Order Work Type values) — The kind of maintenance work this order covers, from routine inspection to emergency repair. Chosen on creation; it affects priority rules, approval and how cost and downtime are reported. A check of condition without repair. Planned work…
  - **Status** (required, one of the Maintenance Work Order Status values) — Where the work stands, from request through scheduling and execution to completion. Moved by planners and technicians; assigned work is started by a technician, and completed or cancelled orders can no longer be changed. Requested and wait…
  - **Priority** (required, one of the Maintenance Work Order Priority values) — How urgent the work is relative to other open work orders. Set when the work is requested and sometimes raised by planners; technicians are scheduled in priority order and critical orders interrupt routine work. Can wait until convenient.…
  - **Requested At** (required) — When the work was requested. Set on creation; response times are measured from it. It marks demand for maintenance, not necessarily the time work was scheduled, assigned, or started.
  - **Scheduled At** — The date and time at which the work is due to be carried out. Set by the planner when the order is scheduled; technician calendars are built from it and lateness is measured against it. It represents a plan and may differ from the actual e…
  - **Completed At** — The date and time at which the work was finished and the asset handed back. Set on completion; downtime, labour cost and compliance reports read it, and it should not precede the start of the work. Completion means the work-order scope has…
  - **Description** — What needs to be done. Written by the requester or planner and read by the technician. It complements structured workType, Asset, RepairEstimate, and MaintenancePlan information and should not be used as the sole source for critical machin…
  - **Asset** (a Asset) — The asset the work is for. Chosen when raised. At most one asset; some work covers a location or a group. Adds to the asset's maintenance history. Asset answers what is being maintained; MaintenanceWorkOrder answers what work is being requ…
  - **Maintenance Plan** (a Maintenance Plan) — The plan the work order came from. Set for planned maintenance. At most one plan. Links recurring work to its policy. MaintenancePlan defines recurring maintenance policy; the work order represents one executable occurrence of that policy.
  - **Assignee** (a Party) — The person or team responsible for doing the work. Assigned by the planner. At most one assignee at a time. Gives accountability for execution. Party supplies identity; its applicable role determines whether it acts as technician, maintena…
  - **Location** (a Location) — Where the work is done. Set when planned. At most one location. Helps dispatch. Location describes where work occurs and is distinct from the Asset being serviced.
  - **Repair Estimate** (a Repair Estimate) — The estimate the work is based on. Linked where a quote was approved. At most one estimate. Gives the cost baseline. RepairEstimate evaluates and authorizes the proposed repair decision; MaintenanceWorkOrder executes it. A work order must…
  - **Spare Part** (a Spare Part) — The SparePart this MaintenanceWorkOrder belongs to.

### Maintenance Work Order Priority

The values of maintenance work order priority, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Maintenance Work Order Status

The values of maintenance work order status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Maintenance Work Order Work Type

The values of maintenance work order work type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Meter

A physical or logical measuring point on an asset or at a location, used to drive condition, usage, billing, maintenance or operational decisions. Many decisions depend on a measured quantity such as running hours or temperature. A meter defines what is measured, in which unit and on what, and keeps the latest reading so maintenance and billing can act on it. Defined when measurement starts; updated by readings; read by maintenance planning and operations. A meter is attached to an Asset or Location, is expressed in a UnitOfMeasure and may trigger MaintenancePlans. A meter is drafted, active…

Readable by every signed-in person.

Fields:
  - **Meter Code** (required) — The code of the meter, such as FL-07-HRS. Unique; used in readings and imports. Operational identifier used on devices, work orders and reports. Distinct from manufacturer serial numbers and Asset identifiers.
  - **Meter Type** (required, one of the Meter Meter Type values) — The kind of quantity the meter measures, such as running hours, distance travelled, energy or temperature. Chosen when the meter is created; it decides the expected unit of measure and how maintenance plans read the value. Counts running o…
  - **Status** (required, one of the Meter Status values) — Whether the meter is in service and expected to receive readings, or has been faulted or withdrawn. Set by maintenance engineering as the meter is commissioned, repaired or removed; new readings are accepted only while active. Being define…
  - **Last Reading Value** — The most recent value recorded for the meter, held on the meter for quick reference without reading history. Updated automatically from new readings; maintenance plans compare it with thresholds, and it must match a stored reading. Current…
  - **Last Reading At** — When the most recent reading was taken. Updated with each reading; shows how current the value is. Indicates freshness of current meter state. Must correspond to the projected latest reading value.
  - **Asset** (a Asset) — The asset that the meter measures. Linked where the quantity belongs to equipment. At most one asset; a meter may instead measure a location. Lets usage trigger maintenance for the asset. Connects usage or condition evidence to a durable m…
  - **Location** (a Location) — The place that the meter measures. Linked where the quantity belongs to a place, such as a room temperature. At most one location. Ties the measurement to the site. Supports facility and utility measurement when no single Asset owns the me…
  - **Unit Of Measure** (required, a Unit Of Measure) — The unit in which the meter's values are expressed. Chosen at creation; readings must use it. Exactly one unit, so every reading is comparable. Prevents readings being mixed across units. Makes meter values quantitatively unambiguous.

### Meter Meter Type

The values of meter meter type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Meter Status

The values of meter status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Maintenance Plan** (a Maintenance Plan) — The MaintenancePlan this Product belongs to.

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

### Repair Estimate

Represents the controlled decision assessment between asset condition and the eventual repair or commercial disposition action. RepairEstimate is not the repair itself. It evaluates what is wrong, what it is expected to cost, and which outcome is economically or operationally appropriate. It therefore sits between inspection/condition evidence and downstream execution or disposition. Used by depot maintenance, fleet management, repair vendors, asset managers, finance, approval workflows, and predictive analytics. Historical estimates can also provide labeled data for disposition and sale-valu…

Readable by every signed-in person.

Fields:
  - **Estimate Number** (required) — The human-facing business reference for the repair assessment. Used by depot, maintenance, fleet, owners, approvers, customers, and reports. Unlike repairEstimateId, this is intended for business communication and documents.
  - **Revision** (required) — The version number of the technical and commercial assessment. Preserves changes in damage scope, material pricing, labor assumptions, disposition, or approval values. A revision is historical decision context and must not silently overwri…
  - **Estimate Date** (required) — The business date on which this estimate revision was prepared or recognized. Supports approval chronology, estimate aging, repair-cycle analysis, and financial reporting. Distinct from Container manufacture date, damage date, repair compl…
  - **Status** (required, one of the Repair Estimate Status values) — The lifecycle state of the assessment and its authorization status. Controls preparation, review, approval, rejection, completion, and cancellation workflows. Estimate status describes the decision artifact; it does not mean that repair ex…
  - **Disposition** (one of the Repair Estimate Disposition values) — The intended operational or commercial outcome selected after evaluating condition and economics. Determines whether the asset returns to lease-related use, enters a sale process, is scrapped, requires repair, or remains pending. Dispositi…
  - **Estimated Repair Amount** — The estimated cost of the repair scope represented by the assessment. Supports repair-vs-sale-vs-scrap economics, approval thresholds, budgets, and predictive analysis. Should reconcile to RepairEstimateLine values and Currency; it is an e…
  - **Estimated Sale Amount** — The expected realization from selling the asset under the current valuation assumptions. Supports disposition economics and comparison with repair cost, book value, residual value, and lease alternatives. It is decision-support data, not a…
  - **Approved Amount** — The monetary amount explicitly authorized by the approval decision. Establishes the financial boundary for downstream repair execution or approved disposition activity. Approval amount is not the same as final actual maintenance cost; actu…
  - **Currency** (a Currency) — The currency that gives monetary estimate values their denomination. Required to interpret repair, sale, and approval amounts consistently. Currency qualifies amounts; it does not identify ownership, supplier, or asset identity.
  - **Container** (required, a Container) — The physical container whose condition, repair economics, and disposition are being assessed. Connects the estimate to equipment identity, current location, ownership/lease context, condition, and maintenance history. Exactly one Container…
  - **Organization** (a Organization) — The organization responsible for preparing, owning, or approving the assessment. Supports depot responsibility, approval authority, cost attribution, and reporting. Optional when organization is inherited from operating context. This organ…

Line items — **Repair Estimate Line**: kept inside each Repair Estimate and reached by opening it, never on their own. Represents one actionable or evaluative item within a repair estimate, connecting observed asset condition to proposed repair work and estimated cost. RepairEstimateLine is the detailed evidence behind the overall repair decision. It can identify what is damaged, where it is damaged, what repair is…

### Repair Estimate Disposition

The values of repair estimate disposition, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Repair Estimate Status

The values of repair estimate status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Spare Part

Maintained by maintenance planners and read by storekeepers and buyers when selecting parts for a work order or deciding what to stock. Maintenance-specific role for an inventory Product used to repair or service assets and equipment. Connect maintenance planning and execution to canonical product and inventory semantics without creating a second material master. A SparePart states that a Product is approved or expected for maintenance use. Used for preventive/corrective maintenance planning, work-order materials, critical-spares stocking, procurement and maintenance costing. Product provides…

Readable by every signed-in person.

Fields:
  - **Criticality** (required, one of the Spare Part Criticality values) — How seriously maintenance and operations suffer if this part is not available when needed. Set by maintenance planners per part; higher criticality justifies safety stock and faster replenishment, and it does not replace asset criticality.…
  - **Product** (required, a Product) — Each spare part designation is for exactly one product. Canonical Product used as spare part. Supplies item identity, UOM and inventory semantics. Procurement, stock and maintenance issue. SparePart is a role/designation and must not dupli…

### Spare Part Criticality

The values of spare part criticality, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Asset Status

- **PLANNED** — The asset is expected to enter service or be recognized operationally but is not yet active.
- **ACTIVE** — The asset is available for its intended business use subject to normal operational constraints.
- **UNDER MAINTENANCE** — The asset is temporarily undergoing maintenance and may be unavailable or restricted from normal use.
- **HELD** — The asset is intentionally retained but is not currently available for normal productive use, often pending inspection, disposition, or another decision.
- **DISPOSED** — The organization has completed the disposition process and no longer treats the asset as an active managed resource.
- **RETIRED** — The asset has been withdrawn from operational use, while historical records may remain available for audit and analysis.

### Container Status

- **ACTIVE** — Equipment is available for normal assignment subject to operational constraints.
- **IN REPAIR** — Equipment is undergoing repair or maintenance and should normally be excluded from ordinary transport assignment.
- **DAMAGED** — Equipment has known damage and requires assessment, restriction, or repair before normal use.
- **SOLD** — Ownership or commercial disposition has transferred through a sale process and the equipment is no longer ordinary available inventory unless explicitly returned.
- **SCRAPPED** — Equipment has been designated for disposal and must not be assigned to operational movements.
- **LOST** — Equipment cannot currently be located and requires investigation or recovery.
- **RETIRED** — Equipment has permanently left normal operational service without necessarily being sold or scrapped.

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

### Maintenance Plan Frequency Unit

- **HOURS** — Operating hours, counted from the asset's meter.
- **DAYS** — Calendar days between jobs.
- **WEEKS** — Calendar weeks between jobs.
- **MONTHS** — Calendar months between jobs.
- **MILES** — Distance travelled, read from the vehicle's odometer.
- **CYCLES** — Operating cycles, such as starts or lifts.
- **OTHER** — Any other measure of use, described in the plan.

### Maintenance Plan Maintenance Type

- **PREVENTIVE** — Work done at fixed intervals whether or not anything is wrong.
- **CONDITION BASED** — Work done when a measured condition crosses a threshold.
- **PREDICTIVE** — Work done when analysis predicts a failure is likely.
- **INSPECTION** — A check that may lead to further work.

### Maintenance Plan Status

- **DRAFT** — Being prepared; not generating work.
- **ACTIVE** — In force; work orders are raised from it.
- **SUSPENDED** — Paused; no new work orders.
- **RETIRED** — Withdrawn. A final state.

### Maintenance Work Order Priority

- **LOW** — Can wait until convenient.
- **NORMAL** — To be done in the usual course.
- **HIGH** — To be done soon.
- **CRITICAL** — Needed at once because of safety or a stopped process.

### Maintenance Work Order Status

- **OPEN** — Requested and waiting to be planned.
- **PLANNED** — Scheduled for a date with the work defined.
- **ASSIGNED** — Given to a technician or crew.
- **IN PROGRESS** — Work has started on the asset.
- **ON HOLD** — Paused, for example while waiting for parts.
- **COMPLETED** — Done and signed off. A final state.
- **CANCELLED** — Withdrawn before completion. A final state.

### Maintenance Work Order Work Type

- **INSPECTION** — A check of condition without repair.
- **PREVENTIVE** — Planned work to prevent failure.
- **CORRECTIVE** — Work to correct a defect found earlier.
- **REPAIR** — Work to repair a failure.
- **EMERGENCY** — Urgent work to restore a critical asset.

### Meter Meter Type

- **HOURS** — Counts running or operating time, used for equipment serviced by hours of use.
- **DISTANCE** — Counts distance travelled, such as the kilometres on a vehicle odometer.
- **CYCLES** — Counts completed operating cycles, such as press strokes or door openings.
- **ENERGY** — Measures energy consumed or produced, such as kilowatt hours on an electricity meter.
- **VOLUME** — Measures a quantity of fluid or gas passed, such as litres of fuel or water.
- **COUNT** — Counts discrete items or events, such as units produced or visitors passing a gate.
- **PRESSURE** — Measures pressure in a system, such as a boiler or hydraulic line, to watch for out-of-range conditions.
- **TEMPERATURE** — Measures temperature of equipment or a room, used to detect overheating or cold-chain breaches.
- **OTHER** — Measures a quantity not covered by the other types; the unit of measure then defines its meaning.

### Meter Status

- **DRAFT** — Being defined; not yet read.
- **ACTIVE** — In use and being read.
- **OUT OF SERVICE** — Faulty or removed temporarily.
- **RETIRED** — No longer used. A final state.

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

### Repair Estimate Disposition

- **LEASE** — Asset is intended to remain available for lease-related use after the applicable process.
- **SALE** — Asset is intended for commercial sale rather than return to the active lease fleet.
- **SCRAP** — Asset is intended for disposal and removal from productive inventory.
- **REPAIR** — Repair is justified and maintenance execution is required or expected.
- **HOLD** — No final disposition has been executed; further information or approval is required.

### Repair Estimate Status

- **DRAFT** — Assessment is still being prepared.
- **SUBMITTED** — Assessment is awaiting review or authorization.
- **APPROVED** — The proposed decision/scope has been authorized; execution remains a separate process.
- **REJECTED** — The proposed assessment or decision was not authorized.
- **COMPLETED** — The estimate's decision process is concluded.
- **CANCELLED** — Assessment was intentionally terminated and must not drive active downstream work.

### Spare Part Criticality

- **LOW** — Unavailability causes little disruption; the part can be ordered when needed.
- **MEDIUM** — Unavailability delays maintenance but operations can continue for a while.
- **HIGH** — Unavailability seriously disrupts maintenance or output, so stock is normally held on site.
- **CRITICAL** — Unavailability stops production or creates a safety risk, so stock must always be held.

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

A record with a lifecycle moves only along the moves listed — the application refuses any other, for every role. A **final** state is a completed transaction: the application refuses every change to such a record and every deletion of it, including an administrator's. Say so when a record is final.

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

### Asset — Asset Lifecycle

Starts at **PLANNED**.
Final: **DISPOSED**, **RETIRED**.

Moves:
- PLANNED → ACTIVE (Activate)
- ACTIVE → UNDER MAINTENANCE (Mark Under Maintenance)
- UNDER MAINTENANCE → ACTIVE (Return To Service)
- ACTIVE → HELD (Mark Held)
- HELD → ACTIVE (Resume)
- ACTIVE → DISPOSED (Mark Disposed)
- UNDER MAINTENANCE → DISPOSED (Mark Disposed)
- HELD → DISPOSED (Mark Disposed)
- PLANNED → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- UNDER MAINTENANCE → RETIRED (Retire)
- HELD → RETIRED (Retire)

### Meter — Meter Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → OUT OF SERVICE (Take Out Of Service)
- OUT OF SERVICE → ACTIVE (Return To Service)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- OUT OF SERVICE → RETIRED (Retire)

### Maintenance Plan — Maintenance Plan Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → SUSPENDED (Suspend)
- SUSPENDED → ACTIVE (Resume)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- SUSPENDED → RETIRED (Retire)

### Maintenance Work Order — Maintenance Work Order Lifecycle

Starts at **OPEN**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- OPEN → PLANNED (Plan)
- PLANNED → ASSIGNED (Assign)
- OPEN → ASSIGNED (Assign)
- ASSIGNED → IN PROGRESS (Start)
- IN PROGRESS → COMPLETED (Complete)
- ASSIGNED → ON HOLD (Hold)
- IN PROGRESS → ON HOLD (Hold)
- ON HOLD → ASSIGNED (Resume)
- ON HOLD → IN PROGRESS (Resume)
- OPEN → CANCELLED (Cancel)
- PLANNED → CANCELLED (Cancel)
- ASSIGNED → CANCELLED (Cancel)
- ON HOLD → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)

### Repair Estimate — Repair Estimate Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **REJECTED**, **CANCELLED**.

Moves:
- DRAFT → SUBMITTED (Submit)
- SUBMITTED → APPROVED (Approve)
- APPROVED → COMPLETED (Complete)
- DRAFT → REJECTED (Reject)
- SUBMITTED → REJECTED (Reject)
- APPROVED → REJECTED (Reject)
- DRAFT → CANCELLED (Cancel)
- SUBMITTED → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)

### Container — Container Lifecycle

Starts at **ACTIVE**.
Final: **SOLD**, **SCRAPPED**, **LOST**, **RETIRED**.

Moves:
- ACTIVE → IN REPAIR (Mark In Repair)
- IN REPAIR → DAMAGED (Mark Damaged)
- ACTIVE → SOLD (Mark Sold)
- IN REPAIR → SOLD (Mark Sold)
- DAMAGED → SOLD (Mark Sold)
- IN REPAIR → SCRAPPED (Mark Scrapped)
- DAMAGED → SCRAPPED (Mark Scrapped)
- IN REPAIR → LOST (Mark Lost)
- DAMAGED → LOST (Mark Lost)
- ACTIVE → RETIRED (Retire)
- IN REPAIR → RETIRED (Retire)
- DAMAGED → RETIRED (Retire)

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

- **User** — reads 69 of 69 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
