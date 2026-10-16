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

A ledger account in a chart of accounts: the named bucket to which monetary activity is posted and from which balances are reported. Account is how an organisation classifies money. Every posting lands on an account, and the account's type decides which statement it appears on (balance sheet or income statement) and which direction increases its balance. Created when the chart of accounts is set up or extended; referenced by journal postings, invoices, payments, budgets and financial reports. Accounts are retired, never deleted, so past postings stay explainable. Accounts form a tree through…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The account number or code under which the account appears in the chart of accounts, such as 1100 or 4000. Entered by the finance team when creating the account and used for lookup, sorting and imports. It must be unique within its chart,…
  - **Name** (required) — The descriptive title of the account, such as Accounts Receivable or Product Revenue. Shown on ledgers, trial balances and statements. It can be reworded for clarity without affecting history because postings refer to the account by identi…
  - **Account Type** (required, one of the Account Account Type values) — The accounting class of the account, which decides where it appears in the statements and whether debits or credits increase it. Chosen when the account is created and rarely changed afterwards, because changing it reclassifies every histo…
  - **Status** (required, one of the Account Status values) — Whether the account is open for new postings. New accounts start ACTIVE. Finance staff move an account to INACTIVE to stop postings temporarily and to RETIRED when it is closed for good; posting screens offer only ACTIVE accounts. Open for…
  - **Currency** (a Currency) — The currency in which this account is denominated, when it is held in something other than the organisation's base currency. Set for foreign-currency accounts such as a euro bank account so that postings and balances are held in that curre…
  - **Is Posting Account** (required) — Whether journal lines may post directly to the account, or it only sums its children. Summary accounts in the hierarchy are not posting accounts. A posting account has no children.
  - **Parent Account** (a Account) — The account directly above this one in the chart of accounts hierarchy. Chosen when the account is created to place it in a reporting group, for example Bank Accounts under Current Assets. Leave empty for a top-level account. At most one p…
  - **Organization** (a Organization) — The organisation whose chart of accounts this account belongs to. Set when the account is created so each legal entity keeps its own chart; used to scope ledgers and reports to one organisation. At most one organisation; an account with no…

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

The event by which an organisation takes on an asset, with the context needed to capitalise it, while the accounting entry itself stays in the journal. Acquiring an asset is a business event with its own date, source and cost. Recording it separately keeps the asset register and the ledger consistent without mixing the story of how the asset arrived into the asset itself. Created when an asset is purchased, built, leased in or received as a transfer in; read by asset accounting for capitalisation and depreciation start dates. Each acquisition refers to the Asset it brought into the register;…

Readable by every signed-in person.

Fields:
  - **Effective At** — The date and time from which the organisation treats itself as holding the asset. Entered from the delivery or transfer document; it starts depreciation and ageing, so it is the date finance relies on.
  - **Acquisition Number** (required) — The reference number that identifies this acquisition on screens, invoices and audit reports. Assigned by the system when the acquisition is first recorded and never changed afterwards. Unique across all acquisitions.
  - **Acquisition Type** (required, one of the Asset Acquisition Acquisition Type values) — How the asset was acquired. Decides the accounting treatment and which evidence is needed. Leased assets follow the lease accounting rules. Bought from a supplier. Built in-house or by contractors. Taken on under a lease recognised on the…
  - **Acquisition Date** (required) — The day the business obtained the asset. Taken from the delivery or the contract. Not later than the in-service date.
  - **In Service Date** — The day the asset was first installed and ready to be used in operations. Entered by the asset accountant; depreciation of the asset begins from this date. Required before the acquisition can be capitalised.
  - **Acquisition Cost** (required) — The purchase price of the asset. Taken from the invoice, net of recoverable taxes and discounts. In the acquisition's currency.
  - **Additional Costs** — Costs needed to bring the asset into use, such as delivery, installation and testing. Added to the capitalised cost. Training and running costs are expenses, not capitalised.
  - **Capitalized Amount** — The total amount recognised as the asset's cost. Acquisition cost plus additional costs; depreciation is computed on it. Fixed once capitalised.
  - **Capitalized At** — The date and time the acquisition was posted to the accounts as a fixed asset. Stamped automatically when the accountant capitalises the acquisition. Empty until the acquisition has been capitalised.
  - **Status** (required, one of the Asset Acquisition Status values) — Whether the acquisition has been posted to the accounts, cancelled or reversed. Moves on as the accountant capitalises the acquisition or corrects it. Only capitalised acquisitions are depreciated. Entered and waiting to be capitalised. Po…
  - **Asset** (required, a Asset) — The asset that was acquired. Chosen when the acquisition is recorded; one asset is normally acquired once. Exactly one asset per acquisition event. Links the capitalisation event to the register entry it created.
  - **Supplier** (a Supplier) — The supplier the asset was bought from. Set for purchases. At most one. Read with the invoice.
  - **Invoice** (a Invoice) — The supplier invoice the cost rests on. Linked for purchases. At most one invoice; further costs are listed in the notes. The invoice is the evidence of cost.
  - **Purchase Order** (a Purchase Order) — The order the asset was bought on. Linked when the purchase was ordered. At most one. Capital orders are approved against the capex budget.
  - **Currency** (required, a Currency) — The currency of the costs. Taken from the invoice. One per acquisition. Converted to the company currency on posting.

### Asset Acquisition Acquisition Type

The values of asset acquisition acquisition type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Asset Acquisition Status

The values of asset acquisition status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Asset Class

A classification of assets that carries default accounting, depreciation, lifecycle and control rules for every asset placed in it. Without classes every asset would need its own depreciation method and useful life. A class holds those policies once so assets of the same kind, such as vehicles, buildings or IT equipment, are treated consistently. Set up by asset accountants and policy owners; chosen when an asset is registered so its defaults are inherited. Assets are assigned to a class; the class's accounting defaults feed depreciation and the ledger. A class is defined, used by assets, and…

Readable by every signed-in person.

Fields:
  - **Effective At** — When this version of the class's rules takes effect. Set when the class is defined or its policy revised, so each asset can be evaluated under the rules in force on its own dates.
  - **Code** (required) — The short code of the class, used in the asset register and in reports. Chosen when the class is created, such as "IT-HW"; finance reports and imports refer to it. Unique; it is the identifier people and integrations use.
  - **Name** (required) — The name of the class, such as "IT hardware". Shown wherever an asset's class is displayed. Together with the code it identifies the class for people.
  - **Description** — Which assets belong in the class and which do not. Read by whoever acquires an asset and must choose a class. Should follow the wording of the accounting policy.
  - **Depreciation Method** (required, one of the Asset Class Depreciation Method values) — How assets in the class lose value over time. Copied onto each new asset in the class; the depreciation run applies it. The method, the useful life and the residual value together give the depreciation charge. An equal charge in every peri…
  - **Useful Life Months** — Over how many months assets in the class are depreciated. Copied onto each new asset; it can be overridden for an individual asset. Not needed when the method is none or units of production.
  - **Residual Value Percent** — The share of the cost expected to remain at the end of the useful life. Applied to each asset's cost to give the value depreciation stops at; usually zero. Between 0 and 100.
  - **Capitalization Threshold** — The smallest cost at which an item in this class is capitalized rather than expensed. Read at purchase to decide whether an item becomes an asset or a cost of the period. Set from the accounting policy, usually per company.
  - **Status** (required, one of the Asset Class Status values) — Whether new assets may be placed in the class. Made inactive when the class is no longer used; existing assets keep it. Inactive classes are not offered when an asset is created. Available for new assets. Kept for existing assets but not o…
  - **Asset Account** (a Account) — The balance-sheet account that carries the cost of assets in the class. Used by acquisitions and disposals to post the asset's cost. One asset account per class. Must be an asset-type account.

### Asset Class Depreciation Method

The values of asset class depreciation method, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Asset Class Status

The values of asset class status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

The event by which an organisation retires, sells, scraps or otherwise disposes of an asset, with its operational and accounting consequences. Disposal ends an asset's life in the register. Recording it as an event shows how and when the asset left, supports the gain or loss calculation, and stops the asset being used by mistake. Created when an asset is sold, scrapped, donated or written off; read by finance for the disposal entry and by operations to confirm the asset is gone. Each disposal points to the Asset it removes; the accounting posting lives in the journal. A disposal is recorded o…

Readable by every signed-in person.

Fields:
  - **Effective At** — The date and time at which the organisation ceased to hold the asset. Taken from the sale, scrap or write-off document; depreciation stops and the gain or loss is measured at this date.
  - **Disposal Number** (required) — The reference number that identifies this disposal on screens, approvals and audit reports. Assigned by the system when the disposal is requested and never changed afterwards. Unique across all disposals.
  - **Disposal Method** (required, one of the Asset Disposal Disposal Method values) — Sold to an outside buyer for a price. Scrapped or recycled with no resale. Given away free to another party or charity. Handed in as part payment for a replacement. Lost, stolen or destroyed and written off. Transferred to another company…
  - **Disposal Date** — The day the asset actually left the business. Entered when the disposal is completed; depreciation of the asset stops on this date. Required before the disposal can be completed.
  - **Reason** — A short business justification for retiring the asset, for example replaced by a newer model. Written by the requester and read by the approver when deciding whether to authorise. Free text.
  - **Proceeds** — The amount of money the business received in return for the asset. Recorded for sales and trade-ins, and used to calculate the gain or loss on disposal. Zero for scrapping, donations and losses.
  - **Book Value At Disposal** — The asset's net book value on the disposal date. Computed from the asset's cost and accumulated depreciation. Fixed when the disposal is completed.
  - **Gain Or Loss** — Proceeds minus book value; positive for a gain, negative for a loss. Posted to the gain or loss on disposal account. The one amount on a disposal that may be negative.
  - **Approved At** — The date and time the approver authorised the disposal. Stamped automatically when the approver accepts the request. Required before the disposal can be completed.
  - **Status** (required, one of the Asset Disposal Status values) — Where the disposal stands between request, approval and completion. Moves on as the approver decides and the asset is physically removed. Only completed disposals take the asset off the register. Asked for and waiting for an approver. Appr…
  - **Asset** (required, a Asset) — The asset that was disposed of. Chosen when the disposal is recorded; the asset then stops being offered for new assignments. Exactly one asset per disposal event. Marks the end of the asset's operational life while keeping its history.
  - **Buyer** (a Party) — Who bought or received the asset. Set for sales, donations and transfers. At most one. The proceeds are invoiced to them.
  - **Approved By** (a Person) — The person who authorised the asset to be disposed of. Recorded when the approver accepts the request. At most one approver is named per disposal; it stays empty until approval. Provides the sign-off that lets a disposal move on to complet…
  - **Currency** (required, a Currency) — The currency of the amounts. Usually the company currency. One per disposal. All amounts on the disposal use it.

### Asset Disposal Disposal Method

The values of asset disposal disposal method, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Asset Disposal Status

The values of asset disposal status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

The event by which responsibility for an asset, its location, organisational assignment or custody moves, without rewriting how the asset was acquired. Assets move between departments, sites and custodians during their life. A transfer records that move as an event, so the asset's current owner and place are right while its earlier history stays intact. Created when an asset is relocated, reassigned or handed over; read to answer who held an asset when and for audits of custody. Each transfer points to the Asset that moved; the register reflects the latest effective transfer. A transfer is re…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the move took effect. Taken from the hand-over document; the asset's current assignment is the latest transfer whose effective date has passed.
  - **Transfer Number** (required) — The reference number that identifies this transfer on screens, shipping documents and audit reports. Assigned by the system when the transfer is requested and never changed afterwards. Unique across all transfers.
  - **Transfer Type** (required, one of the Asset Transfer Transfer Type values) — What changes with the transfer. Chosen when requesting it; decides who must confirm and whether accounting is posted. Several changes at once are one transfer of the main type. The asset moves to another place. Another unit bears the asset…
  - **Effective Date** (required) — The day the change takes effect for the register and depreciation. Set by finance; depreciation before it stays with the old unit. Usually the first day of a period.
  - **Reason** — A short explanation of why the asset is changing location, owner or custodian. Written by the requester and read by the approver and the receiving site. Free text, for example site closure or staff relocation.
  - **Shipped At** — The date and time the asset left its previous location. Recorded by the sending site for physical moves. Present once the asset is in transit.
  - **Received At** — The date and time the receiving site confirmed the asset had arrived. Recorded when the receiver acknowledges delivery. Present once the transfer is completed.
  - **Status** (required, one of the Asset Transfer Status values) — Where the transfer stands between request, shipment and confirmation of arrival. Moves on as the sender ships the asset and the receiver confirms it. The asset register changes only when the transfer completes. Asked for, but the asset has…
  - **Asset** (required, a Asset) — The asset being moved. Chosen when the transfer is recorded. Exactly one asset per transfer; moving several assets means several transfers. Keeps custody history for each asset separate from its acquisition.
  - **From Location** (a Location) — Where the asset was. Copied from the asset when the transfer is requested. One per transfer. Should match the asset's location.
  - **From Cost Center** (a Cost Center) — The cost centre that bore the asset's cost. Copied from the asset. One per transfer. Bears depreciation up to the effective date.
  - **From Custodian** (a Person) — The person who was responsible for the asset. Copied from the asset. One per transfer. Hands the asset over.

### Asset Transfer Status

The values of asset transfer status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Asset Transfer Transfer Type

The values of asset transfer transfer type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **File Name** (required) — The name of the file as uploaded. Shown in the record's list of attachments and used as the name when the file is downloaded. Not unique; the same name may be attached to many records.
  - **Media Type** — The type of the file's content, such as application/pdf or image/jpeg. Detected on upload; it decides whether the file can be previewed. Taken from the file, not typed by the user.
  - **Size Bytes** — The size of the file in bytes. Recorded on upload; used to enforce upload limits and to report storage use. Zero-size files are refused.
  - **Storage Location** (required) — Where the file's content is stored. Set by the system on upload; users never type it. Moving files between stores updates it without changing the attachment.
  - **Checksum** — A fingerprint of the file's content (SHA-256). Computed on upload; recomputing it later shows whether the file has been changed. Two attachments with the same checksum hold the same content.
  - **Record Type** (required) — The kind of record the file is attached to, such as "Goods receipt". Set by the screen the file was attached from. Read with the record identifier to find the record.
  - **Record** (required) — The identifier of the record the file is attached to. Set by the screen the file was attached from; the record's attachments are found by it. Together with the record type it identifies exactly one record.
  - **Category** — What the file is, such as "Delivery note", "Certificate" or "Photograph". Chosen on upload so that the record's attachments can be told apart without opening them. Free choice of words, though each business usually agrees a short list.
  - **Description** — A note about the file's content. Optional; useful when the file name does not say what the file shows. Free text.
  - **Uploaded At** (required) — When the file was attached. Recorded by the system; the record's evidence is listed in this order. Not editable.
  - **Status** (required, one of the Attachment Status values) — Whether the file still counts as evidence for the record. An attachment added by mistake is withdrawn; it stays visible in the history. Withdrawn attachments are not shown in the normal list. Attached and part of the record's evidence. Rem…
  - **Uploaded By** (a Person) — The person who attached the file. Recorded on upload. One per attachment. Shown with the file so that reviewers know where it came from.

### Attachment Status

The values of attachment status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Bank Account

Represents the controlled banking account context through which cash is received, disbursed, observed, and reconciled. BankAccount is master data for the financial account; it is not a bank transaction, payment, or accounting entry. Central to treasury, Payment execution, BankTransaction ingestion, bank reconciliation, cash reporting, and accounting. Party provides ownership context. Organization provides the financial institution. Payment represents internal settlement events. BankTransaction represents external statement evidence. JournalEntry represents accounting consequences. BankAccount…

Readable by every signed-in person.

Fields:
  - **Account Number** (required) — Banking identifier for the account, subject to applicable security and masking controls. Identifies the account at the financial institution for operational settlement and reconciliation. Used for payment routing, bank-feed matching, state…
  - **Account Type** (required, one of the Bank Account Account Type values) — A transaction account for everyday receipts and payments. An interest-bearing account held mainly to accumulate balances. An account carrying borrowing from the bank. An account holding money on behalf of others until conditions are met. A…
  - **Currency** (required, a Currency) — Currency in which the bank account is normally denominated. Establishes the account's primary monetary denomination and expected statement currency. Used by Payment, BankTransaction, reconciliation, cash reporting, and treasury controls. A…
  - **Status** (required, one of the Bank Account Status values) — Opened or requested but not yet confirmed by the bank; not available for payments. Open and available for receipts and payments. Temporarily frozen, for example for compliance reasons; no new payments should be routed to it. Permanently cl…
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

