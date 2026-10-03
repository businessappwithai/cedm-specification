---
title: "Security and Identity"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Security and Identity, built on the CEDM common foundation."
---

# Security and Identity

Security and Identity, built on the CEDM common foundation.

![The Security and Identity dashboard](/img/dashboard.jpg)

## The domain it serves

**Security and Identity** covers Users, Identities, Roles, Permissions, Credentials, Sessions, Policies, Events. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Identity and access management** — User, User, Role, Permission. Processes: Provisioning, Authentication, Authorization, Deprovisioning

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [User](/entities/identity-and-access-management/user/) | Represents a identity entity called User within the CEDM business model. |
| [Security Incident](/entities/security-and-identity-records/security-incident/) | Represents a security entity called SecurityIncident within the CEDM business model. |
| [Role](/entities/identity-and-access-management/role/) | Represents a authorization entity called Role within the CEDM business model. |
| [Permission](/entities/identity-and-access-management/permission/) | Represents a authorization entity called Permission within the CEDM business model. |
| [Access Grant](/entities/security-and-identity-records/access-grant/) | A governed assignment granting a User or other subject a Role, Permission, or Policy-scoped access entitlement for a defined context and validity period. |

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

- A **User** goes Pending → Active → Locked → Disabled → Retired.
- A **User** goes Active → Suspended → Revoked → Expired.
- A **Role** goes Draft → Active → Inactive → Retired.
- A **Permission** goes Active → Inactive → Retired.
- A **Access Grant** goes Pending → Active → Completed → Cancelled.
- A **Security Incident** goes Open → Investigating → Contained → Resolved → Closed.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Access grant follow up required**: When a access grant is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Security and Identity holds **27 business entities** and **31 lists of values**, organised into 4 categories:

- **Foundation** (22): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Identity and Access Management** (3): User, Role, Permission
- **Security and Identity records** (2): Access Grant, Security Incident
- **Reference Data** (31): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 15 record lifecycles, 11 business rules and 3 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
