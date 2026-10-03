---
title: "Transportation and Logistics"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Transportation and Logistics, built on the CEDM common foundation."
---

# Transportation and Logistics

Transportation and Logistics, built on the CEDM common foundation.

![The Transportation and Logistics dashboard](/img/dashboard.jpg)

## The domain it serves

**Transportation and Logistics** covers Shipments, Routes, Carriers, Freight, Tracking, Delivery, Fleet. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Transportation management** — Shipment, Vehicle, Location. Processes: Route-planning, Dispatch, Tracking, Delivery, Freight-settlement
- **Fulfillment** — Sales Order, Shipment, Shipment, Inventory Movement, Location. Processes: Pick-pack-ship, Delivery, Receipt

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Shipment](/entities/transportation-management/shipment/) | Represents physical logistics execution bridging commercial fulfillment and transport while keeping inventory and financial state under their authoritative workflows. |
| [Sales Order](/entities/fulfillment/sales-order/) | Represents the commercial customer commitment from which fulfillment and financial processes derive work. |
| [Product](/entities/foundation/product/) | Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. |
| [Inventory Movement](/entities/fulfillment/inventory-movement/) | Represents one auditable change to inventory state, including stock reductions caused by supplier returns. |
| [Customer](/entities/foundation/customer/) | Represents the commercial customer role of a Party. |
| [Vehicle](/entities/transportation-management/vehicle/) | Represents a logistics asset called Vehicle within the CEDM business model. |
| [Delivery Attempt](/entities/transportation-and-logistics-records/delivery-attempt/) | An immutable record of an attempt to deliver a Message or BusinessEvent subscription payload to an IntegrationEndpoint. |
| [Trip](/entities/transportation-and-logistics-records/trip/) | Represents a travel entity called Trip within the CEDM business model. |
| [Carrier](/entities/transportation-and-logistics-records/carrier/) | A governed logistics service provider responsible for transporting shipments, consignments, or loads. |
| [Delivery](/entities/transportation-and-logistics-records/delivery/) | A governed delivery execution record proving handoff of shipped goods to an eligible destination or recipient. |
| [Freight Charge](/entities/transportation-and-logistics-records/freight-charge/) | A governed monetary charge for transportation or logistics services attributable to a shipment, consignment, load, or carrier service. |
| [Tracking Event](/entities/transportation-and-logistics-records/tracking-event/) | An immutable timestamped logistics observation describing shipment, consignment, load, container, or handling-unit progress. |
| [Message](/entities/foundation/message/) | A governed integration message envelope preserving payload identity, direction, correlation, processing state, and delivery evidence. |
| [Integration Endpoint](/entities/foundation/integration-endpoint/) | A governed logical endpoint through which enterprise messages or business events are exchanged with an internal or external system. |
| [Consignment](/entities/transportation-and-logistics-records/consignment/) | A governed shipment grouping tendered to a carrier under common transport responsibility and commercial terms. |
| [Fulfillment](/entities/transportation-and-logistics-records/fulfillment/) | A governed orchestration record connecting sales demand to reservation, picking, packing, shipment, delivery, and completion evidence. |
| [Load](/entities/transportation-and-logistics-records/load/) | A governed grouping of shipments, consignments, handling units, or containers assigned together for transport execution. |
| [Route](/entities/transportation-and-logistics-records/route/) | A governed planned path or sequence of transport stops/legs used for shipment, fleet, or logistics execution. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Unit Of Measure](/entities/foundation/unit-of-measure/) | Defines the measurement semantics that make numeric quantities comparable across CEDM workflows. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Party Role](/entities/foundation/party-role/) | The bridge between stable Party identity and contextual business participation. |


## How the main records move

- A **Shipment** goes Planned → Booked → In transit → Delivered → Cancelled → Exception.
- A **Vehicle** goes Active → Maintenance → Out of service → Retired.
- A **Sales Order** goes Draft → Confirmed → Allocated → Partially fulfilled → Fulfilled → Cancelled.
- A **Trip** goes Planned → Booked → In progress → Completed → Cancelled.
- A **Trip** goes Planned → Booked → In progress → Completed → Cancelled.
- A **Customer** goes Active → Inactive → Blocked → Retired.
- A **Product** goes Draft → Active → Discontinued → Blocked → Retired.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Shipment exception raised**: When a shipment is exception, a high-priority task asks someone to resolve it.
- **Shipment follow up required**: When a shipment is cancelled, a task asks someone to settle what depended on it.
- **Shipment completion confirmed**: When a shipment is delivered, a task asks someone to confirm the outcome.
- **Sales order follow up required**: When a sales order is cancelled, a task asks someone to settle what depended on it.
- **Sales order completion confirmed**: When a sales order is fulfilled, a task asks someone to confirm the outcome.
- **Trip follow up required**: When a trip is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Transportation and Logistics holds **42 business entities** and **38 lists of values**, organised into 5 categories:

- **Foundation** (28): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Transportation Management** (2): Shipment, Vehicle
- **Fulfillment** (2): Sales Order, Inventory Movement
- **Transportation and Logistics records** (10): Carrier, Consignment, Delivery, Delivery Attempt, Freight Charge, Fulfillment, Load, Route, Tracking Event, Trip
- **Reference Data** (38): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 16 record lifecycles, 26 business rules and 11 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
