---
title: "Manufacturing"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Manufacturing, built on the CEDM common foundation."
---

# Manufacturing

Manufacturing, built on the CEDM common foundation.

![The Manufacturing dashboard](/img/dashboard.jpg)

## The domain it serves

**Manufacturing** covers Bom, Routings, Work-orders, Production, Capacity, Scheduling, Shop-floor, Subcontracting. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Manufacturing management** — Product, Bill Of Material, Bill Of Material, Routing, Routing, Work Center, Manufacturing Work Order, Material Issue, Production Receipt, Lot, Serial Number, Inventory Movement, Quality Inspection. Processes: Production-planning, Order-release, Material-issue, Operation-execution, In-process-quality, Production-receipt, Genealogy, Variance, Completion

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Product](/entities/manufacturing-management/product/) | Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. |
| [Manufacturing Work Order](/entities/manufacturing-management/manufacturing-work-order/) | Canonical CEDM production-order transaction. |
| [Inventory Movement](/entities/manufacturing-management/inventory-movement/) | Represents one auditable change to inventory state, including stock reductions caused by supplier returns. |
| [Material Issue](/entities/manufacturing-management/material-issue/) | Production material-consumption transaction with full inventory and genealogy provenance. |
| [Production Receipt](/entities/manufacturing-management/production-receipt/) | Accepted manufacturing output transaction with inventory and genealogy evidence. |
| [Lot](/entities/manufacturing-management/lot/) | Batch-level inventory identity for end-to-end genealogy and recall. |
| [Serial Number](/entities/manufacturing-management/serial-number/) | Unit-level identity and custody traceability for serialized products. |
| [Scrap](/entities/manufacturing-records/scrap/) | Governed manufacturing loss/disposition evidence. |
| [Bill Of Material](/entities/manufacturing-management/bill-of-material/) | Represents a manufacturing master entity called BillOfMaterial within the CEDM business model. |
| [Routing](/entities/manufacturing-management/routing/) | Versioned definition of manufacturing process sequence. |
| [Quality Inspection](/entities/manufacturing-management/quality-inspection/) | Represents a quality inspection and its controlled sampling, measurements, result and disposition across inbound receiving and supplier-return workflows. |
| [Production Record](/entities/manufacturing-records/production-record/) | Represents a industrial transaction called ProductionRecord within the CEDM business model. |
| [Work Center](/entities/manufacturing-management/work-center/) | Manufacturing capacity resource used by routing and execution. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Unit Of Measure](/entities/foundation/unit-of-measure/) | Defines the measurement semantics that make numeric quantities comparable across CEDM workflows. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |


## How the main records move

- A **Product** goes Draft → Active → Discontinued → Blocked → Retired.
- A **Bill Of Material** goes Draft → Active → Obsolete.
- A **Routing** goes Draft → Active → Suspended → Obsolete.
- A **Work Center** goes Active → Inactive → Maintenance → Retired.
- A **Manufacturing Work Order** goes Planned → Released → In progress → Completed → Closed → Cancelled.
- A **Lot** goes Active → Hold → Quarantined → Released → Expired → Rejected → Consumed → Closed.
- A **Serial Number** goes Expected → Available → Reserved → In transit → Installed → Consumed → Returned → Quarantined → Scrapped → Retired.
- A **Quality Inspection** goes Open → In progress → Passed → Failed → Conditional → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Product exception raised**: When a product is blocked, a high-priority task asks someone to resolve it.
- **Manufacturing work order follow up required**: When a manufacturing work order is cancelled, a task asks someone to settle what depended on it.
- **Manufacturing work order completion confirmed**: When a manufacturing work order is completed, a task asks someone to confirm the outcome.
- **Lot exception raised**: When a lot is quarantined, a high-priority task asks someone to resolve it.
- **Lot follow up required**: When a lot is rejected, a task asks someone to settle what depended on it.
- **Serial number exception raised**: When a serial number is quarantined, a high-priority task asks someone to resolve it.

The full list is under [Processes](/administration/processes/).

## What is inside

Manufacturing holds **37 business entities** and **36 lists of values**, organised into 4 categories:

- **Foundation** (24): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Manufacturing Management** (11): Product, Bill Of Material, Routing, Work Center, Manufacturing Work Order, Material Issue, Production Receipt, Lot, Serial Number, Inventory Movement, Quality Inspection
- **Manufacturing records** (2): Production Record, Scrap
- **Reference Data** (36): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 18 record lifecycles, 32 business rules and 11 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
