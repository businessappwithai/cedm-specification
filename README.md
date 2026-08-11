# CEDM Specification

Canonical, implementation-neutral specification for the Cedm business application domain model.

## Purpose

CEDM describes business entities, relationships, lifecycle rules, business invariants, workflows, transactions, and domain semantics in a machine-readable YAML form. The specification is intended to be mappable to relational schemas, CDS, JSON Schema, OpenAPI, GraphQL, application code, workflow engines, and UI metadata without making any one implementation the canonical model.

## Structure

```text
domain/
  entities/
    *.yaml
    index.yaml
```

## Domain layers

- **Enterprise foundation:** ERP, Organization, Party, Person, PartyRole
- **Commercial master data:** Customer, Supplier, Product, ProductCategory, UnitOfMeasure, Currency, PaymentTerm
- **Locations:** Address, Location, Warehouse, InventoryLocation, Yard, YardBlock, YardBay, YardTier, YardSlot
- **Business processes:** BusinessProcess, Workflow, Task, Document
- **Transactions:** BusinessTransaction, SalesOrder, SalesOrderLine, PurchaseOrder, PurchaseOrderLine
- **Inventory:** InventoryBalance, InventoryMovement
- **Container logistics:** Container, ContainerMovement
- **Maintenance:** RepairEstimate, RepairEstimateLine, AssetDepreciation
- **Finance:** Account, JournalEntry, JournalEntryLine

## Modeling principles

1. Domain semantics are implementation-neutral.
2. Entity identity is explicit and immutable.
3. Relationships declare target entities and cardinality.
4. Lifecycle states and business invariants are part of the domain model.
5. Transactional entities are distinguished from master/reference entities.
6. Specialized entities explicitly identify their parent entity where applicable.
7. Business rules are expressed declaratively so they can later be compiled into application validation, database constraints, workflow rules, or policy engines.
8. The YAML entity files are the canonical source from which implementation artifacts may be generated.

## Status

The specification is being built incrementally. Entity definitions currently have `status: draft` until the complete domain model has been reviewed and normalized.
