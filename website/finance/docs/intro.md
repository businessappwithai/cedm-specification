---
title: "Finance and Accounting"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Finance and Accounting, built on the CEDM common foundation."
---

# Finance and Accounting

Finance and Accounting, built on the CEDM common foundation.

![The Finance and Accounting dashboard](/img/dashboard.jpg)

## The domain it serves

**Finance and Accounting** covers General-ledger, Accounts-payable, Accounts-receivable, Treasury, Tax, Budgeting, Costing, Fixed-assets. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Financial accounting** — Account, Journal Entry, Journal Entry Line, Invoice, Payment, Currency. Processes: Journal-posting, Period-close, Reconciliation, Reporting
- **Accounts payable** — Supplier, Purchase Order, Invoice, Payment. Processes: Invoice-capture, Three-way-match, Approval, Payment
- **Accounts receivable** — Customer, Sales Order, Invoice, Payment. Processes: Billing, Collection, Receipt, Reconciliation
- **Budgeting and planning** — Budget, Budget, Forecast, Scenario, Cost Center, Profit Center, Variance. Processes: Budgeting, Forecasting, Scenario-planning, Variance-analysis

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Customer](/entities/accounts-receivable/customer/) | Represents the commercial customer role of a Party. |
| [Payment](/entities/financial-accounting/payment/) | Represents movement or recognition of money while keeping payment execution, claim settlement, bank evidence, accounting recognition, customer refunds and supplier-credit refunds as separate connected facts. |
| [Product](/entities/foundation/product/) | Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. |
| [Invoice](/entities/financial-accounting/invoice/) | Represents a formal financial claim and its controlled settlement and adjustment state. |
| [Supplier](/entities/accounts-payable/supplier/) | Represents the procurement-facing role of a Party that supplies business inputs and participates in reverse procurement, supplier claims, financial recovery and performance governance. |
| [Account](/entities/financial-accounting/account/) | Represents a financial master entity called Account within the CEDM business model. |
| [Journal Entry](/entities/financial-accounting/journal-entry/) | Represents accounting recognition of a business event in a balanced double-entry ledger. |
| [Asset](/entities/foundation/asset/) | Represents the long-lived business object for a durable resource whose identity, ownership, location, maintenance, financial treatment, and lifecycle must be managed over time. |
| [Sales Order](/entities/accounts-receivable/sales-order/) | Represents the commercial customer commitment from which fulfillment and financial processes derive work. |
| [Credit Note](/entities/finance-and-accounting-records/credit-note/) | Represents an explicit reduction of a customer's financial claim while preserving original invoice, return, accounting, application and refund evidence. |
| [Tax Rule](/entities/finance-and-accounting-records/tax-rule/) | Defines reusable tax policy used to determine tax treatment and calculate tax amounts. |
| [Purchase Order](/entities/accounts-payable/purchase-order/) | Represents the formal commercial procurement commitment between a buying organization and a Supplier. |
| [Budget](/entities/budgeting-and-planning/budget/) | Governed financial planning baseline. |
| [Bank Account](/entities/foundation/bank-account/) | Represents the controlled banking account context through which cash is received, disbursed, observed, and reconciled. |
| [Forecast](/entities/budgeting-and-planning/forecast/) | A versioned forward-looking financial projection based on a defined scenario and as-of information, kept separate from approved budgets and actual accounting. |
| [Fiscal Period](/entities/finance-and-accounting-records/fiscal-period/) | Accounting-period control for posting, close and reporting. |
| [Variance](/entities/budgeting-and-planning/variance/) | A derived comparison between planned, forecast, or actual financial measures for a defined period and dimensional context. |
| [Credit Note Application](/entities/finance-and-accounting-records/credit-note-application/) | Provides the auditable bridge by which a posted customer CreditNote is consumed against an Invoice. |
| [Asset Depreciation](/entities/finance-and-accounting-records/asset-depreciation/) | Represents the financial measurement of how an Asset's depreciable value is consumed over time or usage. |
| [Journal Entry Line](/entities/foundation/journal-entry-line/) | Represents a financial transaction line called JournalEntryLine within the CEDM business model. |
| [Scenario](/entities/budgeting-and-planning/scenario/) | Alternative planning assumption context. |
| [Cost Center](/entities/budgeting-and-planning/cost-center/) | A governed responsibility center used to assign and analyze costs independently of legal-account identity. |
| [Profit Center](/entities/budgeting-and-planning/profit-center/) | A governed responsibility center used to analyze revenue, cost, and profitability independently of legal-account identity. |
| [Ledger](/entities/finance-and-accounting-records/ledger/) | A governed accounting book defining the scope in which journal entries are recorded and reported. |
| [Payment Instruction](/entities/finance-and-accounting-records/payment-instruction/) | A governed instruction authorizing or requesting a future payment through a bank or payment channel, separate from the resulting Payment and BankTransaction evidence. |
| [Cash Position](/entities/finance-and-accounting-records/cash-position/) | Reproducible point-in-time treasury liquidity view. |
| [Tax Code](/entities/finance-and-accounting-records/tax-code/) | A governed tax classification code used to select applicable tax rules, rates, jurisdictions, registrations, and reporting treatment. |
| [Tax Jurisdiction](/entities/finance-and-accounting-records/tax-jurisdiction/) | A governed geographic or legal authority under which taxes are imposed, collected, reported, or remitted. |
| [Tax Rate](/entities/finance-and-accounting-records/tax-rate/) | A governed effective-dated tax percentage or amount applicable under a TaxCode and TaxJurisdiction. |
| [Tax Registration](/entities/finance-and-accounting-records/tax-registration/) | A governed registration of a Party or Organization with a TaxJurisdiction and tax authority. |

