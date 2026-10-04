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

A governed file or content attachment associated with an enterprise record while preserving content identity and audit provenance. Provide durable, implementation-neutral governance semantics for Attachment. A governed file or content attachment associated with an enterprise record while preserving content identity and audit provenance. Used in contracts, documents, governance, compliance, risk, legal, service, finance, or audit workflows where applicable. Connects authoritative business records to controlled lifecycle, evidence, findings, and downstream remediation without replacing source t…

Readable by every signed-in person.

Fields:
  - **Effective At** — Time at which this record becomes effective or evidentially applicable. Establishes temporal business meaning. Lifecycle, audit and reporting. Does not rewrite earlier effective evidence. Optional when lifecycle does not require a separate…

### Brand

Governed product brand reference master. Brand describes commercial/manufacturer identity; it is distinct from ProductCategory taxonomy and Product identity. PIM, catalog, sourcing, sales, e-commerce, service and analytics. Products and variants reference Brand; category remains independent classification. Active → inactive → active or retired. Lifecycle/name changes update future catalog/master usage while preserving historical references.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed brand code. Stable business/integration identifier. Catalog and integration. Unique in brand master. Required.
  - **Name** (required) — Brand display name. Customer/supplier-facing market identity. Catalog, documents, search and reporting. Presentation can change without changing brand identity. Required.
  - **Status** (required, one of the Brand Status values) — Brand lifecycle state. Controls future assignment/use. Master-data governance. Historical product/transaction references remain valid. Eligible for new assignment. Temporarily unavailable for new assignment. Permanently unavailable for new…

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

### Campaign

A governed commercial marketing or outreach initiative targeting an audience over a defined period and measuring responses and outcomes. Provide canonical implementation-neutral semantics for Campaign across enterprise applications. A governed commercial marketing or outreach initiative targeting an audience over a defined period and measuring responses and outcomes. Used in CRM, sales, fulfillment, logistics, reporting, integration, or audit processes where this concept applies. Connects to canonical parties, commercial transactions, logistics execution, and downstream evidence without repla…

Readable by every signed-in person.

Fields:
  - **Code** — Business reference for Campaign. Human or integration-friendly reference where applicable. Search, exchange and reporting. Does not replace immutable identity. Optional when another transaction reference supplies business identity.

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

### Contact

A governed business contact representing a Person in a customer, prospect, supplier, partner, or account relationship context. Provide canonical implementation-neutral semantics for Contact across enterprise applications. A governed business contact representing a Person in a customer, prospect, supplier, partner, or account relationship context. Used in CRM, sales, fulfillment, logistics, reporting, integration, or audit processes where this concept applies. Connects to canonical parties, commercial transactions, logistics execution, and downstream evidence without replacing their authoritat…

Readable by every signed-in person.

Fields:
  - **Code** — Business reference for Contact. Human or integration-friendly reference where applicable. Search, exchange and reporting. Does not replace immutable identity. Optional when another transaction reference supplies business identity.
  - **Person** (required, a Person) — Person represented by contact. Preserves canonical human identity. CRM communication and relationship management. Exactly one Person. Contact context must not duplicate Person master.

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

### Customer

Represents the commercial customer role of a Party. Party identifies who the party is; PartyRole establishes a role; Customer governs buyer-specific commercial behavior and controls. Central to sales order-to-cash, pricing, billing, receivables, collections, service, and customer analytics. Customer connects to SalesOrder, Invoice, Payment, PaymentAllocation through those transaction entities while retaining the underlying Party identity. Customer onboarding → eligibility/credit → SalesOrder → fulfillment → Invoice → Payment → PaymentAllocation → receivables settlement. Customer status constr…

Readable by every signed-in person.

