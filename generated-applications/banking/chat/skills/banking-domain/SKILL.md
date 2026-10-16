---
name: banking-domain
description: What the records of Banking are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.
whenToUse: Before searching, opening or explaining any record of Banking, and whenever the person uses a term of the business — a record type, a status, a role or a report.
---

# Banking

Banking and Financial Services, built on the CEDM common foundation.

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

### Bank Loan

A loan in which a bank advances funds to a borrower on agreed terms of repayment. A loan is a long-running promise: money goes out now and comes back, with interest, over time. This record carries the terms and the loan's standing, so servicing, risk and reporting all work from the same facts. Created when a borrower applies; progressed through approval and drawdown; watched through repayment until it is paid off or defaults; read by servicing, collections, risk and finance. The loan links a borrowing Party, the lending Organization and the Currency of the amounts, so who owes whom and in wha…

Readable by every signed-in person.

Fields:
  - **Loan Number** (required) — The reference number under which the bank services the loan. Allocated by the bank and quoted on statements and in correspondence; unique across loans.
  - **Principal Amount** (required) — The amount of money advanced, before interest. Set at approval and fixed for the life of the loan; interest and repayments are calculated from it. Must be greater than zero.
  - **Interest Rate** (required) — The agreed annual interest rate charged on the outstanding balance. Entered as a fraction (for example 0.065 for 6.5%); used with the repayment schedule to calculate interest due.
  - **Start Date** (required) — The date from which the loan runs and interest begins to accrue. Normally the drawdown date; the repayment schedule is built from it.
  - **Maturity Date** (required) — The date by which the loan must be repaid in full. Agreed at approval; must be later than the start date. Collections treats balances outstanding after it as overdue.
  - **Status** (required, one of the Bank Loan Status values) — Where the loan stands in its life. Moved by credit, servicing and collections processes; repayment collection applies to ACTIVE and DELINQUENT loans. Requested by the borrower and under assessment; no funds have moved. Credit has been appr…
  - **Interest Type** (required, one of the Bank Loan Interest Type values) — Whether the rate is fixed or follows a reference rate. Decides whether interest must be reset periodically. Floating loans state their reference rate and margin. The rate stays the same for the term. The rate follows a reference rate plus…
  - **Repayment Frequency** (required, one of the Bank Loan Repayment Frequency values) — How often the borrower must pay instalments back to the bank. Chosen when the loan is set up; the repayment schedule is built from it. Bullet loans are repaid in one payment at maturity. An instalment falls due every month. An instalment f…
  - **Outstanding Principal** — How much principal remains to be repaid. Updated with each repayment; shown in debt reports. Not more than the principal.
  - **Covenants** — The financial and other conditions the borrower must keep. Monitored by treasury; a breach can make the loan repayable. Taken from the agreement.
  - **Borrower** (required, a Party) — The party that owes the loan. Chosen at application; statements and legal notices are addressed to this party. Exactly one borrower; joint borrowers would be modelled by a joint party. Identifies who is bound to repay.
  - **Lender** (required, a Organization) — The organisation that lends the money. Set at application; determines which bank entity books the loan and receives repayments. Exactly one lender: every loan is booked by a single lending entity. Identifies whose balance sheet carries the…
  - **Currency** (required, a Currency) — The currency in which the loan is denominated. Fixed at approval; principal, interest and repayments are all in this currency. Exactly one currency, so every amount on the loan is in the same money. Keeps amounts unambiguous across multi-c…

### Bank Loan Interest Type

The values of bank loan interest type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Bank Loan Repayment Frequency

The values of bank loan repayment frequency, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Bank Loan Status

The values of bank loan status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Bank Reconciliation

A reconciliation of a bank account's statement transactions against internal payments and accounting records up to a cut-off. Banks and the books record the same money from two sides. Reconciliation proves they agree, or explains the difference, which is the control that catches missing, duplicate or wrong entries. Performed at period end or as often as the bank feed arrives; read by treasury, accounting and auditors as evidence the cash balance is right. A reconciliation covers one BankAccount and takes in the BankTransactions of the statement period; matched items link to payments and journ…

Readable by every signed-in person.