A recurring billing interval with its cut-off, which decides which period's charges a billing run picks up. Billing happens on a rhythm, such as monthly on the first. A billing cycle defines that rhythm, so charges are collected into the right invoice period and no charge is billed twice or missed. Defined by the billing team; assigned to accounts or contracts; read by billing runs to decide the period and cut-off for charge generation. Customers, contracts or subscriptions are assigned a cycle; the billing run generates charges for the period it defines. A cycle is drafted, active while it d…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Billing Cycle Status values) — Whether the cycle is being prepared, driving billing, or finished. Set by the billing team; only ACTIVE cycles are used to generate charges. Being defined; not yet used by billing runs. In force; billing runs use it to determine charge per…
  - **Code** (required) — The short code of the cycle, such as MON-01. Chosen when the cycle is created; subscriptions and billing reports refer to it. Unique.
  - **Name** (required) — The name of the cycle, such as "Monthly, 1st of the month". Shown when a subscription is placed on a cycle. Identifies the cycle for people, with the code.
  - **Frequency** (required, one of the Billing Cycle Frequency values) — Each billing period lasts one week. Each billing period lasts one calendar month. Each billing period lasts three calendar months. Each billing period lasts six calendar months. Each billing period lasts one year. How long each billing per…
  - **Interval Count** (required) — How many units of the frequency make one period — 2 with monthly means every two months. Usually 1. Must be at least 1.
  - **Anchor Day** — The day of the month (or of the week, for weekly cycles) each period starts on. Set so that billing dates are predictable, such as the 1st of the month. Days beyond the end of a short month fall on its last day.
  - **Cutoff Offset Days** (required) — How many days after a period ends usage is still accepted into it. Gives late usage feeds time to arrive before the period is rated. Usage arriving after the cut-off goes into the next period.
  - **Invoice Offset Days** (required) — How many days after a period ends its invoice is produced. Used by the billing run to schedule invoicing. Should not be less than the cut-off offset.
  - **Payment Due Days** — How many days after the invoice date payment is due. Copied onto invoices produced for this cycle unless the customer's payment terms say otherwise. Payment terms agreed with the customer take precedence.
  - **Currency** (a Currency) — The currency the cycle bills in, when it is specific to one. Set when cycles differ by currency; empty when any currency may use it. At most one currency per cycle. Subscriptions on the cycle bill in its currency.

### Billing Cycle Frequency

The values of billing cycle frequency, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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
  - **Code** (required) — Assigned by finance when the budget is created, for example FY26-OPS-V1; used to find the budget and cite it in approvals. Business budget code. Human/integration reference for plan. Unique within organization/version policy.
  - **Status** (required, one of the Budget Status values) — How far the budget has progressed through preparation, approval, use and replacement. Moved by the budget owner and approvers; only active budgets control spending, and later changes need a new revision. Being prepared by the budget owner;…
  - **Name** (required) — The title by which finance staff know the budget, for example Operating Budget FY2027. Chosen by the budget owner and shown in reports and in budget pickers. Should be distinctive within its fiscal year.
  - **Budget Version** (required) — The version of the budget — 1 for the original, higher for revisions. Increased with each revision. Only one version is active at a time.
  - **Budget Type** (required, one of the Budget Budget Type values) — Which kind of spending or income the budget plans. Chosen when the budget is created; it decides which accounts its lines may use. Capital budgets plan investment rather than running costs. Plans revenue and day-to-day running costs. Plans…
  - **Total Amount** — The overall sum of all the budget's lines, in a single figure. Calculated automatically from the lines and shown to approvers. Held in the budget's currency.
  - **Approved At** — The date and time an approver signed the budget off as the plan to follow. Stamped automatically when the approver accepts the budget. Present once the budget is approved.
  - **Organization** (required, a Organization) — Set when the budget is created; determines whose spending the budget limits. Exactly one organisation: a budget always plans the money of a single organisation. Organization owning budget. Defines planning boundary. Accounting dimensions m…
  - **Fiscal Period** (a Fiscal Period) — Fiscal period governed by budget. Aligns plan with accounting time. Budget control and variance. Optional when budget spans multiple periods represented by lines. Does not open/close accounting period.
  - **Scenario** (a Scenario) — Planning scenario represented. Distinguishes baseline/upside/downside etc. Comparative planning. Optional for single-scenario plans. Scenario never changes actual ledger.
  - **Currency** (a Currency) — The currency of the budget. The organization's reporting currency. One per budget. All lines use it.

Line items — **Budget Line**: kept inside each Budget and reached by opening it, never on their own. Detailed dimensional budget allocation. Defines planned money at an account/responsibility intersection. Budgeting and variance analysis. Budget governs; Account/CostCenter/ProfitCenter classify.

### Budget Budget Type

The values of budget budget type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

A major business, division, product line or operating segment within an organisation. Business units are how a large organisation divides its activity for management and reporting. They let results, budgets and responsibility be assigned to a meaningful segment rather than to the organisation as a whole. Defined by management and finance; assigned to people, transactions and budgets; read when reporting by segment. Each business unit belongs to one Organization and groups the work and results of one part of it. A business unit keeps its code and identity stable. Reorganisations are recorded e…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short reference for the unit, such as CE or EMEA-RETAIL. Assigned by finance and used on reports and in postings; kept stable because history relies on it.
  - **Name** (required) — The full name of the business unit, as it appears in the organisation's structure and management accounts. Entered by management or finance when the unit is created; shown in organisation charts, selectors and segment reports.
  - **Description** — What the business unit does. Read by people placing staff or costs in it. Free text.
  - **Status** (required, one of the Business Unit Status values) — Whether the business unit is still operating. Set to inactive by an administrator after a reorganisation or closure. Inactive units are not offered for new assignments. Operating and available for new assignments. No longer operating after…
  - **Organization** (required, a Organization) — The organisation to which the unit belongs. Set when the unit is created. Exactly one organisation; a unit cannot stand alone. Rolls the unit's results up into its parent organisation.
  - **Head** (a Person) — The executive responsible for the business unit. Receives its reports and approves its budgets. One per business unit. Accountable for its results.
  - **Legal Entity** (a Legal Entity) — The company the business unit mainly trades through. Used for contracts and invoices made by the unit. At most one. A unit trading in several countries uses several entities; the main one is named.
  - **Profit Center** (a Profit Center) — The profit centre its results are reported on. Links the organization view to the reporting view. At most one. Set by controlling.
  - **Parent Unit** (a Business Unit) — The larger business unit this one is part of. Builds the hierarchy. At most one. Cannot be itself.

### Business Unit Status

The values of business unit status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Calendar

A calendar that defines business dates, working days, holidays and time-control rules used for planning and operations. Whether a date counts as a working day is not obvious: it depends on region, industry and company. A calendar states that explicitly, so due dates, delivery promises and schedules all agree. Maintained by administrators; referenced by schedulers, service-level calculations and planning when they need to know which days count. Locations, teams, contracts and schedules point to the calendar that governs their working days. A calendar's code and identity stay stable. Changes to…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short reference for the calendar, such as DE-NAT. Assigned by the administrator; used in configuration and reports; kept stable.
  - **Name** (required) — The descriptive name of the calendar, such as UK Working Days or Group Fiscal Calendar. Entered by the administrator who maintains it; shown wherever a schedule, service level or plan asks which calendar applies.
  - **Working Days** (required) — The days of the normal working week, such as MON-FRI or MON-SAT. Days outside it are non-working unless an exception says otherwise. Exceptions override it for particular dates.
  - **Time Zone** — The time zone of the calendar, such as Europe/Paris. Decides when a day starts and ends for deadlines. An IANA time-zone name.
  - **Valid From** — The first day on which the calendar's working days and holidays apply. Set when the calendar is created. Not later than the valid-to date.
  - **Valid To** — The last day on which the calendar's working days and holidays apply. Filled in when a newer calendar replaces this one. Left empty while the calendar is still in use.
  - **Status** (required, one of the Calendar Status values) — Whether planners may use this calendar. Made inactive by an administrator once a newer calendar replaces it. Inactive calendars are not offered when choosing one. In use and available to planners. Retired and no longer offered.
  - **Country** (a Country) — The country whose public holidays the calendar holds. Set for country calendars. At most one. Site calendars usually take their country's calendar as base.
  - **Base Calendar** (a Calendar) — The calendar whose exceptions this one also follows. Set so a site calendar inherits the country's holidays. At most one base. Cannot be itself.

Line items — **Calendar Exception**: kept inside each Calendar and reached by opening it, never on their own. One holiday, closure or extra working day in a calendar. Exceptions are what make a calendar accurate. Each records a date, what it is and whether work happens on it, so that working-day calculations skip holidays and closures and count extra working days. Entered each year for the coming year's ho…

### Calendar Exception Exception Type

The values of calendar exception exception type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Calendar Status

The values of calendar status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Cash Position

Reproducible point-in-time treasury liquidity view. CashPosition summarizes cash; BankTransaction supplies external evidence, Payment supplies internal settlement state, and JournalEntry supplies accounting recognition. Daily cash management, liquidity, funding, payment planning and treasury reporting. BankAccount defines account/currency; bank transactions and payments supply observed/pending cash evidence. Calculated for an as-of cutoff → reviewed/published where required → retained or superseded by later snapshots. New/reversed/reconciled cash evidence affects subsequent positions and fore…

Readable by every signed-in person.

Fields:
  - **As Of** (required) — The date and time of the cut-off for which balances and pending items were calculated. Chosen when the snapshot is taken, such as end of day or an intraday check; the position must be reproducible from evidence at that moment. Defines evid…
  - **Ledger Balance** (required) — The balance according to the books at the cut-off, including items not yet cleared at the bank. Baseline cash amount. Treasury reporting. Must be reproducible from authoritative evidence.
  - **Available Balance** (required) — The amount that can actually be spent at the cut-off, after holds and pending items. Liquidity available after restrictions/pending effects under policy. Funding and payment decisions. Currency must match account/position currency.
  - **Forecast Balance** — The expected balance at a future date, based on scheduled receipts and payments. Forward liquidity estimate, not posted cash. Treasury planning. Must identify forecast policy/horizon externally or through consuming process.
  - **Bank Account** (required, a Bank Account) — Exactly one bank account; each snapshot describes a single account in a single currency. Bank account positioned. Defines cash account context. Treasury and reconciliation. Account status/currency constrain calculation.

### Charge

A billable amount produced from a subscription, usage, service, product, fee or adjustment rule, before it is settled. A charge is the line between something the customer received and something they will be invoiced for. Holding it as a record lets billing check, adjust or cancel amounts before they become part of an invoice. Generated by billing runs and manual adjustments; reviewed before invoicing; read when a customer queries what they were billed for. A charge belongs to the Customer it is billed to. It never replaces the invoice, payment or ledger entries that follow from it. A charge i…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Charge Status values) — Where the charge stands before it is billed. Moved by the billing run and by billing staff; only ACTIVE charges are picked up by invoicing. Generated but not yet checked; excluded from invoicing. Confirmed and waiting to be invoiced. Invoi…
  - **Charge Number** (required) — The reference number of the charge, such as CHG-000412. Assigned when the charge is generated; quoted on invoices and in disputes. Read with the customer.
  - **Charge Type** (required, one of the Charge Charge Type values) — What the charge is for. Set by the rule that generates it; invoices and reports group charges by type. Decides the revenue treatment. A recurring charge for a subscription period. A charge for measured usage. A charge for a service deliver…
  - **Amount** (required) — The amount to be billed, before settlement. Calculated by the generating rule; must not be negative; summed onto the invoice. Compared with the amount later paid.
  - **Currency** (required, a Currency) — The currency of the charge amount. Set from the customer or contract; invoicing converts if needed. Read with the amount.
  - **Charged On** (required) — The date the charge arose. Set when generated; decides the invoice period it falls in. Compared with invoice dates.
  - **Description** — Words describing the charge as the customer will see them. Generated or entered; printed on the invoice line. Read by the customer.
  - **Period Start** — The first day of the period the charge covers. Set for recurring and usage charges. Not later than the period end.
  - **Period End** — The last day of the period the charge covers. Set for recurring and usage charges. Charges for the same subscription do not cover overlapping periods.
  - **Quantity** (required) — How many units are charged. Users, usage units, or 1 for a flat fee. Read with the unit price.
  - **Unit Price** — The price charged for a single unit of the billed product, service or usage. Taken from the subscription plan or price list when the charge is created. Stated in the charge's currency and multiplied by the quantity.
  - **Customer** (a Customer) — The customer who is billed for the charge. Set when the charge is generated; invoices are assembled per customer. At most one customer; a charge for an internal cost centre may have none. Decides which invoice the charge lands on and whose…
  - **Subscription** (a Subscription) — The subscription the charge comes from. Set for recurring and usage charges. At most one. Lets every charge of a subscription be listed.
  - **Product** (a Product) — The product charged for. Used for revenue reporting by product. At most one. Taken from the subscription's plan when there is one.
  - **Invoice** (a Invoice) — The invoice the charge is on. Set when the charge is invoiced. At most one. Present once invoiced.

### Charge Charge Type

The values of charge charge type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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
  - **Channel** (required, one of the Contact Point Channel values) — An email address used for written messages. A landline telephone number. A mobile telephone number. A fax number, kept for partners who still use it. A web address of the party's site or page. A handle on a messaging app. What kind of chan…
  - **Value** (required) — The address or number itself. Entered in its standard form — international format for phone numbers. Validated according to the channel.
  - **Purpose** (required, one of the Contact Point Purpose values) — Any purpose, when nothing more specific applies. Invoices and statements sent to accounts payable. Order confirmations and purchase orders. Delivery notices and arrival updates. Service and support enquiries. Marketing communication, where…
  - **Is Preferred** (required) — Whether this is the preferred channel for its purpose. Used first when several channels serve the same purpose. One preferred channel per party, channel and purpose.
  - **Verified At** — When the channel was last confirmed to work. Recorded by a verification message or call. Unverified channels may be refused for sensitive messages.
  - **Status** (required, one of the Contact Point Status values) — Whether the channel is still usable for reaching the party. Changed when the channel stops being used or a message to it bounces. Inactive and invalid channels are not offered for contact. In use and offered for contact. No longer used and…
  - **Party** (required, a Party) — The party the endpoint belongs to. Set when the endpoint is added. Exactly one party; each endpoint has one owner. Lets communications find the right channel for a party.

### Contact Point Channel

The values of contact point channel, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contact Point Purpose

The values of contact point purpose, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contact Point Status

The values of contact point status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Cost Center

A unit of responsibility to which costs are assigned and against which they are analysed, separate from the legal accounts. Ledger accounts say what a cost was; a cost centre says who is responsible for it. Splitting the two lets a manager see and answer for their own spending without changing the chart of accounts. Defined by finance; chosen on cost postings, budgets and purchase requests; read in management reports and budget reviews. Each cost centre belongs to one Organization; budgets and postings refer to it as a dimension. It never creates or alters ledger entries on its own. A cost ce…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code by which the cost centre is known in postings and reports, such as 4100. Assigned by finance; stable, because history is reported under it.
  - **Name** (required) — The name of the cost centre, such as "Plant Lyon – Assembly". Shown on reports and wherever the cost centre is chosen. Identifies the cost centre for people, with the code.
  - **Category** (required, one of the Cost Center Category values) — Makes products or delivers services, so its costs flow into product cost. Sells and markets the company's offering; its costs are reported as selling expense. Runs general administration such as finance, HR and management; its costs stay o…
  - **Valid From** (required) — The first day postings may be made to it. Set when the cost centre is created. Not later than the valid-to date.
  - **Valid To** — The last day postings may be made to it. Set when the unit is closed or reorganised. Empty while it is open.
  - **Status** (required, one of the Cost Center Status values) — Whether postings may currently be made to the cost centre. Moved on by controlling when a unit is paused or retired; budget owners check it before charging costs. Blocked and closed cost centres are refused on new postings, while their ear…
  - **Organization** (required, a Organization) — The organisation that the cost centre belongs to. Set at creation; limits the postings and budgets that can use it. Exactly one organisation: responsibility cannot be split between legal entities. Scopes cost reporting to the right entity.
  - **Manager** (a Person) — The manager who answers for the cost centre's spending. Receives its reports and approves its costs above limits. One per cost centre. Should be reassigned when the manager changes.
  - **Parent Cost Center** (a Cost Center) — The cost centre it rolls up into. Builds the hierarchy that reports are summed along. At most one parent. A cost centre cannot roll up into itself.
  - **Profit Center** (a Profit Center) — The profit centre its costs belong to. Lets costs be reported against the revenue they support. At most one. Set by controlling.

