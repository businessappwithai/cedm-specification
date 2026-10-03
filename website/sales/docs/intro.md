---
title: "Sales and Order Management"
sidebar_label: "Home"
sidebar_position: 1
slug: "/"
description: "Sales and Order Management, built on the CEDM common foundation."
---

# Sales and Order Management

Sales and Order Management, built on the CEDM common foundation.


## The domain it serves

**Sales and Order Management** covers Leads, Opportunities, Quotations, Orders, Pricing, Fulfillment, Commissions. It is built on the CEDM common foundation, so the parties, places, currencies and units it works with mean the same here as in every other CEDM application.

## What the business can do with it

- **Sales** — Customer, Lead, Opportunity, Quotation, Sales Order. Processes: Lead-management, Opportunity-management, Quotation, Order-capture
- **Order management** — Sales Order, Sales Order, Purchase Order, Purchase Order. Processes: Order-capture, Order-approval, Order-fulfillment, Order-cancellation
- **Pricing and commercial terms** — Product, Customer, Supplier, Payment Term, Currency. Processes: Price-definition, Price-approval, Price-change
- **Product and service management** — Product, Product Category, Unit Of Measure. Processes: Product-introduction, Product-change, Product-retirement

## The main records

### Records specific to this application

| Record | What it is |
| --- | --- |
| [Customer](/entities/sales/customer/) | Represents the commercial customer role of a Party. |
| [Product](/entities/pricing-and-commercial-terms/product/) | Canonical product master with mandatory downstream dependency propagation and transaction-time preservation rules. |
| [Sales Order](/entities/sales/sales-order/) | Represents the commercial customer commitment from which fulfillment and financial processes derive work. |
| [Supplier](/entities/pricing-and-commercial-terms/supplier/) | Represents the procurement-facing role of a Party that supplies business inputs and participates in reverse procurement, supplier claims, financial recovery and performance governance. |
| [Opportunity](/entities/sales/opportunity/) | Represents a crm entity called Opportunity within the CEDM business model. |
| [Purchase Order](/entities/order-management/purchase-order/) | Represents the formal commercial procurement commitment between a buying organization and a Supplier. |
| [Payment Term](/entities/pricing-and-commercial-terms/payment-term/) | Defines reusable commercial rules for when financial obligations become due and when early-settlement benefits or operational grace periods apply. |
| [Lead](/entities/sales/lead/) | Represents a crm entity called Lead within the CEDM business model. |
| [Quotation](/entities/sales/quotation/) | Represents a commercial transaction called Quotation within the CEDM business model. |
| [Product Category](/entities/product-and-service-management/product-category/) | Represents one governed node in the Product classification hierarchy. |
| [Customer Return](/entities/sales-and-order-management-records/customer-return/) | Coordinates the controlled reversal of a customer fulfillment while preserving original commercial, inventory and financial history. |
| [Discount Rule](/entities/sales-and-order-management-records/discount-rule/) | Defines reusable discount policy while leaving the actual applied discount as transaction evidence. |
| [Prospect](/entities/sales-and-order-management-records/prospect/) | A potential customer or account that has been identified but is not yet qualified as a Lead or established as a Customer. |
| [Contact](/entities/sales-and-order-management-records/contact/) | A governed business contact representing a Person in a customer, prospect, supplier, partner, or account relationship context. |
| [Brand](/entities/sales-and-order-management-records/brand/) | Governed product brand reference master. |
| [Pricing](/entities/sales-and-order-management-records/pricing/) | A governed pricing definition or decision context establishing base prices and applicability conditions before discounts, promotions, quotations, or orders. |
| [Promotion](/entities/sales-and-order-management-records/promotion/) | A governed time- and eligibility-bounded commercial offer that may alter price, benefit, bundle, or fulfillment terms without rewriting base pricing. |
| [Campaign](/entities/sales-and-order-management-records/campaign/) | A governed commercial marketing or outreach initiative targeting an audience over a defined period and measuring responses and outcomes. |

### Shared foundation records

Every CEDM application starts from the same foundation of parties, places, currencies and units, so these records mean the same here as in any other application.

