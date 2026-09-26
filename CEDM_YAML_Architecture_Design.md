# CEDM YAML Architecture: Comprehensive Transformation Design
**Version**: 1.0  
**Date**: September 26, 2026  
**Status**: Architectural Review  
**Scope**: cedm-specification repository transformation

---

## Executive Summary

This document defines the architectural strategy to transform the cedm-specification repository into a YAML-native enterprise application platform, replacing Mermaid as the source-of-truth modeling language while maintaining backward compatibility for visualization. The transformation will establish YAML as the primary modeling substrate with Mermaid as a derived visualization format.

**Key Strategic Objectives:**
- Establish YAML as the canonical data representation for all enterprise models
- Eliminate Mermaid parsing from the critical path; use YAML parsing instead
- Maintain Mermaid as a visualization/rendering layer only
- Refactor code generation to consume YAML directly
- Modernize the language specification to be YAML-native
- Provide clear migration path from existing Mermaid-based models

---

## Part 1: Current State Analysis

### 1.1 Current Architecture (app-with-ai-rust)

**Language Foundation:**
- **Source Format**: Mermaid diagrams with YAML directives (EML)
- **Parser**: `packages/generator/src/parsers/mermaid.parser.ts` (line-by-line Mermaid analysis)
- **Language Definition**: `language/appwithai-language.json` (type vocabulary, modifiers, cardinalities)
- **Validation**: `language/checker.ts` (~130 diagnostic codes)

**Generation Pipeline:**
```
Mermaid ERD → Parser → TypeScript AST → Generator Context → Templates → Generated App
```

**Key Components:**
- `packages/generator/src/pipeline/generate-application.ts` - orchestrator
- `packages/generator/src/generators/tanstack-astryx-loco/*` - language-agnostic generators
- `packages/generator/templates/tanstack-astryx-loco/*` - Handlebars templates
- `crates/appwithai-gen/` - Rust generator (byte-for-byte parity with TypeScript)

**Template Architecture:**
- 116 files across backend, frontend, tests
- Handlebars rendering of ERD models
- Context: entities, relationships, workflows, business rules

**Critical Pain Points with Mermaid:**
1. **Line-based parsing fragility**: `%%` directives mixed with diagram syntax
2. **Whitespace sensitivity**: Carriage return handling, line continuation issues
3. **Mermaid version incompatibility**: Renderer updates break parser
4. **Limited expressiveness**: Complex domain rules require YAML directives
5. **Two-system problem**: YAML directives are parsed separately from ERD
6. **Debugging difficulty**: Parse errors don't map cleanly to source lines
7. **Performance**: Multiple passes over Mermaid text

### 1.2 cedm-specification Current State

**Existing Structure:**
- `cedm.yaml` - central specification in YAML format
- `schema.yaml` - domain schema definitions
- `domain/` - domain-specific specifications
- `specification/` - specification artifacts
- **Already YAML-native** - foundation exists

**Strategic Advantage:**
- cedm-specification is the semantic home for enterprise domain definitions
- app-with-ai-rust is the implementation platform
- Combining them positions cedm as the specification source feeding code generation

---

## Part 2: Target Architecture Vision

### 2.1 YAML-Native Language Definition (CEDL - CEDM Enterprise Definition Language)

**New Paradigm:**
```
YAML Enterprise Model → YAML Parser → TypeScript AST → Generator Context → Templates → Generated App
                           ↓
                    Convert to Mermaid (View Layer)
```

**Language Hierarchy:**

```yaml
# Complete enterprise model in single YAML structure
version: "1.0"
metadata:
  name: enterprise-app
  description: Complete enterprise application definition
  timestamp: "2026-09-26T00:00:00Z"

# 1. Domain Definition (replaces ERD section)
domain:
  categories:
    - id: inventory
      name: Inventory Management
      icon: box
      help: Manage product inventory
  
  entities:
    - id: product
      name: Product
      displayName: "Product Information"
      category: inventory
      help: Core product record
      attributes:
        - id: product_id
          name: product_id
          type: uuid
          isIdentifier: true
        - id: sku
          name: sku
          type: string
          isRequired: true

# 2. Relationships (replaces cardinality diagram)
relationships:
  - source: product
    target: warehouse
    cardinality: one-to-many
    foreignKey: warehouse_id

# 3. Business Rules (replaces flowchart + rules)
rules:
  - id: stock_threshold_rule
    name: Low Stock Alert
    entity: product
    trigger: on-update
    conditions:
      - field: quantity_on_hand
        operator: less-than
        value: minimum_stock_level
    actions:
      - type: notify
        target: inventory-manager

# 4. Workflows (replaces BPMN/saga section)
workflows:
  - id: purchase_order_workflow
    name: Purchase Order Processing
    entity: purchase_order
    startEvent: order_created
    states:
      - id: draft
        name: Draft
      - id: submitted
        name: Submitted
    transitions:
      - from: draft
        to: submitted
        name: Submit for Approval
        condition: all_items_validated

# 5. Access Control (replaces RBAC directives)
rbac:
  roles:
    - id: inventory_manager
      name: Inventory Manager
      isMasterRole: false
  
  permissions:
    - role: inventory_manager
      entity: product
      operations: [read, create, update]
      conditions:
        - field: department
          equals: current_user.department

# 6. Lifecycle Hooks (replaces %%hook directives)
hooks:
  - entity: product
    event: beforeCreate
    handler: validate_product_data
    phase: validation
  
  - entity: product
    event: afterCreate
    handler: initialize_stock_levels
    phase: business_logic

# 7. Reports (replaces %%report directives)
reports:
  - id: inventory_summary
    name: Inventory Summary Report
    entity: product
    query: |
      SELECT product_id, name, quantity_on_hand, value
      FROM sys_product
      LIMIT 5000

# 8. System Configuration
system:
  database:
    type: postgresql
    migrations:
      auto: true
  
  api:
    documentation:
      enabled: true
      tools: [redoc, scalar]
    
  features:
    auditLog: true
    encryption: true
```