### Cost Center Category

The values of cost center category, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Cost Center Status

The values of cost center status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Credit Note

Represents an explicit reduction of a customer's financial claim while preserving original invoice, return, accounting, application and refund evidence. CustomerReturn records reverse fulfillment; CreditNote records the financial adjustment; CreditNoteApplication records how it is consumed; Invoice remains the historical claim; JournalEntry records accounting; Payment records any refund cash. Customer returns, accounts receivable, billing corrections, tax adjustments, customer concessions, statements, audit and refunds. CustomerReturnLine provides returned quantity and approved credit basis.…

Readable by every signed-in person.

Fields:
  - **Credit Note Number** (required) — Business-facing reference assigned to the credit note. Identifies the adjustment in customer communication, tax documents, statements and finance operations. Used for reconciliation, customer service, reporting, tax and integrations. Disti…
  - **Credit Note Date** (required) — Commercial and accounting date of the credit adjustment. Establishes the temporal basis for accounting, tax and customer balance treatment. Used for accounting periods, tax reporting, statements and audit. May differ from CustomerReturn re…
  - **Status** (required, one of the Credit Note Status values) — Being prepared; has no financial effect. Authorised but not yet posted to the ledger. Recorded in the books; it now reduces what the customer owes. Part of its value has been set against invoices; some remains. All of its value has been se…
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
  - **Exchange Rate** (a Exchange Rate) — The exchange rate used to convert between the credit note's currency and the invoice's currency. Filled only when the two currencies differ; it freezes the conversion so the application can be audited and reproduced later. Preserves conver…
  - **Applied At** (required) — The date and time the application took effect and began reducing the invoice. Set when the application is activated; it decides which accounting period and customer statement show the reduction. Establishes adjustment chronology. Distinct…
  - **Status** (required, one of the Credit Note Application Status values) — Whether the application is being prepared, currently reducing the invoice, undone, or withdrawn. Moved by receivables staff; only an ACTIVE application reduces the invoice, and the credit note and invoice keep their own statuses. Prepared…
  - **Reversal Of Application** (a Credit Note Application) — The earlier application that this record undoes, when it is a reversal. Set when a wrong application is corrected; the original is never edited, so audit sees both the mistake and its correction. Links correction to the original adjustment…
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
  - **Payment Terms** — Default settlement policy for customer invoices. Used by SalesOrder Invoice receivables collections and cash forecasting. May be overridden by authorized contract or transaction-level terms. Supplies default due-date expectations to order…
  - **Status** (required, one of the Customer Status values) — Whether the customer relationship is open for business, dormant, held back or closed. Moved by sales or finance; it decides whether new orders may be taken, while past transactions stay attributed to the customer. A customer the organisati…
  - **Party** (required, a Party) — The party that holds the role. Set when the role is assigned and not changed. One Party may have multiple PartyRoles simultaneously or historically. Connects role-specific processing back to the canonical identity.
  - **Role Type** (required, one of the Customer Role Type values) — The kind of role the party plays, such as customer, supplier, employee or partner. Chosen when the role is assigned; decides which specialised record (customer, supplier and so on) carries its detail. The party buys goods or services from…
  - **Code** — An optional code for the role. Used by integrations that identify the role separately from the party. Identifies the role instance and must not replace Party or specialized role identifiers.
  - **Valid From** — The first date on which the role applies. Set when the role is assigned. Works with validTo and status; ending a role does not delete Party identity or other roles. Prevents premature use of a newly established role.
  - **Valid To** — The last date on which the role still applies to the party. Set when the role ends, such as a contract expiry; empty while open-ended, and later use of the role is refused. Historical transactions may continue referencing the role after va…
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

A unit of an organisation that groups people, positions, responsibilities and work. Departments are how people are organised day to day. They define reporting lines, budgets and responsibilities. Defined by HR and management; assigned to people and positions; used in reporting and approvals. A department belongs to an Organization (or one of its business units). Code and identity stay stable. Reorganisations are recorded explicitly so earlier reports do not change. The Accounts Payable department of the finance function.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short code of the department, such as FIN-AP. Used in postings and reports; kept stable.
  - **Name** (required) — The name of the department as the organisation calls it, such as Finance or Field Operations. Entered by an administrator; shown in organisation charts, on documents and in reports that group people and costs by department.
  - **Description** — What the department is responsible for and what kind of work it does. Read by people placing staff, positions or work, so they choose the right department. Free text written by the organisation's administrators.
  - **Status** (required, one of the Department Status values) — Whether the department currently exists as part of the organisation. Set to inactive after a reorganisation closes or merges the department. Inactive departments are not offered when assigning people or work. The department exists and can…
  - **Organization** (required, a Organization) — Chosen when the department is created; reporting lines, headcount and budgets roll up through the organisation it belongs to. The organisation the department belongs to. Exactly one organisation: a department is part of a single organisati…
  - **Business Unit** (a Business Unit) — The business unit the department is part of. Set where the organization is divided into business units. At most one. Used in business-unit reporting.
  - **Parent Department** (a Department) — The department this one reports to. Builds the hierarchy used for approvals. At most one. Cannot be itself.
  - **Manager** (a Person) — The person who leads the department. Approves its requests and receives its reports. One per department. Approval routing goes to this person.
  - **Cost Center** (a Cost Center) — The cost centre that carries the department's costs. Defaulted onto the department's purchases and time. At most one. Set by controlling.
  - **Location** (a Location) — Where the department is based. Used in directories and space planning. At most one. Staff may work elsewhere.

### Department Status

The values of department status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **From Currency** (required, a Currency) — Currency from which an amount is converted. Identifies the source denomination of the monetary amount being converted. Must differ from toCurrency for a meaningful exchange-rate conversion. Identifies the currency of the source Money value…
  - **To Currency** (required, a Currency) — Currency into which an amount is converted. Identifies the target denomination of the converted monetary amount. Conversion direction is from fromCurrency to toCurrency; reversing the direction requires an appropriate inverse rate rather t…

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
  - **Code** (required) — The business code of the period, such as 2026-03 or FY2026-Q1, by which finance staff name it. Assigned when the calendar is set up and shown on journals, close checklists and reports; unique within an organisation's calendar. Human-facing…
  - **Start Date** (required) — The first accounting date that falls inside the period, from which postings are assigned to it. Set when the calendar is defined; a journal entry is posted to the period whose dates contain its entry date. Defines lower posting boundary. I…
  - **End Date** (required) — The last day covered by the accounting period. Set when the calendar is defined; must not be before the start date. Postings dated after it belong to a later period. Together with the start date it defines the interval in which journal ent…
  - **Status** (required, one of the Fiscal Period Status values) — Controls whether journal entries may be posted to the period, from not yet open to finally closed. Moved by finance through open, soft close, close and lock; journal validation reads it before accepting any posting. Defined but not yet ope…
  - **Organization** (required, a Organization) — Exactly one organisation: each legal entity keeps its own accounting calendar and closes its own periods. Accounting organization owning period. Establishes books/control boundary. Posting and reporting. Journal organization must match.

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

A versioned forward-looking financial projection built on a defined scenario and the information available at a given date. A forecast says where the numbers are expected to go. Keeping it apart from approved budgets and actual postings lets the organisation compare what was planned, what is expected and what happened. Prepared by finance each cycle; versioned as assumptions change; read by management. A forecast belongs to an Organization, may use a Scenario and covers a FiscalPeriod. It never creates or alters actual journal entries. The Q3 rolling forecast of revenue and costs for the Euro…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The reference of the forecast, such as FC-2026-Q3-V2. Assigned by finance; identifies version and cycle.
  - **Name** (required) — A descriptive name for the forecast, such as "Q3 rolling cash outlook", that tells readers its purpose. Chosen by finance when the forecast is started and shown in reports and in lists of forecast versions. Identifies it for people.
  - **As Of Date** (required) — The date the forecast is made as of — actuals up to it, estimates after it. Successive forecasts are compared by it. Within the fiscal year forecast.
  - **Horizon Start** (required) — The first day covered by the forecast, from which the projected periods run. Set when the forecast is started, typically the day after the as-of date; it may not be later than the horizon end. Not later than the horizon end.
  - **Horizon End** (required) — The last day the forecast covers. Usually the end of the fiscal year, or a rolling twelve months. Not earlier than the horizon start.
  - **Forecast Type** (required, one of the Forecast Forecast Type values) — Says what kind of measures the forecast projects, such as cash, sales or headcount. Chosen when the forecast is created and decides which measures it holds. Cash forecasts are usually prepared weekly and financial forecasts monthly. Projec…
  - **Total Revenue** — The total revenue the forecast expects over its whole horizon. Summed from the forecast detail lines rather than typed in; management compares it with the approved budget. Compared with the budget.
  - **Total Cost** — The total cost the forecast expects over its whole horizon. Summed from the forecast detail lines rather than typed in; management compares it with the approved budget. Compared with the budget.
  - **Assumptions** — The key assumptions behind the numbers, such as growth rates, exchange rates and timing of large receipts. Written by finance and read by management when reviewing; it should explain what changed since the previous forecast. Should state w…
  - **Status** (required, one of the Forecast Status values) — Shows where the forecast is in review, from a draft to the current approved outlook. Moved on by its author and the reviewers as it is submitted, approved and eventually replaced. Only one approved forecast per scenario is current at a tim…
  - **Organization** (required, a Organization) — The organisation the forecast is for. Set when prepared. Exactly one organisation: forecasts are made for a particular entity. Scopes the projected figures.
  - **Scenario** (a Scenario) — The scenario of assumptions on which the forecast is based. Chosen when prepared. At most one scenario. Allows alternative projections to be compared. Identifies planning case.
  - **Fiscal Period** (a Fiscal Period) — The period the forecast covers. Set when prepared. At most one period. Places the projection in time. Aligns projection to reporting period.
  - **Currency** (a Currency) — The currency of the amounts. Usually the company's reporting currency. One per forecast. All amounts use it.

### Forecast Forecast Type

The values of forecast forecast type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Forecast Status

The values of forecast status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Foreign Exchange Transaction

An agreement or execution that exchanges one currency for another at defined amounts, rate, dates and counterparties. Whenever money changes currency, a rate is fixed and an obligation arises. This record preserves the terms so the gain or loss, the cash movement and the accounting can be explained. Created when a trade is agreed; settled on the value date; read by treasury and accounting. A transaction exchanges two currencies between counterparties and may be linked to payments and journal entries. Finalised financial evidence is corrected by compensating or superseding records, not edited.…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the exchange takes effect (the value date). Set from the deal; cash moves on this date.
  - **Deal Number** (required) — Our reference for the deal. Assigned when the deal is recorded; matched with the bank's confirmation. Unique.
  - **Deal Type** (required, one of the Foreign Exchange Transaction Deal Type values) — What kind of exchange deal it is. Chosen when recording; it decides how the deal is valued before settlement. Forwards and swaps are valued at each period end. Settled within the normal spot period, usually two business days. Settled on an…
  - **Sold Amount** (required) — The amount of the currency the company sells. Agreed in the deal; paid out on the value date. In the sold currency.
  - **Bought Amount** (required) — The amount of the currency the company buys. Agreed in the deal; received on the value date. In the bought currency; equals the sold amount times the rate.
  - **Exchange Rate** (required) — The agreed rate, as units of the bought currency per unit of the sold currency. Agreed when dealing; checked against the bank's confirmation. The quoting direction is fixed so that amounts reconcile.
  - **Trade Date** (required) — The day the dealer and the bank agreed the currency exchange. Recorded by the treasury dealer when the deal is struck; it may not be later than the value date and starts the exposure. Not later than the value date.
  - **Value Date** (required) — The day the currencies are exchanged. Agreed in the deal; cash is moved on this day. Business days of both currencies apply.
  - **Swap Reference** — The reference shared by the two legs of a swap. Set on both legs so they can be read together. Empty for spot and forward deals.
  - **Purpose** — Why the deal was made, such as "pay supplier invoice batch 23" or "hedge Q3 USD receipts". Recorded for hedge documentation and later review. Hedge accounting requires it.
  - **Confirmed At** — When the bank's confirmation was matched with the deal. Recorded by the back office. An unconfirmed deal near its value date is chased.
  - **Settled At** — The moment both currency payments of the deal were completed. Recorded by treasury operations when the bank confirms settlement. It stays empty while the deal is open. Present once settled.
  - **Status** (required, one of the Foreign Exchange Transaction Status values) — Shows how far the deal has progressed from being dealt to being settled or cancelled. Moved on by treasury as the bank confirms the deal and both payments are made. Only unsettled deals count in the open currency position. Agreed with the…
  - **Sold Currency** (required, a Currency) — The currency the company sells. Chosen when recording the deal. One per deal. Different from the bought currency.
  - **Counterparty** (required, a Organization) — The bank the deal is made with. Chosen when dealing; exposure to it is monitored. One bank per deal. Must be an approved dealing counterparty.
  - **Paying Account** (a Bank Account) — The company account the sold currency is paid from. Chosen for settlement. One per deal. In the sold currency.

### Foreign Exchange Transaction Deal Type

The values of foreign exchange transaction deal type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Foreign Exchange Transaction Status

The values of foreign exchange transaction status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Interest

An interest accrual or charge calculated for an eligible balance, on a rate basis, for a period. Interest turns time and balance into money. Recording each calculation, with its inputs and period, lets finance explain what was charged or earned and recompute it if the basis is challenged. Produced by interest runs on loans, deposits and receivables; posted to the ledger; read by finance and customers. Interest refers to the balance and rate it was computed from and to the ledger entries that record it. Finalised financial evidence is corrected by compensating or superseding records and never…

Readable by every signed-in person.

Fields:
  - **Effective At** — The date and time as of which the interest was calculated. Set by the run, normally the end of the accrual period; it decides the period the interest belongs to.
  - **Calculation Number** (required) — The reference of the calculation. Assigned when it is calculated; quoted on statements and postings. Unique.
  - **Interest Type** (required, one of the Interest Interest Type values) — What the interest is on. Set by the run or person that calculates it; it decides whether the interest is income or expense. Read with the balance it refers to. Interest the company pays on borrowing. Interest the company earns on money pla…
  - **Balance** (required) — The balance the interest is computed on. Taken from the loan, deposit or invoice for the period. In the calculation's currency.
  - **Rate Percent** (required) — The annual rate applied, in percent. Taken from the agreement or the late-payment policy. For a floating rate, the rate in force for the period.
  - **Day Count Basis** (required, one of the Interest Day Count Basis values) — The convention for counting days when working out interest for the period. Taken from the agreement; the same rate gives a different amount under each convention. Actual days elapsed divided by 360. Actual days elapsed divided by 365. Each…
  - **Period Start** (required) — The first day of the period interest is computed for. Set by the run. Not later than the period end.
  - **Period End** (required) — The last day of the period for which interest is calculated. Set by the interest run; periods for the same balance must not overlap. Periods for the same balance do not overlap.
  - **Days** — How many days the interest is computed for under the day-count basis. Computed from the period. Shown so the amount can be checked.
  - **Interest Amount** (required) — The interest due for the period. Computed as balance × rate × days ÷ basis; posted to the accounts. Rounded to the currency's smallest unit.
  - **Posted At** — The date and time the interest was booked to the accounts. Recorded when finance posts the calculation; empty while the interest is only calculated. Present once posted.
  - **Status** (required, one of the Interest Status values) — Shows whether the calculated interest has been booked to the accounts. Moved on by finance when it posts, cancels or reverses a calculation. Only posted interest appears in the accounts. Worked out and waiting to be checked and posted. Boo…
  - **Invoice** (a Invoice) — The invoice charged late-payment interest. Set for late-payment interest. At most one per calculation. Charged to the invoice's customer.
  - **Currency** (required, a Currency) — The currency of the balance and the interest. Taken from the balance. One per calculation. Balance and amount share it.