Fields:
  - **Effective At** — The cut-off date and time up to which transactions are reconciled. Chosen when the reconciliation is started, usually the statement date; transactions after it belong to the next reconciliation.
  - **Reconciliation Number** (required) — The reference number that identifies this reconciliation in the finance team's records. Assigned by the system when the reconciliation is opened and cited in month-end checklists. Unique across all reconciliations.
  - **Period Start** (required) — The first day of the statement period being matched against the books. Set by the preparer when opening the reconciliation, alongside the period end. Not later than the period end.
  - **Period End** (required) — The last day of the period reconciled, usually the statement date. Set when opening the reconciliation. Reconciliations of one account do not overlap.
  - **Statement Balance** (required) — The closing balance printed on the bank's statement for the period. Copied by the preparer from the statement and compared with the book balance to find differences. Held in the bank account's currency.
  - **Book Balance** (required) — The balance of the bank account in the company's books at the period end. Taken from the ledger. In the account's currency.
  - **Difference** — Statement balance minus book balance. Must be explained by the unmatched items before sign-off. The one amount that may be negative.
  - **Unmatched Count** — How many statement lines and book items are still unmatched. Falls as matching proceeds. Each must be explained before sign-off.
  - **Explanation** — What explains the remaining difference. Written by the preparer, such as uncleared cheques and deposits in transit. Read by the reviewer.
  - **Reconciled At** — The date and time the reviewer signed off that the books agree with the bank. Stamped automatically at sign-off. Present once the reconciliation is reconciled.
  - **Status** (required, one of the Bank Reconciliation Status values) — Whether the matching is in progress, awaiting review or signed off. Moves on as the preparer submits the work and the reviewer signs it off. Reconciled periods are locked against further change. Matching of transactions is still in progres…
  - **Bank Account** (required, a Bank Account) — Exactly one account; a reconciliation never mixes accounts. Bank account reconciled. Defines reconciliation boundary. Treasury close and audit. Matched evidence remains traceable.
  - **Prepared By** (a Person) — The finance person who did the matching and compiled the reconciliation. Recorded when the reconciliation is submitted for review. Exactly one preparer is named; it stays empty until submission. Names who did the work, so segregation of du…

### Bank Reconciliation Status

The values of bank reconciliation status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Bank Transaction

Represents external financial-institution evidence of a bank-side movement while keeping reconciliation, internal payment, and accounting meaning separate. BankTransaction says what the bank reported. Payment says what the organization recognized as a payment. PaymentAllocation says how payment is applied to claims. JournalEntry says how the event is recognized in accounting. Central to treasury, bank-feed ingestion, accounts receivable, accounts payable, cash management, reconciliation, audit, fee processing, and accounting. BankAccount provides the statement account. BankTransaction provide…

Readable by every signed-in person.

Fields:
  - **Transaction Number** (required) — Bank or internally assigned business reference for the statement transaction. Used for search, duplicate detection, reconciliation, investigation, and bank-feed integration. Must not be assumed to equal Payment.paymentNumber. Provides a pr…
  - **Transaction Date** (required) — Timestamp supplied by the bank or statement source for the transaction. Supports statement chronology, reconciliation windows, cash reporting, and investigation. May differ from Payment.paymentDate, Payment.valueDate, accounting posting da…
  - **Value Date** — Bank-provided economic value date for the transaction. Supports cash availability, interest, treasury analysis, reconciliation, and accounting interpretation. Separate from transactionDate because a bank may record and value a transaction…
  - **Transaction Type** (required, one of the Bank Transaction Transaction Type values) — Money received into the account. Money paid out of the account. Movement between the organisation's own accounts or accounts at the bank. A charge made by the bank for its services. Interest credited or debited by the bank. A reversal of a…
  - **Amount** (required) — Monetary value reported by the bank for this transaction. Used for matching, reconciliation, cash reporting, fee analysis, and accounting comparison. Currency is intrinsic to Money; direct comparison with Payment.amount is permitted only w…
  - **Status** (required, one of the Bank Transaction Status values) — Reported by the bank but not yet final; it may still change or fall away. Final on the bank's books and eligible as settlement evidence. Undone by the bank; no longer supports a payment being cleared. Did not complete; no money moved. Life…
  - **Reference** — Bank-provided remittance or transaction reference used to identify the underlying business event. Supports automatic and manual matching to Payment, Invoice, customer remittance, or supplier payment. It is a matching signal, not definitive…
  - **Description** — The narrative text the bank supplied with the transaction, such as payer name, memo or payment details. Stored as received; reconciliation staff read it to match the movement to a payment or investigate an exception. Descriptive evidence m…
  - **External Reference** — Unique processor, bank, statement-line, or gateway identifier supplied by the external source. Supports idempotent imports and duplicate detection across statement retrievals. External reference is evidence metadata and does not replace ba…
  - **Currency** (a Currency) — The Currency this BankTransaction belongs to.
  - **Account** (required, a Bank Account) — Bank account whose statement contains the transaction. Establishes cash-account context and reconciliation scope. Exactly one account is the source context for each BankTransaction. Matching is performed within the account and statement co…
  - **Counterparty** (a Party) — Bank-reported counterparty when identifiable. Supports candidate matching, sanctions/compliance workflows where applicable, and investigation. Optional because bank evidence may omit or obscure counterparty identity. Provides supporting ev…
  - **Bank Reconciliation** (a Bank Reconciliation) — The BankReconciliation this BankTransaction belongs to.