### 2.2 Language Specification Components

**CEDL Schema Definition** (`language/cedl-schema.json`):
- Formal JSON Schema for YAML validation
- Type system (uuid, string, integer, decimal, date, datetime, json, etc.)
- Cardinality rules (one-to-one, one-to-many, many-to-many)
- Modifier system (required, unique, indexed, encrypted, readonly)
- Hook event types (beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, etc.)
- Workflow event types (entry, exit, internal)

**Diagnostic System** (replaces `language/checker.ts`):
- ~150 diagnostic codes (CEDL001-CEDL150)
- YAML schema validation (via `ajv` library)
- Semantic validation (referential integrity, circular dependencies)
- Structural validation (required fields, cardinality constraints)
- Performance analysis (N+1 relationship detection)

**Grammar Definition** (`language/cedl.grammar.ebnf`):
```ebnf
CEDLModel    = "version" ":" string "metadata" ":" Metadata Domain Relationships Rules
Metadata     = "name" ":" string | "description" ":" string | "timestamp" ":" string
Domain       = "domain" ":" DomainSection
DomainSection = "categories" ":" CategoryList | "entities" ":" EntityList
EntityList   = "{" Entity ("," Entity)* "}"
Entity       = "id" ":" string "," "name" ":" string "," ("attributes" ":" AttributeList)?
AttributeList = "[" Attribute ("," Attribute)* "]"
Attribute    = "name" ":" string "," "type" ":" TYPE ("," Modifier)*
```

### 2.3 Mermaid Bridge (Export/Visualization Layer)

**Purpose**: Generate Mermaid diagrams from YAML for visualization
**Direction**: One-way (YAML → Mermaid, never inverse)
**Use Cases**: 
- Visual exploration in web UI
- Documentation export
- External tool integration
- Stakeholder communication

**Architecture**:
```typescript
// lib/cedl-to-mermaid.ts
export function transformCEDLtoMermaid(model: CEDLModel): MermaidDiagram {
  const entities = model.domain.entities.map(e => entityToMermaidEntity(e));
  const relationships = model.relationships.map(r => relationshipToMermaidRelationship(r));
  const directives = extractMermaidDirectives(model);
  
  return compileMermaidDiagram(entities, relationships, directives);
}

// Preserves all semantic information in Mermaid directives
// e.g., %%entity Product help: ... icon: ... parent: ...
```

**Key Principle**: Mermaid is a **read-only projection**. All authoritative information lives in YAML.

---

## Part 3: Core Architecture Transformation

### 3.1 Repository Structure (cedm-specification)

