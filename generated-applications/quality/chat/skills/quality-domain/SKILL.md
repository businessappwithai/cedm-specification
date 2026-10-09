---
name: quality-domain
description: What the records of Quality are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Quality, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Quality

Quality Management, built on the CEDM common foundation.

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

### Certificate Of Analysis

Controlled certificate presenting quality evidence for governed material. CertificateOfAnalysis is a released representation of underlying evidence, not a substitute for QualityInspection or QualityMeasurement. Supplier quality, customer documentation, regulated release, shipments, receipts, compliance, audit, and integrations. Inspections and measurements supply evidence; Product and receipt/shipment provide material context. Draft → approved → issued → superseded/void under controlled document history. Changes to open source evidence invalidate draft/approved certificates for revalidation;…

Readable by every signed-in person.

Fields:
  - **Certificate Number** (required) — The unique number printed on the certificate. Controlled number used to identify the issued certificate. Documents, search, exchange, and audit. Distinct from inspection and shipment numbers.
  - **Issued At** — When the certificate was issued to its recipient. Establishes when the quality statement became externally or operationally effective. Compliance, customer documentation, and audit. Required once status is ISSUED.
  - **Status** (required, one of the Certificate Of Analysis Status values) — Being prepared from the inspection results; not yet approved. Approved by quality but not yet released to the customer. Released to the recipient; it now stands as evidence. Replaced by a corrected certificate; kept for history. Withdrawn…

### Certificate Of Analysis Status

The values of certificate of analysis status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Corrective Action

Represents a controlled quality action from assignment through implementation and independent effectiveness verification. Nonconformance records the problem; CorrectiveAction records what is done to contain, correct or prevent it; CorrectiveActionVerification records whether the action worked. CAPA, supplier quality, compliance, audit, recurrence prevention and quality improvement. The action connects Nonconformance with responsible Party and one or more CorrectiveActionVerification records. Physical and financial consequences remain represented by their own transactions. Open → assigned → in…

Readable by every signed-in person.

Fields:
  - **Action Number** (required) — Human-facing corrective-action reference. Identifies the action for quality teams, responsible parties and auditors. Communication, reporting, CAPA tracking and integration. Distinct from the originating nonconformance number and verificat…
  - **Action Type** (required, one of the Corrective Action Action Type values) — Immediate action to stop the problem spreading, such as quarantining stock. Fixing the specific nonconforming item or condition. Removing the root cause so the problem does not recur. Action to prevent a similar problem elsewhere before it…
  - **Description** (required) — Detailed statement of what the action will accomplish. Defines scope, intended outcome and work required to address the quality issue. Assignment, execution, audit and effectiveness assessment. Must remain traceable to the associated Nonco…
  - **Status** (required, one of the Corrective Action Status values) — Raised but not yet assigned. Given to an owner, who has not started. Being carried out. Done and waiting for an effectiveness check. Done and, where required, verified effective. Withdrawn and not carried out. Lifecycle state of the action…
  - **Due Date** — Target date for action implementation. Defines when the responsible party is expected to complete implementation. Work planning, escalation, SLA reporting and quality governance. Distinct from completedDate and verificationDate. Supports o…
  - **Completed Date** — Date implementation was formally completed. Records when the action work was declared complete, subject to any required effectiveness verification. CAPA metrics, audit and chronology. Does not replace verification evidence where effectiven…
  - **Nonconformance** (a Nonconformance) — Quality issue that caused or requires this action. Connects the action to the deviation and its containment, disposition and closure requirements. CAPA traceability, root-cause analysis and audit. Supplies the problem context the action is…
  - **Owner** (a Party) — Party accountable for implementing the action. Identifies the responsible person or organization for execution. Assignment, escalation and accountability. Owns implementation evidence and completion proposal.

### Corrective Action Action Type

The values of corrective action action type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Corrective Action Status

The values of corrective action status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Corrective Action Verification

Provides independent auditable evidence that a corrective or preventive action achieved its intended result. CorrectiveAction records what was done; CorrectiveActionVerification records whether it worked; Nonconformance records the original quality problem. CAPA supplier quality compliance audit recurrence prevention and issue closure. Verification closes the evidence loop between Nonconformance and CorrectiveAction without conflating implementation with effectiveness. Nonconformance → CorrectiveAction → implementation → effectiveness verification → effective closure or ineffective/reopened a…

Readable by every signed-in person.

