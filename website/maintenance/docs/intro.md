---
title: "Asset Maintenance and Reliability"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Asset Maintenance and Reliability, built on the CEDM common foundation."
---

# Asset Maintenance and Reliability

Asset Maintenance and Reliability, built on the CEDM common foundation.


## The domain it serves

**Asset Maintenance and Reliability** covers Assets, Maintenance-plans, Work-orders, Inspections, Repairs, Warranties, Depreciation. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Maintenance management** — Asset, Maintenance Plan, Maintenance Work Order, Repair Estimate, Repair Estimate. Processes: Inspection, Preventive-maintenance, Corrective-maintenance, Repair, Closure
- **Asset management** — Asset, Location, Organization. Processes: Asset-acquisition, Capitalization, Transfer, Disposal

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Asset](/entities/maintenance-management/asset/) | Represents the long-lived business object for a durable resource whose identity, ownership, location, maintenance, financial treatment, and lifecycle must be managed over time. |
| [Maintenance Work Order](/entities/maintenance-management/maintenance-work-order/) | Represents one controlled maintenance intervention from reported need through planning, assignment, execution, and completion or cancellation. |
| [Product](/entities/foundation/product/) | Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. |
| [Repair Estimate](/entities/maintenance-management/repair-estimate/) | Represents the controlled decision assessment between asset condition and the eventual repair or commercial disposition action. |
| [Maintenance Plan](/entities/maintenance-management/maintenance-plan/) | Represents a maintenance definition called MaintenancePlan within the CEDM business model. |
| [Equipment](/entities/asset-maintenance-and-reliability-records/equipment/) | A governed maintainable equipment identity linked to an Asset where financial capitalization and operational maintenance identities overlap. |
| [Spare Part](/entities/asset-maintenance-and-reliability-records/spare-part/) | Maintenance-specific role for an inventory Product used to repair or service assets and equipment. |
| [Container](/entities/foundation/container/) | Represents a reusable intermodal freight container as a continuously identifiable physical logistics asset. |
| [Failure](/entities/asset-maintenance-and-reliability-records/failure/) | A governed observed equipment or asset failure recording symptom, occurrence, effect, and maintenance context without overwriting repair evidence. |

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

- A **Asset** goes Planned → Active → Under maintenance → Held → Disposed → Retired.
- A **Maintenance Plan** goes Draft → Active → Suspended → Retired.
- A **Maintenance Work Order** goes Planned → Open → Assigned → In progress → On hold → Completed → Cancelled.
- A **Repair Estimate** goes Draft → Submitted → Approved → Rejected → Completed → Cancelled.
- A **Container** goes Active → In repair → Damaged → Sold → Scrapped → Lost → Retired.
- A **Product** goes Draft → Active → Discontinued → Blocked → Retired.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Asset exception raised**: When a asset is held, a high-priority task asks someone to resolve it.
- **Maintenance work order exception raised**: When a maintenance work order is on hold, a high-priority task asks someone to resolve it.
- **Maintenance work order follow up required**: When a maintenance work order is cancelled, a task asks someone to settle what depended on it.
- **Maintenance work order completion confirmed**: When a maintenance work order is completed, a task asks someone to confirm the outcome.
- **Repair estimate approval requested**: When a repair estimate is submitted, a task asks someone to decide on it.
- **Repair estimate follow up required**: When a repair estimate is rejected or cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Asset Maintenance and Reliability holds **31 business entities** and **35 lists of values**, organised into 4 categories:

- **Foundation** (24): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Maintenance Management** (4): Asset, Maintenance Plan, Maintenance Work Order, Repair Estimate
- **Asset Maintenance and Reliability records** (3): Equipment, Failure, Spare Part
- **Reference Data** (35): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 15 record lifecycles, 26 business rules and 10 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
