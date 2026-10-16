---
name: legal-domain
description: What the records of Legal are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Legal, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Legal

Legal and Contract Management, built on the CEDM common foundation.

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

### Agreement

A governed agreement between parties that fixes rights, duties, commitments or terms, of which a commercial contract is a specialisation. An agreement is the record that two or more parties have committed to something. It is the parent concept behind contracts, service terms and similar understandings, so it holds what they share: who is bound, when, and what happened to the agreement over time. Created when terms are agreed or proposed; consulted when someone needs to know what was promised, whether it is in force, and what changed since. Contract specialises Agreement for commercial terms;…

Readable by every signed-in person.

Fields:
  - **Occurred At** — The date and time at which the agreement was concluded or took effect. Set when the agreement is recorded; used to place it in the sequence of events and to compute periods that run from it.
  - **Agreement Number** (required) — The reference number the business gives the agreement, such as AGR-2026-014. Assigned when the agreement is recorded; quoted in correspondence and used to find the agreement again. Read with the title to identify the agreement.
  - **Title** (required) — A short title saying what the agreement is about. Entered when recorded; shown in lists and on documents. Read with the agreement number.
  - **Agreement Type** (required, one of the Agreement Agreement Type values) — The kind of agreement, such as a service, supply or licence agreement. Chosen when recorded; decides which review and approval steps apply and how agreements are grouped in reports. Read with the parties to understand the commitment. An ag…
  - **Effective From** (required) — The date the agreement takes effect. Taken from the signed document; obligations are measured from it. Not later than the end date.
  - **Effective To** — The date the agreement ends; empty for an open-ended agreement. Taken from the signed document or set when it is terminated; must not be before the start date. Compared with today to show whether the agreement is in force.
  - **Status** (required, one of the Agreement Status values) — Still being written and not yet sent to the other party. Shared with the other party and under discussion. Signed by every party but not yet effective. Effective and legally binding on the parties. Reached the end of its term without being…
  - **Effective Date** — The day the agreement takes effect. Taken from the signed agreement; the agreement governs nothing before it. Must not be later than the expiry date.
  - **Expiry Date** — The last day of the current term. Watched by the owner; renewal or termination must be decided before it. Empty for an agreement with no fixed end.
  - **Signed Date** — The day the last party signed. Recorded on signature; it is evidence of when the parties became bound. Not later than the effective date in the usual case.
  - **Auto Renew** (required) — Whether the agreement renews by itself at the end of its term. Set from the agreement's renewal clause; an automatically renewing agreement continues unless notice is given. Read with the renewal term and the notice period.
  - **Renewal Term Months** — How long each automatic renewal lasts, in months. Used to work out the next expiry date when the agreement renews. Meaningful only when the agreement renews automatically.
  - **Notice Period Days** — How many days' notice a party must give to end or stop renewing the agreement. Used to work out the last day on which notice can be given before the expiry date. Missing the notice date commits the business to another term.
  - **Governing Law** — The law that governs the agreement. Taken from the agreement, such as "England and Wales" or "State of New York"; read when a dispute arises. Set together with the jurisdiction for disputes, which the agreement document states.
  - **Description** — What the agreement covers and anything unusual about it. A summary for colleagues who need to know what the agreement allows without reading the document. The signed document remains the authoritative text.
  - **First Party** (required, a Party) — The party on one side of the agreement, normally our own company. Chosen at registration. Every agreement has exactly one first party. When our company signs through a legal entity, that entity's party is the first party.
  - **Owner** (a Person) — The colleague responsible for the agreement. Receives expiry and renewal reminders and answers questions about it. One owner per agreement. Should be reassigned when the owner leaves.

### Agreement Agreement Type

The values of agreement agreement type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Agreement Status

The values of agreement status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Contract

A binding agreement between parties that fixes their rights, obligations, terms and conditions. A contract is the formal basis of a commercial relationship. It says who has agreed to what, for how long and on what terms, so obligations can be performed, tracked and enforced. Drafted and negotiated by commercial and legal teams; approved and signed; consulted throughout its life to check obligations, renewal and termination. A contract has at least two Parties, may be owned by an Organization, is evidenced by a Document and breaks down into ContractObligations and ServiceContracts. A contract…

Readable by every signed-in person.