Fields:
  - **Verification Number** (required) — Human-facing verification reference. Identifies the verification event for quality operations and audit. Reporting approval audit and supplier communication. Distinct from actionNumber and nonconformance number. Correlates verification evi…
  - **Verification Date** (required) — Date and time effectiveness verification was performed. Establishes when evidence was evaluated against the intended outcome. Audit SLA quality reporting and closure chronology. Anchors the verification event.
  - **Result** (required, one of the Corrective Action Verification Result values) — The action achieved its intended result and the problem has not recurred. The action helped but did not fully remove the problem; further action is needed. The action did not work and the problem persists or has returned. Effectiveness can…
  - **Status** (required, one of the Corrective Action Verification Status values) — Raised but not started. The verification is being carried out. Finished with a result and findings recorded. Reopened because new evidence or a recurrence needs further verification. Withdrawn and not carried out. Lifecycle state of verifi…
  - **Findings** (required) — Evidence and observations supporting the verification result. Explains what was checked and why the result was reached. Audit quality review supplier improvement and recurrence analysis. Supports effectiveness decision.
  - **Verified By** (required, a Party) — Party accountable for performing or approving effectiveness verification. Establishes accountability for the verification decision. Audit trail quality governance and segregation of duties. Provides verification authority.
  - **Nonconformance** (a Nonconformance) — Nonconformance for which the action was established. Connects effectiveness evidence to the original quality deviation. Issue closure and recurrence analysis. Provides context for determining whether the underlying issue is controlled.
  - **Corrective Action** (required, a Corrective Action) — Corrective action being evaluated. Connects verification evidence to the action whose implementation is assessed. CAPA closure audit and quality reporting. Verification result controls whether action can be completed.

### Corrective Action Verification Result

The values of corrective action verification result, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Corrective Action Verification Status

The values of corrective action verification status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Inspection Sample

Execution record of the actual sample selected for a governed quality inspection. InspectionSample separates sampling policy from the physical or logical sample actually selected. SamplingPlan and SamplingRule define how selection should occur; InspectionSample records what was actually selected; QualityMeasurement records observations from it. Incoming inspection, supplier quality, acceptance sampling, laboratory testing, process quality, chain of custody, compliance, and audit. QualityInspection is the parent execution; SamplingPlan and SamplingRule define selection policy; Product and Unit…

Readable by every signed-in person.

Fields:
  - **Sample Number** (required) — Human-facing identifier for the selected inspection sample. Provides an operational reference for labeling, handling, testing, and audit. Inspection execution, laboratory handling, reports, and traceability. Identifies the executed sample…
  - **Selected At** (required) — Time at which the sample was selected from the eligible population. Establishes when the actual sampling event occurred. Chain of custody, audit, reproducibility, and inspection chronology. Distinct from QualityInspection.inspectionDate an…
  - **Quantity** (required) — Quantity represented by the selected sample. States how much material or how many units the sample represents under its unit of measure. Sample reconciliation, measurement scope, inventory traceability, and audit. Must reconcile with the e…
  - **Unit Of Measure** (required, a Unit Of Measure) — Unit in which the sample quantity is expressed. Gives semantic meaning to the selected sample quantity. Reconciliation, reporting, conversion, and audit. Must be compatible with the source population and governing sampling configuration.
  - **Status** (required, one of the Inspection Sample Status values) — Drawn from the population and waiting to be tested. Under test; measurements are being taken. Testing finished and results recorded. Found unsuitable, for example damaged or mislabelled, and excluded. A final state. Discarded or consumed a…
  - **Selection Basis** — Evidence or description of how this particular sample was selected. Preserves the operational selection basis needed to reproduce or audit the sampling event. Compliance, audit, supplier disputes, and statistical review. Complements the au…
  - **Quality Inspection** (required, a Quality Inspection) — Exactly one inspection: a sample is drawn for a particular inspection and has no meaning outside it. QualityInspection for which this sample was selected. Provides the execution context and population being inspected. Sample traceability,…
  - **Sampling Plan** (a Sampling Plan) — SamplingPlan governing the sample-selection event. Preserves the reusable sampling policy applied at execution time. Audit, reproducibility, analytics, and change-impact analysis. A sample may reference zero or one sampling plan when sampl…
  - **Sampling Rule** (a Sampling Rule) — SamplingRule used to determine this sample selection. Identifies the exact conditional rule that determined sample quantity and acceptance logic. Audit, reproducibility, sample reconciliation, and inspection completion. A sample may have z…

### Inspection Sample Status

The values of inspection sample status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Nonconformance

Represents a controlled quality deviation and its investigation, containment, disposition and corrective-action lifecycle. Nonconformance captures the quality problem; QualityInspection provides test evidence; ReturnDisposition records controlled operational outcomes; SupplierReturn provides physical response; CorrectiveAction addresses recurrence; CorrectiveActionVerification proves effectiveness. Supplier quality, incoming inspection, returns, CAPA, compliance, audit, supplier performance and risk management. A quality issue may begin at receiving, inspection, customer/supplier return or ex…

Readable by every signed-in person.

