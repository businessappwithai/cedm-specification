---
name: finance-domain
description: What the records of Finance are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Finance, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Finance

Finance and Accounting, built on the CEDM common foundation.

Everything below is the application's own description of itself, taken from the model it was generated from. Use these names when you talk to the person, and pass the record type's name as `entity` to the tools.

## Records

### Account

Represents a financial master entity called Account within the CEDM business model. Account is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Account records. The entity participates in a wider business graph through relationships with Account, Account, Organization. These relationships provide the context needed to interpret the record rather th…

Readable by every signed-in person.

Fields:
  - **Code** (required) — A human-readable business code used to identify or reference the record in operational processes and integrations. Used when creating, reviewing, searching, validating, reporting on, or integrating Account records, where applicable. Its me…
  - **Name** (required) — The human-readable name used by people, reports, searches, and related business processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Account records, where applicable. Its meaning is specific to Acc…
  - **Account Type** (required, one of the Account Account Type values) — Captures the business meaning of account type for the Account. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, vali…
  - **Status** (required, one of the Account Status values) — The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Account rec…
  - **Currency** (a Currency) — Identifies the currency in which monetary amounts on the record are expressed, allowing amounts to be interpreted and aggregated consistently. Used when creating, reviewing, searching, validating, reporting on, or integrating Account recor…
  - **Parent Account** (a Account) — Connects Account to Account so related business context can be navigated and enforced. Used when processes need to find or reason about Account records associated with a Account. The declared cardinality 0..1 expresses how many related rec…
  - **Organization** (a Organization) — Connects Account to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a Account. The declared cardinality 0..1 expresses how many r…

### Account Account Type

The values of account account type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Account Status

The values of account status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Asset Acquisition

A governed event recognizing acquisition and capitalization context for an Asset while keeping accounting posting in JournalEntry. Provide canonical enterprise semantics for AssetAcquisition. A governed event recognizing acquisition and capitalization context for an Asset while keeping accounting posting in JournalEntry. Used in asset, maintenance, treasury, banking, credit-risk, accounting, integration, and audit workflows where applicable. Connects operational or financial lifecycle evidence to canonical masters while keeping accounting, bank, and physical records authoritative in their own…

Readable by every signed-in person.

Fields:
  - **Effective At** — Effective timestamp for the record. Establishes temporal applicability or evidence cutoff. Lifecycle, reconciliation and reporting. Historical evidence before this time remains intact. Optional where the concept uses another effective peri…
  - **Asset** (required, a Asset) — Asset affected by this lifecycle record. Supplies canonical asset identity. Asset lifecycle and audit. Exactly one Asset. Event changes lifecycle state without rewriting prior asset evidence.

### Asset Class

A governed classification defining accounting, depreciation, lifecycle, and control defaults for Assets. Provide canonical enterprise semantics for AssetClass. A governed classification defining accounting, depreciation, lifecycle, and control defaults for Assets. Used in asset, maintenance, treasury, banking, credit-risk, accounting, integration, and audit workflows where applicable. Connects operational or financial lifecycle evidence to canonical masters while keeping accounting, bank, and physical records authoritative in their own domains. Created under governed conditions, progressed or…

Readable by every signed-in person.

Fields:
  - **Effective At** — Effective timestamp for the record. Establishes temporal applicability or evidence cutoff. Lifecycle, reconciliation and reporting. Historical evidence before this time remains intact. Optional where the concept uses another effective peri…

### Asset Depreciation

Represents the financial measurement of how an Asset's depreciable value is consumed over time or usage. AssetDepreciation translates an asset's economic consumption into an accounting measure. It is not a description of physical condition; an asset can be heavily depreciated while remaining operational, or have a high book value while requiring significant repair. Used by fixed-asset accounting, period close, financial reporting, asset valuation, disposal analysis, budgeting, management reporting, and repair/disposition economics. Asset identifies the resource. AssetDepreciation supplies the…

Readable by every signed-in person.

Fields:
  - **Depreciation Method** (required, one of the Asset Depreciation Depreciation Method values) — Defines the mathematical or business method used to allocate an asset's depreciable value over its useful life or usage. Drives depreciation calculations, period expense, net book value, forecasting, and financial reporting. The method mus…
  - **Depreciation Rate** — The rate used by applicable depreciation methods to calculate the portion of the depreciable base recognized during a period. Used by declining-balance or other rate-driven calculations and for financial forecasting. Rate is method-depende…
  - **Salvage Value** — The expected residual value that the asset's carrying amount should generally not depreciate below under the applicable accounting policy. Used to determine the depreciable base, depreciation limits, disposal analysis, and residual-value r…
  - **Useful Life Months** — The expected number of months over which the asset's depreciable value is allocated under a time-based depreciation policy. Used for straight-line and remaining-life calculations, asset planning, forecasting, and depreciation schedules. Us…
  - **Depreciable Base** — The portion of the asset's value subject to depreciation after considering the applicable acquisition basis and residual-value rules. Provides the financial basis from which depreciation expense is calculated. It is related to Asset acquis…
  - **Accumulated Depreciation** (required) — The cumulative depreciation recognized against the asset under this schedule up to the relevant accounting point. Used to determine carrying value, period depreciation, disposal gain or loss, and financial reporting. It is an accumulated f…
  - **Net Book Value** — The asset's carrying amount after recognized depreciation and other applicable accounting adjustments under this schedule. Used for balance-sheet reporting, disposal analysis, impairment assessment, management reporting, and asset valuatio…
  - **Asset** (required, a Asset) — Identifies the individual Asset whose financial depreciation is being measured. Connects depreciation calculations to the asset's acquisition, lifecycle, ownership, maintenance, and disposal history. Exactly one Asset is measured by a depr…
  - **Product** (a Product) — Identifies the standardized product or equipment definition relevant to the depreciated asset. Supports fleet/class-level depreciation analysis, equipment reporting, and policy assignment. Zero or one Product may be linked when depreciatio…
  - **Currency** (a Currency) — Identifies the currency in which monetary depreciation values are expressed. Used to interpret depreciable base, accumulated depreciation, salvage value, and net book value in financial reporting. Zero or one Currency may be linked when cu…

### Asset Depreciation Depreciation Method

The values of asset depreciation depreciation method, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Asset Disposal

A governed event retiring, selling, scrapping, or otherwise disposing of an Asset with auditable operational and accounting consequences. Provide canonical enterprise semantics for AssetDisposal. A governed event retiring, selling, scrapping, or otherwise disposing of an Asset with auditable operational and accounting consequences. Used in asset, maintenance, treasury, banking, credit-risk, accounting, integration, and audit workflows where applicable. Connects operational or financial lifecycle evidence to canonical masters while keeping accounting, bank, and physical records authoritative i…

Readable by every signed-in person.

Fields:
  - **Effective At** — Effective timestamp for the record. Establishes temporal applicability or evidence cutoff. Lifecycle, reconciliation and reporting. Historical evidence before this time remains intact. Optional where the concept uses another effective peri…
  - **Asset** (required, a Asset) — Asset affected by this lifecycle record. Supplies canonical asset identity. Asset lifecycle and audit. Exactly one Asset. Event changes lifecycle state without rewriting prior asset evidence.

### Asset Status

The values of asset status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Asset Transfer