### Bank Transaction Status

The values of bank transaction status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Bank Transaction Transaction Type

The values of bank transaction transaction type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Collateral

An asset, guarantee or other value pledged to secure a loan, facility or other credit exposure. Collateral is what the lender can fall back on if the borrower fails to repay. Recording it, with the exposure it secures, lets risk and credit teams see how well covered a loan is. Registered when security is taken; revalued over time; read by credit risk and collections. Collateral secures a BankLoan or other facility; its value offsets the exposure. Collateral is taken, held, and released when the exposure is repaid. Corrections are recorded explicitly, not by editing past valuations. A commerci…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the pledge took effect. Set at registration; the loan is considered secured from this moment.
  - **Collateral Number** (required) — The unique reference by which the pledged item is known to credit officers and legal staff. Assigned when the collateral is recorded during credit approval. Unique across all collateral items.
  - **Collateral Type** (required, one of the Collateral Collateral Type values) — What kind of security is pledged, such as property, equipment, stock or a guarantee. Decides the valuation method and the haircut applied when lending value is calculated. Guarantees are promises by a third party, not assets. Land or build…
  - **Description** (required) — What the collateral is, precisely enough to identify it. Copied into the security agreement. Such as an address and land register number, or a serial number.
  - **Valuation Amount** (required) — The market value of the pledged item at its most recent valuation. Recorded from the valuation report and used to work out lending value after the haircut. Revalued periodically.
  - **Valuation Date** (required) — The day the current value of the collateral was assessed. Old valuations prompt credit risk staff to order a revaluation. Not in the future.
  - **Haircut Percent** (required) — The reduction the lender applies to the value for risk. Set by credit policy for the collateral type. Between 0 and 100.
  - **Lending Value** — The value the lender counts: valuation less the haircut. Compared with the secured exposure. Recomputed on each revaluation.
  - **Charge Rank** — The ranking of this lender's claim on the collateral — 1 for first-ranking. Recorded from the registration. Lower ranks are paid only after higher ones.
  - **Registered Date** — The day the charge was registered with the competent registry. Recorded on registration; protects the lender against third parties. Not every collateral type is registered.
  - **Released Date** — The day the lender gave up its claim on the collateral. Recorded by the credit team when the loan is repaid or the security is replaced. Present only once the collateral is released.
  - **Status** (required, one of the Collateral Status values) — Offered during credit approval; no charge yet. Charged in favour of the lender. Freed after repayment, so it no longer secures any loan. Taken by the lender after default. Whether the collateral currently secures a loan. Moved on as the ch…
  - **Bank Loan** (a Bank Loan) — The loan the collateral secures. Set when the pledge is registered. At most one loan; collateral may secure another type of facility instead. Links the security to the exposure it covers. Connects pledged value to credit exposure.
  - **Owner** (a Party) — Who owns the collateral. Recorded when it is pledged. One per item. May be a third party, such as a guarantor.
  - **Currency** (required, a Currency) — The currency of the values. Set when recording it. One per item. Values are converted for coverage in the loan's currency.

### Collateral Collateral Type

The values of collateral collateral type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Collateral Status

The values of collateral status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Credit

A monetary credit that reduces an amount owed or can be applied to charges, without being a cash payment. Customers are sometimes owed value that is not money in the bank: a goodwill gesture, a promotion, a correction. A credit holds that value so it can be applied to what the customer owes, with a clear trail. Issued by billing staff or rules; applied to charges or invoices; read when a customer asks why a bill was reduced. A credit belongs to a Customer. It does not itself change cash, accounting, tax or billing records; those follow from how it is applied. A credit is drafted, becomes acti…

Readable by every signed-in person.

