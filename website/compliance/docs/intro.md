---
title: "Compliance, Risk and Governance"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Compliance, Risk and Governance, built on the CEDM common foundation."
---

# Compliance, Risk and Governance

Compliance, Risk and Governance, built on the CEDM common foundation.

![The Compliance, Risk and Governance dashboard](/img/dashboard.jpg)

## The domain it serves

**Compliance, Risk and Governance** covers Controls, Risks, Policies, Obligations, Assessments, Incidents, Audits. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Compliance management** — Policy, Control, Risk. Processes: Risk-assessment, Control-testing, Remediation, Audit

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Risk](/entities/compliance-management/risk/) | Represents a governance entity called Risk within the CEDM business model. |
| [Control](/entities/compliance-management/control/) | Represents a governance entity called Control within the CEDM business model. |
| [Policy](/entities/compliance-management/policy/) | Represents a governance entity called Policy within the CEDM business model. |
| [Finding](/entities/compliance,-risk-and-governance-records/finding/) | A governed observation of a control, audit, compliance, quality, or risk deficiency requiring disposition or remediation. |
| [Risk Assessment](/entities/compliance,-risk-and-governance-records/risk-assessment/) | A governed evaluation of a Risk's likelihood, impact, exposure, controls, and residual risk at a defined point in time. |
| [Audit Case](/entities/compliance,-risk-and-governance-records/audit-case/) | A governed audit investigation or review grouping scope, evidence, findings, actions, and conclusions. |
| [Audit Event](/entities/compliance,-risk-and-governance-records/audit-event/) | An immutable evidence record describing a significant governed action, state change, access, decision, or control event. |
| [Compliance Requirement](/entities/compliance,-risk-and-governance-records/compliance-requirement/) | A governed legal, regulatory, contractual, policy, or standards requirement against which enterprise controls and evidence are assessed. |
| [Filing](/entities/compliance,-risk-and-governance-records/filing/) | A governed submission or filing made to a court, regulator, registry, authority, or other external body with immutable submission evidence. |
| [Obligation](/entities/compliance,-risk-and-governance-records/obligation/) | A governed duty owed by a party under law, agreement, policy, order, or other authoritative source. |
| [Loss Event](/entities/compliance,-risk-and-governance-records/loss-event/) | A governed record of realized financial, operational, physical, legal, or other loss attributable to a risk or incident. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |
| [Exchange Rate](/entities/foundation/exchange-rate/) | Represents an auditable conversion rate between two currencies for a defined time and business purpose. |


## How the main records move

- A **Policy** goes Draft → Approved → Active → Suspended → Retired.
- A **Control** goes Draft → Active → Inactive → Retired.
- A **Risk** goes Identified → Assessed → Mitigating → Accepted → Closed → Materialized.
- A **Risk** goes Draft → Active → Completed → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Risk treatment follow up required**: When a risk treatment is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Compliance, Risk and Governance holds **33 business entities** and **30 lists of values**, organised into 4 categories:

- **Foundation** (22): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Compliance Management** (3): Policy, Control, Risk
- **Compliance, Risk and Governance records** (8): Audit Case, Audit Event, Compliance Requirement, Finding, Risk Assessment, Filing, Obligation, Loss Event
- **Reference Data** (30): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 13 record lifecycles, 13 business rules and 3 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