A governed event transferring Asset responsibility, location, organizational assignment, or custody without rewriting acquisition history. Provide canonical enterprise semantics for AssetTransfer. A governed event transferring Asset responsibility, location, organizational assignment, or custody without rewriting acquisition history. Used in asset, maintenance, treasury, banking, credit-risk, accounting, integration, and audit workflows where applicable. Connects operational or financial lifecycle evidence to canonical masters while keeping accounting, bank, and physical records authoritative…

Readable by every signed-in person.

Fields:
  - **Effective At** — Effective timestamp for the record. Establishes temporal applicability or evidence cutoff. Lifecycle, reconciliation and reporting. Historical evidence before this time remains intact. Optional where the concept uses another effective peri…
  - **Asset** (required, a Asset) — Asset affected by this lifecycle record. Supplies canonical asset identity. Asset lifecycle and audit. Exactly one Asset. Event changes lifecycle state without rewriting prior asset evidence.

### Attachment

A governed file or content attachment associated with an enterprise record while preserving content identity and audit provenance. Provide durable, implementation-neutral governance semantics for Attachment. A governed file or content attachment associated with an enterprise record while preserving content identity and audit provenance. Used in contracts, documents, governance, compliance, risk, legal, service, finance, or audit workflows where applicable. Connects authoritative business records to controlled lifecycle, evidence, findings, and downstream remediation without replacing source t…

Readable by every signed-in person.

Fields:
  - **Effective At** — Time at which this record becomes effective or evidentially applicable. Establishes temporal business meaning. Lifecycle, audit and reporting. Does not rewrite earlier effective evidence. Optional when lifecycle does not require a separate…

### Bank Account

Represents the controlled banking account context through which cash is received, disbursed, observed, and reconciled. BankAccount is master data for the financial account; it is not a bank transaction, payment, or accounting entry. Central to treasury, Payment execution, BankTransaction ingestion, bank reconciliation, cash reporting, and accounting. Party provides ownership context. Organization provides the financial institution. Payment represents internal settlement events. BankTransaction represents external statement evidence. JournalEntry represents accounting consequences. BankAccount…

Readable by every signed-in person.

Fields:
  - **Account Number** (required) — Banking identifier for the account, subject to applicable security and masking controls. Identifies the account at the financial institution for operational settlement and reconciliation. Used for payment routing, bank-feed matching, state…
  - **Account Type** (required, one of the Bank Account Account Type values) — Classification of the banking account's operational purpose. Describes how the account is intended to function in treasury and settlement processes. Used for payment eligibility, cash reporting, treasury controls, and accounting configurat…
  - **Currency** (required, a Currency) — Currency in which the bank account is normally denominated. Establishes the account's primary monetary denomination and expected statement currency. Used by Payment, BankTransaction, reconciliation, cash reporting, and treasury controls. A…
  - **Status** (required, one of the Bank Account Status values) — Lifecycle state controlling whether the account can participate in new banking operations. Indicates whether the account is awaiting activation, available, restricted, or closed. Used by Payment execution, bank-feed ingestion, reconciliati…
  - **Institution** (required, a Organization) — Financial institution maintaining the bank account. Supports bank-feed configuration, payment routing, statements, reconciliation, and institution-specific rules. Exactly one institution maintains the account in this model. Connects accoun…

### Bank Account Account Type

The values of bank account account type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Bank Account Status

The values of bank account status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Billing Cycle

A governed recurring billing interval and cutoff definition used to determine charge-generation periods. Provide canonical enterprise semantics for BillingCycle while keeping planning, operational, financial and evidential responsibilities separated. A governed recurring billing interval and cutoff definition used to determine charge-generation periods. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain explicit through JournalEntry, Payment and Bank…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Billing Cycle Status values) — Governed lifecycle state. Indicates usability/execution state of BillingCycle. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal compl…

### Billing Cycle Status

The values of billing cycle status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Budget

Governed financial planning baseline. Budget records intended/authorized financial amounts while JournalEntry records actual accounting. Planning, spending control and variance reporting. BudgetLine supplies dimensional detail; FiscalPeriod supplies accounting time; Scenario supplies planning assumptions. Draft to submitted to approved/active to superseded/closed.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Business budget code. Human/integration reference for plan. Planning and reporting. Unique within organization/version policy. Required.
  - **Status** (required, one of the Budget Status values) — Budget governance state. Controls editability and authoritative planning use. Approval and control. Actual accounting remains in JournalEntry. Editable proposal. Awaiting approval. Authorized plan. Current control baseline. Replaced by lat…
  - **Organization** (required, a Organization) — Organization owning budget. Defines planning boundary. Planning and reporting. Exactly one Organization. Accounting dimensions must belong to compatible context.
  - **Fiscal Period** (a Fiscal Period) — Fiscal period governed by budget. Aligns plan with accounting time. Budget control and variance. Optional when budget spans multiple periods represented by lines. Does not open/close accounting period.
  - **Scenario** (a Scenario) — Planning scenario represented. Distinguishes baseline/upside/downside etc. Comparative planning. Optional for single-scenario plans. Scenario never changes actual ledger.

Line items — **Budget Line**: kept inside each Budget and reached by opening it, never on their own. Detailed dimensional budget allocation. Defines planned money at an account/responsibility intersection. Budgeting and variance analysis. Budget governs; Account/CostCenter/ProfitCenter classify.

### Budget Status

The values of budget status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Cash Position

Reproducible point-in-time treasury liquidity view. CashPosition summarizes cash; BankTransaction supplies external evidence, Payment supplies internal settlement state, and JournalEntry supplies accounting recognition. Daily cash management, liquidity, funding, payment planning and treasury reporting. BankAccount defines account/currency; bank transactions and payments supply observed/pending cash evidence. Calculated for an as-of cutoff → reviewed/published where required → retained or superseded by later snapshots. New/reversed/reconciled cash evidence affects subsequent positions and fore…

Readable by every signed-in person.

Fields:
  - **As Of** (required) — Effective timestamp of position. Defines evidence cutoff. Intraday/end-of-day liquidity. Transactions after cutoff are excluded. Required.
  - **Ledger Balance** (required) — Account balance recognized at cutoff under position policy. Baseline cash amount. Treasury reporting. Must be reproducible from authoritative evidence. Required.
  - **Available Balance** (required) — Cash considered available for use at cutoff. Liquidity available after restrictions/pending effects under policy. Funding and payment decisions. Currency must match account/position currency. Required.
  - **Forecast Balance** — Projected cash after included future inflows/outflows. Forward liquidity estimate, not posted cash. Treasury planning. Must identify forecast policy/horizon externally or through consuming process. Optional when no forecast is calculated.
  - **Bank Account** (required, a Bank Account) — Bank account positioned. Defines cash account context. Treasury and reconciliation. Exactly one BankAccount. Account status/currency constrain calculation.

### Charge

A governed billable monetary amount created from subscription, usage, service, product, fee, or adjustment rules before settlement. Provide canonical enterprise semantics for Charge while keeping planning, operational, financial and evidential responsibilities separated. A governed billable monetary amount created from subscription, usage, service, product, fee, or adjustment rules before settlement. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Charge Status values) — Governed lifecycle state. Indicates usability/execution state of Charge. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal completion.…
  - **Customer** (a Customer) — Customer owning or economically affected by record. Supplies commercial party context. Billing and entitlement. Optional for reusable definitions; required by applicable transaction policy. Financial settlement remains separate.

