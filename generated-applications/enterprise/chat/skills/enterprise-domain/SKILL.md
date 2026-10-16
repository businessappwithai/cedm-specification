---
name: enterprise-domain
description: What the records of Enterprise are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Enterprise, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Enterprise

Enterprise Management, built on the CEDM common foundation.

Everything below is the application's own description of itself, taken from the model it was generated from. Use these names when you talk to the person, and pass the record type's name as `entity` to the tools.

## Records

### Activity

A planned or completed customer-facing interaction, such as a call, meeting, email, visit or follow-up, recorded against a party or opportunity. Activities are the trail of contact behind a commercial relationship. They show what was done for a customer or prospect, by whom and what comes next, so sales and service teams do not work blind. Logged by sales and service staff as they plan or complete interactions, and by integrations such as email and calendar sync; read when preparing for a contact or reviewing account history. Activities connect to the commercial parties and opportunities they…

Readable by every signed-in person.

Fields:
  - **Code** — An optional reference number or code for the activity. Used when an external system, such as a calendar or telephony system, supplies its own reference, so the same interaction is not logged twice.
  - **Subject** (required) — A one-line statement of what the interaction is about. Written when the activity is created and shown in every list of activities, so it should say the topic plainly, such as "Renewal pricing call". The subject is what identifies the activ…
  - **Activity Type** (required, one of the Activity Activity Type values) — The kind of interaction. Chosen when the activity is logged; it decides how the activity is counted in activity reports and which fields matter (a meeting has a location, an email does not). Read with direction — an outbound call is a sale…
  - **Direction** (one of the Activity Direction values) — Whether the interaction was started by the company, by the customer, or was internal. Recorded with the activity type; it separates the sales team's outreach from requests the customer made. Used together with the activity type in activity…
  - **Status** (required, one of the Activity Status values) — Where the activity stands — still to happen, under way, held, or called off. Moved on as the activity happens; planned activities whose start has passed appear as overdue follow-ups. A completed activity needs its completion time and shoul…
  - **Priority** (required, one of the Activity Priority values) — How urgently the activity should be done. Set when planning follow-ups so the owner's list puts the important ones first. Independent of status; a high-priority planned activity that is overdue is the first thing a manager looks at. Can wa…
  - **Scheduled Start** — When the activity is planned to start. Set when the activity is planned; it puts the activity on the owner's calendar and makes it overdue once passed. Read with the scheduled end; for an activity logged after the fact it is when the inter…
  - **Scheduled End** — When the activity is planned to end. Set for meetings and visits so that calendars show their length; calls and emails usually leave it empty. Must not be earlier than the scheduled start.
  - **Completed At** — When the activity was actually held or finished. Filled in when the activity is marked completed; reports of activity volume count by this time. Required once the status is completed.
  - **Location** — Where a meeting or visit takes place. Given for meetings and visits — an address, a room, or the link to an online meeting. Not meaningful for calls, emails, tasks or notes.
  - **Outcome** — What came out of the interaction — decisions, commitments and next steps. Written when the activity is completed; it is the part of the record colleagues read later. The outcome often leads to a new planned activity or to a change in the o…
  - **Notes** — Further detail about the interaction. Agenda, discussion points or background that do not belong in the subject or the outcome. Free text; no rule or process reads it.
  - **Contact** (a Person) — The person at the customer or lead who took part in the interaction. Chosen so that the history shows who said what, and so that the next activity is addressed to the right person. One main contact per activity; others can be named in the…

### Activity Activity Type

The values of activity activity type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Activity Direction

The values of activity direction, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Activity Priority

The values of activity priority, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Activity Status

The values of activity status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Approval

