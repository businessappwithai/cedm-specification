---
title: "Inventory and Warehouse"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Inventory and Warehouse, built on the CEDM common foundation."
---

# Inventory and Warehouse

Inventory and Warehouse, built on the CEDM common foundation.

![The Inventory and Warehouse dashboard](/img/dashboard.jpg)

## The domain it serves

**Inventory and Warehouse** covers Stock, Warehouses, Bins, Lots, Serials, Replenishment, Counting, Movements. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Inventory management** — Inventory Location, Inventory Movement, Inventory Reservation, Inventory Transfer, Inventory Count, Inventory Adjustment, Lot, Serial Number, Product, Warehouse. Processes: Stock-receipt, Stock-issue, Stock-transfer, Lot-traceability, Serial-traceability, Reservation, Cycle-count, Adjustment, Recall
- **Warehouse management** — Warehouse, Warehouse, Warehouse, Warehouse, Handling Unit, Putaway, Picking, Packing, Wave, Inventory Location, Inventory Movement, Inventory Transfer, Inventory Count. Processes: Inbound, Putaway, Picking, Packing, Outbound, Replenishment

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Product](/entities/inventory-management/product/) | Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. |
| [Inventory Movement](/entities/inventory-management/inventory-movement/) | Represents one auditable change to inventory state, including stock reductions caused by supplier returns. |
| [Warehouse](/entities/warehouse-management/warehouse/) | Represents a managed facility where inventory is physically or operationally received, stored, controlled, fulfilled, and dispatched. |
| [Inventory Transfer](/entities/inventory-management/inventory-transfer/) | Warehouse/inventory relocation authorization separated from stock ledger events. |
| [Lot](/entities/inventory-management/lot/) | Batch-level inventory identity for end-to-end genealogy and recall. |
| [Handling Unit](/entities/warehouse-management/handling-unit/) | Physical logistics identity for grouping and moving inventory. |
| [Putaway](/entities/warehouse-management/putaway/) | Directed inbound/staging-to-storage warehouse task. |
| [Picking](/entities/warehouse-management/picking/) | Warehouse inventory-selection task for authorized demand. |
| [Inventory Count](/entities/inventory-management/inventory-count/) | Physical inventory observation used for controlled reconciliation. |
| [Serial Number](/entities/inventory-management/serial-number/) | Unit-level identity and custody traceability for serialized products. |
| [Inventory Reservation](/entities/inventory-management/inventory-reservation/) | Controls the commitment of available inventory to demand while separating reservation state from physical stock movement. |
| [Inventory Adjustment](/entities/inventory-management/inventory-adjustment/) | Controlled discrepancy correction with explicit evidence and stock posting. |
| [Wave](/entities/warehouse-management/wave/) | Warehouse work-release grouping for coordinated execution. |
| [Packing](/entities/warehouse-management/packing/) | Warehouse packaging execution between picking and shipping. |

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

- A **Inventory Reservation** goes Pending → Active → Partially consumed → Released → Consumed → Cancelled → Expired.
- A **Inventory Transfer** goes Planned → Released → In progress → Completed → Cancelled.
- A **Lot** goes Active → Hold → Quarantined → Released → Expired → Rejected → Consumed → Closed.
- A **Serial Number** goes Expected → Available → Reserved → In transit → Installed → Consumed → Returned → Quarantined → Scrapped → Retired.
- A **Product** goes Draft → Active → Discontinued → Blocked → Retired.
- A **Warehouse** goes Active → Blocked → Inactive.
- A **Warehouse** goes Planned → Active → Suspended → Closed.
- A **Putaway** goes Planned → Released → In progress → Completed → Cancelled → Exception.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Inventory reservation follow up required**: When a inventory reservation is cancelled, a task asks someone to settle what depended on it.
- **Inventory transfer follow up required**: When a inventory transfer is cancelled, a task asks someone to settle what depended on it.
- **Inventory transfer completion confirmed**: When a inventory transfer is completed, a task asks someone to confirm the outcome.
- **Lot exception raised**: When a lot is quarantined, a high-priority task asks someone to resolve it.
- **Lot follow up required**: When a lot is rejected, a task asks someone to settle what depended on it.
- **Serial number exception raised**: When a serial number is quarantined, a high-priority task asks someone to resolve it.

The full list is under [Processes](/administration/processes/).

## What is inside

Inventory and Warehouse holds **40 business entities** and **41 lists of values**, organised into 4 categories:

- **Foundation** (26): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Inventory Management** (8): Inventory Movement, Inventory Reservation, Inventory Transfer, Inventory Count, Inventory Adjustment, Lot, Serial Number, Product
- **Warehouse Management** (6): Warehouse, Handling Unit, Putaway, Picking, Packing, Wave
- **Reference Data** (41): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 20 record lifecycles, 36 business rules and 19 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