```
cedm-specification/
├── README.md (updated with YAML focus)
├── ARCHITECTURE.md (this document)
│
├── language/
│   ├── cedl-schema.json                 # JSON Schema for YAML validation
│   ├── cedl.grammar.ebnf                # Formal grammar definition
│   ├── spec/
│   │   ├── 00-overview.md
│   │   ├── 01-entities-attributes.md
│   │   ├── 02-relationships.md
│   │   ├── 03-business-rules.md
│   │   ├── 04-workflows.md
│   │   ├── 05-rbac.md
│   │   ├── 06-hooks.md
│   │   └── 07-reports.md
│   │
│   ├── cli/                             # Zero-dependency CEDL CLI (Bun)
│   │   ├── src/
│   │   │   ├── index.ts                 # cedl validate, info, generate, convert
│   │   │   ├── validator.ts
│   │   │   ├── info-printer.ts
│   │   │   ├── converter.ts             # CEDL↔Mermaid conversion
│   │   │   └── commands/
│   │   └── package.json
│   │
│   ├── parser/                          # YAML-based CEDL parser
│   │   ├── cedl-parser.ts               # Main entry point
│   │   ├── types.ts                     # TypeScript interfaces
│   │   ├── validators/
│   │   │   ├── schema-validator.ts
│   │   │   ├── semantic-validator.ts
│   │   │   └── structural-validator.ts
│   │   └── transformers/
│   │       ├── entity-transformer.ts
│   │       ├── relationship-transformer.ts
│   │       ├── rule-transformer.ts
│   │       └── workflow-transformer.ts
│   │
│   ├── converters/
│   │   ├── cedl-to-mermaid.ts          # CEDL → Mermaid (view layer)
│   │   ├── mermaid-to-cedl.ts          # Mermaid → CEDL (migration aid)
│   │   ├── cedl-to-ast.ts              # CEDL → Generator AST
│   │   └── model-graph.ts              # Property graph representation
│   │
│   ├── examples/
│   │   ├── minimal.cedl.yaml
│   │   ├── crm.cedl.yaml
│   │   ├── ecommerce.cedl.yaml
│   │   └── drug-discovery.cedl.yaml
│   │
│   └── tests/
│       ├── parser.test.ts
│       ├── validator.test.ts
│       ├── converters.test.ts
│       └── parity.test.ts               # TypeScript↔Rust generator parity
│
├── packages/                            # Copied from app-with-ai-rust
│   ├── core/
│   ├── generator/
│   │   ├── src/
│   │   │   ├── parser/
│   │   │   │   └── cedl-parser.ts       # Replaces mermaid.parser.ts
│   │   │   │
│   │   │   ├── generators/
│   │   │   │   └── tanstack-astryx-loco/
│   │   │   │       ├── cedl-backend.generator.ts
│   │   │   │       └── cedl-frontend.generator.ts
│   │   │   │
│   │   │   └── pipeline/
│   │   │       └── generate-application.ts   # Updated for YAML input
│   │   │
│   │   ├── templates/
│   │   │   └── tanstack-astryx-loco/
│   │   │       └── (unchanged - consumes AST, not file format)
│   │   │
│   │   └── __tests__/
│   │       ├── cedl-parity.test.ts      # Rust↔TypeScript parity
│   │       └── mermaid-migration.test.ts
│   │
│   ├── ai/
│   ├── web/
│   └── cli/
│
├── crates/
│   └── appwithai-gen/
│       └── src/
│           ├── parser.rs                # Replaces mermaid parsing
│           ├── cedl.rs                  # CEDL model struct
│           └── ... (other modules)
│
├── cli-wasm/                            # New: WASM-based CLI
│   ├── src/
│   │   ├── lib.rs
│   │   ├── parser.rs
│   │   └── generator.rs
│   │
│   ├── Cargo.toml
│   └── package.json
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema/
│
└── docs/
    ├── CEDL_SPECIFICATION.md
    ├── MIGRATION_GUIDE.md
    ├── YAML_BEST_PRACTICES.md
    └── ARCHITECTURE.md
```

### 3.2 Type System Transformation

**Current (Mermaid + YAML directives):**
```mermaid
erDiagram
    PRODUCT ||--o{ ORDER_ITEM : contains
    
%%field Product.sku enum: SKU_ENUM
%%enum SKU_ENUM
    - value: "AUTO"
    - value: "MANUAL"
```

**Target (YAML-native):**
```yaml
domain:
  entities:
    - id: product
      attributes:
        - name: sku
          type: enum
          enumRef: sku_enum

  enums:
    - id: sku_enum
      name: SKU Enum
      values:
        - value: AUTO
          label: Automatic
        - value: MANUAL
          label: Manual
```

**Type System Coverage:**

| Category | Types |
|----------|-------|
| Primitives | `uuid`, `string`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `json` |
| Collections | `array<T>`, `set<T>` |
| References | `uuid` with FK modifier, `many<Entity>`, `one<Entity>` |
| Structured | `enum`, `embedded<ObjectShape>` |
| System | `audit_timestamp`, `audit_user`, `version` |

### 3.3 Parser Architecture

**YAML Parser Strategy:**

```typescript
interface CEDLParseContext {
  yaml: YAML.Document;
  uri: string;
  diagnostics: Diagnostic[];
  symbols: SymbolTable;
}

class CEDLParser {
  async parse(yaml: string): Promise<CEDLModel> {
    // 1. Parse YAML structure
    const doc = YAML.parse(yaml);
    
    // 2. Schema validation (ajv)
    const schemaValid = this.validateSchema(doc);
    if (!schemaValid) {
      return { diagnostics: schemaValid.errors };
    }
    
    // 3. Parse each section
    const metadata = parseMetadata(doc.metadata);
    const domain = parseDomain(doc.domain);
    const relationships = parseRelationships(doc.relationships);
    const rules = parseRules(doc.rules);
    const workflows = parseWorkflows(doc.workflows);
    const rbac = parseRBAC(doc.rbac);
    const hooks = parseHooks(doc.hooks);
    const reports = parseReports(doc.reports);
    
    // 4. Semantic validation
    const semanticDiagnostics = validateSemantics({
      domain, relationships, rules, workflows, rbac
    });
    
    return new CEDLModel({
      metadata, domain, relationships, rules, workflows, rbac, hooks, reports,
      diagnostics: semanticDiagnostics
    });
  }
}
```

**Diagnostic System** (replaces 130+ Mermaid-based codes):