A request for, or the outcome of, an approval decision about a business object, process, task or controlled change. Approvals are the checkpoints where a person with authority says yes or no. Recording them as data, not email, shows who approved what and when, and lets processes wait for or react to the decision. Created when something needs sign-off, decided by the approver, and read afterwards by anyone who needs to show the control was applied. An approval refers to the thing it approves and to the approver; workflow and access governance use it to gate steps. An approval is pending when r…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Approval Status values) — Where the approval request is in its path to a decision. Moved by the approver and the workflow; a gated step proceeds only when the approval is COMPLETED with a positive decision. Requested and waiting to be picked up. Under review by the…
  - **Subject** (required) — A one-line statement of what is to be approved. Shown in the approver's list, so it should name the item and the amount if there is one. Identifies the approval on screens; the item itself is named by its kind and reference.
  - **Item Type** (required) — The kind of item awaiting a decision, such as "Purchase requisition" or "Expense claim". Set by the process that raises the approval; reports group approvals by it. Read with the item reference to find the item.
  - **Item Reference** (required) — The number or reference of the item awaiting a decision. Set by the process that raises the approval, such as "PR-2024-0871"; the approver uses it to open the item. Together with the item type it identifies exactly one record.
  - **Approval Level** (required) — Which level of a multi-level approval this is. Level 1 is decided first; a higher level is raised only after the level below is approved. Single-level approvals use level 1.
  - **Amount** — The value of the item, where the decision depends on it. Copied from the item when the approval is raised; it decides which approval limit applies. Empty for approvals that carry no amount, such as a document review.
  - **Requested At** (required) — When the decision was asked for. Recorded when the approval is raised; the time to decide is measured from it. Precedes the decision time.
  - **Due At** — When the decision is needed by. Set by the process from its service level; an approval still pending after it is overdue. Overdue approvals are escalated.
  - **Decided At** — When the approver decided. Recorded with the decision; it is the evidence of when the control operated. Present once the approval is approved or rejected.
  - **Decision Comment** — What the approver said about the decision. Required in practice for rejections, so the requester knows what to change. Kept with the decision as audit evidence.
  - **Approver** (required, a Person) — The person asked to decide. Chosen by the process from the approval rules; the approval appears in this person's list. One approver per approval; several approvers mean several approvals. The approver should hold the authority the item nee…
  - **Task** (a Task) — The work item through which the approver is asked to decide. Linked when the approval is raised through the task list. At most one task per approval. Completing the task records the decision on the approval.

### Approval Status

The values of approval status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Assignment

The allocation of responsibility for a task or workflow activity to an eligible user, role, team or organisational context. Work only gets done when someone is responsible for it. An assignment records who that is, so tasks do not stall unowned and ownership changes leave a trail. Created when a task is routed, claimed or reassigned; read by work queues, escalation rules and audits of workload. An assignment connects a task or activity to the person or group who must act on it. An assignment is pending when offered, active once accepted or in effect, completed when the work is done, and cance…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Assignment Status values) — Where the assignment stands in its life. Moved by the workflow and by the assignee; work queues show ACTIVE assignments. Offered but not yet accepted or in effect. In effect; the assignee is responsible for the work. The work is done and t…
  - **Assignment Number** (required) — The reference number that identifies this allocation of work to an assignee. Assigned by the system when the work is allocated and quoted in task lists and audit reports. Unique across all assignments.
  - **Work Type** — The kind of work item assigned when it is not a task, such as "Customer case". Given with the work reference when the work is not a task. Empty when the assignment is for a task.
  - **Work Reference** — The number of the work item assigned when it is not a task. Lets the assignee open the work item. Read together with the work type.
  - **Role** (required, one of the Assignment Role values) — The part the assignee plays in the work. Chosen when assigning; only one assignee is normally responsible for a piece of work at a time. Lets the same work be assigned to a doer, a reviewer and someone kept informed. Does the work and answ…
  - **Start Date** (required) — The day from which the assignee becomes responsible for the work. Set by whoever assigns the work, so the assignee knows when to start. Must not be later than the end date.
  - **End Date** — When the assignment is planned to end. Set for time-boxed work; empty when it lasts until the work is done. Workload planning ignores the assignment after this date.
  - **Allocation Percent** — The share of the assignee's working time the work takes. Summed across a person's active assignments to see whether they are overloaded. Between 0 and 100.
  - **Notes** — Instructions, background or caveats the assignee needs in order to carry out the work. Written by whoever assigns the work and read by the assignee when opening the task. Free text.
  - **Assignee** (a Person) — The person the work is assigned to. Chosen when assigning to an individual; the work appears in their list. At most one person per assignment. A person, a team or both may be given; at least one must be.
  - **Team** (a Team) — The team the work is assigned to. Chosen when a team owns the work and any member may pick it up. At most one team per assignment. When both a team and a person are given, the person works on the team's behalf.
  - **Task** (a Task) — The task being assigned. Chosen when the work is a task; most assignments are. At most one task per assignment; a task may have several assignments over time. Completing the task completes its responsible assignment.

### Assignment Role

The values of assignment role, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Assignment Status

The values of assignment status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Business Event

