---
title: "Processes"
sidebar_position: 3
description: "The automated multi-step processes this application runs."
---

# Processes

A process is a sequence of steps the application runs for you: create a task, update a record, call a service. A business rule usually starts it; you can also run one by hand from the Workflow Designer. Every run is logged step by step in the Workflow Monitor. This application has **8** processes.

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

## Bank account exception raised {#bank-account-exception-raised}

When a bank account is blocked, a high-priority task asks someone to resolve it.

Runs when a **Bank Account** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Bank account exception raised process in the Workflow Designer](/img/processes/bank-account-exception-raised.jpg)

## Bank transaction exception raised {#bank-transaction-exception-raised}

When a bank transaction is failed, a high-priority task asks someone to resolve it.

Runs when a **Bank Transaction** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Bank transaction exception raised process in the Workflow Designer](/img/processes/bank-transaction-exception-raised.jpg)

## Bank transaction follow up required {#bank-transaction-follow-up-required}

When a bank transaction is reversed, a task asks someone to settle what depended on it.

Runs when a **Bank Transaction** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Bank transaction follow up required process in the Workflow Designer](/img/processes/bank-transaction-follow-up-required.jpg)

## Bank loan follow up required {#bank-loan-follow-up-required}

When a bank loan is cancelled, a task asks someone to settle what depended on it.

Runs when a **Bank Loan** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Bank loan follow up required process in the Workflow Designer](/img/processes/bank-loan-follow-up-required.jpg)

## Credit follow up required {#credit-follow-up-required}

When a credit is cancelled, a task asks someone to settle what depended on it.

Runs when a **Credit** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Credit follow up required process in the Workflow Designer](/img/processes/credit-follow-up-required.jpg)

## Credit completion confirmed {#credit-completion-confirmed}

When a credit is completed, a task asks someone to confirm the outcome.

Runs when a **Credit** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Credit completion confirmed process in the Workflow Designer](/img/processes/credit-completion-confirmed.jpg)

