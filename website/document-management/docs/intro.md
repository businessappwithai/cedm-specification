---
title: "Document and Content Management"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Document and Content Management, built on the CEDM common foundation."
---

# Document and Content Management

Document and Content Management, built on the CEDM common foundation.


## The domain it serves

**Document and Content Management** covers Documents, Versions, Metadata, Approvals, Retention, Signatures, Records. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Document management** — Document, Document Version, Signature. Processes: Document-creation, Review, Approval, Signing, Retention, Archival

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Document](/entities/document-management/document/) | Represents a core business entity called Document within the CEDM business model. |
| [Document Version](/entities/document-management/document-version/) | An immutable governed version of a Document preserving content identity, metadata, effective state, and historical provenance. |
| [Signature](/entities/document-management/signature/) | A governed signature evidence record proving a signatory action over a specific document/version or business transaction. |
| [Document Classification](/entities/document-and-content-management-records/document-classification/) | A governed classification assigned to Documents for retention, sensitivity, access, regulatory, or business-purpose controls. |

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
| [Country](/entities/foundation/country/) | A country or territory from the ISO 3166-1 registry, used consistently for addresses, tax, trade, localization, compliance and reporting. |
| [Exchange Rate](/entities/foundation/exchange-rate/) | Represents an auditable conversion rate between two currencies for a defined time and business purpose. |


## How the main records move

- A **Document** goes Draft → Issued → Approved → Cancelled → Archived.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Document follow up required**: When a document is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Document and Content Management holds **25 business entities** and **23 lists of values**, organised into 4 categories:

- **Foundation** (21): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Document Management** (3): Document, Document Version, Signature
- **Document and Content Management records** (1): Document Classification
- **Reference Data** (23): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 10 record lifecycles, 11 business rules and 3 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
