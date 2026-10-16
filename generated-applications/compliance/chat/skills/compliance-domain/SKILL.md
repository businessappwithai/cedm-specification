---
name: compliance-domain
description: What the records of Compliance are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Compliance, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Compliance

Compliance, Risk and Governance, built on the CEDM common foundation.

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

### Audit Case

An audit investigation or review that groups its scope, evidence, findings, actions and conclusions in one place. An audit case is the container for one piece of assurance work. It keeps everything an auditor gathered and concluded together, so the outcome can be defended later and follow-up actions can be traced to their source. Opened when an audit, review or investigation starts; updated as evidence and findings are added; read by auditors, management and regulators when the case is reviewed. Evidence, findings and corrective actions attach to the case; the audit events that prove the unde…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the case took effect as the governing record of the review. Set when the case is opened or a revision takes effect; used to order cases and show which version applied at a given time.
  - **Case Number** (required) — The reference number of the audit case, such as AUD-2026-007. Assigned when the case is opened; quoted in findings and reports. Read with the title.
  - **Title** (required) — A short title saying what is being audited. Entered when the case is opened; shown in lists. Read with the case number.
  - **Scope** — A description of what the audit covers and what it leaves out. Written when the case is planned and agreed with the audited area; findings are judged against it. Read by auditors and those audited.
  - **Opened On** (required) — The date the audit case was opened. Set when the case is created; the length of the case is measured from it. Not later than the closing date.
  - **Closed On** — The date the audit case was closed. Set when the case is closed; must not be before the opening date. Gives the duration of the case.
  - **Status** (required, one of the Audit Case Status values) — Where the audit case is in its life, from planning to closure. Starts as PLANNED; moved by the lead auditor as fieldwork, reporting and follow-up proceed. Decides whether findings can still be added. Scoped and scheduled; fieldwork has not…
  - **Audit Type** (required, one of the Audit Case Audit Type values) — Who performs the audit and for whom. Chosen when the case is opened; it decides who receives the report and how findings are followed up. External and regulatory findings usually carry deadlines set by the auditor. Performed by the company…
  - **Period From** — The first day of the period whose records are examined. Agreed in the scope; samples are drawn from this period. Must not be later than the end of the period.
  - **Period To** — The last day of the period whose records are examined. Agreed in the scope. Usually before the fieldwork starts.
  - **Fieldwork Start** — When the auditors start gathering evidence. Planned in the audit plan and confirmed with the audited unit. Must not be later than the fieldwork end.
  - **Fieldwork End** — When evidence gathering is planned to finish. Planned in the audit plan; reporting starts after it. Delays beyond it are reported to the audit committee.
  - **Report Issued Date** — The day the final report was issued. Recorded when the report is sent; the case can then be closed. A closed case has one.
  - **Opinion** (one of the Audit Case Opinion values) — The auditors' overall conclusion. Given in the final report; summarizes how well the audited area is controlled. Read with the findings, whose severities support it. Controls are well designed and work as intended. Controls mostly work, wi…
  - **Lead Auditor** (a Party) — The person responsible for the audit. Chosen when the case is planned. At most one lead auditor; empty until one is appointed. Owns the conclusions and the report.
  - **Audited Organization** (a Organization) — The company, unit or supplier audited. Chosen when the case is opened; the unit's audit history is listed from it. One audited organization per case; a multi-unit review is split into cases. Its management receives the report and owns the…
  - **Compliance Requirement** (a Compliance Requirement) — The law, regulation or standard the audit tests against, where there is one. Chosen for regulatory and certification audits. At most one per case. Findings are then nonconformities against that requirement.

### Audit Case Audit Type

The values of audit case audit type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Audit Case Opinion

The values of audit case opinion, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Audit Case Status

The values of audit case status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Audit Event

An immutable record of a significant action, state change, access, decision or control event. Audit events are the evidence that something happened: who did what, to what, and when. They cannot be edited, which is exactly what makes them usable as proof. Written automatically whenever a governed action occurs; read by auditors, security teams and investigations to reconstruct what took place. Events point to the record or action they describe and the actor responsible; audit cases cite them as evidence. An event is final the moment it is written. A mistake is explained by a later event, never…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the audited action took place. Set from the time of the action, not the time of writing; events are ordered by it when reconstructing a sequence.
  - **Event Type** (required) — What kind of action happened, such as "Record updated", "Sign-in failed" or "Approval granted". Set by the application; investigators filter the trail by it. Each kind of action is recorded under one consistent name.
  - **Category** (required, one of the Audit Event Category values) — The broad class of the action. Used to route events to the people who review them and to set retention periods. Security events are kept longer and reviewed more often. Signing in or out, or a failed attempt. Access given, refused or chang…
  - **Action** (required) — The specific action, such as create, update, delete, approve or export. Set by the application. Read with the event type and the record touched.
  - **Occurred At** (required) — When the action happened, to the second, in UTC. Set by the application at the moment of the action; the trail is read in this order. Never edited.
  - **Record Type** — The kind of record acted on, such as "Purchase order". Set by the application; empty for actions that touch no record, such as signing in. Read with the record identifier.
  - **Record** — The identifier of the record acted on. Lets an investigator list every action ever taken on one record. Together with the record type it identifies the record.
  - **Outcome** (required, one of the Audit Event Outcome values) — Whether the action succeeded. Failed actions matter as much as successful ones, for example repeated failed sign-ins. A denied action records the attempt even though nothing changed. The action was carried out. The action was attempted and…
  - **Details** — What changed — for a change, the fields with their old and new values. Written by the application; read by investigators to see exactly what was done. Sensitive values are masked rather than recorded in clear.
  - **Source Address** — The network address the action came from. Recorded by the application; used in security investigations. Treated as personal data in some jurisdictions.
  - **Actor Name** — The name of the actor as it was at the time of the action. Kept so that the trail still reads correctly after the user is renamed or removed. For system actions it names the job or integration.
  - **Audit Case** (a Audit Case) — The audit case that cites this event as evidence. Linked by an auditor gathering evidence; most events belong to no case. At most one case per event. Linking an event to a case does not change the event itself.

### Audit Event Category

The values of audit event category, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Audit Event Outcome

The values of audit event outcome, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Compliance Requirement

