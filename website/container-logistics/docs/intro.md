---
title: "Container and Intermodal Logistics"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Container and Intermodal Logistics, built on the CEDM common foundation."
---

# Container and Intermodal Logistics

Container and Intermodal Logistics, built on the CEDM common foundation.


## The domain it serves

**Container and Intermodal Logistics** covers Containers, Equipment, Depots, Ports, Yards, Gates, Moves, Bookings, Interchange. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Container](/entities/container-and-intermodal-logistics/container/) | Represents a reusable intermodal freight container as a continuously identifiable physical logistics asset. |
| [Container Movement](/entities/container-and-intermodal-logistics/container-movement/) | Represents one traceable physical or operational movement of one shipping container. |
| [Yard](/entities/container-and-intermodal-logistics/yard/) | Represents the facility-level operational boundary for container storage and handling. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |
| [Exchange Rate](/entities/foundation/exchange-rate/) | Represents an auditable conversion rate between two currencies for a defined time and business purpose. |


## How the main records move

- A **Container** goes Active → In repair → Damaged → Sold → Scrapped → Lost → Retired.
- A **Container Movement** goes Planned → Assigned → In progress → Completed → Cancelled → Failed.
- A **Yard** goes Planned → Active → Suspended → Closed.
- A **Yard** goes Active → Blocked → Closed.
- A **Yard Block** goes Active → Blocked → Closed.
- A **Yard Bay** goes Active → Blocked → Closed.
- A **Yard Tier** goes Empty → Occupied → Reserved → Blocked → Out of service.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Container movement exception raised**: When a container movement is failed, a high-priority task asks someone to resolve it.
- **Container movement follow up required**: When a container movement is cancelled, a task asks someone to settle what depended on it.
- **Container movement completion confirmed**: When a container movement is completed, a task asks someone to confirm the outcome.
- **Yard block exception raised**: When a yard block is blocked, a high-priority task asks someone to resolve it.
- **Yard bay exception raised**: When a yard bay is blocked, a high-priority task asks someone to resolve it.
- **Yard tier exception raised**: When a yard tier is blocked, a high-priority task asks someone to resolve it.

The full list is under [Processes](/administration/processes/).

## What is inside

Container and Intermodal Logistics holds **28 business entities** and **31 lists of values**, organised into 3 categories:

- **Foundation** (25): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Container and Intermodal Logistics** (3): Container, Container Movement, Yard
- **Reference Data** (31): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 16 record lifecycles, 19 business rules and 9 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
