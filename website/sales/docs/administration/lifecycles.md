---
title: "Record lifecycles"
sidebar_position: 2
description: "Every state a record can be in and every move between states."
---

# Record lifecycles

A lifecycle is the set of states a record can be in and the moves between them. The application enforces it on every write, through the screen and through the API: a move the diagram does not draw is refused for everyone, administrators included. Role restrictions narrow who may make a particular move. This application has **22** lifecycles.

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

See [Customer](/entities/sales/customer/) for the record itself.

## Lead: Lead lifecycle

States: **New**, **Qualifying**, **Qualified**, **Disqualified**, **Converted**, **Lost**. A new record starts as **New**; **Lost** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> NEW
  NEW --> QUALIFYING: mark_qualifying
  QUALIFYING --> QUALIFIED: mark_qualified
  QUALIFIED --> DISQUALIFIED: mark_disqualified
  DISQUALIFIED --> CONVERTED: mark_converted
  QUALIFYING --> LOST: mark_lost
  QUALIFIED --> LOST: mark_lost
  DISQUALIFIED --> LOST: mark_lost
  CONVERTED --> LOST: mark_lost
```

Any role that may change the record may make any move the diagram draws.

![Lead lifecycle bar](/img/entities/lead-record.jpg)

See [Lead](/entities/sales/lead/) for the record itself.

## Opportunity: Opportunity lifecycle

States: **Qualification**, **Discovery**, **Proposal**, **Negotiation**, **Won**, **Lost**. A new record starts as **Qualification**; **Lost** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> QUALIFICATION
  QUALIFICATION --> DISCOVERY: mark_discovery
  DISCOVERY --> PROPOSAL: mark_proposal
  PROPOSAL --> WON: mark_won
  DISCOVERY --> NEGOTIATION: mark_negotiation
  NEGOTIATION --> DISCOVERY: resume
  PROPOSAL --> NEGOTIATION: mark_negotiation
  NEGOTIATION --> PROPOSAL: resume
  WON --> NEGOTIATION: mark_negotiation
  NEGOTIATION --> WON: resume
  DISCOVERY --> LOST: mark_lost
  PROPOSAL --> LOST: mark_lost
  WON --> LOST: mark_lost
  NEGOTIATION --> LOST: mark_lost
```

Any role that may change the record may make any move the diagram draws.

![Opportunity lifecycle bar](/img/entities/opportunity-record.jpg)

See [Opportunity](/entities/sales/opportunity/) for the record itself.

## Quotation: Quotation lifecycle

States: **Draft**, **Submitted**, **Accepted**, **Rejected**, **Expired**, **Cancelled**. A new record starts as **Draft**; **Rejected**, **Expired**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> SUBMITTED: submit
  SUBMITTED --> ACCEPTED: accept
  DRAFT --> REJECTED: reject
  SUBMITTED --> REJECTED: reject
  ACCEPTED --> REJECTED: reject
  SUBMITTED --> EXPIRED: expire
  ACCEPTED --> EXPIRED: expire
  DRAFT --> CANCELLED: cancel
  SUBMITTED --> CANCELLED: cancel
  ACCEPTED --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Quotation lifecycle bar](/img/entities/quotation-record.jpg)

See [Quotation](/entities/sales/quotation/) for the record itself.

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

See [Sales Order](/entities/sales/sales-order/) for the record itself.

## Purchase Order: Purchase order lifecycle

States: **Draft**, **Approved**, **Sent**, **Partially received**, **Received**, **Cancelled**, **Closed**. A new record starts as **Draft**; **Closed**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> APPROVED: approve
  APPROVED --> SENT: mark_sent
  SENT --> PARTIALLY_RECEIVED: mark_partially_received
  PARTIALLY_RECEIVED --> RECEIVED: receive
  RECEIVED --> CLOSED: close
  DRAFT --> CANCELLED: cancel
  APPROVED --> CANCELLED: cancel
  SENT --> CANCELLED: cancel
  PARTIALLY_RECEIVED --> CANCELLED: cancel
  RECEIVED --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Purchase Order lifecycle bar](/img/entities/purchase-order-record.jpg)

See [Purchase Order](/entities/order-management/purchase-order/) for the record itself.

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

See [Product](/entities/pricing-and-commercial-terms/product/) for the record itself.

## Supplier: Supplier lifecycle

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

![Supplier lifecycle bar](/img/entities/supplier-record.jpg)

See [Supplier](/entities/pricing-and-commercial-terms/supplier/) for the record itself.

## Payment Term: Payment term lifecycle

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

![Payment Term lifecycle bar](/img/entities/payment-term-record.jpg)

See [Payment Term](/entities/pricing-and-commercial-terms/payment-term/) for the record itself.

## Product Category: Product category lifecycle

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

![Product Category lifecycle bar](/img/entities/product-category-record.jpg)

See [Product Category](/entities/product-and-service-management/product-category/) for the record itself.

## Discount Rule: Discount rule lifecycle

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

![Discount Rule lifecycle bar](/img/entities/discount-rule-record.jpg)

See [Discount Rule](/entities/sales-and-order-management-records/discount-rule/) for the record itself.

## Customer Return: Customer return lifecycle

States: **Draft**, **Authorized**, **In transit**, **Received**, **Inspection pending**, **Dispositioned**, **Completed**, **Cancelled**, **Exception**. A new record starts as **Draft**; **Dispositioned**, **Cancelled** ends the lifecycle.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> AUTHORIZED: authorize
  AUTHORIZED --> IN_TRANSIT: mark_in_transit
  IN_TRANSIT --> RECEIVED: receive
  RECEIVED --> COMPLETED: complete
  COMPLETED --> DISPOSITIONED: mark_dispositioned
  AUTHORIZED --> INSPECTION_PENDING: mark_inspection_pending
  INSPECTION_PENDING --> AUTHORIZED: resume
  IN_TRANSIT --> INSPECTION_PENDING: mark_inspection_pending
  INSPECTION_PENDING --> IN_TRANSIT: resume
  RECEIVED --> INSPECTION_PENDING: mark_inspection_pending
  INSPECTION_PENDING --> RECEIVED: resume
  AUTHORIZED --> EXCEPTION: mark_exception
  EXCEPTION --> AUTHORIZED: resolve_exception
  IN_TRANSIT --> EXCEPTION: mark_exception
  EXCEPTION --> IN_TRANSIT: resolve_exception
  RECEIVED --> EXCEPTION: mark_exception
  EXCEPTION --> RECEIVED: resolve_exception
  DRAFT --> CANCELLED: cancel
  AUTHORIZED --> CANCELLED: cancel
  IN_TRANSIT --> CANCELLED: cancel
  RECEIVED --> CANCELLED: cancel
  INSPECTION_PENDING --> CANCELLED: cancel
  EXCEPTION --> CANCELLED: cancel
```

Any role that may change the record may make any move the diagram draws.

![Customer Return lifecycle bar](/img/entities/customer-return-record.jpg)

See [Customer Return](/entities/sales-and-order-management-records/customer-return/) for the record itself.

## Brand: Brand lifecycle

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

![Brand lifecycle bar](/img/entities/brand-record.jpg)

See [Brand](/entities/sales-and-order-management-records/brand/) for the record itself.