Fields:
  - **Contract Number** (required) — The number by which the contract is known in correspondence and systems. Allocated from a number series; unique across contracts.
  - **Title** (required) — The descriptive title of the contract. Shown in lists and documents, for example Master Supply Agreement 2026.
  - **Contract Type** (required) — The kind of contract, such as supply, service, licence or employment. Chosen at creation; drives templates, approvals and the obligations typically attached.
  - **Status** (required, one of the Contract Status values) — Where the contract stands from drafting to end. Moved by the contract owner; obligations are enforced while the contract is ACTIVE. Being written; not yet shared with the other party. Terms are being discussed with the other party. Agreed…
  - **Effective From** — The date from which the contract is in force. Entered from the signed document; obligations and charges run from it.
  - **Effective To** — The date on which the contract ends. Entered from the signed document; must not be before the start date.
  - **Signed At** — When the contract was signed by the last party. Recorded at signature; marks the point at which the contract became binding.
  - **Auto Renew** (required) — Whether the contract renews by itself at the end of its term. Set from the contract terms; renewal processes act on contracts with this on, unless notice is given.
  - **Owner Organization** (a Organization) — The part of the organisation that owns the relationship. Set at creation; receives renewal reminders and answers for performance. At most one owner. Gives the contract an internal owner.

Line items — **Contract Clause**: kept inside each Contract and reached by opening it, never on their own. A clause that forms part of a contract, holding its effective wording or a reference to a structured term. A contract is made of clauses, and disputes turn on the exact words. Holding each clause as a record lets the organisation find, compare and reuse wording and show which clause applied when. A…

Line items — **Contract Obligation**: kept inside each Contract and reached by opening it, never on their own. A specific obligation, commitment, deliverable or condition that arises from a contract and that one party must fulfil. A contract matters through what it makes people do. Tracking obligations individually shows what is due, who is responsible, and whether it was delivered, so breaches are noticed…

Line items — **Contract Line**: kept inside each Contract and reached by opening it, never on their own. A line within a contract that fixes a specific product or service, its price, quantity, term or scope of obligation. Commercial contracts are priced and scoped line by line. Lines state exactly what is being bought or provided, and orders and invoices are checked against them. Added when a contract…

### Contract Amendment

A change instrument that modifies defined terms of a contract from a given date, while the originally signed contract stays on record. Contracts change after they are signed: a price is revised, a scope extended. An amendment records exactly what changed and from when, so everyone can reconstruct which terms applied at any date without altering the signed original. Raised when both parties agree to change a signed contract; read when someone needs the current or historical terms. Each amendment belongs to one Contract; the effective terms are the contract as signed plus its amendments in orde…

Readable by every signed-in person.

Fields:
  - **Effective At** — The date and time from which the amended terms apply. Entered from the signed amendment; terms before this moment remain those of the earlier text.
  - **Amendment Number** (required) — The number of the amendment within its contract — 1 for the first, 2 for the second and so on. Assigned in order when the amendment is drafted. Unique within the contract.
  - **Title** (required) — What the amendment changes, in one line. Shown in the contract's list of amendments. Identifies the amendment for people.
  - **Amendment Type** (required, one of the Contract Amendment Amendment Type values) — What kind of change the amendment makes. Chosen when drafting; reports of price changes and extensions use it. An amendment making several kinds of change takes its main one. Changes prices or payment terms. Adds or removes products, servi…
  - **Description** (required) — The changes, clause by clause. Written when drafting; read by everyone who applies the contract. The signed amendment document is authoritative.
  - **Effective Date** (required) — The day the changed terms start to apply. Terms before this day remain as they were. May be after the signature date, never before it unless the parties agree a retroactive change.
  - **Signed Date** — The day the last party signed the amendment, completing its execution. Recorded when the signed copy comes back, before the effective date arrives. Present once signed.
  - **Status** (required, one of the Contract Amendment Status values) — Where the amendment stands between drafting and taking effect. Moved on by internal approval, the other party's reply and signature. Only signed amendments change the contract. Being written and not yet approved or shared. Approved interna…
  - **Contract** (required, a Contract) — The contract that is being amended. Set when the amendment is created. Exactly one contract; an amendment always modifies a single contract. Keeps the change attached to the agreement it changes.

### Contract Amendment Amendment Type

The values of contract amendment amendment type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Amendment Status

The values of contract amendment status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Clause Category

The values of contract clause category, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Obligation Obligation Type

The values of contract obligation obligation type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Obligation Status

The values of contract obligation status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Renewal

An event that extends a contract, or replaces it, for a new term under agreed renewal conditions. Many contracts run in terms. A renewal record shows that the relationship continued, on what terms and from when, so there is no doubt whether a contract was in force on a given day. Created when a contract is renewed, automatically or by agreement; read when checking coverage or planning the next renewal. Each renewal belongs to one Contract; a chain of renewals gives its full term history. Executed renewals are evidence. A correction is recorded as a further record. Automatic one-year renewal o…

