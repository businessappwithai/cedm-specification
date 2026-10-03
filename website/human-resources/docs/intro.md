---
title: "Human Resources"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Human Resources, built on the CEDM common foundation."
---

# Human Resources

Human Resources, built on the CEDM common foundation.


## The domain it serves

**Human Resources** covers Workers, Positions, Recruitment, Onboarding, Attendance, Leave, Payroll, Performance. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Human capital management** — Employee, Position, Employment, Payroll. Processes: Recruitment, Onboarding, Attendance, Leave, Payroll, Offboarding

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Employee](/entities/human-capital-management/employee/) | Represents a party role specialization called Employee within the CEDM business model. |
| [Position](/entities/human-capital-management/position/) | Represents a workforce master entity called Position within the CEDM business model. |
| [Employment](/entities/human-capital-management/employment/) | Represents a workforce relationship called Employment within the CEDM business model. |
| [Payroll](/entities/human-capital-management/payroll/) | Governs auditable gross-to-net payroll calculation and its downstream accounting and settlement. |
| [Job](/entities/human-resources-records/job/) | Reusable definition of work in HCM. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |
| [Exchange Rate](/entities/foundation/exchange-rate/) | Represents an auditable conversion rate between two currencies for a defined time and business purpose. |


## How the main records move

- A **Employee** goes Active → On leave → Terminated → Retired.
- A **Position** goes Open → Filled → Frozen → Closed → Retired.
- A **Employment** goes Pending → Active → Suspended → Terminated.
- A **Payroll** goes Draft → Calculated → Approved → Posted → Paid → Reversed.
- A **Job** goes Draft → Active → Inactive → Retired.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Payroll follow up required**: When a payroll is reversed, a task asks someone to settle what depended on it.
- **Payroll completion confirmed**: When a payroll is posted, a task asks someone to confirm the outcome.

The full list is under [Processes](/administration/processes/).

## What is inside

Human Resources holds **26 business entities** and **29 lists of values**, organised into 4 categories:

- **Foundation** (21): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Human Capital Management** (4): Employee, Position, Employment, Payroll
- **Human Resources records** (1): Job
- **Reference Data** (29): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 14 record lifecycles, 15 business rules and 4 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
