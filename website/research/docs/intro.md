---
title: "Research and Scientific Operations"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Research and Scientific Operations, built on the CEDM common foundation."
---

# Research and Scientific Operations

Research and Scientific Operations, built on the CEDM common foundation.


## The domain it serves

**Research and Scientific Operations** covers Research-projects, Protocols, Experiments, Samples, Instruments, Observations, Publications. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Research Project](/entities/research-and-scientific-operations/research-project/) | Represents a scientific research entity called ResearchProject within the CEDM business model. |

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

- A **Research Project** goes Planned → Active → Completed → Suspended → Cancelled → Archived.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Research project follow up required**: When a research project is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Research and Scientific Operations holds **22 business entities** and **23 lists of values**, organised into 3 categories:

- **Foundation** (21): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Research and Scientific Operations** (1): Research Project
- **Reference Data** (23): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 10 record lifecycles, 11 business rules and 3 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
