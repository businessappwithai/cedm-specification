---
title: "Service Level Agreement"
sidebar_label: "Service Level Agreement"
sidebar_position: 3
description: "Governed measurable service commitment."
---

# Service Level Agreement

Governed measurable service commitment. SLA defines service targets; service transactions provide actual timestamps/outcomes used to measure compliance. Customer service, support, maintenance and contractual service. ServiceRequest consumes SLA; Contract may establish commercial/legal basis. Draft to active/suspended to retired with historical versions retained.

## Finding records

Open **Service Level Agreement** from the menu or from its card on the dashboard.

The list shows Code, Response Target Minutes, Resolution Target Minutes, Status, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Status**.
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
| Code | Text | Required, Unique, Up to 100 characters | SLA business code. Human/integration identifier. Service configuration and reporting. Stable across display-name changes. Required. |
| Response Target Minutes | Whole number | Optional | Target elapsed minutes to first qualifying response. Defines response commitment. Deadline calculation/escalation. Calendar/pause policies may modify elapsed-time computation. Optional when SLA does not govern response. |
| Resolution Target Minutes | Whole number | Optional | Target elapsed minutes to qualifying resolution. Defines resolution commitment. Deadline calculation/escalation. Applied according to SLA calendar/pause policy. Optional when SLA does not govern resolution. |
| Status | Choice | Required | SLA lifecycle. Controls applicability to new service work. Service governance. Historical service measurements retain applied SLA version. Being configured. Eligible. Temporarily unavailable for new assignment. Closed to new use. Required. Choose one: Draft, Active, Suspended, Retired. |

## How it connects to other records
- A service level agreement has many **Service Request** records.

## Lifecycle: Service level agreement lifecycle

A service level agreement record starts as **Draft** and ends as **Retired**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE: activate
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
  DRAFT --> RETIRED: retire
  ACTIVE --> RETIRED: retire
  SUSPENDED --> RETIRED: retire
```

| From | To | Move |
| --- | --- | --- |
| Draft | Active | Activate |
| Active | Suspended | Suspend |
| Suspended | Active | Resume |
| Draft | Retired | Retire |
| Active | Retired | Retire |
| Suspended | Retired | Retire |

## Who may use it

Anyone who holds a role with access to the **Service Level Agreement** window. Access is granted by role under [Roles and access](/administration/access/).