An immutable record that a meaningful business fact occurred, published for other domains without replacing the original transaction. Business events let one part of the organisation tell the rest that something happened, such as an order shipped or a payment settled, without those parts sharing databases. The event is a stable, auditable announcement of the fact. Written when a governed fact is confirmed; consumed by other systems and processes that react to it, and kept for audit. An event refers to the transaction that caused it but does not replace it; consumers rely on the event rather t…

Readable by every signed-in person.

Fields:
  - **Occurred At** — When the business fact happened, as opposed to when it was published. Set from the source transaction's time; consumers order and window events by it.
  - **Event Name** (required) — The name of the fact, written in the past tense, such as "OrderPlaced" or "PaymentReceived". Set by the process that raises the event; subscribers choose events by name. One name per kind of fact, used consistently by every process.
  - **Source Area** — The part of the business or system the fact comes from, such as "Sales" or "Warehouse". Lets subscribers and operators tell where an event originated. Set by the raising process.
  - **Record Type** — The kind of record the event is about, such as "Shipment". Read with the record identifier to open the record. The record remains the authoritative statement of the facts.
  - **Record** — The identifier of the record the event is about. Lets a subscriber fetch the current record if it needs more than the payload. Together with the record type it identifies the record.
  - **Correlation Reference** — A reference shared by all events of one business transaction, such as the sales order number. Lets the events of one order or case be followed end to end. Empty for events that stand alone.
  - **Payload** — The facts of the event, as structured data. Read by subscribers so that most of them need not look the record up. Copies facts as they were when the event happened; it is not updated later.
  - **Publication Status** (required, one of the Business Event Publication Status values) — Whether the event has reached its subscribers. Moved on by the publishing service; operators watch failed events. The fact itself is valid whatever the publication status. Written down, not yet published. Delivered to every subscriber. Del…
  - **Published At** — The date and time the event was handed to every subscriber that wanted it. Stamped by the publishing service and used to check delivery delays. Present once the event is published.
  - **Attempt Count** (required) — How many times delivery has been attempted. Increased by each delivery attempt; operators look at events with many attempts. Delivery is abandoned after the configured maximum.

### Business Event Publication Status

The values of business event publication status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Business Transaction

A recorded business transaction that commits, changes or represents a business state or obligation, in a form common to every domain. Many different activities, such as sales, purchases, transfers and adjustments, share the same bones: a number, a date, an amount, the parties and products involved, and a status. This record carries those common facts so they can be reported, audited and reversed uniformly. Created when a business transaction is entered or generated by a process; moved through approval and posting; read for history, exposure and reporting. A transaction belongs to an Organizat…

Readable by every signed-in person.

Fields:
  - **Transaction Number** (required) — The number under which the transaction is known to users and partners. Allocated from a number series for its type; unique within the owning context and transaction type, and quoted on documents.
  - **Transaction Type** (required) — The kind of transaction, such as SALE, PURCHASE, TRANSFER or ADJUSTMENT. Chosen when the transaction is created; decides numbering, approval rules and how posting treats the amount.
  - **Transaction Date** (required) — The business date and time of the transaction. Entered or defaulted to now; used for period assignment, reporting and the order of events.
  - **Status** (required, one of the Business Transaction Status values) — How far the transaction has progressed from draft to completion. Moved by the business process as steps are performed; posted transactions are no longer changed. Being entered; nothing is committed. Submitted and awaiting approval. Authori…
  - **Currency** (a Currency) — The currency in which the transaction's amounts are expressed. Set when the transaction is created; the total and any line amounts are in this currency.
  - **Total Amount** — The total value of the transaction in its currency. Calculated from its lines or entered; non-negative unless the transaction type explicitly allows signed amounts.
  - **Reference Number** — An external reference for the transaction, such as a customer's purchase order number. Entered to link the transaction to a partner's document; used for search and reconciliation.
  - **Organization** (a Organization) — The organisation on whose behalf the transaction is made. Set when the transaction is created; scopes numbering, approvals and ledger postings. At most one organisation; when none is given the transaction belongs to the default business co…
  - **Location** (a Location) — The place at which the transaction occurred or applies. Set when location matters for tax, stock or reporting. At most one location. Drives location-specific rules such as tax and inventory.

### Business Transaction Status

The values of business transaction status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Classification

