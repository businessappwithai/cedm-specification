---
title: "Project and Portfolio Management"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Project and Portfolio Management, built on the CEDM common foundation."
---

# Project and Portfolio Management

Project and Portfolio Management, built on the CEDM common foundation.

![The Project and Portfolio Management dashboard](/img/dashboard.jpg)

## The domain it serves

**Project and Portfolio Management** covers Projects, Work-breakdown, Resources, Budgets, Milestones, Risks, Issues, Timesheets. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Project management** — Project, Project, Project, Project, Project, Timesheet. Processes: Project-initiation, Planning, Execution, Monitoring, Closure

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Project](/entities/project-management/project/) | Represents a project management entity called Project within the CEDM business model. |
| [Professional Engagement](/entities/foundation/professional-engagement/) | Represents a professional services entity called ProfessionalEngagement within the CEDM business model. |
| [Timesheet](/entities/project-management/timesheet/) | Represents Timesheet as a first-class governed CEDM business concept. |

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

- A **Project** goes Draft → Planned → Active → On hold → Completed → Cancelled → Closed.
- A **Project** goes Planned → Active → Completed → Cancelled.
- A **Project** goes Not started → In progress → Blocked → Completed → Cancelled.
- A **Project** goes Planned → At risk → Achieved → Missed → Cancelled.
- A **Project** goes Draft → Active → Completed → Cancelled.
- A **Timesheet** goes Draft → Active → Completed → Cancelled.
- A **Professional Engagement** goes Proposed → Active → On hold → Completed → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Project exception raised**: When a project is on hold, a high-priority task asks someone to resolve it.
- **Project follow up required**: When a project is cancelled, a task asks someone to settle what depended on it.
- **Project phase follow up required**: When a project phase is cancelled, a task asks someone to settle what depended on it.
- **Project task exception raised**: When a project task is blocked, a high-priority task asks someone to resolve it.
- **Project task follow up required**: When a project task is cancelled, a task asks someone to settle what depended on it.
- **Milestone follow up required**: When a milestone is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Project and Portfolio Management holds **28 business entities** and **30 lists of values**, organised into 3 categories:

- **Foundation** (26): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Project Management** (2): Project, Timesheet
- **Reference Data** (30): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 16 record lifecycles, 19 business rules and 15 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