### Charge Status

The values of charge status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Cost Center

A governed responsibility center used to assign and analyze costs independently of legal-account identity. Provides planning/management semantics separately from actual accounting evidence. Planning, control, management reporting and analysis. Organization supplies governance; financial transactions remain authoritative for actuals.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code. Human/integration identifier. Planning and reporting. Unique within governing context. Required.
  - **Organization** (required, a Organization) — Governing organization. Defines management/reporting boundary. Planning and analysis. Exactly one Organization. References must use compatible organization context.

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

### Credit Note

Represents an explicit reduction of a customer's financial claim while preserving original invoice, return, accounting, application and refund evidence. CustomerReturn records reverse fulfillment; CreditNote records the financial adjustment; CreditNoteApplication records how it is consumed; Invoice remains the historical claim; JournalEntry records accounting; Payment records any refund cash. Customer returns, accounts receivable, billing corrections, tax adjustments, customer concessions, statements, audit and refunds. CustomerReturnLine provides returned quantity and approved credit basis.…

Readable by every signed-in person.

Fields:
  - **Credit Note Number** (required) — Business-facing reference assigned to the credit note. Identifies the adjustment in customer communication, tax documents, statements and finance operations. Used for reconciliation, customer service, reporting, tax and integrations. Disti…
  - **Credit Note Date** (required) — Commercial and accounting date of the credit adjustment. Establishes the temporal basis for accounting, tax and customer balance treatment. Used for accounting periods, tax reporting, statements and audit. May differ from CustomerReturn re…
  - **Status** (required, one of the Credit Note Status values) — Lifecycle state of the credit adjustment. Indicates preparation, authorization, accounting recognition, application to invoices, customer refund obligation, settlement, cancellation or reversal. Controls approval, posting, application, ref…
  - **Currency** (required, a Currency) — Currency in which the credit note is denominated. Defines the monetary denomination of all credit-note amounts. Used for calculation, tax, accounting, invoice application, customer balance and refund processing. Must normally match credite…
  - **Reason Code** (required) — Controlled business reason for issuing the credit. Explains why customer exposure is reduced. Used for approval, policy, analytics, tax, audit and customer communication. Return reason and financial credit reason may differ. Determines app…
  - **Subtotal** (required) — Aggregate credit value before document-level tax and adjustments. Sum of credit-note line bases after applicable line pricing treatment. Used for tax, reconciliation, accounting and reporting. Must reconcile with CreditNoteLine amounts and…
  - **Tax Amount** (required) — Tax component reversed or credited by the adjustment. Represents tax reduction associated with credited transaction. Used for tax reporting, accounting and reconciliation. Must reconcile with CreditNoteLine tax evidence and original Invoic…
  - **Total Amount** (required) — Total monetary reduction represented by the credit note. Amount by which eligible customer exposure is reduced before application or refund settlement. Used for receivable adjustment, statements, tax, accounting, application and refund dec…
  - **Amount Applied** (required) — Portion of the posted credit note already applied to eligible invoice balances. Represents non-cash use of the credit to reduce receivable exposure. Used for application status, statements and remaining credit calculation. Must reconcile w…
  - **Amount Refunded** (required) — Portion of the credit actually paid back to the customer. Represents cash settlement of customer credit. Used for refund reconciliation, customer balance and audit. Must reconcile with refund Payment evidence. Changes only after an authori…
  - **Amount Remaining** (required) — Unapplied and unrefunded portion of the posted credit. Represents remaining customer credit exposure available for application or refund. Drives application, refund and reconciliation decisions. Reconciles totalAmount against active applic…
  - **Customer** (required, a Customer) — Customer whose financial exposure is reduced. Identifies party receiving financial benefit. Supports statements, receivables, approval, tax, refund and audit. Provides customer eligibility and settlement context.

Line items — **Credit Note Line**: kept inside each Credit Note and reached by opening it, never on their own. Represents one auditable financial adjustment detail and its source evidence. CreditNoteLine translates an eligible original invoice or return into a specific credited value while preserving historical source facts. Return credits, billing corrections, tax adjustments, customer concessions and audi…

### Credit Note Application

Provides the auditable bridge by which a posted customer CreditNote is consumed against an Invoice. CreditNote establishes the authorized financial reduction; Invoice remains the original claim; CreditNoteApplication records exactly where and how much of the credit was used. Receivables, customer statements, returns, billing corrections, tax, reconciliation, audit and refund-versus-application decisions. CreditNoteLine explains source credit detail; InvoiceLine explains original claim detail; this entity records header-level application evidence; JournalEntry records accounting recognition; P…

Readable by every signed-in person.

Fields:
  - **Credit Note Amount** (required) — Portion of the CreditNote consumed by this application. Represents the source-side amount of credit allocated to an invoice. Controls remaining unapplied credit and reconciliation. Must use the CreditNote currency. Establishes the amount c…
  - **Invoice Amount** (required) — Amount by which the Invoice claim is reduced by this application. Represents the target-side financial effect on the invoice. Drives Invoice amountCredited and amountOutstanding. Must use the Invoice currency and may differ from creditNote…
  - **Exchange Rate** (a Exchange Rate) — Exchange rate used when CreditNote and Invoice currencies differ. Preserves conversion evidence for cross-currency credit application. Supports audit and reproducibility. Required for permitted cross-currency applications. Connects source…
  - **Applied At** (required) — Timestamp when the application became effective. Establishes adjustment chronology. Supports accounting periods, statements, audit and reconciliation. Distinct from CreditNoteDate and InvoiceDate. Determines when the Invoice credit project…
  - **Status** (required, one of the Credit Note Application Status values) — Lifecycle state of the application. Indicates whether the application currently reduces the invoice. Controls credit and invoice projections. CreditNote and Invoice statuses remain independent historical facts. ACTIVE creates the applicati…
  - **Reversal Of Application** (a Credit Note Application) — Prior application reversed by this record. Links correction to the original adjustment application. Supports audit and controlled reallocation. Reversal is a new historical event and does not edit the original. Enables correction while pre…
  - **Credit Note** (required, a Credit Note) — Customer credit note supplying the adjustment. Identifies the authorized financial credit being consumed. Supports credit lifecycle and reconciliation. Exactly one CreditNote supplies each application. Supplies available credit and currenc…
  - **Invoice** (required, a Invoice) — Invoice receiving the financial reduction. Identifies the claim whose outstanding exposure is reduced. Supports receivables and statements. Exactly one Invoice is targeted. Supplies eligible outstanding exposure and currency context.

### Credit Note Application Status

The values of credit note application status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Credit Note Status