Readable by every signed-in person.

Fields:
  - **Effective At** — The date and time from which the new term starts. Set from the renewal terms, normally the day after the previous term ended.
  - **Renewal Number** (required) — The unique reference by which the renewal review is known to contract managers. Assigned when the renewal review is opened ahead of the notice deadline. Unique across all renewals.
  - **Renewal Type** (required, one of the Contract Renewal Renewal Type values) — How the contract continues into a new term, by itself, by negotiation or by option. Taken from the contract's renewal clause when the review is opened. An automatic renewal happens unless notice is given by the deadline. Renews by itself u…
  - **Current Term End** (required) — The last day of the current term. Copied from the contract when the review opens. The new term starts the day after.
  - **Notice Deadline** — The last day notice can be given to stop the renewal. Watched by the contract manager; missing it means an automatic renewal goes ahead. Before the current term end.
  - **New Term Start** — The first day of the contract's new term once the renewal is confirmed. Set by the contract manager when the renewal is confirmed. The day after the current term ends, normally.
  - **New Term End** — The last day of the contract's new term once the renewal is confirmed. Set by the contract manager when the renewal is confirmed. Not earlier than the new term start.
  - **Changed Terms** — What changes with the renewal, such as new prices. Written when the renewal is negotiated. Formal changes are recorded as an amendment.
  - **Decided Date** — The day the renewal was confirmed or declined. Recorded with the decision so the notice deadline can be checked afterwards. Present once decided.
  - **Status** (required, one of the Contract Renewal Status values) — Whether the renewal has been decided or is still being considered. Moved on by the contract manager as the decision is taken. Undecided renewals near their notice deadline are escalated. Being considered, with no decision yet. The contract…
  - **Contract** (required, a Contract) — Exactly one contract: a renewal extends a single agreement, and one contract may be renewed many times. The contract that is renewed. Set when the renewal is created. Extends the contract's period of effect.
  - **Amendment** (a Contract Amendment) — The amendment recording the renewed terms. Linked when terms change on renewal. At most one. A renewal without changes needs no amendment.

### Contract Renewal Renewal Type

The values of contract renewal renewal type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Renewal Status

The values of contract renewal status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Status

The values of contract status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Termination

An event that ends a contract, or selected obligations under it, according to its termination terms. Ending a contract has consequences: obligations stop, notices are given, final settlements are made. Recording the termination states when and how it ended, which is what disputes and wind-down tasks rely on. Created when notice is given or the contract ends by agreement; read by contract managers, finance and legal. Each termination belongs to one Contract. Executed terminations are evidence; they are not edited. A wrongly recorded termination is corrected by an explicit follow-up record. The…

Readable by every signed-in person.

Fields:
  - **Effective At** — The date and time from which the contract, or the named obligations, ceases to apply. Taken from the notice or agreement; later charges and obligations stop at this moment.
  - **Termination Number** (required) — The unique reference by which the termination is known to legal and contract staff. Assigned when the notice is recorded against the contract. Unique across all terminations.
  - **Initiated By** (required, one of the Contract Termination Initiated By values) — Which side of the contract gave notice and brought it to an end. Recorded with the notice, so exit obligations fall on the right party. Read together with the ground. We gave notice and ended it. The other party ended it. Both parties agre…
  - **Ground** (required, one of the Contract Termination Ground values) — The reason in law or in the contract for which it was ended. Chosen when the notice is recorded; it decides whether penalties or damages may apply. Termination for breach usually needs evidence of the breach. Ended under a right to termina…
  - **Notice Date** (required) — The day the termination notice was given or received. The notice period runs from this day, so it sets the earliest effective date. Not later than the effective date.
  - **Effective Date** (required) — The day the contract ends. No obligations arise after it except those that survive. Notice date plus the contractual notice period, unless agreed otherwise.
  - **Reason** — The circumstances behind the termination, written out in plain words. Entered by the person recording it and read later in any dispute. Free text.
  - **Exit Obligations** — What remains to be done to close the contract out. Listed when recording the termination; ticked off before completion. Such as final invoicing, returning property, deleting data.
  - **Termination Fee** — Any fee or penalty payable because of the termination. Recorded when the contract provides for one. Paid or invoiced separately.
  - **Status** (required, one of the Contract Termination Status values) — Notice given or received; the contract still runs. The contract has ended; exit work under way. Exit work done, and the contract is closed. Notice withdrawn by agreement; the contract continues. Where the termination stands. Moved on as th…
  - **Contract** (required, a Contract) — Exactly one contract: a termination ends a single agreement, and an agreement can be ended only once. The contract being ended. Set when the termination is recorded. Closes the contract's period of effect.

