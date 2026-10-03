---
title: "Business Rules"
slug: /rules
sidebar_position: 4
description: "Create, edit and switch off the business rules that run when records are saved."
---

# Business Rules

**Open it:** dashboard → Application Dictionary → *Business Rules* (`/admin/rules`).

A **business rule** runs when a record is created, changed or deleted. It can **refuse the save with a message**, **fill in a field**, **create or update another record**, or **start a process**. Each rule is a **decision table**: *if* a condition holds, *then* do something.

![The Business Rules list](/img/rules.jpg)

## The list

Four counters sit above the list: **Total Rules**, **Active**, **Inactive** and **Entities** (how many windows have rules). Narrow the list with the search box (by rule name or entity) and the three filters **All Entities**, **All Operations** and **All Status**.

Each row shows the **Rule Name** (with a short id), the **Entity** it runs on, the **Operation** (CREATE, UPDATE or DELETE), its **Version**, **Status** (Active or Inactive), when it was **Updated**, and two actions: the **pencil** edits it and the **bin** deactivates it after you confirm (**Deactivate Rule**; the rule is switched off, not erased). **Refresh** re-reads the list and **New Rule** opens the form to create one.

The rule names come from the model, for example `partyRoleInvariantsBeforeCreate`: the entity, what it guards, and *Before* or *After* the save. Rules a model declares are listed here in your running application; you can add your own beside them.

## Create a rule

Choose **New Rule**.

![Create Business Rule](/img/rules-new.jpg)

1. **Entity**: the window the rule runs on (required).
2. **Rule Name**: a name you will recognise, for example *Validate Email Format* (required).
3. **Trigger Operation**: **CREATE**, **UPDATE** or **DELETE** (required).
4. Under **Decision Logic**, build the decision table (below).
5. Choose **Test Rule** to try a sample record (below), then **Create Rule**. **Cancel** discards it.

## The decision table

The decision table has an **IF** side (green headers are the outcomes) and a **THEN** side.

- **IF columns** hold the conditions. Either name a field of the entity in the column header (for example `email`) and write the test in each row (`== null`), or leave the header as **Select…** and write a whole expression in the cell, as the rules a model declares do: `status == "BLOCKED" and …`. Expressions combine fields with `and`, `or` and comparisons. In an update, `_previous_<field>` is the value before the change, so `status != _previous_status` is true only when the status has just changed.
- **THEN columns** hold what happens. The usual ones are **action** and **message**; others appear as you need them.
- **Add Rule Row** adds another *if/then* line. **+IF** and **+THEN** (at the right of the header) add condition and outcome columns. The small icon in a row copies it.
- The **hit policy** menu (it reads **Collect All** on the rules a model declares) decides what happens when several rows match: *Collect All* runs every matching row. **JSON** shows and edits the table as JSON; **Help** explains the editor.

### The actions a rule can take

| action | What it does |
| --- | --- |
| `prevent` | Refuses the save and shows the **message**. Nothing the rule's record would have changed is kept. |
| `validation-error` | Refuses the save like `prevent`, reported as a validation error against the form. |
| `set-field` | Writes a value into a field of the same record. |
| `create-entity` | Creates a record in another window, filled from the data you give. |
| `update-entity` | Updates a related record. |
| `trigger-workflow` | Starts a named process (see [Workflow Designer](workflow-definitions.md)). The process runs after the record is saved; if it fails, the failure is logged and the record still saves. |

Which outcome columns exist (for example the target entity, the link field, or the process name) depends on the action; pick the column header and fill the cell.

## Edit, test and switch off a rule

Open a rule with the pencil.

![Editing a rule](/img/rule-edit.jpg)

- **Rule Details** shows the **Entity**, **Operation**, **Version**, **Created** and **Last Updated**. The **Active** switch turns the rule on or off without deleting it.
- Change the decision table and choose **Save Changes**. **Cancel** leaves without saving.
- **Test Rule** opens a panel where you give a sample record as JSON and see what the rule would do, without saving anything.

![Testing a rule](/img/rule-test.jpg)

:::tip
Prefer several small rules to one large table. A rule that refuses a save should say, in its **message**, what to change.
:::

:::caution
A rule that comes from the model is regenerated when the application is regenerated. To keep a lasting change, change it in the model; a rule you create here is yours and survives regeneration.
:::

See [Write a business rule](../how-to/write-a-rule.md) for a worked example.