The values of credit note status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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
  - **Payment Terms** — Default settlement policy for customer invoices. Used by SalesOrder Invoice receivables collections and cash forecasting. May be overridden by authorized contract or transaction-level terms. Supplies default due-date expectations to order…
  - **Status** (required, one of the Customer Status values) — Lifecycle state of the customer relationship. Controls eligibility for new commercial activity. Historical transactions remain attributable after status changes. New workflows must evaluate status; historical records remain valid. Required…
  - **Party** (required, a Party) — Identifies the underlying person or organization performing this role. Provides common identity without duplicating Party data. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back t…
  - **Role Type** (required, one of the Customer Role Type values) — Defines the business capacity in which the Party participates. Determines specialized capabilities, policies, workflows, and validations. Separate from Party.partyType, which describes whether the participant is a person or organization. S…
  - **Code** — Optional business-context identifier for this role instance. Supports operational search, integrations, reports, and legacy references. Identifies the role instance and must not replace Party or specialized role identifiers. Optional when…
  - **Valid From** — Date from which this role is eligible for ordinary business processing. Used by eligibility and transaction validation. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a…
  - **Valid To** — Date after which the role is no longer normally eligible for new business processing. Used by eligibility, renewal, reporting, and expiry workflows. Historical transactions may continue referencing the role after validTo. Prevents new use…
  - **Organization** (a Organization) — Optional organizational scope in which the role is recognized. Supports multi-enterprise, subsidiary, business-unit, and operating-context scenarios. Zero means global/context-independent; one means explicitly scoped to one organization. D…
  - **Tax Rule** (a Tax Rule) — The TaxRule this Customer belongs to.

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

### Fiscal Period

Accounting-period control for posting, close and reporting. FiscalPeriod determines whether an accounting date is currently eligible for recognition; it does not replace JournalEntry. General ledger, AP, AR, treasury, assets, inventory accounting, tax and financial close. Organization defines books; JournalEntry carries accounting date; period state controls posting eligibility. Future → open → soft closed → closed → locked, with governed reopen where policy permits. Closing/reopening immediately revalidates pending postings and close processes while preserving already posted history.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Business period code. Human-facing accounting interval reference such as 2026-09. Journals, close and reports. Unique within organization/calendar context. Required.
  - **Start Date** (required) — First accounting date in period. Defines lower posting boundary. Period determination. Inclusive with endDate. Required.
  - **End Date** (required) — Last accounting date in period. Defines upper posting boundary. Period determination and close. Must not precede startDate. Required.
  - **Status** (required, one of the Fiscal Period Status values) — Posting-control state. Governs permitted accounting recognition and correction. Journal validation and close. Historical posted entries remain immutable. Not yet normally postable. Normal posting allowed. Restricted adjustment posting only…
  - **Organization** (required, a Organization) — Accounting organization owning period. Establishes books/control boundary. Posting and reporting. Exactly one Organization. Journal organization must match.

### Fiscal Period Status

The values of fiscal period status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Forecast

A versioned forward-looking financial projection based on a defined scenario and as-of information, kept separate from approved budgets and actual accounting. Provides planning/management semantics separately from actual accounting evidence. Planning, control, management reporting and analysis. Organization supplies governance; financial transactions remain authoritative for actuals.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code. Human/integration identifier. Planning and reporting. Unique within governing context. Required.
  - **Organization** (required, a Organization) — Governing organization. Defines management/reporting boundary. Planning and analysis. Exactly one Organization. References must use compatible organization context.
  - **Scenario** (a Scenario) — Assumption scenario used by forecast. Identifies planning case. Forecast comparison. Optional. Scenario remains hypothetical.
  - **Fiscal Period** (a Fiscal Period) — Forecast accounting time bucket. Aligns projection to reporting period. Forecast-vs-actual. Optional for multi-period forecasts. Does not control ledger posting.

### Foreign Exchange Transaction

A governed agreement or execution exchanging one currency for another at defined amounts, rate, dates, and counterparties. Provide canonical enterprise semantics for ForeignExchangeTransaction. A governed agreement or execution exchanging one currency for another at defined amounts, rate, dates, and counterparties. Used in asset, maintenance, treasury, banking, credit-risk, accounting, integration, and audit workflows where applicable. Connects operational or financial lifecycle evidence to canonical masters while keeping accounting, bank, and physical records authoritative in their own domai…

Readable by every signed-in person.

Fields:
  - **Effective At** — Effective timestamp for the record. Establishes temporal applicability or evidence cutoff. Lifecycle, reconciliation and reporting. Historical evidence before this time remains intact. Optional where the concept uses another effective peri…

### Interest

A governed interest accrual or charge calculated for an eligible financial balance, rate basis, and period. Provide canonical enterprise semantics for Interest. A governed interest accrual or charge calculated for an eligible financial balance, rate basis, and period. Used in asset, maintenance, treasury, banking, credit-risk, accounting, integration, and audit workflows where applicable. Connects operational or financial lifecycle evidence to canonical masters while keeping accounting, bank, and physical records authoritative in their own domains. Created under governed conditions, progresse…

Readable by every signed-in person.

Fields:
  - **Effective At** — Effective timestamp for the record. Establishes temporal applicability or evidence cutoff. Lifecycle, reconciliation and reporting. Historical evidence before this time remains intact. Optional where the concept uses another effective peri…

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
  - **Customer** (a Customer) — Customer associated with a sales invoice. Identifies the party against whom a receivable claim is established. Supports receivables, statements, collections, tax, credit, and customer reporting. Required for SALES invoices unless another c…
  - **Supplier** (a Supplier) — Supplier associated with a purchase invoice. Identifies the party to whom a payable claim relates. Supports payables, supplier statements, procurement reconciliation, tax, and payment processing. Required for PURCHASE invoices unless anoth…
  - **Sales Order** (a Sales Order) — Sales commitment from which a sales invoice may originate. Connects customer demand commitment to the resulting financial claim. Supports order-to-cash traceability, billing reconciliation, and revenue processes. SalesOrder is the commerci…
  - **Purchase Order** (a Purchase Order) — Procurement commitment against which a supplier invoice may be evaluated. Connects supplier commitment to the resulting payable claim. Supports three-way matching and accounts payable controls. PurchaseOrder is commitment; GoodsReceipt is…

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

### Journal Entry

Represents accounting recognition of a business event in a balanced double-entry ledger. JournalEntry is the accounting representation, not the operational event itself. Payment records settlement activity, BankTransaction records external bank evidence, Invoice records a claim, CreditNote records customer adjustment, SupplierCreditNote records supplier payable adjustment, SupplierDebitNote records buyer recovery, and JournalEntry records accounting recognition. General ledger, accounts receivable, accounts payable, treasury, inventory accounting, asset accounting, tax, audit, period close an…

Readable by every signed-in person.

Fields:
  - **Entry Number** (required) — Human-facing accounting journal reference. Used by accountants, auditors, reports and integrations. Distinct from source transaction numbers such as Invoice, Payment, CreditNote, SupplierCreditNote and SupplierDebitNote references. Identif…
  - **Entry Date** (required) — Accounting date at which the entry is recognized. Determines accounting period, reporting chronology and period controls. May differ from originating transaction, bank value, invoice, CreditNote, SupplierCreditNote or SupplierDebitNote dat…
  - **Status** (required, one of the Journal Entry Status values) — Accounting lifecycle state. Controls editing, posting, reporting and reversal permissions. Independent of Payment, Invoice, CreditNote, SupplierCreditNote, SupplierDebitNote and BankTransaction statuses. DRAFT permits preparation; POSTED e…
  - **Description** — Human-readable explanation of the accounting event. Supports review, audit, reconciliation and reporting. Complements source transaction and lines; must not be sole accounting evidence. Helps accountants understand why the entry was genera…
  - **Currency** (a Currency) — The Currency this JournalEntry belongs to.
  - **Payment** (a Payment) — Payment whose financial recognition is represented when applicable. Supports cash, receivable, payable, clearing, fee and settlement accounting traceability. Optional because not every journal entry originates from a payment. A posted paym…
  - **Credit Note** (a Credit Note) — Customer CreditNote whose financial adjustment is represented. Supports receivable, revenue, tax, inventory-related and refund-obligation accounting traceability. Optional because not every journal entry represents a customer credit. Credi…
  - **Organization** (a Organization) — Organization whose books recognize the accounting entry. Supports legal-entity accounting, reporting, period control and ledger ownership. Optional when organization is inherited from ledger context. Determines accounting boundary and appl…
  - **Fiscal Period** (a Fiscal Period) — Accounting control period containing entryDate. Establishes posting eligibility and close context. Posting, close, reporting and audit. Required for POSTED entries under period-controlled accounting; optional while draft before determinati…
  - **Ledger** (a Ledger) — The Ledger this JournalEntry belongs to.