…and 12 more, listed in the menu under Entities.

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Unit Of Measure](/entities/foundation/unit-of-measure/) | Defines the measurement semantics that make numeric quantities comparable across CEDM workflows. |
| [Exchange Rate](/entities/foundation/exchange-rate/) | Represents an auditable conversion rate between two currencies for a defined time and business purpose. |
| [Party Role](/entities/foundation/party-role/) | The bridge between stable Party identity and contextual business participation. |


## How the main records move

- A **Account** goes Active → Inactive → Retired.
- A **Journal Entry** goes Draft → Posted → Reversed.
- A **Invoice** goes Draft → Issued → Partially paid → Paid → Overdue → Cancelled → Void.
- A **Payment** goes Draft → Approved → Posted → Cleared → Void → Reversed.
- A **Supplier** goes Active → Inactive → Blocked → Retired.
- A **Purchase Order** goes Draft → Approved → Sent → Partially received → Received → Cancelled → Closed.
- A **Customer** goes Active → Inactive → Blocked → Retired.
- A **Sales Order** goes Draft → Confirmed → Allocated → Partially fulfilled → Fulfilled → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Journal entry follow up required**: When a journal entry is reversed, a task asks someone to settle what depended on it.
- **Journal entry completion confirmed**: When a journal entry is posted, a task asks someone to confirm the outcome.
- **Invoice exception raised**: When a invoice is overdue, a high-priority task asks someone to resolve it.
- **Invoice follow up required**: When a invoice is cancelled or void, a task asks someone to settle what depended on it.
- **Payment follow up required**: When a payment is void or reversed, a task asks someone to settle what depended on it.
- **Payment completion confirmed**: When a payment is posted, a task asks someone to confirm the outcome.

The full list is under [Processes](/administration/processes/).

## What is inside

Finance and Accounting holds **69 business entities** and **69 lists of values**, organised into 7 categories:

- **Foundation** (31): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Financial Accounting** (4): Account, Journal Entry, Invoice, Payment
- **Accounts Payable** (2): Supplier, Purchase Order
- **Accounts Receivable** (2): Customer, Sales Order
- **Budgeting and Planning** (6): Budget, Forecast, Scenario, Cost Center, Profit Center, Variance
- **Finance and Accounting records** (24): Ledger, Fiscal Period, Payment Instruction, Credit Note, Credit Note Application, Tax Code, Tax Jurisdiction, Tax Rate, Tax Registration, Tax Rule, Tax Transaction, Billing Cycle, …
- **Reference Data** (69): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 39 record lifecycles, 68 business rules and 35 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