```typescript
interface Diagnostic {
  code: string;        // CEDL001-CEDL150
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: {
    path: string[];    // YAML path: domain.entities[0].attributes[1]
    line: number;
    column: number;
  };
  relatedInfo?: {
    location: Location;
    message: string;
  }[];
}

// Examples:
// CEDL001: Entity must have unique ID
// CEDL002: Attribute type is not defined
// CEDL003: Referenced entity does not exist
// CEDL004: Relationship cardinality mismatch
// CEDL010: Missing required field 'name'
// CEDL030: Circular dependency detected in rules
// CEDL040: Workflow state unreachable
// CEDL050: RBAC role not defined
// CEDL060: Hook handler missing implementation
```

---

## Part 4: Template System Transformation

### 4.1 Generator Input Transformation

**Current Flow:**
```
Mermaid File → MermaidParser → ParsedModel → Generator → Handlebars Templates
```

**New Flow:**
```
YAML File → CEDLParser → CEDLModel → Transformer → GeneratorContext → Handlebars Templates
```

**Critical Point**: Generators and templates remain unchanged. Only the input parsing and transformation changes.

### 4.2 Context Bridge

```typescript
// packages/generator/src/pipeline/cedl-to-context.ts

export async function transformCEDLToContext(
  model: CEDLModel,
  options: GenerationSettings
): Promise<GeneratorContext> {
  
  // Map CEDL domain to generator expectations
  const entities = model.domain.entities.map(entity => ({
    id: entity.id,
    name: pascalCase(entity.id),
    dbName: snakeCase(entity.id),
    displayName: entity.displayName || entity.name,
    attributes: entity.attributes.map(attr => transformAttribute(attr)),
    relationships: findEntityRelationships(model.relationships, entity.id),
    isAuditEnabled: model.system.features?.auditLog ?? true,
    // ... rest of entity properties
  }));
  
  return {
    entities,
    relationships: model.relationships,
    workflows: model.workflows,
    rules: model.rules,
    rbac: model.rbac,
    hooks: model.hooks,
    // ... other context
  };
}
```

### 4.3 Template Consumption (Unchanged)

Handlebars templates consume the transformed context exactly as before:

```handlebars
{{#each entities}}
  CREATE TABLE bus_{{snakeCase @key}} (
    {{#each attributes}}
      {{snakeCase @key}} {{postgresType type}},
    {{/each}}
  );
{{/each}}
```

**Key Principle**: No template changes needed. The transformation layer handles YAML→Context mapping.

---

## Part 5: CLI Architecture

### 5.1 New CEDL CLI Commands

```bash
# Validation
cedl validate --input enterprise.cedl.yaml

# Information
cedl info --input enterprise.cedl.yaml --format json
cedl info --input enterprise.cedl.yaml --entity Product

# Generation
cedl generate --input enterprise.cedl.yaml \
  --output ./generated-app \
  --stack tanstack-astryx-loco \
  --db postgres

# Conversion
cedl convert --from mermaid --to yaml --input old-model.mmd --output new-model.cedl.yaml
cedl convert --to mermaid --input enterprise.cedl.yaml --output export.mmd

# Development
cedl watch --input enterprise.cedl.yaml --output ./dist

# Language
cedl language version
cedl language list-types
cedl language list-directives
```

### 5.2 Bun-based CLI Implementation

```typescript
// packages/cli/src/index.ts

import { parseArgs } from "bun";
import { CEDLParser } from "@appwithai/language/parser";
import { generateApplication } from "@appwithai/generator";

const args = parseArgs(Bun.argv);

switch (args._?.[0]) {
  case "validate":
    await handleValidate(args);
    break;
  case "info":
    await handleInfo(args);
    break;
  case "generate":
    await handleGenerate(args);
    break;
  // ...
}
```

### 5.3 WASM CLI (`cli-wasm`)

Browser and Node.js compatible CEDL tooling:

```typescript
// cli-wasm/src/lib.rs

#[wasm_bindgen]
pub fn validate_cedl(yaml_content: &str) -> ValidateResult {
  let parser = CEDLParser::new();
  match parser.parse(yaml_content) {
    Ok(model) => ValidateResult {
      valid: true,
      diagnostics: vec![],
    },
    Err(diagnostics) => ValidateResult {
      valid: false,
      diagnostics,
    },
  }
}

#[wasm_bindgen]
pub fn cedl_to_mermaid(yaml_content: &str) -> String {
  let model = parse_cedl(yaml_content);
  transform_to_mermaid(&model)
}

#[wasm_bindgen]
pub fn generate_context(yaml_content: &str) -> JsValue {
  let model = parse_cedl(yaml_content);
  let context = transform_to_context(&model);
  serde_wasm_bindgen::to_value(&context).unwrap()
}
```

**Use Cases:**
- In-browser validation (web UI)
- VS Code extension
- Node.js tools
- GitHub Actions

---

## Part 6: Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Deliverables:**
- [ ] CEDL specification and schema
- [ ] YAML parser with full diagnostic system
- [ ] Semantic validation engine
- [ ] Example CEDL models

