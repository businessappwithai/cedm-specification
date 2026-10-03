---
title: "Healthcare"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Healthcare, built on the CEDM common foundation."
---

# Healthcare

Healthcare, built on the CEDM common foundation.

![The Healthcare dashboard](/img/dashboard.jpg)

## The domain it serves

**Healthcare** covers Patients, Providers, Encounters, Diagnoses, Procedures, Medications, Orders, Billing. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Healthcare Patient](/entities/healthcare/healthcare-patient/) | Represents a industry specialization called HealthcarePatient within the CEDM business model. |
| [Healthcare Provider](/entities/healthcare/healthcare-provider/) | Represents a healthcare party role called HealthcareProvider within the CEDM business model. |
| [Healthcare Encounter](/entities/healthcare/healthcare-encounter/) | Represents a healthcare transaction called HealthcareEncounter within the CEDM business model. |
| [Prescription](/entities/healthcare/prescription/) | Represents a healthcare transaction called Prescription within the CEDM business model. |
| [Medication](/entities/healthcare/medication/) | Represents a healthcare pharmaceutical entity called Medication within the CEDM business model. |
| [Care Plan](/entities/healthcare/care-plan/) | Represents CarePlan as a first-class governed CEDM business concept. |

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

- A **Healthcare Patient** goes Active → Inactive → Deceased → Merged.
- A **Healthcare Provider** goes Active → Inactive → Suspended → Retired.
- A **Healthcare Encounter** goes Planned → In progress → Completed → Cancelled.
- A **Healthcare Encounter** goes Draft → Active → Completed → Cancelled.
- A **Healthcare Encounter** goes Planned → In progress → Completed → Cancelled.
- A **Medication** goes Active → Inactive → Retired.
- A **Prescription** goes Draft → Active → Completed → Cancelled → Discontinued.
- A **Healthcare Patient** goes Draft → Active → Completed → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Healthcare encounter follow up required**: When a healthcare encounter is cancelled, a task asks someone to settle what depended on it.
- **Healthcare encounter completion confirmed**: When a healthcare encounter is completed, a task asks someone to confirm the outcome.
- **Healthcare order follow up required**: When a healthcare order is cancelled, a task asks someone to settle what depended on it.
- **Healthcare order completion confirmed**: When a healthcare order is completed, a task asks someone to confirm the outcome.
- **Procedure follow up required**: When a procedure is cancelled, a task asks someone to settle what depended on it.
- **Prescription follow up required**: When a prescription is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Healthcare holds **31 business entities** and **34 lists of values**, organised into 3 categories:

- **Foundation** (25): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Healthcare** (6): Healthcare Patient, Healthcare Provider, Healthcare Encounter, Medication, Prescription, Care Plan
- **Reference Data** (34): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 18 record lifecycles, 16 business rules and 11 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
