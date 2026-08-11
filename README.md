# CEDM Specification

Canonical, implementation-neutral specification for the Cedm business application domain model.

## Purpose

CEDM describes business entities, relationships, lifecycle rules, business invariants, workflows, transactions, domain semantics, industry capabilities, reports, integrations, UI metadata, and AI semantics in machine-readable YAML. The specification is intended to map to relational schemas, CDS, JSON Schema, OpenAPI, GraphQL, application code, workflow engines, and UI metadata without making any one implementation the canonical model.

## Structure

```text
domain/
  entities/
    *.yaml
    index.yaml
domains/
  catalog.yaml
  domain-metamodel.yaml
specification/
  *.yaml
tools/
  validate.py
```

## Domain coverage

CEDM is intentionally designed as a broad business-application model rather than an ERP-only model. The domain catalog covers enterprise management, finance, procurement, sales, CRM/customer service, inventory, warehousing, transportation, container/intermodal logistics, manufacturing, maintenance, quality, supply-chain planning, HR, projects, document management, workflow/BPM, compliance, legal, insurance, banking, healthcare, life sciences, education, retail, hospitality, travel, real estate, construction, agriculture, energy/utilities, telecommunications, media, technology/ITSM, government, nonprofit, environmental management, security/identity, analytics, AI operations, e-commerce, food and beverage, mining, chemicals, aerospace/defense, automotive, pharmaceuticals, apparel, professional services, field service, facilities, security operations, research, regulatory affairs, international trade/customs, and ESG/sustainability.

The catalog is intentionally extensible: additional industries and specialized domains can be added without changing the core metamodel.

## Domain layers

- **Enterprise foundation:** ERP, Organization, Party, Person, PartyRole
- **Commercial master data:** Customer, Supplier, Product, ProductCategory, UnitOfMeasure, Currency, PaymentTerm
- **Locations:** Address, Location, Warehouse, InventoryLocation, Yard, YardBlock, YardBay, YardTier, YardSlot
- **Business processes:** BusinessProcess, Workflow, Task, Document
- **Transactions:** BusinessTransaction, SalesOrder, SalesOrderLine, PurchaseOrder, PurchaseOrderLine
- **Inventory:** InventoryBalance, InventoryMovement
- **Container logistics:** Container, ContainerMovement, Shipment, Vehicle
- **Maintenance:** RepairEstimate, RepairEstimateLine, AssetDepreciation
- **Finance:** Account, JournalEntry, JournalEntryLine, Invoice, Payment

## Modeling principles

1. Domain semantics are implementation-neutral.
2. Entity identity is explicit and immutable.
3. Relationships declare target entities and cardinality.
4. Lifecycle states and business invariants are part of the domain model.
5. Transactional entities are distinguished from master/reference entities.
6. Specialized entities explicitly identify their parent entity where applicable.
7. Business rules are expressed declaratively so they can later be compiled into application validation, database constraints, workflow rules, or policy engines.
8. The YAML entity files are the canonical source from which implementation artifacts may be generated.
9. Industry domains compose shared cross-domain capabilities instead of duplicating common entities.
10. A domain may define entities, processes, rules, reports, integrations, UI metadata, and AI policies in addition to master data.

## Status

The specification is in broad-domain construction and normalization. Entity definitions remain `draft` until the cross-domain conformance pass is complete.
