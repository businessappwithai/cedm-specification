---
title: "Routing"
sidebar_label: "Routing"
sidebar_position: 9
description: "Versioned definition of manufacturing process sequence."
---

# Routing

Versioned definition of manufacturing process sequence. BillOfMaterial defines what materials are required; Routing defines how the output is produced. MRP, scheduling, costing, shop-floor execution, quality, and traceability. Product is the output; Operations define steps; WorkCenters provide capacity; ManufacturingWorkOrder executes a selected version. Draft → active → suspended/obsolete with versioned replacement. Routing changes revalidate planned/unreleased work; released/completed work retains historical version.

## Finding records

Open **Routing** from the menu or from its card on the dashboard.

![The Routing list](/img/entities/routing-list.jpg)

The list shows Code, Status, Product, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Routing form](/img/entities/routing-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Status**, **Product**.
3. For a dropdown that points at another window, pick the matching record; if the record you need does not exist yet, create it in its own window first. A dropdown may narrow to what you have already chosen, for example the states of the chosen country.
4. Choose **Create** (or **Save** in the toolbar). You return to the record, and it appears at the top of the list. If something is wrong the form says which field and why, and nothing is saved.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Code | Text | Required, Up to 100 characters | Business routing code. Human-recognizable process identifier. Engineering and production planning. Combined with version identifies controlled process definition. Required. |
| Status | Choice | Required | Governance state of routing. Controls eligibility for new production release. Engineering change and manufacturing control. Historical orders retain prior routing evidence. Being prepared. Eligible for production. Temporarily blocked. Superseded for new use. Required. Choose one: Draft, Active, Suspended, Obsolete. |
| Product | Lookup | Required | Output Product this routing produces. Associates process definition with manufactured item. Planning and production release. Exactly one output Product. Must match work-order output. Pick a record from **Product**. |

## How it connects to other records
- A routing belongs to one **Product**.
- A routing has many **Routing** records.
- A routing has many **Manufacturing Work Order** records.

## Lifecycle: Routing lifecycle

A routing record starts as **Draft** and ends as **Obsolete**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
  DRAFT --> OBSOLETE: mark_obsolete
  ACTIVE --> OBSOLETE: mark_obsolete
  SUSPENDED --> OBSOLETE: mark_obsolete
```

| From | To | Move |
| --- | --- | --- |
| Draft | Active | Activate |
| Active | Suspended | Suspend |
| Suspended | Active | Resume |
| Draft | Obsolete | Mark obsolete |
| Active | Obsolete | Mark obsolete |
| Suspended | Obsolete | Mark obsolete |

![A Routing record with its lifecycle bar](/img/entities/routing-record.jpg)

## Who may use it

Anyone who holds a role with access to the **Routing** window. Access is granted by role under [Roles and access](/administration/access/).