Fields:
  - **Party Role** (required, a Party Role) — Links Customer to its underlying PartyRole. Resolves common party identity and role information. Customer is a role specialization and must not duplicate Party identity. Supplies common party context to customer-facing workflows. Required…
  - **Customer Code** (required) — Human-facing customer business code. Used in orders invoices statements integrations and communication. Distinct from customerId and external legal identifiers. Supports customer selection and transaction recognition. Required for operatio…
  - **Customer Type** (one of the Customer Customer Type values) — Commercial classification of the customer relationship. Supports pricing credit tax service and reporting. Does not replace Party partyType. Supplies customer classification to transaction policy. Optional when not needed. The customer typ…
  - **Credit Status** (one of the Customer Credit Status values) — Current credit-control disposition. Used by order authorization receivables collections and credit review. Credit control affects exposure and does not alter party identity. SalesOrder confirmation must evaluate current credit policy when…
  - **Credit Limit** — Authorized monetary credit exposure limit. Used in credit checks exposure monitoring and risk reporting. Must be interpreted with currency outstanding exposure payment terms and credit status. Provides one input to credit authorization bef…
  - **Payment Terms** (a Payment Term) — Default settlement policy for customer invoices. Used by SalesOrder Invoice receivables collections and cash forecasting. May be overridden by authorized contract or transaction-level terms. Supplies default due-date expectations to order…
  - **Status** (required, one of the Customer Status values) — Lifecycle state of the customer relationship. Controls eligibility for new commercial activity. Historical transactions remain attributable after status changes. New workflows must evaluate status; historical records remain valid. Required…
  - **Party** (required, a Party) — Identifies the underlying person or organization performing this role. Provides common identity without duplicating Party data. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back t…
  - **Role Type** (required, one of the Customer Role Type values) — Defines the business capacity in which the Party participates. Determines specialized capabilities, policies, workflows, and validations. Separate from Party.partyType, which describes whether the participant is a person or organization. S…
  - **Code** — Optional business-context identifier for this role instance. Supports operational search, integrations, reports, and legacy references. Identifies the role instance and must not replace Party or specialized role identifiers. Optional when…
  - **Valid From** — Date from which this role is eligible for ordinary business processing. Used by eligibility and transaction validation. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a…
  - **Valid To** — Date after which the role is no longer normally eligible for new business processing. Used by eligibility, renewal, reporting, and expiry workflows. Historical transactions may continue referencing the role after validTo. Prevents new use…
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
  - **Return Number** (required) — Business-facing customer return reference. Identifies the return for customer service, warehouse and finance operations. Used in return authorization, transport, receiving, inspection, credit and audit. Distinct from customerReturnId, Ship…
  - **Status** (required, one of the Customer Return Status values) — Lifecycle state of the authorized customer return. Controls progression through transport, receipt, inspection, disposition, inventory and financial adjustment. Controls return processing and completion decisions. Return status does not it…
  - **Return Date** (required) — Date and time the return event was initiated or recognized. Anchors return chronology independently from receipt and credit-note dates. Used for service metrics, logistics, audit and policy evaluation. Distinct from shipment, receipt, disp…
  - **Reason Code** — Business reason supplied for the customer return. Explains why goods or services are being returned. Used for approval, quality, analytics, warranty and customer service. May differ from the financial CreditNote.reasonCode. Supports eligib…
  - **Notes** — Additional operational context for the return. Captures information not represented by structured return fields. Supports warehouse, customer service and audit review. Notes supplement but do not replace structured evidence. Provides conte…
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

A governed organizational unit grouping people, positions, responsibilities, and work within an Organization or BusinessUnit. Provide a canonical enterprise representation with stable identity and governed semantics. A governed organizational unit grouping people, positions, responsibilities, and work within an Organization or BusinessUnit. Used whenever enterprise processes need this concept as controlled master or reference data. Referenced by compatible domain entities and workflows while preserving a single canonical identity. Created under governance, maintained through controlled change…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code for Department. Human and integration-friendly identifier. Search, configuration, exchange and reporting. Unique within its governing context according to policy. Required.
  - **Name** (required) — Human-readable name of Department. Communicates the concept to business users. UI, documents and reports. Does not replace immutable identity. Required.
  - **Organization** (required, a Organization) — Governing Organization context for this record. Establishes ownership and enterprise context. Authorization, reporting and workflow. Exactly one Organization. Referenced workflows must remain compatible with governing context.

### Discount Rule

