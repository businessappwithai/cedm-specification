---
title: "Record lifecycles"
sidebar_position: 2
description: "Every state a record can be in and every move between states."
---

# Record lifecycles

A lifecycle is the set of states a record can be in and the moves between them. The application enforces it on every write, through the screen and through the API: a move the diagram does not draw is refused for everyone, administrators included. Role restrictions narrow who may make a particular move. This application has **21** lifecycles.

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

## Quality Characteristic: Quality characteristic lifecycle

States: **Draft**, **Active**, **Retired**. A new record starts as **Draft**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  DRAFT --> RETIRED: retire
  ACTIVE --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Quality Characteristic lifecycle bar](/img/entities/quality-characteristic-record.jpg)

See [Quality Characteristic](/entities/quality-management/quality-characteristic/) for the record itself.

## Quality Plan: Quality plan lifecycle

States: **Draft**, **Active**, **Suspended**, **Retired**. A new record starts as **Draft**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
  DRAFT --> RETIRED: retire
  ACTIVE --> RETIRED: retire
  SUSPENDED --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Quality Plan lifecycle bar](/img/entities/quality-plan-record.jpg)

See [Quality Plan](/entities/quality-management/quality-plan/) for the record itself.

## Test Method: Test method lifecycle

States: **Draft**, **Active**, **Suspended**, **Retired**. A new record starts as **Draft**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
  DRAFT --> RETIRED: retire
  ACTIVE --> RETIRED: retire
  SUSPENDED --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Test Method lifecycle bar](/img/entities/test-method-record.jpg)

See [Test Method](/entities/quality-management/test-method/) for the record itself.

## Sampling Plan: Sampling plan lifecycle

States: **Draft**, **Active**, **Suspended**, **Retired**. A new record starts as **Draft**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
  DRAFT --> RETIRED: retire
  ACTIVE --> RETIRED: retire
  SUSPENDED --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Sampling Plan lifecycle bar](/img/entities/sampling-plan-record.jpg)

See [Sampling Plan](/entities/quality-management/sampling-plan/) for the record itself.

## Sampling Rule: Sampling rule lifecycle

States: **Draft**, **Active**, **Retired**. A new record starts as **Draft**; **Retired** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  DRAFT --> RETIRED: retire
  ACTIVE --> RETIRED: retire
```

Any role that may change the record may make any move the diagram draws.

![Sampling Rule lifecycle bar](/img/entities/sampling-rule-record.jpg)

See [Sampling Rule](/entities/quality-management/sampling-rule/) for the record itself.

## Quality Inspection: Quality inspection lifecycle

States: **Open**, **In progress**, **Passed**, **Failed**, **Conditional**, **Cancelled**. A new record starts as **Open**; **Passed**, **Failed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> IN_PROGRESS: start
  IN_PROGRESS --> CONDITIONAL: mark_conditional
  CONDITIONAL --> PASSED: mark_passed
  IN_PROGRESS --> FAILED: fail
  CONDITIONAL --> FAILED: fail
  OPEN --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
  CONDITIONAL --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Quality Inspection lifecycle bar](/img/entities/quality-inspection-record.jpg)

See [Quality Inspection](/entities/quality-management/quality-inspection/) for the record itself.

## Inspection Sample: Inspection sample lifecycle

States: **Selected**, **In testing**, **Tested**, **Rejected**, **Disposed**, **Cancelled**. A new record starts as **Selected**; **Rejected**, **Disposed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> SELECTED
  SELECTED --> IN_TESTING: mark_in_testing
  IN_TESTING --> TESTED: mark_tested
  SELECTED --> REJECTED: reject
  IN_TESTING --> REJECTED: reject
  TESTED --> REJECTED: reject
  IN_TESTING --> DISPOSED: mark_disposed
  TESTED --> DISPOSED: mark_disposed
  SELECTED --> CANCELLED: cancel
  IN_TESTING --> CANCELLED: cancel
  TESTED --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Inspection Sample lifecycle bar](/img/entities/inspection-sample-record.jpg)

See [Inspection Sample](/entities/quality-management/inspection-sample/) for the record itself.

## Nonconformance: Nonconformance lifecycle

States: **Open**, **Under review**, **Contained**, **Corrective action**, **Closed**, **Rejected**. A new record starts as **Open**; **Closed**, **Rejected** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> UNDER_REVIEW: review
  UNDER_REVIEW --> CORRECTIVE_ACTION: mark_corrective_action
  CORRECTIVE_ACTION --> CLOSED: close
  UNDER_REVIEW --> CONTAINED: mark_contained
  CONTAINED --> UNDER_REVIEW: resume
  CORRECTIVE_ACTION --> CONTAINED: mark_contained
  CONTAINED --> CORRECTIVE_ACTION: resume
  OPEN --> REJECTED: reject
  UNDER_REVIEW --> REJECTED: reject
  CORRECTIVE_ACTION --> REJECTED: reject
  CONTAINED --> REJECTED: reject
```