### Contract Termination Ground

The values of contract termination ground, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Termination Initiated By

The values of contract termination initiated by, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Contract Termination Status

The values of contract termination status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Description** — What the department is responsible for and what kind of work it does. Read by people placing staff, positions or work, so they choose the right department. Free text written by the organisation's administrators.
  - **Status** (required, one of the Department Status values) — Whether the department currently exists as part of the organisation. Set to inactive after a reorganisation closes or merges the department. Inactive departments are not offered when assigning people or work. The department exists and can…
  - **Organization** (required, a Organization) — Chosen when the department is created; reporting lines, headcount and budgets roll up through the organisation it belongs to. The organisation the department belongs to. Exactly one organisation: a department is part of a single organisati…
  - **Business Unit** (a Business Unit) — The business unit the department is part of. Set where the organization is divided into business units. At most one. Used in business-unit reporting.
  - **Parent Department** (a Department) — The department this one reports to. Builds the hierarchy used for approvals. At most one. Cannot be itself.
  - **Manager** (a Person) — The person who leads the department. Approves its requests and receives its reports. One per department. Approval routing goes to this person.
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

### Legal Case

A litigation, arbitration, administrative or other adjudicative case that forms part of a legal matter. A legal matter can run through several proceedings. Each case within it has its own forum, parties and timetable, and recording them separately keeps track of what is pending where. Opened when proceedings begin; updated as the case progresses; read by legal counsel. Every case belongs to one LegalMatter. Finalised evidence and effective history are preserved; settlement or supersession is recorded explicitly. The appeal in a contract dispute, filed at the regional court as a case within th…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the case was opened or the event it records took place. Set when recorded; used to order the history of the matter.
  - **Case Number** (required) — The court's or tribunal's reference for the case. Quoted on every filing and letter to the court. Unique within its forum.
  - **Title** (required) — The name of the case, such as "ACME France v. Northwind Labs". Shown in case lists. Identifies the case for people.
  - **Forum Type** (required, one of the Legal Case Forum Type values) — Says what kind of body hears the case, such as a court, tribunal or arbitration. Chosen when the case is opened; it decides the procedure and deadlines that apply. Read together with the forum that hears it. A state court of law hearing th…
  - **Our Role** (required, one of the Legal Case Our Role values) — Says which side of the dispute the business is on in this case. Recorded when the case is opened. Decides whether an adverse outcome means a payment or a lost recovery. We started the proceedings. Proceedings were brought against us. We ar…
  - **Stage** — The procedural stage reached, such as "Pleadings", "Expert phase" or "Awaiting judgment". Updated as the case moves on. Free wording; procedures differ by forum.
  - **Filed Date** — The day the proceedings were formally filed with the forum. Recorded when the case starts; limitation periods and deadlines run from it, and it cannot be later than the judgment date. Not later than the judgment date.
  - **Next Hearing Date** — The date of the next hearing. Updated after each hearing; feeds the hearing calendar. Empty when none is scheduled.
  - **Judgment Date** — The day judgment was given or the settlement was signed. Recorded by the responsible lawyer together with the outcome; empty until the case is decided or settled. Present once decided or settled.
  - **Amount Claimed** — The monetary amount claimed in the proceedings. Taken from the claim document and used for exposure reporting; expressed in the matter's currency. In the matter's currency.
  - **Outcome** — A description of how the case ended, such as the judgment or settlement terms. Written by the responsible lawyer with the judgment or settlement, and required before the case is closed. Required to close.
  - **Status** (required, one of the Legal Case Status values) — Shows where the case stands in its life, from filing through judgment to closure. Moved on by the responsible lawyer. Decided and settled cases must have an outcome. Started, with first steps under way. Pleadings and hearings are in progre…
  - **Legal Matter** (required, a Legal Matter) — The legal matter this case belongs to. Set when the case is opened. Exactly one matter: a case is a proceeding within a single matter. Collects the case's costs and outcomes with the rest of the matter. Groups case within broader legal wor…
  - **Forum** (a Organization) — The court, tribunal or authority hearing the case. Chosen when opening it. One per case. Its rules set the deadlines.
  - **Counterparty** (a Party) — The other side. Chosen when opening it. The main opponent; others are listed in the title. Usually the matter's counterparty.

### Legal Case Forum Type

The values of legal case forum type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Legal Case Our Role

The values of legal case our role, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Legal Case Status

The values of legal case status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Legal Matter