Defines reusable discount policy while leaving the actual applied discount as transaction evidence. A DiscountRule is a pricing policy; it is not the discount amount recorded on an order or invoice. Supports customer pricing, promotions, contracts, sales orders, purchase agreements, and invoicing. Product and pricing context determine the eligible base. DiscountRule determines the reduction. Tax rules then operate on the applicable taxable base according to jurisdiction and policy. Product/price → eligible discount rule → calculate discount → gross amount minus discount → taxable base → tax →…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Business identifier for the discount rule. Used in configuration, pricing, order entry, promotions, contracts, and integrations. Identifies the reusable rule, not its eventual transaction result. Allows a qualifying transaction to resolve…
  - **Name** (required) — Human-readable name of the discount rule. Used by business users when configuring or reviewing pricing. Describes the policy represented by the rule. Makes discount selection understandable during price determination.
  - **Method** (required, one of the Discount Rule Method values) — Defines how the discount is calculated. Determines whether the rule reduces an amount by a percentage or fixed monetary value. FIXED_AMOUNT requires a currency context; PERCENTAGE is applied to an eligible monetary base. Supplies the calcu…
  - **Value** (required) — Numeric discount value interpreted according to method. Used to calculate a transaction discount. For PERCENTAGE this is a percentage; for FIXED_AMOUNT this is a monetary value whose currency must be explicitly defined. Produces the transa…
  - **Currency** (a Currency) — Currency applicable when the discount method is FIXED_AMOUNT. Defines the denomination of a fixed discount. Not required for percentage discounts. Enables fixed discounts to be compared with the transaction's monetary base under valid curr…
  - **Priority** — Ordering value used when multiple discount rules qualify. Supports deterministic discount selection or stacking policy. Priority does not itself authorize stacking; the applicable pricing policy must define whether rules can combine. Helps…
  - **Status** (required, one of the Discount Rule Status values) — Controls whether the rule can be selected for new price calculations. Used by pricing and transaction validation. Retiring a rule must not change discounts already recorded on historical transactions. Controls future applicability while pr…

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

### Language

A governed language reference used for localization, communication preferences, content, and reporting. Provide a canonical enterprise representation with stable identity and governed semantics. A governed language reference used for localization, communication preferences, content, and reporting. Used whenever enterprise processes need this concept as controlled master or reference data. Referenced by compatible domain entities and workflows while preserving a single canonical identity. Created under governance, maintained through controlled changes, and retired or superseded without rewriti…

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code for Language. Human and integration-friendly identifier. Search, configuration, exchange and reporting. Unique within its governing context according to policy. Required.
  - **Name** (required) — Human-readable name of Language. Communicates the concept to business users. UI, documents and reports. Does not replace immutable identity. Required.

### Lead

Represents a crm entity called Lead within the CEDM business model. Lead is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Lead records. The entity participates in a wider business graph through relationships with Party, Customer, Party, Opportunity. These relationships provide the context needed to interpret the record rather than treating its f…

Readable by every signed-in person.

Fields:
  - **Lead Number** (required) — Captures the business meaning of lead number for the Lead. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validati…
  - **Status** (required, one of the Lead Status values) — The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Lead record…
  - **Source** — Captures the business meaning of source for the Lead. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, r…
  - **Estimated Value** — Captures the business meaning of estimated value for the Lead. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, vali…
  - **Party** (a Party) — Connects Lead to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a Lead. The declared cardinality 0..1 expresses how many related records may p…
  - **Customer** (a Customer) — Connects Lead to Customer so related business context can be navigated and enforced. Used when processes need to find or reason about Customer records associated with a Lead. The declared cardinality 0..1 expresses how many related records…
  - **Opportunity** (a Opportunity) — Connects Lead to Opportunity so related business context can be navigated and enforced. Used when processes need to find or reason about Opportunity records associated with a Lead. The declared cardinality 0..1 expresses how many related r…

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

### Opportunity

Represents a crm entity called Opportunity within the CEDM business model. Opportunity is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Opportunity records. The entity participates in a wider business graph through relationships with Customer, Party, Lead, SalesOrder. These relationships provide the context needed to interpret the record rather…

Readable by every signed-in person.

Fields:
  - **Opportunity Number** (required) — Captures the business meaning of opportunity number for the Opportunity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searc…
  - **Name** (required) — The human-readable name used by people, reports, searches, and related business processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Opportunity records, where applicable. Its meaning is specific to…
  - **Stage** (required, one of the Opportunity Stage values) — Captures the business meaning of stage for the Opportunity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validat…
  - **Probability** — Captures the business meaning of probability for the Opportunity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, v…
  - **Expected Value** — Captures the business meaning of expected value for the Opportunity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching…
  - **Expected Close Date** — Records the business date associated with the expected close. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating Oppo…
  - **Customer** (a Customer) — Connects Opportunity to Customer so related business context can be navigated and enforced. Used when processes need to find or reason about Customer records associated with a Opportunity. The declared cardinality 0..1 expresses how many r…
  - **Owner** (a Party) — Connects Opportunity to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a Opportunity. The declared cardinality 0..1 expresses how many related…
  - **Sales Order** (a Sales Order) — Connects Opportunity to SalesOrder so related business context can be navigated and enforced. Used when processes need to find or reason about SalesOrder records associated with a Opportunity. The declared cardinality 0..1 expresses how ma…

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
  - **Description** — Human-readable explanation of the payment policy and its operational interpretation. Used in configuration, audit, transaction review, and user guidance. Supplements structured rules and must not be the sole source for due-date calculation…
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

