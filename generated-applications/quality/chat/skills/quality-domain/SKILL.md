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

### Certificate Of Analysis

Controlled certificate presenting quality evidence for governed material. CertificateOfAnalysis is a released representation of underlying evidence, not a substitute for QualityInspection or QualityMeasurement. Supplier quality, customer documentation, regulated release, shipments, receipts, compliance, audit, and integrations. Inspections and measurements supply evidence; Product and receipt/shipment provide material context. Draft → approved → issued → superseded/void under controlled document history. Changes to open source evidence invalidate draft/approved certificates for revalidation;…

Readable by every signed-in person.

Fields:
  - **Certificate Number** (required) — Business-facing certificate reference. Controlled number used to identify the issued certificate. Documents, search, exchange, and audit. Distinct from inspection and shipment numbers. Required.
  - **Issued At** — Time the certificate was formally issued. Establishes when the quality statement became externally or operationally effective. Compliance, customer documentation, and audit. Required once status is ISSUED. Optional before issuance.
  - **Status** (required, one of the Certificate Of Analysis Status values) — Lifecycle state of the certificate. Controls whether the certificate is preparatory, approved, issued, replaced, or invalidated. Release and document governance. Status does not alter underlying measurements. Being prepared. Reviewed and a…

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

### Corrective Action

Represents a controlled quality action from assignment through implementation and independent effectiveness verification. Nonconformance records the problem; CorrectiveAction records what is done to contain, correct or prevent it; CorrectiveActionVerification records whether the action worked. CAPA, supplier quality, compliance, audit, recurrence prevention and quality improvement. The action connects Nonconformance with responsible Party and one or more CorrectiveActionVerification records. Physical and financial consequences remain represented by their own transactions. Open → assigned → in…

Readable by every signed-in person.

Fields:
  - **Action Number** (required) — Human-facing corrective-action reference. Identifies the action for quality teams, responsible parties and auditors. Communication, reporting, CAPA tracking and integration. Distinct from the originating nonconformance number and verificat…
  - **Action Type** (required, one of the Corrective Action Action Type values) — Classification of the quality action. Distinguishes immediate containment, correction of an existing condition, root-cause corrective action, and preventive action. Determines evidence expectations, routing and effectiveness criteria. Cont…
  - **Description** (required) — Detailed statement of what the action will accomplish. Defines scope, intended outcome and work required to address the quality issue. Assignment, execution, audit and effectiveness assessment. Must remain traceable to the associated Nonco…
  - **Status** (required, one of the Corrective Action Status values) — Lifecycle state of the action. Indicates whether work is pending, assigned, underway, awaiting effectiveness evidence, completed or cancelled. Controls execution and closure. COMPLETED does not itself prove effectiveness; CorrectiveActionV…
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
  - **Verification Date** (required) — Date and time effectiveness verification was performed. Establishes when evidence was evaluated against the intended outcome. Audit SLA quality reporting and closure chronology. Anchors the verification event. Required.
  - **Result** (required, one of the Corrective Action Verification Result values) — Outcome of effectiveness verification. States whether the action achieved its intended quality outcome. Controls corrective-action completion recurrence handling and escalation. Does not rewrite original Nonconformance or CorrectiveAction…
  - **Status** (required, one of the Corrective Action Verification Status values) — Lifecycle state of verification. Separates preparation evaluation completion and follow-up. Quality governance and audit. COMPLETED records final verification evidence; REOPENED signals additional action is required. Required. The status o…
  - **Findings** (required) — Evidence and observations supporting the verification result. Explains what was checked and why the result was reached. Audit quality review supplier improvement and recurrence analysis. Supports effectiveness decision. Required.
  - **Verified By** (required, a Party) — Party accountable for performing or approving effectiveness verification. Establishes accountability for the verification decision. Audit trail quality governance and segregation of duties. Provides verification authority. Required.
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

### Inspection Sample

