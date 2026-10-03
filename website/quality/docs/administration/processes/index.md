---
title: "Processes"
sidebar_position: 3
description: "The automated multi-step processes this application runs."
---

# Processes

A process is a sequence of steps the application runs for you: create a task, update a record, call a service. A business rule usually starts it; you can also run one by hand from the Workflow Designer. Every run is logged step by step in the Workflow Monitor. This application has **13** processes.

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

## Inspection sample follow up required {#inspection-sample-follow-up-required}

When a inspection sample is rejected or cancelled, a task asks someone to settle what depended on it.

Runs when a **Inspection Sample** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Inspection sample follow up required process in the Workflow Designer](/img/processes/inspection-sample-follow-up-required.jpg)

## Nonconformance approval requested {#nonconformance-approval-requested}

When a nonconformance is under review, a task asks someone to decide on it.

Runs when a **Nonconformance** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: decide on"]

```

1. **Raise a task: decide on** — creates a **Task** record.

![The Nonconformance approval requested process in the Workflow Designer](/img/processes/nonconformance-approval-requested.jpg)

## Nonconformance follow up required {#nonconformance-follow-up-required}

When a nonconformance is rejected, a task asks someone to settle what depended on it.

Runs when a **Nonconformance** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Nonconformance follow up required process in the Workflow Designer](/img/processes/nonconformance-follow-up-required.jpg)

## Corrective action follow up required {#corrective-action-follow-up-required}

When a corrective action is cancelled, a task asks someone to settle what depended on it.

Runs when a **Corrective Action** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Corrective action follow up required process in the Workflow Designer](/img/processes/corrective-action-follow-up-required.jpg)

## Corrective action verification follow up required {#corrective-action-verification-follow-up-required}

When a corrective action verification is cancelled, a task asks someone to settle what depended on it.

Runs when a **Corrective Action Verification** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Corrective action verification follow up required process in the Workflow Designer](/img/processes/corrective-action-verification-follow-up-required.jpg)

## Corrective action verification completion confirmed {#corrective-action-verification-completion-confirmed}

When a corrective action verification is completed, a task asks someone to confirm the outcome.

Runs when a **Corrective Action Verification** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: confirm"]

```

1. **Raise a task: confirm** — creates a **Task** record.

![The Corrective action verification completion confirmed process in the Workflow Designer](/img/processes/corrective-action-verification-completion-confirmed.jpg)

## Return disposition exception raised {#return-disposition-exception-raised}

When a return disposition is exception, a high-priority task asks someone to resolve it.

Runs when a **Return Disposition** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: resolve"]

```

1. **Raise a task: resolve** — creates a **Task** record.

![The Return disposition exception raised process in the Workflow Designer](/img/processes/return-disposition-exception-raised.jpg)

## Return disposition follow up required {#return-disposition-follow-up-required}

When a return disposition is cancelled, a task asks someone to settle what depended on it.

Runs when a **Return Disposition** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Return disposition follow up required process in the Workflow Designer](/img/processes/return-disposition-follow-up-required.jpg)

## Certificate of analysis follow up required {#certificate-of-analysis-follow-up-required}

When a certificate of analysis is void, a task asks someone to settle what depended on it.

Runs when a **Certificate Of Analysis** is changed, started by a business rule.

```mermaid
flowchart TD
  S0["Raise a task: follow up on"]

```

1. **Raise a task: follow up on** — creates a **Task** record.

![The Certificate of analysis follow up required process in the Workflow Designer](/img/processes/certificate-of-analysis-follow-up-required.jpg)

