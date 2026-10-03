---
title: "Processes"
sidebar_position: 3
description: "The automated multi-step processes this application runs."
---

# Processes

A process is a sequence of steps the application runs for you: create a task, update a record, call a service. A business rule usually starts it; you can also run one by hand from the Workflow Designer. Every run is logged step by step in the Workflow Monitor. This application has **11** processes.

![The Workflow Designer](/img/admin/workflow-definitions.jpg)

## Party exception raised {#party-exception-raised}

When a party is blocked, a high-priority task asks someone to resolve it.

Runs when a **Party** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Party exception raised process in the Workflow Designer](/img/processes/party-exception-raised.jpg)

## Exchange rate follow up required {#exchange-rate-follow-up-required}

When a exchange rate is cancelled, a task asks someone to settle what depended on it.

Runs when a **Exchange Rate** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Exchange rate follow up required process in the Workflow Designer](/img/processes/exchange-rate-follow-up-required.jpg)

## Product exception raised {#product-exception-raised}

When a product is blocked, a high-priority task asks someone to resolve it.

Runs when a **Product** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Product exception raised process in the Workflow Designer](/img/processes/product-exception-raised.jpg)

## Manufacturing work order follow up required {#manufacturing-work-order-follow-up-required}

When a manufacturing work order is cancelled, a task asks someone to settle what depended on it.

Runs when a **Manufacturing Work Order** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Manufacturing work order follow up required process in the Workflow Designer](/img/processes/manufacturing-work-order-follow-up-required.jpg)

## Manufacturing work order completion confirmed {#manufacturing-work-order-completion-confirmed}

When a manufacturing work order is completed, a task asks someone to confirm the outcome.

Runs when a **Manufacturing Work Order** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Manufacturing work order completion confirmed process in the Workflow Designer](/img/processes/manufacturing-work-order-completion-confirmed.jpg)

## Lot exception raised {#lot-exception-raised}

When a lot is quarantined, a high-priority task asks someone to resolve it.

Runs when a **Lot** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Lot exception raised process in the Workflow Designer](/img/processes/lot-exception-raised.jpg)

## Lot follow up required {#lot-follow-up-required}

When a lot is rejected, a task asks someone to settle what depended on it.

Runs when a **Lot** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Lot follow up required process in the Workflow Designer](/img/processes/lot-follow-up-required.jpg)

## Serial number exception raised {#serial-number-exception-raised}

When a serial number is quarantined, a high-priority task asks someone to resolve it.

Runs when a **Serial Number** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Serial number exception raised process in the Workflow Designer](/img/processes/serial-number-exception-raised.jpg)

## Quality inspection exception raised {#quality-inspection-exception-raised}

When a quality inspection is failed, a high-priority task asks someone to resolve it.

Runs when a **Quality Inspection** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Quality inspection exception raised process in the Workflow Designer](/img/processes/quality-inspection-exception-raised.jpg)

## Quality inspection follow up required {#quality-inspection-follow-up-required}

When a quality inspection is cancelled, a task asks someone to settle what depended on it.

Runs when a **Quality Inspection** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Quality inspection follow up required process in the Workflow Designer](/img/processes/quality-inspection-follow-up-required.jpg)

## Production record follow up required {#production-record-follow-up-required}

When a production record is rejected, a task asks someone to settle what depended on it.

Runs when a **Production Record** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Production record follow up required process in the Workflow Designer](/img/processes/production-record-follow-up-required.jpg)

