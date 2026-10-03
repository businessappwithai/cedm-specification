---
title: "User"
sidebar_label: "User"
sidebar_position: 22
description: "Represents a security identity entity called Identity within the CEDM business model."
---

# User

Represents a security identity entity called Identity within the CEDM business model. Identity is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate Identity records. The entity participates in a wider business graph through relationships with User. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical Identity record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Lines are added from the parent: open a **User** and choose the **User** tab.

The list shows Identity Type, External Subject, Status, Issued At, Expires At, User, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **User** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Identity Type | Choice | Required | Captures the business meaning of identity type for the Identity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Identity records, where applicable. Its meaning is specific to Identity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the password state or classification in the context of Identity. Represents the sso state or classification in the context of Identity. Represents the oauth state or classification in the context of Identity. Represents the api key state or classification in the context of Identity. Represents the certificate state or classification in the context of Identity. Represents the biometric state or classification in the context of Identity. Represents the other state or classification in the context of Identity. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Password, Sso, Oauth, Api key, Certificate, Biometric, Other. |
| External Subject | Text | Up to 500 characters | Captures the business meaning of external subject for the Identity. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating Identity records, where applicable. Its meaning is specific to Identity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating Identity records, where applicable. Its meaning is specific to Identity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the active state or classification in the context of Identity. Represents the suspended state or classification in the context of Identity. Represents the revoked state or classification in the context of Identity. Represents the expired state or classification in the context of Identity. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Active, Suspended, Revoked, Expired. |
| Issued At | Date and time | Optional | Records when the issued event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating Identity records, where applicable. Its meaning is specific to Identity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Expires At | Date and time | Optional | Records when the expires event occurred. It establishes chronology, supports auditability, and helps coordinate related lifecycle and process activities. Used when creating, reviewing, searching, validating, reporting on, or integrating Identity records, where applicable. Its meaning is specific to Identity; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| User | Lookup | Required | Connects Identity to User so related business context can be navigated and enforced. Used when processes need to find or reason about User records associated with a Identity. The declared cardinality 1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **User**. |

## How it connects to other records

A user is a line of a **User**. It has no window of its own: open the user and use the **User** tab to see and add lines.
- A user belongs to one **User**.

## Lifecycle: Identity lifecycle

A user record starts as **Active** and ends as **Revoked** or **Expired**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> SUSPENDED: suspend
  SUSPENDED --> ACTIVE: resume
  ACTIVE --> REVOKED: revoke
  SUSPENDED --> REVOKED: revoke
  ACTIVE --> EXPIRED: expire
  SUSPENDED --> EXPIRED: expire
```

| From | To | Move |
| --- | --- | --- |
| Active | Suspended | Suspend |
| Suspended | Active | Resume |
| Active | Revoked | Revoke |
| Suspended | Revoked | Revoke |
| Active | Expired | Expire |
| Suspended | Expired | Expire |

## Who may use it

Anyone who holds a role with access to the **User** window. Access is granted by role under [Roles and access](/administration/access/).