A legal, regulatory, contractual, policy or standards requirement against which controls and evidence are assessed. Compliance starts from a clear statement of what must be true. Holding each requirement as a record lets controls, evidence and audits point at the exact obligation they satisfy, and show what applied when. Entered by compliance officers when a law, standard or contract imposes an obligation; read when controls are designed and when evidence is reviewed. Controls, evidence and audit cases reference the requirement they address. Finalised evidence and effective history are preser…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the requirement came into force. Set from the source law or contract; assessments compare evidence to the requirements in force on the assessment date.
  - **Reference** (required) — The citation of the requirement within its source, such as "GDPR Art. 30(1)" or "ISO 27001 A.5.15". Entered when the requirement is recorded; controls and audit findings quote it. Unique across requirements, so the source is part of it.
  - **Title** (required) — A short statement of what the requirement is about. Shown in compliance registers, such as "Record of processing activities". Identifies the requirement for people, with the reference.
  - **Requirement Text** (required) — What the requirement demands, in the words of the source or a faithful summary. Read by control owners to design controls that meet it. The source document remains authoritative.
  - **Source Type** (required, one of the Compliance Requirement Source Type values) — What kind of source the requirement comes from. Chosen when recording it; regulatory requirements carry legal risk, internal ones do not. Determines who may waive it — nobody inside the company can waive a law. An act of a legislature. A r…
  - **Source Name** — The name of the law, regulation, standard or contract. Such as "Regulation (EU) 2016/679 (GDPR)". Several requirements share one source.
  - **Jurisdiction** — Where the requirement applies, such as "European Union" or "State of California". Lets the business see which obligations apply to which operations. Empty for standards and contracts that apply wherever the company operates them.
  - **Effective From** — The day the requirement starts to apply. Taken from the source; compliance must be in place by then. Must not be later than the end date.
  - **Effective To** — The day the requirement stops applying. Set when the source is repealed or replaced. Empty while it applies.
  - **Obligation Level** (required, one of the Compliance Requirement Obligation Level values) — Must be met, so any gap has to be remedied. Expected unless there is a documented reason not to. Good practice the business may choose to follow. How binding the requirement is. Decides how a gap is treated — a mandatory gap must be remedi…
  - **Risk Rating** (one of the Compliance Requirement Risk Rating values) — Minor consequences if the requirement is missed. Noticeable penalties or harm. Heavy penalties, legal action or serious harm. Could stop the business or cause severe harm. How serious it would be to fail the requirement. Used to prioritize…
  - **Status** (required, one of the Compliance Requirement Status values) — Whether the requirement currently applies to the business. Moved on by the compliance team after assessment. Only active requirements need working controls. Recorded and being assessed for applicability. Applies to the business and must be…
  - **Applicability Note** — Why the requirement does or does not apply, and to which parts of the business. Written after the applicability assessment; required when marking it not applicable. Regulators may ask for this reasoning.
  - **Owner** (a Person) — The person accountable for meeting the requirement. Assigned when it becomes active; receives assessment results and gaps. One owner per requirement. Usually the head of the function the requirement affects.
  - **Policy** (a Policy) — The internal policy that restates the requirement for staff. Linked when a policy implements the requirement. At most one policy per requirement. The policy is how the requirement reaches the people who must follow it.

### Compliance Requirement Obligation Level

The values of compliance requirement obligation level, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Compliance Requirement Risk Rating

The values of compliance requirement risk rating, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Compliance Requirement Source Type

The values of compliance requirement source type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Compliance Requirement Status

The values of compliance requirement status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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

### Control

A policy, procedure, mechanism or activity designed to prevent, detect or reduce a business risk. Controls are what the organisation actually does about its risks. Naming each control, saying how often it runs and who owns it makes assurance possible, because an auditor can test the control rather than rely on assurances. Defined by risk and compliance teams; assigned an owner; tested periodically; read by auditors and management. A control is owned by a Party, belongs to an Organization, mitigates Risks and implements Policies. A control is drafted, becomes active when put into operation, ca…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The reference by which the control is cited in risk registers and audits. Unique; assigned when the control is defined.
  - **Name** (required) — The short name of the control as it appears in the control register, such as Monthly bank reconciliation review. Written by the risk and compliance team when the control is defined; shown in registers, test plans and audit reports.
  - **Description** (required) — A full description of what the control does and how it operates. Written by the control owner; read by those who test or rely on the control.
  - **Control Type** (required, one of the Control Control Type values) — How the control acts on a risk. Chosen when the control is defined; auditors use it to judge whether coverage is balanced. Stops a risk event from happening. Finds a risk event after it has happened. Limits damage and restores normal opera…
  - **Frequency** (required, one of the Control Frequency values) — Operates all the time, for example an automated system check. Performed once every working day by the control owner. Performed once every week, such as a weekly exception report review. Performed once every month, often at period close. Pe…
  - **Status** (required, one of the Control Status values) — Whether the control is being designed, in operation or ended. Set by the control owner; only ACTIVE controls are tested and relied on. Being designed; not yet operating. Operating and relied upon. Not currently operating, but may be reinst…
  - **Automation** (required, one of the Control Automation values) — Whether a person or the system performs the control. Automated controls are tested differently from manual ones. Semi-automated controls have a manual review of system output. Performed by a person. The system prepares; a person reviews. P…
  - **Is Key Control** (required) — Whether the control is relied on for financial reporting or a critical risk. Key controls are tested every year. Read with the risks it addresses.
  - **Effectiveness** (required, one of the Control Effectiveness values) — Not yet tested, so its effectiveness is unknown. Designed and operating as intended. Works, but with weaknesses that need remedying. Does not achieve its purpose. The result of the latest test. Updated by the tester; ineffective controls l…
  - **Last Tested Date** — The day the control was most recently tested for effectiveness. Set by the tester when a test is completed; testing plans prioritise controls not tested recently. Empty until the first test.
  - **Owner** (a Party) — The person or party accountable for the control operating. Set when the control is defined; receives test findings. At most one owner; a control without an owner is an assurance gap. Identifies who answers for the control.
  - **Organization** (a Organization) — The organisation in which the control operates. Set so controls can be scoped and tested per legal entity. At most one organisation. Scopes assurance work.

### Control Automation

The values of control automation, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Control Control Type

The values of control control type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Control Effectiveness

The values of control effectiveness, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Control Frequency

The values of control frequency, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Control Status

