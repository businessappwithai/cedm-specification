---
title: "AI Model"
sidebar_label: "AI Model"
sidebar_position: 1
description: "Represents a ai entity called AIModel within the CEDM business model."
---

# AI Model

Represents a ai entity called AIModel within the CEDM business model. AIModel is a business concept with its own identity and lifecycle. It captures information that must remain understandable independently of a database, API, or user interface. Used by business processes, transactions, forms, reports, integrations, and domain capabilities that create, find, change, or relate AIModel records. The entity participates in a wider business graph through relationships with Organization, AIEvaluation, AIPrediction, AIPolicy. These relationships provide the context needed to interpret the record rather than treating its fields as isolated database columns. The entity lifecycle is governed by its status, invariants, and related business processes. State changes must preserve the declared business meaning and relationships. A typical AIModel record represents one identifiable business occurrence or master-data object that can be referenced by related CEDM processes.

## Finding records

Open **AI Model** from the menu or from its card on the dashboard.

![The AI Model list](/img/entities/aimodel-list.jpg)

The list shows Code, Name, Model Type, Status, Purpose, Risk Level, Owner, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The AI Model form](/img/entities/aimodel-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Code**, **Name**, **Model Type**, **Status**.
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
| Code | Text | Required, Unique, Up to 100 characters | A human-readable business code used to identify or reference the record in operational processes and integrations. Used when creating, reviewing, searching, validating, reporting on, or integrating AIModel records, where applicable. Its meaning is specific to AIModel; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Name | Text | Required, Up to 300 characters | The human-readable name used by people, reports, searches, and related business processes. Used when creating, reviewing, searching, validating, reporting on, or integrating AIModel records, where applicable. Its meaning is specific to AIModel; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Required because the business model cannot reliably interpret the record for its declared purpose without this value. |
| Model Type | Choice | Required | Captures the business meaning of model type for the AIModel. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating AIModel records, where applicable. Its meaning is specific to AIModel; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the classification state or classification in the context of AIModel. Represents the regression state or classification in the context of AIModel. Represents the forecasting state or classification in the context of AIModel. Represents the recommendation state or classification in the context of AIModel. Represents the generation state or classification in the context of AIModel. Represents the embedding state or classification in the context of AIModel. Represents the anomaly detection state or classification in the context of AIModel. Represents the other state or classification in the context of AIModel. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Classification, Regression, Forecasting, Recommendation, Generation, Embedding, Anomaly detection, Other. |
| Status | Choice | Required | The lifecycle state of the record. It controls which business actions are normally permitted and how the record is treated by related processes. Used when creating, reviewing, searching, validating, reporting on, or integrating AIModel records, where applicable. Its meaning is specific to AIModel; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the draft state or classification in the context of AIModel. Represents the training state or classification in the context of AIModel. Represents the validation state or classification in the context of AIModel. Represents the approved state or classification in the context of AIModel. Represents the deployed state or classification in the context of AIModel. Represents the suspended state or classification in the context of AIModel. Represents the retired state or classification in the context of AIModel. Required because the business model cannot reliably interpret the record for its declared purpose without this value. Choose one: Draft, Training, Validation, Approved, Deployed, Suspended, Retired. |
| Purpose | Text | Up to 4000 characters | Captures the business meaning of purpose for the AIModel. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating AIModel records, where applicable. Its meaning is specific to AIModel; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Optional because the business concept can remain valid when this value is not yet known or is not applicable. |
| Risk Level | Choice | Optional | Captures the business meaning of risk level for the AIModel. It is interpreted together with the entity's other attributes and relationships to support the processes that manage this record. Used when creating, reviewing, searching, validating, reporting on, or integrating AIModel records, where applicable. Its meaning is specific to AIModel; it must be interpreted with the entity's relationships, lifecycle, and business rules rather than as an isolated technical value. Represents the low state or classification in the context of AIModel. Represents the medium state or classification in the context of AIModel. Represents the high state or classification in the context of AIModel. Represents the critical state or classification in the context of AIModel. Optional because the business concept can remain valid when this value is not yet known or is not applicable. Choose one: Low, Medium, High, Critical. |
| Owner | Lookup | Optional | Connects AIModel to Organization so related business context can be navigated and enforced. Used when processes need to find or reason about Organization records associated with a AIModel. The declared cardinality 0..1 expresses how many related records may participate in the relationship. The relationship is part of the CEDM semantic graph and is interpreted together with source and target entities, ownership, conditions, and invariants. Pick a record from **Organization**. |

## How it connects to other records
- A ai model belongs to one **Organization**.
- A ai model has many **AI Model** records.
- A ai model has many **AI Prediction** records.
- A ai model has one **AI Policy**.

## Lifecycle: Ai model lifecycle

A ai model record starts as **Draft** and ends as **Retired**. Open a record and the bar above its fields shows its current **State** and, after **Next**, a button for each move that leaves it; choose one to make the move. Any move the diagram does not draw is refused, for everyone including the administrator.

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> TRAINING: mark_training
  TRAINING --> VALIDATION: mark_validation
  VALIDATION --> APPROVED: approve
  APPROVED --> DEPLOYED: mark_deployed
  TRAINING --> SUSPENDED: suspend
  SUSPENDED --> TRAINING: resume
  VALIDATION --> SUSPENDED: suspend
  SUSPENDED --> VALIDATION: resume
  APPROVED --> SUSPENDED: suspend
  SUSPENDED --> APPROVED: resume
  DEPLOYED --> SUSPENDED: suspend
  SUSPENDED --> DEPLOYED: resume
  DRAFT --> RETIRED: retire
  TRAINING --> RETIRED: retire
  VALIDATION --> RETIRED: retire
  APPROVED --> RETIRED: retire
  DEPLOYED --> RETIRED: retire
  SUSPENDED --> RETIRED: retire
```

| From | To | Move |
| --- | --- | --- |
| Draft | Training | Mark training |
| Training | Validation | Mark validation |
| Validation | Approved | Approve |
| Approved | Deployed | Mark deployed |
| Training | Suspended | Suspend |
| Suspended | Training | Resume |
| Validation | Suspended | Suspend |
| Suspended | Validation | Resume |
| Approved | Suspended | Suspend |
| Suspended | Approved | Resume |
| Deployed | Suspended | Suspend |
| Suspended | Deployed | Resume |
| Draft | Retired | Retire |
| Training | Retired | Retire |
| Validation | Retired | Retire |
| Approved | Retired | Retire |
| Deployed | Retired | Retire |
| Suspended | Retired | Retire |

![A AI Model record with its lifecycle bar](/img/entities/aimodel-record.jpg)

## Who may use it

Anyone who holds a role with access to the **AI Model** window. Access is granted by role under [Roles and access](/administration/access/).