A unit of legal work that groups parties, counsel, documents, obligations, filings, issues, costs and outcomes. Legal work rarely consists of a single event. A matter is the file that holds everything about one legal issue, so counsel, cost and outcome can be tracked together. Opened when a legal issue arises; filled as filings, documents and cases are added; closed when resolved; read by legal counsel and management. A matter contains LegalCases and refers to the documents, filings and obligations that belong to it. Finalised evidence and effective history are preserved; settlements and corr…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the matter was opened or the event that gave rise to it. Set at opening; used to order matters and compute limitation periods.
  - **Matter Number** (required) — The reference of the matter. Assigned when it is opened; outside counsel bill against it. Unique.
  - **Title** (required) — A short headline telling lawyers and the business what the dispute, advice request or transaction concerns. Typed by the legal team at intake and shown in matter lists, searches and cost reports. Read together with the matter number to pic…
  - **Matter Type** (required, one of the Legal Matter Matter Type values) — What kind of legal work it is. Chosen at intake; workload and spend are reported by type. Litigation matters may have court cases. Advice on a question of law or a business proposal. Drafting, reviewing or negotiating an agreement. A dispu…
  - **Description** — The background of the matter, the facts so far and what the business hopes to achieve through legal help. Written at intake by the requesting lawyer and extended as the matter develops; it may contain privileged advice. Access is limited t…
  - **Opened Date** (required) — The day the legal team formally accepted the matter and began work on it. Set at intake, normally when the request is approved; it starts the clock for ageing and cost reporting. It cannot be later than the closing date.
  - **Closed Date** — The day the legal work was finished and the matter was closed in the register. Recorded by the responsible lawyer together with the final outcome and last counsel invoice. Empty while the matter is open or on hold.
  - **Budget** — The expected cost of outside counsel and expenses. Agreed at opening; spend is compared with it. In the matter's currency.
  - **Spend To Date** — The total legal fees and expenses charged against the matter so far. Updated as outside counsel invoices are approved; the legal team compares it with the budget each month. Going over the budget needs approval from the matter owner.
  - **Outcome Likelihood** (one of the Legal Matter Outcome Likelihood values) — How likely an adverse outcome is, in the legal team's judgement. Reviewed each quarter for disputes; finance provisions for probable losses. Read with the estimated exposure. An adverse outcome is very unlikely. An adverse outcome is possi…
  - **Estimated Exposure** — How much the business could have to pay if the outcome is adverse. Estimated by the legal team for disputes. Used for provisions and disclosures.
  - **Outcome** — How the matter ended. Written when it closes, such as "settled for 45,000 EUR" or "contract signed". Required to close a dispute.
  - **Status** (required, one of the Legal Matter Status values) — Shows whether the matter is still being worked on, paused, or finished. Changed by the responsible lawyer as work starts, stalls or ends; closed matters need an outcome recorded. Closing a matter locks in its dates and final spend. Work is…
  - **Legal Entity** (a Legal Entity) — The group company the matter is for. Chosen at intake. One per matter. Provisions are booked in this entity.
  - **Counterparty** (a Party) — The other side, if there is one. Chosen for disputes and negotiations. The main counterparty; others are named in the description. Conflict checks look at it.
  - **Responsible Lawyer** (a Person) — The in-house lawyer handling the matter. Assigned at intake. One per matter. Approves counsel invoices.
  - **Outside Counsel** (a Organization) — The law firm instructed on the matter. Chosen when outside help is needed. The lead firm; others are noted in the description. Its invoices are checked against the budget.
  - **Currency** (a Currency) — The currency of the budget, spend and exposure. Set at opening. One per matter. All money on the matter uses it.

### Legal Matter Matter Type

The values of legal matter matter type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Legal Matter Outcome Likelihood

The values of legal matter outcome likelihood, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Legal Matter Status

The values of legal matter status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **Contract** (a Contract) — The Contract this Party belongs to.
  - **Agreement** (a Agreement) — The Agreement this Party belongs to.

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

### Renewal

