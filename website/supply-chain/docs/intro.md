---
title: "Supply Chain Planning"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Supply Chain Planning, built on the CEDM common foundation."
---

# Supply Chain Planning

Supply Chain Planning, built on the CEDM common foundation.

![The Supply Chain Planning dashboard](/img/dashboard.jpg)

## The domain it serves

**Supply Chain Planning** covers Demand, Supply, Forecasting, Mrp, Planning, Allocation, Replenishment. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Product](/entities/foundation/product/) | Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. |
| [Supply Plan](/entities/supply-chain-planning/supply-plan/) | Represents a supply chain entity called SupplyPlan within the CEDM business model. |
| [Supply Plan Line](/entities/supply-chain-planning/supply-plan-line/) | Represents a supply chain entity called SupplyPlanLine within the CEDM business model. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Unit Of Measure](/entities/foundation/unit-of-measure/) | Defines the measurement semantics that make numeric quantities comparable across CEDM workflows. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |


## How the main records move

- A **Supply Plan** goes Draft → Approved → Active → Closed → Cancelled.
- A **Supply Plan Line** goes Planned → Released → Fulfilled → Cancelled.
- A **Product** goes Draft → Active → Discontinued → Blocked → Retired.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Supply plan follow up required**: When a supply plan is cancelled, a task asks someone to settle what depended on it.
- **Supply plan line follow up required**: When a supply plan line is cancelled, a task asks someone to settle what depended on it.
- **Product exception raised**: When a product is blocked, a high-priority task asks someone to resolve it.

The full list is under [Processes](/administration/processes/).

## What is inside

Supply Chain Planning holds **24 business entities** and **26 lists of values**, organised into 3 categories:

- **Foundation** (22): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Supply Chain Planning** (2): Supply Plan, Supply Plan Line
- **Reference Data** (26): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 12 record lifecycles, 19 business rules and 5 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