A reusable classification scheme or category value that classifies records consistently instead of by free-text labels. Free-text categories drift: one person writes "Premium", another "premium". A classification gives the organisation one agreed list, so reporting, rules and searches group things the same way. Maintained by data stewards; chosen by users on the records they classify; read by reports and rules that group by category. Many kinds of record can point at a classification, which is what lets different domains share one vocabulary. Code and identity stay stable, and history is neve…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The stable code of the classification, such as ENTERPRISE. Assigned by the steward; used in rules and integrations, so it should not change.
  - **Name** (required) — The display name of the classification. Shown in pick-lists and reports; can be reworded without changing the code.
  - **Scheme** (required) — The scheme the value belongs to, such as NACE, SEGMENT or RISK-CAT. Chosen when the value is created; records are classified within one scheme at a time. Values are unique within their scheme.
  - **Description** — Explains what the classification value covers and what is left out of it. Read by people classifying a record, so it should name clear examples. Should say what belongs in the value and what does not.
  - **Level** — The depth of the value in its hierarchy — 1 for the top. Used to report at a chosen level. One more than its parent's level.
  - **Status** (required, one of the Classification Status values) — Whether the classification value may still be assigned to new records. Set to retired by the data owner when a value is replaced or no longer wanted. Records keep retired values for history. May be assigned to records and appears in pick l…
  - **Parent** (a Classification) — The broader value this one sits under. Builds the hierarchy. At most one parent, in the same scheme. Cannot be itself.

### Classification Status

The values of classification status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### ERP

The root record of an enterprise application context, naming the installation and the defaults for everything managed inside it. An ERP installation needs one place that says what it is, which currency it reports in and which time zone and language apply. Every organisation, party, product and process belongs to that context, so this record is where scoping starts. Created once when an installation is set up; read as the context for every other record and changed rarely, by administrators. The context aggregates its Organizations and holds the shared Parties, Locations, Products, Business Pro…

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short unique code of the installation, such as ACME-PROD. Chosen at setup; used in integrations and environment names, so it should not change.
  - **Name** (required) — The name of the installation as users see it. Shown in the application header and on reports.
  - **Description** — A description of what the installation covers and who it is for. Written by the administrator; helps new users tell environments apart.
  - **Status** (required, one of the ERP Status values) — Whether the installation is being set up, live, paused or closed. Moved by administrators; only ACTIVE installations accept business transactions. Being configured; not yet live. Live and in use. Paused, for example during a migration; no…
  - **Base Currency** (a Currency) — The currency in which the installation reports consolidated figures. Chosen at setup; other currencies are converted to it for group reporting.
  - **Timezone** — The default time zone for displaying and interpreting dates and times. Chosen at setup; users and organisations may override it.
  - **Locale** — The default language and regional formatting for the installation. Chosen at setup; controls number, date and currency formats where a user has no preference.

### ERP Status

The values of erp status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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
  - **E Rp** (a ERP) — The ERP this Location belongs to.

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
  - **E Rp** (a ERP) — The ERP this Organization belongs to.

### Organization Membership

A relationship that connects a user or party to an organisation, with its membership status and role context. People belong to organisations in different ways: as staff, partners, members or contractors. The membership says that a person belongs, in what capacity and whether it is current, which access and responsibilities are then based on. Created when someone is invited or added; activated on acceptance; ended when they leave; read by access control and administration. A membership links a User or Party to an Organization. A membership is pending until accepted, active while in force, comp…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Organization Membership Status values) — Whether the person currently belongs to the organisation. Moved by administrators or the invitation process; access based on membership applies only while ACTIVE. Offered or requested, not yet effective. In force; the person belongs to the…
  - **Membership Role** (required) — The capacity in which the person belongs, such as "Accounts payable clerk" or "Board member". Shown in organization charts and member lists. Access rights come from access grants, not from this text.
  - **Membership Type** (required, one of the Organization Membership Membership Type values) — The kind of membership. Chosen when recording it; it decides which processes apply, such as payroll. External members see only what is shared with them. An employee of the organization. Someone working for the organization under contract.…
  - **Is Primary** (required) — Whether this is the person's main membership. The primary membership decides the person's home unit in reports and approvals. A person has at most one primary membership at a time.
  - **Start Date** (required) — The day the person or party officially became a member of the organisation. Recorded when they join; it is used for access rights, headcount reports and membership history. It cannot be later than the end date.
  - **End Date** — The day the membership stops, after which the person is no longer part of the organisation. Recorded when the member leaves and left empty while the membership is open-ended. Access tied to the membership should end with this date.
  - **Person** (required, a Person) — The person who is a member. Chosen when recording the membership. Every membership is for exactly one person. The person's memberships make up their place in the organization.
  - **Organization** (required, a Organization) — The organization or unit the person belongs to. Chosen when recording the membership. Every membership is in exactly one organization. The organization's member list is drawn from its active memberships.