### Interest Day Count Basis

The values of interest day count basis, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Interest Interest Type

The values of interest interest type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Interest Status

The values of interest status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Invoice

Represents a formal financial claim and its controlled settlement and adjustment state. Invoice records what was originally claimed. Payment records money moved. PaymentAllocation records how money is applied. CreditNote, SupplierCreditNote, and SupplierDebitNote record separate authorized financial adjustments; their application entities record claim-level consumption. Used by order-to-cash, procure-to-pay, accounting, tax, collections, payments, reconciliation, customer credit, supplier recovery and audit. SalesOrder provides commercial commitment, Shipment or delivery provides fulfillment…

Readable by every signed-in person.

Fields:
  - **Invoice Number** (required) — The number printed on the invoice, by which customer and supplier refer to it. Identifier communicated to customers, suppliers, tax authorities, and financial operations. Used in documents, statements, reconciliation, collections, payables…
  - **Invoice Date** (required) — Accounting and commercial date assigned to the invoice. Establishes the date used for financial chronology and applicable billing and tax rules. Used for accounting periods, tax, payment-term calculation, aging, reporting, and reconciliati…
  - **Due Date** — Transaction-level date by which the claim is expected to be settled. Result of applying the effective PaymentTerm and due-date basis to the invoice. Drives aging, collections, cash forecasting, and payment planning. PaymentTerm is policy;…
  - **Invoice Type** (required, one of the Invoice Invoice Type values) — An invoice the organisation issues to a customer for goods or services supplied. An invoice the organisation receives from a supplier. A document that reduces what is owed under an earlier invoice. A document that increases what is owed un…
  - **Status** (required, one of the Invoice Status values) — Being prepared; not yet sent and not yet part of the receivables. Sent or recorded; the amount is now owed and due by its due date. Part of the amount has been settled by payments or credits. Fully settled. A final state. Past its due date…
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
  - **Entry Number** (required) — The sequential number of the entry in the ledger. Allocated from the ledger's number series; unique; quoted in audit queries. Distinct from source transaction numbers such as Invoice, Payment, CreditNote, SupplierCreditNote and SupplierDeb…
  - **Entry Date** (required) — The accounting date of the entry. Set from the originating event; decides the fiscal period the entry belongs to. May differ from originating transaction, bank value, invoice, CreditNote, SupplierCreditNote or SupplierDebitNote date. Contr…
  - **Status** (required, one of the Journal Entry Status values) — Whether the entry has been recorded in the books. Moved by the posting process; only POSTED entries affect balances. Prepared but not yet recorded; no effect on balances. Recorded in the ledger; it affects balances and can no longer be edi…
  - **Description** — A short explanation of what the entry records. Written or generated at posting; shown in ledgers and drill-downs. Complements source transaction and lines; must not be sole accounting evidence. Helps accountants understand why the entry wa…
  - **Currency** (a Currency) — The Currency this JournalEntry belongs to.
  - **Payment** (a Payment) — At most one payment, the payment that gave rise to the entry. Payment whose financial recognition is represented when applicable. Supports cash, receivable, payable, clearing, fee and settlement accounting traceability. A posted payment ma…
  - **Credit Note** (a Credit Note) — At most one credit note, the document that gave rise to the entry. Customer CreditNote whose financial adjustment is represented. Supports receivable, revenue, tax, inventory-related and refund-obligation accounting traceability. CreditNot…
  - **Organization** (a Organization) — At most one organisation, the ledger owner; it defaults to the current ledger. Organization whose books recognize the accounting entry. Supports legal-entity accounting, reporting, period control and ledger ownership. Determines accounting…
  - **Fiscal Period** (a Fiscal Period) — Accounting control period containing entryDate. Establishes posting eligibility and close context. Posting, close, reporting and audit. Required for POSTED entries under period-controlled accounting; optional while draft before determinati…
  - **Ledger** (a Ledger) — The Ledger this JournalEntry belongs to.

### Journal Entry Line

One debit or credit line within a journal entry. Double-entry accounting records every event as at least two lines which balance. The line is the unit of the ledger: an account, an amount and a direction. Created with its entry; summed per account to give balances; read by financial reports and audits. Each line belongs to one JournalEntry and posts to one Account. Lines are part of their entry: they are edited while it is a draft and fixed once it is posted. Debit 1,200.00 to Accounts Receivable as part of the entry for invoice INV-2026-0441.

Readable by every signed-in person.

Fields:
  - **Line Number** (required) — The position of the line within the entry. Set when the entry is created; keeps the order of lines stable.
  - **Debit Amount** (required) — The amount debited to the account. Entered or derived from the source; not negative, and zero if the line is a credit.
  - **Credit Amount** (required) — The amount credited to the account. Entered or derived from the source; not negative, and zero if the line is a debit.
  - **Description** — A short note explaining what this single debit or credit line records. Typed by the person or process posting the entry; shown when a user drills down from a ledger balance to the underlying lines.
  - **Journal Entry** (required, a Journal Entry) — The entry the line belongs to. Set when the line is created. Exactly one entry: a line has no meaning outside the entry it balances. The entry's lines must balance before it can be posted.
  - **Account** (required, a Account) — The ledger account the line posts to. Chosen when the entry is made. Exactly one account: each line affects a single account. Determines which balance and statement line the amount affects.

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

A language used for localisation, communication preferences, content and reporting. People read and write in different languages. A language record lets the application offer translations, remember preferences and tag content with the language it is written in. Loaded from the standard language registry; chosen on user profiles, documents and messages. Parties, users and content refer to a language; the language itself depends on nothing. Code and identity stay stable, and history is never silently rewritten. English, with code en.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The two-letter ISO 639-1 code of the language, such as en or de. Taken from the standard; unique; used in locale settings and APIs.
  - **Name** (required) — The English name of the language, such as French or Portuguese. Loaded from the language reference data; it is shown in language pick-lists and reports, while the code remains the identifier.
  - **Alpha3** — The three-letter ISO 639-3 code, such as fra. Used by systems that require three-letter codes. From the standard.
  - **Direction** (required, one of the Language Direction values) — Whether the language is written left to right or right to left. Tells screens and documents how to lay out text. From the Unicode CLDR. Written left to right. Written right to left.

### Language Direction

The values of language direction, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Ledger

An accounting book that defines the scope in which journal entries are recorded and reported. A single organisation may keep several books, for example one for local statutory reporting and one for group reporting. The ledger names a book and holds its entries, so figures in one book are never mixed with another. Created when accounting is set up for an organisation; filled by journal entries; read by accountants and auditors. A ledger belongs to one Organization and contains JournalEntries. It must not silently duplicate or rewrite authoritative cash, tax or billing records. A ledger is draf…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Ledger Status values) — Whether the ledger is currently open to receive journal entries. Moved by finance as books are opened and closed; postings are accepted only while ACTIVE, and finished ledgers are kept for reporting. Being set up and not yet accepting entr…
  - **Code** (required) — The code of the ledger, such as 0L. Chosen when the ledger is created; postings and reports refer to it. Unique.
  - **Name** (required) — The name of the ledger, such as "Leading – French GAAP". Shown in posting and reporting screens. Identifies it for people.
  - **Ledger Type** (required, one of the Ledger Ledger Type values) — Whether this is the company's main ledger or a parallel one. The leading ledger is the default for postings. One leading ledger per company. The main ledger, under local statutory rules. An additional ledger under another standard, such as…
  - **Accounting Standard** — The accounting rules the ledger follows, such as "IFRS", "US GAAP" or "French GAAP". Decides valuation in parallel postings. Set when the ledger is created.
  - **Chart Of Accounts** — The chart of accounts the ledger uses. Its accounts are the ones postings may use. Several ledgers may share a chart.
  - **Organization** (required, a Organization) — Exactly one organisation: a book is kept for a single legal entity. Organization owning accounting book. Defines legal/management accounting boundary. Posting and reporting. Journal entries must use compatible organization context.
  - **Currency** (a Currency) — The currency the ledger is kept in. Set when the ledger is created. One per ledger. Usually the company's functional currency.

### Ledger Ledger Type

The values of ledger ledger type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

A legally recognised organisation or person that can hold rights and obligations, registrations, contracts, assets, liabilities or filings. Contracts are signed and taxes are paid by legal entities, not by business units. Knowing exactly which entity is involved determines liability, reporting and registration duties. Registered when an entity is formed or acquired; referenced by contracts, filings and ledgers. Contracts, filings and accounting books refer to the legal entity. Finalised evidence and effective history are preserved; changes such as name changes or mergers are recorded explicit…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the entity was formed, or its record took effect. Set from the registration data.
  - **Legal Name** (required) — The registered name, exactly as in the register. Printed on invoices, contracts and filings. A trading name may differ; this is the one the law recognises.
  - **Registration Number** — The number under which the entity is registered, such as a company number or SIREN. Printed on documents where the law requires it; used in KYC checks. Unique within its jurisdiction.
  - **Legal Form** — The legal form, such as "SAS", "GmbH", "Ltd" or "LLC". Printed after the name on documents. Each jurisdiction has its own forms.
  - **Incorporation Date** — The day the company or organisation was legally formed, as shown on its certificate of incorporation. Copied from the official register when the entity is set up; used for age checks, filings and group structure charts. It can never fall a…
  - **Dissolution Date** — The day the legal entity formally ceased to exist and was removed from the register. Entered by company secretarial when a dissolution is confirmed; it stays empty for entities that still exist. Only dissolved entities carry a date here.
  - **Tax Identifier** — The entity's main tax number in its country. Printed on invoices and used in tax filings. Further registrations are recorded as tax registrations.
  - **Vat Number** — The entity's VAT or sales-tax registration number. Printed on invoices; validated for cross-border trade. Empty for entities not registered for VAT.
  - **Lei** — The Legal Entity Identifier, a 20-character global code. Required for financial transactions and regulatory reporting. Issued by an LEI operator and renewed every year.
  - **Is Group Company** (required) — Whether the entity belongs to our own group. Separates the group's companies from customers' and suppliers' entities; intercompany transactions are between group companies. Group companies have their own accounts and filings.
  - **Status** (required, one of the Legal Entity Status values) — Registered, in good standing and free to trade, sign contracts and issue invoices. Still registered but not trading, so it holds no live business activity. Being wound up by a liquidator; no new business should be started in its name. Stru…
  - **Organization** (a Organization) — The organization this entity is the legal form of. Linked so that the organization's contracts and filings can be issued in the right name. At most one organization per entity. An organization may trade through several entities in differen…
  - **Country** (a Country) — The country the entity is registered in. Decides which law, register and tax rules apply. One per entity. A branch abroad is not a separate entity.
  - **Registered Address** (a Address) — The registered office. Printed on documents where the law requires it. One per entity. May differ from where the entity operates.
  - **Functional Currency** (a Currency) — The currency the entity keeps its accounts in. Set by finance; translations to the group currency start from it. One per entity. Usually the currency of its country.
  - **Parent Entity** (a Legal Entity) — The entity that owns this one in the group. Recorded for group companies; consolidation follows it. At most one parent. Minority holdings are not recorded here.

### Legal Entity Status

The values of legal entity status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

A time-bound relationship between two parties that describes how they stand to each other in business, legal, household, employment or another way. Parties are connected to each other: a company to its subsidiary, a person to their employer, one household member to another. Recording the relationship, with its dates, lets the organisation see who is connected to whom and since when. Created when a relationship is established; ended when it stops; read by sales, compliance and customer service. A relationship runs from one Party to another. Code and identity stay stable, and the relationship's…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the relationship type or instance, such as SUBSIDIARY_OF. Chosen from the relationship list; used in queries and rules.
  - **Name** (required) — A readable description of the relationship, such as Acme Ltd is subsidiary of Acme Group. Entered when the relationship is created; shown in party views and lists so users can understand the link at a glance.
  - **Relationship Type** (required, one of the Party Relationship Relationship Type values) — Describes how the first party stands towards the second, such as subsidiary, employee or guarantor. Chosen when the link is recorded; credit, compliance and group reporting use it to interpret the connection. Read from the first party to t…
  - **Ownership Percent** — The share the parent or owner holds, for ownership relationships. Used in consolidation and beneficial-ownership checks. Between 0 and 100.
  - **Valid From** — The first day on which the relationship between the two parties holds. Recorded when it is known, for example from a contract or register entry. It cannot be later than the valid-to date.
  - **Valid To** — The last day on which the relationship between the two parties holds. Recorded when the relationship ends, for example on resignation or sale; empty while it still applies. Empty while the relationship continues.
  - **Status** (required, one of the Party Relationship Status values) — Says whether the relationship between the two parties is still in force today. Set to ended by the person maintaining the record when the relationship stops. Ended relationships stay for history. The relationship is in force today. The rel…
  - **From Party** (required, a Party) — The party at the origin of the relationship. Chosen when the relationship is created. Exactly one origin party: a relationship always starts at a particular party. Together with the other party it identifies the relationship.

### Party Relationship Relationship Type

The values of party relationship relationship type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Party Relationship Status

The values of party relationship status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Payment

Represents movement or recognition of money while keeping payment execution, claim settlement, bank evidence, accounting recognition, customer refunds and supplier-credit refunds as separate connected facts. Payment is the settlement event. Invoice is the claim. PaymentAllocation applies receipt payments to claims. CreditNote is a customer financial adjustment. SupplierCreditNote is a supplier payable adjustment. A refund or settlement Payment is separate cash evidence. Accounts receivable, accounts payable, treasury, banking integrations, cash management, reconciliation, collections, supplie…

Readable by every signed-in person.

Fields:
  - **Payment Number** (required) — The number under which the payment is recorded and quoted. Allocated from a number series; unique; shown on remittance advices and receipts. Reference communicated in remittance, statements, bank reconciliation and payment inquiries. Disti…
  - **Payment Date** (required) — Timestamp at which the payment event is recognized by the business process. Establishes internal settlement chronology. Accounting periods, cash reporting, reconciliation and settlement analysis. Distinct from bank value date, clearing dat…
  - **Direction** (required, one of the Payment Direction values) — Whether money is coming in or going out. Set when the payment is created; decides whose account is debited and credited. Money received from a payer. Money paid out to a payee. Establishes cash-flow direction and payer/payee interpretation…
  - **Status** (required, one of the Payment Status values) — How far the payment has progressed from preparation to clearing. Moved by treasury and the bank reconciliation process. Being prepared; no financial effect. Authorised but not yet recorded in the books. Recorded in the ledger but not yet c…
  - **Amount** (required) — Total monetary value of the payment event. Represents money received or disbursed, not the amount allocated to one claim or credit. Cash position, allocation validation, accounting and reconciliation. PaymentAllocation distributes receipt…
  - **Currency** (required, a Currency) — The currency in which the payment amount is denominated, such as EUR or USD. Chosen when the payment is created; used to pick exchange rates, validate allocations and reconcile to the bank account. Defines interpretation of payment amount.…
  - **Payment Method** (required, one of the Payment Payment Method values) — Describes how the money is physically moved, such as by bank transfer, card, cheque or cash. Chosen when the payment is created; decides how it is processed, which fees apply and how it is reconciled. Money is handed over in notes and coin…
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