### Journal Entry Line

Represents a financial transaction line called JournalEntryLine within the CEDM business model. JournalEntryLine is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate JournalEntryLine records. The entity participates in a wider business graph through relationships with JournalEntry, Account. These relationships provide the context needed to interpret…

Readable by every signed-in person.

Fields:
  - **Line Number** (required) — Captures the business meaning of line number for the JournalEntryLine. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searchi…
  - **Debit Amount** (required) — Captures the business meaning of debit amount for the JournalEntryLine. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, search…
  - **Credit Amount** (required) — Captures the business meaning of credit amount for the JournalEntryLine. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searc…
  - **Description** — A business description that explains the purpose, scope, or meaning of the record to users and downstream processes. Used when creating, reviewing, searching, validating, reporting on, or integrating JournalEntryLine records, where applica…
  - **Journal Entry** (required, a Journal Entry) — Connects JournalEntryLine to JournalEntry so related business context can be navigated and enforced. Used when processes need to find or reason about JournalEntry records associated with a JournalEntryLine. The declared cardinality 1 expre…
  - **Account** (required, a Account) — Connects JournalEntryLine to Account so related business context can be navigated and enforced. Used when processes need to find or reason about Account records associated with a JournalEntryLine. The declared cardinality 1 expresses how m…

### Journal Entry Status

The values of journal entry status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Ledger

A governed accounting book defining the scope in which journal entries are recorded and reported. Provide canonical enterprise semantics for Ledger while keeping planning, operational, financial and evidential responsibilities separated. A governed accounting book defining the scope in which journal entries are recorded and reported. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain explicit through JournalEntry, Payment and BankTransaction where ap…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Ledger Status values) — Governed lifecycle state. Indicates usability/execution state of Ledger. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal completion.…
  - **Organization** (required, a Organization) — Organization owning accounting book. Defines legal/management accounting boundary. Posting and reporting. Exactly one Organization. Journal entries must use compatible organization context.

### Ledger Status

The values of ledger status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Tax Rule** (a Tax Rule) — The TaxRule this Organization belongs to.

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
  - **Bank Account** (a Bank Account) — The BankAccount this Party belongs to.

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

### Payment

Represents movement or recognition of money while keeping payment execution, claim settlement, bank evidence, accounting recognition, customer refunds and supplier-credit refunds as separate connected facts. Payment is the settlement event. Invoice is the claim. PaymentAllocation applies receipt payments to claims. CreditNote is a customer financial adjustment. SupplierCreditNote is a supplier payable adjustment. A refund or settlement Payment is separate cash evidence. Accounts receivable, accounts payable, treasury, banking integrations, cash management, reconciliation, collections, supplie…

Readable by every signed-in person.

Fields:
  - **Payment Number** (required) — Business-facing payment reference. Reference communicated in remittance, statements, bank reconciliation and payment inquiries. Finance, counterparties, integrations and reconciliation. Distinct from paymentId and bank transaction identifi…
  - **Payment Date** (required) — Timestamp at which the payment event is recognized by the business process. Establishes internal settlement chronology. Accounting periods, cash reporting, reconciliation and settlement analysis. Distinct from bank value date, clearing dat…
  - **Direction** (required, one of the Payment Direction values) — Indicates whether the organization receives or disburses money. Establishes cash-flow direction and payer/payee interpretation. Receivables, payables, treasury, accounting and refunds/credit settlements. Customer refund and supplier-credit…
  - **Status** (required, one of the Payment Status values) — Lifecycle state of the payment event. Indicates authorization, internal recognition, external clearing, invalidation or reversal. Controls execution, reconciliation, reporting and correction. Independent of Invoice, CreditNote, SupplierCre…
  - **Amount** (required) — Total monetary value of the payment event. Represents money received or disbursed, not the amount allocated to one claim or credit. Cash position, allocation validation, accounting and reconciliation. PaymentAllocation distributes receipt…
  - **Currency** (required, a Currency) — Currency denomination of the payment. Defines interpretation of payment amount. Allocation, exchange-rate selection, bank reconciliation, accounting and reporting. May differ from invoice or credit currency only with explicit ExchangeRate…
  - **Payment Method** (required, one of the Payment Payment Method values) — Mechanism through which payment is executed or received. Describes how money moves rather than which obligation it settles. Execution, bank matching, treasury and reconciliation. Refund or supplier-credit settlement method must satisfy app…
  - **Value Date** — Economic effective date of funds under settlement convention. Distinguishes economic cash availability from internal creation time. Cash forecasting, interest, reconciliation and accounting analysis. May differ from paymentDate and bank cl…
  - **External Reference** — External remittance, bank, processor or instrument reference. Connects internal payment evidence to external settlement identifier. Bank reconciliation, remittance matching, gateway reconciliation and audit. Does not replace allocations or…
  - **Payer** (a Party) — Party providing money for a receipt or associated with a disbursement. Identifies source-side party. Customer receipts, refunds, supplier settlements and audit. Optional for aggregated/external settlement. Supplies party context.
  - **Bank Account** (a Bank Account) — Bank account through which payment is expected to be received or disbursed. Connects payment to internal financial account. Treasury, cash management, execution and reconciliation. Optional for cash or externally managed methods. Provides…
  - **Supplier** (a Supplier) — The Supplier this Payment belongs to.
  - **Customer** (a Customer) — The Customer this Payment belongs to.
  - **Cash Position** (a Cash Position) — The CashPosition this Payment belongs to.

Line items — **Payment Allocation**: kept inside each Payment and reached by opening it, never on their own. Provides the controlled bridge between a Payment event and an Invoice claim. Payment says money moved; Invoice says money is owed; PaymentAllocation says exactly how much of that payment satisfies that claim. Central to receivables, payables, collections, payment reconciliation, bank reconciliation…

### Payment Allocation Status

The values of payment allocation status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Payment Direction

The values of payment direction, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Payment Instruction

A governed instruction authorizing or requesting a future payment through a bank or payment channel, separate from the resulting Payment and BankTransaction evidence. Provide canonical enterprise semantics for PaymentInstruction while keeping planning, operational, financial and evidential responsibilities separated. A governed instruction authorizing or requesting a future payment through a bank or payment channel, separate from the resulting Payment and BankTransaction evidence. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Payment Instruction Status values) — Governed lifecycle state. Indicates usability/execution state of PaymentInstruction. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal…
  - **Bank Account** (required, a Bank Account) — Bank account from/to which payment is instructed. Supplies treasury settlement account. Payment execution. Exactly one BankAccount. Instruction does not itself prove bank settlement.
  - **Payment** (a Payment) — Payment resulting from executed instruction. Connects intent to settlement transaction. Treasury reconciliation. Optional until execution. Retries must not create duplicate Payment.