Execution record of the actual sample selected for a governed quality inspection. InspectionSample separates sampling policy from the physical or logical sample actually selected. SamplingPlan and SamplingRule define how selection should occur; InspectionSample records what was actually selected; QualityMeasurement records observations from it. Incoming inspection, supplier quality, acceptance sampling, laboratory testing, process quality, chain of custody, compliance, and audit. QualityInspection is the parent execution; SamplingPlan and SamplingRule define selection policy; Product and Unit…

Readable by every signed-in person.

Fields:
  - **Sample Number** (required) — Human-facing identifier for the selected inspection sample. Provides an operational reference for labeling, handling, testing, and audit. Inspection execution, laboratory handling, reports, and traceability. Identifies the executed sample…
  - **Selected At** (required) — Time at which the sample was selected from the eligible population. Establishes when the actual sampling event occurred. Chain of custody, audit, reproducibility, and inspection chronology. Distinct from QualityInspection.inspectionDate an…
  - **Quantity** (required) — Quantity represented by the selected sample. States how much material or how many units the sample represents under its unit of measure. Sample reconciliation, measurement scope, inventory traceability, and audit. Must reconcile with the e…
  - **Unit Of Measure** (required, a Unit Of Measure) — Unit in which the sample quantity is expressed. Gives semantic meaning to the selected sample quantity. Reconciliation, reporting, conversion, and audit. Must be compatible with the source population and governing sampling configuration. R…
  - **Status** (required, one of the Inspection Sample Status values) — Lifecycle state of the selected sample. Shows whether the sample is awaiting testing, being tested, has completed testing, or has been otherwise dispositioned. Sample handling, measurement gating, chain of custody, and audit. Sample status…
  - **Selection Basis** — Evidence or description of how this particular sample was selected. Preserves the operational selection basis needed to reproduce or audit the sampling event. Compliance, audit, supplier disputes, and statistical review. Complements the au…
  - **Quality Inspection** (required, a Quality Inspection) — QualityInspection for which this sample was selected. Provides the execution context and population being inspected. Sample traceability, inspection completion, measurement linkage, and audit. Every InspectionSample belongs to exactly one…
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
  - **Number** (required) — Business-facing nonconformance reference. Identifies the issue for quality and supplier operations. Audit, reporting, CAPA and dispute handling. Human-recognizable issue reference. Required.
  - **Severity** (required, one of the Nonconformance Severity values) — Business severity of the deviation. Indicates impact and urgency. Prioritization, containment and escalation. Determines response urgency. Required. The severity of the nonconformance is low; set it when that is what the business means for…
  - **Status** (required, one of the Nonconformance Status values) — Lifecycle state of the quality issue. Indicates investigation, containment, corrective action and closure. Quality management and audit. Controls allowed responses and closure. Required. The status of the nonconformance is open; set it whe…
  - **Description** (required) — Detailed explanation of the deviation. States what requirement or expected result was not met. Investigation, supplier communication, CAPA and audit. Provides issue evidence. Required.
  - **Detected At** (required) — Time the deviation was detected. Establishes chronology for containment and corrective action. Audit and quality analytics. Anchors issue occurrence. Required.
  - **Closed At** — Time the issue was formally closed. Establishes completion chronology. Quality performance and audit. Required for closure. Optional until closure.
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

### Quality Characteristic