Fields:
  - **Number** (required) — The unique reference by which the deviation is cited in reports and corrective actions. Identifies the issue for quality and supplier operations. Audit, reporting, CAPA and dispute handling. Human-recognizable issue reference.
  - **Severity** (required, one of the Nonconformance Severity values) — How serious the deviation is. Set by quality at review; drives containment and escalation. Minor deviation with little effect. Notable deviation needing correction. Serious deviation affecting product or customers. Dangerous or legally sig…
  - **Status** (required, one of the Nonconformance Status values) — Where the nonconformance is in its handling. Moved by quality staff. Recorded but not yet reviewed. Being investigated. Affected goods are isolated so the problem cannot spread. Corrective actions are under way to remove the cause. Resolve…
  - **Description** (required) — Detailed explanation of the deviation. States what requirement or expected result was not met. Investigation, supplier communication, CAPA and audit. Provides issue evidence.
  - **Detected At** (required) — Time the deviation was detected. Establishes chronology for containment and corrective action. Audit and quality analytics. Anchors issue occurrence.
  - **Closed At** — Time the issue was formally closed. Establishes completion chronology. Quality performance and audit. Required for closure.
  - **Inspection** (a Quality Inspection) — Inspection that detected or evidenced the deviation. Connects issue to objective quality evaluation. Investigation and audit. Provides detection evidence.
  - **Owner** (a Party) — Party accountable for issue management. Identifies responsible quality owner or organizational party. Escalation, CAPA and audit. Owns investigation and closure.

### Nonconformance Severity

The values of nonconformance severity, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Nonconformance Status

The values of nonconformance status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Quality Characteristic

Reusable definition of one quality property that can be configured by quality plans and observed through quality measurements. QualityCharacteristic answers what property is being evaluated. It intentionally does not own plan-specific limits because the same property can have different acceptance criteria for different products, suppliers, processes, or inspection plans. Quality master data, inspection design, supplier quality, incoming inspection, process control, laboratory testing, compliance, analytics, and audit. QualityCharacteristic is the reusable semantic definition; QualityPlanChara…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short code of the characteristic, such as WEIGHT or PURITY. Provides a stable human-readable identifier such as WEIGHT, TEMPERATURE, LENGTH, or APPEARANCE. Used in quality plans, measurements, reports, integrations, and validation rule…
  - **Name** (required) — The name of the property being checked, as inspectors know it. States what property the characteristic represents in language understandable to quality personnel and other users. Used in quality-plan authoring, inspection screens, reports,…
  - **Description** — Detailed explanation of the characteristic and its intended interpretation. Clarifies exactly what is observed and prevents different processes from interpreting the same code differently. Quality-plan design, inspection execution, audit,…
  - **Data Type** (required, one of the Quality Characteristic Data Type values) — Data representation expected for observations of this characteristic. Determines whether measurements are numeric or categorical and therefore which evaluation rules are valid. Controls QualityMeasurement value selection, validation, user-…
  - **Status** (required, one of the Quality Characteristic Status values) — Lifecycle state of the reusable characteristic definition. Controls whether the characteristic may be newly assigned to quality plans and used for new measurements. Governance, authoring, validation, and retirement control. Retiring a char…
  - **Evaluation Method** — General method or interpretation approach for observing this characteristic. Describes the expected measurement or observation approach when a reusable default is appropriate. Provides guidance for quality-plan authoring and inspection exe…

### Quality Characteristic Data Type

The values of quality characteristic data type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Quality Characteristic Status

The values of quality characteristic status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Quality Plan** (a Quality Plan) — Quality plan governing this inspection. Identifies requirements, characteristics, sampling policies and test procedures. Determines inspection scope and acceptance criteria. Provides expected quality controls.
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

### Quality Measurement

Structured auditable evidence for one quality characteristic observed during a QualityInspection. QualityMeasurement separates the factual observation from the inspection-level conclusion while retaining the exact plan configuration used for evaluation. Incoming inspection, supplier quality, laboratory testing, dimensional checks, sampling, process quality, compliance, nonconformance and corrective-action verification. QualityInspection is the execution context; InspectionSample supplies exact sample provenance when sampling applies; QualityPlanCharacteristic supplies authoritative plan-speci…

Readable by every signed-in person.

