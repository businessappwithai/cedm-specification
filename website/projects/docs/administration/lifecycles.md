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

## Project: Project lifecycle

States: **Draft**, **Planned**, **Active**, **On hold**, **Completed**, **Cancelled**, **Closed**. A new record starts as **Draft**; **Closed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> PLANNED: plan
  PLANNED --> ACTIVE: activate
  ACTIVE --> COMPLETED: complete
  COMPLETED --> CLOSED: close
  PLANNED --> ON_HOLD: hold
  ON_HOLD --> PLANNED: resume
  ACTIVE --> ON_HOLD: hold
  ON_HOLD --> ACTIVE: resume
  DRAFT --> CANCELLED: cancel
  PLANNED --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
  ON_HOLD --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Project lifecycle bar](/img/entities/project-record.jpg)

See [Project](/entities/project-management/project/) for the record itself.

## Project: Project phase lifecycle

States: **Planned**, **Active**, **Completed**, **Cancelled**. A new record starts as **Planned**; **Completed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> ACTIVE: activate
  ACTIVE --> COMPLETED: complete
  PLANNED --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.


See [Project](/entities/foundation/project-phase/) for the record itself.

## Project: Project task lifecycle

States: **Not started**, **In progress**, **Blocked**, **Completed**, **Cancelled**. A new record starts as **Not started**; **Completed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> NOT_STARTED
  NOT_STARTED --> IN_PROGRESS: start
  IN_PROGRESS --> COMPLETED: complete
  IN_PROGRESS --> BLOCKED: block
  BLOCKED --> IN_PROGRESS: unblock
  NOT_STARTED --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
  BLOCKED --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.


See [Project](/entities/foundation/project-task/) for the record itself.

## Project: Milestone lifecycle

States: **Planned**, **At risk**, **Achieved**, **Missed**, **Cancelled**. A new record starts as **Planned**; **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PLANNED
  PLANNED --> AT_RISK: mark_at_risk
  AT_RISK --> ACHIEVED: mark_achieved
  ACHIEVED --> MISSED: mark_missed
  PLANNED --> CANCELLED: cancel
  AT_RISK --> CANCELLED: cancel
  ACHIEVED --> CANCELLED: cancel
  MISSED --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.


See [Project](/entities/foundation/milestone/) for the record itself.

## Project: Resource assignment lifecycle

States: **Draft**, **Active**, **Completed**, **Cancelled**. A new record starts as **Draft**; **Completed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> COMPLETED: complete
  DRAFT --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.


See [Project](/entities/foundation/resource-assignment/) for the record itself.

## Timesheet: Timesheet lifecycle

States: **Draft**, **Active**, **Completed**, **Cancelled**. A new record starts as **Draft**; **Completed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> COMPLETED: complete
  DRAFT --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Timesheet lifecycle bar](/img/entities/timesheet-record.jpg)

See [Timesheet](/entities/project-management/timesheet/) for the record itself.

## Professional Engagement: Professional engagement lifecycle

States: **Proposed**, **Active**, **On hold**, **Completed**, **Cancelled**. A new record starts as **Proposed**; **Completed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> PROPOSED
  PROPOSED --> ACTIVE: activate
  ACTIVE --> COMPLETED: complete
  ACTIVE --> ON_HOLD: hold
  ON_HOLD --> ACTIVE: resume
  PROPOSED --> CANCELLED: cancel
  ACTIVE --> CANCELLED: cancel
  ON_HOLD --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Professional Engagement lifecycle bar](/img/entities/professional-engagement-record.jpg)

See [Professional Engagement](/entities/foundation/professional-engagement/) for the record itself.

