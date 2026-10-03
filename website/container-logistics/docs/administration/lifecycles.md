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

## Container: Container lifecycle

States: **Active**, **In repair**, **Damaged**, **Sold**, **Scrapped**, **Lost**, **Retired**. A new record starts as **Active**; **Sold**, **Scrapped**, **Lost**, **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> IN_REPAIR: mark_in_repair
  IN_REPAIR --> DAMAGED: mark_damaged
  ACTIVE --> SOLD: mark_sold
  IN_REPAIR --> SOLD: mark_sold
  DAMAGED --> SOLD: mark_sold
  IN_REPAIR --> SCRAPPED: mark_scrapped
  DAMAGED --> SCRAPPED: mark_scrapped
  IN_REPAIR --> LOST: mark_lost
  DAMAGED --> LOST: mark_lost
  ACTIVE --> RETIRED: retire
  IN_REPAIR --> RETIRED: retire
  DAMAGED --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Container lifecycle bar](/img/entities/container-record.jpg)

See [Container](/entities/container-and-intermodal-logistics/container/) for the record itself.

## Container Movement: Container movement lifecycle

States: **Planned**, **Assigned**, **In progress**, **Completed**, **Cancelled**, **Failed**. A new record starts as **Planned**; **Completed**, **Cancelled**, **Failed** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> ASSIGNED: assign
  ASSIGNED --> IN_PROGRESS: start
  IN_PROGRESS --> COMPLETED: complete
  PLANNED --> CANCELLED: cancel
  ASSIGNED --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
  ASSIGNED --> FAILED: fail
  IN_PROGRESS --> FAILED: fail
```

Any role that may change the record may make any move the diagram draws.

![Container Movement lifecycle bar](/img/entities/container-movement-record.jpg)

See [Container Movement](/entities/container-and-intermodal-logistics/container-movement/) for the record itself.

## Yard: Yard lifecycle

States: **Planned**, **Active**, **Suspended**, **Closed**. A new record starts as **Planned**; **Closed** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> ACTIVE: activate
  ACTIVE --> CLOSED: close
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
```

Any role that may change the record may make any move the diagram draws.

![Yard lifecycle bar](/img/entities/yard-record.jpg)

See [Yard](/entities/container-and-intermodal-logistics/yard/) for the record itself.

## Yard: Yard block lifecycle

States: **Active**, **Blocked**, **Closed**. A new record starts as **Active**; **Closed** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> CLOSED: close
  ACTIVE --> BLOCKED: block
  BLOCKED --> ACTIVE: unblock
```

Any role that may change the record may make any move the diagram draws.


See [Yard](/entities/foundation/yard-block/) for the record itself.

## Yard Block: Yard bay lifecycle

States: **Active**, **Blocked**, **Closed**. A new record starts as **Active**; **Closed** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> CLOSED: close
  ACTIVE --> BLOCKED: block
  BLOCKED --> ACTIVE: unblock
```

Any role that may change the record may make any move the diagram draws.


See [Yard Block](/entities/foundation/yard-bay/) for the record itself.

## Yard Bay: Yard tier lifecycle

States: **Active**, **Blocked**, **Closed**. A new record starts as **Active**; **Closed** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> CLOSED: close
  ACTIVE --> BLOCKED: block
  BLOCKED --> ACTIVE: unblock
```

Any role that may change the record may make any move the diagram draws.


See [Yard Bay](/entities/foundation/yard-tier/) for the record itself.

## Yard Tier: Yard slot lifecycle

States: **Empty**, **Occupied**, **Reserved**, **Blocked**, **Out of service**. A new record starts as **Empty**.

```mermaid
stateDiagram-v2
  [*] --> EMPTY
  EMPTY --> OCCUPIED: mark_occupied
  OCCUPIED --> RESERVED: reserve
  OCCUPIED --> BLOCKED: block
  BLOCKED --> OCCUPIED: unblock
  RESERVED --> BLOCKED: block
  BLOCKED --> RESERVED: unblock
  OCCUPIED --> OUT_OF_SERVICE: mark_out_of_service
  OUT_OF_SERVICE --> OCCUPIED: return_to_service
  RESERVED --> OUT_OF_SERVICE: mark_out_of_service
  OUT_OF_SERVICE --> RESERVED: return_to_service
```

Any role that may change the record may make any move the diagram draws.


See [Yard Tier](/entities/foundation/yard-slot/) for the record itself.