Fields:
  - **Measurement Number** (required) — Human-facing measurement reference. Provides an operational identifier for one observation. Inspection review, audit and integration. Distinct from the parent inspection number. Supports individual observation traceability.
  - **Characteristic Code** (required) — Snapshot of the quality characteristic business code evaluated by this observation. Preserves the human-readable characteristic identifier applicable when evidence was captured. Audit, reporting, exports and legacy integration. Must corres…
  - **Measured Value** — Numeric value observed during inspection. Records the factual quantitative observation before evaluation. Acceptance evaluation, trend analysis and audit. Requires a compatible unit for dimensional characteristics. Supplies evidence used a…
  - **Measured Text** — Categorical or textual observation. Records observations such as color, grade, appearance or classification. Quality evaluation where numeric measurement is inappropriate. Used instead of measuredValue for categorical characteristics. Supp…
  - **Unit Of Measure** (a Unit Of Measure) — Unit in which a numeric measurement is expressed. Defines the dimensional interpretation of measuredValue. Comparison, conversion, reporting and audit. Must be compatible with the linked QualityPlanCharacteristic and QualityCharacteristic.…
  - **Lower Limit** — Snapshot of the lower acceptance boundary applicable when the measurement was evaluated. Preserves the criterion used to evaluate the historical observation. Audit, reproducibility and review. Normally copied from QualityPlanCharacteristic…
  - **Upper Limit** — Snapshot of the upper acceptance boundary applicable when the measurement was evaluated. Preserves the criterion used to evaluate the historical observation. Audit, reproducibility and review. Normally copied from QualityPlanCharacteristic…
  - **Result** (required, one of the Quality Measurement Result values) — The measured value is within its limits. The measured value is outside its limits. Within tolerance only under a stated condition. The result of the quality measurement is not evaluated; set it when that is what the business means for this…
  - **Measured At** (required) — Time when the observation was captured. Establishes chronology of the measured fact. Traceability, sampling, compliance and audit. Distinct from QualityInspection.inspectionDate. Preserves temporal measurement evidence.
  - **Method** — Method or procedure used to obtain the observation. Identifies how the measurement or test was performed. Reproducibility, laboratory audit and compliance. Should align with the linked QualityPlanCharacteristic method where applicable. Est…
  - **Notes** — Supporting context for the observation. Captures anomalies or conditions not represented structurally. Review and audit. Complements measured values and result without replacing them. Provides supporting evidence.
  - **Quality Characteristic** (a Quality Characteristic) — Reusable quality property observed by this measurement. Identifies the semantic property independently of a particular plan. Traceability, analytics, reuse, and audit. Should agree with the QualityCharacteristic reached through qualityPlan…
  - **Quality Plan Characteristic** (a Quality Plan Characteristic) — Plan-specific requirement used to interpret and evaluate this measurement. Identifies the exact configured characteristic, limits, method, unit, and requiredness governing the observation. Requirement traceability, acceptance evaluation, a…
  - **Test Method** (a Test Method) — Governed test procedure used to produce this observation. Identifies the authoritative reusable method applied during measurement. Reproducibility, compliance, laboratory audit, and analytics. Optional when no reusable controlled method ap…
  - **Quality Inspection** (required, a Quality Inspection) — Inspection during which the measurement was captured. Provides the governing inspection context. Quality traceability and aggregate evaluation. Parent inspection controls measurement lifecycle.
  - **Inspection Sample** (a Inspection Sample) — Exact governed inspection sample from which this observation was produced when sample-specific testing applies. Preserves provenance from SamplingPlan and SamplingRule execution through selected material to the resulting observation. Sampl…
  - **Quality Plan** (a Quality Plan) — Quality plan under which the measurement was evaluated. Preserves the plan context for the observation. Audit, reporting, requirement traceability, and historical reconstruction. Identifies the governing plan when a direct plan relationshi…
  - **Certificate Of Analysis** (a Certificate Of Analysis) — The CertificateOfAnalysis this QualityMeasurement belongs to.

### Quality Measurement Result

The values of quality measurement result, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Quality Plan

Governed definition of how a product or process is inspected. QualityPlan is the parent definition for plan-specific QualityPlanCharacteristic requirements, reusable SamplingPlan policies, and QualityInspection execution. Reusable quality meaning belongs to QualityCharacteristic and reusable sample selection belongs to SamplingPlan rather than being duplicated in every inspection. Quality master data, inspection processes, supplier quality, incoming inspection, process control, laboratory testing, compliance, forms, reports, integrations, and analytics. Product provides applicability; Quality…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short code of the plan, such as QP-FOOD-01. Provides a stable human-readable reference for the governed inspection definition. Plan selection, search, reports, integrations, and operational instructions. Distinguishes the plan from its…
  - **Name** (required) — The name of the plan as inspectors know it. Explains the purpose of the inspection definition. Authoring, selection, inspection execution, reporting, and audit. Names the overall plan whose detailed controls are represented by QualityPlanC…
  - **Status** (required, one of the Quality Plan Status values) — Whether the plan may be used for inspections. Controls whether the plan may normally govern new inspections. Plan selection, workflow gating, governance, and retirement. Status affects characteristic and sampling configurations and creatio…

### Quality Plan Characteristic

Plan-specific configuration of a reusable quality characteristic, including acceptance criteria, execution guidance, and optional sampling policy. QualityPlanCharacteristic answers how a QualityCharacteristic is controlled in one particular QualityPlan and, when required, how its observations are sampled. This separation allows reusable characteristics and sampling policies to be combined without duplicating definitions. Quality-plan authoring, incoming inspection, supplier quality, process inspection, laboratory testing, compliance, sampling, audit, and analytics. QualityPlan provides the go…

Readable by every signed-in person.

