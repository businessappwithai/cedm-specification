---
title: "Education"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Education, built on the CEDM common foundation."
---

# Education

Education, built on the CEDM common foundation.

![The Education dashboard](/img/dashboard.jpg)

## The domain it serves

**Education** covers Institutions, Programs, Courses, Students, Admissions, Enrollment, Assessments, Fees. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Education Program](/entities/education/education-program/) | Represents a education entity called EducationProgram within the CEDM business model. |
| [Education Course](/entities/education/education-course/) | Represents a education entity called EducationCourse within the CEDM business model. |
| [Education Student](/entities/education/education-student/) | Represents a education entity called EducationStudent within the CEDM business model. |

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

- A **Education Program** goes Draft → Active → Suspended → Retired.
- A **Education Course** goes Draft → Active → Inactive → Retired.
- A **Education Student** goes Applicant → Active → Suspended → Graduated → Withdrawn → Alumni.
- A **Education Student** goes Pending → Active → Completed → Withdrawn → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Enrollment follow up required**: When a enrollment is cancelled, a task asks someone to settle what depended on it.
- **Enrollment completion confirmed**: When a enrollment is completed, a task asks someone to confirm the outcome.

The full list is under [Processes](/administration/processes/).

## What is inside

Education holds **25 business entities** and **27 lists of values**, organised into 3 categories:

- **Foundation** (22): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Education** (3): Education Program, Education Course, Education Student
- **Reference Data** (27): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 13 record lifecycles, 11 business rules and 4 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
