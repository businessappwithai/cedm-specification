---
title: "Customer Service and CRM"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Customer Service and CRM, built on the CEDM common foundation."
---

# Customer Service and CRM

Customer Service and CRM, built on the CEDM common foundation.

![The Customer Service and CRM dashboard](/img/dashboard.jpg)

## The domain it serves

**Customer Service and CRM** covers Customer-care, Cases, Complaints, Service-requests, Knowledge, Sl as. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Customer service** — Customer, Service Request, Task. Processes: Case-intake, Triage, Resolution, Escalation, Closure

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Service Request](/entities/customer-service/service-request/) | Represents a service management entity called ServiceRequest within the CEDM business model. |
| [Customer](/entities/customer-service/customer/) | Represents the commercial customer role of a Party. |
| [Service Level Agreement](/entities/customer-service-and-crm-records/service-level-agreement/) | Governed measurable service commitment. |
| [Incident](/entities/customer-service-and-crm-records/incident/) | A governed record of an adverse, disruptive, security, operational, safety, compliance, or other risk event requiring response and analysis. |
| [Escalation](/entities/customer-service-and-crm-records/escalation/) | A governed workflow event raising overdue, breached, exceptional, or unresolved work to another responsibility or control level. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Party Role](/entities/foundation/party-role/) | The bridge between stable Party identity and contextual business participation. |
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |


## How the main records move

- A **Customer** goes Active → Inactive → Blocked → Retired.
- A **Service Request** goes Open → Triaged → Assigned → In progress → Resolved → Closed → Cancelled.
- A **Escalation** goes Pending → Active → Completed → Cancelled.
- A **Service Level Agreement** goes Draft → Active → Suspended → Retired.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Customer exception raised**: When a customer is blocked, a high-priority task asks someone to resolve it.
- **Service request follow up required**: When a service request is cancelled, a task asks someone to settle what depended on it.
- **Escalation follow up required**: When a escalation is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Customer Service and CRM holds **26 business entities** and **30 lists of values**, organised into 4 categories:

- **Foundation** (21): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Customer Service** (2): Customer, Service Request
- **Customer Service and CRM records** (3): Incident, Escalation, Service Level Agreement
- **Reference Data** (30): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 13 record lifecycles, 13 business rules and 5 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
