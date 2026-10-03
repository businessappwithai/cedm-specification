---
title: "Energy and Utilities"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Energy and Utilities, built on the CEDM common foundation."
---

# Energy and Utilities

Energy and Utilities, built on the CEDM common foundation.


## The domain it serves

**Energy and Utilities** covers Assets, Meters, Readings, Customers, Tariffs, Contracts, Generation, Distribution, Outages. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Energy Asset](/entities/energy-and-utilities/energy-asset/) | Represents a energy entity called EnergyAsset within the CEDM business model. |
| [Energy Meter](/entities/energy-and-utilities/energy-meter/) | Represents a utility entity called EnergyMeter within the CEDM business model. |
| [Energy Tariff](/entities/energy-and-utilities/energy-tariff/) | Represents a utilities entity called EnergyTariff within the CEDM business model. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Unit Of Measure](/entities/foundation/unit-of-measure/) | Defines the measurement semantics that make numeric quantities comparable across CEDM workflows. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |


## How the main records move

- A **Energy Asset** goes Planned → Active → Maintenance → Decommissioned.
- A **Energy Meter** goes Planned → Active → Disconnected → Retired.
- A **Energy Tariff** goes Draft → Active → Expired → Retired.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Energy and Utilities holds **25 business entities** and **28 lists of values**, organised into 3 categories:

- **Foundation** (22): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Energy and Utilities** (3): Energy Asset, Energy Meter, Energy Tariff
- **Reference Data** (28): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 12 record lifecycles, 14 business rules and 2 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