Fields:
  - **Sequence Number** (required) — Execution or presentation order of this quality characteristic within the plan. Determines where the characteristic appears in inspection instructions and can support ordered sampling or testing. Inspection forms, operator guidance, report…
  - **Required** (required) — Indicates whether evidence for this characteristic is mandatory for the governing plan. Determines whether the absence of a measurement can prevent inspection completion. Inspection validation, completion gating, audit, and exception handl…
  - **Lower Limit** — Plan-specific lower acceptance boundary for a numeric characteristic. Defines the minimum acceptable value under this particular QualityPlan. Automated evaluation and inspection review. Applies only to the linked QualityCharacteristic in t…
  - **Upper Limit** — Plan-specific upper acceptance boundary for a numeric characteristic. Defines the maximum acceptable value under this particular QualityPlan. Automated evaluation and inspection review. Applies only to the linked QualityCharacteristic in t…
  - **Target Value** — Preferred numeric target for the characteristic under this plan. Represents the desired value rather than the minimum or maximum acceptance boundary. Process optimization, inspection guidance, analytics, and trend analysis. Must be compati…
  - **Unit Of Measure** (a Unit Of Measure) — Unit used for numeric limits and target values in this plan configuration. Gives dimensional meaning to the configured numeric criteria. Measurement evaluation, conversion, reporting, and audit. Must be dimensionally compatible with the Qu…
  - **Method** — Plan-specific procedure or method required to evaluate the characteristic. Defines how the characteristic must be observed when this plan is executed. Inspection instructions, reproducibility, compliance, and audit. May refine or override…
  - **Sampling Required** (required) — Indicates whether this characteristic participates in explicit sampling controls under the plan. Distinguishes characteristics that require sampled observations from those evaluated on every applicable inspection item. Sampling workflow de…
  - **Quality Characteristic** (required, a Quality Characteristic) — Reusable quality property being controlled by this plan configuration. Identifies what is observed while this entity supplies the context-specific acceptance rules. Reuse, semantic interpretation, measurement linkage, and governance. Every…
  - **Quality Plan** (required, a Quality Plan) — QualityPlan in which this characteristic requirement is configured. Provides the governing inspection context for the requirement. Plan authoring, inspection execution, traceability, and lifecycle control. Every configuration belongs to ex…
  - **Test Method** (a Test Method) — Governed reusable procedure required to evaluate this characteristic in the plan. Replaces ambiguous free-text method interpretation with an authoritative method definition while allowing method text to remain a historical or integration s…
  - **Sampling Plan** (a Sampling Plan) — SamplingPlan governing how observations of this characteristic are selected when samplingRequired is true. Connects a plan-specific characteristic requirement to the deterministic sample-selection policy used during inspection. Sample-size…

### Quality Plan Status

The values of quality plan status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Return Disposition

Provides the controlled bridge between a returned quantity, its operational outcome, quality evidence and the physical inventory execution. ReturnDisposition decides what happens to returned material. InventoryMovement records what physically happened. CreditNote or SupplierCreditNote records any separate financial consequence. Reverse logistics, warehouse operations, quality, customer returns, supplier returns, inventory control, claims, audit and reconciliation. CustomerReturn/SupplierReturn establish reverse transactions; their lines establish quantities; QualityInspection supplies quality…

Readable by every signed-in person.

Fields:
  - **Disposition Code** (required, one of the Return Disposition Disposition Code values) — Return the goods to saleable stock. Hold the goods apart until a decision is made. Send the goods back to the supplier. Correct the goods so they meet the requirement. Repair the goods to a usable condition. Destroy or write off the goods.…
  - **Disposition Date** (required) — Timestamp when the disposition became effective. Establishes chronology for the physical return decision. Supports audit, warehouse processing, SLA measurement and reconciliation. Distinct from returnDate, receiptDate and financial adjustm…
  - **Quantity** (required) — Quantity covered by this disposition. States how much returned material receives this outcome. Supports partial dispositions and inventory execution. Must reconcile with the related return line quantity and its UnitOfMeasure. Controls the…
  - **Status** (required, one of the Return Disposition Status values) — Being prepared; the outcome is not yet decided. Approved and ready to be carried out. The disposition has been carried out and stock adjusted. A final state. Withdrawn before it was carried out. A final state. Could not be carried out as a…
  - **Reason Code** — Business reason supporting the selected disposition. Explains why the returned quantity received the selected operational outcome. Used for quality analysis, supplier/customer disputes and reporting. May derive from return reason or inspec…
  - **Nonconformance** (a Nonconformance) — The Nonconformance this ReturnDisposition belongs to.
  - **Quality Inspection** (a Quality Inspection) — Quality inspection supporting the disposition decision. Links the operational outcome to quality evidence where inspection is required. Supports release, quarantine, rejection, repair, scrap and return decisions. Provides controlled eviden…

### Return Disposition Disposition Code

The values of return disposition disposition code, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Return Disposition Status

The values of return disposition status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Sampling Plan

Reusable governed definition for selecting inspection samples. SamplingPlan separates the statistical or operational selection policy from the QualityInspection transaction that executes it. Incoming inspection, supplier quality, process control, laboratory testing, compliance, acceptance sampling, and audit. QualityPlan determines the broader quality controls; SamplingPlan defines how populations are sampled; SamplingRule defines conditional sample quantities and acceptance criteria; inspection execution records the actual selection. Draft → active → suspended/retired. Historical executions…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short code of the plan, such as SP-AQL-1.5. Provides a stable operational reference for a governed sampling definition. Plan selection, inspection authoring, reports, and integrations. Identifies the sampling definition rather than an…
  - **Name** (required) — The name inspectors know the plan by. Explains the purpose of the sampling strategy. Quality authoring, inspection execution, training, reporting, and audit. Describes the overall sampling definition whose detailed rules are represented by…
  - **Method** (required, one of the Sampling Plan Method values) — General method used to select inspection samples. Defines the governed selection approach rather than leaving sampling to operator discretion. Sampling execution, compliance, reproducibility, and audit. SamplingRule refines the method with…
  - **Status** (required, one of the Sampling Plan Status values) — Whether the plan may be used in quality plans. Controls whether the sampling definition may be assigned to new governed inspections. Governance, authoring, inspection planning, and retirement. Retirement preserves historical inspection evi…