Fields:
  - **Status** (required, one of the Credit Status values) — Whether the credit is being prepared, available to use, used up, or withdrawn. Moved by billing staff; only an ACTIVE credit can be applied to a charge or invoice. Being prepared by billing; it cannot yet be applied to any charge. Issued a…
  - **Credit Number** (required) — The reference number of the credit, such as CR-000087. Assigned when the credit is issued; quoted to the customer. Read with the customer.
  - **Reason** (required, one of the Credit Reason values) — Why the credit was given. Chosen when issued; reports use it to see why money is being given back. Decides the approval needed. Given to keep the customer's goodwill. Corrects an amount billed wrongly. Given for goods or services returned.…
  - **Amount** (required) — The total value of the credit when issued. Entered when issued; must not be negative. The starting point for the remaining amount.
  - **Remaining Amount** (required) — The part of the credit not yet applied to charges. Starts equal to the amount and falls as the credit is applied; never more than the amount. Compared with the amount to show how much is used.
  - **Currency** (required, a Currency) — The currency of the credit. Set from the customer or contract; credits apply only to charges in the same currency. Read with the amount.
  - **Issued On** (required) — The date the credit was issued. Set when issued; the credit may be applied from this date. Compared with charge dates.
  - **Description** — What the credit is for, as the customer will see it. Printed on the invoice where it is applied. Should let the customer recognise it.
  - **Applied Amount** — How much of the credit has been used. Increased each time it is applied to an invoice or charge. Not more than the amount.
  - **Granted Date** (required) — The day the credit was granted to the customer or account. Recorded by whoever grants the credit; the expiry period and any approval limit are counted from this date. Not later than the expiry date.
  - **Expiry Date** — The last day the credit can still be applied to a charge. Credit left unused after this day lapses and can no longer be applied to invoices or charges. Left empty when the credit never expires.
  - **Granted By** (a Person) — The person who decided to grant the credit. Recorded when the credit is granted, so a reviewer can see who authorised it and why. At most one person is recorded as granting each credit. Credits above an approval limit are checked against t…

### Credit Reason

The values of credit reason, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Credit Status

The values of credit status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Deposit

A deposit product or a deposit transaction: funds placed with a financial institution under agreed ownership and terms. Deposits are the bank's raw material and the customer's savings. A deposit record shows what was placed, by whom and on what terms, which interest, regulation and reporting depend on. Created when funds are placed; read by account servicing, interest calculation and compliance. A deposit is held with a financial institution for an owner and links to the account where it is held. Finalised financial evidence is corrected by compensating or superseding records and never by edi…

Readable by every signed-in person.

Fields:
  - **Effective At** — When the deposit took effect. Set when the funds are placed; interest runs from this moment.
  - **Deposit Number** (required) — Our reference for the deposit. Assigned when the deposit is arranged; matched to the bank's confirmation. Unique; the bank's own reference is kept separately.
  - **Bank Reference** — The bank's reference on its deposit confirmation. Entered from the confirmation; quoted when talking to the bank. Known once the bank confirms.
  - **Deposit Type** (required, one of the Deposit Deposit Type values) — What kind of deposit it is. Chosen when arranging it; it decides whether the money can be called back early. Call deposits have no fixed maturity date. Placed for a fixed term at a fixed rate. Repayable on demand or at short notice, at a v…
  - **Principal** (required) — The amount placed with the bank. Agreed when the deposit is arranged; leaves the funding account on the value date. Stated in the deposit's currency.
  - **Interest Rate Percent** (required) — The annual interest rate, in percent. Agreed with the bank; used with the day-count basis to compute interest. A call deposit's rate may change; the current rate is recorded.
  - **Day Count Basis** (required, one of the Deposit Day Count Basis values) — The convention used to count days when interest is calculated. Taken from the bank's terms when the deposit is arranged, so expected interest matches the bank's own figure. The same rate earns slightly more on actual/360 than on actual/365…
  - **Value Date** (required) — The day the money is placed and starts to earn interest. Agreed with the bank; the funding account is debited on this day. Must not be later than the maturity date.
  - **Maturity Date** — The day principal and interest are repaid. Agreed for time deposits; cash forecasts count the repayment on this day. Empty for call deposits.
  - **Expected Interest** — The interest the deposit will earn if held to maturity. Computed from principal, rate, day count and term; accrued period by period. The amount actually received is recorded when the deposit matures.
  - **Interest Received** — The interest the bank actually paid on the deposit. Recorded by treasury at maturity or when the deposit is broken early. Differences from the expected interest are investigated with the bank.
  - **Status** (required, one of the Deposit Status values) — Where the deposit stands, from arrangement through to repayment. Moved on by treasury as the money is placed, matures or is withdrawn early. Only active deposits count against the limits set for each bank. Agreed with the bank but not yet…
  - **Bank** (required, a Organization) — The bank the money is placed with. Chosen when arranging the deposit; counterparty exposure is summed per bank. Every deposit is with exactly one bank. Each bank has an exposure limit set by treasury policy.
  - **Funding Account** (a Bank Account) — The company account the money comes from and returns to. Debited on the value date and credited at maturity. One account per deposit. Must be in the deposit's currency.
  - **Currency** (required, a Currency) — The currency of the deposit. Chosen when arranging it. One currency per deposit. Principal and interest are both in it.