### Payment Instruction Status

The values of payment instruction status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Payment Payment Method

The values of payment payment method, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Payment Status

The values of payment status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Tax Rule** (a Tax Rule) — The TaxRule this Product belongs to.

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

### Profit Center

A governed responsibility center used to analyze revenue, cost, and profitability independently of legal-account identity. Provides planning/management semantics separately from actual accounting evidence. Planning, control, management reporting and analysis. Organization supplies governance; financial transactions remain authoritative for actuals.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code. Human/integration identifier. Planning and reporting. Unique within governing context. Required.
  - **Organization** (required, a Organization) — Governing organization. Defines management/reporting boundary. Planning and analysis. Exactly one Organization. References must use compatible organization context.

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

### Scenario

Alternative planning assumption context. Separates hypothetical plans from actual outcomes. Budgeting, forecasting and sensitivity analysis. Budget and Forecast may reference it.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Scenario business code. Identifies baseline/upside/downside or named case. Planning and reports. Does not identify actual ledger. Required.
  - **Status** (required, one of the Scenario Status values) — Scenario lifecycle. Controls new planning use. Planning governance. Historical plans retain scenario reference. Being prepared. Available for plans. Closed to new normal use. Required.

### Scenario Status

The values of scenario status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Subscription

A governed customer subscription to a plan, product, service, or entitlement over a defined lifecycle. Provide canonical enterprise semantics for Subscription while keeping planning, operational, financial and evidential responsibilities separated. A governed customer subscription to a plan, product, service, or entitlement over a defined lifecycle. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain explicit through JournalEntry, Payment and BankTran…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Subscription Status values) — Governed lifecycle state. Indicates usability/execution state of Subscription. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal compl…
  - **Customer** (a Customer) — Customer owning or economically affected by record. Supplies commercial party context. Billing and entitlement. Optional for reusable definitions; required by applicable transaction policy. Financial settlement remains separate.

### Subscription Plan

A governed reusable commercial plan defining recurring, usage, entitlement, pricing, and billing terms for subscriptions. Provide canonical enterprise semantics for SubscriptionPlan while keeping planning, operational, financial and evidential responsibilities separated. A governed reusable commercial plan defining recurring, usage, entitlement, pricing, and billing terms for subscriptions. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain explicit…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Subscription Plan Status values) — Governed lifecycle state. Indicates usability/execution state of SubscriptionPlan. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal c…

### Subscription Plan Status

The values of subscription plan status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Subscription Status

The values of subscription status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Tax Code

A governed tax classification code used to select applicable tax rules, rates, jurisdictions, registrations, and reporting treatment. Provide canonical enterprise semantics for TaxCode while keeping planning, operational, financial and evidential responsibilities separated. A governed tax classification code used to select applicable tax rules, rates, jurisdictions, registrations, and reporting treatment. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects r…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Code Status values) — Governed lifecycle state. Indicates usability/execution state of TaxCode. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal completion…
  - **Organization** (a Organization) — Organization to which tax record applies. Establishes taxpayer/reporting context. Tax determination and reporting. Optional for globally reusable tax reference data. Transactional tax evidence must use compatible registration/jurisdiction.

### Tax Code Status

The values of tax code status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Jurisdiction

A governed geographic or legal authority under which taxes are imposed, collected, reported, or remitted. Provide canonical enterprise semantics for TaxJurisdiction while keeping planning, operational, financial and evidential responsibilities separated. A governed geographic or legal authority under which taxes are imposed, collected, reported, or remitted. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain explicit through JournalEntry, Payment and…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Jurisdiction Status values) — Governed lifecycle state. Indicates usability/execution state of TaxJurisdiction. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal co…
  - **Organization** (a Organization) — Organization to which tax record applies. Establishes taxpayer/reporting context. Tax determination and reporting. Optional for globally reusable tax reference data. Transactional tax evidence must use compatible registration/jurisdiction.

### Tax Jurisdiction Status

The values of tax jurisdiction status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Rate

A governed effective-dated tax percentage or amount applicable under a TaxCode and TaxJurisdiction. Provide canonical enterprise semantics for TaxRate while keeping planning, operational, financial and evidential responsibilities separated. A governed effective-dated tax percentage or amount applicable under a TaxCode and TaxJurisdiction. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain explicit through JournalEntry, Payment and BankTransaction whe…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Rate Status values) — Governed lifecycle state. Indicates usability/execution state of TaxRate. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal completion…
  - **Organization** (a Organization) — Organization to which tax record applies. Establishes taxpayer/reporting context. Tax determination and reporting. Optional for globally reusable tax reference data. Transactional tax evidence must use compatible registration/jurisdiction.

### Tax Rate Status

The values of tax rate status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Registration

A governed registration of a Party or Organization with a TaxJurisdiction and tax authority. Provide canonical enterprise semantics for TaxRegistration while keeping planning, operational, financial and evidential responsibilities separated. A governed registration of a Party or Organization with a TaxJurisdiction and tax authority. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain explicit through JournalEntry, Payment and BankTransaction where app…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Registration Status values) — Governed lifecycle state. Indicates usability/execution state of TaxRegistration. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal co…
  - **Organization** (a Organization) — Organization to which tax record applies. Establishes taxpayer/reporting context. Tax determination and reporting. Optional for globally reusable tax reference data. Transactional tax evidence must use compatible registration/jurisdiction.

### Tax Registration Status

The values of tax registration status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Rule

Defines reusable tax policy used to determine tax treatment and calculate tax amounts. TaxRule is policy; transaction tax evidence records what tax was actually determined and charged. Sales, procurement, invoicing, tax reporting, accounting and compliance. Discount determination normally establishes the post-discount base. Product, Customer, Organization, Location, transaction date and jurisdiction determine TaxRule applicability. InvoiceLine or TaxLine records the resulting tax. Gross amount → discount → taxable base → resolve effective TaxRule → calculate tax → round → snapshot tax evidenc…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the tax rule: a value the business records on it. Entered or maintained when a tax rule is created or changed; shown on its form and available to search and reports. Read together with the tax rule's other fields and its relati…
  - **Name** (required) — The name of the tax rule: a value the business records on it. Entered or maintained when a tax rule is created or changed; shown on its form and available to search and reports. Read together with the tax rule's other fields and its relati…
  - **Rate** (required) — The rate of the tax rule: a number the business records on it. Entered or maintained when a tax rule is created or changed; shown on its form and available to search and reports. Read together with the tax rule's other fields and its relat…
  - **Jurisdiction Code** — The jurisdiction code of the tax rule: a value the business records on it. Entered or maintained when a tax rule is created or changed; shown on its form and available to search and reports. Read together with the tax rule's other fields a…
  - **Tax Type** (required, one of the Tax Rule Tax Type values) — The tax type of the tax rule: a value the business records on it. Entered or maintained when a tax rule is created or changed; shown on its form and available to search and reports. Read together with the tax rule's other fields and its re…
  - **Valid From** — The valid from of the tax rule: a point in time the business records on it. Entered or maintained when a tax rule is created or changed; shown on its form and available to search and reports. Read together with the tax rule's other fields…
  - **Valid To** — The valid to of the tax rule: a point in time the business records on it. Entered or maintained when a tax rule is created or changed; shown on its form and available to search and reports. Read together with the tax rule's other fields an…
  - **Status** (required, one of the Tax Rule Status values) — The status of the tax rule: a value the business records on it. Entered or maintained when a tax rule is created or changed; shown on its form and available to search and reports. Read together with the tax rule's other fields and its rela…
  - **Invoice Line** (a Invoice Line) — The InvoiceLine this TaxRule belongs to.
  - **Credit Note Line** (a Credit Note Line) — The CreditNoteLine this TaxRule belongs to.
  - **Jurisdiction** (a Location) — Links a tax rule to location, the jurisdiction it relates to. Chosen from the existing location records when the tax rule is created or edited. A tax rule has at most one location in this role. Lets the tax rule be found from, and reported…

