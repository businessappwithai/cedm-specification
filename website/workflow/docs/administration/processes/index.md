---
title: "Processes"
sidebar_position: 3
description: "The automated multi-step processes this application runs."
---

# Processes

A process is a sequence of steps the application runs for you: create a task, update a record, call a service. A business rule usually starts it; you can also run one by hand from the Workflow Designer. Every run is logged step by step in the Workflow Monitor. This application has **5** processes.

![The Workflow Designer](/img/admin/workflow-definitions.jpg)

## Party exception raised {#party-exception-raised}

When a party is blocked, a high-priority task asks someone to resolve it.

Runs when a **Party** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Workflow** record.

![The Party exception raised process in the Workflow Designer](/img/processes/party-exception-raised.jpg)

## Exchange rate follow up required {#exchange-rate-follow-up-required}

When a exchange rate is cancelled, a task asks someone to settle what depended on it.

Runs when a **Exchange Rate** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Workflow** record.

![The Exchange rate follow up required process in the Workflow Designer](/img/processes/exchange-rate-follow-up-required.jpg)

## Process definition follow up required {#process-definition-follow-up-required}

When a process definition is cancelled, a task asks someone to settle what depended on it.

Runs when a **Process Definition** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Workflow** record.

![The Process definition follow up required process in the Workflow Designer](/img/processes/process-definition-follow-up-required.jpg)

## Process instance follow up required {#process-instance-follow-up-required}

When a process instance is cancelled, a task asks someone to settle what depended on it.

Runs when a **Process Instance** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Workflow** record.

![The Process instance follow up required process in the Workflow Designer](/img/processes/process-instance-follow-up-required.jpg)

## Process instance completion confirmed {#process-instance-completion-confirmed}

When a process instance is completed, a task asks someone to confirm the outcome.

Runs when a **Process Instance** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Workflow** record.

![The Process instance completion confirmed process in the Workflow Designer](/img/processes/process-instance-completion-confirmed.jpg)