Any role that may change the record may make any move the diagram draws.

![Nonconformance lifecycle bar](/img/entities/nonconformance-record.jpg)

See [Nonconformance](/entities/quality-management/nonconformance/) for the record itself.

## Corrective Action: Corrective action lifecycle

States: **Open**, **Assigned**, **In progress**, **Verification**, **Completed**, **Cancelled**. A new record starts as **Open**; **Completed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> ASSIGNED: assign
  ASSIGNED --> IN_PROGRESS: start
  IN_PROGRESS --> VERIFICATION: mark_verification
  VERIFICATION --> COMPLETED: complete
  OPEN --> CANCELLED: cancel
  ASSIGNED --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
  VERIFICATION --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Corrective Action lifecycle bar](/img/entities/corrective-action-record.jpg)

See [Corrective Action](/entities/quality-management/corrective-action/) for the record itself.

## Corrective Action Verification: Corrective action verification lifecycle

States: **Open**, **In progress**, **Completed**, **Reopened**, **Cancelled**. A new record starts as **Open**; **Completed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> IN_PROGRESS: start
  IN_PROGRESS --> REOPENED: mark_reopened
  REOPENED --> COMPLETED: complete
  OPEN --> CANCELLED: cancel
  IN_PROGRESS --> CANCELLED: cancel
  REOPENED --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Corrective Action Verification lifecycle bar](/img/entities/corrective-action-verification-record.jpg)

See [Corrective Action Verification](/entities/quality-management/corrective-action-verification/) for the record itself.

## Return Disposition: Return disposition lifecycle

States: **Draft**, **Authorized**, **Executed**, **Cancelled**, **Exception**. A new record starts as **Draft**; **Executed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> AUTHORIZED: authorize
  AUTHORIZED --> EXECUTED: mark_executed
  AUTHORIZED --> EXCEPTION: mark_exception
  EXCEPTION --> AUTHORIZED: resolve_exception
  DRAFT --> CANCELLED: cancel
  AUTHORIZED --> CANCELLED: cancel
  EXCEPTION --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Return Disposition lifecycle bar](/img/entities/return-disposition-record.jpg)

See [Return Disposition](/entities/quality-management/return-disposition/) for the record itself.

## Certificate Of Analysis: Certificate of analysis lifecycle

States: **Draft**, **Approved**, **Issued**, **Superseded**, **Void**. A new record starts as **Draft**; **Superseded**, **Void** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> APPROVED: approve
  APPROVED --> ISSUED: issue
  DRAFT --> SUPERSEDED: mark_superseded
  APPROVED --> SUPERSEDED: mark_superseded
  ISSUED --> SUPERSEDED: mark_superseded
  DRAFT --> VOID: void
  APPROVED --> VOID: void
  ISSUED --> VOID: void
```

Any role that may change the record may make any move the diagram draws.

![Certificate Of Analysis lifecycle bar](/img/entities/certificate-of-analysis-record.jpg)

See [Certificate Of Analysis](/entities/quality-management/certificate-of-analysis/) for the record itself.