A subscription or service continuation that extends a customer's entitlement into the next term. A renewal is the decision point at the end of a term. Recording it lets the business offer, confirm and track continuation, and decide whether the customer keeps the service, without altering the billing or entitlement records that carry out the result. Created by account management ahead of the term end; read by sales, finance and support. A renewal concerns one customer and the subscription or service being continued. A renewal is drafted, becomes active while it is being worked, and completes w…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Renewal Status values) — The stage the renewal has reached on the way to a new term. Starts as DRAFT and is moved by account management as the customer is approached and a decision is reached; filters renewal pipeline reports. Being prepared by account management;…
  - **Renewal Number** (required) — The reference by which sales and customers identify this particular renewal. Assigned when the renewal is created and quoted on renewal offers and reminders to the customer. Unique across all renewals.
  - **Current Term End** (required) — The last day of the subscription's current term. Copied from the subscription; the renewal must be decided before it. The new term starts the day after.
  - **New Term Start** — The first day of the period the customer will be entitled to once the renewal takes effect. Entered when the renewal is confirmed and passed on to billing and entitlement. Usually the day after the current term ends.
  - **New Term End** — The last day of the period covered by the renewal. Entered when the renewal is confirmed; the next renewal decision falls due before this date. Not earlier than the new term start.
  - **Current Value** — The recurring value of the subscription in its current term. Copied from the subscription; the basis for retention figures. Annualised for comparison.
  - **Renewal Value** — The recurring value offered or agreed for the new term. Entered with the quote; compared with the current value for expansion or contraction. In the subscription's currency.
  - **Is Automatic** (required) — Tells whether the renewal happens by itself or needs the customer's explicit agreement. Copied from the subscription terms when the renewal is created, so staff know whether to chase a confirmation. Automatic renewals still appear here so…
  - **Churn Reason** — Why the customer did not renew. Recorded when the renewal is lost; churn analysis groups by it. Present only on churned renewals.

### Renewal Status

The values of renewal status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Agreement Agreement Type

- **SERVICE** — An agreement to provide or receive services.
- **SUPPLY** — An agreement to supply or buy goods.
- **LICENSE** — An agreement granting rights to use something.
- **PARTNERSHIP** — An agreement to work together towards a shared aim.
- **NON DISCLOSURE** — An agreement to keep information confidential.
- **OTHER** — An agreement that fits no other type.

### Agreement Status

- **DRAFT** — Still being written and not yet sent to the other party.
- **IN NEGOTIATION** — Shared with the other party and under discussion.
- **SIGNED** — Signed by every party but not yet effective.
- **IN FORCE** — Effective and legally binding on the parties.
- **EXPIRED** — Reached the end of its term without being renewed.
- **TERMINATED** — Ended early by one or both parties.
- **CANCELLED** — Abandoned before anyone signed it.

### Attachment Status

- **ACTIVE** — Attached and part of the record's evidence.
- **WITHDRAWN** — Removed from the record's evidence, but kept for the history.

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

### Contract Amendment Amendment Type

- **PRICE** — Changes prices or payment terms.
- **SCOPE** — Adds or removes products, services or sites.
- **TERM** — Changes the duration or end date.
- **PARTIES** — Changes a party, such as an assignment to a successor company.
- **TERMS** — Changes other terms and conditions.

### Contract Amendment Status

- **DRAFT** — Being written and not yet approved or shared.
- **APPROVED** — Approved internally, sent to the other party.
- **SIGNED** — Signed by both parties.
- **EFFECTIVE** — Its effective date has come; the contract now reflects it.
- **REJECTED** — Refused by the other party.
- **CANCELLED** — Dropped before signature, so the contract is unchanged.

### Contract Clause Category

- **LIABILITY** — Limits or exclusions of liability.
- **INDEMNITY** — Indemnities between the parties.
- **TERMINATION** — Rights and notice to end the contract.
- **CONFIDENTIALITY** — Protection of confidential information.
- **DATA PROTECTION** — Processing of personal data.
- **PAYMENT** — Payment terms, invoicing and late payment.
- **WARRANTY** — Warranties about goods or services.
- **GOVERNING LAW** — The governing law and jurisdiction.
- **INTELLECTUAL PROPERTY** — Ownership and licensing of rights.
- **OTHER** — Any term that fits none of the other categories.

### Contract Obligation Obligation Type

- **DELIVERY** — Goods or deliverables must be delivered.
- **PAYMENT** — Money must be paid.
- **SERVICE** — A service must be performed.
- **REPORTING** — Information or reports must be supplied.
- **COMPLIANCE** — A legal, regulatory or standards requirement must be met.
- **PERFORMANCE** — A level of performance, such as a service level, must be achieved.
- **OTHER** — Any other commitment that does not fit the listed kinds.

### Contract Obligation Status

- **OPEN** — Due but not yet started.
- **IN PROGRESS** — Being worked on by the responsible party, with fulfilment not yet shown.
- **FULFILLED** — Met; evidence is on record. A final state.
- **BREACHED** — Not met in time or at the required standard. A final state that may lead to remedies.
- **WAIVED** — Released by the other party; no longer required. A final state.
- **CANCELLED** — No longer applicable, for example because the contract changed. A final state.