An instruction that authorises or requests a future payment through a bank or payment channel, kept apart from the payment and bank transaction that result. Paying someone is a two-step affair: the organisation instructs the bank, and later the bank confirms. Holding the instruction separately shows what was authorised, by whom and when, and lets it be compared with what the bank actually did. Created when a payment run is approved or a standing instruction is set up; sent to the bank; read by treasury to follow what was authorised. An instruction is for a BankAccount and, once executed, rela…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Payment Instruction Status values) — Where the instruction is in its path to the bank. Moved by treasury and the bank interface. Being prepared; not yet released. Released to the bank and awaiting execution. Executed by the bank. A final state. Withdrawn before execution. A f…
  - **Instruction Number** (required) — The reference of the instruction. Assigned when it is created; carried in the payment file. Unique; the bank refuses duplicates.
  - **Amount** (required) — The sum the bank is being told to pay to the payee. Taken from the approved invoices or entered by hand when the instruction is created, and checked at approval. In the paying account's currency unless a foreign payment is ordered.
  - **Value Date** (required) — The day the payee should receive the money. Set by the payment run from due dates. Must be a business day for the currency.
  - **Payee Name** (required) — The name of the payee as it is sent to the bank. Copied from the payee's record. Some banks check it against the account holder.
  - **Payee Account** (required) — The payee's bank account number or IBAN to which the money will be sent. Copied from the payee's verified bank details; a change must be verified before it is used. Wrong details send money to the wrong place.
  - **Payee Bank Code** — The payee bank's identifier, such as a BIC or routing number. Copied from the payee's bank details. Required for some payment methods.
  - **Payment Method** (required, one of the Payment Instruction Payment Method values) — The way the bank is asked to move the money, from standard transfer to cheque. Chosen by treasury when creating the instruction; it decides the bank file format, the fee and the speed. Urgent and cross-border payments cost more. A standard…
  - **Remittance Reference** — The reference the payee sees on their statement, such as the invoice numbers paid. Lets the payee match the payment. Length limited by the payment scheme.
  - **Approved At** — The date and time the final approver authorised the instruction for release to the bank. Stamped on the last approval; treasury cannot send the instruction without it. Required before sending.
  - **Sent At** — The date and time the instruction was transmitted to the bank. Stamped by the bank interface on transmission and used when reconciling with the bank statement. Filled only after sending.
  - **Bank Status Message** — The status or rejection text the bank returned for this instruction. Copied from the bank's status report so treasury can see why a payment failed or was held. Explains rejections and holds.
  - **Bank Account** (required, a Bank Account) — The bank account from which the payment is to be made. Chosen when the instruction is created. Exactly one account: an instruction debits one account. Determines the bank channel, balances and approval limits. Supplies treasury settlement…
  - **Payment** (a Payment) — The payment that results from the instruction. Linked when the instruction has been executed. At most one payment; a draft or cancelled instruction produces none. Connects what was authorised to what was paid. Connects intent to settlement…
  - **Payee** (a Party) — The party paid. Chosen when the instruction is created. One per instruction. Their verified bank details are used.
  - **Approved By** (a Person) — Who gave the final approval. Recorded on approval. One per instruction; dual approval records the second approver here. Must hold payment authority for the amount.

### Payment Instruction Payment Method

The values of payment instruction payment method, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

A responsibility centre used to analyse revenue, cost and profit independently of the legal accounts. A profit centre lets management see how a part of the business performs, such as a product line or region, whatever legal entity or account the money passes through. It supports management reporting only and never rewrites accounting entries. Defined by finance; chosen on transactions and budgets; read by management reports. A profit centre belongs to one organisation. A profit centre is created, used while it is reported on, and left unused when the unit closes. Existing analysis keeps it. T…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short code of the profit centre, such as PC-NORTH. Unique within the organisation; used in imports, budgets and reports.
  - **Name** (required) — The descriptive name of the profit centre as shown on management reports. Entered when controlling creates the profit centre and shown beside its code on reports and in pick lists. Read together with the code to pick the right centre.
  - **Segment** — The reporting segment it belongs to in published accounts, if any. Used to prepare segment information for the financial statements. Several profit centres may make up one segment.
  - **Valid From** (required) — The first day transactions may be assigned to it. Set when it is created. Not later than the valid-to date.
  - **Valid To** — The last day transactions may be assigned to it. Set when it is closed. Empty while open.
  - **Status** (required, one of the Profit Center Status values) — Says whether new transactions may still be assigned to this profit centre. Moved on by controlling when a centre is opened or retired. Closed profit centres are not offered in selection lists. Open and available when assigning revenue and…
  - **Organization** (required, a Organization) — The organisation the profit centre belongs to. Chosen when it is created. Exactly one organisation. Keeps profit analysis within the right company.
  - **Manager** (a Person) — The manager responsible for the profit centre's results. Receives its reports. One per profit centre. Accountable for its margin.
  - **Parent Profit Center** (a Profit Center) — The profit centre it rolls up into. Builds the reporting hierarchy. At most one parent. Cannot be itself.

### Profit Center Status

The values of profit center status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Scenario

Alternative planning assumption context. Separates hypothetical plans from actual outcomes. Budgeting, forecasting and sensitivity analysis. Budget and Forecast may reference it.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short code naming the scenario, such as BASE, UPSIDE or DOWNSIDE. Chosen by finance when the scenario is created, unique, and shown in planning screens and variance reports. Identifies baseline/upside/downside or named case. Does not i…
  - **Status** (required, one of the Scenario Status values) — Whether the scenario is still being defined, open for planning, or retired. Starts as DRAFT and is moved by finance; only ACTIVE scenarios accept new budget and forecast figures. Being defined and not yet used in planning. Available for bu…
  - **Name** (required) — The title planners give to a set of planning assumptions, such as Best case 2027. Shown wherever a budget or forecast is tied to a scenario so users can choose between them. Identifies the scenario for people, beside its code.
  - **Scenario Type** (required, one of the Scenario Scenario Type values) — The expected case that most plans are built on. A more favourable case than expected. A less favourable case than expected. A severe case used to test resilience. What kind of scenario it is. Reports show the base case first and the altern…
  - **Assumptions** — The assumptions that define the scenario. Written by finance; read by everyone preparing plans under it. Should be specific enough to apply consistently.

### Scenario Scenario Type

The values of scenario scenario type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

A first-level division of a country, such as a state, province or region, from the ISO 3166-2 registry. States and provinces give addresses a standard, checkable subdivision. Choosing from this list avoids misspelt regions and lets reports group by region. Maintained as reference data; chosen in addresses; read by tax, shipping and reports. A state or province belongs to one country and contains cities. Entries are loaded from the standard and rarely change; when a division is abolished it is withdrawn without deleting history. "California" belongs to the United States and contains cities suc…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The ISO 3166-2 code, the country code and the division's own, such as US-CA. Search, integration and reporting. Unique; begins with the code of the country it belongs to.
  - **Name** (required) — The English name of the division, such as California or Bavaria. Shown in lists and on addresses; it is a label only, so integrations should use the ISO code as the stable key. Does not replace the code as the stable key.
  - **Subdivision Type** — What the registry calls the division in its country: State, Province, Region, Territory and so on. Labelling the field for users of that country. Describes this division only.
  - **Country** (required, a Country) — The country the division belongs to. Chosen first; the divisions offered are those of that country. Every state or province belongs to exactly one country. A city and an address are narrowed by the country before the state.

### Subscription

A customer's subscription to a plan, product, service or entitlement over a defined life. A subscription is the ongoing agreement to supply something for a period. It records who subscribes and its state, while billing, usage and entitlement are recorded in their own records so none is duplicated. Created when a customer signs up; read by billing, support and account management. A subscription belongs to a customer and follows a plan. A subscription is drafted, active while it runs, and completes at the end of its term or is cancelled. Completed and cancelled are final. A customer subscribes…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Subscription Status values) — Where the customer's subscription is in its life: being set up, running, finished or cancelled. Starts as DRAFT; account management activates it at sign-up, and billing and entitlements apply only while it is active. The subscription is be…
  - **Subscription Number** (required) — The reference of the subscription. Assigned at sign-up; shown on invoices and in the customer portal. Unique.
  - **Quantity** (required) — How many units — users, seats, devices — are subscribed. Multiplies the plan's per-unit fee. Changes take effect from the next period unless prorated.
  - **Start Date** (required) — The day on which the customer's subscription began. Recorded at sign-up and used for reporting on customer tenure. Not later than the end date.
  - **Trial End Date** — The last day the customer can use the service free of charge. Set at sign-up from the plan's trial length; billing starts the day after. Empty when there was no trial.
  - **Current Term Start** — The first day of the billing term the subscription is now in. Moved on automatically at each renewal. Not later than the current term end.
  - **Current Term End** — The last day of the billing term the subscription is now in. Renewal is decided before this date, and billing for the next term follows it. Empty for subscriptions without fixed terms.
  - **Auto Renew** (required) — Whether the subscription renews automatically at term end. Set by the customer or by contract. When off, the subscription expires at term end unless renewed.
  - **Cancelled Date** — The day the customer cancelled. Recorded on cancellation; service may continue to term end. Present only on cancelled subscriptions.
  - **Cancellation Reason** — The explanation the customer or staff gave for ending the subscription. Recorded at cancellation; churn analysis groups cancelled subscriptions by it. Present only on cancelled subscriptions.
  - **Customer** (a Customer) — The customer who subscribes. Chosen when created. At most one customer; empty until identified. Decides who is billed and served.
  - **Plan** (required, a Subscription Plan) — The plan subscribed to. Chosen at sign-up; changed on upgrade or downgrade. One plan at a time. Its prices and entitlements apply.
  - **Billing Cycle** (a Billing Cycle) — The cycle the subscription is billed on. Copied from the plan at sign-up. One per subscription. Decides the billing dates.

### Subscription Plan

A reusable commercial plan that sets the recurring charges, usage, entitlements and billing terms of subscriptions. A plan is the product definition of a subscription. Defining it once lets many subscriptions share the same price and terms, and changing the plan leaves existing subscriptions on the terms they signed. Defined by product or pricing managers; chosen when a subscription is made. A plan is followed by subscriptions. A plan is drafted, active while offered, and completed when no longer offered. It may be cancelled before use. Completed and cancelled are final. The "Premium annual"…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Subscription Plan Status values) — Whether the plan is still being defined, on sale, retired after its run, or withdrawn. Starts as DRAFT; pricing managers activate it to offer it, and only an active plan can be chosen for new subscriptions. The plan is being defined and ca…
  - **Code** (required) — The code of the plan, such as PRO-M-EUR. Used by billing, the portal and integrations. Unique.
  - **Name** (required) — The name customers see, such as "Pro, monthly". Shown on the pricing page, in contracts and on invoices. Identifies the plan for people, with the code.
  - **Description** — A description of what the plan includes and costs, written for customers. Shown on the pricing page and in sign-up emails to help people choose a plan. Must match the entitlements configured on the plan.
  - **Recurring Fee** (required) — The fee charged each billing period. Charged by every billing run for each active subscription. Per unit when the plan is priced per user or per seat.
  - **Pricing Unit** (required, one of the Subscription Plan Pricing Unit values) — What the recurring fee is charged per. Decides whether the fee is multiplied by the subscription's quantity. Read with the recurring fee. One fee for the whole subscription. The fee times the number of users. The fee times another counted…
  - **Included Usage** — How much usage each period includes before overage is charged. Billing rates usage above it at the overage price. In the plan's usage unit.
  - **Usage Unit** — The unit usage is measured in, such as "API calls" or "GB". Shown on invoices next to usage quantities. Usage records are in this unit.
  - **Overage Price** — The price per unit of usage above what is included. Applied by usage rating. Empty when extra usage is not allowed or not charged.
  - **Trial Days** — How many days a new subscriber may use the plan free. The first charge falls after the trial. Empty or zero for no trial.
  - **Minimum Term Months** — The minimum commitment, in months. A subscription cannot be cancelled to take effect before it ends. Empty for no commitment.
  - **Product** (a Product) — The product the plan sells. Linked for revenue reporting by product. One per plan. A product is usually sold in several plans.
  - **Billing Cycle** (a Billing Cycle) — The cycle subscriptions on the plan are billed on. Copied to new subscriptions. One per plan. Monthly and annual variants are separate plans.
  - **Currency** (required, a Currency) — The currency of the plan's prices. Set when designing the plan. One per plan. Each currency needs its own plan.

### Subscription Plan Pricing Unit

The values of subscription plan pricing unit, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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
  - **Party Role** (required, a Party Role) — Points to the party role this supplier record specializes, tying the sourcing profile to the underlying party. Set once at creation and never reassigned; unique, so a party role has at most one supplier profile, and names and addresses are…
  - **Supplier Code** (required) — Enterprise supplier business reference. Used on purchase orders receipts invoices returns credits payments claims portals reports and integrations. Distinct from legal name and external registration identifiers. Identifies the supplier acr…
  - **Supplier Type** (one of the Supplier Supplier Type values) — Classifies what kind of organization or person the supplier is, for due diligence and reporting. Chosen at onboarding; it influences which qualification checks, tax treatment and spend reports apply to the supplier. A natural person or sol…
  - **Qualification Status** (one of the Supplier Qualification Status values) — Records whether the supplier has been vetted and cleared to receive orders under sourcing policy. Updated by procurement or compliance after due diligence; buyers check it before issuing requests for quotation or orders. No qualification r…
  - **Payment Terms** — Default supplier settlement policy. Used by PurchaseOrder Invoice payables payment scheduling and cash forecasting. Transaction or contract terms may override the default. Supplies default payable timing.
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

### Tax Code

A tax classification code used to choose the tax rules, rates, registrations and reporting treatment that apply. A tax code lets a product, service or transaction be given its tax treatment by name instead of retyping rules. It keeps tax decisions consistent and makes it clear why a given rate was charged. Maintained by tax or finance; chosen on products, lines and accounts; read by tax calculation and returns. A tax code may belong to an organisation and is used with jurisdictions and rates. A tax code is drafted, active while it is used, and completed when no longer used. It may be cancelle…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Code Status values) — Whether the tax code can be used on new transactions. Keeps retired codes from being chosen while history stays intact. Starts as DRAFT; set by tax staff. Only active codes are offered on documents. Being defined; not yet usable. In use on…
  - **Code** (required) — The short code entered on transactions, such as FR-VAT-S. Chosen on order and invoice lines, or defaulted from the product and party. Unique.
  - **Name** (required) — The name of the code, such as "France VAT standard". Shown where the code is chosen and on tax reports. Identifies the code for people.
  - **Tax Type** (required, one of the Tax Code Tax Type values) — Which tax this code belongs to, such as VAT, sales tax or withholding. Chosen by tax staff when the code is set up; it decides which return the taxed transactions appear on and which rates are looked up. Read together with the category, wh…
  - **Category** (required, one of the Tax Code Category values) — How the transaction is treated under the tax. Decides the rate and the reporting. Exempt and zero-rated are reported differently even though both charge no tax. Taxed at the standard rate. Taxed at a reduced rate. Taxable at 0%; input tax…
  - **Return Box** — The box or line of the tax return the transactions are reported in. Used to prepare the return. Taken from the authority's return form.
  - **Description** — Explains when this code should be chosen, including the kind of goods, services or customers it covers. Read by whoever codes an order or invoice line to pick the right treatment. For exempt and zero-rated codes it should cite the legal ba…
  - **Organization** (a Organization) — The organisation the code is set up for. Chosen when the code is company specific. At most one organisation; empty means it applies to all. Decides which company's returns the code feeds.
  - **Jurisdiction** (a Tax Jurisdiction) — Where the tax applies. Set when the code is created. One per code. Its authority receives the return.

### Tax Code Category

The values of tax code category, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Code Status

The values of tax code status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Code Tax Type

The values of tax code tax type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Jurisdiction

