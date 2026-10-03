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

## Healthcare encounter follow up required {#healthcare-encounter-follow-up-required}

When a healthcare encounter is cancelled, a task asks someone to settle what depended on it.

Runs when a **Healthcare Encounter** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Healthcare encounter follow up required process in the Workflow Designer](/img/processes/healthcare-encounter-follow-up-required.jpg)

## Healthcare encounter completion confirmed {#healthcare-encounter-completion-confirmed}

When a healthcare encounter is completed, a task asks someone to confirm the outcome.

Runs when a **Healthcare Encounter** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Healthcare encounter completion confirmed process in the Workflow Designer](/img/processes/healthcare-encounter-completion-confirmed.jpg)

## Healthcare order follow up required {#healthcare-order-follow-up-required}

When a healthcare order is cancelled, a task asks someone to settle what depended on it.

Runs when a **Healthcare Encounter** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Healthcare order follow up required process in the Workflow Designer](/img/processes/healthcare-order-follow-up-required.jpg)

## Healthcare order completion confirmed {#healthcare-order-completion-confirmed}

When a healthcare order is completed, a task asks someone to confirm the outcome.

Runs when a **Healthcare Encounter** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Healthcare order completion confirmed process in the Workflow Designer](/img/processes/healthcare-order-completion-confirmed.jpg)

## Procedure follow up required {#procedure-follow-up-required}

When a procedure is cancelled, a task asks someone to settle what depended on it.

Runs when a **Healthcare Encounter** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Procedure follow up required process in the Workflow Designer](/img/processes/procedure-follow-up-required.jpg)

## Prescription follow up required {#prescription-follow-up-required}

When a prescription is cancelled, a task asks someone to settle what depended on it.

Runs when a **Prescription** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Prescription follow up required process in the Workflow Designer](/img/processes/prescription-follow-up-required.jpg)

## Prescription completion confirmed {#prescription-completion-confirmed}

When a prescription is completed, a task asks someone to confirm the outcome.

Runs when a **Prescription** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Prescription completion confirmed process in the Workflow Designer](/img/processes/prescription-completion-confirmed.jpg)

## Allergy follow up required {#allergy-follow-up-required}

When a allergy is cancelled, a task asks someone to settle what depended on it.

Runs when a **Healthcare Patient** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Allergy follow up required process in the Workflow Designer](/img/processes/allergy-follow-up-required.jpg)

## Care plan follow up required {#care-plan-follow-up-required}

When a care plan is cancelled, a task asks someone to settle what depended on it.

Runs when a **Care Plan** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Care plan follow up required process in the Workflow Designer](/img/processes/care-plan-follow-up-required.jpg)

