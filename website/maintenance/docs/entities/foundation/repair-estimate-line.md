---
title: "Repair Estimate"
sidebar_label: "Repair Estimate"
sidebar_position: 21
description: "Represents one actionable or evaluative item within a repair estimate, connecting observed asset condition to proposed repair work and estimated cost."
---

# Repair Estimate

Represents one actionable or evaluative item within a repair estimate, connecting observed asset condition to proposed repair work and estimated cost. RepairEstimateLine is the detailed evidence behind the overall repair decision. It can identify what is damaged, where it is damaged, what repair is proposed, what material or replacement is required, and what labor and cost are expected. Used by inspectors, repair estimators, maintenance planners, depot operators, repair vendors, procurement, inventory, finance, and predictive analytics. RepairEstimate provides the overall decision and Container context. DamageCode describes the observed condition, ComponentCode identifies the affected area, RepairCode describes the proposed action, and MaterialCode/quantity describe expected material requirements. MaintenanceWorkOrder later converts approved repair scope into executable work; actual material consumption and labor are separate execution outcomes. Lines are created while an estimate is prepared, may be revised as inspection or pricing changes, become part of an approved scope when the parent estimate is approved, and remain historical evidence of the decision even after maintenance execution completes. An inspection finds a damaged container door gasket. A RepairEstimateLine records the damage code, affected component, proposed repair code, replacement material, quantity of one, estimated material cost, estimated labor cost, and total estimated line cost. After approval, the line can be used to create executable maintenance work and material demand.

## Finding records

Lines are added from the parent: open a **Repair Estimate** and choose the **Repair Estimate** tab.

The list shows Line Number, Repair Code, Damage Code, Component Code, Material Code, Quantity, Material Amount, with the most recently changed record first. The **Help** button beside the title opens this window's help text.

- **Search**: type in the search box above the grid to narrow the rows. **Search** at the top left opens advanced search, where you pick a field, a comparison (equals, contains, starts with, before, after, and so on) and a value.
- **Sort**: click a column heading; click again to reverse.
- **Refresh**: the refresh button at the top right re-reads the rows and every dropdown, so a record created a moment ago by someone else appears.
- **Export**: **CSV** downloads the rows you are looking at.
- **Open a record**: click a row. The line under the title, "Showing 1 to n of N entries", tells you how many rows match.

## Adding a line

Open the parent record, choose the **Repair Estimate** tab and use **New**. The line is tied to its parent automatically.

## Reading, changing and deleting a record

Click a row to open the record. Above the fields are the arrows that step through the list ("1 of 5"). Below them sit **Notes**, where anyone may leave a comment on the record, and the **Audit Trail**, which lists every change with who made it, when, and which fields changed.

- **Edit** (toolbar) makes the fields editable. Change them and choose **Save**; **Undo Changes** puts back what you changed and **Cancel Editing** leaves edit mode.
- **Copy Record** starts a new record from this one.
- **Delete Record** is available in edit mode and asks you to confirm; a record other records still depend on cannot be deleted.