### Sampling Plan Method

The values of sampling plan method, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Sampling Plan Status

The values of sampling plan status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Sampling Rule

Conditional sampling configuration that translates a SamplingPlan into a deterministic sample size and acceptance threshold. SamplingRule answers how many units to inspect for a qualifying population and, where applicable, how many failures are permitted before rejection. Acceptance sampling, incoming inspection, supplier quality, process control, laboratory sampling, compliance, and audit. SamplingPlan defines the sampling method; QualityPlan may consume the sampling definition; QualityPlanCharacteristic identifies characteristics that participate; QualityInspection executes the sample; Qual…

Readable by every signed-in person.

Fields:
  - **Rule Number** (required) — The number of the rule within its plan. Identifies the rule within its sampling plan for authoring, review, and audit. Configuration, inspection execution, reporting, and integration. Rule identity is scoped to the SamplingPlan and is dist…
  - **Population Min** — Minimum population quantity for which this rule applies. Defines the lower boundary of the eligible lot or population range. Rule selection and deterministic sampling execution. Interpreted with populationMax and sampleSize.
  - **Population Max** — Maximum population quantity for which this rule applies. Defines the upper boundary of the eligible lot or population range. Rule selection and deterministic sampling execution. Interpreted with populationMin and sampleSize.
  - **Sample Size** (required) — Number of units or observations to select when this rule applies. Defines the required sample quantity before the inspection can satisfy the sampling requirement. Sample selection, inspection execution, and completion gating. Must not exce…
  - **Acceptance Number** — Maximum number of failing sampled units permitted for acceptance under this rule. Defines the failure threshold for acceptance-sampling plans. Automated sample evaluation and inspection decision support. Used with rejectionNumber and sampl…
  - **Rejection Number** — Number of failing sampled units at which the sampled population is rejected. Defines the rejection threshold for acceptance-sampling plans. Automated evaluation and inspection decision support. Must be greater than acceptanceNumber when bo…
  - **Status** (required, one of the Sampling Rule Status values) — Whether the rule is in force. Controls whether the rule can be selected for new sample executions. Governance, authoring, and inspection execution. Retired rules remain available for historical sample traceability. Rule is being prepared a…
  - **Sampling Plan** (required, a Sampling Plan) — SamplingPlan that owns this conditional sampling rule. Provides the overall sampling method and governance context. Rule selection, execution, traceability, and audit. Every rule belongs to exactly one SamplingPlan. The plan supplies the m…
  - **Quality Plan** (a Quality Plan) — QualityPlan in which this rule is specifically used when a direct plan association is needed. Provides explicit traceability from a sampling rule to the quality plan it supports. Plan impact analysis, reporting, governance, and integration…

### Sampling Rule Status

The values of sampling rule status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Test Method

Reusable governed procedure for producing quality evidence. TestMethod separates how an observation is produced from what QualityCharacteristic is observed and what QualityPlanCharacteristic criteria apply. Quality planning, laboratory testing, incoming inspection, compliance, training, audit, and analytics. QualityPlanCharacteristic selects the method; QualityMeasurement records evidence produced under it. Draft → active → suspended/retired under controlled change. Method lifecycle or semantic changes revalidate affected open configurations and inspections while completed evidence remains hi…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Business code of the test method. Human-readable controlled identifier for the procedure. Authoring, execution, reporting, and integration. Remains stable within its governed version.
  - **Name** (required) — Human-readable test-method name. States the procedure understood by quality and laboratory personnel. Instructions, forms, reports, and training. Complements the controlled code.
  - **Instructions** — Governed execution instructions. Describes how evidence must be produced. Laboratory and inspection execution, reproducibility, and audit. May be supplemented by controlled external procedures.
  - **Status** (required, one of the Test Method Status values) — Lifecycle state of the method. Controls whether the procedure may be selected for new governed work. Method governance and execution gating. Historical evidence retains the method/version used. Being authored and not normally executable. A…

### Test Method Status

The values of test method status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Certificate Of Analysis Status

- **DRAFT** — Being prepared from the inspection results; not yet approved.
- **APPROVED** — Approved by quality but not yet released to the customer.
- **ISSUED** — Released to the recipient; it now stands as evidence.
- **SUPERSEDED** — Replaced by a corrected certificate; kept for history.
- **VOID** — Withdrawn because it was wrong or issued in error; kept for history.

### Corrective Action Action Type

