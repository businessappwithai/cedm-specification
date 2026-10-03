---
title: "Enterprise Management"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Enterprise Management, built on the CEDM common foundation."
---

# Enterprise Management

Enterprise Management, built on the CEDM common foundation.

![The Enterprise Management dashboard](/img/dashboard.jpg)

## The domain it serves

**Enterprise Management** covers Organization, Legal-entity, Governance, Master-data, Policies. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.


## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [ERP](/entities/enterprise-management/erp/) | Represents a root business entity called ERP within the CEDM business model. |
| [Business Transaction](/entities/enterprise-management/business-transaction/) | Represents a core business transaction called BusinessTransaction within the CEDM business model. |
| [Team](/entities/enterprise-management/team/) | A governed collaborative organizational grouping used to assign people, roles, work, ownership, and accountability. |
| [Organization Membership](/entities/enterprise-management/organization-membership/) | A governed relationship connecting a User or Party to an Organization with membership status and role context. |
| [Classification](/entities/enterprise-management/classification/) | A governed reusable classification scheme or category value used to consistently classify enterprise records without embedding uncontrolled free-text semantics. |
| [Approval](/entities/enterprise-management/approval/) | A governed approval decision or approval request associated with a business object, process, task, or controlled change. |
| [Assignment](/entities/enterprise-management/assignment/) | A governed allocation of responsibility for a Task or workflow activity to an eligible user, role, team, or organizational context. |
| [Activity](/entities/enterprise-management/activity/) | A governed CRM interaction or planned action such as a call, meeting, email, visit, or follow-up associated with commercial parties and opportunities. |
| [Business Event](/entities/enterprise-management/business-event/) | An immutable semantic record that a meaningful business fact occurred, suitable for cross-domain publication without replacing the source transaction. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |
| [Exchange Rate](/entities/foundation/exchange-rate/) | Represents an auditable conversion rate between two currencies for a defined time and business purpose. |
| [Unit Of Measure](/entities/foundation/unit-of-measure/) | Defines the measurement semantics that make numeric quantities comparable across CEDM workflows. |


## How the main records move

- A **ERP** goes Draft → Active → Suspended → Retired.
- A **Organization Membership** goes Pending → Active → Completed → Cancelled.
- A **Approval** goes Pending → Active → Completed → Cancelled.
- A **Assignment** goes Pending → Active → Completed → Cancelled.
- A **Business Transaction** goes Draft → Open → Approved → Posted → Completed → Cancelled → Reversed.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Organization membership follow up required**: When a organization membership is cancelled, a task asks someone to settle what depended on it.
- **Assignment follow up required**: When a assignment is cancelled, a task asks someone to settle what depended on it.
- **Business transaction follow up required**: When a business transaction is cancelled or reversed, a task asks someone to settle what depended on it.
- **Business transaction completion confirmed**: When a business transaction is completed or posted, a task asks someone to confirm the outcome.

The full list is under [Processes](/administration/processes/).

## What is inside

Enterprise Management holds **30 business entities** and **27 lists of values**, organised into 3 categories:

- **Foundation** (21): Party, Person, ERP, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Enterprise Management** (9): ERP, Team, Organization Membership, Classification, Approval, Assignment, Activity, Business Event, Business Transaction
- **Reference Data** (27): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 14 record lifecycles, 15 business rules and 6 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
