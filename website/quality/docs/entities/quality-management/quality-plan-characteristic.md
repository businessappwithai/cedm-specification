---
title: "Quality Plan Characteristic"
sidebar_label: "Quality Plan Characteristic"
sidebar_position: 10
description: "Plan-specific configuration of a reusable quality characteristic, including acceptance criteria, execution guidance, and optional sampling policy."
---

# Quality Plan Characteristic

Plan-specific configuration of a reusable quality characteristic, including acceptance criteria, execution guidance, and optional sampling policy. QualityPlanCharacteristic answers how a QualityCharacteristic is controlled in one particular QualityPlan and, when required, how its observations are sampled. This separation allows reusable characteristics and sampling policies to be combined without duplicating definitions. Quality-plan authoring, incoming inspection, supplier quality, process inspection, laboratory testing, compliance, sampling, audit, and analytics. QualityPlan provides the governing plan; QualityCharacteristic provides reusable meaning; SamplingPlan and SamplingRule govern sample selection; QualityMeasurement records observations; QualityInspection executes the plan; Nonconformance may consume failed results. Define QualityCharacteristic → configure QualityPlanCharacteristic → assign SamplingPlan when sampling is required → activate QualityPlan → create QualityInspection → select required sample → capture QualityMeasurements → evaluate against criteria → finalize inspection → create Nonconformance or disposition when criteria fail. Draft through governed plan configuration to active use; changes after execution require controlled versioning or replacement rather than silent mutation. Changes affect QualityPlan authoring, SamplingPlan/SamplingRule selection, open QualityInspections, QualityMeasurements, nonconformance evaluation, reporting, and downstream supplier or corrective-action workflows. Historical inspection evidence must retain the configuration applicable at capture time. QualityCharacteristic WEIGHT is configured as required and sampled under a receiving plan. The associated SamplingPlan selects 20 units from the lot; each selected unit receives a QualityMeasurement evaluated against the configured weight limits.

## Finding records

Open **Quality Plan Characteristic** from the menu or from its card on the dashboard.

The list shows Sequence Number, Required, Lower Limit, Upper Limit, Target Value, Unit Of Measure, Method, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Sequence Number**, **Required**, **Sampling Required**, **Quality Characteristic**, **Quality Plan**.
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
| Sequence Number | Whole number | Required | Execution or presentation order of this quality characteristic within the plan. Determines where the characteristic appears in inspection instructions and can support ordered sampling or testing. Inspection forms, operator guidance, reports, and workflow orchestration. Sequence is scoped to the QualityPlan and does not change the reusable characteristic's identity. Required where plan execution requires deterministic ordering. |
| Required | Yes / No | Required | Indicates whether evidence for this characteristic is mandatory for the governing plan. Determines whether the absence of a measurement can prevent inspection completion. Inspection validation, completion gating, audit, and exception handling. QualityInspection uses this setting when determining whether all required measurements have been evaluated. Required because optional and mandatory characteristics have different workflow consequences. |
| Lower Limit | Amount | Optional | Plan-specific lower acceptance boundary for a numeric characteristic. Defines the minimum acceptable value under this particular QualityPlan. Automated evaluation and inspection review. Applies only to the linked QualityCharacteristic in this plan and must use a compatible unit. Optional when the criterion has no lower numeric boundary. |
| Upper Limit | Amount | Optional | Plan-specific upper acceptance boundary for a numeric characteristic. Defines the maximum acceptable value under this particular QualityPlan. Automated evaluation and inspection review. Applies only to the linked QualityCharacteristic in this plan and must use a compatible unit. Optional when the criterion has no upper numeric boundary. |
| Target Value | Amount | Optional | Preferred numeric target for the characteristic under this plan. Represents the desired value rather than the minimum or maximum acceptance boundary. Process optimization, inspection guidance, analytics, and trend analysis. Must be compatible with the characteristic data type and acceptance limits. Optional where only pass/fail boundaries are relevant. |
| Unit Of Measure | Lookup | Optional | Unit used for numeric limits and target values in this plan configuration. Gives dimensional meaning to the configured numeric criteria. Measurement evaluation, conversion, reporting, and audit. Must be dimensionally compatible with the QualityCharacteristic and QualityMeasurement unit. Optional for unitless or non-numeric characteristics. Pick a record from **Unit Of Measure**. |
| Method | Text | Up to 500 characters | Plan-specific procedure or method required to evaluate the characteristic. Defines how the characteristic must be observed when this plan is executed. Inspection instructions, reproducibility, compliance, and audit. May refine or override the reusable QualityCharacteristic evaluationMethod. Optional when the reusable characteristic method is sufficient. |
| Sampling Required | Yes / No | Required | Indicates whether this characteristic participates in explicit sampling controls under the plan. Distinguishes characteristics that require sampled observations from those evaluated on every applicable inspection item. Sampling workflow design and inspection execution. When true, the samplingPlan relationship identifies the governed selection policy used for this characteristic. Required to make sampling participation explicit. |
| Quality Characteristic | Lookup | Required | Reusable quality property being controlled by this plan configuration. Identifies what is observed while this entity supplies the context-specific acceptance rules. Reuse, semantic interpretation, measurement linkage, and governance. Every configuration references exactly one reusable QualityCharacteristic. Separating reusable meaning from plan-specific criteria prevents conflicting definitions when the same property is used by multiple plans. Pick a record from **Quality Characteristic**. |
| Quality Plan | Lookup | Required | QualityPlan in which this characteristic requirement is configured. Provides the governing inspection context for the requirement. Plan authoring, inspection execution, traceability, and lifecycle control. Every configuration belongs to exactly one QualityPlan. The plan determines when and why the configured characteristic is evaluated. Pick a record from **Quality Plan**. |
| Test Method | Lookup | Optional | Governed reusable procedure required to evaluate this characteristic in the plan. Replaces ambiguous free-text method interpretation with an authoritative method definition while allowing method text to remain a historical or integration snapshot. Inspection execution, laboratory testing, reproducibility, training, compliance, and audit. A plan characteristic uses zero or one governed TestMethod when a reusable controlled method applies. TestMethod defines how evidence is produced; this entity defines what criteria that evidence must satisfy. Pick a record from **Test Method**. |
| Sampling Plan | Lookup | Optional | SamplingPlan governing how observations of this characteristic are selected when samplingRequired is true. Connects a plan-specific characteristic requirement to the deterministic sample-selection policy used during inspection. Sample-size calculation, inspection execution, completion gating, audit, and reproducibility. A characteristic requirement uses zero or one sampling plan; zero is appropriate when every applicable unit is evaluated or sampling is governed elsewhere. SamplingPlan defines selection policy; SamplingRule supplies conditional sample quantities and acceptance thresholds. Pick a record from **Sampling Plan**. |

## How it connects to other records
- A quality plan characteristic belongs to one **Quality Characteristic**.
- A quality plan characteristic belongs to one **Quality Plan**.
- A quality plan characteristic belongs to one **Test Method**.
- A quality plan characteristic belongs to one **Sampling Plan**.
- A quality plan characteristic has many **Quality Measurement** records.

## Who may use it

Anyone who holds a role with access to the **Quality Plan Characteristic** window. Access is granted by role under [Roles and access](/administration/access/).
