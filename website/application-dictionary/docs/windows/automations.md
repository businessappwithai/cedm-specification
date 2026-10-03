---
title: "Automations"
slug: /automations
sidebar_position: 7
description: "Build when-this-then-that chains without writing a process."
---

# Automations

**Open it:** *Automations* (`/admin/automations`).

An **automation** is one sentence: **when** something happens, **only if** some things are true, **then** do these things. You build it top to bottom and it runs top to bottom. If a step fails, the run stops there.

![The Automations window](/img/automations.jpg)

The left column lists your **Automations** and, under **Rule Tables**, the business rules that exist (each with its number of inputs and rows), so you can reuse them. The middle column holds a built-in guide, **How an automation runs**, with short sections: *Build your first one*, *Picking a trigger*, *Adding checks*, *Adding steps*, *Repeating steps*, *Naming a step's result*, *Using earlier values*, *Rule tables*, *Test runs* and *Reading a failure*. **Help** (top right) opens it again.

## Build one

Choose **+ New automation**.

![A new automation](/img/automation-new.jpg)

1. **The trigger.** Under **When this happens**, choose the **Record type** and **What happens to it**: *is created*, *is updated*, *is deleted*, or the moment before one of those. The note beneath says whether the record already exists when the automation runs.
2. **Checks.** Choose **Add a condition or an action** and add a check to run only when something is true: compare a field with a fixed value, or with another field on the same record. All checks must pass; no checks means it always runs.
3. **Steps.** Add what happens, in order. Each step can **update a field**, **create a record**, **delete a record**, **look up a rule table**, **work out a value** (set, copy, add, subtract, multiply), or **call a web service**. A step that produces something asks you to name it so later steps can use it.
4. A line under the title reports what still needs fixing before it can be published, for example “1 thing to fix before publishing”.
5. Choose **Publish**.

An automation is saved as its own document and listed under **Automations**. The process executor runs processes, so an automation is not run through **Execute** in the Workflow Designer.

:::note
Automations and [processes](workflow-definitions.md) overlap. Use an **automation** for a short chain you build in the browser; use a **process** for something the model declares or that needs the full step palette.
:::
