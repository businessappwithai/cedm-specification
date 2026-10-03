---
title: "Procurement and Sourcing"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Procurement and Sourcing, built on the CEDM common foundation."
---

# Procurement and Sourcing

Procurement and Sourcing, built on the CEDM common foundation.

![The Procurement and Sourcing dashboard](/img/dashboard.jpg)

## The domain it serves

**Procurement and Sourcing** covers Requisitions, Sourcing, Supplier-management, Purchase-orders, Contracts, Receiving. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Procurement** — Supplier, Purchase Requisition, Purchase Requisition, Request For Quotation, Request For Quotation, Supplier Quotation, Supplier Quotation, Purchase Order, Purchase Order. Processes: Requisition, Rfq, Supplier-quotation, Sourcing-award, Purchase-order, Receiving

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Supplier](/entities/procurement/supplier/) | Represents the procurement-facing role of a Party that supplies business inputs and participates in reverse procurement, supplier claims, financial recovery and performance governance. |
| [Purchase Order](/entities/procurement/purchase-order/) | Represents the formal commercial procurement commitment between a buying organization and a Supplier. |
| [Invoice](/entities/foundation/invoice/) | Represents a formal financial claim and its controlled settlement and adjustment state. |
| [Supplier Claim](/entities/procurement-and-sourcing-records/supplier-claim/) | Provides a formal auditable case for supplier-related quality or commercial recovery while keeping the decision and physical/financial consequences as separate controlled records. |
| [Product](/entities/foundation/product/) | Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. |
| [Supplier Return](/entities/procurement-and-sourcing-records/supplier-return/) | Coordinates the controlled reversal of accepted procurement fulfillment while preserving original purchasing, receiving, inventory, quality and financial history. |
| [Goods Receipt](/entities/procurement-and-sourcing-records/goods-receipt/) | Controlled receiving document whose line evidence establishes original fulfillment and eligible basis for later supplier returns. |
| [Supplier Claim Resolution](/entities/procurement-and-sourcing-records/supplier-claim-resolution/) | Converts a supplier claim decision into a controlled auditable execution plan without conflating the case remedy and resulting transactions. |
| [Supplier Credit Note](/entities/procurement-and-sourcing-records/supplier-credit-note/) | Represents an explicit financial reduction of supplier payable exposure while preserving original procurement invoice claim resolution and return history. |
| [Supplier Debit Note](/entities/procurement-and-sourcing-records/supplier-debit-note/) | Represents a buyer-issued financial debit against a supplier while preserving the original payable claim supplier-claim history resolution decision and application evidence. |
| [Supplier Performance Assessment](/entities/procurement-and-sourcing-records/supplier-performance-assessment/) | Provides a governed supplier scorecard that converts procurement, receipt, quality, claim, return and corrective-action evidence into an auditable performance assessment. |
| [Purchase Requisition](/entities/procurement/purchase-requisition/) | Represents internal demand for goods or services before that demand becomes an external procurement commitment. |
| [Request For Quotation](/entities/procurement/request-for-quotation/) | Governs solicitation of supplier offers for approved procurement demand. |
| [Supplier Quotation](/entities/procurement/supplier-quotation/) | Preserves a supplier's commercial response to governed sourcing. |
| [Supplier Credit Note Application](/entities/procurement-and-sourcing-records/supplier-credit-note-application/) | Provides the auditable bridge by which a posted SupplierCreditNote is consumed against a purchase Invoice. |
| [Supplier Debit Note Application](/entities/procurement-and-sourcing-records/supplier-debit-note-application/) | Records the controlled application of a posted SupplierDebitNote against a specific supplier invoice payable claim. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Unit Of Measure](/entities/foundation/unit-of-measure/) | Defines the measurement semantics that make numeric quantities comparable across CEDM workflows. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Exchange Rate](/entities/foundation/exchange-rate/) | Represents an auditable conversion rate between two currencies for a defined time and business purpose. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |


## How the main records move

- A **Supplier** goes Active → Inactive → Blocked → Retired.
- A **Purchase Requisition** goes Draft → Submitted → Approved → Rejected → Ordered → Closed → Cancelled.
- A **Request For Quotation** goes Draft → Issued → Closed → Awarded → Cancelled.
- A **Supplier Quotation** goes Received → Under review → Accepted → Rejected → Expired → Withdrawn.
- A **Purchase Order** goes Draft → Approved → Sent → Partially received → Received → Cancelled → Closed.
- A **Goods Receipt** goes Draft → Received → Inspection pending → Accepted → Partially accepted → Rejected → Cancelled.
- A **Supplier Claim** goes Draft → Open → Under review → Accepted → Partially accepted → Rejected → Resolved → Closed → Cancelled → Escalated.
- A **Supplier Claim Resolution** goes Draft → Approved → In execution → Partially executed → Executed → Failed → Cancelled.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Supplier exception raised**: When a supplier is blocked, a high-priority task asks someone to resolve it.
- **Purchase requisition approval requested**: When a purchase requisition is submitted, a task asks someone to decide on it.
- **Purchase requisition follow up required**: When a purchase requisition is rejected or cancelled, a task asks someone to settle what depended on it.
- **Request for quotation follow up required**: When a request for quotation is cancelled, a task asks someone to settle what depended on it.
- **Supplier quotation approval requested**: When a supplier quotation is under review, a task asks someone to decide on it.
- **Supplier quotation follow up required**: When a supplier quotation is rejected, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Procurement and Sourcing holds **46 business entities** and **51 lists of values**, organised into 4 categories:

- **Foundation** (32): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Procurement** (5): Supplier, Purchase Requisition, Request For Quotation, Supplier Quotation, Purchase Order
- **Procurement and Sourcing records** (9): Goods Receipt, Supplier Claim, Supplier Claim Resolution, Supplier Credit Note, Supplier Credit Note Application, Supplier Debit Note, Supplier Debit Note Application, Supplier Performance Assessment, Supplier Return
- **Reference Data** (51): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 25 record lifecycles, 66 business rules and 27 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
