---
title: "Quality Measurement"
sidebar_label: "Quality Measurement"
sidebar_position: 8
description: "Structured auditable evidence for one quality characteristic observed during a QualityInspection."
---

# Quality Measurement

Structured auditable evidence for one quality characteristic observed during a QualityInspection. QualityMeasurement separates the factual observation from the inspection-level conclusion while retaining the exact plan configuration used for evaluation. Incoming inspection, supplier quality, laboratory testing, dimensional checks, sampling, process quality, compliance, nonconformance and corrective-action verification. QualityInspection is the execution context; InspectionSample supplies exact sample provenance when sampling applies; QualityPlanCharacteristic supplies authoritative plan-specific requirements; QualityCharacteristic supplies reusable meaning; QualityPlan supplies the parent definition; Product identifies material; UnitOfMeasure supplies dimensional semantics; Nonconformance may consume failed evidence. QualityPlan → QualityPlanCharacteristic → SamplingPlan/SamplingRule where required → QualityInspection → InspectionSample where required → measurement capture → validate characteristic/unit/method → evaluate against configured criteria → measurement result → aggregate inspection result → Nonconformance/disposition where required. Captured → evaluated → retained as completed inspection evidence; corrections use explicit amendment or remeasurement. Changes to governing plan characteristics, reusable characteristics, product or unit definitions affect open measurements and trigger revalidation. Completed measurements retain the configuration snapshots applicable when captured. A receiving plan configures WEIGHT at 9.8–10.2 KG. A QualityMeasurement records 10.35 KG, links to the governing QualityPlanCharacteristic and QualityCharacteristic, snapshots the applicable limits, and evaluates to FAIL.

## Finding records

Open **Quality Measurement** from the menu or from its card on the dashboard.

![The Quality Measurement list](/img/entities/quality-measurement-list.jpg)

The list shows Measurement Number, Characteristic Code, Measured Value, Measured Text, Unit Of Measure, Lower Limit, Upper Limit, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Creating a record

Choose **New** at the top of the list. The form opens on its own page, with the fields in sections. A badge beside each label names the control (Text, Dropdown, Date, and so on); a red star marks a required field; the question-mark icon shows that field's help; and a hint such as “max 300” shows the longest entry accepted.

![The Quality Measurement form](/img/entities/quality-measurement-new.jpg)