- **CONTAINMENT** — Immediate action to stop the problem spreading, such as quarantining stock.
- **CORRECTION** — Fixing the specific nonconforming item or condition.
- **CORRECTIVE** — Removing the root cause so the problem does not recur.
- **PREVENTIVE** — Action to prevent a similar problem elsewhere before it happens.

### Corrective Action Status

- **OPEN** — Raised but not yet assigned.
- **ASSIGNED** — Given to an owner, who has not started.
- **IN PROGRESS** — Being carried out.
- **VERIFICATION** — Done and waiting for an effectiveness check.
- **COMPLETED** — Done and, where required, verified effective.
- **CANCELLED** — Withdrawn and not carried out.

### Corrective Action Verification Result

- **EFFECTIVE** — The action achieved its intended result and the problem has not recurred.
- **PARTIALLY EFFECTIVE** — The action helped but did not fully remove the problem; further action is needed.
- **INEFFECTIVE** — The action did not work and the problem persists or has returned.
- **NOT VERIFIABLE** — Effectiveness cannot be established, for example because there is not yet enough evidence.

### Corrective Action Verification Status

- **OPEN** — Raised but not started.
- **IN PROGRESS** — The verification is being carried out.
- **COMPLETED** — Finished with a result and findings recorded.
- **REOPENED** — Reopened because new evidence or a recurrence needs further verification.
- **CANCELLED** — Withdrawn and not carried out.

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

### Inspection Sample Status

- **SELECTED** — Drawn from the population and waiting to be tested.
- **IN TESTING** — Under test; measurements are being taken.
- **TESTED** — Testing finished and results recorded.
- **REJECTED** — Found unsuitable, for example damaged or mislabelled, and excluded. A final state.
- **DISPOSED** — Discarded or consumed after testing. A final state.
- **CANCELLED** — Withdrawn before testing. A final state.

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

### Nonconformance Severity

- **LOW** — Minor deviation with little effect.
- **MEDIUM** — Notable deviation needing correction.
- **HIGH** — Serious deviation affecting product or customers.
- **CRITICAL** — Dangerous or legally significant deviation needing immediate containment.

### Nonconformance Status

- **OPEN** — Recorded but not yet reviewed.
- **UNDER REVIEW** — Being investigated.
- **CONTAINED** — Affected goods are isolated so the problem cannot spread.
- **CORRECTIVE ACTION** — Corrective actions are under way to remove the cause.
- **CLOSED** — Resolved and verified. A final state.
- **REJECTED** — Reviewed and found not to be a nonconformance. A final state.

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

### Quality Characteristic Data Type

- **DECIMAL** — A numeric observation that may contain fractional values.
- **INTEGER** — A whole-number observation.
- **STRING** — A textual or categorical observation represented as text.
- **BOOLEAN** — A true/false observation.
- **ENUM** — An observation selected from a governed set of allowed values.

### Quality Characteristic Status

- **DRAFT** — Definition is being prepared and is not normally available for new governed use.
- **ACTIVE** — Definition is approved for use in applicable QualityPlanCharacteristic records.
- **RETIRED** — Definition is no longer normally assigned to new configurations but remains available for historical traceability.

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

### Quality Measurement Result

- **PASS** — The measured value is within its limits.
- **FAIL** — The measured value is outside its limits.
- **CONDITIONAL** — Within tolerance only under a stated condition.
- **NOT EVALUATED** — The result of the quality measurement is not evaluated; set it when that is what the business means for this record.

### Quality Plan Status

- **DRAFT** — Plan is being prepared and is not normally used for production inspection execution.
- **ACTIVE** — Plan is approved for governed inspection use.
- **SUSPENDED** — Plan is temporarily unavailable for new governed use while retained for traceability.
- **RETIRED** — Plan is no longer normally selected for new inspections but remains historical evidence.

### Return Disposition Disposition Code

- **RESTOCK** — Return the goods to saleable stock.
- **QUARANTINE** — Hold the goods apart until a decision is made.
- **RETURN TO SUPPLIER** — Send the goods back to the supplier.
- **REWORK** — Correct the goods so they meet the requirement.
- **REPAIR** — Repair the goods to a usable condition.
- **SCRAP** — Destroy or write off the goods.
- **REJECT** — Refuse the return; the goods go back to the sender.
- **ACCEPT** — Accept the goods as returned.
- **CONDITIONAL RELEASE** — The disposition code of the return disposition is conditional release; set it when that is what the business means for this record.

### Return Disposition Status

- **DRAFT** — Being prepared; the outcome is not yet decided.
- **AUTHORIZED** — Approved and ready to be carried out.
- **EXECUTED** — The disposition has been carried out and stock adjusted. A final state.
- **CANCELLED** — Withdrawn before it was carried out. A final state.
- **EXCEPTION** — Could not be carried out as authorised and needs a decision.

### Sampling Plan Method

- **CENSUS** — Every applicable unit is inspected.
- **RANDOM** — Units are selected randomly from the eligible population.
- **SYSTEMATIC** — Units are selected using a defined interval or systematic pattern.
- **STRATIFIED** — Population is divided into defined strata and samples are selected within them.
- **FIXED SIZE** — A fixed number of units is selected.
- **PERCENTAGE** — A defined proportion of the population is selected.
- **ACCEPTANCE SAMPLING** — Sample size and acceptance/rejection criteria are governed by an acceptance-sampling scheme.