Reusable definition of one quality property that can be configured by quality plans and observed through quality measurements. QualityCharacteristic answers what property is being evaluated. It intentionally does not own plan-specific limits because the same property can have different acceptance criteria for different products, suppliers, processes, or inspection plans. Quality master data, inspection design, supplier quality, incoming inspection, process control, laboratory testing, compliance, analytics, and audit. QualityCharacteristic is the reusable semantic definition; QualityPlanChara…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Business code identifying the quality characteristic. Provides a stable human-readable identifier such as WEIGHT, TEMPERATURE, LENGTH, or APPEARANCE. Used in quality plans, measurements, reports, integrations, and validation rules. The cod…
  - **Name** (required) — Human-readable name of the quality characteristic. States what property the characteristic represents in language understandable to quality personnel and other users. Used in quality-plan authoring, inspection screens, reports, analytics,…
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
  - **Status** (required, one of the Quality Inspection Status values) — Lifecycle state of inspection. Indicates whether inspection is pending, executing, completed with a result, or cancelled. Controls release and disposition workflows. Inspection status is independent of sample status, receipt/return status,…
  - **Result** (one of the Quality Inspection Result values) — Overall outcome of inspection or test. Records whether the inspected scope satisfies applicable requirements after evaluating relevant samples, measurements and other evidence. Drives acceptance, rejection, quarantine, return, repair or re…
  - **Disposition** (one of the Quality Inspection Disposition values) — Controlled operational disposition resulting from inspection. Defines what happens to inspected material after quality evaluation. Controls inventory availability, supplier return, repair, scrap and release processes. RETURN_TO_SUPPLIER ma…
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
  - **Measurement Number** (required) — Human-facing measurement reference. Provides an operational identifier for one observation. Inspection review, audit and integration. Distinct from the parent inspection number. Supports individual observation traceability. Required.
  - **Characteristic Code** (required) — Snapshot of the quality characteristic business code evaluated by this observation. Preserves the human-readable characteristic identifier applicable when evidence was captured. Audit, reporting, exports and legacy integration. Must corres…
  - **Measured Value** — Numeric value observed during inspection. Records the factual quantitative observation before evaluation. Acceptance evaluation, trend analysis and audit. Requires a compatible unit for dimensional characteristics. Supplies evidence used a…
  - **Measured Text** — Categorical or textual observation. Records observations such as color, grade, appearance or classification. Quality evaluation where numeric measurement is inappropriate. Used instead of measuredValue for categorical characteristics. Supp…
  - **Unit Of Measure** (a Unit Of Measure) — Unit in which a numeric measurement is expressed. Defines the dimensional interpretation of measuredValue. Comparison, conversion, reporting and audit. Must be compatible with the linked QualityPlanCharacteristic and QualityCharacteristic.…
  - **Lower Limit** — Snapshot of the lower acceptance boundary applicable when the measurement was evaluated. Preserves the criterion used to evaluate the historical observation. Audit, reproducibility and review. Normally copied from QualityPlanCharacteristic…
  - **Upper Limit** — Snapshot of the upper acceptance boundary applicable when the measurement was evaluated. Preserves the criterion used to evaluate the historical observation. Audit, reproducibility and review. Normally copied from QualityPlanCharacteristic…
  - **Result** (required, one of the Quality Measurement Result values) — Evaluation of this measurement against its governing criterion. States whether the individual observation satisfies the applicable requirement. Inspection completion, nonconformance and analytics. Contributes evidence to QualityInspection.…
  - **Measured At** (required) — Time when the observation was captured. Establishes chronology of the measured fact. Traceability, sampling, compliance and audit. Distinct from QualityInspection.inspectionDate. Preserves temporal measurement evidence. Required.
  - **Method** — Method or procedure used to obtain the observation. Identifies how the measurement or test was performed. Reproducibility, laboratory audit and compliance. Should align with the linked QualityPlanCharacteristic method where applicable. Est…
  - **Notes** — Supporting context for the observation. Captures anomalies or conditions not represented structurally. Review and audit. Complements measured values and result without replacing them. Provides supporting evidence. Optional.
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
  - **Code** (required) — Business code identifying the quality plan. Provides a stable human-readable reference for the governed inspection definition. Plan selection, search, reports, integrations, and operational instructions. Distinguishes the plan from its cha…
  - **Name** (required) — Human-readable name of the quality plan. Explains the purpose of the inspection definition. Authoring, selection, inspection execution, reporting, and audit. Names the overall plan whose detailed controls are represented by QualityPlanChar…
  - **Status** (required, one of the Quality Plan Status values) — Lifecycle state of the quality plan. Controls whether the plan may normally govern new inspections. Plan selection, workflow gating, governance, and retirement. Status affects characteristic and sampling configurations and creation of new…

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
  - **Disposition Code** (required, one of the Return Disposition Disposition Code values) — Controlled operational outcome selected for returned material. Defines what should happen to the returned quantity. Drives warehouse execution, quality containment and eligibility for inventory availability. The code is a decision, not the…
  - **Disposition Date** (required) — Timestamp when the disposition became effective. Establishes chronology for the physical return decision. Supports audit, warehouse processing, SLA measurement and reconciliation. Distinct from returnDate, receiptDate and financial adjustm…
  - **Quantity** (required) — Quantity covered by this disposition. States how much returned material receives this outcome. Supports partial dispositions and inventory execution. Must reconcile with the related return line quantity and its UnitOfMeasure. Controls the…
  - **Status** (required, one of the Return Disposition Status values) — Lifecycle state of the disposition decision. Indicates whether the decision is proposed, authorized, physically executed, cancelled or exception-managed. Controls whether downstream inventory execution is permitted. Does not replace Custom…
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
  - **Code** (required) — Business code identifying the sampling plan. Provides a stable operational reference for a governed sampling definition. Plan selection, inspection authoring, reports, and integrations. Identifies the sampling definition rather than an ind…
  - **Name** (required) — Human-readable name of the sampling plan. Explains the purpose of the sampling strategy. Quality authoring, inspection execution, training, reporting, and audit. Describes the overall sampling definition whose detailed rules are represente…
  - **Method** (required, one of the Sampling Plan Method values) — General method used to select inspection samples. Defines the governed selection approach rather than leaving sampling to operator discretion. Sampling execution, compliance, reproducibility, and audit. SamplingRule refines the method with…
  - **Status** (required, one of the Sampling Plan Status values) — Lifecycle state of the sampling plan. Controls whether the sampling definition may be assigned to new governed inspections. Governance, authoring, inspection planning, and retirement. Retirement preserves historical inspection evidence and…

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
  - **Rule Number** (required) — Business reference for the sampling rule. Identifies the rule within its sampling plan for authoring, review, and audit. Configuration, inspection execution, reporting, and integration. Rule identity is scoped to the SamplingPlan and is di…
  - **Population Min** — Minimum population quantity for which this rule applies. Defines the lower boundary of the eligible lot or population range. Rule selection and deterministic sampling execution. Interpreted with populationMax and sampleSize. Optional when…
  - **Population Max** — Maximum population quantity for which this rule applies. Defines the upper boundary of the eligible lot or population range. Rule selection and deterministic sampling execution. Interpreted with populationMin and sampleSize. Optional when…
  - **Sample Size** (required) — Number of units or observations to select when this rule applies. Defines the required sample quantity before the inspection can satisfy the sampling requirement. Sample selection, inspection execution, and completion gating. Must not exce…
  - **Acceptance Number** — Maximum number of failing sampled units permitted for acceptance under this rule. Defines the failure threshold for acceptance-sampling plans. Automated sample evaluation and inspection decision support. Used with rejectionNumber and sampl…
  - **Rejection Number** — Number of failing sampled units at which the sampled population is rejected. Defines the rejection threshold for acceptance-sampling plans. Automated evaluation and inspection decision support. Must be greater than acceptanceNumber when bo…
  - **Status** (required, one of the Sampling Rule Status values) — Lifecycle state of the sampling rule. Controls whether the rule can be selected for new sample executions. Governance, authoring, and inspection execution. Retired rules remain available for historical sample traceability. Rule is being pr…
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

