---
title: "Record lifecycles"
sidebar_position: 2
description: "Every state a record can be in and every move between states."
---

# Record lifecycles

A lifecycle is the set of states a record can be in and the moves between them. The application enforces it on every write, through the screen and through the API: a move the diagram does not draw is refused for everyone, administrators included. Role restrictions narrow who may make a particular move. This application has **16** lifecycles.

![The workflow monitor](/img/admin/workflows.jpg)

## Party: Party lifecycle

States: **Active**, **Inactive**, **Blocked**, **Retired**. A new record starts as **Active**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> INACTIVE: deactivate
  INACTIVE --> ACTIVE: reactivate
  ACTIVE --> BLOCKED: block
  BLOCKED --> ACTIVE: unblock
  ACTIVE --> RETIRED: retire
  INACTIVE --> RETIRED: retire
  BLOCKED --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Party lifecycle bar](/img/entities/party-record.jpg)

See [Party](/entities/foundation/party/) for the record itself.

## Organization: Organization lifecycle

States: **Draft**, **Active**, **Inactive**, **Retired**. A new record starts as **Draft**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> INACTIVE: deactivate
  INACTIVE --> ACTIVE: reactivate
  DRAFT --> RETIRED: retire
  ACTIVE --> RETIRED: retire
  INACTIVE --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Organization lifecycle bar](/img/entities/organization-record.jpg)

See [Organization](/entities/foundation/organization/) for the record itself.

## Party Role: Party role lifecycle

States: **Active**, **Inactive**, **Expired**. A new record starts as **Active**; **Expired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> INACTIVE: deactivate
  INACTIVE --> ACTIVE: reactivate
  ACTIVE --> EXPIRED: expire
  INACTIVE --> EXPIRED: expire
```

Any role that may change the record may make any move the diagram draws.

![Party Role lifecycle bar](/img/entities/party-role-record.jpg)

See [Party Role](/entities/foundation/party-role/) for the record itself.

## Address: Address lifecycle

States: **Active**, **Inactive**, **Retired**. A new record starts as **Active**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> INACTIVE: deactivate
  INACTIVE --> ACTIVE: reactivate
  ACTIVE --> RETIRED: retire
  INACTIVE --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Address lifecycle bar](/img/entities/address-record.jpg)

See [Address](/entities/foundation/address/) for the record itself.

## Location: Location lifecycle

States: **Planned**, **Active**, **Inactive**, **Closed**, **Retired**. A new record starts as **Planned**; **Closed**, **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> ACTIVE: activate
  ACTIVE --> CLOSED: close
  ACTIVE --> INACTIVE: deactivate
  INACTIVE --> ACTIVE: reactivate
  PLANNED --> RETIRED: retire
  ACTIVE --> RETIRED: retire
  INACTIVE --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Location lifecycle bar](/img/entities/location-record.jpg)

See [Location](/entities/foundation/location/) for the record itself.

## Currency: Currency lifecycle

States: **Active**, **Inactive**, **Retired**. A new record starts as **Active**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> INACTIVE: deactivate
  INACTIVE --> ACTIVE: reactivate
  ACTIVE --> RETIRED: retire
  INACTIVE --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Currency lifecycle bar](/img/entities/currency-record.jpg)

See [Currency](/entities/foundation/currency/) for the record itself.

## Exchange Rate: Exchange rate lifecycle

States: **Draft**, **Active**, **Expired**, **Cancelled**. A new record starts as **Draft**; **Expired**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> EXPIRED: expire
  DRAFT --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Exchange Rate lifecycle bar](/img/entities/exchange-rate-record.jpg)

See [Exchange Rate](/entities/foundation/exchange-rate/) for the record itself.

## Unit Of Measure: Unit of measure lifecycle

States: **Active**, **Inactive**, **Retired**. A new record starts as **Active**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> INACTIVE: deactivate
  INACTIVE --> ACTIVE: reactivate
  ACTIVE --> RETIRED: retire
  INACTIVE --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Unit Of Measure lifecycle bar](/img/entities/unit-of-measure-record.jpg)

See [Unit Of Measure](/entities/foundation/unit-of-measure/) for the record itself.

## Task: Task lifecycle

States: **Created**, **Ready**, **Assigned**, **In progress**, **Blocked**, **Completed**, **Cancelled**, **Failed**. A new record starts as **Created**; **Completed**, **Cancelled**, **Failed** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> READY: mark_ready
  READY --> ASSIGNED: assign
  ASSIGNED --> IN_PROGRESS: start
  IN_PROGRESS --> COMPLETED: complete
  READY --> BLOCKED: block
  BLOCKED --> READY: unblock
  ASSIGNED --> BLOCKED: block
  BLOCKED --> ASSIGNED: unblock
  IN_PROGRESS --> BLOCKED: block
  BLOCKED --> IN_PROGRESS: unblock
  CREATED --> CANCELLED: cancel
  READY --> CANCELLED: cancel
  ASSIGNED --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
  BLOCKED --> CANCELLED: cancel
  READY --> FAILED: fail
  ASSIGNED --> FAILED: fail
  IN_PROGRESS --> FAILED: fail
  BLOCKED --> FAILED: fail
```