**Tasks:**
1. Define `language/cedl-schema.json` with complete type system
2. Implement `language/parser/cedl-parser.ts` with YAML.parse
3. Build `language/parser/validators/*` for all validation layers
4. Create parser unit tests (>90% coverage)
5. Define diagnostic codes (CEDL001-150)
6. Migrate `examples/drug-discovery.mmd` → `examples/drug-discovery.cedl.yaml`
7. **Output**: Parser library ready for consumption

**Acceptance Criteria:**
- CEDLParser.parse() handles all model types
- All diagnostics report with YAML path precision
- Parity tests compare CEDL parse result to expected AST
- No parser dependencies on Mermaid

### Phase 2: Transformation Layer (Weeks 4-5)

**Deliverables:**
- [ ] CEDL↔AST transformer
- [ ] CEDL→Mermaid converter
- [ ] Mermaid→CEDL migration tool
- [ ] Integration tests

**Tasks:**
1. Implement `language/converters/cedl-to-ast.ts`
2. Build `language/converters/cedl-to-mermaid.ts` with directive emission
3. Create `language/converters/mermaid-to-cedl.ts` (best-effort migration)
4. Wire into generation pipeline: `packages/generator/src/pipeline/cedl-to-context.ts`
5. Integration tests against templates
6. **Output**: Generator accepts YAML input

**Acceptance Criteria:**
- CEDLModel → GeneratorContext preserves all semantics
- CEDL→Mermaid produces valid, renderable diagrams
- Existing templates work unmodified
- Migration tool handles 95%+ of real-world models without manual fixes

### Phase 3: CLI & Tooling (Weeks 6-7)

**Deliverables:**
- [ ] CEDL CLI (Bun-based)
- [ ] CEDL CLI (WASM)
- [ ] VS Code extension integration
- [ ] Web UI updates

**Tasks:**
1. Implement `packages/cli/src/commands/*` (validate, info, generate, convert)
2. Build `cli-wasm/src/lib.rs` with WASM bindings
3. Update web UI:
   - File picker for `.cedl.yaml` files
   - YAML editor with syntax highlighting + diagnostics
   - Live Mermaid preview (CEDL→Mermaid bridge)
   - Save as YAML
4. Create command-line help and examples
5. **Output**: Full tooling suite

**Acceptance Criteria:**
- `cedl generate` produces identical output to TypeScript generator
- WASM bundle < 2MB
- Web UI supports full CEDL editing workflow
- CLI commands documented in README

### Phase 4: Rust Generator Port (Weeks 8-10)

**Deliverables:**
- [ ] Rust CEDL parser
- [ ] Rust context transformer
- [ ] Parity tests (TypeScript↔Rust)
- [ ] Byte-for-byte compatibility

**Tasks:**
1. Implement `crates/appwithai-gen/src/cedl.rs` (CEDL model)
2. Implement `crates/appwithai-gen/src/parser.rs` (YAML parsing)
3. Implement `crates/appwithai-gen/src/validators.rs`
4. Update `crates/appwithai-gen/src/backend.rs` to consume CEDL
5. Parity tests: `bun run parity` generates both stacks, diffs backends
6. **Output**: Rust generator at feature parity

**Acceptance Criteria:**
- `cargo clippy` passes with `-D warnings`
- Rust generator produces byte-for-byte identical output
- All 292+ tests pass
- Parity gate green for all example models

### Phase 5: Migration & Documentation (Weeks 11-12)

**Deliverables:**
- [ ] Migration guide
- [ ] Updated CLAUDE.md
- [ ] CEDL language spec (published)
- [ ] Example library

**Tasks:**
1. Write `docs/MIGRATION_GUIDE.md` (Mermaid→CEDL)
2. Update `CLAUDE.md` with YAML-first instructions
3. Create `language/spec/*` markdown documents
4. Publish `language/examples/*` (crm, ecommerce, helpdesk, drug-discovery as CEDL)
5. Update README.md to reference CEDL
6. Create video tutorials (3×5 min)
7. **Output**: Complete documentation

**Acceptance Criteria:**
- Developers can create models from CEDL scratch
- Migration tool handles existing models
- Examples cover all language features
- CEDL specification complete and published

---

## Part 7: Detailed Technical Specifications

### 7.1 CEDL Model Structure