### Test Method

Reusable governed procedure for producing quality evidence. TestMethod separates how an observation is produced from what QualityCharacteristic is observed and what QualityPlanCharacteristic criteria apply. Quality planning, laboratory testing, incoming inspection, compliance, training, audit, and analytics. QualityPlanCharacteristic selects the method; QualityMeasurement records evidence produced under it. Draft → active → suspended/retired under controlled change. Method lifecycle or semantic changes revalidate affected open configurations and inspections while completed evidence remains hi…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Business code of the test method. Human-readable controlled identifier for the procedure. Authoring, execution, reporting, and integration. Remains stable within its governed version. Required.
  - **Name** (required) — Human-readable test-method name. States the procedure understood by quality and laboratory personnel. Instructions, forms, reports, and training. Complements the controlled code. Required.
  - **Instructions** — Governed execution instructions. Describes how evidence must be produced. Laboratory and inspection execution, reproducibility, and audit. May be supplemented by controlled external procedures. Optional when instructions are maintained in…
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

### Certificate Of Analysis Status

- **DRAFT** — Being prepared.
- **APPROVED** — Reviewed and approved for issuance.
- **ISSUED** — Formally issued.
- **SUPERSEDED** — Replaced by a later controlled certificate.
- **VOID** — Invalidated while retained as history.