### Organization Membership Membership Type

The values of organization membership membership type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Organization Membership Status

The values of organization membership status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

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
  - **E Rp** (a ERP) — The ERP this Party belongs to.
  - **Business Transaction** (a Business Transaction) — The BusinessTransaction this Party belongs to.

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

### Team

A collaborative grouping of people used to assign work, roles, ownership and accountability. Teams let work and responsibility be given to a group rather than a single person, and let access and reporting follow the group. A team belongs to an organisation, so each unit manages its own groups. Set up by managers or administrators; chosen on tasks and records; read in reports. A team belongs to one organisation. A team is created, used while it works together, and left unused when disbanded. History keeps its name. The "Warehouse Leeds" team is responsible for stock counts at the Leeds site.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The short code of the team, such as WH-LDS. Gives a stable way to refer to the team in imports and rules. Unique; used in imports and rules. Read with the name.
  - **Name** (required) — The descriptive name of the team, such as Customer Support Tier 2. Entered by the organization administrator; shown in assignment pickers and reports, and may change without affecting the team's identity. What people look for when assignin…
  - **Purpose** — A short description of what the team does and what work it should receive. Free text entered by the administrator and read by people deciding where to route work. Free text.
  - **Team Type** (required, one of the Team Team Type values) — What kind of team it is. Decides how long it is expected to exist. Project teams are disbanded when the project ends. A standing team doing ongoing work. A team formed for one project. A team working a support or service queue. A sales tea…
  - **Email Address** — The shared mailbox that reaches the whole team. Notifications addressed to the team are sent here instead of to each individual member. Notifications to the team go here instead of to each member.
  - **Status** (required, one of the Team Status values) — Whether the team is still operating and can be given work. Set to inactive when the team is disbanded; inactive teams receive no new assignments. The team is working and can be assigned work. The team has been disbanded and receives no new…
  - **Organization** (required, a Organization) — The organisation the team belongs to. Chosen when the team is created. Exactly one organisation. Decides whose structure the team is part of.
  - **Department** (a Department) — The department the team is part of. Set where teams sit inside departments. At most one. Used in departmental reporting.
  - **Lead** (a Person) — The person who leads the team. Receives escalations and reports. One per team. Usually a team member.

### Team Status

The values of team status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Team Team Type

The values of team team type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Activity Activity Type

- **CALL** — A telephone or video call with the customer or prospect.
- **MEETING** — A meeting in person or online with one or more people from the account.
- **EMAIL** — An email exchange that is worth keeping on the account history.
- **VISIT** — A visit to the customer's premises or to a site.
- **TASK** — A piece of follow-up work done for the account without contacting it, such as preparing a quote.
- **NOTE** — A note recorded for the account without any interaction, such as information heard from a third party.

### Activity Direction

- **INBOUND** — The customer or prospect started the interaction.
- **OUTBOUND** — Someone from the company started the interaction.
- **INTERNAL** — A discussion inside the company about the account, without the customer.

### Activity Priority

- **LOW** — Can wait until more pressing work is done.
- **NORMAL** — To be done on the planned date.
- **HIGH** — Needed promptly because a deal or a customer relationship depends on it.

### Activity Status

- **PLANNED** — Scheduled for the future and not yet started.
- **IN PROGRESS** — Under way now, for example a meeting that has started.
- **COMPLETED** — Held, with the outcome recorded.
- **CANCELLED** — Will not take place; kept so the history shows it was planned.

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

### Approval Status

- **PENDING** — Requested and waiting to be picked up.
- **ACTIVE** — Under review by the approver.
- **COMPLETED** — Decided; the decision is final evidence.
- **CANCELLED** — Withdrawn by the requester before a decision.

### Assignment Role

- **RESPONSIBLE** — Does the work and answers for it being done.
- **REVIEWER** — Checks the work once it is done.
- **CONTRIBUTOR** — Helps with part of the work.
- **OBSERVER** — Is kept informed but does no work.

### Assignment Status

- **PENDING** — Offered but not yet accepted or in effect.
- **ACTIVE** — In effect; the assignee is responsible for the work.
- **COMPLETED** — The work is done and the responsibility ended.
- **CANCELLED** — Withdrawn or replaced before completion.

### Attachment Status

- **ACTIVE** — Attached and part of the record's evidence.
- **WITHDRAWN** — Removed from the record's evidence, but kept for the history.

### Business Event Publication Status