The values of control status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Filing

A submission made to a court, regulator, registry or authority, with immutable evidence of what was submitted. Legal and regulatory duties are met by filing. The record shows what was filed, with whom and when, which is the proof that a duty was met on time. Created when a document is submitted; read when proving compliance or responding to the authority. A filing is directed to an external body and supported by documents. Finalised evidence is preserved; corrections or supersession are explicit filings. Annual accounts filed with the company registry on 28 June. Risk assessment, incident man…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the filing was submitted. Taken from the receipt; deadlines are checked against it.
  - **Filing Number** (required) — The company's own internal reference for this filing, quoted in deadline calendars and correspondence. Unique; assigned when the filing is first recorded, before the authority has issued any reference of its own. The authority's reference…
  - **Title** (required) — A short description of what is being filed, such as "Annual accounts 2023" or "Change of registered office". Written by the person preparing the filing and shown in deadline calendars, so that compliance staff can recognise it without open…
  - **Filing Type** (required, one of the Filing Filing Type values) — What kind of filing it is. Chosen when recording it; deadlines and responsible teams differ by type. Read with the authority. A pleading or other submission to a court. A report or notification to a regulator. An annual return, accounts or…
  - **Due Date** (required) — The last day the filing may be lodged. Taken from the law, the court's order or the authority's notice; calendars warn before it. A filing submitted after it is late.
  - **Submitted At** — When the filing was lodged. Recorded on submission; it is the proof of meeting the deadline. Present once submitted.
  - **Submission Channel** — How the filing was lodged, such as the authority's portal, post or in person. Recorded on submission. Some authorities accept only their own portal.
  - **Acknowledgement Reference** — The reference the authority gave on receipt. Entered from the acknowledgement; quoted in any later correspondence. The evidence that the authority received the filing.
  - **Fee Amount** — The fee the authority charged for accepting the filing, in the currency it was paid in. Entered once the fee is paid and used for expense tracking and budgeting of regulatory costs. Many filings carry no fee and leave it blank. Many filing…
  - **Rejection Reason** — Why the authority rejected the filing. Recorded when it is rejected, so the corrected filing addresses it. Present only on rejected filings.
  - **Status** (required, one of the Filing Status values) — Shows how far the filing has progressed, from being identified as required to the authority's answer. Moved on by the compliance team as the papers are prepared, lodged and answered. A required filing that is still unsubmitted after its du…
  - **Authority** (a Organization) — The court, regulator, registry or tax authority the filing is made with. Chosen when recording it. One authority per filing. Its rules decide the format and the deadline.
  - **Legal Entity** (a Legal Entity) — The company the filing is made for. Chosen when recording it; each company's filing calendar is drawn from these. One company per filing. Group companies each have their own filings.
  - **Prepared By** (a Person) — The person responsible for preparing and lodging the filing. Receives deadline reminders. One per filing. Should be reassigned when they are absent near the deadline.

### Filing Filing Type

The values of filing filing type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Filing Status

The values of filing status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Finding

An observation of a deficiency in a control, audit, compliance, quality or risk area that needs a decision or remediation. Audits are only useful if what they find is followed up. A finding states the problem, how serious it is and what has to be done, so it can be tracked to closure. Raised by auditors or reviewers; assigned for remediation; reviewed until closed. A finding may concern a Control or a Risk. Finalised evidence is not silently rewritten; corrections or supersession are explicit. Finding that bank reconciliations were reviewed late in three of twelve months. Used in contracts, d…

Readable by every signed-in person.

Fields:
  - **Effective At** — The moment from which the finding stands as an issued observation about the control or risk. Set at issue by the auditor or reviewer; ageing of open findings and remediation deadlines are measured from it.
  - **Finding Number** (required) — The reference by which the finding is cited in the audit report and in follow-up with management. Unique; assigned when the auditor raises the finding and then used in tracking lists and committee reports. Unique.
  - **Title** (required) — A one-line statement of the weakness found, readable without opening the full finding. Written by the auditor and shown in finding lists, dashboards and the issued report, so it should name the control or process affected. Identifies the f…
  - **Condition** (required) — The facts of what the auditor found, including what was observed and the evidence behind it. Written by the auditor and agreed with management for accuracy before the report is issued; it should describe the situation, not the cause. Agree…
  - **Root Cause** — The underlying reason the weakness arose, as agreed with management after analysis. The agreed action should address this cause; without it, fixes tend to treat only the symptoms and the same finding returns. Without it, fixes tend to addr…
  - **Severity** (required, one of the Finding Severity values) — How serious the weakness is, rated by the auditor against the organisation's risk scale. Chosen when the finding is raised; it sets the due date for remediation, decides who is told, and feeds the audit's overall opinion. A minor weakness…
  - **Agreed Action** — The corrective action that management committed to take in response to the finding. Written with the action owner after the finding is raised; the owner reports progress against it and the auditor later checks that it worked. The owner rep…
  - **Due Date** — When the action is to be completed. Agreed with management; overdue findings are escalated. Set by severity.
  - **Remediated Date** — The date the action owner reported that the agreed action had been completed. Recorded by the owner; it starts the auditor's verification, which follows before the finding can be closed. Verification follows.
  - **Verified Date** — The date the auditor confirmed that the fix is in place and actually works. Recorded on verification and required to close the finding. It cannot be earlier than the remediated date. Not before the remediated date.
  - **Status** (required, one of the Finding Status values) — Shows where the finding is in its life, from being raised through remediation to closure. Moved on by the action owner as work progresses, while only the auditor can close a finding after verifying the fix. Raised, but management has not y…
  - **Control** (a Control) — The control the finding is about. Set where a specific control failed. At most one control. Links the deficiency to the control to be fixed. Identifies deficient or tested control.
  - **Risk** (a Risk) — At most one risk, the exposure that the finding relates to. Risk informed by finding. Connects evidence to risk governance. Risk assessment and treatment. May trigger reassessment/treatment.
  - **Audit Case** (a Audit Case) — The audit that raised the finding. Set when the finding is raised. One per finding. The audit report lists its findings.
  - **Compliance Requirement** (a Compliance Requirement) — The requirement not met, for compliance findings. Linked for regulatory and certification audits. At most one. Makes the finding a nonconformity against the requirement.
  - **Owner** (a Person) — The manager responsible for the action. Agreed with management. One per finding. Reports progress until closure.