### Corrective Action Action Type

- **CONTAINMENT** — The action type of the corrective action is containment; set it when that is what the business means for this record.
- **CORRECTION** — The action type of the corrective action is correction; set it when that is what the business means for this record.
- **CORRECTIVE** — The action type of the corrective action is corrective; set it when that is what the business means for this record.
- **PREVENTIVE** — The action type of the corrective action is preventive; set it when that is what the business means for this record.

### Corrective Action Status

- **OPEN** — The status of the corrective action is open; set it when that is what the business means for this record.
- **ASSIGNED** — The status of the corrective action is assigned; set it when that is what the business means for this record.
- **IN PROGRESS** — The status of the corrective action is in progress; set it when that is what the business means for this record.
- **VERIFICATION** — The status of the corrective action is verification; set it when that is what the business means for this record.
- **COMPLETED** — The status of the corrective action is completed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the corrective action is cancelled; set it when that is what the business means for this record.

### Corrective Action Verification Result

- **EFFECTIVE** — The result of the corrective action verification is effective; set it when that is what the business means for this record.
- **PARTIALLY EFFECTIVE** — The result of the corrective action verification is partially effective; set it when that is what the business means for this record.
- **INEFFECTIVE** — The result of the corrective action verification is ineffective; set it when that is what the business means for this record.
- **NOT VERIFIABLE** — The result of the corrective action verification is not verifiable; set it when that is what the business means for this record.

### Corrective Action Verification Status

- **OPEN** — The status of the corrective action verification is open; set it when that is what the business means for this record.
- **IN PROGRESS** — The status of the corrective action verification is in progress; set it when that is what the business means for this record.
- **COMPLETED** — The status of the corrective action verification is completed; set it when that is what the business means for this record.
- **REOPENED** — The status of the corrective action verification is reopened; set it when that is what the business means for this record.
- **CANCELLED** — The status of the corrective action verification is cancelled; set it when that is what the business means for this record.

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

### Inspection Sample Status

- **SELECTED** — Sample has been selected and is awaiting testing or handling.
- **IN TESTING** — Sample is actively undergoing governed testing.
- **TESTED** — Required testing for the sample has completed.
- **REJECTED** — Sample itself was rejected or invalidated for the governed purpose.
- **DISPOSED** — Sample has been physically disposed of under an authorized process.
- **CANCELLED** — Sample selection was cancelled under controlled workflow.

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

### Nonconformance Severity

- **LOW** — The severity of the nonconformance is low; set it when that is what the business means for this record.
- **MEDIUM** — The severity of the nonconformance is medium; set it when that is what the business means for this record.
- **HIGH** — The severity of the nonconformance is high; set it when that is what the business means for this record.
- **CRITICAL** — The severity of the nonconformance is critical; set it when that is what the business means for this record.

### Nonconformance Status

- **OPEN** — The status of the nonconformance is open; set it when that is what the business means for this record.
- **UNDER REVIEW** — The status of the nonconformance is under review; set it when that is what the business means for this record.
- **CONTAINED** — The status of the nonconformance is contained; set it when that is what the business means for this record.
- **CORRECTIVE ACTION** — The status of the nonconformance is corrective action; set it when that is what the business means for this record.
- **CLOSED** — The status of the nonconformance is closed; set it when that is what the business means for this record.
- **REJECTED** — The status of the nonconformance is rejected; set it when that is what the business means for this record.

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