### Pricing

A governed pricing definition or decision context establishing base prices and applicability conditions before discounts, promotions, quotations, or orders. Provide canonical implementation-neutral semantics for Pricing across enterprise applications. A governed pricing definition or decision context establishing base prices and applicability conditions before discounts, promotions, quotations, or orders. Used in CRM, sales, fulfillment, logistics, reporting, integration, or audit processes where this concept applies. Connects to canonical parties, commercial transactions, logistics execution…

Readable by every signed-in person.

Fields:
  - **Code** — Business reference for Pricing. Human or integration-friendly reference where applicable. Search, exchange and reporting. Does not replace immutable identity. Optional when another transaction reference supplies business identity.

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
  - **Category** (a Product Category) — Links a product to product category, the category it relates to. Chosen from the existing product category records when the product is created or edited. A product has at most one product category in this role. Lets the product be found fr…
  - **Brand** (a Brand) — Commercial/manufacturer brand of Product. Supplies market identity independently of category. PIM, catalog, sales, sourcing and reporting. Optional for unbranded products. Brand lifecycle affects future catalog/master eligibility without r…

### Product Category

Represents one governed node in the Product classification hierarchy. ProductCategory provides taxonomy rather than operational state. It groups Products so people and systems can navigate, report, analyze, and govern the portfolio consistently. Product master-data management, catalogs, sales, procurement, inventory, reporting, analytics, search, tax, pricing, and eligibility rules where explicitly configured. Product references a category to establish classification. Parent and child categories form the taxonomy. Category hierarchy is distinct from Product composition, BillOfMaterial structu…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the product category: a value the business records on it. Entered or maintained when a product category is created or changed; shown on its form and available to search and reports. Read together with the product category's oth…
  - **Name** (required) — The name of the product category: a value the business records on it. Entered or maintained when a product category is created or changed; shown on its form and available to search and reports. Read together with the product category's oth…
  - **Description** — The description of the product category: a value the business records on it. Entered or maintained when a product category is created or changed; shown on its form and available to search and reports. Read together with the product categor…
  - **Status** (required, one of the Product Category Status values) — Lifecycle state controlling whether the category can be used for new classification. Set when a category is created and changed as it is taken out of use; filters which categories a product can be classified under. Status changes trigger v…
  - **Parent Category** (a Product Category) — Links a product category to product category, the parent category it relates to. Chosen from the existing product category records when the product category is created or edited. A product category has at most one product category in this…

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

A governed time- and eligibility-bounded commercial offer that may alter price, benefit, bundle, or fulfillment terms without rewriting base pricing. Provide canonical implementation-neutral semantics for Promotion across enterprise applications. A governed time- and eligibility-bounded commercial offer that may alter price, benefit, bundle, or fulfillment terms without rewriting base pricing. Used in CRM, sales, fulfillment, logistics, reporting, integration, or audit processes where this concept applies. Connects to canonical parties, commercial transactions, logistics execution, and downst…

Readable by every signed-in person.

Fields:
  - **Code** — Business reference for Promotion. Human or integration-friendly reference where applicable. Search, exchange and reporting. Does not replace immutable identity. Optional when another transaction reference supplies business identity.

### Prospect

A potential customer or account that has been identified but is not yet qualified as a Lead or established as a Customer. Provide canonical implementation-neutral semantics for Prospect across enterprise applications. A potential customer or account that has been identified but is not yet qualified as a Lead or established as a Customer. Used in CRM, sales, fulfillment, logistics, reporting, integration, or audit processes where this concept applies. Connects to canonical parties, commercial transactions, logistics execution, and downstream evidence without replacing their authoritative recor…

Readable by every signed-in person.