### Contract Renewal Renewal Type

- **AUTOMATIC** — Renews by itself unless a party gives notice.
- **NEGOTIATED** — Renews only if the parties agree new terms.
- **OPTION** — Renews if one party exercises its option to extend.

### Contract Renewal Status

- **UNDER REVIEW** — Being considered, with no decision yet.
- **CONFIRMED** — The contract continues for the new term.
- **DECLINED** — The contract ends at the current term end.

### Contract Status

- **DRAFT** — Being written; not yet shared with the other party.
- **NEGOTIATION** — Terms are being discussed with the other party.
- **APPROVAL** — Agreed in principle and awaiting internal approval and signature.
- **ACTIVE** — Signed and in force.
- **SUSPENDED** — Temporarily not in effect, for example during a dispute.
- **EXPIRED** — Reached its end date without renewal.
- **TERMINATED** — Ended early by notice or breach.
- **CANCELLED** — Withdrawn before it ever became active.

### Contract Termination Ground

- **CONVENIENCE** — Ended under a right to terminate without cause.
- **BREACH** — Ended because the other party breached it.
- **INSOLVENCY** — Ended because a party became insolvent.
- **EXPIRY** — Ended at the end of its term without renewal.
- **MUTUAL AGREEMENT** — Ended by agreement between both parties.
- **FORCE MAJEURE** — Ended because performance became impossible.

### Contract Termination Initiated By

- **US** — We gave notice and ended it.
- **COUNTERPARTY** — The other party ended it.
- **MUTUAL** — Both parties agreed to end it.

### Contract Termination Status

- **NOTIFIED** — Notice given or received; the contract still runs.
- **EFFECTIVE** — The contract has ended; exit work under way.
- **COMPLETED** — Exit work done, and the contract is closed.
- **WITHDRAWN** — Notice withdrawn by agreement; the contract continues.

### Currency Status

- **ACTIVE** — Available for use on new prices, documents and payments.
- **INACTIVE** — Temporarily not offered, for example while a market is closed; it can be reactivated.
- **RETIRED** — No longer in use, such as a replaced national currency; historical amounts keep it.

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

### Language Direction

- **LTR** — Written left to right.
- **RTL** — Written right to left.

### Legal Case Forum Type

- **COURT** — A state court of law hearing the dispute.
- **TRIBUNAL** — A specialised tribunal, such as an employment tribunal.
- **ARBITRATION** — A private arbitral tribunal chosen under an arbitration agreement.
- **REGULATORY AUTHORITY** — A regulator deciding on a matter.

### Legal Case Our Role

- **CLAIMANT** — We started the proceedings.
- **DEFENDANT** — Proceedings were brought against us.
- **THIRD PARTY** — We are joined as a third party.
- **INTERVENER** — We intervene in someone else's case.

### Legal Case Status

- **FILED** — Started, with first steps under way.
- **PENDING** — Pleadings and hearings are in progress.
- **DECIDED** — Judgment has been given.
- **SETTLED** — Ended by a settlement between the parties.
- **APPEALED** — Judgment appealed to a higher court; the appeal is recorded as its own case.
- **CLOSED** — Finished, because the judgment became final or the appeal was decided.
- **WITHDRAWN** — Withdrawn or dismissed without judgment on the merits.

### Legal Entity Status

- **ACTIVE** — Registered, in good standing and free to trade, sign contracts and issue invoices.
- **DORMANT** — Still registered but not trading, so it holds no live business activity.
- **IN LIQUIDATION** — Being wound up by a liquidator; no new business should be started in its name.
- **DISSOLVED** — Struck off the register and gone for good; no new contracts or invoices may use it.

### Legal Matter Matter Type

- **ADVISORY** — Advice on a question of law or a business proposal.
- **CONTRACT** — Drafting, reviewing or negotiating an agreement.
- **LITIGATION** — A dispute before a court or tribunal.
- **ARBITRATION** — A dispute before an arbitrator.
- **REGULATORY** — Dealings with a regulator, including investigations.
- **CORPORATE** — Company law work such as mergers, acquisitions and restructurings.
- **EMPLOYMENT** — Employment disputes and advice.
- **INTELLECTUAL PROPERTY** — Patents, trademarks, copyright and their enforcement.

### Legal Matter Outcome Likelihood

- **REMOTE** — An adverse outcome is very unlikely.
- **POSSIBLE** — An adverse outcome is possible but not likely; disclosed rather than provided for.
- **PROBABLE** — An adverse outcome is likely; a provision is needed.

### Legal Matter Status