### Finding Severity

The values of finding severity, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Finding Status

The values of finding status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Loss Event

A record of realised financial, operational, physical, legal or other loss that can be attributed to a risk or incident. Risk management is judged by outcomes. A loss event records what was actually lost, so risk estimates can be tested against reality and insurance and recovery claims can be supported. Recorded after an incident when the loss is known; read by risk managers, finance and insurers. A loss event is linked to the risk it materialised and to the incident that caused it. Finalised evidence and effective history are preserved; reassessments and recoveries are separate, explicit rec…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the loss was suffered. Set from the incident; used to place the loss in a reporting period.
  - **Loss Number** (required) — The unique reference by which risk managers, auditors and insurers quote this loss. Assigned automatically when the loss is recorded and never reused, even if the loss is later withdrawn. No two loss events share a number.
  - **Title** (required) — A one-line description of what was lost, such as stolen stock or a failed payment run. Entered when the loss is recorded and shown in loss reports and dashboards. Read alongside the loss number to identify the event.
  - **Description** — A narrative explaining how the loss came about and what it affected. Written by the risk analyst when recording the loss and updated as the assessment finds more. The linked incident holds the detailed facts of what happened.
  - **Event Category** (required, one of the Loss Event Event Category values) — The risk category the loss falls under. Chosen when recording it; loss reports and capital models group by it. Follows the standard operational-risk event types. Fraud or theft by staff. Fraud or theft by outsiders. Claims from employees o…
  - **Occurred Date** — The day the event that caused the loss took place. Taken from the linked incident or investigation; it can differ from the day the loss was found. It cannot be later than the discovery date.
  - **Discovered Date** (required) — The day someone first realised the loss had happened and reported it. Recorded when the loss is reported; period-end loss reporting groups events by this date. Required, since losses are reported by discovery rather than occurrence.
  - **Gross Loss** (required) — The full value lost before any insurance payout, recovery or write-back reduces it. Estimated when the loss is first recorded and confirmed by the risk team during assessment. Held in the loss's own currency.
  - **Recovered Amount** — What has been recovered from insurance or third parties. Updated as recoveries come in. Not more than the gross loss.
  - **Net Loss** — What the loss really cost the business once recoveries have been taken off. Worked out as the gross loss less the amount recovered; risk and finance reports use this figure. Changes whenever new recoveries are booked.
  - **Status** (required, one of the Loss Event Status values) — Shows how far the loss has been assessed and whether its amounts can still change. Moved on by the risk team as estimates are confirmed and recoveries settle. Closed losses are frozen and no longer edited. The loss is known and recorded, b…
  - **Risk** (a Risk) — The risk in the register the loss is an occurrence of. Linked so that the risk's assessment can be checked against real losses. At most one per loss. Frequent losses on a risk call its controls into question.
  - **Legal Entity** (a Legal Entity) — The group company that bears the loss. Chosen when recording it. One per loss. The loss is booked in this entity's accounts.
  - **Currency** (required, a Currency) — The currency of the amounts. Set when recording it. One per loss. All amounts on the loss use it.

### Loss Event Event Category

The values of loss event event category, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Loss Event Status

The values of loss event status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Obligation

A duty owed by a party under law, an agreement, a policy, an order or another authoritative source. Organisations owe things to regulators, customers, partners and each other. Recording each duty, with its source and who owes it, lets the organisation know what it must do and prove that it did. Recorded when a duty arises from a law, contract or decision; tracked until it is met; read by compliance, legal and operations. An obligation relates to the party who owes it, the source that imposes it, and the evidence that it was met. Finalised evidence and history are preserved; if the obligation…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the obligation arose. Set from the source; deadlines and limitation periods run from it.
  - **Obligation Number** (required) — The unique reference people use when chasing or reporting on this duty. Assigned when the obligation is recorded and quoted in reminders, breach notices and compliance reports. No two obligations share a number.
  - **Title** (required) — What has to be done, in one line. Shown in obligation calendars, such as "Deliver SOC 2 Type II report". Identifies the obligation for people, with the number.
  - **Description** — The duty in full, as the source states it. Read by the owner to know exactly what must be done. The source remains authoritative.
  - **Obligation Type** (required, one of the Obligation Obligation Type values) — The kind of duty owed, such as paying money, delivering goods or keeping information secret. Chosen when the obligation is recorded; it determines who monitors it and which evidence is expected. Payment duties usually also appear in the ac…
  - **Source Reference** — Where the duty comes from, such as "MSA-2022-07, clause 14.3" or "GDPR Art. 33". Recorded so that the duty can be checked against its source. Read with the linked agreement, contract or requirement.
  - **Is Owed By Us** (required) — Whether the duty is ours or the other party's. Separates what we must do from what we must make others do. Our own duties need an internal owner; others' need someone to follow them up.
  - **Due Date** — The date the next performance is due. Owners are reminded before it; a duty not met by then is breached. Moved to the next occurrence when a recurring duty is met.
  - **Frequency** (required, one of the Obligation Frequency values) — How often the duty has to be performed again, from a single event to every year. Chosen when recording the obligation; after each performance it drives the calculation of the next due date. One-off and ongoing duties have no next occurrenc…
  - **Met Date** — The day the duty was last performed in full. Recorded by the owner alongside the evidence, such as a payment receipt or signed delivery note. Filled only once the obligation has been met.
  - **Evidence** — How performance was shown, such as the report sent and its date. Recorded when met; auditors read it. Supporting files are attached to the obligation.
  - **Status** (required, one of the Obligation Status values) — Not yet due, or due but not yet performed. The duty has been performed and the evidence recorded. The party owed the duty has formally released the other from it. The duty was not performed by its due date. Whether the duty has been met. M…
  - **Obligor** (a Party) — The party that owes the duty. Chosen when recording it. One per obligation. Our own company when the duty is ours.
  - **Owner** (a Person) — The person who sees that the duty is met or followed up. Receives due-date reminders. One per obligation. Should be reassigned when they leave.
  - **Compliance Requirement** (a Compliance Requirement) — The legal or regulatory requirement the duty comes from. Linked when the source is a law or regulation. At most one per obligation. Breaches are compliance incidents.

### Obligation Frequency

The values of obligation frequency, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Obligation Obligation Type

The values of obligation obligation type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Obligation Status