Fields:
  - **Code** — Business reference for Prospect. Human or integration-friendly reference where applicable. Search, exchange and reporting. Does not replace immutable identity. Optional when another transaction reference supplies business identity.
  - **Party** (required, a Party) — Party represented by prospect. Supplies canonical person/organization identity. CRM qualification and deduplication. Exactly one Party. Qualification may create Lead without duplicating Party.

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
  - **Organization** (a Organization) — Buying organization responsible for the commitment. Supports authorization, legal entity, budget, tax and reporting.
  - **Delivery Location** (a Location) — Intended operational destination for ordered goods or services. Used for receiving and logistics planning.
  - **Payment Term** (a Payment Term) — The PaymentTerm this PurchaseOrder belongs to.

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

### Quotation

Represents a commercial transaction called Quotation within the CEDM business model. Quotation is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Quotation records. The entity participates in a wider business graph through relationships with Customer, Opportunity, QuotationLine, PaymentTerm. These relationships provide the context needed to interp…

Readable by every signed-in person.

Fields:
  - **Quotation Number** (required) — Captures the business meaning of quotation number for the Quotation. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching…
  - **Quotation Date** (required) — Records the business date associated with the quotation. It is used in chronology, eligibility, scheduling, reporting, and related business rules. Used when creating, reviewing, searching, validating, reporting on, or integrating Quotation…
  - **Valid Until** — Captures the business meaning of valid until for the Quotation. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, val…
  - **Status** (required, one of the Quotation Status values) — The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Quotation r…
  - **Currency** (required, a Currency) — Identifies the currency in which monetary amounts on the record are expressed, allowing amounts to be interpreted and aggregated consistently. Used when creating, reviewing, searching, validating, reporting on, or integrating Quotation rec…
  - **Total Amount** (required) — Captures the business meaning of total amount for the Quotation. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, va…
  - **Customer** (required, a Customer) — Connects Quotation to Customer so related business context can be navigated and enforced. Used when processes need to find or reason about Customer records associated with a Quotation. The declared cardinality 1 expresses how many related…
  - **Opportunity** (a Opportunity) — Connects Quotation to Opportunity so related business context can be navigated and enforced. Used when processes need to find or reason about Opportunity records associated with a Quotation. The declared cardinality 0..1 expresses how many…
  - **Payment Terms** (a Payment Term) — Connects Quotation to PaymentTerm so related business context can be navigated and enforced. Used when processes need to find or reason about PaymentTerm records associated with a Quotation. The declared cardinality 0..1 expresses how many…

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

Represents the commercial customer commitment from which fulfillment and financial processes derive work. SalesOrder establishes accepted demand; it does not itself move inventory, prove shipment, or prove payment. Order management, allocation, inventory, warehouse execution, transportation, invoicing, customer service and revenue processes. Customer supplies commercial context, SalesOrderLine supplies demand detail, InventoryReservation supplies committed stock, InventoryMovement supplies stock execution, Shipment supplies transport evidence, and Invoice supplies financial claim evidence. Co…

Readable by every signed-in person.

Fields:
  - **Order Number** (required) — The order number of the sales order: a value the business records on it. Entered or maintained when a sales order is created or changed; shown on its form and available to search and reports. Read together with the sales order's other fiel…
  - **Order Date** (required) — The order date of the sales order: a point in time the business records on it. Entered or maintained when a sales order is created or changed; shown on its form and available to search and reports. Read together with the sales order's othe…
  - **Status** (required, one of the Sales Order Status values) — Order-level lifecycle state controlling commercial and fulfillment permissions. Drives confirmation, allocation, fulfillment, shipment readiness and cancellation. Summarizes downstream evidence; it is not an independent source of fulfillme…
  - **Currency** (a Currency) — The currency id of the sales order: a link to another record the business records on it. Entered or maintained when a sales order is created or changed; shown on its form and available to search and reports. Read together with the sales or…
  - **Requested Delivery Date** — The requested delivery date of the sales order: a calendar date the business records on it. Entered or maintained when a sales order is created or changed; shown on its form and available to search and reports. Read together with the sales…
  - **Total Amount** — The total amount of the sales order: a number the business records on it. Entered or maintained when a sales order is created or changed; shown on its form and available to search and reports. Read together with the sales order's other fie…
  - **Customer** (required, a Customer) — Links a sales order to customer, the customer it relates to. Chosen from the existing customer records when the sales order is created or edited. A sales order has exactly one customer in this role. Lets the sales order be found from, and…
  - **Organization** (a Organization) — Links a sales order to organization, the organization it relates to. Chosen from the existing organization records when the sales order is created or edited. A sales order has at most one organization in this role. Lets the sales order be…
  - **Delivery Location** (a Location) — Links a sales order to location, the delivery location it relates to. Chosen from the existing location records when the sales order is created or edited. A sales order has at most one location in this role. Lets the sales order be found f…
  - **Payment Term** (a Payment Term) — The PaymentTerm this SalesOrder belongs to.