```yaml
version: "1.0"
metadata:
  name: string                           # Required
  description: string                    # Optional
  timestamp: ISO8601                     # Auto-set on save
  author: string                         # Optional
  version: string                        # Optional
  tags: string[]                         # Optional

domain:
  categories:                            # Optional
    - id: string                         # Required, unique
      name: string                       # Required
      icon: lucide-id                    # Optional
      help: string                       # Optional
      order: number                      # Optional
  
  entities:                              # Required, ≥1
    - id: string                         # Required, unique
      name: string                       # Required
      displayName: string                # Optional, for UI
      category: string                   # Optional, references category.id
      help: string                       # Optional, user-facing help
      isAuditEnabled: boolean            # Optional, default true
      tags: string[]                     # Optional
      
      attributes:                        # Required, ≥1
        - id: string                     # Required, unique in entity
          name: string                   # Required
          type: TYPE                     # Required: see Type System
          isRequired: boolean            # Optional, default false
          isUnique: boolean              # Optional, default false
          isIdentifier: boolean          # Optional, default false
          isEncrypted: boolean           # Optional, default false
          isReadonly: boolean            # Optional, default false
          isIndexed: boolean             # Optional, default false
          defaultValue: any              # Optional
          length: integer                # Optional, for string
          precision: integer             # Optional, for decimal
          scale: integer                 # Optional, for decimal
          enumRef: string                # Optional, for enum type
          help: string                   # Optional
          order: number                  # Optional

  enums:                                 # Optional
    - id: string                         # Required, unique
      name: string                       # Required
      values:
        - value: string                  # Required
          label: string                  # Optional
          order: number                  # Optional
          isDefault: boolean             # Optional

relationships:                           # Optional
  - id: string                           # Optional, auto-generated if omitted
    source: string                       # Required, entity id
    target: string                       # Required, entity id
    cardinality: CARDINALITY             # Required
    foreignKey: string                   # Optional, attr name on source
    isRequired: boolean                  # Optional, default false
    help: string                         # Optional

rules:                                   # Optional
  - id: string                           # Required, unique
    name: string                         # Required
    entity: string                       # Optional, entity id (apply to all if omitted)
    trigger: RULE_TRIGGER               # Required
    description: string                  # Optional
    
    conditions:                          # Required
      - field: string                    # entity.attribute path
        operator: OPERATOR               # =, !=, <, >, <=, >=, in, contains, regex
        value: any                       # Comparison value
        caseSensitive: boolean           # Optional, default false
    
    actions:                             # Required
      - type: ACTION_TYPE                # notify, transform, transition, webhook
        target: string                   # Context-specific
        parameters: object               # Action-specific params
        order: number                    # Optional

workflows:                               # Optional
  - id: string                           # Required, unique
    name: string                         # Required
    entity: string                       # Required, entity id
    description: string                  # Optional
    isActive: boolean                    # Optional, default true
    
    startEvent: string                   # Required, event name
    endEvents: string[]                  # Optional
    
    states:                              # Required, ≥1
      - id: string                       # Required
        name: string                     # Required
        type: 'normal' | 'initial' | 'final'  # Optional
        help: string                     # Optional
    
    transitions:                         # Required, ≥1
      - from: string                     # Required, state id
        to: string                       # Required, state id
        name: string                     # Optional
        condition: string                # Optional, rule reference
        order: number                    # Optional

rbac:                                    # Optional
  roles:                                 # Required if rbac section exists
    - id: string                         # Required, unique
      name: string                       # Required
      description: string                # Optional
      isMasterRole: boolean              # Optional, default false
  
  permissions:                           # Optional
    - role: string                       # Required, role id
      entity: string                     # Optional, entity id
      operations: OPERATION[]            # Required, [read, create, update, delete]
      isExclude: boolean                 # Optional, default false
      conditions: object                 # Optional, field-level conditions

hooks:                                   # Optional
  - entity: string                       # Required, entity id
    event: HOOK_EVENT                    # Required
    name: string                         # Optional
    description: string                  # Optional
    handler: string                      # Required, handler function name
    phase: 'validation' | 'transform' | 'business_logic' | 'integration'  # Optional
    async: boolean                       # Optional, default false

reports:                                 # Optional
  - id: string                           # Required, unique
    name: string                         # Required
    entity: string                       # Required
    description: string                  # Optional
    query: string                        # Required, SELECT or WITH statement
    maxRows: integer                     # Optional, default 5000
    cacheTTL: integer                    # Optional, seconds

system:                                  # Optional
  database:
    type: 'postgresql'                   # Only option currently
    migrations:
      auto: boolean                      # Optional, default true
  
  api:
    documentation:
      enabled: boolean                   # Optional, default true
      tools: string[]                    # 'redoc', 'scalar'
  
  features:
    auditLog: boolean                    # Optional, default true
    encryption: boolean                  # Optional, default false
    softDelete: boolean                  # Optional, default false
```

### 7.2 Type System

```typescript
type TYPE =
  // Primitives
  | 'uuid'
  | 'string'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'json'
  // Collections
  | 'array'
  | 'set'
  // References (implicit, detected from FK modifier or presence of target)
  | 'reference'
  // Custom
  | 'enum'
  | 'embedded';

type CARDINALITY =
  | 'one-to-one'      // ||--|| 
  | 'one-to-many'     // ||--o{
  | 'many-to-one'     // }o--||
  | 'many-to-many';   // }o--o{

type RULE_TRIGGER =
  | 'on-create'
  | 'on-update'
  | 'on-delete'
  | 'scheduled'
  | 'webhook';

type OPERATOR =
  | '='
  | '!='
  | '<'
  | '>'
  | '<='
  | '>='
  | 'in'
  | 'not-in'
  | 'contains'
  | 'not-contains'
  | 'regex'
  | 'starts-with'
  | 'ends-with'
  | 'between';

type ACTION_TYPE =
  | 'notify'           // Send notification
  | 'transform'        // Modify field value
  | 'transition'       // Change workflow state
  | 'webhook'          // Call external service
  | 'trigger-workflow' // Start another workflow
  | 'create-record'    // Create related record
  | 'email';           // Send email

type HOOK_EVENT =
  | 'beforeCreate'
  | 'afterCreate'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeDelete'
  | 'afterDelete'
  | 'customValidate';

type OPERATION = 'read' | 'create' | 'update' | 'delete';
```

