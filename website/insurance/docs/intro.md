---
title: "Insurance"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Insurance, built on the CEDM common foundation."
---

# Insurance

Insurance, built on the CEDM common foundation.


## The domain it serves

**Insurance** covers Policies, Underwriting, Coverage, Premiums, Claims, Settlements, Parties. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Insurance Policy](/entities/insurance/insurance-policy/) | Represents a insurance entity called InsurancePolicy within the CEDM business model. |
| [Insurance Claim](/entities/insurance/insurance-claim/) | Represents a insurance transaction called InsuranceClaim within the CEDM business model. |

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

- A **Insurance Policy** goes Quoted → Active → Suspended → Expired → Cancelled.
- A **Insurance Claim** goes Reported → Under review → Approved → Partially approved → Denied → Settled → Closed.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Insurance policy follow up required**: When a insurance policy is cancelled, a task asks someone to settle what depended on it.
- **Insurance claim approval requested**: When a insurance claim is under review, a task asks someone to decide on it.
- **Insurance claim follow up required**: When a insurance claim is denied, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Insurance holds **23 business entities** and **24 lists of values**, organised into 3 categories:

- **Foundation** (21): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Insurance** (2): Insurance Policy, Insurance Claim
- **Reference Data** (24): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 11 record lifecycles, 16 business rules and 5 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