### Deposit Day Count Basis

The values of deposit day count basis, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Deposit Deposit Type

The values of deposit deposit type, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

Readable by every signed-in person.

Fields:
  - **Code** (required) — The value stored on every record that uses this list. Fixed once created.
  - **Name** (required) — What a person reads in the dropdown and on a record.
  - **Description** — What the value means to the business.
  - **Sequence** (required) — The position of the value in a dropdown, lowest first.
  - **Is Active** (required) — Whether the value is offered on new records.

### Deposit Status

The values of deposit status, maintained by the business: reword, reorder or retire a value here and every form that offers the list follows.

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

### Bank Loan Interest Type

- **FIXED** — The rate stays the same for the term.
- **FLOATING** — The rate follows a reference rate plus a margin.

### Bank Loan Repayment Frequency

- **MONTHLY** — An instalment falls due every month.
- **QUARTERLY** — An instalment falls due every three months.
- **SEMI ANNUAL** — An instalment falls due every six months.
- **ANNUAL** — An instalment falls due once a year.
- **BULLET** — The whole balance is repaid in one payment at maturity.

### Bank Loan Status

- **APPLICATION** — Requested by the borrower and under assessment; no funds have moved.
- **APPROVED** — Credit has been approved on agreed terms but funds are not yet advanced.
- **ACTIVE** — Funds advanced and repayments are being made as scheduled.
- **DELINQUENT** — A repayment is overdue; the loan is under collections attention and may be cured.
- **PAID OFF** — Fully repaid; a final state.
- **DEFAULTED** — Delinquency was not resolved and the bank treats the loan as in default; a final state.
- **CANCELLED** — Withdrawn or refused before any funds were advanced; a final state.

### Bank Reconciliation Status

- **OPEN** — Matching of transactions is still in progress.
- **IN REVIEW** — Submitted to the reviewer for sign-off.
- **RECONCILED** — Signed off, so the books agree with the bank.

### Bank Transaction Status

- **PENDING** — Reported by the bank but not yet final; it may still change or fall away.
- **POSTED** — Final on the bank's books and eligible as settlement evidence.
- **REVERSED** — Undone by the bank; no longer supports a payment being cleared.
- **FAILED** — Did not complete; no money moved.

### Bank Transaction Transaction Type

- **CREDIT** — Money received into the account.
- **DEBIT** — Money paid out of the account.
- **TRANSFER** — Movement between the organisation's own accounts or accounts at the bank.
- **FEE** — A charge made by the bank for its services.
- **INTEREST** — Interest credited or debited by the bank.
- **REVERSAL** — A reversal of an earlier bank transaction, such as a returned payment.
- **OTHER** — A bank-side adjustment that fits none of the above.

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

### Collateral Collateral Type

- **REAL ESTATE** — Land or buildings, usually secured by a registered charge.
- **EQUIPMENT** — Machinery, vehicles or other movable assets.
- **INVENTORY** — Stock of goods held by the borrower, valued at cost or market and revalued often.
- **RECEIVABLES** — Amounts owed to the borrower by its customers.
- **CASH** — Cash deposits or securities.
- **GUARANTEE** — A guarantee given by a third party.

### Collateral Status

- **PROPOSED** — Offered during credit approval; no charge yet.
- **PLEDGED** — Charged in favour of the lender.
- **RELEASED** — Freed after repayment, so it no longer secures any loan.
- **ENFORCED** — Taken by the lender after default.

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

### Credit Reason

- **GOODWILL** — Given to keep the customer's goodwill.
- **BILLING ERROR** — Corrects an amount billed wrongly.
- **RETURN** — Given for goods or services returned.
- **PROMOTION** — Given as part of an offer.
- **OTHER** — Given for another reason.

