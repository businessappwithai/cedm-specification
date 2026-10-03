---
title: "Quality Management"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Quality Management, built on the CEDM common foundation."
---

# Quality Management

Quality Management, built on the CEDM common foundation.

![The Quality Management dashboard](/img/dashboard.jpg)

## The domain it serves

**Quality Management** covers Quality-plans, Inspections, Nonconformance, Corrective-actions, Audits, Certificates. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Quality management** — Quality Characteristic, Quality Plan Characteristic, Quality Plan, Test Method, Sampling Plan, Sampling Rule, Quality Inspection, Inspection Sample, Quality Measurement, Nonconformance, Corrective Action, Corrective Action Verification, Return Disposition, Certificate Of Analysis. Processes: Quality-definition, Characteristic-configuration, Test-method-governance, Sampling-plan, Sampling-rule, Sample-selection, Inspection, Measurement, Acceptance, Nonconformance, Corrective-action, Verification, Certificate-of-analysis, Release, Disposition

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Quality Inspection](/entities/quality-management/quality-inspection/) | Represents a quality inspection and its controlled sampling, measurements, result and disposition across inbound receiving and supplier-return workflows. |
| [Quality Measurement](/entities/quality-management/quality-measurement/) | Structured auditable evidence for one quality characteristic observed during a QualityInspection. |
| [Quality Plan Characteristic](/entities/quality-management/quality-plan-characteristic/) | Plan-specific configuration of a reusable quality characteristic, including acceptance criteria, execution guidance, and optional sampling policy. |
| [Quality Plan](/entities/quality-management/quality-plan/) | Governed definition of how a product or process is inspected. |
| [Nonconformance](/entities/quality-management/nonconformance/) | Represents a controlled quality deviation and its investigation, containment, disposition and corrective-action lifecycle. |
| [Sampling Plan](/entities/quality-management/sampling-plan/) | Reusable governed definition for selecting inspection samples. |
| [Inspection Sample](/entities/quality-management/inspection-sample/) | Execution record of the actual sample selected for a governed quality inspection. |
| [Sampling Rule](/entities/quality-management/sampling-rule/) | Conditional sampling configuration that translates a SamplingPlan into a deterministic sample size and acceptance threshold. |
| [Corrective Action](/entities/quality-management/corrective-action/) | Represents a controlled quality action from assignment through implementation and independent effectiveness verification. |
| [Quality Characteristic](/entities/quality-management/quality-characteristic/) | Reusable definition of one quality property that can be configured by quality plans and observed through quality measurements. |
| [Test Method](/entities/quality-management/test-method/) | Reusable governed procedure for producing quality evidence. |
| [Corrective Action Verification](/entities/quality-management/corrective-action-verification/) | Provides independent auditable evidence that a corrective or preventive action achieved its intended result. |
| [Return Disposition](/entities/quality-management/return-disposition/) | Provides the controlled bridge between a returned quantity, its operational outcome, quality evidence and the physical inventory execution. |
| [Certificate Of Analysis](/entities/quality-management/certificate-of-analysis/) | Controlled certificate presenting quality evidence for governed material. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |
| [Exchange Rate](/entities/foundation/exchange-rate/) | Represents an auditable conversion rate between two currencies for a defined time and business purpose. |


## How the main records move

- A **Quality Characteristic** goes Draft → Active → Retired.
- A **Quality Plan** goes Draft → Active → Suspended → Retired.
- A **Test Method** goes Draft → Active → Suspended → Retired.
- A **Sampling Plan** goes Draft → Active → Suspended → Retired.
- A **Sampling Rule** goes Draft → Active → Retired.
- A **Quality Inspection** goes Open → In progress → Passed → Failed → Conditional → Cancelled.
- A **Inspection Sample** goes Selected → In testing → Tested → Rejected → Disposed → Cancelled.
- A **Nonconformance** goes Open → Under review → Contained → Corrective action → Closed → Rejected.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Quality inspection exception raised**: When a quality inspection is failed, a high-priority task asks someone to resolve it.
- **Quality inspection follow up required**: When a quality inspection is cancelled, a task asks someone to settle what depended on it.
- **Inspection sample follow up required**: When a inspection sample is rejected or cancelled, a task asks someone to settle what depended on it.
- **Nonconformance approval requested**: When a nonconformance is under review, a task asks someone to decide on it.
- **Nonconformance follow up required**: When a nonconformance is rejected, a task asks someone to settle what depended on it.
- **Corrective action follow up required**: When a corrective action is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Quality Management holds **35 business entities** and **43 lists of values**, organised into 3 categories:

- **Foundation** (21): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Quality Management** (14): Quality Characteristic, Quality Plan Characteristic, Quality Plan, Test Method, Sampling Plan, Sampling Rule, Quality Inspection, Inspection Sample, Quality Measurement, Nonconformance, Corrective Action, Corrective Action Verification, …
- **Reference Data** (43): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 21 record lifecycles, 23 business rules and 13 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