### Tax Rule Status

The values of tax rule status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Rule Tax Type

The values of tax rule tax type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Transaction

A governed tax consequence derived from a taxable business transaction and retained separately from payment and general-ledger posting. Provide canonical enterprise semantics for TaxTransaction while keeping planning, operational, financial and evidential responsibilities separated. A governed tax consequence derived from a taxable business transaction and retained separately from payment and general-ledger posting. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cas…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Transaction Status values) — Governed lifecycle state. Indicates usability/execution state of TaxTransaction. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal com…
  - **Organization** (a Organization) — Organization to which tax record applies. Establishes taxpayer/reporting context. Tax determination and reporting. Optional for globally reusable tax reference data. Transactional tax evidence must use compatible registration/jurisdiction.

### Tax Transaction Status

The values of tax transaction status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Usage Record

An immutable measured usage event or aggregate used for usage-based entitlement and billing. Provide canonical enterprise semantics for UsageRecord while keeping planning, operational, financial and evidential responsibilities separated. An immutable measured usage event or aggregate used for usage-based entitlement and billing. Used by applicable finance, treasury, tax, subscription, billing, reporting and integration workflows. References canonical parties and transactions; downstream accounting and cash effects remain explicit through JournalEntry, Payment and BankTransaction where applica…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Usage Record Status values) — Governed lifecycle state. Indicates usability/execution state of UsageRecord. Workflow and controls. Historical terminal evidence is retained. Being prepared. Effective or executing. Concluded successfully. Terminated without normal comple…
  - **Customer** (a Customer) — Customer owning or economically affected by record. Supplies commercial party context. Billing and entitlement. Optional for reusable definitions; required by applicable transaction policy. Financial settlement remains separate.

### Usage Record Status

The values of usage record status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Variance

A derived comparison between planned, forecast, or actual financial measures for a defined period and dimensional context. Provides planning/management semantics separately from actual accounting evidence. Planning, control, management reporting and analysis. Organization supplies governance; financial transactions remain authoritative for actuals.

Readable by every signed-in person.

Fields:
  - **Code** (required) — Governed business code. Human/integration identifier. Planning and reporting. Unique within governing context. Required.
  - **Organization** (required, a Organization) — Governing organization. Defines management/reporting boundary. Planning and analysis. Exactly one Organization. References must use compatible organization context.
  - **Budget** (a Budget) — Budget baseline compared. Supplies planned value source. Budget-vs-actual analysis. Optional for forecast-only comparison. Analysis cannot mutate budget.
  - **Forecast** (a Forecast) — Forecast baseline compared. Supplies projected value source. Forecast-vs-actual/budget analysis. Optional. Analysis cannot mutate forecast.

## Value lists

### Account Account Type

- **ASSET** — Represents the asset state or classification in the context of Account.
- **LIABILITY** — Represents the liability state or classification in the context of Account.
- **EQUITY** — Represents the equity state or classification in the context of Account.
- **REVENUE** — Represents the revenue state or classification in the context of Account.
- **EXPENSE** — Represents the expense state or classification in the context of Account.
- **CONTRA** — Represents the contra state or classification in the context of Account.

### Account Status

- **ACTIVE** — Represents the active state or classification in the context of Account.
- **INACTIVE** — Represents the inactive state or classification in the context of Account.
- **RETIRED** — Represents the retired state or classification in the context of Account.

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

### Asset Depreciation Depreciation Method

- **STRAIGHT** — Allocates depreciable value systematically over the defined useful life, normally producing an approximately even periodic depreciation amount.
- **REM LIFE** — Calculates depreciation using the asset's remaining depreciable value and remaining useful life under the organization's remaining-life policy.
- **RED BAL** — Applies a declining-balance approach in which depreciation is calculated at a defined rate against an appropriate declining carrying base.
- **NBVSLUNIT** — Allocates depreciation based on usage units or output relative to the expected total units, appropriate where consumption rather than elapsed time drives asset value reduction.

### Asset Status

- **PLANNED** — The asset is expected to enter service or be recognized operationally but is not yet active.
- **ACTIVE** — The asset is available for its intended business use subject to normal operational constraints.
- **UNDER MAINTENANCE** — The asset is temporarily undergoing maintenance and may be unavailable or restricted from normal use.
- **HELD** — The asset is intentionally retained but is not currently available for normal productive use, often pending inspection, disposition, or another decision.
- **DISPOSED** — The organization has completed the disposition process and no longer treats the asset as an active managed resource.
- **RETIRED** — The asset has been withdrawn from operational use, while historical records may remain available for audit and analysis.

### Bank Account Account Type

- **CURRENT** — Operational transaction account normally used for frequent receipts/disbursements.
- **SAVINGS** — Account primarily maintained for savings or reserve purposes.
- **LOAN** — Account associated with borrowing or loan-related banking arrangements.
- **ESCROW** — Account holding funds under controlled escrow arrangements.
- **OTHER** — Controlled account type outside the standard classifications.

### Bank Account Status

- **PENDING** — Account setup or verification is incomplete.
- **ACTIVE** — Available for authorized banking activity.
- **BLOCKED** — Temporarily prohibited from applicable activity.
- **CLOSED** — Permanently unavailable for new normal activity.

### Billing Cycle Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

### Budget Status

- **DRAFT** — Editable proposal.
- **SUBMITTED** — Awaiting approval.
- **APPROVED** — Authorized plan.
- **ACTIVE** — Current control baseline.
- **SUPERSEDED** — Replaced by later plan.
- **CLOSED** — Planning cycle ended.

### Charge Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

### Credit Note Application Status

- **DRAFT** — The status of the credit note application is draft; set it when that is what the business means for this record.
- **ACTIVE** — The status of the credit note application is active; set it when that is what the business means for this record.
- **REVERSED** — The status of the credit note application is reversed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the credit note application is cancelled; set it when that is what the business means for this record.

### Credit Note Status

- **DRAFT** — The status of the credit note is draft; set it when that is what the business means for this record.
- **APPROVED** — The status of the credit note is approved; set it when that is what the business means for this record.
- **POSTED** — The status of the credit note is posted; set it when that is what the business means for this record.
- **PARTIALLY APPLIED** — The status of the credit note is partially applied; set it when that is what the business means for this record.
- **FULLY APPLIED** — The status of the credit note is fully applied; set it when that is what the business means for this record.
- **REFUND DUE** — The status of the credit note is refund due; set it when that is what the business means for this record.
- **REFUNDED** — The status of the credit note is refunded; set it when that is what the business means for this record.
- **CANCELLED** — The status of the credit note is cancelled; set it when that is what the business means for this record.
- **REVERSED** — The status of the credit note is reversed; set it when that is what the business means for this record.

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