### 7.3 Diagnostic Codes (CEDL001-150)

**Schema & Structure (001-025):**
- CEDL001: Entity must have unique ID
- CEDL002: Attribute type is not defined
- CEDL003: Referenced enum does not exist
- CEDL004: Required field missing
- CEDL005: Invalid YAML syntax
- CEDL010: Duplicate entity ID
- CEDL011: Duplicate attribute ID in entity
- CEDL012: Duplicate role ID

**Relationships (030-049):**
- CEDL030: Entity in relationship not defined
- CEDL031: Circular reference detected
- CEDL032: Foreign key attribute not found
- CEDL033: Relationship cardinality mismatch
- CEDL034: Self-reference requires special handling

**Rules & Business Logic (050-079):**
- CEDL050: Rule references non-existent entity
- CEDL051: Rule field does not exist
- CEDL052: Rule condition operator invalid
- CEDL053: Rule action type undefined
- CEDL054: Rule trigger event undefined
- CEDL055: Referenced rule not found

**Workflows (080-099):**
- CEDL080: Workflow references non-existent entity
- CEDL081: Start state not defined
- CEDL082: Unreachable state in workflow
- CEDL083: Missing final state
- CEDL084: Transition source state undefined
- CEDL085: Circular workflow detected

**RBAC (100-119):**
- CEDL100: Role not defined
- CEDL101: Referenced entity in permission not found
- CEDL102: Invalid operation in permission
- CEDL103: Conflicting permission rules

**Hooks (120-129):**
- CEDL120: Entity not defined
- CEDL121: Hook event type invalid
- CEDL122: Handler function naming convention violation

**Reports (130-139):**
- CEDL130: Report SQL must be SELECT or WITH
- CEDL131: Invalid SQL syntax
- CEDL132: Report references non-existent entity

---

## Part 8: Migration Strategy

### 8.1 Mermaid → CEDL Migration Path

**Tool**: `cedl convert --from mermaid --to yaml`

```typescript
// language/converters/mermaid-to-cedl.ts

export async function migrateFromMermaid(
  mermaidContent: string
): Promise<{
  cedl: CEDLModel;
  warnings: string[];
  manualReviewItems: string[];
}> {
  
  // 1. Parse Mermaid (use existing parser)
  const mermaidModel = parseMermaidERD(mermaidContent);
  
  // 2. Extract directives
  const directives = extractMermaidDirectives(mermaidContent);
  
  // 3. Transform to CEDL structure
  const cedlModel: CEDLModel = {
    version: "1.0",
    metadata: {
      name: directives.meta?.name || "migrated-model",
      description: "Migrated from Mermaid",
      timestamp: new Date().toISOString(),
    },
    domain: {
      entities: mermaidModel.entities.map(e => ({
        id: e.id,
        name: e.name,
        attributes: e.attributes.map(a => ({
          id: a.id,
          name: a.name,
          type: normalizeType(a.type),
          isIdentifier: directives.identifiers?.includes(e.id + "." + a.id),
          // ...
        })),
      })),
    },
    relationships: mermaidModel.relationships,
    rules: directives.rules || [],
    workflows: directives.workflows || [],
    rbac: directives.rbac || {},
    hooks: directives.hooks || [],
    reports: directives.reports || [],
  };
  
  // 4. Identify items needing manual review
  const manualReviewItems = [
    ...directives.unrecognized,  // Unknown directives
    ...detectComplexLogic(mermaidModel),
  ];
  
  return { cedl: cedlModel, warnings: [], manualReviewItems };
}
```

### 8.2 Backward Compatibility

**For existing projects:**
1. Existing `mermaid` files continue to work via CLI wrapper:
   ```bash
   cedl generate --input app.mmd  # Auto-converts to CEDL internally
   ```

2. Migration happens transparently:
   - CLI detects `.mmd` file
   - Converts to CEDL
   - Generates warning: "Please migrate to `.cedl.yaml` format"
   - Provides migration command

3. Parallel operation possible:
   - Original Mermaid editor available in read-only mode
   - CEDL editor as primary
   - Both views synchronized

---

## Part 9: Testing Strategy

### 9.1 Test Pyramid

```
                    E2E Tests (10%)
                  Integration Tests (25%)
                    Unit Tests (65%)
```

**Unit Tests** (Language Layer):
- Parser: >95% coverage
  - Valid CEDL documents
  - Invalid YAML syntax
  - Type validation
  - Diagnostic accuracy
  
- Validators: >95% coverage
  - Schema validation
  - Semantic validation
  - Reference resolution
  
- Transformers: >90% coverage
  - CEDL→AST transformation
  - AST completeness
  - Context preparation

**Integration Tests**:
- Full generation pipeline
  - CEDL input → Generated app
  - Template rendering
  - File output
  