The values of obligation status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Policy

A formally defined rule, principle or requirement that governs business behaviour or decision-making. Policies state what the organisation has decided to do. Holding them as versioned records shows which version applied when, who owns it and which controls put it into practice. Written by the policy owner; approved; made active; reviewed periodically; read by staff and auditors. A policy is owned by an Organization, implemented by Controls and evidenced by a Document. A policy is drafted, approved, then made active. It can be suspended and resumed, and is retired when superseded. Only an appr…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The reference of the policy, such as POL-SEC-001. Unique; used in audits and training.
  - **Name** (required) — The title of the policy as staff will see it in the policy library, such as Acceptable Use Policy. Set by the policy owner when drafting; shown in the policy library, audit reports and training material.
  - **Description** — A summary of the policy's purpose and scope. Written by the owner; read by staff.
  - **Policy Type** (required) — The area the policy covers, such as security, procurement or conduct. Chosen at creation; groups policies for review.
  - **Policy Version** (required) — The revision number of the policy text, such as 1.0 or 2.3, which tells readers which wording applies. Incremented by the owner at each revision, so audits and training can cite the exact version staff acknowledged.
  - **Status** (required, one of the Policy Status values) — Shows where the policy is in its life, from draft through approval and enforcement to retirement. Moved by the owner and approvers; staff are held to a policy only while it is active. The policy text is being written and is not yet binding…
  - **Effective From** — The first date on which the policy applies and staff are expected to comply. Set at approval, usually in the future; the policy becomes enforceable from this date and not before.
  - **Effective To** — The last date the policy applies. Set when superseded; not before the start date.
  - **Owner** (a Organization) — The organisation accountable for the policy. Set at creation. At most one owner. Gives accountability for review.

### Policy Status

The values of policy status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk

A potential event or condition that could affect the achievement of business objectives. The risk register lets the organisation name what could go wrong, judge how likely and how serious it is, decide what to do and track it to a close. It supports governance by keeping each risk, its owner and its controls in one place. Raised by anyone; assessed and owned by risk or business managers; read by governance and audit. A risk may have an owner and an organisation, is addressed by controls and has treatments. A risk is identified, assessed and then mitigated or accepted before it is closed. It m…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The register code of the risk, such as RSK-021. Unique; quoted in reports and audits. Read with the name to identify the risk.
  - **Name** (required) — A short phrase naming the potential event, such as supplier insolvency or data centre outage. Written by the risk owner when the risk is identified; shown in the risk register and on the heat map. Read by owners and reviewers.
  - **Description** — A fuller account of the cause, event and consequence. Written when the risk is raised and revised on assessment. Read by the assessor.
  - **Category** (required) — The kind of risk, such as financial, operational or compliance. Chosen when raised; the register is grouped by it. Decides which reviewer sees it.
  - **Likelihood** (required, one of the Risk Likelihood values) — How probable it is that the risk event occurs within the assessment period. Chosen at assessment by the risk owner and combined with impact to give the risk rating and its place on the heat map. Expected to occur only in exceptional circum…
  - **Impact** (required, one of the Risk Impact values) — How serious the consequences would be for the business if the risk event occurred. Chosen at assessment by the risk owner and combined with likelihood to give the risk rating and its place on the heat map. Negligible effect that needs no a…
  - **Status** (required, one of the Risk Status values) — Where the risk is in its handling. Starts as IDENTIFIED; moved by the owner. Decides whether treatments and reviews are due. Recorded, not yet assessed. Likelihood and impact are set. Actions are under way to reduce it. The remaining expos…
  - **Owner** (a Party) — The person accountable for managing the risk. Chosen when the risk is assessed. At most one owner; empty until assigned. Names who answers for it.
  - **Organization** (a Organization) — The organisation the risk affects. Chosen when the risk is specific to a unit. At most one organisation. Groups the risk in the right register.

Line items — **Risk Treatment**: kept inside each Risk and reached by opening it, never on their own. An action planned and carried out to reduce, accept, transfer, avoid or monitor a risk. A treatment is how the organisation responds to a risk it has assessed. Recording it with an owner and a status shows that each risk has an answer, what that answer is and whether it has been done. Raised by the…

### Risk Assessment

An evaluation of a risk's likelihood, impact, exposure, controls and residual risk at a defined point in time. An assessment is the dated judgement on a risk. Keeping each one, rather than overwriting the risk, shows how exposure changed as controls were added and lets reviewers see what was known when a decision was made. Performed by the risk owner or a reviewer; read by governance, audit and underwriting. An assessment is of exactly one risk, and underwriting evaluations may draw on it. An assessment is recorded once as at its date. A later reassessment is a new record; earlier ones stay a…

Readable by every signed-in person.

Fields:
  - **Occurred At** — The date and time the assessment was made. Set when recorded; the sequence of assessments is ordered by it. Read with the risk to trace its exposure over time.
  - **Assessment Number** (required) — The reference that identifies this dated review of a risk. Assigned when the assessment is started and quoted in reports and committee papers. Unique across all assessments.
  - **Assessment Date** (required) — The calendar date that the assessed likelihood and impact are judged to apply to. Entered by the risk owner; trend charts plot each risk's assessments in order of this date. Usually the end of the review period.
  - **Inherent Likelihood** (required, one of the Risk Assessment Inherent Likelihood values) — How likely the risk is to occur if no controls were in place at all. Judged by the risk owner against the agreed likelihood scale. Read with the inherent impact. May occur only in exceptional circumstances. Could occur but is not expected…
  - **Inherent Impact** (required, one of the Risk Assessment Inherent Impact values) — Negligible effect that is absorbed in normal operations. Small, easily absorbed effect. Noticeable effect needing management attention. Serious effect on the organisation's objectives. Threatens the survival of the business. How bad the co…
  - **Residual Likelihood** (required, one of the Risk Assessment Residual Likelihood values) — May occur only in exceptional circumstances. Could occur but is not expected during the period. Might occur at some time. Will probably occur at least once, even with controls working. Expected to occur, and likely to occur repeatedly, des…
  - **Residual Impact** (required, one of the Risk Assessment Residual Impact values) — Negligible effect that is absorbed in normal operations. Small, easily absorbed effect. Noticeable effect needing management attention. Serious effect on the organisation's objectives. Threatens the survival of the business, even with cont…
  - **Residual Rating** (required, one of the Risk Assessment Residual Rating values) — Accepted, with routine monitoring only. Accepted with monitoring by the owner. Needs treatment and management attention. Needs immediate treatment and board attention. The overall rating after controls, from the likelihood-impact matrix. R…
  - **Controls Considered** — The controls relied on to reduce the risk. Listed by the owner; their effectiveness affects the residual rating. Control testing should support them.
  - **Within Appetite** (required) — Whether the residual risk is within the appetite set for it. Concluded by the risk owner and confirmed by risk management. A risk outside appetite needs a treatment plan.
  - **Conclusion** — The assessor's conclusion and any recommended action. Read by management and in the next review. Free text.
  - **Status** (required, one of the Risk Assessment Status values) — Shows whether the assessment is still being written, awaiting review, accepted or replaced. Moved on by the owner submitting it and by risk management approving it. Only approved assessments appear in reports. Being completed by the owner.…
  - **Risk** (required, a Risk) — Each assessment evaluates one risk; a risk may have many assessments over time. Risk being assessed. Supplies risk identity and context. Risk governance and treatment. Assessment may drive controls/treatment without rewriting prior assessm…
  - **Assessor** (a Person) — Who carried out the assessment. Recorded when starting it. One per assessment. Usually the risk owner.

