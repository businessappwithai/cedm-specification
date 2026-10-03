---
title: "Banking and Financial Services"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Banking and Financial Services, built on the CEDM common foundation."
---

# Banking and Financial Services

Banking and Financial Services, built on the CEDM common foundation.


## The domain it serves

**Banking and Financial Services** covers Accounts, Customers, Transactions, Payments, Loans, Deposits, Collateral, Reconciliation. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Bank Account](/entities/banking-and-financial-services/bank-account/) | Represents the controlled banking account context through which cash is received, disbursed, observed, and reconciled. |
| [Bank Transaction](/entities/banking-and-financial-services/bank-transaction/) | Represents external financial-institution evidence of a bank-side movement while keeping reconciliation, internal payment, and accounting meaning separate. |
| [Bank Loan](/entities/banking-and-financial-services/bank-loan/) | Represents a banking entity called BankLoan within the CEDM business model. |
| [Bank Reconciliation](/entities/banking-and-financial-services/bank-reconciliation/) | A governed reconciliation comparing BankAccount external BankTransaction evidence with internal payments and accounting records for a defined cutoff. |
| [Collateral](/entities/banking-and-financial-services/collateral/) | A governed asset, guarantee, or other value pledged or assigned to secure a BankLoan, Facility, or other credit exposure. |
| [Deposit](/entities/banking-and-financial-services/deposit/) | A governed deposit product or deposit transaction representing funds placed with a financial institution under defined ownership and terms. |
| [Credit](/entities/banking-and-financial-services/credit/) | A governed monetary credit reducing an amount owed or available for application to future or existing charges without itself representing cash payment. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |
| [Exchange Rate](/entities/foundation/exchange-rate/) | Represents an auditable conversion rate between two currencies for a defined time and business purpose. |


## How the main records move

- A **Bank Account** goes Pending → Active → Blocked → Closed.
- A **Bank Transaction** goes Pending → Posted → Reversed → Failed.
- A **Bank Loan** goes Application → Approved → Active → Delinquent → Paid off → Defaulted → Cancelled.
- A **Credit** goes Draft → Active → Completed → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Bank account exception raised**: When a bank account is blocked, a high-priority task asks someone to resolve it.
- **Bank transaction exception raised**: When a bank transaction is failed, a high-priority task asks someone to resolve it.
- **Bank transaction follow up required**: When a bank transaction is reversed, a task asks someone to settle what depended on it.
- **Bank loan follow up required**: When a bank loan is cancelled, a task asks someone to settle what depended on it.
- **Credit follow up required**: When a credit is cancelled, a task asks someone to settle what depended on it.
- **Credit completion confirmed**: When a credit is completed, a task asks someone to confirm the outcome.

The full list is under [Processes](/administration/processes/).

## What is inside

Banking and Financial Services holds **28 business entities** and **28 lists of values**, organised into 3 categories:

- **Foundation** (21): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Banking and Financial Services** (7): Bank Account, Bank Transaction, Bank Reconciliation, Bank Loan, Deposit, Credit, Collateral
- **Reference Data** (28): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 13 record lifecycles, 16 business rules and 8 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
