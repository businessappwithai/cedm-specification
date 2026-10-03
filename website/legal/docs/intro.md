---
title: "Legal and Contract Management"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Legal and Contract Management, built on the CEDM common foundation."
---

# Legal and Contract Management

Legal and Contract Management, built on the CEDM common foundation.

![The Legal and Contract Management dashboard](/img/dashboard.jpg)

## The domain it serves

**Legal and Contract Management** covers Contracts, Clauses, Obligations, Matters, Claims, Disputes, Legal-entities. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Contract management** — Contract, Contract Clause, Contract. Processes: Contract-creation, Negotiation, Approval, Execution, Renewal, Termination

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Contract](/entities/contract-management/contract/) | Represents a legal commercial entity called Contract within the CEDM business model. |
| [Contract Clause](/entities/contract-management/contract-clause/) | A governed clause forming part of a Contract and preserving the effective contractual text or structured term reference. |
| [Contract Line](/entities/legal-and-contract-management-records/contract-line/) | A governed commercial or legal line within a Contract defining a specific product, service, price, quantity, term, or obligation scope. |
| [Contract Amendment](/entities/legal-and-contract-management-records/contract-amendment/) | A governed change instrument that modifies defined Contract terms prospectively while preserving prior executed contract evidence. |
| [Contract Renewal](/entities/legal-and-contract-management-records/contract-renewal/) | A governed event extending or replacing a Contract for a new term under approved renewal conditions. |
| [Contract Termination](/entities/legal-and-contract-management-records/contract-termination/) | A governed event ending a Contract or selected obligations under authorized termination terms. |
| [Legal Case](/entities/legal-and-contract-management-records/legal-case/) | A governed litigation, arbitration, administrative, or adjudicative case within a LegalMatter. |
| [Legal Matter](/entities/legal-and-contract-management-records/legal-matter/) | A governed legal work matter grouping parties, counsel, documents, obligations, filings, issues, costs, and outcomes. |
| [Agreement](/entities/legal-and-contract-management-records/agreement/) | A governed agreement between parties defining rights, duties, commitments, or terms, with Contract available for commercial contract specialization. |
| [Renewal](/entities/legal-and-contract-management-records/renewal/) | A governed subscription or service continuation event extending commercial entitlement into a subsequent term. |

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

- A **Contract** goes Draft → Negotiation → Approval → Active → Suspended → Expired → Terminated → Cancelled.
- A **Contract** goes Open → In progress → Fulfilled → Breached → Waived → Cancelled.
- A **Renewal** goes Draft → Active → Completed → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Contract follow up required**: When a contract is cancelled, a task asks someone to settle what depended on it.
- **Contract obligation exception raised**: When a contract obligation is breached, a high-priority task asks someone to resolve it.
- **Contract obligation follow up required**: When a contract obligation is cancelled, a task asks someone to settle what depended on it.
- **Renewal follow up required**: When a renewal is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Legal and Contract Management holds **32 business entities** and **26 lists of values**, organised into 4 categories:

- **Foundation** (22): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Contract Management** (2): Contract, Contract Clause
- **Legal and Contract Management records** (8): Agreement, Contract Line, Contract Amendment, Contract Renewal, Contract Termination, Renewal, Legal Case, Legal Matter
- **Reference Data** (26): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 12 record lifecycles, 15 business rules and 6 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
