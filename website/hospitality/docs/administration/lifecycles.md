---
title: "Record lifecycles"
sidebar_position: 2
description: "Every state a record can be in and every move between states."
---

# Record lifecycles

A lifecycle is the set of states a record can be in and the moves between them. The application enforces it on every write, through the screen and through the API: a move the diagram does not draw is refused for everyone, administrators included. Role restrictions narrow who may make a particular move. This application has **12** lifecycles.

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

## Hotel: Hotel lifecycle

States: **Planned**, **Active**, **Closed**, **Retired**. A new record starts as **Planned**; **Closed**, **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> ACTIVE: activate
  ACTIVE --> CLOSED: close
  PLANNED --> RETIRED: retire
  ACTIVE --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Hotel lifecycle bar](/img/entities/hotel-record.jpg)

See [Hotel](/entities/hospitality/hotel/) for the record itself.

## Hotel: Hotel room lifecycle

States: **Available**, **Occupied**, **Reserved**, **Cleaning**, **Out of service**. A new record starts as **Available**.

```mermaid
stateDiagram-v2
  [*] --> AVAILABLE
  AVAILABLE --> OCCUPIED: mark_occupied
  OCCUPIED --> RESERVED: reserve
  OCCUPIED --> CLEANING: mark_cleaning
  CLEANING --> OCCUPIED: finish_cleaning
  RESERVED --> CLEANING: mark_cleaning
  CLEANING --> RESERVED: finish_cleaning
  OCCUPIED --> OUT_OF_SERVICE: mark_out_of_service
  OUT_OF_SERVICE --> OCCUPIED: return_to_service
  RESERVED --> OUT_OF_SERVICE: mark_out_of_service
  OUT_OF_SERVICE --> RESERVED: return_to_service
```

Any role that may change the record may make any move the diagram draws.


See [Hotel](/entities/foundation/hotel-room/) for the record itself.

## Hotel Reservation: Hotel reservation lifecycle

States: **Requested**, **Reserved**, **Checked in**, **Checked out**, **Cancelled**, **No show**. A new record starts as **Requested**; **Cancelled**, **No show** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> REQUESTED
  REQUESTED --> RESERVED: reserve
  RESERVED --> CHECKED_IN: mark_checked_in
  CHECKED_IN --> CHECKED_OUT: mark_checked_out
  REQUESTED --> CANCELLED: cancel
  RESERVED --> CANCELLED: cancel
  CHECKED_IN --> CANCELLED: cancel
  CHECKED_OUT --> CANCELLED: cancel
  RESERVED --> NO_SHOW: mark_no_show
  CHECKED_IN --> NO_SHOW: mark_no_show
  CHECKED_OUT --> NO_SHOW: mark_no_show
```

Any role that may change the record may make any move the diagram draws.

![Hotel Reservation lifecycle bar](/img/entities/hotel-reservation-record.jpg)

See [Hotel Reservation](/entities/hospitality/hotel-reservation/) for the record itself.