| Record | What it is |
| --- | --- |
| [Organization](/entities/foundation/organization/) | Organization is the organizational specialization of Party, not an independent party identity or business role. |
| [Party](/entities/foundation/party/) | The foundational CEDM business concept for an identifiable person or organization participating in business. |
| [Address](/entities/foundation/address/) | Reusable address master data with explicit rules for ownership, primary selection, lifecycle, and historical transaction evidence. |
| [Currency](/entities/foundation/currency/) | Defines the monetary denomination that gives financial amounts their business meaning. |
| [Unit Of Measure](/entities/foundation/unit-of-measure/) | Defines the measurement semantics that make numeric quantities comparable across CEDM workflows. |
| [Location](/entities/foundation/location/) | Core location master with hierarchical, geographic, organizational, and lifecycle context. |
| [Person](/entities/foundation/person/) | Person is the individual specialization of Party, not a business role. |
| [Party Role](/entities/foundation/party-role/) | The bridge between stable Party identity and contextual business participation. |


## How the main records move

- A **Customer** goes Active → Inactive → Blocked → Retired.
- A **Lead** goes New → Qualifying → Qualified → Disqualified → Converted → Lost.
- A **Opportunity** goes Qualification → Discovery → Proposal → Negotiation → Won → Lost.
- A **Quotation** goes Draft → Submitted → Accepted → Rejected → Expired → Cancelled.
- A **Sales Order** goes Draft → Confirmed → Allocated → Partially fulfilled → Fulfilled → Cancelled.
- A **Purchase Order** goes Draft → Approved → Sent → Partially received → Received → Cancelled → Closed.
- A **Product** goes Draft → Active → Discontinued → Blocked → Retired.
- A **Supplier** goes Active → Inactive → Blocked → Retired.

Each is enforced by the application on every change; see [Record lifecycles](/administration/lifecycles/).

## What happens automatically

- **Party exception raised**: When a party is blocked, a high-priority task asks someone to resolve it.
- **Exchange rate follow up required**: When a exchange rate is cancelled, a task asks someone to settle what depended on it.
- **Customer exception raised**: When a customer is blocked, a high-priority task asks someone to resolve it.
- **Quotation approval requested**: When a quotation is submitted, a task asks someone to decide on it.
- **Quotation follow up required**: When a quotation is rejected or cancelled, a task asks someone to settle what depended on it.
- **Sales order follow up required**: When a sales order is cancelled, a task asks someone to settle what depended on it.
- **Sales order completion confirmed**: When a sales order is fulfilled, a task asks someone to confirm the outcome.
- **Purchase order follow up required**: When a purchase order is cancelled, a task asks someone to settle what depended on it.

The full list is under [Processes](/administration/processes/).

## What is inside

Sales and Order Management holds **43 business entities** and **48 lists of values**, organised into 7 categories:

- **Foundation** (25): Party, Person, Organization, Party Role, Party Relationship, Legal Entity, Business Unit, Department, Address, Contact Point, Location, Country, …
- **Sales** (5): Customer, Lead, Opportunity, Quotation, Sales Order
- **Order Management** (1): Purchase Order
- **Pricing and Commercial Terms** (3): Product, Supplier, Payment Term
- **Product and Service Management** (1): Product Category
- **Sales and Order Management records** (8): Discount Rule, Pricing, Promotion, Campaign, Prospect, Contact, Customer Return, Brand
- **Reference Data** (48): Party Party Type, Party Status, Person Gender, Person Party Type, Person Status, Organization Organization Type, Organization Status, Organization Party Type, Party Role Role Type, Party Role Status, Address Address Type, Address Status, …

It carries 22 record lifecycles, 33 business rules and 13 automated processes.

## How this manual is organised

- [Getting started](/getting-started/): signing in, the dashboard, the menu, themes, and how every list and form works.
- **Entities**: one page per business entity, with its screens, steps and every field.
- **Reference data**: the lists of values behind the dropdowns.
- **Administration**: record lifecycles, business rules, processes, access, reports, and the Application Dictionary.
- The common [Application Dictionary manual](pathname:///application-dictionary/) explains every administrator window in detail and is shared by all applications.