Line items — **Sales Order Line**: kept inside each Sales Order and reached by opening it, never on their own. Authoritative commercial commitment at product/quantity level, reconciling transaction pricing with allocation, fulfillment and billing evidence. The line states what the customer agreed to buy and how it is priced. Reservations state committed stock, shipment/fulfillment events state what was deli…

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
  - **Payment Terms** (a Payment Term) — Default supplier settlement policy. Used by PurchaseOrder Invoice payables payment scheduling and cash forecasting. Transaction or contract terms may override the default. Supplies default payable timing. Optional.
  - **Status** (required, one of the Supplier Status values) — Supplier relationship lifecycle state. Controls procurement eligibility. Historical transactions remain valid after state changes. New procurement return claim-resolution and performance workflows must evaluate status. Required for eligibi…
  - **Party** (required, a Party) — Identifies the underlying person or organization performing this role. Provides common identity without duplicating Party data. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back t…
  - **Role Type** (required, one of the Supplier Role Type values) — Defines the business capacity in which the Party participates. Determines specialized capabilities, policies, workflows, and validations. Separate from Party.partyType, which describes whether the participant is a person or organization. S…
  - **Code** — Optional business-context identifier for this role instance. Supports operational search, integrations, reports, and legacy references. Identifies the role instance and must not replace Party or specialized role identifiers. Optional when…
  - **Valid From** — Date from which this role is eligible for ordinary business processing. Used by eligibility and transaction validation. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a…
  - **Valid To** — Date after which the role is no longer normally eligible for new business processing. Used by eligibility, renewal, reporting, and expiry workflows. Historical transactions may continue referencing the role after validTo. Prevents new use…
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

### Brand Status

- **ACTIVE** — Eligible for new assignment.
- **INACTIVE** — Temporarily unavailable for new assignment.
- **RETIRED** — Permanently unavailable for new assignment.

### Currency Status

- **ACTIVE** — Available for normal financial activity.
- **INACTIVE** — Temporarily unavailable for new normal activity.
- **RETIRED** — No longer available for new normal activity while historical financial records remain valid.

### Customer Credit Status

- **NOT REVIEWED** — The credit status of the customer is not reviewed; set it when that is what the business means for this record.
- **APPROVED** — The credit status of the customer is approved; set it when that is what the business means for this record.
- **ON HOLD** — The credit status of the customer is on hold; set it when that is what the business means for this record.
- **BLOCKED** — The credit status of the customer is blocked; set it when that is what the business means for this record.

### Customer Customer Type

- **INDIVIDUAL** — The customer type of the customer is individual; set it when that is what the business means for this record.
- **BUSINESS** — The customer type of the customer is business; set it when that is what the business means for this record.
- **GOVERNMENT** — The customer type of the customer is government; set it when that is what the business means for this record.
- **INTERNAL** — The customer type of the customer is internal; set it when that is what the business means for this record.
- **OTHER** — The customer type of the customer is other; set it when that is what the business means for this record.

### Customer Return Line Disposition

- **PENDING** — The disposition of the customer return line is pending; set it when that is what the business means for this record.
- **RESTOCK** — The disposition of the customer return line is restock; set it when that is what the business means for this record.
- **QUARANTINE** — The disposition of the customer return line is quarantine; set it when that is what the business means for this record.
- **REPAIR** — The disposition of the customer return line is repair; set it when that is what the business means for this record.
- **SCRAP** — The disposition of the customer return line is scrap; set it when that is what the business means for this record.
- **MIXED** — The disposition of the customer return line is mixed; set it when that is what the business means for this record.

### Customer Return Status

- **DRAFT** — The status of the customer return is draft; set it when that is what the business means for this record.
- **AUTHORIZED** — The status of the customer return is authorized; set it when that is what the business means for this record.
- **IN TRANSIT** — The status of the customer return is in transit; set it when that is what the business means for this record.
- **RECEIVED** — The status of the customer return is received; set it when that is what the business means for this record.
- **INSPECTION PENDING** — The status of the customer return is inspection pending; set it when that is what the business means for this record.
- **DISPOSITIONED** — The status of the customer return is dispositioned; set it when that is what the business means for this record.
- **COMPLETED** — The status of the customer return is completed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the customer return is cancelled; set it when that is what the business means for this record.
- **EXCEPTION** — The status of the customer return is exception; set it when that is what the business means for this record.

