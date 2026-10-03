---
title: "Workflow Designer"
slug: /workflow-definitions
sidebar_position: 5
description: "Design the multi-step processes the application runs."
---

# Workflow Designer

**Open it:** dashboard → Application Dictionary → *Workflow Designer* (`/admin/workflow-definitions`).

A **workflow** (also called a **process**) is a sequence of steps the application runs for you: create a task, update a record, compute a value, call a web service. A [business rule](rules.md) usually starts it, when a record reaches a state that needs follow-up. The subtitle on the window says it exactly: *visual process graphs that run after business-rule decisions*.

![The Workflow Designer list](/img/workflow-definitions.jpg)

## The list

Three counters show **Total workflows**, **Active** and **Entities covered**. **Filter by entity** narrows the list. Each row shows the **Name** (with its description beneath), the **Entity** it belongs to, the **Operation** that triggers it, its **Status** and when it was **Created**, with **View** and **Delete** at the right. A **Model-managed** badge marks a workflow declared in the model; it is read-only here, because the model is its source. Change it in the model and regenerate. **+ New Workflow** creates your own.

## Create a workflow

Choose **+ New Workflow**.

![New workflow definition](/img/workflow-definitions-new.jpg)

1. **Name** (required): for example *Apply Gold Discount*.
2. **Entity** (required): the window whose records start it.
3. **Trigger on**: the operation (CREATE, UPDATE or DELETE).
4. **Description** (optional).
5. Create it; the designer opens.

## The designer

![The workflow designer, chain view](/img/workflow-edit.jpg)

The header holds the **Name**, **Entity**, **Trigger on** and **Description**, the **Active** switch, and **Save Changes**.

The **Chain** view reads top to bottom: **WHEN** shows the trigger (for example *a Party is updated*), then **THEN** lists the steps in the order they run, with **Add a step** beneath. Each step shows what it does in plain words (for example *Create a record: Create a Task with 6 fields*). Click a step to edit it.

The palette at the right adds steps (drag, or click):

| Step | What it does |
| --- | --- |
| **UpdateEntity** | Updates a field on a record. |
| **CreateEntity** | Inserts a new record in another window; its result can be named and used by later steps. |
| **DeleteEntity** | Removes a record (soft-deleted unless you ask otherwise, so the audit trail still resolves). |
| **Decision** | Runs a decision table and publishes what it decides. |
| **Formula** | Computes a value and keeps it for later steps. |
| **REST** | Calls an external web address and keeps the response. |

The **Diagram** tab draws the same process as a flow chart.

![The workflow designer, diagram view](/img/workflow-diagram.jpg)

If a step fails, the run stops there and the rest never happen. Every run is logged step by step in the [Workflow Monitor](workflows.md).

See [Design a process](../how-to/design-a-process.md).