A geographic or legal authority under which taxes are imposed, collected, reported or remitted. Jurisdictions say who is owed tax and under whose rules. Recording them lets tax be worked out and reported to the right authority and keeps the rates of different places apart. Maintained by tax or finance; used when calculating and reporting tax. A jurisdiction may belong to an organisation and is the place where tax codes apply. A jurisdiction is drafted, active while taxes are due, and completed when it no longer applies. It may be cancelled before use. Completed and cancelled are final. "Ontar…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Jurisdiction Status values) — Shows whether this tax jurisdiction record is still being prepared, in force, or no longer in use. Moved by tax administrators; only active jurisdictions are offered when determining tax, and completed or cancelled ones are kept for histor…
  - **Code** (required) — The code of the jurisdiction, such as FR or US-CA-LA. Used in tax codes, rates and reports. Unique.
  - **Name** (required) — The name of the taxing authority's area, such as France, California or Cook County. Entered by tax administrators and shown wherever a jurisdiction is picked, on tax reports and on registrations. Identifies it for people.
  - **Level** (required, one of the Tax Jurisdiction Level values) — A national tax authority covering a whole country. A state, province or region that levies its own tax. A county or district authority below the state. A city or municipality that adds its own local tax. A special taxing district, such as…
  - **Filing Frequency** (one of the Tax Jurisdiction Filing Frequency values) — How often returns must normally be filed with this jurisdiction's authority. Used to build the filing calendar and reminders for tax staff. It may depend on the size of the business, so the registration states the frequency actually applic…
  - **Organization** (a Organization) — The organisation that is registered or reports in the jurisdiction. Chosen when the jurisdiction is company specific. At most one organisation. Decides whose returns go to the authority.
  - **Country** (a Country) — The country the jurisdiction is in. Set when the jurisdiction is created. One per jurisdiction. Country-level jurisdictions name their own country.
  - **Parent Jurisdiction** (a Tax Jurisdiction) — The larger jurisdiction this one lies within. Builds the hierarchy used to combine rates. At most one parent. Cannot be itself.

### Tax Jurisdiction Filing Frequency

The values of tax jurisdiction filing frequency, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Jurisdiction Level

The values of tax jurisdiction level, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

A tax percentage or amount that applies under a tax code and jurisdiction for a period of time. A tax rate is the figure applied to a taxable amount. Because rates change by date and place, each is recorded with its period so a transaction is taxed at the rate in force on its date, and past calculations can be explained. Maintained by tax staff when authorities change rates; read by tax calculation. A rate may belong to an organisation and applies to a tax code in a jurisdiction. A rate is drafted, active while in force and completed when superseded. It may be cancelled before use. Completed…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Rate Status values) — Shows whether the tax rate is being prepared, currently applicable, or withdrawn from use. Moved by tax administrators; only active rates are picked up by tax calculation, and older rates stay for history. Stops an out-of-date rate being u…
  - **Rate** (required) — The size of the tax: a percentage of the taxable amount or a fixed amount, as the rate basis says. Entered by tax staff from the authority's published rate; must not be negative; applied to the taxable amount during tax calculation. Read w…
  - **Rate Basis** (required, one of the Tax Rate Rate Basis values) — Whether the rate is a percentage of the taxable amount or a fixed amount per unit or document. Chosen when the rate is set up; tax calculation multiplies or adds accordingly. Decides how the rate figure is read. The rate is a percentage of…
  - **Effective From** (required) — The first date on which the rate applies to transactions. Set from the authority's announcement; a transaction is taxed at the rate whose period contains its tax date. Compared with the transaction tax date and the end of the period.
  - **Effective To** — The last date on which the rate applies; empty while it remains in force. Set when the authority changes the rate or the code stops being used; must not be before the start date. Compared with the transaction tax date.
  - **Tax Code Label** — The code and jurisdiction the rate is for, as shown on screens. Filled from the tax code for display in rate lists. The tax code relationship is authoritative.
  - **Rate Type** (required, one of the Tax Rate Rate Type values) — Whether the tax is a percentage or an amount per unit. Decides how the tax is computed. Excise duties are often per unit. A percentage of the taxable amount. A fixed amount per unit of quantity.
  - **Rate Percent** — The tax as a percentage of the taxable amount, such as 20 for twenty percent. Entered by tax staff from the authority's published rate when the rate type is a percentage, and applied to the taxable amount of each line. Used when the rate t…
  - **Amount Per Unit** — The tax charged per unit of quantity, such as a duty per litre or per kilogram. Entered when the rate type is per unit and multiplied by the quantity on the document line. Used when the rate type is per unit.
  - **Valid From** (required) — The first day on which this rate may be applied to transactions. Set from the law or the authority's announcement; it must not be later than the valid-to date, and a transaction uses the rate whose period holds its tax date. Not later than…
  - **Valid To** — The last day on which this rate applies, left empty while it remains in force. Set when a new rate replaces it; rates for one code and jurisdiction must not overlap, so the next rate starts the following day. Rates of one code and jurisdic…
  - **Organization** (a Organization) — The organisation the rate is set up for. Chosen when the rate is company specific. At most one organisation; empty means it applies to all. Decides which company's returns carry the tax.
  - **Tax Code** (required, a Tax Code) — The tax code whose treatment this rate carries. Chosen when the rate is created; tax calculation finds rates through the code on a document line. A rate belongs to one tax code; the same figure for another code is a separate rate. Links th…
  - **Tax Jurisdiction** (required, a Tax Jurisdiction) — The jurisdiction in which this rate is imposed. Chosen when the rate is created; matched to the place of supply or delivery. A rate applies in exactly one jurisdiction, since authorities set their own rates. Selects which authority's figur…

### Tax Rate Rate Basis

The values of tax rate rate basis, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Rate Rate Type

The values of tax rate rate type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

The registration of a party or organisation with a tax jurisdiction and its tax authority. A registration is the tax identity the business holds in a place, such as a VAT number. Recording it shows where the business may charge and must report tax and which number to print on invoices. Maintained by tax staff; read when invoicing and filing returns. A registration may belong to an organisation and is held in a jurisdiction. A registration is drafted, active while valid and completed when it ends. It may be cancelled before use. Completed and cancelled are final. The company's VAT registration…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Registration Status values) — Whether the registration is valid for use. Prevents tax numbers that have lapsed from appearing on documents. Starts as DRAFT; set by tax staff. Only active registrations are printed on invoices. Applied for or being recorded; not yet vali…
  - **Registration Number** (required) — The number the authority issued, such as a VAT number. Printed on invoices; validated for cross-border trade. Unique within its jurisdiction and tax.
  - **Tax Type** (required, one of the Tax Registration Tax Type values) — The kind of tax this registration number was issued for, such as VAT or excise. Chosen when the registration is recorded; it decides which returns the registration drives. A company can hold several registrations in one country for differe…
  - **Valid From** (required) — The day the registration takes effect. Tax may be charged under the number from this day. Not later than the valid-to date.
  - **Valid To** — The last day on which the registration is valid. Set when the company deregisters or the authority withdraws the number; left empty while the registration is in force. Empty while it is in force.
  - **Filing Frequency** (one of the Tax Registration Filing Frequency values) — How often returns are due under this registration, as set by the tax authority. Drives the company's filing calendar and the reminders sent to tax staff. Returns under this registration are due every month. Returns under this registration…
  - **Last Validated Date** — When the number was last checked with the authority's register. Recorded by validation; numbers are rechecked periodically. Required for exempt cross-border sales in many jurisdictions.
  - **Organization** (a Organization) — The organisation that holds the registration. Chosen when recorded. At most one organisation. Decides which company files returns.
  - **Jurisdiction** (a Tax Jurisdiction) — The jurisdiction of the registration. Chosen when recording it. One per registration. Its authority issued the number.

### Tax Registration Filing Frequency

The values of tax registration filing frequency, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Registration Status

The values of tax registration status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Registration Tax Type

The values of tax registration tax type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Tax Rule

A reusable tax determination policy that sets the treatment, rate, jurisdiction and applicability for qualifying goods, services, parties and transactions. Tax rules say what tax applies to what. Keeping them as dated policy lets the business change treatment on a given date without editing past transactions, and lets tax be explained from the rule that produced it. Maintained by tax staff; read by pricing and invoicing when working out tax. A rule may name a jurisdiction and the products, customers and organisations it applies to. A rule is drafted, active while in force, may be set inactive…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The code of the rule, such as UK-VAT-STD. Unique; used in imports and reports. Read with the name.
  - **Name** (required) — The descriptive name of the tax rule, such as Standard VAT on domestic goods. Entered by tax administrators; shown wherever a rule is chosen or explained, and should say what the rule covers. Read by tax staff.
  - **Rate** (required) — The rate applied, as a fraction of the taxable amount. Entered by tax staff; applied to the taxable amount. Read with the tax type.
  - **Jurisdiction Code** — The code of the jurisdiction the rule applies in. Entered to narrow the rule to a place. Matched to the transaction's place.
  - **Tax Type** (required, one of the Tax Rule Tax Type values) — The kind of tax the rule works out. Chosen when the rule is created; returns are grouped by it. Decides which return the amount goes to. A sales tax charged at the point of sale. Value added tax charged at each stage. Goods and services ta…
  - **Valid From** — The date and time the rule takes effect. Set when the rule is created. Compared with the transaction date.
  - **Valid To** — The date and time the rule stops applying. Set when the rule is superseded. Compared with the transaction date.
  - **Status** (required, one of the Tax Rule Status values) — Shows whether the tax rule is being drafted, applied to transactions, paused, or withdrawn. Moved by tax administrators; only active rules inside their validity dates are used to determine tax. The rule is being prepared and is not used fo…
  - **Invoice Line** (a Invoice Line) — The InvoiceLine this TaxRule belongs to.
  - **Credit Note Line** (a Credit Note Line) — The CreditNoteLine this TaxRule belongs to.
  - **Jurisdiction** (a Location) — The place the rule applies in. Chosen when the rule is place specific. At most one location. Limits the rule to transactions there.

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

The tax consequence of a taxable business transaction, kept apart from payment and ledger posting. A tax transaction records how much tax arose on a sale or purchase and under what treatment. Keeping it on its own lets tax be reported and checked without changing the payment or accounting records. Created automatically from taxable documents; read by tax returns and audit. A tax transaction may belong to an organisation and follows a taxable document. A tax transaction is drafted, becomes active when reportable and completed once reported. It may be cancelled before. Completed and cancelled a…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Tax Transaction Status values) — Where the tax transaction is in reporting. Shows whether the tax has been reported. Starts as DRAFT; moved by tax staff and returns. Only active transactions are included in a return. Calculated and not yet confirmed. Confirmed and due to…
  - **Tax Transaction Number** (required) — The reference number of this tax record, used to find it on returns and audits. Assigned automatically when the tax is calculated and never reused. Unique.
  - **Document Type** — The kind of source document the tax was computed on, such as a sales invoice or supplier bill. Set by tax determination and read with the document reference to trace the tax back to its source. Read with the document reference.
  - **Document Reference** — The number of the document and line taxed. Lets the tax amount be traced to its source. Such as "INV-2024-03-0912/1".
  - **Direction** (required, one of the Tax Transaction Direction values) — Whether the tax is charged to a customer or paid to a supplier. Decides the side of the return. Reverse-charge purchases give both an output and an input record. Tax charged on a sale. Tax paid on a purchase.
  - **Tax Date** (required) — The tax point — the date that decides which period the tax belongs to. Usually the invoice date or the supply date, as the law says. Decides the rate and the return period.
  - **Taxable Amount** (required) — The amount of the document line on which the tax was calculated, before the tax itself. Copied from the document line in the document's currency and multiplied by the rate to give the tax. In the document's currency.
  - **Rate Percent** — The percentage rate that was applied to the taxable amount. Copied from the rate valid on the tax date and kept even if the rate later changes, so the original calculation can be explained. Kept even if the rate changes later.
  - **Tax Amount** (required) — The tax computed on this line, after rounding. Rounded under the jurisdiction's rules and reported in the return box of its tax code. Rounded under the jurisdiction's rules.
  - **Reported Period** — The return period the transaction was reported in, such as 2024-03. Set when the return is filed. Present once reported.
  - **Organization** (a Organization) — The organisation the tax is reported by. Chosen from the source document. At most one organisation. Decides which company's return includes it.
  - **Invoice** (a Invoice) — The invoice the tax was computed on. Set by tax determination. At most one. Other taxable documents are named in the document reference.
  - **Tax Code** (a Tax Code) — The tax code that was applied to the document line this record taxes. Taken from the line when tax is determined. Each tax record carries exactly one code, so a line taxed under two codes gives two records. Its return box decides where the…
  - **Jurisdiction** (a Tax Jurisdiction) — The jurisdiction the tax is due to. From tax determination. One per record. Combined taxes give one record per jurisdiction.

### Tax Transaction Direction

The values of tax transaction direction, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Usage Record

A fixed record of measured usage, either a single event or an aggregate, used for usage-based entitlement and billing. A usage record is the evidence of how much a customer consumed, such as minutes or gigabytes. It feeds billing and entitlement checks and, because it is never rewritten, can be shown to the customer if a charge is queried. Created by metering systems; read by billing and customer support. A usage record may relate to a customer. A record is drafted and becomes active when confirmed, then completed once billed. It may be cancelled if recorded in error. Completed and cancelled…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Usage Record Status values) — Where the record is in billing. Shows whether usage has been confirmed and charged. Starts as DRAFT; moved by metering and billing. Only active records are charged. Received and not yet confirmed. Confirmed and waiting to be billed. Billed…
  - **Usage Number** (required) — The reference number of this usage record, used when billing questions arise. Assigned when the record is received and unique across all records. Unique.
  - **Source Reference** — The metering system's own identifier for the measurement. Used to refuse duplicates when a feed is resent. Unique per source.
  - **Source** — The metering system that reported the measurement, such as an API gateway. Recorded on receipt and combined with the source reference to refuse duplicates when a feed is resent. Such as "api-gateway-eu".
  - **Metric** (required) — What was measured, such as "API calls" or "Storage GB". Must match a usage unit of the subscription's plan. Unmatched metrics are rejected.
  - **Quantity** (required) — How much of the metric was consumed in the measured period. Expressed in the metric's own unit and rated against the subscription's plan to produce a charge. In the metric's unit.
  - **Period Start** (required) — The start of the period measured. Usage is billed in the billing period it falls in. Not later than the period end.
  - **Period End** (required) — The end of the period measured. Usage is billed in the billing period it falls in. Not earlier than the period start.
  - **Rejection Reason** — Why the record could not be rated. Read by billing operations to correct it. Present only on rejected records.
  - **Customer** (a Customer) — The customer whose usage it is. Chosen from the metered account. At most one customer; empty until matched. Decides whom to charge.
  - **Subscription** (a Subscription) — The subscription the usage belongs to. Matched from the metering identifier. One per record. Its plan decides the price.
  - **Charge** (a Charge) — The charge the usage was rated into. Set by rating. At most one. Present once rated.

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

A comparison between planned, forecast or actual financial measures for a period and dimension. A variance shows how far reality is from the plan and in which direction. It lets managers see where budget is overspent or revenue falls short, without altering the accounting entries it is derived from. Calculated by finance or the planning system; read by managers and budget owners. A variance belongs to an organisation and compares a budget or a forecast with actuals. A variance is calculated for a period and recalculated as actuals arrive. It never changes the entries it compares. Marketing sp…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The reference code of the variance, such as VAR-2026-03-MKT, naming the period and area compared. Assigned by finance or the planning system when the comparison is produced; used in reports, review packs and when quoting a variance to mana…
  - **Period Start** (required) — The first day of the period being compared. Set when the variance is calculated; actual and plan figures are taken from this date. Not later than the period end.
  - **Period End** (required) — The last day of the period being compared. Set when the variance is calculated; must not be before the start of the period. Defines the length of the comparison period.
  - **Basis** (required, one of the Variance Basis values) — Whether the actual figure is compared with a budget or with a forecast. Chosen when calculated; decides which of the linked budget or forecast supplies the plan figure. Read with the budget and forecast relationships. Actuals are compared…
  - **Planned Amount** (required) — The budgeted or forecast amount for the period. Copied from the budget or forecast when the variance is calculated, so later revisions do not change it. Compared with the actual amount to give the variance.
  - **Actual Amount** (required) — The amount actually incurred or earned in the period according to the ledger. Taken from posted accounting evidence when calculated; the variance never changes those entries. Compared with the planned amount.
  - **Variance Amount** (required) — The actual amount minus the planned amount; a positive figure is above plan. Calculated when the variance is produced; read by budget owners to see where spend or revenue departs from plan. The difference between the actual and planned amo…
  - **Measure** (required) — What is being compared, such as travel expenses or revenue. Set by the calculation, usually an account or account group, so the owner knows which line departs from plan. Usually an account or account group.
  - **Comparison Type** (required, one of the Variance Comparison Type values) — Which two figures are being set against each other. Chosen by the calculation and decides which figure acts as the plan. Posted actual results are compared with the approved budget. Posted actual results are compared with the current forec…
  - **Variance Percent** — The variance as a percentage of the planned figure. Used to decide whether it needs explaining. Empty when the planned figure is zero.
  - **Is Favourable** — Whether the difference is good for the business — more revenue or less cost. Computed from the measure's nature. Read with the amount.
  - **Explanation** — Why the figures differ, in the owner's words. Written by the owner; required above the threshold. Read by management.
  - **Status** (required, one of the Variance Status values) — How far the variance has progressed through explanation and review. Moved on by the owner and by controlling; only reviewed variances are reported as explained. Computed and waiting for the owner to explain it. The owner has written an exp…
  - **Organization** (required, a Organization) — The organisation the comparison is for. Chosen when created. Exactly one organisation. Decides whose budget is measured.
  - **Budget** (a Budget) — The budget used as the plan. Chosen when comparing with budget. At most one budget. Provides the planned figure. Supplies planned value source.
  - **Forecast** (a Forecast) — The forecast used as the expectation. Chosen when comparing with forecast. At most one forecast; empty if only a budget is used. Provides the expected figure. Supplies projected value source.
  - **Cost Center** (a Cost Center) — The cost centre compared, when the variance is by cost centre. Set by the calculation. At most one. Its manager explains the variance.
  - **Owner** (a Person) — The person who must explain the variance. Usually the cost-centre or budget owner. One per variance. Receives variances above the threshold.
  - **Currency** (a Currency) — The currency of the amounts. The organization's reporting currency. One per variance. All amounts use it.