### Sampling Plan Status

- **DRAFT** — Being defined and not normally available for production use.
- **ACTIVE** — Approved for governed sampling.
- **SUSPENDED** — Temporarily unavailable for new use.
- **RETIRED** — No longer normally assigned to new inspections but retained for history.

### Sampling Rule Status

- **DRAFT** — Rule is being prepared and is not normally selectable.
- **ACTIVE** — Rule is approved for sampling execution.
- **RETIRED** — Rule is no longer selected for new sampling but remains historical evidence.

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

### Test Method Status

- **DRAFT** — Being authored and not normally executable.
- **ACTIVE** — Approved for governed use.
- **SUSPENDED** — Temporarily unavailable for new use.
- **RETIRED** — No longer selected for new work but retained historically.

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

### Quality Characteristic — Quality Characteristic Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)

### Quality Plan — Quality Plan Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → SUSPENDED (Suspend)
- SUSPENDED → ACTIVE (Resume)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- SUSPENDED → RETIRED (Retire)

### Test Method — Test Method Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → SUSPENDED (Suspend)
- SUSPENDED → ACTIVE (Resume)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- SUSPENDED → RETIRED (Retire)

### Sampling Plan — Sampling Plan Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → SUSPENDED (Suspend)
- SUSPENDED → ACTIVE (Resume)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- SUSPENDED → RETIRED (Retire)

### Sampling Rule — Sampling Rule Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)

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

### Inspection Sample — Inspection Sample Lifecycle

Starts at **SELECTED**.
Final: **REJECTED**, **DISPOSED**, **CANCELLED**.

Moves:
- SELECTED → IN TESTING (Mark In Testing)
- IN TESTING → TESTED (Mark Tested)
- SELECTED → REJECTED (Reject)
- IN TESTING → REJECTED (Reject)
- TESTED → REJECTED (Reject)
- IN TESTING → DISPOSED (Mark Disposed)
- TESTED → DISPOSED (Mark Disposed)
- SELECTED → CANCELLED (Cancel)
- IN TESTING → CANCELLED (Cancel)
- TESTED → CANCELLED (Cancel)

### Nonconformance — Nonconformance Lifecycle

Starts at **OPEN**.
Final: **CLOSED**, **REJECTED**.

Moves:
- OPEN → UNDER REVIEW (Review)
- UNDER REVIEW → CORRECTIVE ACTION (Mark Corrective Action)
- CORRECTIVE ACTION → CLOSED (Close)
- UNDER REVIEW → CONTAINED (Mark Contained)
- CONTAINED → UNDER REVIEW (Resume)
- CORRECTIVE ACTION → CONTAINED (Mark Contained)
- CONTAINED → CORRECTIVE ACTION (Resume)
- OPEN → REJECTED (Reject)
- UNDER REVIEW → REJECTED (Reject)
- CORRECTIVE ACTION → REJECTED (Reject)
- CONTAINED → REJECTED (Reject)

### Corrective Action — Corrective Action Lifecycle

Starts at **OPEN**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- OPEN → ASSIGNED (Assign)
- ASSIGNED → IN PROGRESS (Start)
- IN PROGRESS → VERIFICATION (Mark Verification)
- VERIFICATION → COMPLETED (Complete)
- OPEN → CANCELLED (Cancel)
- ASSIGNED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)
- VERIFICATION → CANCELLED (Cancel)

### Corrective Action Verification — Corrective Action Verification Lifecycle

Starts at **OPEN**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- OPEN → IN PROGRESS (Start)
- IN PROGRESS → REOPENED (Mark Reopened)
- REOPENED → COMPLETED (Complete)
- OPEN → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)
- REOPENED → CANCELLED (Cancel)

### Return Disposition — Return Disposition Lifecycle

Starts at **DRAFT**.
Final: **EXECUTED**, **CANCELLED**.

Moves:
- DRAFT → AUTHORIZED (Authorize)
- AUTHORIZED → EXECUTED (Mark Executed)
- AUTHORIZED → EXCEPTION (Mark Exception)
- EXCEPTION → AUTHORIZED (Resolve Exception)
- DRAFT → CANCELLED (Cancel)
- AUTHORIZED → CANCELLED (Cancel)
- EXCEPTION → CANCELLED (Cancel)

### Certificate Of Analysis — Certificate Of Analysis Lifecycle

Starts at **DRAFT**.
Final: **SUPERSEDED**, **VOID**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → ISSUED (Issue)
- DRAFT → SUPERSEDED (Mark Superseded)
- APPROVED → SUPERSEDED (Mark Superseded)
- ISSUED → SUPERSEDED (Mark Superseded)
- DRAFT → VOID (Void)
- APPROVED → VOID (Void)
- ISSUED → VOID (Void)

## Roles

- **User** — reads 78 of 78 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
