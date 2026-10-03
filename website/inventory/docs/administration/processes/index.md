---
title: "Processes"
sidebar_position: 3
description: "The automated multi-step processes this application runs."
---

# Processes

A process is a sequence of steps the application runs for you: create a task, update a record, call a service. A business rule usually starts it; you can also run one by hand from the Workflow Designer. Every run is logged step by step in the Workflow Monitor. This application has **19** processes.

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


## Inventory reservation follow up required {#inventory-reservation-follow-up-required}

When a inventory reservation is cancelled, a task asks someone to settle what depended on it.

Runs when a **Inventory Reservation** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Inventory reservation follow up required process in the Workflow Designer](/img/processes/inventory-reservation-follow-up-required.jpg)

## Inventory transfer follow up required {#inventory-transfer-follow-up-required}

When a inventory transfer is cancelled, a task asks someone to settle what depended on it.

Runs when a **Inventory Transfer** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Inventory transfer follow up required process in the Workflow Designer](/img/processes/inventory-transfer-follow-up-required.jpg)

## Inventory transfer completion confirmed {#inventory-transfer-completion-confirmed}

When a inventory transfer is completed, a task asks someone to confirm the outcome.

Runs when a **Inventory Transfer** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Inventory transfer completion confirmed process in the Workflow Designer](/img/processes/inventory-transfer-completion-confirmed.jpg)

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

## Product exception raised {#product-exception-raised}

When a product is blocked, a high-priority task asks someone to resolve it.

Runs when a **Product** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Product exception raised process in the Workflow Designer](/img/processes/product-exception-raised.jpg)

## Inventory location exception raised {#inventory-location-exception-raised}

When a inventory location is blocked, a high-priority task asks someone to resolve it.

Runs when a **Warehouse** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Inventory location exception raised process in the Workflow Designer](/img/processes/inventory-location-exception-raised.jpg)

## Putaway exception raised {#putaway-exception-raised}

When a putaway is exception, a high-priority task asks someone to resolve it.

Runs when a **Putaway** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Putaway exception raised process in the Workflow Designer](/img/processes/putaway-exception-raised.jpg)

## Putaway follow up required {#putaway-follow-up-required}

When a putaway is cancelled, a task asks someone to settle what depended on it.

Runs when a **Putaway** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Putaway follow up required process in the Workflow Designer](/img/processes/putaway-follow-up-required.jpg)

## Putaway completion confirmed {#putaway-completion-confirmed}

When a putaway is completed, a task asks someone to confirm the outcome.

Runs when a **Putaway** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Putaway completion confirmed process in the Workflow Designer](/img/processes/putaway-completion-confirmed.jpg)

## Picking exception raised {#picking-exception-raised}

When a picking is exception, a high-priority task asks someone to resolve it.

Runs when a **Picking** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Picking exception raised process in the Workflow Designer](/img/processes/picking-exception-raised.jpg)

## Picking follow up required {#picking-follow-up-required}

When a picking is cancelled, a task asks someone to settle what depended on it.

Runs when a **Picking** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Picking follow up required process in the Workflow Designer](/img/processes/picking-follow-up-required.jpg)

## Packing exception raised {#packing-exception-raised}

When a packing is exception, a high-priority task asks someone to resolve it.

Runs when a **Packing** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Packing exception raised process in the Workflow Designer](/img/processes/packing-exception-raised.jpg)

## Packing follow up required {#packing-follow-up-required}

When a packing is cancelled, a task asks someone to settle what depended on it.

Runs when a **Packing** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Packing follow up required process in the Workflow Designer](/img/processes/packing-follow-up-required.jpg)

## Wave follow up required {#wave-follow-up-required}

When a wave is cancelled, a task asks someone to settle what depended on it.

Runs when a **Wave** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Wave follow up required process in the Workflow Designer](/img/processes/wave-follow-up-required.jpg)

## Wave completion confirmed {#wave-completion-confirmed}

When a wave is completed, a task asks someone to confirm the outcome.

Runs when a **Wave** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Wave completion confirmed process in the Workflow Designer](/img/processes/wave-completion-confirmed.jpg)

