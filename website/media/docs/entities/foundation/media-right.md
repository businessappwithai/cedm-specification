---
title: "Media Content"
sidebar_label: "Media Content"
sidebar_position: 14
description: "Represents a media legal entity called MediaRight within the CEDM business model."
---

# Media Content

Represents a media legal entity called MediaRight within the CEDM business model. MediaRight is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate MediaRight records. The entity participates in a wider business graph through relationships with MediaContent, Party, Contract. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical MediaRight record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Lines are added from the parent: open a **Media Content** and choose the **Media Content** tab.

The list shows Right Type, Territory, Valid From, Valid To, Status, Content, Holder, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Media Content** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Right Type | Text | Required, Up to 100 characters | Captures the business meaning of right type for the MediaRight. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating MediaRight records, where applicable. Its meaning is specific to MediaRight; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Territory | Text | Up to 200 characters | Captures the business meaning of territory for the MediaRight. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating MediaRight records, where applicable. Its meaning is specific to MediaRight; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Valid From | Date | Optional | Captures the business meaning of valid from for the MediaRight. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating MediaRight records, where applicable. Its meaning is specific to MediaRight; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Valid To | Date | Optional | Captures the business meaning of valid to for the MediaRight. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating MediaRight records, where applicable. Its meaning is specific to MediaRight; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating MediaRight records, where applicable. Its meaning is specific to MediaRight; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the pending state or classification in the context of MediaRight. Represents the active state or classification in the context of MediaRight. Represents the expired state or classification in the context of MediaRight. Represents the revoked state or classification in the context of MediaRight. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Pending, Active, Expired, Revoked. |
| Content | Lookup | Required | Connects MediaRight to MediaContent so related business context can be navigated and enforced. Used when processes need to find or reason about MediaContent records associated with a MediaRight. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Media Content**. |
| Holder | Lookup | Required | Connects MediaRight to Party so related business context can be navigated and enforced. Used when processes need to find or reason about Party records associated with a MediaRight. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Party**. |

## How it connects to other records

A media content is a line of a **Media Content**. It has no window of its own: open the media content and use the **Media Content** tab to see and add lines.
- A media content belongs to one **Media Content**.
- A media content belongs to one **Party**.

## Lifecycle: Media right lifecycle

A media content record starts as **Pending** and ends as **Expired** or **Revoked**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> ACTIVE: activate
  ACTIVE --> EXPIRED: expire
  PENDING --> REVOKED: revoke
  ACTIVE --> REVOKED: revoke
```

| From | To | Move |
| --- | --- | --- |
| Pending | Active | Activate |
| Active | Expired | Expire |
| Pending | Revoked | Revoke |
| Active | Revoked | Revoke |

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Media right invariants before create | before a media content is created | 100 |
| Media right invariants before update | before a media content is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Media Content** window. Access is granted by role under [Roles and access](/administration/access/).