Every change is also written to the [Audit Log](/administration/#audit-log).

## Fields

| Field | What you use | Rules | What to enter |
| --- | --- | --- | --- |
| Line Number | Whole number | Required | The sequence number identifying the line within a particular RepairEstimate revision. Used by inspectors, repair estimators, approvers, work-order planners, documents, and reports to discuss a specific estimate item. It is unique within the parent estimate revision rather than globally; the stable identity remains repairEstimateLineId. Required for human-readable estimate structure and traceability. |
| Repair Code | Text | Up to 50 characters | A standardized classification identifying the repair operation or repair action proposed for the line. Used for maintenance coding, labor standards, repair analytics, cost estimation, vendor instructions, and historical repair analysis. RepairCode describes the required action, while DamageCode describes the observed condition that caused the action and ComponentCode identifies the affected component. Optional when the repair action is still being assessed or is represented by another controlled classification. |
| Damage Code | Text | Up to 50 characters | A standardized classification identifying the damage or defect observed on the asset. Used for inspection, repair estimation, damage trend analysis, customer recovery, warranty/lease assessment, and predictive maintenance models. DamageCode explains the condition; RepairCode explains the proposed response. Keeping them separate allows the same damage type to lead to different repair or disposition decisions. Optional when no specific damage classification is available or the line represents a non-damage activity such as inspection or routine labor. |
| Component Code | Text | Up to 50 characters | Identifies the component, structural area, or equipment part affected by the estimated work. Used to locate the work physically, select repair procedures, determine material requirements, analyze recurring failures, and calculate component-level costs. ComponentCode provides the 'where' or affected part of the repair; DamageCode provides the condition and RepairCode provides the proposed action. Optional when the estimate line applies to the asset generally or the component is not yet identified. |
| Material Code | Text | Up to 100 characters | Identifies a material or replacement item expected to be consumed or installed as part of the repair. Used for material planning, inventory reservation, purchasing, supplier sourcing, costing, and maintenance execution. MaterialCode identifies what is consumed or installed; quantity and materialAmount determine the estimated requirement and financial impact. Optional for labor-only, inspection-only, adjustment, or repair methods that do not require a specific material. |
| Quantity | Amount | Optional | The estimated quantity of the material, replacement item, or measurable repair resource required for this line. Used to calculate material requirements, expected consumption, replacement cost, inventory demand, and repair scope. Quantity must be interpreted with MaterialCode and the applicable UnitOfMeasure; it is an estimate of required work/material, not necessarily actual consumption. Optional for activities where quantity is not meaningful or is represented through labor or fixed-price estimation. |
| Material Amount | Amount | Optional | The estimated cost attributable to materials consumed or installed for this repair line. Used for repair-cost calculation, approval, inventory valuation, supplier comparison, and actual-versus-estimated analysis. MaterialAmount belongs to the estimate and should not be interpreted as the actual inventory issue or supplier invoice amount. Optional when the line has no material component. |
| Labour Amount | Amount | Optional | The estimated labor cost required to perform the repair activity represented by the line. Used for repair economics, approval thresholds, workforce planning, vendor quotation comparison, and variance analysis. LabourAmount is an estimate of execution cost; actual technician time and actual labor cost belong to maintenance execution records. Optional for material-only or externally priced repair lines. |
| Replacement Amount | Amount | Optional | The estimated cost of replacing the affected component or asset element when replacement is the selected repair approach. Used to compare repair versus replacement economics and to support disposition decisions. ReplacementAmount may overlap with material cost depending on the organization's costing policy, so its relationship to MaterialAmount must be governed by the estimate's calculation rules. Optional when replacement is not being considered. |
| Total Amount | Amount | Optional | The estimated total financial impact of the repair requirement represented by this line. Used to aggregate RepairEstimate cost, support approval, compare alternatives, and feed repair/disposition analytics. It should reconcile to the applicable material, labor, replacement, discount, and other cost components according to the organization's estimate calculation policy. Optional while the line is incomplete or not financially valued. |
| Repair Estimate | Lookup | Required | Identifies the RepairEstimate revision to which this detailed repair requirement belongs. Supplies the container, estimate revision, status, disposition, currency, and approval context for the line. Every RepairEstimateLine belongs to exactly one RepairEstimate. The parent estimate provides decision context; the line provides the technical and cost detail supporting that decision. Pick a record from **Repair Estimate**. |

## How it connects to other records

A repair estimate is a line of a **Repair Estimate**. It has no window of its own: open the repair estimate and use the **Repair Estimate** tab to see and add lines.
- A repair estimate belongs to one **Repair Estimate**.

## What happens when you save
Business rules run around the save. They are listed here and explained in full under [Business rules](/administration/rules/).

| Rule | When | Order |
| --- | --- | --- |
| Repair estimate line invariants before create | before a repair estimate is created | 100 |
| Repair estimate line invariants before update | before a repair estimate is changed | 100 |

## Who may use it

Anyone who holds a role with access to the **Repair Estimate** window. Access is granted by role under [Roles and access](/administration/access/).
