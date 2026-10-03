---
title: "Processes"
sidebar_position: 3
description: "The automated multi-step processes this application runs."
---

# Processes

A process is a sequence of steps the application runs for you: create a task, update a record, call a service. A business rule usually starts it; you can also run one by hand from the Workflow Designer. Every run is logged step by step in the Workflow Monitor. This application has **4** processes.

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

## Regulatory submission approval requested {#regulatory-submission-approval-requested}

When a regulatory submission is submitted or under review, a task asks someone to decide on it.

Runs when a **Regulatory Submission** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: decide on"]

```

1. **Raise a task: decide on** — creates a **Task** record.

![The Regulatory submission approval requested process in the Workflow Designer](/img/processes/regulatory-submission-approval-requested.jpg)

## Regulatory submission follow up required {#regulatory-submission-follow-up-required}

When a regulatory submission is rejected, a task asks someone to settle what depended on it.

Runs when a **Regulatory Submission** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Regulatory submission follow up required process in the Workflow Designer](/img/processes/regulatory-submission-follow-up-required.jpg)