### Risk Assessment Inherent Impact

The values of risk assessment inherent impact, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Assessment Inherent Likelihood

The values of risk assessment inherent likelihood, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Assessment Residual Impact

The values of risk assessment residual impact, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Assessment Residual Likelihood

The values of risk assessment residual likelihood, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Assessment Residual Rating

The values of risk assessment residual rating, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Assessment Status

The values of risk assessment status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Impact

The values of risk impact, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Likelihood

The values of risk likelihood, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Status

The values of risk status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Treatment Status

The values of risk treatment status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Treatment Strategy

The values of risk treatment strategy, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Risk Treatment Target Rating

The values of risk treatment target rating, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Attachment Status

- **ACTIVE** — Attached and part of the record's evidence.
- **WITHDRAWN** — Removed from the record's evidence, but kept for the history.

### Audit Case Audit Type

- **INTERNAL** — Performed by the company's own internal audit function.
- **EXTERNAL** — Performed by the statutory or another independent auditor.
- **REGULATORY** — Performed or required by a regulator.
- **CERTIFICATION** — Performed by a certification body against a standard such as ISO 9001.
- **SUPPLIER** — Performed by the company at a supplier's premises.

### Audit Case Opinion

- **SATISFACTORY** — Controls are well designed and work as intended.
- **NEEDS IMPROVEMENT** — Controls mostly work, with weaknesses to correct.
- **UNSATISFACTORY** — Significant weaknesses put the area's objectives at risk.
- **NOT RATED** — The engagement did not give an overall opinion, such as a consulting review.

### Audit Case Status

- **PLANNED** — Scoped and scheduled; fieldwork has not started.
- **IN PROGRESS** — Evidence is being gathered and tested.
- **REPORTED** — Findings have been reported and actions are being followed up.
- **CLOSED** — All actions are done and the case is finished. A final state.
- **CANCELLED** — Called off before it was reported. A final state.

### Audit Event Category

- **AUTHENTICATION** — Signing in or out, or a failed attempt.
- **AUTHORIZATION** — Access given, refused or changed.
- **DATA CHANGE** — A business record created, changed or deleted.
- **DATA ACCESS** — A sensitive record read or exported.
- **APPROVAL** — A decision recorded in an approval.
- **CONFIGURATION** — A change to settings, rules or the application dictionary.
- **SYSTEM** — An action taken by the system itself, such as a scheduled job.

### Audit Event Outcome

- **SUCCESS** — The action was carried out.
- **FAILURE** — The action was attempted and failed for a technical or validation reason.
- **DENIED** — The action was refused because the actor lacked the right to do it.

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

### Compliance Requirement Obligation Level

- **MANDATORY** — Must be met, so any gap has to be remedied.
- **RECOMMENDED** — Expected unless there is a documented reason not to.
- **OPTIONAL** — Good practice the business may choose to follow.

### Compliance Requirement Risk Rating

- **LOW** — Minor consequences if the requirement is missed.
- **MEDIUM** — Noticeable penalties or harm.
- **HIGH** — Heavy penalties, legal action or serious harm.
- **CRITICAL** — Could stop the business or cause severe harm.

### Compliance Requirement Source Type

- **LAW** — An act of a legislature.
- **REGULATION** — A rule made by a regulator or under a law.
- **STANDARD** — A voluntary standard the company has adopted or is certified against.
- **CONTRACT** — An obligation taken on in a contract with a customer or supplier.
- **INTERNAL POLICY** — A rule the company has set for itself.

### Compliance Requirement Status

- **IDENTIFIED** — Recorded and being assessed for applicability.
- **ACTIVE** — Applies to the business and must be met.
- **NOT APPLICABLE** — Assessed as not applying, with the reason recorded.
- **RETIRED** — No longer applies because the source was repealed or replaced.

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

### Control Automation

- **MANUAL** — Performed by a person.
- **SEMI AUTOMATED** — The system prepares; a person reviews.
- **AUTOMATED** — Performed by the system.

### Control Control Type

- **PREVENTIVE** — Stops a risk event from happening.
- **DETECTIVE** — Finds a risk event after it has happened.
- **CORRECTIVE** — Limits damage and restores normal operation after an event.
- **DIRECTIVE** — Tells people what they must or must not do, such as a policy or procedure.

### Control Effectiveness

- **NOT TESTED** — Not yet tested, so its effectiveness is unknown.
- **EFFECTIVE** — Designed and operating as intended.
- **PARTIALLY EFFECTIVE** — Works, but with weaknesses that need remedying.
- **INEFFECTIVE** — Does not achieve its purpose.

### Control Frequency

- **CONTINUOUS** — Operates all the time, for example an automated system check.
- **DAILY** — Performed once every working day by the control owner.
- **WEEKLY** — Performed once every week, such as a weekly exception report review.
- **MONTHLY** — Performed once every month, often at period close.
- **QUARTERLY** — Performed once every quarter of the year.
- **ANNUAL** — Performed once a year.
- **EVENT DRIVEN** — Performed when a particular event occurs.
- **AD HOC** — Performed as needed, with no fixed schedule.

