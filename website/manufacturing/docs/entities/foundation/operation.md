---
title: "Routing"
sidebar_label: "Routing"
sidebar_position: 21
description: "Standard process step within a manufacturing routing."
---

# Routing

Standard process step within a manufacturing routing. Defines work to perform, while ManufacturingWorkOrder records production authorization/execution. Routing, scheduling, costing, shop-floor instructions, and in-process quality. Routing sequences operations; WorkCenter provides capacity; QualityPlan governs inspection. Governed by parent routing version; historical released work retains its definition snapshot/reference. Definition/resource/quality changes affect future or unreleased work and trigger impact analysis for active work.

## Finding records

Lines are added from the parent: open a **Routing** and choose the **Routing** tab.

The list shows Sequence, Name, Standard Minutes, Routing, Work Center, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Routing** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Sequence | Whole number | Required | Execution order within routing. Defines process precedence. Scheduling and shop-floor control. Unique within Routing. Required. |
| Name | Text | Required, Up to 300 characters | Name of work performed. Communicates operation purpose. Instructions, planning, and reporting. Interpreted within Routing. Required. |
| Standard Minutes | Amount | Optional | Standard processing duration. Planning/costing expectation rather than actual elapsed time. Capacity scheduling and costing. Actual execution may differ. Optional when time standard is unavailable. |
| Routing | Lookup | Required | Parent manufacturing process definition. Supplies product/process context. Sequencing and version control. Exactly one Routing. Routing lifecycle controls eligibility. Pick a record from **Routing**. |
| Work Center | Lookup | Optional | Default capacity resource for the step. Defines where/by whom work is normally executed. Scheduling and costing. Optional for non-capacity-controlled steps. Resource availability constrains execution. Pick a record from **Work Center**. |

## How it connects to other records

A routing is a line of a **Routing**. It has no window of its own: open the routing and use the **Routing** tab to see and add lines.
- A routing belongs to one **Routing**.
- A routing belongs to one **Work Center**.

## Who may use it

Anyone who holds a role with access to the **Routing** window. Access is granted by role under [Roles and access](/administration/access/).