- Parity tests
  - TypeScript generator
  - Rust generator
  - Byte-for-byte comparison

**E2E Tests**:
- Real application generation
- Generated app compilation (cargo, bun)
- Generated app test suite passes
- API functionality verified

### 9.2 Parity Testing

```typescript
// test/e2e/parity.test.ts

describe('Generator Parity: TypeScript ↔ Rust', () => {
  const models = [
    'drug-discovery.cedl.yaml',
    'crm.cedl.yaml',
    'ecommerce.cedl.yaml',
  ];
  
  for (const model of models) {
    test(`${model} produces identical output`, async () => {
      // 1. Generate with TypeScript
      const tsOutput = await generateWithTypeScript(model);
      
      // 2. Generate with Rust
      const rustOutput = await generateWithRust(model);
      
      // 3. Diff (ignoring Generated: timestamp)
      const diff = diffBackends(tsOutput, rustOutput);
      
      expect(diff).toEqual([]);
    });
  }
});
```

---

## Part 10: Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Incomplete type coverage | Medium | High | Comprehensive type system design + parity tests |
| Parser performance with large models | Low | Medium | Streaming parser option + benchmarks |
| YAML whitespace issues | Low | Medium | Strict schema validation + clear error messages |
| Template compatibility | Low | High | No template changes; transformer layer ensures compatibility |
| Rust parity failures | Medium | High | Byte-for-byte parity tests on every commit |
| Migration tool incomplete | Medium | Medium | Auto-conversion + manual review workflow |
| Breaking change for users | High | High | Dual support (Mermaid + CEDL) + migration CLI + documentation |
| WASM bundle size | Low | Medium | Tree-shaking + compression |

**Mitigation Approach:**
- Dual support (Mermaid still works)
- Comprehensive testing at each phase
- Clear migration path
- Phased rollout with early adopter feedback

---

## Part 11: Success Criteria

### 11.1 Phase-wise Gates

**Phase 1 Complete:**
- ✅ CEDLParser.parse() handles all model constructs
- ✅ All 150 diagnostics implemented and tested
- ✅ Example models migrated to CEDL
- ✅ Parser tests >90% coverage

**Phase 2 Complete:**
- ✅ CEDL→AST transformation produces expected output
- ✅ Existing templates render without modification
- ✅ CEDL→Mermaid produces valid diagrams
- ✅ Integration tests pass

**Phase 3 Complete:**
- ✅ CLI commands functional and documented
- ✅ WASM bundle compiles and works
- ✅ Web UI accepts YAML input
- ✅ File handling works correctly

**Phase 4 Complete:**
- ✅ Rust parser parses all CEDL documents
- ✅ Rust generator produces byte-for-byte identical output
- ✅ Parity tests green for all examples
- ✅ Clippy clean with `-D warnings`

**Phase 5 Complete:**
- ✅ Migration guide published
- ✅ CLAUDE.md updated with YAML-first approach
- ✅ Examples cover all features
- ✅ Users can create models from scratch

### 11.2 Quantitative Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Parser test coverage | >95% | Catch edge cases early |
| Integration test pass rate | 100% | No regressions |
| Parity test success | 100% | Generators equivalent |
| Generation performance | <200ms for medium model | CLI responsiveness |
| WASM bundle size | <2MB | Browser delivery |
| Migration tool success rate | >95% | Most models auto-migrate |
| Documentation completeness | 100% | All features documented |

---

## Part 12: Rollout & Communication

### 12.1 Timeline

| Phase | Duration | Key Dates |
|-------|----------|-----------|
| Phase 1: Foundation | 3 weeks | Sep 30 - Oct 20 |
| Phase 2: Transformation | 2 weeks | Oct 21 - Nov 3 |
| Phase 3: CLI & Tooling | 2 weeks | Nov 4 - Nov 17 |
| Phase 4: Rust Port | 3 weeks | Nov 18 - Dec 8 |
| Phase 5: Migration & Docs | 2 weeks | Dec 9 - Dec 22 |
| **Total** | **12 weeks** | Sep 30 - Dec 22 |

### 12.2 Communication Plan

- **Weekly**: Team sync on progress, blockers
- **Bi-weekly**: Stakeholder updates
- **Milestone release**: End of each phase with beta documentation
- **Migration guides**: Published concurrent with tool releases
- **Example library**: Grows with each phase

---

## Conclusion

This architectural transformation positions cedm-specification as:
1. **The canonical source** for enterprise model definitions (YAML)
2. **The specification platform** for domain-driven design
3. **The code generation hub** with YAML→Code capability
4. **The tooling ecosystem** (CLI, WASM, Web UI, VS Code)

The phased approach ensures:
- ✅ **No breaking changes** (Mermaid still supported)
- ✅ **Continuous functionality** (generators unchanged)
- ✅ **Measurable progress** (clear phase gates)
- ✅ **Production quality** (parity & comprehensive testing)

**Next Steps:**
1. Stakeholder review of this architecture
2. Approval to begin Phase 1
3. Repository setup on `claude/cedm-yaml-architecture-uxneqi` branch
4. Sprint planning for Phase 1 tasks

