---
title: "Life Sciences and Drug Discovery"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Life Sciences and Drug Discovery, built on the CEDM common foundation."
---

# Life Sciences and Drug Discovery

Life Sciences and Drug Discovery, built on the CEDM common foundation.

![The Life Sciences and Drug Discovery dashboard](/img/dashboard.jpg)

## The domain it serves

**Life Sciences and Drug Discovery** covers Compounds, Studies, Experiments, Assays, Samples, Protocols, Research-projects, Regulatory-submissions. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Sample](/entities/life-sciences-and-drug-discovery/sample/) | First-class research specimen and sample entity for life-sciences and scientific workflows. |
| [Product](/entities/foundation/product/) | Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. |
| [Compound](/entities/life-sciences-and-drug-discovery/compound/) | Represents a life sciences entity called Compound within the CEDM business model. |
| [Experiment](/entities/life-sciences-and-drug-discovery/experiment/) | Represents a research entity called Experiment within the CEDM business model. |
| [Chemical Batch](/entities/life-sciences-and-drug-discovery/chemical-batch/) | Represents a process industry entity called ChemicalBatch within the CEDM business model. |

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

- A **Compound** goes Candidate → Research → Development → Approved → Discontinued.
- A **Experiment** goes Planned → Running → Completed → Failed → Cancelled → Archived.
- A **Sample** goes Planned → Collected → Received → Available → In use → Consumed → Disposed → Lost → Quarantined → Archived.
- A **Chemical Batch** goes Planned → Quarantined → Released → Rejected → Expired → Consumed.
- A **Product** goes Draft → Active → Discontinued → Blocked → Retired.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Experiment exception raised**: When a experiment is failed, a high-priority task asks someone to resolve it.
- **Experiment follow up required**: When a experiment is cancelled, a task asks someone to settle what depended on it.
- **Sample exception raised**: When a sample is quarantined, a high-priority task asks someone to resolve it.
- **Chemical batch exception raised**: When a chemical batch is quarantined, a high-priority task asks someone to resolve it.
- **Chemical batch follow up required**: When a chemical batch is rejected, a task asks someone to settle what depended on it.
- **Product exception raised**: When a product is blocked, a high-priority task asks someone to resolve it.

The full list is under [Processes](/administration/processes/).

## What is inside

Life Sciences and Drug Discovery holds **26 business entities** and **29 lists of values**, organised into 3 categories:

- **Foundation** (22): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Life Sciences and Drug Discovery** (4): Compound, Experiment, Sample, Chemical Batch
- **Reference Data** (29): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 14 record lifecycles, 22 business rules and 8 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