### Control Status

- **DRAFT** — Being designed; not yet operating.
- **ACTIVE** — Operating and relied upon.
- **INACTIVE** — Not currently operating, but may be reinstated.
- **RETIRED** — Permanently ended; kept for history.

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

### Filing Filing Type

- **COURT** — A pleading or other submission to a court.
- **REGULATORY** — A report or notification to a regulator.
- **CORPORATE REGISTRY** — An annual return, accounts or a change notified to a company registry.
- **TAX** — A tax return or declaration.
- **INTELLECTUAL PROPERTY** — A patent, trademark or design application or renewal.
- **OTHER** — Any other submission to an authority.

### Filing Status

- **REQUIRED** — Known to be needed, but nobody has started preparing it.
- **IN PREPARATION** — The papers are being drawn up and have not yet been lodged with the authority.
- **SUBMITTED** — Lodged with the authority, which has not yet answered.
- **ACCEPTED** — The authority has accepted the filing; the obligation is met.
- **REJECTED** — Refused by the authority, so a corrected filing is needed.
- **WITHDRAWN** — Found not to be needed, or withdrawn after it was lodged.

### Finding Severity

- **LOW** — A minor weakness where an improvement is recommended but no urgent action is needed.
- **MEDIUM** — A weakness to correct within the normal planning cycle.
- **HIGH** — A significant weakness to correct promptly.
- **CRITICAL** — A serious failure needing immediate action and senior attention.

### Finding Status

- **OPEN** — Raised, but management has not yet agreed an action.
- **IN REMEDIATION** — An action has been agreed and is under way.
- **REMEDIATED** — The owner reports the action complete and awaits verification.
- **CLOSED** — Verified by the auditor, so nothing more is required.
- **RISK ACCEPTED** — Management decided not to act, with the approval required to carry the risk.

### Language Direction

- **LTR** — Written left to right.
- **RTL** — Written right to left.

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

### Loss Event Event Category

- **INTERNAL FRAUD** — Fraud or theft by staff.
- **EXTERNAL FRAUD** — Fraud or theft by outsiders.
- **EMPLOYMENT PRACTICES** — Claims from employees or about workplace safety.
- **CLIENTS PRODUCTS** — Failures towards customers, or in the design of products.
- **PHYSICAL ASSETS** — Damage to property from disasters, accidents or vandalism.
- **SYSTEMS FAILURE** — Failure of systems or infrastructure.
- **EXECUTION AND PROCESS** — Errors in processing transactions or managing processes.

### Loss Event Status

- **IDENTIFIED** — The loss is known and recorded, but its amounts are still estimates.
- **ASSESSED** — The amounts are confirmed, although further recoveries may still arrive.
- **CLOSED** — Final amounts are recorded and the loss is frozen for reporting.
- **WITHDRAWN** — The loss was recorded by mistake and is excluded from all totals.

### Obligation Frequency

- **ONCE** — Performed a single time and then finished.
- **MONTHLY** — Falls due again every month after each performance.
- **QUARTERLY** — Falls due again every three months after each performance.
- **ANNUAL** — Falls due again once a year after each performance.
- **ONGOING** — Applies continuously, as with confidentiality, so it never has a due date.

### Obligation Obligation Type

- **PAYMENT** — A duty to pay a sum of money by an agreed date.
- **DELIVERY** — A duty to hand over goods, a service or a document.
- **REPORTING** — A duty to report, notify or file information with someone.
- **PERFORMANCE** — A duty to carry out an action or reach an agreed standard.
- **CONFIDENTIALITY** — A duty to keep specified information secret from others.
- **RESTRICTION** — A duty not to do something, such as competing or soliciting staff.

### Obligation Status

- **PENDING** — Not yet due, or due but not yet performed.
- **MET** — The duty has been performed and the evidence recorded.
- **WAIVED** — The party owed the duty has formally released the other from it.
- **BREACHED** — The duty was not performed by its due date.

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

### Policy Status

- **DRAFT** — The policy text is being written and is not yet binding or approved.
- **APPROVED** — The policy has been formally approved but is not yet in force, awaiting its effective date.
- **ACTIVE** — The policy is in force and staff and systems are expected to comply with it.
- **SUSPENDED** — The policy is temporarily not enforced, for example while it is revised, and may be reinstated.
- **RETIRED** — The policy has been withdrawn or replaced and no longer applies. A final state.

### Risk Assessment Inherent Impact

- **INSIGNIFICANT** — Negligible effect that is absorbed in normal operations.
- **MINOR** — Small, easily absorbed effect.
- **MODERATE** — Noticeable effect needing management attention.
- **MAJOR** — Serious effect on the organisation's objectives.
- **SEVERE** — Threatens the survival of the business.

### Risk Assessment Inherent Likelihood

- **RARE** — May occur only in exceptional circumstances.
- **UNLIKELY** — Could occur but is not expected during the period.
- **POSSIBLE** — Might occur at some time.
- **LIKELY** — Will probably occur at least once during the period.
- **ALMOST CERTAIN** — Expected to occur, and likely to occur repeatedly.

### Risk Assessment Residual Impact

- **INSIGNIFICANT** — Negligible effect that is absorbed in normal operations.
- **MINOR** — Small, easily absorbed effect.
- **MODERATE** — Noticeable effect needing management attention.
- **MAJOR** — Serious effect on the organisation's objectives.
- **SEVERE** — Threatens the survival of the business, even with controls working.

### Risk Assessment Residual Likelihood

- **RARE** — May occur only in exceptional circumstances.
- **UNLIKELY** — Could occur but is not expected during the period.
- **POSSIBLE** — Might occur at some time.
- **LIKELY** — Will probably occur at least once, even with controls working.
- **ALMOST CERTAIN** — Expected to occur, and likely to occur repeatedly, despite the controls.

### Risk Assessment Residual Rating

- **LOW** — Accepted, with routine monitoring only.
- **MEDIUM** — Accepted with monitoring by the owner.
- **HIGH** — Needs treatment and management attention.
- **VERY HIGH** — Needs immediate treatment and board attention.

### Risk Assessment Status

- **DRAFT** — Being completed by the owner.
- **SUBMITTED** — Waiting for review by risk management.
- **APPROVED** — Accepted as the current view of the risk.
- **SUPERSEDED** — Replaced by a newer approved assessment.