### Credit Status

- **DRAFT** — Being prepared by billing; it cannot yet be applied to any charge.
- **ACTIVE** — Issued and available to apply against what the customer owes.
- **COMPLETED** — Fully applied or expired, so nothing remains to use. A final state.
- **CANCELLED** — Withdrawn before it was used up, leaving no usable value. A final state.

### Currency Status

- **ACTIVE** — Available for use on new prices, documents and payments.
- **INACTIVE** — Temporarily not offered, for example while a market is closed; it can be reactivated.
- **RETIRED** — No longer in use, such as a replaced national currency; historical amounts keep it.

### Department Status

- **ACTIVE** — The department exists and can receive people, positions and work.
- **INACTIVE** — The department has been closed or merged away; it stays on record for history.

### Deposit Day Count Basis

- **ACT 360** — Actual days elapsed divided by a 360-day year.
- **ACT 365** — Actual days elapsed divided by a 365-day year.
- **THIRTY 360** — Every month counted as 30 days, divided by a 360-day year.

### Deposit Deposit Type

- **TIME** — Placed for a fixed term at a fixed rate.
- **CALL** — Repayable on demand or at short notice, at a variable rate.
- **CERTIFICATE** — A negotiable certificate of deposit.

### Deposit Status

- **ARRANGED** — Agreed with the bank but not yet placed.
- **ACTIVE** — Placed and earning interest.
- **MATURED** — Repaid at maturity together with its interest.
- **BROKEN** — Repaid early, usually with reduced interest or a fee.
- **CANCELLED** — Called off before the money was placed.

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

### Bank Account — Bank Account Lifecycle

Starts at **PENDING**.
Final: **CLOSED**.

Moves:
- PENDING → ACTIVE (Activate)
- ACTIVE → CLOSED (Close)
- ACTIVE → BLOCKED (Block)
- BLOCKED → ACTIVE (Unblock)

### Bank Transaction — Bank Transaction Lifecycle

Starts at **PENDING**.
Final: **REVERSED**, **FAILED**.

Moves:
- PENDING → POSTED (Post)
- POSTED → REVERSED (Reverse)
- POSTED → FAILED (Fail)

### Bank Reconciliation — Bank Reconciliation Lifecycle

Starts at **OPEN**.

Moves:
- OPEN → IN REVIEW (Submit)
- IN REVIEW → OPEN (Return)
- IN REVIEW → RECONCILED (Sign Off)
- RECONCILED → OPEN (Reopen)

### Bank Loan — Bank Loan Lifecycle

Starts at **APPLICATION**.
Final: **PAID OFF**, **DEFAULTED**, **CANCELLED**.

Moves:
- APPLICATION → APPROVED (Approve)
- APPROVED → ACTIVE (Disburse)
- ACTIVE → DELINQUENT (Mark Delinquent)
- DELINQUENT → ACTIVE (Cure)
- ACTIVE → PAID OFF (Pay Off)
- DELINQUENT → PAID OFF (Pay Off)
- DELINQUENT → DEFAULTED (Mark Defaulted)
- APPLICATION → CANCELLED (Cancel)
- APPROVED → CANCELLED (Cancel)

### Deposit — Deposit Lifecycle

Starts at **ARRANGED**.
Final: **MATURED**, **BROKEN**, **CANCELLED**.

Moves:
- ARRANGED → ACTIVE (Place)
- ACTIVE → MATURED (Mature)
- ACTIVE → BROKEN (Break)
- ARRANGED → CANCELLED (Cancel)

### Credit — Credit Lifecycle

Starts at **DRAFT**.
Final: **COMPLETED**, **CANCELLED**.

Moves:
- DRAFT → ACTIVE (Activate)
- ACTIVE → COMPLETED (Complete)
- DRAFT → CANCELLED (Cancel)
- ACTIVE → CANCELLED (Cancel)

### Collateral — Collateral Lifecycle

Starts at **PROPOSED**.
Final: **RELEASED**, **ENFORCED**.

Moves:
- PROPOSED → PLEDGED (Pledge)
- PLEDGED → RELEASED (Release)
- PLEDGED → ENFORCED (Enforce)
- PROPOSED → RELEASED (Withdraw)

## Roles

- **User** — reads 78 of 78 record types
- **Administrator** — reads and changes everything the lifecycles allow

A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.
