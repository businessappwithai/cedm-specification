---
title: "Workflow and Business Process Management"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Workflow and Business Process Management, built on the CEDM common foundation."
---

# Workflow and Business Process Management

Workflow and Business Process Management, built on the CEDM common foundation.

![The Workflow and Business Process Management dashboard](/img/dashboard.jpg)

## The domain it serves

**Workflow and Business Process Management** covers Processes, Workflows, Tasks, Rules, Approvals, Escalations, Events. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Workflow orchestration** — Business Process, Workflow, Workflow. Processes: Workflow-start, Task-assignment, Approval, Escalation, Completion

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Business Process](/entities/workflow-orchestration/business-process/) | Represents a process definition entity called BusinessProcess within the CEDM business model. |
| [Workflow](/entities/workflow-orchestration/workflow/) | Represents a process definition entity called Workflow within the CEDM business model. |
| [Process Definition](/entities/workflow-and-business-process-management-records/process-definition/) | A versioned executable-neutral definition of a business process, its activities, transitions, assignments, controls, and completion semantics. |
| [Process Instance](/entities/workflow-and-business-process-management-records/process-instance/) | A governed execution instance of a ProcessDefinition preserving the effective process version, business context, state, and audit history. |

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

- A **Business Process** goes Draft → Active → Suspended → Retired.
- A **Workflow** goes Draft → Active → Suspended → Retired.
- A **Process Definition** goes Pending → Active → Completed → Cancelled.
- A **Process Instance** goes Pending → Active → Completed → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Process definition follow up required**: When a process definition is cancelled, a task asks someone to settle what depended on it.
- **Process instance follow up required**: When a process instance is cancelled, a task asks someone to settle what depended on it.
- **Process instance completion confirmed**: When a process instance is completed, a task asks someone to confirm the outcome.

The full list is under [Processes](/administration/processes/).

## What is inside

Workflow and Business Process Management holds **25 business entities** and **28 lists of values**, organised into 4 categories:

- **Foundation** (21): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Workflow Orchestration** (2): Business Process, Workflow
- **Workflow and Business Process Management records** (2): Process Definition, Process Instance
- **Reference Data** (28): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 13 record lifecycles, 14 business rules and 5 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
