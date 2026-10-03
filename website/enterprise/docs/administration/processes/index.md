---
title: "Processes"
sidebar_position: 3
description: "The automated multi-step processes this application runs."
---

# Processes

A process is a sequence of steps the application runs for you: create a task, update a record, call a service. A business rule usually starts it; you can also run one by hand from the Workflow Designer. Every run is logged step by step in the Workflow Monitor. This application has **6** processes.

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

## Organization membership follow up required {#organization-membership-follow-up-required}

When a organization membership is cancelled, a task asks someone to settle what depended on it.

Runs when a **Organization Membership** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Organization membership follow up required process in the Workflow Designer](/img/processes/organization-membership-follow-up-required.jpg)

## Assignment follow up required {#assignment-follow-up-required}

When a assignment is cancelled, a task asks someone to settle what depended on it.

Runs when a **Assignment** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Assignment follow up required process in the Workflow Designer](/img/processes/assignment-follow-up-required.jpg)

## Business transaction follow up required {#business-transaction-follow-up-required}

When a business transaction is cancelled or reversed, a task asks someone to settle what depended on it.

Runs when a **Business Transaction** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Business transaction follow up required process in the Workflow Designer](/img/processes/business-transaction-follow-up-required.jpg)

## Business transaction completion confirmed {#business-transaction-completion-confirmed}

When a business transaction is completed or posted, a task asks someone to confirm the outcome.

Runs when a **Business Transaction** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Business transaction completion confirmed process in the Workflow Designer](/img/processes/business-transaction-completion-confirmed.jpg)