1. Fill in the fields described under [Fields](#fields).
2. These are required and must be completed before the record can be saved: **Measurement Number**, **Characteristic Code**, **Result**, **Measured At**, **Quality Inspection**.
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
| Measurement Number | Text | Required, Unique, Up to 100 characters | Human-facing measurement reference. Provides an operational identifier for one observation. Inspection review, audit and integration. Distinct from the parent inspection number. Supports individual observation traceability. Required. |
| Characteristic Code | Text | Required, Up to 100 characters | Snapshot of the quality characteristic business code evaluated by this observation. Preserves the human-readable characteristic identifier applicable when evidence was captured. Audit, reporting, exports and legacy integration. Must correspond to the linked QualityCharacteristic through QualityPlanCharacteristic and must not be treated as the authoritative configuration key. Provides readable historical context while the relationship graph supplies authoritative semantics. Required for operational readability and historical evidence. |
| Measured Value | Amount | Optional | Numeric value observed during inspection. Records the factual quantitative observation before evaluation. Acceptance evaluation, trend analysis and audit. Requires a compatible unit for dimensional characteristics. Supplies evidence used against configured acceptance criteria. Optional for categorical characteristics. |
| Measured Text | Text | Up to 1000 characters | Categorical or textual observation. Records observations such as color, grade, appearance or classification. Quality evaluation where numeric measurement is inappropriate. Used instead of measuredValue for categorical characteristics. Supplies structured qualitative evidence. Optional for numeric characteristics. |
| Unit Of Measure | Lookup | Optional | Unit in which a numeric measurement is expressed. Defines the dimensional interpretation of measuredValue. Comparison, conversion, reporting and audit. Must be compatible with the linked QualityPlanCharacteristic and QualityCharacteristic. Makes numeric observations semantically comparable. Optional for unitless or categorical characteristics. Pick a record from **Unit Of Measure**. |
| Lower Limit | Amount | Optional | Snapshot of the lower acceptance boundary applicable when the measurement was evaluated. Preserves the criterion used to evaluate the historical observation. Audit, reproducibility and review. Normally copied from QualityPlanCharacteristic rather than independently defining a new requirement. Makes the evaluation auditable even if the plan later changes. Optional when no lower boundary applies. |
| Upper Limit | Amount | Optional | Snapshot of the upper acceptance boundary applicable when the measurement was evaluated. Preserves the criterion used to evaluate the historical observation. Audit, reproducibility and review. Normally copied from QualityPlanCharacteristic rather than independently defining a new requirement. Makes the evaluation auditable even if the plan later changes. Optional when no upper boundary applies. |
| Result | Choice | Required | Evaluation of this measurement against its governing criterion. States whether the individual observation satisfies the applicable requirement. Inspection completion, nonconformance and analytics. Contributes evidence to QualityInspection.result but does not replace it. Supplies structured evidence for the overall inspection decision. Required. The result of the quality measurement is pass; set it when that is what the business means for this record. The result of the quality measurement is fail; set it when that is what the business means for this record. The result of the quality measurement is conditional; set it when that is what the business means for this record. The result of the quality measurement is not evaluated; set it when that is what the business means for this record. Choose one: Pass, Fail, Conditional, Not evaluated. |
| Measured At | Date and time | Required | Time when the observation was captured. Establishes chronology of the measured fact. Traceability, sampling, compliance and audit. Distinct from QualityInspection.inspectionDate. Preserves temporal measurement evidence. Required. |
| Method | Text | Up to 500 characters | Method or procedure used to obtain the observation. Identifies how the measurement or test was performed. Reproducibility, laboratory audit and compliance. Should align with the linked QualityPlanCharacteristic method where applicable. Establishes how evidence was produced. Optional when inherited unambiguously from the governing plan. |
| Notes | Text | Up to 2000 characters | Supporting context for the observation. Captures anomalies or conditions not represented structurally. Review and audit. Complements measured values and result without replacing them. Provides supporting evidence. Optional. |
| Quality Characteristic | Lookup | Optional | Reusable quality property observed by this measurement. Identifies the semantic property independently of a particular plan. Traceability, analytics, reuse, and audit. Should agree with the QualityCharacteristic reached through qualityPlanCharacteristic when both are populated. Provides reusable semantic context. Pick a record from **Quality Characteristic**. |
| Quality Plan Characteristic | Lookup | Optional | Plan-specific requirement used to interpret and evaluate this measurement. Identifies the exact configured characteristic, limits, method, unit, and requiredness governing the observation. Requirement traceability, acceptance evaluation, audit, and completion gating. Supplies authoritative evaluation context for the measurement. Pick a record from **Quality Plan Characteristic**. |
| Test Method | Lookup | Optional | Governed test procedure used to produce this observation. Identifies the authoritative reusable method applied during measurement. Reproducibility, compliance, laboratory audit, and analytics. Optional when no reusable controlled method applies. Must agree with the governing QualityPlanCharacteristic method configuration when that configuration requires a TestMethod. Pick a record from **Test Method**. |
| Quality Inspection | Lookup | Required | Inspection during which the measurement was captured. Provides the governing inspection context. Quality traceability and aggregate evaluation. Parent inspection controls measurement lifecycle. Pick a record from **Quality Inspection**. |
| Inspection Sample | Lookup | Optional | Exact governed inspection sample from which this observation was produced when sample-specific testing applies. Preserves provenance from SamplingPlan and SamplingRule execution through selected material to the resulting observation. Sample-level traceability, laboratory chain of custody, acceptance sampling, audit, and reproducibility. A measurement references zero or one InspectionSample because non-sampled or population-level observations may not have a sample record. When populated, the sample must belong to the same QualityInspection and the measurement must satisfy the characteristic controls applicable to that sample. Pick a record from **Inspection Sample**. |
| Quality Plan | Lookup | Optional | Quality plan under which the measurement was evaluated. Preserves the plan context for the observation. Audit, reporting, requirement traceability, and historical reconstruction. Identifies the governing plan when a direct plan relationship is needed for integration or historical evidence. Pick a record from **Quality Plan**. |
| Certificate Of Analysis | Lookup | Optional | The CertificateOfAnalysis this QualityMeasurement belongs to. Pick a record from **Certificate Of Analysis**. |

## How it connects to other records
- A quality measurement belongs to one **Quality Characteristic**.
- A quality measurement belongs to one **Quality Plan Characteristic**.
- A quality measurement belongs to one **Test Method**.
- A quality measurement belongs to one **Quality Inspection**.
- A quality measurement belongs to one **Inspection Sample**.
- A quality measurement belongs to one **Quality Plan**.
- A quality measurement belongs to one **Certificate Of Analysis**.

## Who may use it

Anyone who holds a role with access to the **Quality Measurement** window. Access is granted by role under [Roles and access](/administration/access/).
