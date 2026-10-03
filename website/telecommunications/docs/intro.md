---
title: "Telecommunications"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Telecommunications, built on the CEDM common foundation."
---

# Telecommunications

Telecommunications, built on the CEDM common foundation.

![The Telecommunications dashboard](/img/dashboard.jpg)

## The domain it serves

**Telecommunications** covers Subscribers, Accounts, Services, Plans, Devices, Networks, Orders, Usage, Billing. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Customer](/entities/foundation/customer/) | Represents the commercial customer role of a Party. |
| [Telecom Service](/entities/telecommunications/telecom-service/) | Represents a telecom entity called TelecomService within the CEDM business model. |
| [Telecom Subscription](/entities/telecommunications/telecom-subscription/) | Represents a telecommunications entity called TelecomSubscription within the CEDM business model. |

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
| [Party Role](/entities/foundation/party-role/) | The bridge between stable Party identity and contextual business participation. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |


## How the main records move

- A **Telecom Service** goes Pending → Active → Suspended → Terminated.
- A **Telecom Subscription** goes Pending → Active → Suspended → Cancelled → Expired.
- A **Customer** goes Active → Inactive → Blocked → Retired.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Telecom subscription follow up required**: When a telecom subscription is cancelled, a task asks someone to settle what depended on it.
- **Customer exception raised**: When a customer is blocked, a high-priority task asks someone to resolve it.

The full list is under [Processes](/administration/processes/).

## What is inside

Telecommunications holds **24 business entities** and **29 lists of values**, organised into 3 categories:

- **Foundation** (22): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Telecommunications** (2): Telecom Service, Telecom Subscription
- **Reference Data** (29): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 12 record lifecycles, 12 business rules and 4 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