- **OPEN** — Work is in progress.
- **ON HOLD** — Waiting on the business, the counterparty or a court.
- **CLOSED** — The work is finished and the outcome recorded.

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

### Renewal Status

- **DRAFT** — Being prepared by account management; nothing has been offered or committed to the customer.
- **ACTIVE** — Offered to or confirmed with the customer and now being carried out.
- **COMPLETED** — The new term is in place and the entitlement continues. A final state.
- **CANCELLED** — The customer chose not to continue, so no new term starts. A final state.

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

### Contract — Contract Lifecycle

Starts at **DRAFT**.
Final: **EXPIRED**, **TERMINATED**, **CANCELLED**.

Moves:
- DRAFT → NEGOTIATION (Negotiate)
- DRAFT → APPROVAL (Submit For Approval)
- NEGOTIATION → APPROVAL (Submit For Approval)
- APPROVAL → NEGOTIATION (Return To Negotiation)
- APPROVAL → ACTIVE (Activate)
- ACTIVE → SUSPENDED (Suspend)
- SUSPENDED → ACTIVE (Resume)
- ACTIVE → EXPIRED (Expire)
- SUSPENDED → EXPIRED (Expire)
- ACTIVE → TERMINATED (Terminate)
- SUSPENDED → TERMINATED (Terminate)
- DRAFT → CANCELLED (Cancel)
- NEGOTIATION → CANCELLED (Cancel)
- APPROVAL → CANCELLED (Cancel)

### Contract Obligation — Contract Obligation Lifecycle

Starts at **OPEN**.
Final: **FULFILLED**, **BREACHED**, **WAIVED**, **CANCELLED**.

Moves:
- OPEN → IN PROGRESS (Start)
- IN PROGRESS → FULFILLED (Fulfil)
- IN PROGRESS → BREACHED (Mark Breached)
- OPEN → WAIVED (Mark Waived)
- IN PROGRESS → WAIVED (Mark Waived)
- OPEN → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)

### Agreement — Agreement Lifecycle

Starts at **DRAFT**.
Final: **EXPIRED**, **TERMINATED**, **CANCELLED**.

Moves:
- DRAFT → IN NEGOTIATION (Send)
- IN NEGOTIATION → DRAFT (Revise)
- IN NEGOTIATION → SIGNED (Sign)
- DRAFT → SIGNED (Sign)
- SIGNED → IN FORCE (Take Effect)
- IN FORCE → EXPIRED (Expire)
- IN FORCE → TERMINATED (Terminate)
- SIGNED → TERMINATED (Terminate)
- DRAFT → CANCELLED (Cancel)
- IN NEGOTIATION → CANCELLED (Cancel)

### Contract Amendment — Contract Amendment Lifecycle

Starts at **DRAFT**.
Final: **EFFECTIVE**, **REJECTED**, **CANCELLED**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → SIGNED (Sign)
- SIGNED → EFFECTIVE (Take Effect)
- APPROVED → REJECTED (Reject)
- DRAFT → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)

### Contract Renewal — Contract Renewal Lifecycle

Starts at **UNDER REVIEW**.
Final: **CONFIRMED**, **DECLINED**.

Moves:
- UNDER REVIEW → CONFIRMED (Confirm)
- UNDER REVIEW → DECLINED (Decline)

### Contract Termination — Contract Termination Lifecycle

Starts at **NOTIFIED**.
Final: **COMPLETED**, **WITHDRAWN**.

Moves:
- NOTIFIED → EFFECTIVE (Take Effect)
- EFFECTIVE → COMPLETED (Complete)
- NOTIFIED → WITHDRAWN (Withdraw)

### Renewal — Renewal Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Legal Case — Legal Case Lifecycle

Starts at **FILED**.
Final: **CLOSED**, **SETTLED**, **WITHDRAWN**.

Moves:
- FILED → PENDING (Proceed)
- PENDING → DECIDED (Decide)
- PENDING → SETTLED (Settle)
- FILED → SETTLED (Settle)
- DECIDED → CLOSED (Close)
- DECIDED → APPEALED (Appeal)
- APPEALED → CLOSED (Close)
- APPEALED → SETTLED (Settle)
- FILED → WITHDRAWN (Withdraw)
- PENDING → WITHDRAWN (Withdraw)

### Legal Matter — Legal Matter Lifecycle

Starts at **OPEN**.
Final: **CLOSED**.

Moves:
- OPEN → ON HOLD (Hold)
- ON HOLD → OPEN (Resume)
- OPEN → CLOSED (Close)
- ON HOLD → CLOSED (Close)

## Roles

- **User** — reads 87 of 87 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
