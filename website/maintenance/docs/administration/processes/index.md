---
title: "Processes"
sidebar_position: 3
description: "The automated multi-step processes this application runs."
---

# Processes

A process is a sequence of steps the application runs for you: create a task, update a record, call a service. A business rule usually starts it; you can also run one by hand from the Workflow Designer. Every run is logged step by step in the Workflow Monitor. This application has **10** processes.

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

## Asset exception raised {#asset-exception-raised}

When a asset is held, a high-priority task asks someone to resolve it.

Runs when a **Asset** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Asset exception raised process in the Workflow Designer](/img/processes/asset-exception-raised.jpg)

## Maintenance work order exception raised {#maintenance-work-order-exception-raised}

When a maintenance work order is on hold, a high-priority task asks someone to resolve it.

Runs when a **Maintenance Work Order** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Maintenance work order exception raised process in the Workflow Designer](/img/processes/maintenance-work-order-exception-raised.jpg)

## Maintenance work order follow up required {#maintenance-work-order-follow-up-required}

When a maintenance work order is cancelled, a task asks someone to settle what depended on it.

Runs when a **Maintenance Work Order** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Maintenance work order follow up required process in the Workflow Designer](/img/processes/maintenance-work-order-follow-up-required.jpg)

## Maintenance work order completion confirmed {#maintenance-work-order-completion-confirmed}

When a maintenance work order is completed, a task asks someone to confirm the outcome.

Runs when a **Maintenance Work Order** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Maintenance work order completion confirmed process in the Workflow Designer](/img/processes/maintenance-work-order-completion-confirmed.jpg)

## Repair estimate approval requested {#repair-estimate-approval-requested}

When a repair estimate is submitted, a task asks someone to decide on it.

Runs when a **Repair Estimate** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: decide on"]

```

1. **Raise a task: decide on** — creates a **Task** record.

![The Repair estimate approval requested process in the Workflow Designer](/img/processes/repair-estimate-approval-requested.jpg)

## Repair estimate follow up required {#repair-estimate-follow-up-required}

When a repair estimate is rejected or cancelled, a task asks someone to settle what depended on it.

Runs when a **Repair Estimate** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Repair estimate follow up required process in the Workflow Designer](/img/processes/repair-estimate-follow-up-required.jpg)

## Repair estimate completion confirmed {#repair-estimate-completion-confirmed}

When a repair estimate is completed, a task asks someone to confirm the outcome.

Runs when a **Repair Estimate** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Repair estimate completion confirmed process in the Workflow Designer](/img/processes/repair-estimate-completion-confirmed.jpg)

## Product exception raised {#product-exception-raised}

When a product is blocked, a high-priority task asks someone to resolve it.

Runs when a **Product** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Product exception raised process in the Workflow Designer](/img/processes/product-exception-raised.jpg)