- **RECORDED** — Written down, not yet published.
- **PUBLISHED** — Delivered to every subscriber.
- **FAILED** — Delivery failed and will be retried.
- **ABANDONED** — Delivery was given up after repeated failures; an operator has to act.

### Business Transaction Status

- **DRAFT** — Being entered; nothing is committed.
- **OPEN** — Submitted and awaiting approval.
- **APPROVED** — Authorised but not yet posted.
- **POSTED** — Recorded in the books; it can now only be reversed, not edited.
- **COMPLETED** — Fully performed and closed out.
- **CANCELLED** — Withdrawn before being posted; no effect on the books.
- **REVERSED** — Posted and then undone by a reversing transaction; the original stays on record.

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

### Classification Status

- **ACTIVE** — May be assigned to records and appears in pick lists.
- **RETIRED** — No longer assigned, though existing records keep it.

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

### Currency Status

- **ACTIVE** — Available for use on new prices, documents and payments.
- **INACTIVE** — Temporarily not offered, for example while a market is closed; it can be reactivated.
- **RETIRED** — No longer in use, such as a replaced national currency; historical amounts keep it.

### Department Status

- **ACTIVE** — The department exists and can receive people, positions and work.
- **INACTIVE** — The department has been closed or merged away; it stays on record for history.

### ERP Status

- **DRAFT** — Being configured; not yet live.
- **ACTIVE** — Live and in use.
- **SUSPENDED** — Paused, for example during a migration; no new business activity.
- **RETIRED** — Closed down; kept for history.

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

### Organization Membership Membership Type

- **EMPLOYEE** — An employee of the organization.
- **CONTRACTOR** — Someone working for the organization under contract.
- **PARTNER USER** — A person from a customer, supplier or partner given access.
- **BOARD MEMBER** — A director or member of a governing body.
- **VOLUNTEER** — An unpaid member, such as a volunteer.

### Organization Membership Status

- **PENDING** — Offered or requested, not yet effective.
- **ACTIVE** — In force; the person belongs to the organisation.
- **COMPLETED** — Ended normally. A final state.
- **CANCELLED** — Withdrawn before it took effect. A final state.

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

### Team Status

- **ACTIVE** — The team is working and can be assigned work.
- **INACTIVE** — The team has been disbanded and receives no new work.

### Team Team Type

- **OPERATIONAL** — A standing team doing ongoing work.
- **PROJECT** — A team formed for one project.
- **SUPPORT** — A team working a support or service queue.
- **SALES** — A sales team or territory.

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

### ERP — ERP Lifecycle

Starts at **DRAFT**.
Final: **RETIRED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → SUSPENDED (Suspend)
- SUSPENDED → ACTIVE (Resume)
- ACTIVE → RETIRED (Retire)
- SUSPENDED → RETIRED (Retire)

### Team — Team Lifecycle

Starts at **ACTIVE**.

Moves:
- ACTIVE → INACTIVE (Disband)
- INACTIVE → ACTIVE (Reactivate)

### Organization Membership — Organization Membership Lifecycle

Starts at **PENDING**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- PENDING → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- PENDING → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Classification — Classification Lifecycle

Starts at **ACTIVE**.
Final: **RETIRED**.

Moves:
- ACTIVE → RETIRED (Retire)

### Approval — Approval Lifecycle

Starts at **PENDING**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- PENDING → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- PENDING → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Assignment — Assignment Lifecycle

Starts at **PENDING**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- PENDING → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- PENDING → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Activity — Activity Lifecycle

Starts at **PLANNED**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- PLANNED → IN PROGRESS (Start)
- IN PROGRESS → COMPLETED (Complete)
- PLANNED → COMPLETED (Complete)
- PLANNED → CANCELLED (Cancel)
- IN PROGRESS → CANCELLED (Cancel)

### Business Event — Business Event Lifecycle

Starts at **RECORDED**.
Final: **PUBLISHED**, **ABANDONED**.

Moves:
- RECORDED → PUBLISHED (Publish)
- RECORDED → FAILED (Fail)
- FAILED → PUBLISHED (Publish)
- FAILED → ABANDONED (Abandon)

### Business Transaction — Business Transaction Lifecycle

Starts at **DRAFT**.
Final: **CANCELLED**, **REVERSED**.

Moves:
- DRAFT → OPEN (Open)
- OPEN → APPROVED (Approve)
- APPROVED → POSTED (Post)
- POSTED → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- OPEN → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)
- POSTED → REVERSED (Reverse)
- COMPLETED → REVERSED (Reverse)

## Roles

- **User** — reads 80 of 80 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