- **RELEASE** — The disposition of the quality inspection is release; set it when that is what the business means for this record.
- **ACCEPT** — The disposition of the quality inspection is accept; set it when that is what the business means for this record.
- **REJECT** — The disposition of the quality inspection is reject; set it when that is what the business means for this record.
- **QUARANTINE** — The disposition of the quality inspection is quarantine; set it when that is what the business means for this record.
- **RETURN TO SUPPLIER** — The disposition of the quality inspection is return to supplier; set it when that is what the business means for this record.
- **REWORK** — The disposition of the quality inspection is rework; set it when that is what the business means for this record.
- **REPAIR** — The disposition of the quality inspection is repair; set it when that is what the business means for this record.
- **SCRAP** — The disposition of the quality inspection is scrap; set it when that is what the business means for this record.
- **CONDITIONAL RELEASE** — The disposition of the quality inspection is conditional release; set it when that is what the business means for this record.

### Quality Inspection Result

- **PASS** — The result of the quality inspection is pass; set it when that is what the business means for this record.
- **FAIL** — The result of the quality inspection is fail; set it when that is what the business means for this record.
- **CONDITIONAL** — The result of the quality inspection is conditional; set it when that is what the business means for this record.
- **NOT TESTED** — The result of the quality inspection is not tested; set it when that is what the business means for this record.

### Quality Inspection Status

- **OPEN** — The status of the quality inspection is open; set it when that is what the business means for this record.
- **IN PROGRESS** — The status of the quality inspection is in progress; set it when that is what the business means for this record.
- **PASSED** — The status of the quality inspection is passed; set it when that is what the business means for this record.
- **FAILED** — The status of the quality inspection is failed; set it when that is what the business means for this record.
- **CONDITIONAL** — The status of the quality inspection is conditional; set it when that is what the business means for this record.
- **CANCELLED** — The status of the quality inspection is cancelled; set it when that is what the business means for this record.

### Quality Measurement Result

- **PASS** — The result of the quality measurement is pass; set it when that is what the business means for this record.
- **FAIL** — The result of the quality measurement is fail; set it when that is what the business means for this record.
- **CONDITIONAL** — The result of the quality measurement is conditional; set it when that is what the business means for this record.
- **NOT EVALUATED** — The result of the quality measurement is not evaluated; set it when that is what the business means for this record.

### Quality Plan Status

- **DRAFT** — Plan is being prepared and is not normally used for production inspection execution.
- **ACTIVE** — Plan is approved for governed inspection use.
- **SUSPENDED** — Plan is temporarily unavailable for new governed use while retained for traceability.
- **RETIRED** — Plan is no longer normally selected for new inspections but remains historical evidence.

### Return Disposition Disposition Code

- **RESTOCK** — The disposition code of the return disposition is restock; set it when that is what the business means for this record.
- **QUARANTINE** — The disposition code of the return disposition is quarantine; set it when that is what the business means for this record.
- **RETURN TO SUPPLIER** — The disposition code of the return disposition is return to supplier; set it when that is what the business means for this record.
- **REWORK** — The disposition code of the return disposition is rework; set it when that is what the business means for this record.
- **REPAIR** — The disposition code of the return disposition is repair; set it when that is what the business means for this record.
- **SCRAP** — The disposition code of the return disposition is scrap; set it when that is what the business means for this record.
- **REJECT** — The disposition code of the return disposition is reject; set it when that is what the business means for this record.
- **ACCEPT** — The disposition code of the return disposition is accept; set it when that is what the business means for this record.
- **CONDITIONAL RELEASE** — The disposition code of the return disposition is conditional release; set it when that is what the business means for this record.

### Return Disposition Status

- **DRAFT** — The status of the return disposition is draft; set it when that is what the business means for this record.
- **AUTHORIZED** — The status of the return disposition is authorized; set it when that is what the business means for this record.
- **EXECUTED** — The status of the return disposition is executed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the return disposition is cancelled; set it when that is what the business means for this record.
- **EXCEPTION** — The status of the return disposition is exception; set it when that is what the business means for this record.

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

### Test Method Status

- **DRAFT** — Being authored and not normally executable.
- **ACTIVE** — Approved for governed use.
- **SUSPENDED** — Temporarily unavailable for new use.
- **RETIRED** — No longer selected for new work but retained historically.

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