### Risk Impact

- **INSIGNIFICANT** — Negligible effect that needs no action.
- **MINOR** — Small effect that is easily absorbed within normal operations.
- **MODERATE** — Noticeable effect needing management attention to contain.
- **MAJOR** — Serious effect on the achievement of objectives.
- **SEVERE** — Threatens the organisation's objectives or survival.

### Risk Likelihood

- **RARE** — Expected to occur only in exceptional circumstances.
- **UNLIKELY** — Could occur but is not expected to.
- **POSSIBLE** — Might occur at some time.
- **LIKELY** — Will probably occur, and would not be surprising.
- **ALMOST CERTAIN** — Expected to occur in most circumstances.

### Risk Status

- **IDENTIFIED** — Recorded, not yet assessed.
- **ASSESSED** — Likelihood and impact are set.
- **MITIGATING** — Actions are under way to reduce it.
- **ACCEPTED** — The remaining exposure is accepted.
- **CLOSED** — No longer a risk. A final state.
- **MATERIALIZED** — The risk has occurred. A final state.

### Risk Treatment Status

- **DRAFT** — Proposed and not yet approved by the risk owner.
- **ACTIVE** — Approved and the work is being carried out.
- **COMPLETED** — The action has been done and its effect can be assessed. A final state.
- **CANCELLED** — No longer needed or abandoned before completion. A final state.

### Risk Treatment Strategy

- **REDUCE** — Lower the likelihood or impact, usually through controls.
- **AVOID** — Stop the activity that creates the risk.
- **TRANSFER** — Pass the risk to another party, such as an insurer.
- **ACCEPT** — Bear the risk knowingly.

### Risk Treatment Target Rating

- **LOW** — Accepted, with routine monitoring only.
- **MEDIUM** — Accepted with monitoring by the owner.
- **HIGH** — Still needs treatment and management attention.

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

### Policy — Policy Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → APPROVED (Approve)
- APPROVED → ACTIVE (Activate)
- APPROVED → SUSPENDED (Suspend)
- SUSPENDED → APPROVED (Resume)
- ACTIVE → SUSPENDED (Suspend)
- SUSPENDED → ACTIVE (Resume)
- DRAFT → RETIRED (Retire)
- APPROVED → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- SUSPENDED → RETIRED (Retire)

### Control — Control Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → INACTIVE (Deactivate)
- INACTIVE → ACTIVE (Reactivate)
- DRAFT → RETIRED (Retire)
- ACTIVE → RETIRED (Retire)
- INACTIVE → RETIRED (Retire)

### Risk — Risk Lifecycle

Starts at **IDENTIFIED**.
Final: **CLOSED**, **MATERIALIZED**.

Moves:
- IDENTIFIED → ASSESSED (Assess)
- ASSESSED → MITIGATING (Mitigate)
- ASSESSED → ACCEPTED (Accept)
- MITIGATING → ACCEPTED (Accept)
- ACCEPTED → CLOSED (Close)
- MITIGATING → CLOSED (Close)
- IDENTIFIED → MATERIALIZED (Materialize)
- ASSESSED → MATERIALIZED (Materialize)
- MITIGATING → MATERIALIZED (Materialize)
- ACCEPTED → MATERIALIZED (Materialize)

### Audit Case — Audit Case Lifecycle

Starts at **PLANNED**.
Final: **CLOSED**, **CANCELLED**.

Moves:
- PLANNED → IN PROGRESS (Start)
- IN PROGRESS → REPORTED (Report)
- REPORTED → CLOSED (Close)
- PLANNED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)

### Compliance Requirement — Compliance Requirement Lifecycle

Starts at **IDENTIFIED**.
Final: **RETIRED**.

Moves:
- IDENTIFIED → ACTIVE (Activate)
- IDENTIFIED → NOT APPLICABLE (Mark Not Applicable)
- NOT APPLICABLE → ACTIVE (Activate)
- ACTIVE → RETIRED (Retire)
- NOT APPLICABLE → RETIRED (Retire)

### Finding — Finding Lifecycle

Starts at **OPEN**.
Final: **CLOSED**, **RISK ACCEPTED**.

Moves:
- OPEN → IN REMEDIATION (Agree Action)
- IN REMEDIATION → REMEDIATED (Remediate)
- REMEDIATED → CLOSED (Verify)
- REMEDIATED → IN REMEDIATION (Reject Fix)
- OPEN → RISK ACCEPTED (Accept Risk)
- IN REMEDIATION → RISK ACCEPTED (Accept Risk)

### Risk Assessment — Risk Assessment Lifecycle

Starts at **DRAFT**.
Final: **SUPERSEDED**.

Moves:
- DRAFT → SUBMITTED (Submit)
- SUBMITTED → DRAFT (Return)
- SUBMITTED → APPROVED (Approve)
- APPROVED → SUPERSEDED (Supersede)

### Risk Treatment — Risk Treatment Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Filing — Filing Lifecycle

Starts at **REQUIRED**.
Final: **ACCEPTED**, **REJECTED**, **WITHDRAWN**.

Moves:
- REQUIRED → IN PREPARATION (Start)
- IN PREPARATION → SUBMITTED (Submit)
- REQUIRED → SUBMITTED (Submit)
- SUBMITTED → ACCEPTED (Accept)
- SUBMITTED → REJECTED (Reject)
- REQUIRED → WITHDRAWN (Withdraw)
- IN PREPARATION → WITHDRAWN (Withdraw)
- SUBMITTED → WITHDRAWN (Withdraw)

### Obligation — Obligation Lifecycle

Starts at **PENDING**.
Final: **MET**, **WAIVED**.

Moves:
- PENDING → MET (Meet)
- PENDING → WAIVED (Waive)
- PENDING → BREACHED (Breach)
- BREACHED → MET (Cure)
- BREACHED → WAIVED (Waive)

### Loss Event — Loss Event Lifecycle

Starts at **IDENTIFIED**.
Final: **CLOSED**, **WITHDRAWN**.

Moves:
- IDENTIFIED → ASSESSED (Assess)
- ASSESSED → CLOSED (Close)
- IDENTIFIED → WITHDRAWN (Withdraw)
- ASSESSED → WITHDRAWN (Withdraw)

## Roles

- **User** — reads 104 of 104 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