### Variance Basis

The values of variance basis, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Variance Comparison Type

The values of variance comparison type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Variance Status

The values of variance status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

## Value lists

### Account Account Type

- **ASSET** — Something the organisation owns or is owed, such as cash or receivables; debits increase it and it appears on the balance sheet.
- **LIABILITY** — Something the organisation owes, such as payables or loans; credits increase it and it appears on the balance sheet.
- **EQUITY** — The owners' residual interest, such as share capital and retained earnings; credits increase it and it appears on the balance sheet.
- **REVENUE** — Income earned from the organisation's activities; credits increase it and it appears on the income statement.
- **EXPENSE** — Cost incurred in earning revenue; debits increase it and it appears on the income statement.
- **CONTRA** — An account that offsets another, such as accumulated depreciation against an asset or sales returns against revenue; it carries the opposite sign of the account it offsets.

### Account Status

- **ACTIVE** — Open for postings and shown in account pick-lists.
- **INACTIVE** — Paused: no new postings are accepted, but it can be reactivated and still appears in reports.
- **RETIRED** — Closed for good: no postings, kept only so historical periods stay reportable.

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

### Asset Acquisition Acquisition Type

- **PURCHASE** — Bought from a supplier.
- **CONSTRUCTION** — Built in-house or by contractors.
- **LEASE** — Taken on under a lease recognised on the balance sheet.
- **TRANSFER IN** — Received from another group company.
- **DONATION** — Received free of charge.

### Asset Acquisition Status

- **RECORDED** — Entered and waiting to be capitalised.
- **CAPITALIZED** — Posted to the accounts, so the asset is now depreciating.
- **CANCELLED** — Entered in error and withdrawn before capitalisation.
- **REVERSED** — Capitalised earlier and then reversed by a correcting entry.

### Asset Class Depreciation Method

- **STRAIGHT LINE** — An equal charge in every period of the useful life.
- **DECLINING BALANCE** — A fixed percentage of the remaining book value in each period, so the charge falls over time.
- **UNITS OF PRODUCTION** — A charge in proportion to use, such as hours run or units produced.
- **NONE** — Not depreciated, as for land.

### Asset Class Status

- **ACTIVE** — Available for new assets.
- **INACTIVE** — Kept for existing assets but not offered for new ones.

### Asset Depreciation Depreciation Method

- **STRAIGHT** — Allocates depreciable value systematically over the defined useful life, normally producing an approximately even periodic depreciation amount.
- **REM LIFE** — Calculates depreciation using the asset's remaining depreciable value and remaining useful life under the organization's remaining-life policy.
- **RED BAL** — Applies a declining-balance approach in which depreciation is calculated at a defined rate against an appropriate declining carrying base.
- **NBVSLUNIT** — Allocates depreciation based on usage units or output relative to the expected total units, appropriate where consumption rather than elapsed time drives asset value reduction.

### Asset Disposal Disposal Method

- **SALE** — Sold to an outside buyer for a price.
- **SCRAP** — Scrapped or recycled with no resale.
- **DONATION** — Given away free to another party or charity.
- **TRADE IN** — Handed in as part payment for a replacement.
- **LOSS OR THEFT** — Lost, stolen or destroyed and written off.
- **TRANSFER OUT** — Transferred to another company in the group.

### Asset Disposal Status

- **REQUESTED** — Asked for and waiting for an approver.
- **APPROVED** — Approved, so the asset may now be removed.
- **COMPLETED** — The asset has gone and the disposal is posted.
- **REJECTED** — Refused by the approver, so the asset stays.
- **CANCELLED** — Withdrawn by the requester before completion.

### Asset Status

- **PLANNED** — The asset is expected to enter service or be recognized operationally but is not yet active.
- **ACTIVE** — The asset is available for its intended business use subject to normal operational constraints.
- **UNDER MAINTENANCE** — The asset is temporarily undergoing maintenance and may be unavailable or restricted from normal use.
- **HELD** — The asset is intentionally retained but is not currently available for normal productive use, often pending inspection, disposition, or another decision.
- **DISPOSED** — The organization has completed the disposition process and no longer treats the asset as an active managed resource.
- **RETIRED** — The asset has been withdrawn from operational use, while historical records may remain available for audit and analysis.

### Asset Transfer Status

- **REQUESTED** — Asked for, but the asset has not moved yet.
- **IN TRANSIT** — The asset has left and has not yet arrived.
- **COMPLETED** — The receiver confirmed arrival and the register is updated.
- **CANCELLED** — Called off before the move was completed.

### Asset Transfer Transfer Type

- **LOCATION** — The asset moves to another place.
- **COST CENTER** — Another unit bears the asset's cost.
- **CUSTODIAN** — Another person becomes responsible for the asset.
- **INTERCOMPANY** — The asset moves to another group company.

### Attachment Status

- **ACTIVE** — Attached and part of the record's evidence.
- **WITHDRAWN** — Removed from the record's evidence, but kept for the history.

### Bank Account Account Type

- **CURRENT** — A transaction account for everyday receipts and payments.
- **SAVINGS** — An interest-bearing account held mainly to accumulate balances.
- **LOAN** — An account carrying borrowing from the bank.
- **ESCROW** — An account holding money on behalf of others until conditions are met.
- **OTHER** — Any other kind of account.

### Bank Account Status

- **PENDING** — Opened or requested but not yet confirmed by the bank; not available for payments.
- **ACTIVE** — Open and available for receipts and payments.
- **BLOCKED** — Temporarily frozen, for example for compliance reasons; no new payments should be routed to it.
- **CLOSED** — Permanently closed; history remains for reconciliation and audit.

### Billing Cycle Frequency

- **WEEKLY** — Each billing period lasts one week.
- **MONTHLY** — Each billing period lasts one calendar month.
- **QUARTERLY** — Each billing period lasts three calendar months.
- **SEMI ANNUAL** — Each billing period lasts six calendar months.
- **ANNUAL** — Each billing period lasts one year.

### Billing Cycle Status

- **DRAFT** — Being defined; not yet used by billing runs.
- **ACTIVE** — In force; billing runs use it to determine charge periods.
- **COMPLETED** — No longer used for new billing; past runs remain valid.
- **CANCELLED** — Withdrawn before it was used.

### Budget Budget Type

- **OPERATING** — Plans revenue and day-to-day running costs.
- **CAPITAL** — Plans investment in long-lived assets.
- **CASH** — Plans cash receipts and payments over time.
- **PROJECT** — Plans the cost of one specific project.

### Budget Status

- **DRAFT** — Being prepared by the budget owner; figures may change freely.
- **SUBMITTED** — Sent for approval; changes are held while it is reviewed.
- **APPROVED** — Accepted by the authorising body but not yet the live control.
- **ACTIVE** — The live budget against which spending is monitored.
- **SUPERSEDED** — Replaced by a later version; kept as the record of what was once approved. A final state.
- **CLOSED** — The period is over and the budget is closed for comparison with actuals. A final state.

### Business Unit Status

- **ACTIVE** — Operating and available for new assignments.
- **INACTIVE** — No longer operating after a closure or merger.

### Calendar Exception Exception Type

- **PUBLIC HOLIDAY** — A public holiday on which work does not happen.
- **COMPANY CLOSURE** — A day the company or site is closed.
- **EXTRA WORKING DAY** — A normally free day that is worked.

### Calendar Status

- **ACTIVE** — In use and available to planners.
- **INACTIVE** — Retired and no longer offered.

### Charge Charge Type

- **SUBSCRIPTION** — A recurring charge for a subscription period.
- **USAGE** — A charge for measured usage.
- **SERVICE** — A charge for a service delivered.
- **PRODUCT** — A charge for goods supplied.
- **FEE** — A fee such as a setup or late fee.
- **ADJUSTMENT** — A correction that increases the amount owed.

### Charge Status

- **DRAFT** — Generated but not yet checked; excluded from invoicing.
- **ACTIVE** — Confirmed and waiting to be invoiced.
- **COMPLETED** — Invoiced; the charge has done its job.
- **CANCELLED** — Withdrawn and will not be billed.

### Contact Point Channel

- **EMAIL** — An email address used for written messages.
- **PHONE** — A landline telephone number.
- **MOBILE** — A mobile telephone number.
- **FAX** — A fax number, kept for partners who still use it.
- **WEBSITE** — A web address of the party's site or page.
- **MESSAGING** — A handle on a messaging app.

### Contact Point Purpose

- **GENERAL** — Any purpose, when nothing more specific applies.
- **BILLING** — Invoices and statements sent to accounts payable.
- **ORDERS** — Order confirmations and purchase orders.
- **DELIVERY** — Delivery notices and arrival updates.
- **SUPPORT** — Service and support enquiries.
- **MARKETING** — Marketing communication, where consent allows.

### Contact Point Status

- **ACTIVE** — In use and offered for contact.
- **INACTIVE** — No longer used and kept for history.
- **INVALID** — Known not to work, such as a bouncing address.

### Cost Center Category

- **PRODUCTION** — Makes products or delivers services, so its costs flow into product cost.
- **SALES** — Sells and markets the company's offering; its costs are reported as selling expense.
- **ADMINISTRATION** — Runs general administration such as finance, HR and management; its costs stay out of product cost.
- **RESEARCH** — Researches and develops new products and methods; its costs are reported as research and development expense.
- **SERVICE** — Provides internal services to other cost centres, such as IT or maintenance, and is usually allocated onward.

### Cost Center Status

- **ACTIVE** — Open for postings and available when costs are assigned.
- **BLOCKED** — Temporarily closed for postings, for example during a reorganisation or review.
- **CLOSED** — No longer used for new postings; kept so past costs can still be reported.

### Credit Note Application Status

- **DRAFT** — Prepared but not yet in effect.
- **ACTIVE** — In effect; it reduces the invoice's outstanding amount.
- **REVERSED** — Undone by a compensating record; no longer reduces the invoice.
- **CANCELLED** — Withdrawn before it took effect.

### Credit Note Status

- **DRAFT** — Being prepared; has no financial effect.
- **APPROVED** — Authorised but not yet posted to the ledger.
- **POSTED** — Recorded in the books; it now reduces what the customer owes.
- **PARTIALLY APPLIED** — Part of its value has been set against invoices; some remains.
- **FULLY APPLIED** — All of its value has been set against invoices.
- **REFUND DUE** — The remaining value is to be paid back to the customer in cash.
- **REFUNDED** — The remaining value has been refunded.
- **CANCELLED** — Withdrawn before it was posted.
- **REVERSED** — Cancelled after posting by a compensating entry; the original stays on record.

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

### Department Status

- **ACTIVE** — The department exists and can receive people, positions and work.
- **INACTIVE** — The department has been closed or merged away; it stays on record for history.

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

### Fiscal Period Status

- **FUTURE** — Defined but not yet open; no postings are accepted.
- **OPEN** — Open and accepting postings from ordinary finance users.
- **SOFT CLOSED** — Normally closed but still open to postings by authorised finance staff, for adjustments.
- **CLOSED** — Closed; no further postings and figures are final for reporting. A final state.
- **LOCKED** — Frozen temporarily, for example during an audit or a month-end freeze; it can be reopened.

### Forecast Forecast Type

- **FINANCIAL** — Projects revenue, costs and profit over the horizon.
- **CASH** — Projects receipts, payments and cash balances over the horizon.
- **SALES** — Projects sales volumes and revenue by product or customer.
- **HEADCOUNT** — Projects the number of people and the personnel cost they bring.

### Forecast Status

- **DRAFT** — Still being worked on by its author; no one has been asked to review it and it is not yet the current outlook.
- **SUBMITTED** — Sent for review and waiting for the approver's decision.
- **APPROVED** — Accepted by the approver and in use as the current outlook.
- **SUPERSEDED** — Replaced by a later approved forecast and kept only for history.

### Foreign Exchange Transaction Deal Type

- **SPOT** — Settled within the normal spot period, usually two business days.
- **FORWARD** — Settled on an agreed later date at a rate fixed now.
- **SWAP** — One leg of a pair of opposite deals for different dates.

### Foreign Exchange Transaction Status

- **DEALT** — Agreed with the bank, but not yet matched with its confirmation.
- **CONFIRMED** — Matched with the bank's confirmation and awaiting the value date.
- **SETTLED** — Both currencies were exchanged on the value date.
- **CANCELLED** — Cancelled by agreement with the bank before settlement.

### Interest Day Count Basis

- **ACT 360** — Actual days elapsed divided by 360.
- **ACT 365** — Actual days elapsed divided by 365.
- **THIRTY 360** — Each month counted as 30 days, divided by 360.

### Interest Interest Type

- **LOAN** — Interest the company pays on borrowing.
- **DEPOSIT** — Interest the company earns on money placed with a bank.
- **LATE PAYMENT** — Interest charged to a customer who paid late.
- **CREDIT LINE** — Interest on a drawn credit facility.
- **INTERCOMPANY** — Interest between group companies.

### Interest Status

- **CALCULATED** — Worked out and waiting to be checked and posted.
- **POSTED** — Booked to the accounts.
- **CANCELLED** — Found wrong before posting and replaced by a new calculation.
- **REVERSED** — Posted, then undone by an opposite entry.

### Invoice Invoice Type

- **SALES** — An invoice the organisation issues to a customer for goods or services supplied.
- **PURCHASE** — An invoice the organisation receives from a supplier.
- **CREDIT NOTE** — A document that reduces what is owed under an earlier invoice.
- **DEBIT NOTE** — A document that increases what is owed under an earlier invoice.

### Invoice Line Matching Status

- **NOT APPLICABLE** — The line does not need matching, for example a sales invoice line.
- **UNMATCHED** — Not yet compared with the purchase order and goods receipt.
- **MATCHED** — Quantity and price agree with the order and receipt within tolerance.
- **PARTIALLY MATCHED** — Some of the line's quantity or amount agrees; the rest does not.
- **EXCEPTION** — A difference outside tolerance needs a decision.
- **WAIVED** — The difference was accepted by an authorised approver.

### Invoice Status

- **DRAFT** — Being prepared; not yet sent and not yet part of the receivables.
- **ISSUED** — Sent or recorded; the amount is now owed and due by its due date.
- **PARTIALLY PAID** — Part of the amount has been settled by payments or credits.
- **PAID** — Fully settled. A final state.
- **OVERDUE** — Past its due date with an amount still outstanding.
- **CANCELLED** — Withdrawn before it became effective. A final state.
- **VOID** — Cancelled after issue by a controlled process that keeps the original on record. A final state.

### Journal Entry Status

- **DRAFT** — Prepared but not yet recorded; no effect on balances.
- **POSTED** — Recorded in the ledger; it affects balances and can no longer be edited.
- **REVERSED** — Cancelled by a reversing entry; the original stays on record. A final state.