### Customer Role Type

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

### Customer Status

- **ACTIVE** — The status of the customer is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the customer is inactive; set it when that is what the business means for this record.
- **BLOCKED** — The status of the customer is blocked; set it when that is what the business means for this record.
- **RETIRED** — The status of the customer is retired; set it when that is what the business means for this record.

### Discount Rule Method

- **PERCENTAGE** — The method of the discount rule is percentage; set it when that is what the business means for this record.
- **FIXED AMOUNT** — The method of the discount rule is fixed amount; set it when that is what the business means for this record.

### Discount Rule Status

- **DRAFT** — The status of the discount rule is draft; set it when that is what the business means for this record.
- **ACTIVE** — The status of the discount rule is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the discount rule is inactive; set it when that is what the business means for this record.
- **RETIRED** — The status of the discount rule is retired; set it when that is what the business means for this record.

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

### Lead Status

- **NEW** — Represents the new state or classification in the context of Lead.
- **QUALIFYING** — Represents the qualifying state or classification in the context of Lead.
- **QUALIFIED** — Represents the qualified state or classification in the context of Lead.
- **DISQUALIFIED** — Represents the disqualified state or classification in the context of Lead.
- **CONVERTED** — Represents the converted state or classification in the context of Lead.
- **LOST** — Represents the lost state or classification in the context of Lead.

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

### Opportunity Stage

- **QUALIFICATION** — Represents the qualification state or classification in the context of Opportunity.
- **DISCOVERY** — Represents the discovery state or classification in the context of Opportunity.
- **PROPOSAL** — Represents the proposal state or classification in the context of Opportunity.
- **NEGOTIATION** — Represents the negotiation state or classification in the context of Opportunity.
- **WON** — Represents the won state or classification in the context of Opportunity.
- **LOST** — Represents the lost state or classification in the context of Opportunity.

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

### Product Category Status

- **ACTIVE** — The status of the product category is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the product category is inactive; set it when that is what the business means for this record.
- **RETIRED** — The status of the product category is retired; set it when that is what the business means for this record.

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

### Quotation Line Price Source

- **PRICE LIST** — The price source of the quotation line is price list; set it when that is what the business means for this record.
- **CONTRACT** — The price source of the quotation line is contract; set it when that is what the business means for this record.
- **CUSTOMER AGREEMENT** — The price source of the quotation line is customer agreement; set it when that is what the business means for this record.
- **MANUAL** — The price source of the quotation line is manual; set it when that is what the business means for this record.
- **PROMOTION** — The price source of the quotation line is promotion; set it when that is what the business means for this record.
- **OTHER** — The price source of the quotation line is other; set it when that is what the business means for this record.

### Quotation Status

- **DRAFT** — Represents the draft state or classification in the context of Quotation.
- **SUBMITTED** — Represents the submitted state or classification in the context of Quotation.
- **ACCEPTED** — Represents the accepted state or classification in the context of Quotation.
- **REJECTED** — Represents the rejected state or classification in the context of Quotation.
- **EXPIRED** — Represents the expired state or classification in the context of Quotation.
- **CANCELLED** — Represents the cancelled state or classification in the context of Quotation.

### Sales Order Line Price Source

- **PRICE LIST** — The price source of the sales order line is price list; set it when that is what the business means for this record.
- **CONTRACT** — The price source of the sales order line is contract; set it when that is what the business means for this record.
- **CUSTOMER AGREEMENT** — The price source of the sales order line is customer agreement; set it when that is what the business means for this record.
- **QUOTATION** — The price source of the sales order line is quotation; set it when that is what the business means for this record.
- **MANUAL** — The price source of the sales order line is manual; set it when that is what the business means for this record.
- **PROMOTION** — The price source of the sales order line is promotion; set it when that is what the business means for this record.
- **OTHER** — The price source of the sales order line is other; set it when that is what the business means for this record.

### Sales Order Status

