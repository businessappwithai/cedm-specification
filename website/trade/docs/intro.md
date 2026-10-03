---
title: "International Trade and Customs"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "International Trade and Customs, built on the CEDM common foundation."
---

# International Trade and Customs

International Trade and Customs, built on the CEDM common foundation.


## The domain it serves

**International Trade and Customs** covers Trade-orders, Declarations, Tariffs, Duties, Classifications, Licenses, Customs-events. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Trade Declaration](/entities/international-trade-and-customs/trade-declaration/) | Represents a international trade entity called TradeDeclaration within the CEDM business model. |
| [Customs Declaration](/entities/international-trade-and-customs/customs-declaration/) | Represents a trade entity called CustomsDeclaration within the CEDM business model. |

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

- A **Trade Declaration** goes Draft → Submitted → Accepted → Under review → Released → Rejected → Cancelled.
- A **Customs Declaration** goes Draft → Submitted → Accepted → Under inspection → Cleared → Rejected → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Trade declaration approval requested**: When a trade declaration is submitted or under review, a task asks someone to decide on it.
- **Trade declaration follow up required**: When a trade declaration is rejected or cancelled, a task asks someone to settle what depended on it.
- **Customs declaration approval requested**: When a customs declaration is submitted, a task asks someone to decide on it.
- **Customs declaration follow up required**: When a customs declaration is rejected or cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

International Trade and Customs holds **23 business entities** and **26 lists of values**, organised into 3 categories:

- **Foundation** (21): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **International Trade and Customs** (2): Trade Declaration, Customs Declaration
- **Reference Data** (26): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 11 record lifecycles, 12 business rules and 6 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