### Language Direction

- **LTR** — Written left to right.
- **RTL** — Written right to left.

### Ledger Ledger Type

- **LEADING** — The main ledger, under local statutory rules.
- **PARALLEL** — An additional ledger under another standard, such as the group's.
- **TAX** — A ledger kept for tax purposes.
- **MANAGEMENT** — A ledger for internal reporting only.

### Ledger Status

- **DRAFT** — Being set up and not yet accepting entries.
- **ACTIVE** — Open for posting journal entries.
- **COMPLETED** — Closed for good after the final period. A final state.
- **CANCELLED** — Set up but never used. A final state.

### Legal Entity Status

- **ACTIVE** — Registered, in good standing and free to trade, sign contracts and issue invoices.
- **DORMANT** — Still registered but not trading, so it holds no live business activity.
- **IN LIQUIDATION** — Being wound up by a liquidator; no new business should be started in its name.
- **DISSOLVED** — Struck off the register and gone for good; no new contracts or invoices may use it.

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

### Party Relationship Relationship Type

- **SUBSIDIARY OF** — The first party is a subsidiary owned by the second.
- **BRANCH OF** — The first party is a branch operating as part of the second.
- **EMPLOYEE OF** — The first party works for the second as an employee.
- **AGENT OF** — The first party acts as an agent on behalf of the second.
- **GUARANTOR FOR** — The first party guarantees the second party's obligations.
- **BENEFICIAL OWNER OF** — The first party ultimately owns or controls the second.
- **HOUSEHOLD MEMBER OF** — The first party lives in the same household as the second.
- **OTHER** — Any other kind of link, explained in the relationship name.

### Party Relationship Status

- **ACTIVE** — The relationship is in force today.
- **ENDED** — The relationship has stopped but is kept for history.

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

### Payment Allocation Status

- **DRAFT** — Prepared but not yet applied.
- **ACTIVE** — Applied; the invoice's outstanding amount is reduced.
- **REVERSED** — Undone by a compensating record. A final state.
- **CANCELLED** — Withdrawn before taking effect. A final state.

### Payment Direction

- **RECEIPT** — Money received from a payer.
- **DISBURSEMENT** — Money paid out to a payee.

### Payment Instruction Payment Method

- **CREDIT TRANSFER** — A standard bank transfer settled in the normal cycle.
- **URGENT TRANSFER** — A same-day, high-value transfer that carries a higher fee.
- **CROSS BORDER** — An international transfer to an account abroad, possibly with currency conversion.
- **CHEQUE** — A cheque printed and issued by the bank.
- **DIRECT DEBIT** — A debit collected from the payer's account under an existing mandate.

### Payment Instruction Status

- **DRAFT** — Being prepared; not yet released.
- **ACTIVE** — Released to the bank and awaiting execution.
- **COMPLETED** — Executed by the bank. A final state.
- **CANCELLED** — Withdrawn before execution. A final state.

### Payment Payment Method

- **CASH** — Money is handed over in notes and coins and recorded against a cash box or till.
- **BANK TRANSFER** — Funds move between bank accounts by credit transfer and are matched to a bank statement line.
- **CARD** — Payment is taken or made on a debit or credit card, normally through a processor that charges fees.
- **CHEQUE** — Payment is made by a paper cheque that is issued or banked and clears after a delay.
- **DIRECT DEBIT** — Funds are collected from the payer's bank account under a standing mandate the payer has authorised.
- **OTHER** — Payment uses a method not listed here, with the detail held in the external reference.

### Payment Status

- **DRAFT** — Being prepared; no financial effect.
- **APPROVED** — Authorised but not yet recorded in the books.
- **POSTED** — Recorded in the ledger but not yet confirmed by the bank.
- **CLEARED** — Confirmed by bank evidence. A final state.
- **VOID** — Cancelled and of no effect. A final state.
- **REVERSED** — Cancelled after posting by a compensating entry. A final state.

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

### Profit Center Status

- **ACTIVE** — Open and available when assigning revenue and costs.
- **CLOSED** — Retired and kept only so past reports stay readable.

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

### Scenario Scenario Type

- **BASE** — The expected case that most plans are built on.
- **UPSIDE** — A more favourable case than expected.
- **DOWNSIDE** — A less favourable case than expected.
- **STRESS** — A severe case used to test resilience.

### Scenario Status

- **DRAFT** — Being defined and not yet used in planning.
- **ACTIVE** — Available for budgets and forecasts.
- **ARCHIVED** — No longer used but kept for history. A final state.

### Subscription Plan Pricing Unit

- **FLAT** — One fee for the whole subscription.
- **PER USER** — The fee times the number of users.
- **PER UNIT** — The fee times another counted unit, such as devices or sites.

### Subscription Plan Status

- **DRAFT** — The plan is being defined and cannot yet be sold.
- **ACTIVE** — The plan is on offer and customers can subscribe to it.
- **COMPLETED** — The plan has run its course and is no longer offered, though existing subscriptions keep their terms. A final state.
- **CANCELLED** — The plan was withdrawn without ever being fully offered. A final state.

### Subscription Status

- **DRAFT** — The subscription is being set up and does not yet bill or grant access.
- **ACTIVE** — The subscription is running; charges are billed and entitlements are granted.
- **COMPLETED** — The subscription reached its end date or fulfilled its term. A final state.
- **CANCELLED** — The subscription was ended early by the customer or the business. A final state.

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

### Tax Code Category

- **STANDARD** — Taxed at the standard rate.
- **REDUCED** — Taxed at a reduced rate.
- **ZERO RATED** — Taxable at 0%; input tax remains recoverable.
- **EXEMPT** — Outside the tax's charge; input tax is usually not recoverable.
- **REVERSE CHARGE** — The buyer accounts for the tax instead of the seller.
- **OUT OF SCOPE** — Not within the tax at all.

### Tax Code Status

- **DRAFT** — Being defined; not yet usable.
- **ACTIVE** — In use on transactions.
- **COMPLETED** — No longer used on new transactions. A final state.
- **CANCELLED** — Withdrawn before use. A final state.

### Tax Code Tax Type

- **VAT** — Value-added tax charged at each stage of supply and reclaimed on purchases.
- **GST** — Goods and services tax, the value-added style tax used in countries such as Australia, India and Canada.
- **SALES TAX** — Tax charged to the buyer at the point of sale and remitted by the seller.
- **USE TAX** — Tax the buyer owes directly on purchases where no sales tax was charged by the supplier.
- **WITHHOLDING** — Tax deducted from a payment to a supplier or employee and paid over to the authority.
- **EXCISE** — Duty charged on specific goods such as fuel, alcohol or tobacco.

### Tax Jurisdiction Filing Frequency

- **MONTHLY** — A return is due every month.
- **QUARTERLY** — A return is due every quarter.
- **ANNUAL** — A single return is due once a year.

### Tax Jurisdiction Level

- **COUNTRY** — A national tax authority covering a whole country.
- **STATE** — A state, province or region that levies its own tax.
- **COUNTY** — A county or district authority below the state.
- **CITY** — A city or municipality that adds its own local tax.
- **SPECIAL DISTRICT** — A special taxing district, such as a transit or stadium district, with its own levy.

### Tax Jurisdiction Status

- **DRAFT** — Being defined; not yet used.
- **ACTIVE** — Taxes are calculated and reported under it.
- **COMPLETED** — No longer applies to new transactions. A final state.
- **CANCELLED** — Withdrawn before use. A final state.

### Tax Rate Rate Basis

- **PERCENTAGE** — The rate is a percentage of the taxable amount.
- **FIXED AMOUNT** — The rate is a fixed amount charged regardless of the taxable amount.

### Tax Rate Rate Type

- **PERCENT** — A percentage of the taxable amount.
- **PER UNIT** — A fixed amount per unit of quantity.

### Tax Rate Status

- **DRAFT** — Being defined; not yet applied.
- **ACTIVE** — In force and applied to transactions.
- **COMPLETED** — Replaced or expired. A final state.
- **CANCELLED** — Withdrawn before use. A final state.

### Tax Registration Filing Frequency

- **MONTHLY** — Returns under this registration are due every month.
- **QUARTERLY** — Returns under this registration are due every quarter.
- **ANNUAL** — Returns under this registration are due once a year.

### Tax Registration Status

- **DRAFT** — Applied for or being recorded; not yet valid.
- **ACTIVE** — Valid and in use.
- **COMPLETED** — Ended, for example after deregistration. A final state.
- **CANCELLED** — Withdrawn before use. A final state.

### Tax Registration Tax Type

- **VAT** — Registration for value-added tax.
- **GST** — Registration for goods and services tax.
- **SALES TAX** — Registration to collect and remit sales and use tax.
- **PAYROLL** — Registration for payroll or employment taxes withheld from staff.
- **CORPORATE INCOME** — Registration for tax on the company's profits.
- **EXCISE** — Registration to handle goods subject to excise duty.

### Tax Rule Status

- **DRAFT** — The rule is being prepared and is not used for tax determination.
- **ACTIVE** — The rule is in force and applied to qualifying transactions within its validity dates.
- **INACTIVE** — The rule is switched off for now but can be reactivated.
- **RETIRED** — The rule has been withdrawn permanently and is kept for history. A final state.

### Tax Rule Tax Type

- **SALES** — A sales tax charged at the point of sale.
- **VAT** — Value added tax charged at each stage.
- **GST** — Goods and services tax.
- **USE** — A tax on use of goods bought without sales tax.
- **WITHHOLDING** — Tax held back from a payment.
- **OTHER** — A tax of another kind.

### Tax Transaction Direction

- **OUTPUT** — Tax charged on a sale.
- **INPUT** — Tax paid on a purchase.

### Tax Transaction Status

- **DRAFT** — Calculated and not yet confirmed.
- **ACTIVE** — Confirmed and due to be reported.
- **COMPLETED** — Reported or settled. A final state.
- **CANCELLED** — Withdrawn, for example after a credit. A final state.

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

### Usage Record Status

- **DRAFT** — Received and not yet confirmed.
- **ACTIVE** — Confirmed and waiting to be billed.
- **COMPLETED** — Billed. A final state.
- **CANCELLED** — Discarded as recorded in error. A final state.

### Variance Basis

- **BUDGET** — Actuals are compared with the approved budget.
- **FORECAST** — Actuals are compared with the latest forecast.

### Variance Comparison Type

- **ACTUAL VS BUDGET** — Posted actual results are compared with the approved budget.
- **ACTUAL VS FORECAST** — Posted actual results are compared with the current forecast.
- **FORECAST VS BUDGET** — The latest forecast is compared with the approved budget to show expected overruns.
- **FORECAST VS PRIOR** — This forecast is compared with the previous forecast to show how expectations moved.

### Variance Status

- **CALCULATED** — Computed and waiting for the owner to explain it.
- **EXPLAINED** — The owner has written an explanation for the difference.
- **REVIEWED** — Controlling has examined and accepted the explanation.
- **ACCEPTED** — The difference is under the threshold, so no explanation is needed.

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

### Party Relationship — Party Relationship Lifecycle

Starts at **ACTIVE**.
Final: **ENDED**.

Moves:
- ACTIVE → ENDED (End)

### Legal Entity — Legal Entity Lifecycle

Starts at **ACTIVE**.
Final: **DISSOLVED**.

Moves:
- ACTIVE → DORMANT (Make Dormant)
- DORMANT → ACTIVE (Resume Trading)
- ACTIVE → IN LIQUIDATION (Liquidate)
- DORMANT → IN LIQUIDATION (Liquidate)
- IN LIQUIDATION → DISSOLVED (Dissolve)
- DORMANT → DISSOLVED (Dissolve)

### Business Unit — Business Unit Lifecycle

Starts at **ACTIVE**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)

### Department — Department Lifecycle

Starts at **ACTIVE**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)

### Address — Address Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Contact Point — Contact Point Lifecycle

Starts at **ACTIVE**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- ACTIVE → INVALID (Mark Invalid)
- INVALID → ACTIVE (Reactivate)

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

### Calendar — Calendar Lifecycle

Starts at **ACTIVE**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)

### Attachment — Attachment Lifecycle

Starts at **ACTIVE**.
Final: **WITHDRAWN**.

Moves:
- ACTIVE → WITHDRAWN (Withdraw)

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

### Forecast — Forecast Lifecycle

Starts at **DRAFT**.
Final: **SUPERSEDED**.

Moves:
- DRAFT → SUBMITTED (Submit)
- SUBMITTED → DRAFT (Return)
- SUBMITTED → APPROVED (Approve)
- APPROVED → SUPERSEDED (Supersede)

### Scenario — Scenario Lifecycle

Starts at **DRAFT**.
Final: **ARCHIVED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → ARCHIVED (Archive)

### Cost Center — Cost Center Lifecycle

Starts at **ACTIVE**.
Final: **CLOSED**.

Moves:
- ACTIVE → BLOCKED (Block)
- BLOCKED → ACTIVE (Unblock)
- ACTIVE → CLOSED (Close)
- BLOCKED → CLOSED (Close)

### Profit Center — Profit Center Lifecycle

Starts at **ACTIVE**.
Final: **CLOSED**.

Moves:
- ACTIVE → CLOSED (Close)

### Variance — Variance Lifecycle

Starts at **CALCULATED**.
Final: **REVIEWED**, **ACCEPTED**.

Moves:
- CALCULATED → EXPLAINED (Explain)
- EXPLAINED → REVIEWED (Review)
- EXPLAINED → CALCULATED (Return)
- CALCULATED → ACCEPTED (Accept)

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
Final: **CANCELLED**, **REVERSED**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → POSTED (Post)
- POSTED → PARTIALLY APPLIED (Apply)
- POSTED → FULLY APPLIED (Apply)
- PARTIALLY APPLIED → FULLY APPLIED (Apply)
- POSTED → REFUND DUE (Mark Refund Due)
- PARTIALLY APPLIED → REFUND DUE (Mark Refund Due)
- REFUND DUE → REFUNDED (Refund)
- REFUND DUE → PARTIALLY APPLIED (Apply)
- REFUND DUE → FULLY APPLIED (Apply)
- DRAFT → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- POSTED → REVERSED (Reverse)
- PARTIALLY APPLIED → REVERSED (Reverse)
- FULLY APPLIED → REVERSED (Reverse)
- REFUND DUE → REVERSED (Reverse)
- REFUNDED → REVERSED (Reverse)

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

### Asset Class — Asset Class Lifecycle

Starts at **ACTIVE**.

Moves:
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)

### Asset Acquisition — Asset Acquisition Lifecycle

Starts at **RECORDED**.
Final: **CANCELLED**, **REVERSED**.

Moves:
- RECORDED → CAPITALIZED (Capitalize)
- RECORDED → CANCELLED (Cancel)
- CAPITALIZED → REVERSED (Reverse)

### Asset Disposal — Asset Disposal Lifecycle

Starts at **REQUESTED**.
Final: **COMPLETED**, **REJECTED**, **CANCELLED**.

Moves:
- REQUESTED → APPROVED (Approve)
- REQUESTED → REJECTED (Reject)
- APPROVED → COMPLETED (Complete)
- REQUESTED → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)

### Asset Transfer — Asset Transfer Lifecycle

Starts at **REQUESTED**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- REQUESTED → IN TRANSIT (Ship)
- IN TRANSIT → COMPLETED (Receive)
- REQUESTED → COMPLETED (Complete)
- REQUESTED → CANCELLED (Cancel)
- IN TRANSIT → CANCELLED (Cancel)

### Foreign Exchange Transaction — Foreign Exchange Transaction Lifecycle

Starts at **DEALT**.
Final: **SETTLED**, **CANCELLED**.

Moves:
- DEALT → CONFIRMED (Confirm)
- CONFIRMED → SETTLED (Settle)
- DEALT → CANCELLED (Cancel)
- CONFIRMED → CANCELLED (Cancel)

### Interest — Interest Lifecycle

Starts at **CALCULATED**.
Final: **CANCELLED**, **REVERSED**.

Moves:
- CALCULATED → POSTED (Post)
- CALCULATED → CANCELLED (Cancel)
- POSTED → REVERSED (Reverse)

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

- **User** — reads 188 of 188 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