Any role that may change the record may make any move the diagram draws.

![Task lifecycle bar](/img/entities/task-record.jpg)

See [Task](/entities/foundation/task/) for the record itself.

## Shipment: Shipment lifecycle

States: **Planned**, **Booked**, **In transit**, **Delivered**, **Cancelled**, **Exception**. A new record starts as **Planned**; **Delivered**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> BOOKED: book
  BOOKED --> IN_TRANSIT: mark_in_transit
  IN_TRANSIT --> DELIVERED: deliver
  BOOKED --> EXCEPTION: mark_exception
  EXCEPTION --> BOOKED: resolve_exception
  IN_TRANSIT --> EXCEPTION: mark_exception
  EXCEPTION --> IN_TRANSIT: resolve_exception
  PLANNED --> CANCELLED: cancel
  BOOKED --> CANCELLED: cancel
  IN_TRANSIT --> CANCELLED: cancel
  EXCEPTION --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Shipment lifecycle bar](/img/entities/shipment-record.jpg)

See [Shipment](/entities/transportation-management/shipment/) for the record itself.

## Vehicle: Vehicle lifecycle

States: **Active**, **Maintenance**, **Out of service**, **Retired**. A new record starts as **Active**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> MAINTENANCE: mark_maintenance
  MAINTENANCE --> ACTIVE: return_to_service
  ACTIVE --> OUT_OF_SERVICE: mark_out_of_service
  OUT_OF_SERVICE --> ACTIVE: return_to_service
  ACTIVE --> RETIRED: retire
  MAINTENANCE --> RETIRED: retire
  OUT_OF_SERVICE --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Vehicle lifecycle bar](/img/entities/vehicle-record.jpg)

See [Vehicle](/entities/transportation-management/vehicle/) for the record itself.

## Sales Order: Sales order lifecycle

States: **Draft**, **Confirmed**, **Allocated**, **Partially fulfilled**, **Fulfilled**, **Cancelled**. A new record starts as **Draft**; **Fulfilled**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> CONFIRMED: confirm
  CONFIRMED --> ALLOCATED: mark_allocated
  ALLOCATED --> PARTIALLY_FULFILLED: mark_partially_fulfilled
  PARTIALLY_FULFILLED --> FULFILLED: fulfil
  DRAFT --> CANCELLED: cancel
  CONFIRMED --> CANCELLED: cancel
  ALLOCATED --> CANCELLED: cancel
  PARTIALLY_FULFILLED --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Sales Order lifecycle bar](/img/entities/sales-order-record.jpg)

See [Sales Order](/entities/fulfillment/sales-order/) for the record itself.

## Trip: Trip lifecycle

States: **Planned**, **Booked**, **In progress**, **Completed**, **Cancelled**. A new record starts as **Planned**; **Completed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> BOOKED: book
  BOOKED --> IN_PROGRESS: start
  IN_PROGRESS --> COMPLETED: complete
  PLANNED --> CANCELLED: cancel
  BOOKED --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Trip lifecycle bar](/img/entities/trip-record.jpg)

See [Trip](/entities/transportation-and-logistics-records/trip/) for the record itself.

## Trip: Trip segment lifecycle

States: **Planned**, **Booked**, **In progress**, **Completed**, **Cancelled**. A new record starts as **Planned**; **Completed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> BOOKED: book
  BOOKED --> IN_PROGRESS: start
  IN_PROGRESS --> COMPLETED: complete
  PLANNED --> CANCELLED: cancel
  BOOKED --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.


See [Trip](/entities/foundation/trip-segment/) for the record itself.

## Customer: Customer lifecycle

States: **Active**, **Inactive**, **Blocked**, **Retired**. A new record starts as **Active**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> INACTIVE: deactivate
  INACTIVE --> ACTIVE: reactivate
  ACTIVE --> BLOCKED: block
  BLOCKED --> ACTIVE: unblock
  ACTIVE --> RETIRED: retire
  INACTIVE --> RETIRED: retire
  BLOCKED --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Customer lifecycle bar](/img/entities/customer-record.jpg)

See [Customer](/entities/foundation/customer/) for the record itself.

## Product: Product lifecycle

States: **Draft**, **Active**, **Discontinued**, **Blocked**, **Retired**. A new record starts as **Draft**; **Discontinued**, **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> BLOCKED: block
  BLOCKED --> ACTIVE: unblock
  DRAFT --> DISCONTINUED: discontinue
  ACTIVE --> DISCONTINUED: discontinue
  BLOCKED --> DISCONTINUED: discontinue
  DRAFT --> RETIRED: retire
  ACTIVE --> RETIRED: retire
  BLOCKED --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Product lifecycle bar](/img/entities/product-record.jpg)

See [Product](/entities/foundation/product/) for the record itself.