### Fiscal Period Status

- **FUTURE** — Not yet normally postable.
- **OPEN** — Normal posting allowed.
- **SOFT CLOSED** — Restricted adjustment posting only.
- **CLOSED** — Ordinary posting prohibited.
- **LOCKED** — Administratively locked against posting/reopen without exceptional governance.

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

### Journal Entry Status

- **DRAFT** — The status of the journal entry is draft; set it when that is what the business means for this record.
- **POSTED** — The status of the journal entry is posted; set it when that is what the business means for this record.
- **REVERSED** — The status of the journal entry is reversed; set it when that is what the business means for this record.

### Ledger Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

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

### Payment Allocation Status

- **DRAFT** — The status of the payment allocation is draft; set it when that is what the business means for this record.
- **ACTIVE** — The status of the payment allocation is active; set it when that is what the business means for this record.
- **REVERSED** — The status of the payment allocation is reversed; set it when that is what the business means for this record.
- **CANCELLED** — The status of the payment allocation is cancelled; set it when that is what the business means for this record.

### Payment Direction

- **RECEIPT** — The direction of the payment is receipt; set it when that is what the business means for this record.
- **DISBURSEMENT** — The direction of the payment is disbursement; set it when that is what the business means for this record.

### Payment Instruction Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

### Payment Payment Method

- **CASH** — The payment method of the payment is cash; set it when that is what the business means for this record.
- **BANK TRANSFER** — The payment method of the payment is bank transfer; set it when that is what the business means for this record.
- **CARD** — The payment method of the payment is card; set it when that is what the business means for this record.
- **CHEQUE** — The payment method of the payment is cheque; set it when that is what the business means for this record.
- **DIRECT DEBIT** — The payment method of the payment is direct debit; set it when that is what the business means for this record.
- **OTHER** — The payment method of the payment is other; set it when that is what the business means for this record.

### Payment Status

- **DRAFT** — The status of the payment is draft; set it when that is what the business means for this record.
- **APPROVED** — The status of the payment is approved; set it when that is what the business means for this record.
- **POSTED** — The status of the payment is posted; set it when that is what the business means for this record.
- **CLEARED** — The status of the payment is cleared; set it when that is what the business means for this record.
- **VOID** — The status of the payment is void; set it when that is what the business means for this record.
- **REVERSED** — The status of the payment is reversed; set it when that is what the business means for this record.

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

### Scenario Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Available for plans.
- **ARCHIVED** — Closed to new normal use.

### Subscription Plan Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

### Subscription Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

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

### Tax Code Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

### Tax Jurisdiction Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

### Tax Rate Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

### Tax Registration Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

### Tax Rule Status

- **DRAFT** — The status of the tax rule is draft; set it when that is what the business means for this record.
- **ACTIVE** — The status of the tax rule is active; set it when that is what the business means for this record.
- **INACTIVE** — The status of the tax rule is inactive; set it when that is what the business means for this record.
- **RETIRED** — The status of the tax rule is retired; set it when that is what the business means for this record.

### Tax Rule Tax Type

- **SALES** — The tax type of the tax rule is sales; set it when that is what the business means for this record.
- **VAT** — The tax type of the tax rule is vat; set it when that is what the business means for this record.
- **GST** — The tax type of the tax rule is gst; set it when that is what the business means for this record.
- **USE** — The tax type of the tax rule is use; set it when that is what the business means for this record.
- **WITHHOLDING** — The tax type of the tax rule is withholding; set it when that is what the business means for this record.
- **OTHER** — The tax type of the tax rule is other; set it when that is what the business means for this record.

### Tax Transaction Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

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

### Usage Record Status

- **DRAFT** — Being prepared.
- **ACTIVE** — Effective or executing.
- **COMPLETED** — Concluded successfully.
- **CANCELLED** — Terminated without normal completion.

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

### Account — Account Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Journal Entry — Journal Entry Lifecycle

Starts at **DRAFT**.
Final: **REVERSED**.

Moves:
- DRAFT → POSTED (Post)
- POSTED → REVERSED (Reverse)

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

### Payment — Payment Lifecycle

Starts at **DRAFT**.
Final: **CLEARED**, **VOID**, **REVERSED**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → POSTED (Post)
- POSTED → CLEARED (Mark Cleared)
- DRAFT → VOID (Void)
- APPROVED → VOID (Void)
- POSTED → VOID (Void)
- POSTED → REVERSED (Reverse)

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

### Budget — Budget Lifecycle

Starts at **DRAFT**.
Final: **CLOSED**, **SUPERSEDED**.

Moves:
- DRAFT → SUBMITTED (Submit)
- SUBMITTED → APPROVED (Approve)
- APPROVED → ACTIVE (Activate)
- ACTIVE → CLOSED (Close)
- DRAFT → SUPERSEDED (Mark Superseded)
- SUBMITTED → SUPERSEDED (Mark Superseded)
- APPROVED → SUPERSEDED (Mark Superseded)
- ACTIVE → SUPERSEDED (Mark Superseded)

### Scenario — Scenario Lifecycle

Starts at **DRAFT**.
Final: **ARCHIVED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → ARCHIVED (Archive)

### Ledger — Ledger Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Fiscal Period — Fiscal Period Lifecycle

Starts at **FUTURE**.
Final: **CLOSED**.

Moves:
- FUTURE → OPEN (Open)
- OPEN → SOFT CLOSED (Mark Soft Closed)
- SOFT CLOSED → CLOSED (Close)
- OPEN → LOCKED (Lock)
- LOCKED → OPEN (Unlock)

### Payment Allocation — Payment Allocation Lifecycle

Starts at **DRAFT**.
Final: **REVERSED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → REVERSED (Reverse)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Payment Instruction — Payment Instruction Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Credit Note — Credit Note Lifecycle

Starts at **DRAFT**.
Final: **FULLY APPLIED**, **REFUNDED**, **CANCELLED**, **REVERSED**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → POSTED (Post)
- POSTED → PARTIALLY APPLIED (Mark Partially Applied)
- PARTIALLY APPLIED → REFUND DUE (Mark Refund Due)
- REFUND DUE → FULLY APPLIED (Mark Fully Applied)
- REFUND DUE → REFUNDED (Refund)
- DRAFT → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- POSTED → CANCELLED (Cancel)
- PARTIALLY APPLIED → CANCELLED (Cancel)
- REFUND DUE → CANCELLED (Cancel)
- REFUND DUE → REVERSED (Reverse)

### Credit Note Application — Credit Note Application Lifecycle

Starts at **DRAFT**.
Final: **REVERSED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → REVERSED (Reverse)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Tax Code — Tax Code Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Tax Jurisdiction — Tax Jurisdiction Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Tax Rate — Tax Rate Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Tax Registration — Tax Registration Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Tax Rule — Tax Rule Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Tax Transaction — Tax Transaction Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Billing Cycle — Billing Cycle Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Charge — Charge Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Subscription — Subscription Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Subscription Plan — Subscription Plan Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Usage Record — Usage Record Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Bank Account — Bank Account Lifecycle

Starts at **PENDING**.
Final: **CLOSED**.

Moves:
- PENDING → ACTIVE (Activate)
- ACTIVE → CLOSED (Close)
- ACTIVE → BLOCKED (Block)
- BLOCKED → ACTIVE (Unblock)

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

- **User** — reads 138 of 138 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