- **DRAFT** — The status of the sales order is draft; set it when that is what the business means for this record.
- **CONFIRMED** — The status of the sales order is confirmed; set it when that is what the business means for this record.
- **ALLOCATED** — The status of the sales order is allocated; set it when that is what the business means for this record.
- **PARTIALLY FULFILLED** — The status of the sales order is partially fulfilled; set it when that is what the business means for this record.
- **FULFILLED** — The status of the sales order is fulfilled; set it when that is what the business means for this record.
- **CANCELLED** — The status of the sales order is cancelled; set it when that is what the business means for this record.

### Supplier Qualification Status

- **NOT REVIEWED** — The qualification status of the supplier is not reviewed; set it when that is what the business means for this record.
- **PENDING** — The qualification status of the supplier is pending; set it when that is what the business means for this record.
- **QUALIFIED** — The qualification status of the supplier is qualified; set it when that is what the business means for this record.
- **SUSPENDED** — The qualification status of the supplier is suspended; set it when that is what the business means for this record.
- **DISQUALIFIED** — The qualification status of the supplier is disqualified; set it when that is what the business means for this record.

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
Final: **LOST**.

Moves:
- NEW → QUALIFYING (Mark Qualifying)
- QUALIFYING → QUALIFIED (Mark Qualified)
- QUALIFIED → DISQUALIFIED (Mark Disqualified)
- DISQUALIFIED → CONVERTED (Mark Converted)
- QUALIFYING → LOST (Mark Lost)
- QUALIFIED → LOST (Mark Lost)
- DISQUALIFIED → LOST (Mark Lost)
- CONVERTED → LOST (Mark Lost)

### Opportunity — Opportunity Lifecycle

Starts at **QUALIFICATION**.
Final: **LOST**.

Moves:
- QUALIFICATION → DISCOVERY (Mark Discovery)
- DISCOVERY → PROPOSAL (Mark Proposal)
- PROPOSAL → WON (Mark Won)
- DISCOVERY → NEGOTIATION (Mark Negotiation)
- NEGOTIATION → DISCOVERY (Resume)
- PROPOSAL → NEGOTIATION (Mark Negotiation)
- NEGOTIATION → PROPOSAL (Resume)
- WON → NEGOTIATION (Mark Negotiation)
- NEGOTIATION → WON (Resume)
- DISCOVERY → LOST (Mark Lost)
- PROPOSAL → LOST (Mark Lost)
- WON → LOST (Mark Lost)
- NEGOTIATION → LOST (Mark Lost)

### Quotation — Quotation Lifecycle

Starts at **DRAFT**.
Final: **REJECTED**, **EXPIRED**, **CANCELLED**.

Moves:
- DRAFT → SUBMITTED (Submit)
- SUBMITTED → ACCEPTED (Accept)
- DRAFT → REJECTED (Reject)
- SUBMITTED → REJECTED (Reject)
- ACCEPTED → REJECTED (Reject)
- SUBMITTED → EXPIRED (Expire)
- ACCEPTED → EXPIRED (Expire)
- DRAFT → CANCELLED (Cancel)
- SUBMITTED → CANCELLED (Cancel)
- ACCEPTED → CANCELLED (Cancel)

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
Final: **DISPOSITIONED**, **CANCELLED**.

Moves:
- DRAFT → AUTHORIZED (Authorize)
- AUTHORIZED → IN TRANSIT (Mark In Transit)
- IN TRANSIT → RECEIVED (Receive)
- RECEIVED → COMPLETED (Complete)
- COMPLETED → DISPOSITIONED (Mark Dispositioned)
- AUTHORIZED → INSPECTION PENDING (Mark Inspection Pending)
- INSPECTION PENDING → AUTHORIZED (Resume)
- IN TRANSIT → INSPECTION PENDING (Mark Inspection Pending)
- INSPECTION PENDING → IN TRANSIT (Resume)
- RECEIVED → INSPECTION PENDING (Mark Inspection Pending)
- INSPECTION PENDING → RECEIVED (Resume)
- AUTHORIZED → EXCEPTION (Mark Exception)
- EXCEPTION → AUTHORIZED (Resolve Exception)
- IN TRANSIT → EXCEPTION (Mark Exception)
- EXCEPTION → IN TRANSIT (Resolve Exception)
- RECEIVED → EXCEPTION (Mark Exception)
- EXCEPTION → RECEIVED (Resolve Exception)
- DRAFT → CANCELLED (Cancel)
- AUTHORIZED → CANCELLED (Cancel)
- IN TRANSIT → CANCELLED (Cancel)
- RECEIVED → CANCELLED (Cancel)
- INSPECTION PENDING → CANCELLED (Cancel)
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
