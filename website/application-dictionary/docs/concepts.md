---
title: "Concepts"
sidebar_position: 2
description: "The vocabulary of the Application Dictionary."
---

# Concepts

## The pieces

| Term | What it is | Where you maintain it |
| --- | --- | --- |
| **Table** | A business table: one kind of record, such as Customer or Invoice. | [Table and Column](windows/tables.md) |
| **Column** | One piece of information a table holds, with a type, a length and whether it is required. | [Table and Column](windows/tables.md) |
| **Window** | A screen a user can open from the menu: its list and its record. | [Window, Tab and Field](windows/windows.md) |
| **Tab** | A part of a window showing one table. A parent record shows its lines on tabs beneath its fields. | [Window, Tab and Field](windows/windows.md) |
| **Field** | One control on a tab, showing one column: its label, order, help text and whether it is shown, in the grid, or read-only. | [Window, Tab and Field](windows/windows.md), [Field Layout Manager](windows/fields.md) |
| **Reference** | The kind of value a column holds, which decides its control: text, whole number, amount, date, yes/no, a list of choices, or a pick from another table. | [Reference](windows/references.md) |
| **List of values** | The choices of a *List* reference, such as the statuses of an order. In generated applications every list has its own business table, so its values are ordinary records. | [Reference](windows/references.md) and its own window |
| **Element** | A reusable column name with its label and help text, so the same concept reads the same everywhere. | [Element](windows/elements.md) |
| **Category** | A group of windows on the dashboard and menu. | [Entity Categories](windows/categories.md) |
| **Role** | A set of permissions. A user has roles; a role is granted windows. | [Role Administration](windows/roles.md) |
| **Business rule** | A decision table that runs when a record is saved: it can refuse the save, fill in a field, create or update another record, or start a process. | [Business Rules](windows/rules.md) |
| **Lifecycle** | The states a record can be in and the moves between them. Declared in the model; enforced on every write. | [Record lifecycles](windows/workflows.md) |
| **Process** | A multi-step sequence the application runs for you. | [Workflow Designer](windows/workflow-definitions.md) |
| **Automation** | A when-this-then-that chain built in the browser. | [Automations](windows/automations.md) |
| **Audit entry** | The tamper-evident record of one change. | [Audit Log](windows/audit.md) |
| **Setting** | An application-wide value, such as the application's name or the AI endpoint. | [System Configuration](windows/system.md) |

## Entities, windows and names

In your application's manual you will see **entities** such as *Customer*. An entity is a table that has a window. A *line* (an invoice line, an order line) has a table but **no window of its own**: it appears as a tab on its parent. A *list of values* is a table with a window under **Reference Data**.

Screens always name things by their **window, tab and field labels**, never by table or column names. The administrator windows in this manual are the one place table and column names appear, because there they are the subject.

## Where each setting lives

- **In the model** (`*.cedm.yaml` / `*.eml.yaml`): the entities, their columns and help text, lifecycles, rules, processes, roles, reports. Regenerating the application writes them into the dictionary. Items declared in the model are marked **Model-managed**; changing them means changing the model and regenerating.
- **In the dictionary**: layout, labels, ordering, visibility, categories, extra rules and automations an administrator adds in the running application. These survive regeneration.
- **In settings**: values such as the application name and the AI endpoint.

## Access in three steps

1. **Window access**: a role is granted windows; a window it does not hold is absent from its menu and refused if opened by address.
2. **Action restrictions**: the model can restrict create, change or delete on an entity to named roles.
3. **Lifecycle moves**: the lifecycle decides which moves exist; role rules decide who may make them. An administrator bypasses the role rules but not the lifecycle.
