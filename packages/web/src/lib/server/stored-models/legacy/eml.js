// Vendored from 18f5792 by build.ts — do not edit; see README.md.
var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

// language/index.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
var LANGUAGE_DEFINITION_PATH = (() => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "appwithai-language.json");
})();
var cached = null;
function setLanguageDefinition(definition) {
  cached = definition;
}
// language/appwithai-language.json
var appwithai_language_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://appwithai.dev/language/appwithai-language.json",
  language: {
    id: "appwithai-eml",
    name: "APPWITHAI Modeling Language",
    abbreviation: "EML",
    version: "1.2.0",
    basedOn: "mermaid",
    mermaidCompatibility: "All EML documents are valid, renderable Mermaid. EML is a semantic superset that assigns generator meaning to standard Mermaid constructs (erDiagram, flowchart, stateDiagram-v2) and to `%%`-prefixed directive comments.",
    description: "A single, standalone, Mermaid-based language for describing an application's Entity Relationship Diagram (ERD), its business rules, and its business workflows in one place. EML is the source language read by the APPWITHAI generator to produce full-stack applications (TanStack Start + NestJS, or OpenUI5 + OData V4).",
    fileExtensions: [".eml.mmd", ".erd.mmd", ".flow.mmd", ".rules.mmd", ".mmd"],
    encoding: "utf-8",
    caseSensitivity: {
      entityNames: "significant (PascalCase recommended)",
      attributeNames: "significant (snake_case recommended)",
      keywords: "significant (erDiagram, flowchart, etc.)",
      types: "insensitive (normalized to lower-case before mapping)",
      modifiers: "insensitive (normalized to UPPER-case before mapping)",
      hookTypes: "significant (camelCase, e.g. beforeCreate)"
    },
    purpose: [
      "Describe database structure (entities, attributes, keys, relationships) as an ERD.",
      "Describe declarative business rules (decision logic, pricing, validation, eligibility) as decision flows that compile to GoRules JDM.",
      "Describe imperative business workflows (lifecycle hooks and process orchestration) as flow/state diagrams with hook directives.",
      "Provide one coherent, human- and machine-readable artifact that the generator consumes to emit code."
    ]
  },
  document: {
    description: "An EML document is a text file containing one or more sections. Each section opens with a Mermaid diagram keyword. A single file may contain multiple diagrams separated by blank lines; the generator classifies each by its opening keyword and by directive comments.",
    comments: {
      syntax: "%%",
      description: "Lines beginning with %% are Mermaid comments. Plain comments are ignored by renderers and by the generator. Comments beginning with a reserved directive keyword (%%hook, %%rule, %%meta, %%entity, %%enum, %%index, %%workflow, %%trigger, %%guard) carry semantic meaning to the generator while remaining renderer-safe.",
      plainCommentExample: "%% This is documentation, ignored by the generator",
      directiveCommentExample: "%%hook beforeCreate hashPassword on User"
    },
    sectionClassifier: {
      description: "How the generator decides what a diagram block means.",
      rules: [
        {
          openingKeyword: "erDiagram",
          section: "erd"
        },
        {
          openingKeyword: "flowchart",
          section: "resolved by %%meta section directive; defaults to 'workflow' unless rule-shaped or marked kind: rules"
        },
        {
          openingKeyword: "graph",
          section: "alias of flowchart"
        },
        {
          openingKeyword: "stateDiagram-v2",
          section: "workflow (state-machine form)"
        },
        {
          openingKeyword: "stateDiagram",
          section: "workflow (state-machine form, legacy)"
        }
      ],
      disambiguation: "A flowchart is treated as a business-rules decision flow when it is preceded by `%%meta kind: rules` OR when it contains only decision/expression/function/io node shapes and no %%hook directives. Otherwise it is treated as a workflow."
    }
  },
  sections: {
    erd: {
      title: "Entity Relationship Diagram",
      opensWith: "erDiagram",
      consumedBy: "packages/generator/src/parsers/mermaid.parser.ts (MermaidParser.parse)",
      produces: "Entity[] and Relationship[] used by the code generator (migrations, DTOs, services, controllers, forms, tables).",
      constructs: {
        entityBlock: {
          grammar: "EntityName {\\n  <attribute>*\\n}",
          entityNameRule: "^[a-zA-Z][a-zA-Z0-9_]*$",
          recommendedCase: "PascalCase (Customer, OrderItem). snake_case (order_item) and prefixed names (bus_account, sys_user) are also accepted.",
          tableNameDerivation: "PascalCase/camelCase -> snake_case; ALL_CAPS/snake stays lower-case. Optional bus_/sys_ prefixes are preserved.",
          example: `Customer {
    string id PK
    string email UK
    string first_name
    date created_at
}`
        },
        attribute: {
          grammar: '<type>[(<length>)] <name> [<modifier> ...] ["<description>"]',
          attributeNameRule: "^[a-zA-Z][a-zA-Z0-9_]*$",
          recommendedCase: "snake_case (first_name, company_id).",
          length: "Optional decimal length in parentheses attached to the type, e.g. string(120). Captured as maxLength.",
          notes: [
            "The first token is the type, the second is the name, remaining tokens are modifiers.",
            "A quoted trailing string is treated as the attribute description/comment.",
            "If an entity declares no id/_id attribute, the generator auto-adds `string id PK`.",
            "timestamps (created_at, updated_at) are added by the generator by default (entity.timestamps = true)."
          ],
          examples: [
            "string id PK",
            "string email UK",
            "string(120) display_name",
            "decimal amount OPTIONAL",
            'string company_id FK OPTIONAL "owning company"',
            "boolean is_active"
          ]
        },
        relationship: {
          grammar: '<LeftEntity> <cardinality> <RightEntity> : "<label>"',
          labelOptional: true,
          labelNormalization: "Trimmed, whitespace -> underscore, lower-cased to form the relationship name.",
          foreignKeyDerivation: "snake_case(targetEntity) with any bus_ prefix removed, suffixed with _id (e.g. Company -> company_id).",
          examples: [
            'Company ||--o{ Contact : "employs"',
            'Deal }o--|| DealStage : "in_stage"',
            'Quote ||--o{ QuoteItem : "contains"',
            'User ||--|| Team : "managed_by"'
          ]
        }
      }
    },
    rules: {
      title: "Business Rules (Decision Flows)",
      opensWith: "flowchart TD  (with `%%meta kind: rules`)",
      consumedBy: "packages/web/src/lib/mermaid-flowchart-parser.ts -> packages/web/src/lib/jdm-converter.ts (convertToJdm)",
      produces: "A GoRules JDM decision graph (nodes + edges) used to evaluate declarative business logic (pricing, discounts, eligibility, validation, routing).",
      modelingPrinciple: "A business rule is a directed decision flow. Node *shape* determines its JDM role; edge *labels* carry the branch condition or transition name.",
      constructs: {
        node: {
          grammar: "<NodeId><shapeDelimiters label>",
          nodeIdRule: "^[A-Za-z_][A-Za-z0-9_]*$",
          shapeSemantics: "See ruleNodes map. stadium=input/output, diamond=decision/switch, circle=function, rect=expression/action.",
          inputVsOutput: "A stadium node with no outgoing edges (only incoming) is an outputNode; otherwise it is an inputNode. This lets a single shape mark both Start and End."
        },
        edge: {
          grammar: "<SourceId> -->|<label>| <TargetId>   (label optional)",
          labelMeaning: "For edges leaving a decision (diamond) node, the label is the branch condition (e.g. Yes / No / amount > 1000). For other edges it is an optional transition name.",
          examples: [
            "B -->|Yes| C[Apply Premium Discount 15%]",
            "B -->|No| D{Customer is VIP?}",
            "C --> G(Calculate Final Price)"
          ]
        }
      },
      example: `flowchart TD
    A([Start: Order Received]) --> B{Order Amount > $1000?}
    B -->|Yes| C[Apply Premium Discount 15%]
    B -->|No| D{Customer is VIP?}
    D -->|Yes| E[Apply VIP Discount 10%]
    D -->|No| F[Apply Standard Pricing]
    C --> G(Calculate Final Price)
    E --> G
    F --> G
    G --> H([End: Price Calculated])`
    },
    workflows: {
      title: "Business Workflows (Lifecycle Hooks & Process Orchestration)",
      opensWith: "flowchart TD  or  stateDiagram-v2",
      consumedBy: "packages/web/src/lib/workflow/hook-parser.ts (parseHooksFromFlowchart) and packages/web/src/lib/mermaid-flowchart-parser.ts",
      produces: "HookDefinition[] wired into the generated BaseService lifecycle, plus a visual process flow. Hooks map to entity CRUD lifecycle events at generation time.",
      modelingPrinciple: "A workflow is the visible process (a flow/state diagram) annotated with %%hook directives that bind named handlers to entity lifecycle events, and optional %%guard/%%trigger directives for authorization and event sources.",
      constructs: {
        hookDirective: {
          grammar: "%%hook <hookType> <handlerName> on <EntityName>[<params>]",
          params: "Optional [field: name, field: name] list scoping the hook to specific fields.",
          hookTypeRule: "one of the 13 hook types (see hooks map)",
          handlerNameRule: "^[a-zA-Z_][a-zA-Z0-9_]*$",
          entityRule: "^[a-zA-Z_][a-zA-Z0-9_]*$",
          examples: [
            "%%hook beforeCreate hashPassword on User",
            "%%hook afterCreate sendWelcomeEmail on User",
            "%%hook beforeCreate generateSlug on Post[field: slug]",
            "%%hook customValidate ensureCreditLimit on Order"
          ]
        },
        processNode: {
          description: "Standard flowchart/state nodes represent process steps; the same shape semantics as rules apply for visualization.",
          example: `flowchart TD
    A[Client Request] --> B[Validate Request]
    B --> C[beforeCreate: hashPassword]
    C --> D[Process User]
    D --> E[afterCreate: sendWelcomeEmail]
    E --> F[Response]`
        },
        stateForm: {
          description: "stateDiagram-v2 expresses a long-running/entity status workflow. States map to a status enum; transitions map to allowed status changes and can be guarded.",
          example: `stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted : submit
    Submitted --> Approved : approve
    Submitted --> Rejected : reject
    Approved --> [*]`
        }
      }
    }
  },
  types: {
    description: "Attribute type vocabulary. Aliases are normalized to a canonical type. Canonical types drive TypeScript, Zod, SQL/Kysely, OData EDM, and UI control mapping in the generator.",
    canonical: ["string", "text", "integer", "decimal", "boolean", "date", "datetime", "json"],
    map: {
      string: "string",
      varchar: "string",
      char: "string",
      uuid: "string",
      guid: "string",
      id: "string",
      email: "string",
      url: "string",
      phone: "string",
      password: "string",
      color: "string",
      text: "text",
      longtext: "text",
      int: "integer",
      integer: "integer",
      bigint: "integer",
      smallint: "integer",
      number: "decimal",
      decimal: "decimal",
      float: "decimal",
      double: "decimal",
      money: "decimal",
      amount: "decimal",
      bool: "boolean",
      boolean: "boolean",
      date: "date",
      datetime: "datetime",
      timestamp: "datetime",
      time: "datetime",
      json: "json",
      jsonb: "json",
      object: "json",
      array: "json"
    },
    semanticHints: {
      description: "Aliases that normalize to a base type but carry UI/validation intent the generator may honor via naming or the extended %%meta field directive.",
      email: "string rendered as email input, validated as email",
      url: "string rendered as url input",
      password: "string rendered as password input, min length enforced",
      phone: "string rendered as tel input",
      color: "string rendered as color picker",
      uuid: "string treated as a UUID primary/foreign key"
    },
    default: "string"
  },
  modifiers: {
    description: "Trailing tokens on an ERD attribute. Normalized to UPPER-case. Unknown modifiers are ignored.",
    map: {
      PK: {
        meaning: "Primary key",
        effects: [
          "unique = true",
          "required handled by generator (auto-generated)",
          "sets entity.primaryKey"
        ]
      },
      FK: {
        meaning: "Foreign key",
        effects: ["marks the column as a reference; relationship inference / navigation"]
      },
      UK: {
        meaning: "Unique key",
        effects: ["unique = true"]
      },
      UNIQUE: {
        meaning: "Alias of UK",
        effects: ["unique = true"]
      },
      OPTIONAL: {
        meaning: "Nullable / not required",
        effects: ["required = false"]
      },
      NULL: {
        meaning: "Alias of OPTIONAL",
        effects: ["required = false"]
      }
    },
    defaults: {
      required: "true unless OPTIONAL/NULL or PK",
      unique: "false unless UK/UNIQUE/PK"
    }
  },
  foreignKeys: {
    description: "How an FK column name resolves to the table it points at. The generator derives the target from the column name alone — there is no explicit target syntax on the attribute — so the name has to carry the reference.",
    suffix: "_id",
    resolution: [
      "1. A person-role name (see personRoleColumns) resolves to the model's person entity (User if it exists, then Staff, then Employee).",
      "2. Otherwise <entity>_id resolves to bus_<entity>.",
      "3. A column that resolves to nothing is stored as a plain string: no lookup, no display name, the raw id renders in grids and forms."
    ],
    personRoleColumns: {
      description: "Columns naming a person by the role they played rather than by entity. All resolve to the model's person entity (User > Staff > Employee, whichever exists first).",
      suffixes: ["_by", "_by_id"],
      names: [
        "assigned_to",
        "author_id",
        "lab_manager_id",
        "manager_id",
        "owner_id",
        "pi_id",
        "remediation_owner",
        "remediation_owner_id",
        "user_id"
      ],
      examples: [
        "reported_by_id -> bus_user (or bus_staff when the model has no User entity)",
        "registered_by_id -> bus_user (or bus_staff / bus_employee)",
        "pi_id -> bus_user (a principal investigator is a person, not a bus_pi table)"
      ]
    },
    checkerCodes: {
      EML114: "FK column does not end in _id. Auto-fixable: the fixer appends the suffix, so `reported_by FK` becomes `reported_by_id FK` and starts resolving to the person entity.",
      EML119: "A column named like a reference (_id/_by, resolving to a declared entity) that carries no FK modifier. Both conditions are required for TABLE_DIRECT, and a column that fails either is recorded as a plain String."
    }
  },
  applicationDictionary: {
    description: "The generated application is metadata-driven: it does not hard-code forms. Every table, column, tab, field and lookup is a row in the Application Dictionary (sys_table, sys_column, sys_field, sys_tab, sys_window, sys_category, sys_reference, sys_ref_list), and the running interface reads those rows, which is why a field can be added to a live application without a deployment. Nothing in EML writes dictionary rows: they are derived, one way, from the ERD. There is no %%dictionary directive, and a model that wants a lookup or a dropdown gets one by declaring the column so that the derivation produces it.",
    derivedBy: "packages/core/src/types/bus-entity.types.ts (attributeReferenceId, isForeignKeyColumnName, attributeToBusAttribute)",
    consumedBy: [
      "packages/generator/src/generators/wasm/model-bundle.ts (referenceIdFor)",
      "packages/generator/src/generators/dictionary (sys_table, sys_column, sys_field seeds)",
      "packages/web (the runtime that renders a control per sys_reference_id)"
    ],
    referenceTypes: {
      description: "sys_reference_id decides the control the user gets. Ids below 1000 are the standard references below; a %%enum creates its own List reference at 1000 or above, with one sys_ref_list row per value.",
      standard: {
        "10": "String - plain text box",
        "11": "Integer",
        "12": "Amount - decimal, right aligned",
        "13": "ID - the record key, read-only",
        "14": "Text - memo box",
        "15": "Date",
        "16": "DateTime",
        "17": "List - dropdown fed by sys_ref_list",
        "18": "Table - lookup with an explicit validation rule",
        "19": "Table Direct - lookup on the table the column name resolves to",
        "20": "Yes-No - switch",
        "21": "Location",
        "22": "Locator",
        "23": "Account",
        "24": "URL",
        "25": "Image",
        "26": "File",
        "27": "Color",
        "28": "JSON",
        "29": "Password - masked",
        "30": "Email",
        "31": "Phone"
      }
    },
    derivation: [
      "1. The entity's primary key, or a column named `id`, gets ID (13).",
      "2. A column that is BOTH marked FK and named _id/_by (see foreignKeys.resolution) gets TABLE_DIRECT (19) - the lookup on the parent table.",
      "3. A column bound by `%%field <Entity>.<column> enum: <Enum>` gets that enum's List reference (>= 1000).",
      "4. Otherwise the semantic aliases decide: email/phone/url/password/color map to their own references (30, 31, 24, 29, 27).",
      "5. Otherwise the canonical type decides: text -> Text, boolean -> Yes-No, decimal/money -> Amount, date -> Date, datetime -> DateTime, json -> JSON, integer -> Integer, everything else -> String."
    ],
    silentDowngrades: {
      description: "Two authoring mistakes leave a column at String (10) with a document that is otherwise correct. Both were invisible before EML119 and EML146: the model parses, the relationship line can be present, and the generated application comes back with raw ids in text boxes.",
      unmarkedReference: "`string vendor_id` and `string vendor_id FK` parse into the same column, and only the second becomes TABLE_DIRECT. Reported as EML119.",
      unboundLifecycleColumn: "A %%enum does nothing to a column on its own. Without the %%field binding, a status/state/stage column is free text, and the form accepts values the state machine cannot act on. Reported as EML146."
    },
    displayValue: {
      description: "What a record is called wherever something other than the record shows it: a Table Direct dropdown, and a grid cell holding a foreign key. Stored as sys_column.is_identifier, and the display value is the identifier columns concatenated in seq_no order - the same rule in both stacks.",
      derivation: [
        "1. A column named name, full_name, display_name, title, label or subject - whichever appears first in that order.",
        "2. Otherwise first_name and last_name together, if the entity declares both. This is why the value is a concatenation and not one column.",
        "3. Otherwise code, reference or number - not a name, but what people quote at each other, and better than a uuid.",
        "4. Otherwise, if the entity declares two or more FK columns ending _id/_by, it is a join entity: its first two references are the identifiers, each resolved through the parent's own label. CampaignMember reads as `Spring Promo - Omar Kowalski`.",
        "5. Otherwise the first declared string/text column that is neither the key nor a reference.",
        "6. Otherwise the key, so a lookup still lists something."
      ],
      joinEntities: {
        description: "An entity whose identity is the pair of records it joins - CampaignMember, OrderLine, QuoteLineItem - has no name to give it, and step 5 would pick whatever text column came first: member_status, so every campaign member read `invited`. Two or more references and no name of its own is the shape.",
        depth: "One level only. A parent that is itself a join entity labels itself by its key rather than recursing, because a label assembled from four grandparents is not a name anybody reads.",
        pairOnly: "The first two references in declared order, never more. An entity with three parents labels itself from the first two, which is the only say the modeller has in it - so declare the two that name the record first.",
        separator: "Two names of one record join with a space (`Omar Kowalski`); two records join with an em dash (`Spring Promo - Omar Kowalski`). Sharing one separator turns a person into `Omar - Kowalski`.",
        sqlNote: "A generated key is UUID and a reference to it is VARCHAR(255), because the model declares `string campaign_id FK`. Postgres coerces a text parameter to uuid but refuses to compare the two columns, so the resolving subquery casts both sides."
      },
      primaryKeyIsNotAnIdentifier: "The key is deliberately excluded. It used to be marked, which meant a display value built from the identifier columns began with a uuid, and every consumer had grown its own filter to drop it.",
      modellingAdvice: "Give an entity a name, title or code column if it will be referenced. Without one the fallbacks apply, and a reference to it reads as whatever text column happened to be declared first. A join entity is the exception and needs nothing: it names itself from its parents."
    },
    managedColumns: {
      description: "Columns every generated table carries in both stacks, whether or not the model mentions them. They are the generator's: the key, the optimistic-lock counter, the audit pair and the soft-delete pair.",
      names: [
        "id",
        "version",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "deleted_at",
        "deleted_by"
      ],
      declaringOne: 'Redundant, and it used to be fatal: the column reached CREATE TABLE twice and PostgreSQL refused the statement with `column "created_at" specified more than once`, so the generated application could not open its database. The generator now drops the model\'s definition and keeps its own; EML103 reports the line.',
      checkerCodes: {
        EML103: "A column the generator manages, declared in the model - the declaration is ignored."
      }
    },
    alsoDerived: [
      "Each entity becomes a sys_table with a window and a tab; attributes become fields in declared order (seqNo = (index + 1) * 10).",
      "%%index becomes real indexes; a unique attribute or a `name` column is indexed automatically (mergeIndexes).",
      "%%category becomes the dashboard grouping; a model declaring none gets a single General category holding every entity.",
      "%%field <Entity>.<column> help: and %%entity <Name> help: become sys_column.description and sys_table.description - the help a reader sees under the field and beside the table. %%entity description: is the same key under its other name.",
      "%%entity <Child> parent: <Parent> makes the child a line item: no window and no dashboard card, a tab inside the parent's window instead. See masterDetail.",
      "%%entity <Name> icon: becomes sys_table.icon — the entity's dashboard card, its window heading and its navigation entry all draw it. It is a lucide name, and an administrator may override it afterwards in Table and Column, including by uploading an image; the same column holds both. %%category carries an icon the same way, for its heading.",
      "The remaining %%entity keys (label, prefix, softDelete, audited) are validated but not yet compiled."
    ],
    helpText: {
      description: "The only explanation a generated application has. `%%entity <Name> help:` becomes sys_table.description and opens that entity's section of manual.html; `%%field <Entity>.<column> help:` becomes sys_column.description, the hint under the control, and the column's row in the manual. There is no second source — no hand-written tooltip, no README beside the form, no designer to ask — so a model that skips it produces an application whose manual is a table of dashes.",
      required: "On every entity and every column, without exception, including the ones that feel self-evident. The primary key is the one thing that needs none: it is a generated uuid, read-only on every form, and the only sentence anyone could write about it restates its name.",
      mustBeDomainKnowledge: "Help is where the *business* lands in the model, not where the schema is paraphrased. `Household id for HouseholdMember.` is the column name in a sentence and leaves the reader exactly where they started; `The family this membership is in — listed inside the household's own screen, since a membership away from its household is not something anybody looks up.` is what the field is for. The distinction is not style: help is compiled, so the difference between the two reaches every form, every dictionary row and every page of the manual.",
      whatToSay: [
        "An entity: what this record is for in the business, when one comes into existence, what distinguishes it from the entities it sounds like, and what it must not be confused with.",
        "A column: why the value matters, what is expected in it, what reads it downstream, and what goes wrong when it is wrong.",
        "A reference column: what the reference is *for* — `the ward this bed stands in`, not `the ward id`.",
        "An enum-bound column: what each value means to the business, because the dictionary lists the values and nothing else says what choosing one does.",
        "A lifecycle column: which moves are possible from which state, since the state machine enforces a topology the form cannot show."
      ],
      whenToWriteIt: "While the model is being written, and nowhere else. The moment a model is authored is the only moment anybody knows the answers, and no later pass adds them — which is why this is the most-skipped part of a model and the most expensive to skip.",
      checkerCodes: {
        EML151: "warning — help that restates its own subject: `Unique identifier for X`, the column name in prose (`Status for Client`), or a template sentence (`Address is a business record in the wealth-management platform`). Deliberately narrow: real help that happens to be short is not a restatement and does not fire.",
        EML152: "warning — an entity with no `%%entity ... help:` at all.",
        EML153: "warning — the columns of one entity with no `%%field ... help:`, reported once per entity and naming them. One diagnostic per column would bury every other finding on a model that skipped help entirely, which is the common case."
      }
    },
    masterDetail: {
      description: "A line item is an entity with no life away from its owner - an invoice line, an order line, a prescription item. The ERD cannot tell one from an ordinary reference, because InvoiceLine.invoice_id and Invoice.patient_id are both a foreign key with a relationship behind it. The modeller says which it is.",
      directive: "%%entity <Child> parent: <Parent>",
      effects: [
        "The child gets no sys_window and no dashboard card: it is not somewhere the user navigates to.",
        "The child's sys_tab is created under the parent's window at tab_level 1, sequenced after the master tab.",
        "sys_tab.link_column_id is set to the child's own foreign key back to the parent, and that column is marked sys_column.is_parent.",
        "Opening a parent record lists its children beneath the form, filtered to that record."
      ],
      linkColumn: "The child's existing foreign key to the parent - <parent_snake>_id when present, else the first FK column whose name begins with the parent's snake_case name. Never declared twice: the relationship is already in the ERD.",
      identifyingAChild: [
        "Would a list of these records, away from their owner, be useful to anyone? If not, it is a child.",
        "Does the row's identity depend on the owner - line 1 of invoice 7, rather than line 1? If so, it is a child.",
        "Would deleting the owner make the row meaningless? If so, it is a child.",
        "A reference is the opposite: Invoice.patient_id points at a Patient who exists, and matters, independently."
      ],
      whyItMustBeDeclared: "Nothing derives it, and the default is not an error. A model that never writes the directive produces an application in which every line item carries its own dashboard card and its own screen, and no parent record shows its own lines — an invoice whose lines cannot be read from it, beside a card listing every line ever written. EML149 exists to name the candidates, because a silent default is the one thing a checker can still be useful about.",
      leaveItOutOfCategory: "A %%category is the dashboard's grouping, and a child has no card, so naming a child in one asks for a card the dictionary will not create. Reported as EML150.",
      detection: {
        description: "EML149 is an info rather than an error, because whether a list of these records away from their owner is useful to anyone is a question about the business and not about the document. The checker names the candidate parent and the foreign key the tab would link on; the author answers it either way.",
        shapes: [
          "The entity's name begins with a declared entity's name and it carries a foreign key to that entity — InvoiceLine/Invoice, OrderItem/Order, TeamMember/Team, FinancialPlanAssumption/FinancialPlan. The longest match wins, so a name that begins with two declared entities belongs to the longer one.",
          "The entity's name ends in a line-item noun (Line, LineItem, Item, Detail, Entry, Row, singular or plural) and one of its foreign keys resolves to a declared entity — RecommendationItem under InvestmentRecommendation."
        ],
        quietOn: "An entity that merely references another. Most foreign keys are references, and neither shape fires on one."
      }
    },
    checkerCodes: {
      EML103: "A column the generator already adds (id, version, the audit pair, the soft-delete pair), declared in the model.",
      EML119: "A reference-shaped column with no FK modifier - the lookup is lost.",
      EML146: "A status/state/stage column with no %%field enum binding - the dropdown is lost.",
      EML147: "%%entity ... parent: names an entity that is not declared, or the entity names itself.",
      EML148: "%%entity ... parent: is declared but the child has no foreign key back to the parent, so the detail tab has nothing to link on.",
      EML149: "info — an entity shaped like a line item that declares no parent:. Names the candidate parent and the column a tab would link on. Never an error: identifyingAChild's three questions are about the business, not the document.",
      EML150: "warning — an entity declared parent: is also named in a %%category. The category asks for a dashboard card the directive has taken away.",
      EML151: "warning — entity or column help that restates its own name instead of describing it. See helpText.mustBeDomainKnowledge.",
      EML152: "warning — an entity with no help text at all.",
      EML153: "warning — columns with no help text, reported once per entity.",
      EML154: "warning — a %%category with no `name:` key. category.parser.ts requires one and skips the line without it, so the whole grouping is silently lost and its entities fall into the default General category.",
      EML500: "A `kind: state` workflow bound to an entity with no status/state/stage column at all - the machine has nothing to track."
    },
    reportDesigns: {
      description: "Generated applications include a document report subsystem backed by the AnkaReport library. One default AnkaReport layout is seeded per entity into sys_report_designs at generation time. Administrators can customise any layout at Admin → Report Designs. Users get a Print button on a record's detail view (visible only when a design exists for that table), and can export the rendered report to PDF.",
      table: "sys_report_designs",
      columns: {
        id: "UUID primary key",
        table_name: "Entity table name; UNIQUE — one design per table",
        name: 'Human-readable design name (e.g. "Contact Default Report")',
        layout: "JSONB AnkaReport ILayout object — headerSection, contentSection, footerSection"
      },
      defaultLayout: {
        description: "Generated by packages/generator/templates/common/seeds/report-designs.ts.hbs. Fields in the layout are every non-audit, non-PK column: not id, created_at, updated_at, deleted_at, version.",
        structure: {
          headerSection: 'height 56; entity displayName + " Report" in 20pt bold #0f4c75',
          contentSection: 'binding: "records"; one label+value row per field, 24pt high with 4px gap',
          footerSection: 'height 28; "Generated by APPWITHAI" in 9pt #9ca3af centered'
        }
      },
      adminRoutes: [
        "GET /admin/reports — lists all entity tables with Designed/New badge",
        "GET /admin/reports/:tableName — opens AnkaReport designer pre-loaded with the existing layout"
      ],
      backendEndpoints: [
        "GET /sys/report-designs — list all designs",
        "GET /sys/report-designs/:tableName — get design by table",
        "POST /sys/report-designs — create (admin only)",
        "PUT /sys/report-designs/:tableName — upsert (admin only)",
        "DELETE /sys/report-designs/:tableName — delete (admin only)"
      ],
      printButton: "Appears in the record toolbar (ADToolbar hasPrintReport prop) only when a design exists for the current entity. Clicking opens ReportPrintModal which renders the report via AnkaReport.render() and offers PDF export.",
      authoringNote: "No EML directive controls report designs. The default layout is always seeded automatically from the entity's columns. Customisation is done through the running Admin UI, not through the model."
    }
  },
  cardinalities: {
    description: "Mermaid ER relationship operators and their semantic meaning. Left/right glyphs encode min/max multiplicity; EML maps the pair to a cardinality kind and infers the foreign-key side.",
    glyphReference: {
      "||": "exactly one",
      "|o": "zero or one",
      "o|": "zero or one",
      "}o": "zero or many",
      "o{": "zero or many",
      "}|": "one or many",
      "|{": "one or many"
    },
    map: [
      {
        operator: "||--||",
        kind: "oneToOne",
        example: "User ||--|| Profile : has"
      },
      {
        operator: "||--o{",
        kind: "oneToMany",
        example: "Company ||--o{ Contact : employs"
      },
      {
        operator: "||--|{",
        kind: "oneToMany",
        example: "Order ||--|{ OrderItem : contains"
      },
      {
        operator: "}o--||",
        kind: "manyToOne",
        example: "Deal }o--|| DealStage : in_stage"
      },
      {
        operator: "}|--||",
        kind: "manyToOne",
        example: "OrderItem }|--|| Order : belongs_to"
      },
      {
        operator: "}o--o{",
        kind: "manyToMany",
        example: "Student }o--o{ Course : enrolls"
      },
      {
        operator: "}|--|{",
        kind: "manyToMany",
        example: "Author }|--|{ Book : writes"
      },
      {
        operator: "|o--o|",
        kind: "oneToOne",
        example: "Employee |o--o| ParkingSpot : assigned"
      }
    ]
  },
  hooks: {
    description: "Lifecycle event points a workflow hook may bind to. Each %%hook directive generates a handler function in the generated backend (src/modules/hooks/handlers/<Entity>.ts), registered against the event and run by the bus service around the matching CRUD operation.",
    types: [
      {
        type: "beforeCreate",
        phase: "before",
        op: "create",
        purpose: "Validate/transform an entity before insert (e.g. hash password, generate slug)."
      },
      {
        type: "afterCreate",
        phase: "after",
        op: "create",
        purpose: "Side effects after insert (e.g. send welcome email, emit event)."
      },
      {
        type: "beforeUpdate",
        phase: "before",
        op: "update",
        purpose: "Validate/transform before update."
      },
      {
        type: "afterUpdate",
        phase: "after",
        op: "update",
        purpose: "Side effects after update (e.g. audit, cache invalidation)."
      },
      {
        type: "beforeDelete",
        phase: "before",
        op: "delete",
        purpose: "Guard/validate before delete (e.g. block if referenced)."
      },
      {
        type: "afterDelete",
        phase: "after",
        op: "delete",
        purpose: "Cleanup after delete (e.g. remove files)."
      },
      {
        type: "beforeQuery",
        phase: "before",
        op: "query",
        purpose: "Mutate the query before it runs (e.g. tenant scoping)."
      },
      {
        type: "afterQuery",
        phase: "after",
        op: "query",
        purpose: "Post-process query results."
      },
      {
        type: "customValidate",
        phase: "validate",
        op: "any",
        purpose: "Cross-field/business validation independent of a single CRUD verb."
      },
      {
        type: "beforeRead",
        phase: "before",
        op: "read",
        purpose: "Guard/transform a single-record read."
      },
      {
        type: "afterRead",
        phase: "after",
        op: "read",
        purpose: "Post-process a single record (e.g. redact fields)."
      },
      {
        type: "beforeList",
        phase: "before",
        op: "list",
        purpose: "Adjust list parameters (filter/sort/paginate)."
      },
      {
        type: "afterList",
        phase: "after",
        op: "list",
        purpose: "Post-process a list result set."
      }
    ],
    directive: {
      pattern: "%%hook <type> <handlerName> on <Entity>[<params>]",
      regex: "%%hook\\s+(\\w+)\\s+(\\w+)\\s+on\\s+(\\w+)(\\[(?:field:\\s*\\w+(?:\\s*,\\s*field:\\s*\\w+)*)?\\])?",
      paramForms: ["[field: slug]", "[field: slug, field: title]"]
    }
  },
  ruleNodes: {
    description: "Mapping of Mermaid node shapes to GoRules JDM node roles for business-rule decision flows.",
    map: [
      {
        shape: "stadium",
        delimiters: "([ label ])",
        jdmType: "inputNode | outputNode",
        resolution: "outputNode when the node has only incoming edges; otherwise inputNode.",
        role: "Start / input context, or End / decision output.",
        example: "A([Start: Order Received])"
      },
      {
        shape: "diamond",
        delimiters: "{ label }",
        jdmType: "switchNode",
        role: "Decision / branch. Outgoing edge labels are branch conditions.",
        example: "B{Order Amount > $1000?}"
      },
      {
        shape: "circle",
        delimiters: "(( label ))",
        jdmType: "functionNode",
        role: "Custom function / computation step (JS expression or reusable function).",
        example: "G((Calculate Final Price))"
      },
      {
        shape: "rect",
        delimiters: "[ label ]",
        jdmType: "expressionNode",
        role: "Expression / assignment / action (set output fields, apply a value).",
        example: "C[Apply Premium Discount 15%]"
      },
      {
        shape: "rounded",
        delimiters: "( label )",
        jdmType: "functionNode",
        role: "Rounded rectangle, treated like a function/computation step (used for calculate steps).",
        example: "G(Calculate Final Price)"
      }
    ],
    actions: {
      description: "Side-effecting actions a rule may emit, evaluated by the rules engine after the decision runs. A %%action directive inside a rules section declares one: the `when` expression becomes the decision-table row's condition, and the remaining keys become its outputs. Without this a model-declared rule could only decide, never act — the action vocabulary existed solely in the app's decision-table editor.",
      directive: "%%action <name> <actionType> when: <expr> <key>: <value> ...",
      whenForm: 'A zen expression over the record being written, e.g. `severity == "critical"`. `true` fires on every write. It is the last key parsed before the action\'s own keys, so quote values containing a `key:` sequence.',
      types: [
        {
          name: "trigger-workflow",
          purpose: "Run a workflow definition by name. This is what gates a `kind: saga` workflow declared with `trigger: rule` on a condition.",
          required: ["workflow"],
          optional: ["message"],
          example: '%%action escalate trigger-workflow when: severity == "critical" workflow: CriticalDeviationEscalation'
        },
        {
          name: "validation-error",
          purpose: "Reject the write. The message is returned to the caller.",
          required: ["message"],
          optional: [],
          example: '%%action requireCause validation-error when: status == "closed" and root_cause == null message: A closed deviation needs a root cause'
        },
        {
          name: "transform",
          purpose: "Overwrite a field on the record being written.",
          required: ["field", "value"],
          optional: ["message"],
          example: "%%action stampSeverity transform when: true field: severity value: major"
        }
      ]
    }
  },
  workflowConstructs: {
    description: "Node/edge vocabulary for process workflows and state workflows.",
    flowShapes: {
      stadium: "Start/End terminal ( ([label]) )",
      rect: "Process step ( [label] )",
      diamond: "Gateway/decision ( {label} )",
      circle: "Event/signal ( ((label)) )",
      rounded: "Sub-process/task ( (label) )"
    },
    stateForm: {
      start: "[*] --> FirstState",
      end: "LastState --> [*]",
      transition: "StateA --> StateB : eventName",
      mappingHint: "States are treated as a status enum for the bound entity; transitions define the allowed status changes.",
      enforcement: "The edges are enforced, not merely documented. Every transition a diagram draws is compiled into sys_workflow_transitions, and the generated EntityAccessGuard refuses a write that moves a record to a state with no matching edge from the state it is in — answering 403 and leaving the record where it was. This holds for every caller, the master role included: an edge the diagram never drew is not a permission an administrator lacks, it is a move that does not exist, and allowing it would put the record in a state every rule and workflow downstream was written without. Who may cross an edge that does exist is the separate question %%rbac answers, from sys_transition_access, and that one the master role does bypass. Keep the two apart: enforcing topology only where a role rule happens to cover it leaves every unguarded edge open.",
      readingTheEdges: "GET /api/workflows/transitions returns the stored edges, optionally narrowed by ?table= and ?from=. A screen offering a status change asks this rather than offering every state and letting the save be refused. A table with no state diagram has no rows and nothing is enforced for it."
    },
    workflowKinds: {
      hook: {
        form: "%%workflow <name> entity: <Entity> kind: hook",
        description: "A flowchart whose steps represent operations on a single entity. %%hook directives bind named handlers to the entity's CRUD lifecycle events. Fully parsed by the shipped hook-parser.",
        diagram: "flowchart",
        shipped: true
      },
      state: {
        form: "%%workflow <name> entity: <Entity> kind: state",
        description: "A stateDiagram-v2 whose states map to a status enum for the bound entity. Transitions define the allowed status changes and are enforced as the entity's topology — see stateForm.enforcement. %%rbac directives naming a transition event add the role check on top of that; %%trigger directives declare external event sources. Fully parsed by the shipped hook-parser.",
        diagram: "stateDiagram-v2",
        shipped: true
      },
      saga: {
        form: "%%workflow <name> entity: <Entity> kind: saga [trigger: automatic|rule] [operation: CREATE|UPDATE|DELETE|ALL]",
        description: "A flowchart whose nodes are executable steps. Each node is bound to a step by a %%step directive naming the node id and its step type; the flowchart edges give the running order. Compiles to BPMN service tasks seeded into sys_workflow_definitions and run by the generated workflow executor. This is how a multi-entity, multi-step process — create a row here, update one there, delete a third, passing values between the steps — is expressed in the model rather than drawn by hand in the app.",
        diagram: "flowchart",
        shipped: true,
        trigger: {
          automatic: "Runs on every write to the bound entity that matches the workflow's operation. The default.",
          rule: "Runs only when a business rule emits a trigger-workflow action naming it, so the rule's condition decides. Use this whenever the workflow should not fire on every write."
        },
        ordering: "Steps run in flowchart edge order, walking forward from every node with no incoming edge. A node with a %%step but no edges still runs, after the wired ones, in document order — the canvas implies a step runs even when the connection was left implicit.",
        example: "%%workflow CriticalDeviationEscalation entity: DeviationReport kind: saga trigger: rule operation: CREATE",
        operation: "Which write runs the workflow. Defaults to CREATE. Only consulted for trigger: automatic — a rule-triggered workflow is resolved by name, so the rule decides."
      }
    },
    stepNodes: {
      description: "Executable step types for a `kind: saga` workflow. A %%step directive binds a flowchart node to one of these and supplies its properties; each becomes one bpmn:serviceTask with appwithai:property extension elements. This table is the single source of truth for the checker, the generator, the EML authoring canvas and the generated Workflow Designer.",
      directive: "%%step <nodeId> <stepType> <key>: <value> ...",
      propertyForm: "Space-separated `key: value` pairs. A value runs to the next `<key>:` token or the end of the line, so it may contain spaces. `fields` is JSON and must be the last key on the line.",
      variables: "Steps share a context: the triggering record's columns, plus every variable a previous step published. CreateEntity publishes the new row's id under `as`; Formula publishes under `target`. A later step reads one by naming it in `source` or `targetSource`. This is what lets a workflow reach a row it created earlier.",
      loopMembership: "`in: <loopId>` joins a step to a %%loop declared in the same section. It is read off every step type alike, before the type is consulted at all, so it belongs to no single contract below and is deliberately absent from their `optional` lists. A reader validating step properties must treat it as known for every type — see automations.loops and the %%loop directive.",
      types: [
        {
          name: "UpdateEntity",
          purpose: "Write one column on the triggering record, or on rows of a related entity.",
          required: ["field"],
          oneOf: [["source", "value"]],
          optional: ["entity", "targetField", "targetSource"],
          rowTargeting: "Defaults to the record that triggered the workflow. To reach another entity, set `entity` plus either `targetSource` (a context key holding the row id) or `targetField` (a foreign key column matched against the triggering row). Targeting another entity by `id` with no `targetSource` is refused rather than guessed.",
          example: "%%step D UpdateEntity entity: Capa targetSource: newCapaId field: effectiveness_metric source: resolutionDays"
        },
        {
          name: "CreateEntity",
          purpose: "Insert a row, optionally publishing its id for later steps.",
          required: ["entity", "fields"],
          optional: ["as"],
          notes: [
            "`fields` is a JSON object of column -> context key or literal. A string that names a context key is substituted; anything else is written as-is.",
            "`as` names the variable the new row's id is published under. It defaults to the table name without its bus_ prefix plus `Id`. Without it a workflow can insert a row and then never reach it again."
          ],
          example: '%%step C CreateEntity entity: Capa as: newCapaId fields: {"title":"capaTitle","status":"open"}'
        },
        {
          name: "DeleteEntity",
          purpose: "Delete the triggering record or rows of a related entity.",
          required: [],
          optional: ["entity", "targetField", "targetSource", "hard"],
          notes: [
            "Soft by default: stamps deleted_at, so the audit trail still points at a row that exists. `hard: true` removes it.",
            "Row targeting matches UpdateEntity exactly, including the refusal to touch another entity by `id` with no targetSource."
          ],
          example: "%%step F DeleteEntity entity: Capa targetSource: supersededCapaId"
        },
        {
          name: "Decision",
          purpose: "Evaluate a GoRules decision table and publish the matching row's output columns as variables the following steps read.",
          required: [],
          oneOf: [["decisionTable", "rule"]],
          optional: ["publish"],
          notes: [
            "`decisionTable` is the table itself as JSON — { hitPolicy, inputs, outputs, rules } — for logic only this process cares about. The generator wraps it in the input -> table -> output graph the engine evaluates, so a step never carries that plumbing.",
            "`rule` names a rule declared elsewhere in the model, for when the same table already governs the entity and the process should not fork a second copy of it.",
            "Outputs become variables under their `field` name. `publish` narrows that to a comma-separated allow-list when a table emits more than the process needs.",
            "A table that matches no row publishes nothing. That is how 'leave it alone' is expressed, not an error — later steps that read a variable it would have set skip themselves.",
            "Every row must set every output column: the engine silently discards a row that leaves one unset, and one such row stops the whole table matching."
          ],
          example: "%%step B Decision rule: ClassifySeverity publish: priority, slaDays"
        },
        {
          name: "Formula",
          purpose: "Publish a value into the workflow context for later steps.",
          required: ["target", "operation"],
          operations: {
            multiply: "target = Number(source) * Number(operand)",
            divide: "target = Number(source) / Number(operand)",
            add: "target = Number(source) + Number(operand)",
            subtract: "target = Number(source) - Number(operand)",
            set: "target = value, stored unchanged. The only way to pass text — a status, a title — to a later step.",
            copy: "target = context[source], carried across unchanged."
          },
          perOperation: {
            multiply: {
              required: ["source", "operand"]
            },
            divide: {
              required: ["source", "operand"]
            },
            add: {
              required: ["source", "operand"]
            },
            subtract: {
              required: ["source", "operand"]
            },
            set: {
              required: ["value"]
            },
            copy: {
              required: ["source"]
            }
          },
          example: "%%step B Formula target: resolutionDays source: baseDays operation: multiply operand: 7"
        },
        {
          name: "REST",
          purpose: "Call an external HTTP endpoint.",
          required: ["url"],
          optional: ["method", "bodyTemplate"],
          notes: ["`bodyTemplate` interpolates {{key}} from the workflow context."],
          example: "%%step E REST url: https://hooks.example.com/notify method: POST"
        },
        {
          name: "Agent",
          purpose: "Invoke an AI agent. Placeholder pending Mastra integration — the executor logs and skips.",
          required: ["agentId"],
          shipped: false,
          example: "%%step G Agent agentId: deviation-triage-v1"
        }
      ]
    }
  },
  automations: {
    description: "The automation dialect: the form a workflow takes when it is authored in the automation builder, which is the shipped way to build workflows and business rules in both the generator and generated applications. An automation is one sentence — a trigger, a flat list of conditions that must all pass, and an ordered list of steps. There is deliberately no graph: the executor runs steps in order and stops at the first failure, so a list is the honest representation. It is a constrained profile of `workflowConstructs.stepNodes`, not a second language: it serialises to the same mermaid flowchart with the same %%step directives, so an automation opens in a Mermaid renderer and runs through the existing executor.",
    relationshipToSaga: "The saga form (`%%workflow <Name> entity: <E> kind: saga`, positional `%%step <node> <StepType> <k>: <v>`) is the older, more general surface. The automation form differs in three ways: the workflow is named with `%%workflow name:` and takes its entity from `%%hook`; the step type is a `type:` key rather than a positional token; and conditions are expressed as `%%guard` lines instead of being drawn as decision nodes. Both compile to the same executable steps.",
    interoperability: "Both dialects are read by both sides. The builder's parser reads the saga form (mapping `fields`->`values`, a Formula's `target`/`source`/`operand` onto `as`/`left`/`right`, and `decisionTable` onto an inline table), and the generator reads the automation form (translating back, and unwrapping `{{name}}` references into the bare `source:`/`targetSource:` a saga uses). So a model authored by hand opens in the builder, and an automation built in a running application compiles through the generator. Downstream of that translation only saga vocabulary exists — STEP_CONTRACTS, the checker and the BPMN emitter need no knowledge that a second dialect exists.",
    shipped: true,
    writer: "packages/web/src/lib/automation/model.ts serializeAutomation()",
    reader: "packages/web/src/lib/automation/model.ts parseAutomation()",
    envelope: {
      description: "Every serialised automation opens with these lines, in this order.",
      lines: [
        "flowchart TD",
        "%%meta kind: workflow",
        "%%workflow name: <name>",
        "%%hook <hookName> on <Entity>"
      ],
      note: "The entity is carried by %%hook, not by %%workflow. A reader that cannot find %%hook has no entity binding and falls back to the caller-supplied default."
    },
    triggers: {
      description: "The events an automation can start from. These are the entity lifecycle hooks the generated services already fire, so a trigger is not a new concept — it is the hook, named the way someone describing their business would name it. `%%hook` carries the hook name; the builder shows the event name.",
      directive: "%%hook <hookName> on <Entity>",
      note: "This is the two-token form of %%hook — event and entity, with no handler name. The three-token handler form (`%%hook beforeCreate hashPassword on User`) is the hook-binding directive documented under `hooks` and is a different construct.",
      events: [
        {
          event: "created",
          hook: "afterCreate",
          phase: "after",
          blocking: false,
          purpose: "Runs after the record is written. The record already exists."
        },
        {
          event: "beforeCreated",
          hook: "beforeCreate",
          phase: "before",
          blocking: true,
          purpose: "Runs before the record is written, so it can still block the write."
        },
        {
          event: "updated",
          hook: "afterUpdate",
          phase: "after",
          blocking: false,
          purpose: "Runs after the change is saved."
        },
        {
          event: "beforeUpdated",
          hook: "beforeUpdate",
          phase: "before",
          blocking: true,
          purpose: "Runs before the change is saved, so it can still block it."
        },
        {
          event: "deleted",
          hook: "afterDelete",
          phase: "after",
          blocking: false,
          purpose: "Runs after the record is removed."
        },
        {
          event: "beforeDeleted",
          hook: "beforeDelete",
          phase: "before",
          blocking: true,
          purpose: "Runs before the record is removed, so it can still block it."
        }
      ]
    },
    conditions: {
      description: "A flat list of checks that must ALL pass for the steps to run. There is no OR and no nesting: an author who needs alternatives writes a second automation, which stays readable where a boolean tree does not. Zero conditions means the automation always runs.",
      directive: "%%guard <field> <operator> <jsonValue>",
      valueEncoding: 'JSON.stringify — so a string value is quoted (`"open"`) and a number is bare (`3`). Operators of arity 0 still emit a value token, which readers ignore.',
      resolvedConflict: {
        was: "%%guard once meant both an automation condition and an RBAC role restriction — one keyword, two unrelated meanings.",
        resolution: "The RBAC sense was renamed to %%rbac. That side was renamed rather than the automation side because it had no shipped parser and no stored data: it existed only in this definition and the spec, so the rename costs nothing, while renaming the condition form would have meant rewriting every stored automation.",
        compatibility: 'A model written before the rename may still carry `%%guard role:... on <Entity>.<op>`. The automation reader detects that shape and skips it instead of parsing it as a check on a field called "role:admin" with an operator of "on" — a condition that can never pass, which would silently disable the automation.'
      },
      operators: [
        {
          id: "eq",
          label: "is",
          arity: 1
        },
        {
          id: "neq",
          label: "is not",
          arity: 1
        },
        {
          id: "gt",
          label: "is greater than",
          arity: 1
        },
        {
          id: "gte",
          label: "is greater than or equal to",
          arity: 1
        },
        {
          id: "lt",
          label: "is less than",
          arity: 1
        },
        {
          id: "lte",
          label: "is less than or equal to",
          arity: 1
        },
        {
          id: "contains",
          label: "contains",
          arity: 1
        },
        {
          id: "startsWith",
          label: "starts with",
          arity: 1
        },
        {
          id: "isEmpty",
          label: "is empty",
          arity: 0
        },
        {
          id: "isNotEmpty",
          label: "is not empty",
          arity: 0
        },
        {
          id: "changed",
          label: "changed",
          arity: 0
        }
      ]
    },
    steps: {
      description: "An ordered list. Each step gets a generated node id (`s1`, `s2`, …) and one `type:` line, followed by one line per property. A step may name its result with `as:`, which publishes a reference later steps can read.",
      directives: [
        "%%step <nodeId> type: <StepType> [as: <resultName>]",
        "%%step <nodeId> <propertyKey>: <value>",
        "%%step <nodeId> table: <decisionTableJson>"
      ],
      types: [
        {
          type: "Decision",
          purpose: "Evaluate a rule table and publish its outputs.",
          properties: ["ruleTable", "inputs"],
          example: `%%step s1 type: Decision as: tier
%%step s1 ruleTable: Assay tier`
        },
        {
          type: "CreateEntity",
          purpose: "Create a record on another entity.",
          properties: ["entity", "values"],
          example: `%%step s2 type: CreateEntity as: newId
%%step s2 entity: ChemicalInventory`
        },
        {
          type: "UpdateEntity",
          purpose: "Write a field, by default on the triggering record.",
          properties: ["entity", "field", "value"],
          example: `%%step s3 type: UpdateEntity
%%step s3 field: status
%%step s3 value: {{tier}}`
        },
        {
          type: "DeleteEntity",
          purpose: "Remove a record.",
          properties: ["entity", "target"],
          example: `%%step s4 type: DeleteEntity
%%step s4 entity: Vendor`
        },
        {
          type: "Formula",
          purpose: "Compute a value from two operands and publish it.",
          properties: ["operation", "left", "right"],
          example: `%%step s5 type: Formula as: total
%%step s5 operation: add
%%step s5 left: {{order.subtotal}}
%%step s5 right: 9`
        },
        {
          type: "REST",
          purpose: "Call an external service.",
          properties: ["method", "url", "body"],
          example: `%%step s6 type: REST
%%step s6 method: POST
%%step s6 url: https://lims.example.com/hook`
        }
      ]
    },
    references: {
      description: "What a step can read: fields of the triggering record, and the published results of every step above it. A reference is written in double braces and resolved positionally — a step can only see what precedes it, which is what makes the ladder safe to reorder.",
      form: "{{<name>}}",
      sources: [
        "{{<entity>.<field>}} — a field of the triggering record, entity name lowercased",
        "{{<resultName>}} — the result of an earlier step, named by its `as:`"
      ]
    },
    loops: {
      description: "Repeat while a rule holds. `%%loop <loopId> while: <field> <operator> <value>` declares one, and a step joins it with `%%step <nodeId> in: <loopId>`. The member steps run in order and repeat for as long as the check passes; the loop ends the first time it fails. The check is re-evaluated before every pass against the record as it stands then — a step inside the loop changes the record, and that change is what ends the loop.",
      directives: [
        "%%loop <loopId> while: <field> <operator> <value> max: <n>",
        "%%step <nodeId> in: <loopId>"
      ],
      operators: "The same eleven as automations.conditions — one vocabulary for every check in the language.",
      safety: {
        required: true,
        form: "max: <n>",
        note: "Every loop must declare its own ceiling; there is no default and no engine-wide constant. A while-loop is genuinely unbounded, and an automation runs inside the write that triggered it, so a check that never fails holds a database transaction open until something times out. After `max` passes the loop is abandoned and the run is marked FAILED with the loop and the limit named. This is a backstop, not a second way to spell the count: reaching it means the automation is wrong, so it is reported rather than finishing quietly as though the loop had ended on its own.",
        whyPerLoop: "How many passes is obviously too many is a property of the work, not of the engine. A retry that should give up after 5 and a reconciliation that legitimately runs 800 cannot share one number without the ceiling being meaningless for one of them.",
        minimum: 1,
        maximum: "none — the author owns the number",
        missing: "A loop with no `max` is refused by the builder and warned about by the compiler. An executor meeting one anyway runs a single pass and gives up, because the safe direction for a loop nobody bounded is not to run it."
      },
      staticCheck: "A loop whose check reads a field that no member step writes is refused when the model is compiled: it would read the same every pass, so it either never runs or runs until the safety limit cuts it off. The check is deliberately shallow — only UpdateEntity writes are matched by field name, and every other step type is treated as able to change anything, so it reports only the case it is certain about.",
      nesting: "Not supported. A loop may not contain another loop; a step names at most one `in:`. Flattening nested repeats is what makes the ladder readable and the cost predictable.",
      references: "Steps inside a loop see the same values as steps outside it, plus `{{<loopId>.iteration}}` — the 1-based pass number. A value published by a step inside the loop is overwritten on each pass, so after the loop it holds what the last pass produced.",
      drawnAs: "A Mermaid `subgraph <loopId>[Repeat while <check>]` wrapping the member nodes, so the repetition is visible in any renderer rather than living only in the directives."
    },
    nodes: {
      description: "The drawn flowchart carries no semantics — it exists so the document renders as a diagram. Every node is regenerated from the directives on write, and readers take meaning only from the %% lines.",
      start: "start([<Entity> <trigger label>])",
      guard: "guard{<conditions joined by ' and '}}",
      step: "s<n>[<step summary>]",
      loop: "subgraph <loopId>[Repeat <n> times] … end",
      done: "done([Done])"
    }
  },
  directives: {
    description: "Reserved %% directive comments. All are renderer-safe (ignored by Mermaid) and interpreted by the generator. %%hook, %%step, %%action, %%workflow and %%guard are parsed by the shipped compilers; the remainder are the EML extension surface, documented here as the authoritative language contract.",
    reserved: [
      {
        keyword: "%%meta",
        form: "%%meta <key>: <value>",
        status: "compiled",
        consumedBy: [
          "language/composer.ts (section classification and round-trip)",
          "packages/generator/src/eml (section extraction via composer)"
        ],
        purpose: "Document/section metadata: name, kind (erd|rules|workflow), version, entity binding, description (application summary seeded into sys_system.APP_DESCRIPTION and the generated manual), stack.",
        examples: [
          "%%meta name: CRM Core",
          "%%meta kind: rules",
          "%%meta entity: Order",
          "%%meta version: 1.0.0",
          "%%meta description: This application manages customer relationships, sales pipelines, and support tickets for mid-market B2B companies."
        ]
      },
      {
        keyword: "%%hook",
        form: "%%hook <type> <handler> on <Entity>[<params>]   |   %%hook <type> on <Entity>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/hooks/index.ts (handler form -> lifecycle handler modules)",
          "packages/web/src/lib/automation/model.ts (two-token form -> automation trigger)"
        ],
        purpose: "Bind an entity lifecycle event. The three-token form names a handler to run (SHIPPED, parsed by hook-parser.ts). The two-token form omits the handler and is the automation trigger: it says which event starts the automation and on which entity, with the steps carried by %%step (SHIPPED, parsed by automation/model.ts).",
        examples: [
          "%%hook beforeCreate hashPassword on User",
          "%%hook afterCreate on DeviationReport"
        ]
      },
      {
        keyword: "%%step",
        form: "%%step <nodeId> <stepType> <key>: <value> ...   |   %%step <nodeId> type: <stepType> [as: <name>]",
        status: "compiled",
        consumedBy: ["packages/generator/src/workflows/steps.ts"],
        purpose: "Bind a flowchart node in a `kind: saga` workflow to an executable step. `nodeId` is the node's id in the flowchart; `stepType` is one of workflowConstructs.stepNodes.types. Compiles to a bpmn:serviceTask (SHIPPED, parsed by packages/generator/src/workflows/index.ts).",
        examples: [
          "%%step B Formula target: baseDays operation: set value: 3",
          '%%step C CreateEntity entity: Capa as: newCapaId fields: {"title":"capaTitle","status":"open"}',
          "%%step D UpdateEntity field: status value: escalated",
          "%%step F DeleteEntity entity: Capa targetSource: supersededCapaId"
        ]
      },
      {
        keyword: "%%action",
        form: "%%action <name> <actionType> when: <expr> <key>: <value> ...",
        status: "compiled",
        consumedBy: ["packages/generator/src/rules/index.ts"],
        purpose: "Declare a side-effecting rule action inside a `%%rule` section. A section carrying %%action directives compiles to a GoRules decision table — one row per directive — instead of a node graph, which is the shape the rules engine reads actions from (SHIPPED, parsed by packages/generator/src/rules/index.ts).",
        examples: [
          '%%action escalate trigger-workflow when: severity == "critical" workflow: CriticalDeviationEscalation',
          "%%action requireCause validation-error when: root_cause == null message: A root cause is required"
        ]
      },
      {
        keyword: "%%entity",
        form: "%%entity <Name> <key>: <value>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/parsers/mermaid.parser.ts (help:/description:, icon: and parent: are compiled; prefix:, softDelete:, label: and audited: are validated only)",
          "language/checker.ts (EML160, EML161, EML162)"
        ],
        purpose: "Attach entity-level metadata not expressible in the ERD block: the sentence that explains the entity to whoever opens its screen, the icon that represents it, the parent it is a line item of, plus table prefix (bus/sys), soft delete, label, audited.",
        examples: [
          "%%entity Account help: A company you sell to. One account holds many contacts and every deal you run with them.",
          "%%entity Patient icon: stethoscope",
          "%%entity Order audited: true",
          "%%entity Account prefix: bus",
          "%%entity Session softDelete: false"
        ],
        iconNaming: "`icon:` is a lucide icon name (https://lucide.dev/icons). PascalCase, kebab-case and snake_case all resolve to the same icon - LayoutGrid, layout-grid and layout_grid are one. A name lucide does not have is NOT a diagnostic (the checker does not carry lucide's catalogue) and renders a placeholder instead: `icon: flask` is the common trap, because lucide has `flask-conical` and no `flask`. Compiled to sys_table.icon, which is what the entity's dashboard card, its window heading and the navigation all draw. An administrator can override it afterwards in Table and Column, including by uploading an image - the same column holds both. In the browser (--standalone) stack the value is carried into model.json and served by /model, but that interface draws a text glyph and does not render it."
      },
      {
        keyword: "%%field",
        form: "%%field <Entity>.<attr> <key>: <value>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/parsers/mermaid.parser.ts (the `enum:` and `help:` keys; the other keys are reserved)"
        ],
        purpose: "Extended field metadata: enum reference and help text, both compiled; ui control, default value, min/max and format are reserved.",
        examples: [
          "%%field Order.status enum: OrderStatus",
          "%%field Contact.account_id help: The company this person works for. Leave empty for a personal contact.",
          "%%field Product.price min: 0",
          "%%field User.email unique: true"
        ]
      },
      {
        keyword: "%%enum",
        form: "%%enum <Name>: <value1>, <value2>, ...",
        status: "compiled",
        consumedBy: ["packages/generator/src/parsers/mermaid.parser.ts"],
        purpose: "Declare a named enumeration reusable by fields and by state workflows.",
        examples: ["%%enum OrderStatus: draft, submitted, approved, shipped, cancelled"]
      },
      {
        keyword: "%%category",
        form: "%%category name: <Name>; code: <id>; description: <text>; icon: <LucideIcon>; color: <#hex>; seq: <n>; default: true; entities: <A>, <B>",
        dashboardScope: "A category block appears on the dashboard only when the reader may read at least one entity in it: the entity list is filtered by `%%rbac ... .read` and line items are excluded, because a child is reached through its parent. The Application Dictionary block beside the categories is the admin windows the reader is granted through sys_access, so it differs by role too.",
        iconNaming: "A lucide icon name (https://lucide.dev/icons). PascalCase, kebab-case and snake_case all resolve to the same icon - LayoutGrid, layout-grid and layout_grid are one. A name lucide does not have is NOT a diagnostic (the checker does not carry lucide's catalogue) and renders a placeholder instead: `icon: flask` is the common trap, because lucide has `flask-conical` and no `flask`. Compiled to sys_category.icon and drawn beside the category heading on the dashboard.",
        status: "compiled",
        consumedBy: ["packages/generator/src/parsers/category.parser.ts"],
        purpose: 'Group business entities into a named Application Dictionary category. The dashboard renders one block per category, ordered by name; the admin dictionary maintains them. Only `name` is required; the rest are `;`-separated and may appear in any order. `code` is a stable short identifier, slugified from `name` when omitted — it is the dictionary row\'s key, so setting it explicitly keeps that key stable across a rename. A directive may span several lines by ending each continued line with `\\`. A model that declares none gets a single "General" default holding every entity.',
        examples: [
          "%%category name: Compound Registry; description: Structures and aliases; icon: FlaskConical; color: #6366f1; entities: Compound, CompoundAlias",
          "%%category name: People and Teams; default: true; entities: User, Team"
        ]
      },
      {
        keyword: "%%index",
        form: "%%index <Entity>(<attr>[, <attr>...]) [unique]",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/parsers/mermaid.parser.ts -> entity.indexes -> templates/common/migrations/bus-tables.migration.ts.hbs"
        ],
        purpose: "Declare a database index over one or more attributes.",
        examples: ["%%index Contact(email) unique", "%%index Order(company_id, status)"]
      },
      {
        keyword: "%%rule",
        form: "%%rule <name> on <Entity> event: <lifecycle> priority: <n>",
        status: "validated",
        consumedBy: ["language/checker.ts (rule/workflow cross-reference)"],
        purpose: "Bind a business-rule decision flow (a rules section) to an entity and lifecycle event.",
        examples: ["%%rule pricing on Order event: beforeCreate priority: 10"]
      },
      {
        keyword: "%%guard",
        form: "%%guard <field> <operator> <jsonValue>",
        status: "compiled",
        consumedBy: ["packages/web/src/lib/automation/model.ts"],
        purpose: `Automation condition — a check that must pass for an automation's steps to run (SHIPPED, parsed by automation/model.ts, and the form all stored automations use). This keyword once also meant an RBAC role restriction; that sense is now %%rbac. A reader encountering the old RBAC shape here skips it rather than reading it as a condition on a field called "role:admin".`,
        examples: ['%%guard status eq "open"', "%%guard order.total gt 1000"]
      },
      {
        keyword: "%%loop",
        form: "%%loop <loopId> while: <field> <operator> <value> max: <n>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/workflows/steps.ts",
          "packages/web/src/lib/automation/model.ts"
        ],
        purpose: "Declare a repeat-while-a-rule-holds loop inside an automation (SHIPPED, parsed by automation/model.ts and the generator's saga compiler). Steps join it with `%%step <nodeId> in: <loopId>` and repeat in order for as long as the check passes, ending the first time it fails. The check is re-read before every pass, so a step inside the loop is what ends it. Bounded by the `max:` the author must declare; loops do not nest. See automations.loops.",
        examples: ['%%loop L1 while: status eq "pending" max: 20', "%%step s2 in: L1"]
      },
      {
        keyword: "%%rbac",
        form: "%%rbac <roleExpr> on <Entity>.<op>   where <op> is a CRUD operation (create|read|update|delete|*) or a transition event in <Entity>'s state machine",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/rbac/index.ts (compiles both forms)",
          "packages/generator/src/rbac/roles.ts (derives the roles, one seeded account each, and per-entity visibility)",
          "seeded into sys_operation_access / sys_transition_access",
          "enforced by the generated EntityAccessGuard on /bus CRUD",
          "app-and-report-with-ai-tanstack: common/build/reporting-pack.ts -> one reporting role per declared role, scoped to the tables that role may read"
        ],
        purpose: "Restrict a CRUD operation or a state transition to named roles. It restricts rather than grants: a target no directive mentions is open to any authenticated caller, so a model declaring no %%rbac generates what it always did. A target with one or more directives requires the union of the roles they name. A master role bypasses. That bypass is over access — who may do a thing — and not over the shape of the model: a state machine's topology is enforced for the master role too, because an edge the diagram never drew is a move that does not exist rather than a permission anyone is missing (see workflowConstructs.stateForm.enforcement). Role names are matched case-insensitively, because seeded roles are title-cased (Manager) and directives are written lower-case (role:manager) - an exact match would make such a rule unsatisfiable, locking out exactly the people it was written to admit. Spelled %%guard until that keyword was needed unambiguously for automation conditions.",
        examples: [
          "%%rbac role:admin on Order.delete",
          "%%rbac role:sales|manager on Deal.update",
          "%%rbac role:admin on Customer.*",
          "%%rbac role:sales_manager on Quote.approve",
          "%%rbac role:sales_rep|sales_manager|support_agent on Account.read"
        ],
        notes: {
          operations: "create | read | update | delete, plus * for all four. Aliases are accepted (insert/add, view/select/list, edit/write/modify, remove/destroy).",
          transitions: "A name that is not a CRUD operation is resolved against the entity's stateDiagram-v2 transitions. There is no named-transition endpoint in a generated application - moving a record along an edge is a status update - so the rule is stored as the (from_state, to_state) pair it covers and the guard recognises the move by the states the write crosses. Both ends are kept because one event can sit on several edges and two events can reach the same state. This directive decides *who* may cross an edge; whether the edge exists at all is decided by the state diagram itself and enforced separately, so an edge no %%rbac names is open to any authenticated caller but an edge the diagram omits is refused to everyone.",
          notSysAccess: "A restriction on any operation other than read deliberately does not write sys_access. That is a grant table feeding sys_refresh_dictionary_scope(), where the first row added narrows a window to one role; a restriction on deleting must not become a restriction on looking. read is the one exception, and it is the exception on purpose - see functionalRoles.",
          functionalRoles: "read is the operation that decides which functional role an entity belongs to, and the only one that changes what a role sees. An entity a role may not read is absent from that role's navigation entirely - no menu entry, no dashboard card, no lookup - because a menu full of entries that answer 403 is a worse application than a shorter one. A model is expected to name every entity on at least one `%%rbac ... .read` directive, so that every entity belongs to somebody. Declaring none leaves every entity visible to every signed-in caller, which is what every model did before this rule existed.",
          seededAccounts: "Every role a directive names is created, and one account is seeded holding it, beside the administrator who bypasses everything and a role-less User. An application whose only account is the administrator cannot demonstrate its own access control, because the administrator is exempt from all of it. Both stacks derive the same list from rbac/roles.ts, and both sign-in screens print it with the number of entities each role can see.",
          reportingRoles: "Deployed beside the Enterprise Reporting platform (app-and-report-with-ai-tanstack, ./start.sh), the same directive also shapes that platform's roles: one reporting role per declared role, permitted to read exactly the bus_ tables the role's `read` rules admit. It is a mirror, not a shared system. The two products have separate databases, separate user tables and separate sign-in screens, and a role name means different things on each side: in the application it decides what a user may do to a record, in the reporting platform which tables their queries may read. The accounts differ deliberately - sales.manager@<app>.example.com against sales.manager@<app>.reports.example.com - so neither is mistaken for the other, and the front door at / lists both pairs. Only `read` rules narrow a reporting role; create, update and delete restrictions mean nothing to a reader who cannot write through that product at all."
        }
      },
      {
        keyword: "%%trigger",
        form: "%%trigger <source> -> <handler> on <Entity>",
        status: "validated",
        consumedBy: ["language/checker.ts (EML230-EML233)"],
        purpose: "Declare an event/schedule source that starts a workflow (webhook, cron, message).",
        examples: [
          "%%trigger cron:0 0 * * * -> expireQuotes on Quote",
          "%%trigger webhook:payment -> markPaid on Order"
        ]
      },
      {
        keyword: "%%workflow",
        form: "%%workflow <name> entity: <Entity> kind: <hook|state|saga>   |   %%workflow name: <name>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/workflows/index.ts (saga + state forms)",
          "packages/web/src/lib/automation/model.ts (automation form)"
        ],
        purpose: "Name and classify a workflow section. The positional form binds the entity itself. The `name:` form is what the automation builder writes (SHIPPED): it carries only the name and takes its entity binding from the accompanying %%hook line.",
        examples: [
          "%%workflow OrderFulfillment entity: Order kind: state",
          "%%workflow name: Escalate critical deviations"
        ]
      },
      {
        keyword: "%%report",
        form: "%%report <name> title: <Title> [entity: <Entity>] [chart: bar|line|pie|area x: <col> y: <col>] [help: <why it is asked>] sql: <query>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/reports/index.ts -> sys_report (NestJS) and model.json reports (browser)",
          "language/cli/src/parser.ts -> model.reports",
          "language/checker.ts (shape only: EML290-EML296)"
        ],
        purpose: "Declare a question the application's users actually ask, as the SQL that answers it. The reporting pack already derives a baseline from structure alone - a register per entity, a breakdown per %%enum-bound column, a lifecycle per state machine, children per oneToMany - and that baseline describes the shape of the data and nothing about the business running on it. Nothing in an ERD says that a dispatcher's first question every morning is which jobs have no engineer assigned. This directive is where that knowledge is written down, so it travels with the model rather than being rebuilt by hand in the reporting tool after every regeneration.",
        examples: [
          "%%report unassigned-jobs title: Jobs with no engineer help: The dispatcher's first question every morning. sql: SELECT reference, scheduled_for FROM bus_job WHERE engineer_id IS NULL AND status = 'scheduled' AND deleted_at IS NULL ORDER BY scheduled_for",
          "%%report pipeline-by-owner title: Pipeline by owner entity: Opportunity chart: bar x: owner y: total help: What each rep is carrying, for the weekly review. sql: SELECT u.first_name AS owner, SUM(o.amount) AS total FROM bus_opportunity o JOIN bus_user u ON u.id = o.owner_id WHERE o.deleted_at IS NULL GROUP BY 1 ORDER BY total DESC"
        ],
        notes: {
          sqlIsLast: "`sql:` takes the rest of the line, because a query contains spaces and colons and would otherwise be shredded by the key scan. Every other key is read from the head, ahead of it.",
          readOnly: "A report may only read, and this is refused three times: by the checker at authoring time (EML293), by the compiler before the query can reach a seed file or model.json, and by each runtime before it executes - because sys_report is an ordinary table and model.json an ordinary file, so neither reader trusts what it is handed. A single trailing semicolon is allowed; a second statement behind it is not. Anything that writes belongs in a rule or a hook.",
          foreignKeysAreUuid: "A foreign key and a primary key are both UUID, in both stacks, so a join is written plainly: ON c.account_id = p.id. Do not cast. `::text` was needed while the browser stack typed a foreign key as VARCHAR; it does not any more, and PostgreSQL has no implicit cast back, so a cast that is no longer needed is now the thing that breaks the query.",
          chartNeedsAxes: "`chart:` without both `x:` and `y:` is an error (EML294) rather than a silent fall back to a table: a chart that cannot say what it plots renders empty, which reads as no data rather than as a missing declaration.",
          namesAreKeys: "The name is the pack key, so a duplicate silently replaces the earlier report. Declared twice is an error (EML292).",
          againstWhichSchema: "The query runs against the *generated application's* database, so it names `bus_` tables. It is not checked against a live schema at author time - the checker has no database - but `check-reporting-pack.ts in the orchestrator` executes every query in the pack against a real generated schema in CI.",
          whereItIsCompiled: "Compiled twice, by two readers, and neither replaces the other. Here, packages/generator/src/reports/index.ts puts each report into the generated application itself: a sys_report row served at /sys/reports and shown under Admin > Analysis in the NestJS stack, and a model.json entry served at /api/reports and shown under Reports in the browser application. Separately, businessappwithai/app-and-report-with-ai-tanstack compiles the same directive with common/build/reporting-pack.ts into a saved query, a report definition and, where chart: is set, a chart, seeded into the Enterprise Reporting platform ahead of the derived baseline. That platform is composed beside a deployed application by docker-compose; it is not in the browser application and not in the downloadable zip."
        }
      }
    ],
    statusVocabulary: {
      compiled: "A shipped compiler reads this directive and it changes the generated application. `consumedBy` names the file that reads it.",
      validated: "No compiler reads it, but `language/checker.ts` enforces its syntax and cross-references, so a malformed one fails validation rather than being silently ignored.",
      reserved: "Documented and renderer-safe, with no reader. Writing one is legal and inert; the keyword is held so a later meaning cannot collide with a plain comment."
    }
  },
  grammar: {
    notation: "EBNF-like; see language/grammar/appwithai.ebnf for the full grammar.",
    topLevel: "document ::= ( comment | directive | erdSection | ruleSection | workflowSection | blankLine )*",
    erdSection: "erdSection ::= 'erDiagram' NEWLINE ( entityBlock | relationship | comment )*",
    entityBlock: "entityBlock ::= IDENT '{' NEWLINE attribute* '}' NEWLINE",
    attribute: "attribute ::= TYPE ['(' NUMBER ')'] IDENT modifier* [ STRING ] NEWLINE",
    relationship: "relationship ::= IDENT cardinality IDENT [ ':' STRING ] NEWLINE",
    ruleSection: "ruleSection ::= ('flowchart'|'graph') direction NEWLINE ( node | edge | actionDirective | comment )*",
    workflowSection: "workflowSection ::= (('flowchart'|'graph') direction | 'stateDiagram-v2') NEWLINE ( node | edge | transition | hookDirective | stepDirective | comment )*",
    stepDirective: "stepDirective ::= '%%step' WS IDENT WS stepType ( WS IDENT ':' WS value )* NEWLINE",
    actionDirective: "actionDirective ::= '%%action' WS IDENT WS actionType WS 'when:' WS expr ( WS IDENT ':' WS value )* NEWLINE"
  },
  generatorContract: {
    description: "How each section feeds the generator pipeline.",
    pipeline: [
      "1. ERD section -> MermaidParser -> Entity[] + Relationship[] -> migrations, DTOs, services, controllers, forms, tables. The same pass reads %%index into entity.indexes and %%enum / %%field enum: into bound enums.",
      "2. %%category directives -> category.parser -> resolveCategories -> Application Dictionary groups on the generated dashboard. A model declaring none gets a single 'General' category holding every entity.",
      "3. Rules section -> flowchart-parser -> jdm-converter -> GoRules JDM graph -> seeded into sys_rule_definitions and evaluated by the rules engine.",
      "4. Rules section carrying %%action directives -> compileRules -> a GoRules decision table whose rows carry action/message/ruleId/workflowName outputs, instead of a node graph. This is how a model-declared rule reaches a model-declared saga: the rule's `when` expression decides, and its trigger-workflow action names the workflow.",
      "5. Workflow section, hook form -> compileHooks -> per-entity handler modules under src/modules/hooks/handlers plus a registry the bus service calls around every CRUD operation.",
      "6. Workflow section, state form -> compileWorkflows -> BPMN seeded into sys_workflow_definitions; the trigger-workflow rules resolve it by name and the run puts a new record into the state machine's starting state. The same pass writes every edge the diagram draws into sys_workflow_transitions, which EntityAccessGuard reads to refuse a status write the model never allowed for, and which GET /api/workflows/transitions exposes so a screen can offer only the moves that exist.",
      "7. Workflow section, saga form -> compileSagaWorkflows -> one bpmn:serviceTask per %%step, ordered by the flowchart edges, seeded into sys_workflow_definitions with source 'model'. A definition declared in the model is owned by the model: the generated Workflow Designer shows it read-only, and regeneration rewrites it. Definitions authored in the app carry source 'designer' and are never touched by regeneration.",
      "8. The whole document -> language/rag.ts -> retrieval chunks (one per entity, rule, workflow and spec section) -> the pgvector model_context index the assistant searches.",
      "9. %%rbac directives -> compileRbac -> per-operation rules in sys_operation_access and per-transition rules in sys_transition_access, enforced by EntityAccessGuard on the generated /bus CRUD routes. Restrictive, not granting: a target no directive names stays open.",
      "10. ERD section -> nestjs-backend.generator -> one default AnkaReport layout per entity seeded into sys_report_designs. The layout renders every non-audit, non-PK field as a two-column (label | value) report. Administrators can customise layouts at Admin → Report Designs. Records get a Print button on their detail view if a design exists for their table.",
      "11. %%enum and %%workflow kind: state -> the generated test suite's harness/model.ts, which carries the declared values and edges into the suites as data. This is the one consumer that reads the model rather than the dictionary compiled from it, and the distinction is the point: a suite that asserts a running application against the dictionary the same generator wrote proves only that the application is self-consistent, and passes just as happily when a value or an edge was dropped on the way. Asserting against the model's own word is what makes a dropped %%enum value or a missing state-machine edge fail a test rather than ship. Read by suite 02c (references) and suite 06b (state machines)."
    ],
    referenceFiles: {
      pipeline: "packages/generator/src/pipeline/generate-application.ts",
      erdParser: "packages/generator/src/parsers/mermaid.parser.ts",
      categoryParser: "packages/generator/src/parsers/category.parser.ts",
      flowchartParser: "packages/generator/src/rules/flowchart-parser.ts",
      jdmConverter: "packages/generator/src/rules/jdm-converter.ts",
      ruleCompiler: "packages/generator/src/rules/index.ts",
      hookCompiler: "packages/generator/src/hooks/index.ts",
      workflowCompiler: "packages/generator/src/workflows/index.ts",
      stepCompiler: "packages/generator/src/workflows/steps.ts",
      composer: "language/composer.ts",
      chunker: "language/rag.ts",
      checker: "language/checker.ts",
      orchestrator: "packages/generator/src/generators/orchestrator.ts",
      rbacCompiler: "packages/generator/src/rbac/index.ts",
      testHarnessModel: "packages/generator/templates/tanstack-start-nestjs/tests/harness/model.ts.hbs"
    },
    authoringSurface: {
      description: "The web app keeps its own parsers for the editors, which run in the browser and cannot import the generator. They read the same syntax, but they do not decide what is generated - when the two disagree, the generator's copy is the language and the web copy is the bug.",
      flowchartParser: "packages/web/src/lib/mermaid-flowchart-parser.ts",
      jdmConverter: "packages/web/src/lib/jdm-converter.ts",
      hookParser: "packages/web/src/lib/workflow/hook-parser.ts",
      automationModel: "packages/web/src/lib/automation/model.ts",
      ruleFlow: "packages/web/src/lib/eml/rule-flow.ts",
      workflowFlow: "packages/web/src/lib/eml/workflow-flow.ts"
    }
  },
  conformance: {
    levels: {
      core: "erDiagram entities, attributes with PK/FK/UK/OPTIONAL/NULL/UNIQUE, and all 8 relationship cardinalities. Plus the directives the same parse pass reads: %%index (real DDL indexes), %%enum and %%field enum: (bound enums), and %%category (dashboard grouping). Fully compiled.",
      rules: "flowchart decision flows converted to JDM by shape semantics, and %%action directives compiled to a GoRules decision table. Fully compiled.",
      workflows: "%%hook directives in both forms (all 13 hook types), stateDiagram-v2 state machines, and %%workflow kind: saga with its %%step and %%loop directives. All three forms are compiled and seeded; the automation dialect is the same saga machinery authored through the builder.",
      help: "%%field <Entity>.<column> help: and %%entity <Name> help: (or description:). Both are compiled: the parser hangs the text on the attribute and the entity, the dictionary generator writes it to sys_column.description and sys_table.description, and the generated application shows it under the field and beside the table. It has a second consumer: packages/generator/src/manual/index.ts renders manual.html from the same parsed model, where this text is the entire 'what it is for' column — a field with no help prints a dash there. Write help on every entity and every column, and write domain knowledge rather than the name again: EML151, EML152 and EML153 report the three ways a model fails to. See applicationDictionary.helpText. Fully compiled.",
      validated: "%%rule and %%trigger, and the %%entity keys other than help:/description:. No compiler reads these yet, but language/checker.ts enforces their syntax and cross-references, so a malformed one fails validation instead of being silently dropped.",
      reserved: "The %%field keys other than enum: and help:. Renderer-safe and documented, with no reader. Writing one is legal and inert.",
      access: "%%rbac, in both its CRUD and state-transition forms. Compiled to sys_operation_access / sys_transition_access and enforced by the generated EntityAccessGuard."
    },
    validationRules: [
      "Every entity name must match ^[a-zA-Z][a-zA-Z0-9_]*$ and be unique within the document.",
      "Every relationship endpoint should reference a declared entity.",
      "A hook directive's entity should reference a declared entity; its type must be one of the 13 hook types.",
      "A rules flow must have at least one input (stadium/start) and one output (stadium/end).",
      "Enum references in %%field must resolve to a declared %%enum.",
      "A %%step's nodeId must name a node that exists in the flowchart it annotates.",
      "A %%step's stepType must be one of workflowConstructs.stepNodes.types.",
      "A %%loop's loopId must be referenced by at least one %%step in: directive, and loops do not nest.",
      "At most one %%category in a document may declare default: true.",
      "A trigger-workflow action must name a workflow the document declares, or a workflow that already exists in the target application.",
      "A %%rbac operation must be a CRUD operation (create/read/update/delete/*) or a transition event declared in the entity's state machine."
    ],
    note: "Levels describe what the shipped generator does, not an aspiration. A directive's own `status` field in `directives.reserved` is authoritative for that directive; these levels group them. When a compiler is added for a reserved directive, its status and this list move together."
  },
  diagnostics: {
    description: "The checker (language/checker.ts) validates a document against this definition and writes a machine-readable <file>.mmd.error beside it. The fixer (language/fixer.ts) reads that file, applies the auto-fixable corrections to the source, and re-runs the checker.",
    severities: {
      error: "The document is wrong and the generator would produce something incorrect or nothing at all. Exit code 1.",
      warning: "Legal, but almost certainly not what the author meant - a dropped modifier, a state with no enum. Exit code 1 only under --strict.",
      info: "An observation worth reading once; never fails a run."
    },
    codeRanges: {
      "EML001-EML099": "Document level: metadata, emptiness, section structure.",
      "EML100-EML119": "Entities and attributes.",
      "EML120-EML129": "Relationships.",
      "EML130-EML199": "Directives attached to the ERD: %%enum, %%field, %%entity, %%index, %%category — including the line-item pair EML149 and EML150.",
      "EML200-EML299": "Hooks, guards, triggers, workflows and rules as declared by directives.",
      "EML300-EML399": "Business-rule flowcharts.",
      "EML400-EML449": "Workflow sections: hook, state and saga.",
      "EML500-EML599": "Cross-section consistency."
    },
    autoFixable: {
      EML001: "Missing %%meta name - inserts one derived from the first entity.",
      EML103: "Column is added by the generator anyway - deletes the declared line.",
      EML112: "Duplicate attribute - deletes the later line, keeping the stronger constraints.",
      EML114: "Foreign key not ending in _id - appends the suffix.",
      EML117: "Entity has no primary key - prepends `string id PK`.",
      EML287: "Rule condition names a camelCase identifier - rewrites it as the snake_case column.",
      EML421: "State workflow has no initial transition - inserts `[*] --> <firstState>`.",
      EML422: "State workflow has no terminal state - appends `<lastState> --> [*]`."
    },
    note: "language/checker.ts AUTO_FIXABLE_CODES and the fixer's dispatch table must list the same codes; a code in one and not the other is either a fix that never runs or a promise the fixer cannot keep."
  }
};

// language/composer.ts
var RULE_LEAD = "%%rule ";
var WORKFLOW_LEAD = "%%workflow ";
function tidy(block) {
  return block.split(`
`).map((line) => line.replace(/\s+$/, "")).join(`
`).replace(/\n{3,}/g, `

`).trim();
}
function extractRuleSections(source) {
  return extractSections(source, RULE_LEAD).map(({ directive, body, title }) => {
    const match = directive.match(/^(\S+)\s+on\s+(\S+)\s+event:\s*(\S+)(?:\s+priority:\s*(-?\d+))?/);
    return {
      name: match?.[1] ?? "rule",
      entity: match?.[2] ?? "",
      event: match?.[3] ?? "beforeCreate",
      priority: match?.[4] ? Number(match[4]) : undefined,
      title,
      flowchart: body
    };
  });
}
function extractWorkflowSections(source) {
  return extractSections(source, WORKFLOW_LEAD).map(({ directive, body, title }) => {
    const match = directive.match(/^(\S+)\s+entity:\s*(\S+)\s+kind:\s*(\S+)/);
    const kind = match?.[3];
    const trigger = directive.match(/\btrigger:\s*(\S+)/)?.[1];
    const operation = directive.match(/\boperation:\s*(\S+)/)?.[1]?.toUpperCase();
    return {
      name: match?.[1] ?? "workflow",
      entity: match?.[2] ?? "",
      kind: kind === "state" || kind === "saga" ? kind : "hook",
      trigger: trigger === "rule" ? "rule" : trigger === "automatic" ? "automatic" : undefined,
      operation: operation === "CREATE" || operation === "UPDATE" || operation === "DELETE" || operation === "ALL" ? operation : undefined,
      title,
      diagram: body
    };
  });
}
function extractSections(source, lead) {
  const lines = source.split(`
`);
  const found = [];
  let current = null;
  let pendingTitle;
  const close = () => {
    if (!current)
      return;
    const body = tidy(current.body.join(`
`));
    if (body)
      found.push({ directive: current.directive, title: current.title, body });
    current = null;
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^%%\s*=+\s*$/.test(trimmed)) {
      close();
      continue;
    }
    const metaName = trimmed.match(/^%%meta\s+name:\s*(.+)$/);
    if (metaName) {
      close();
      pendingTitle = metaName[1].trim();
      continue;
    }
    if (trimmed.startsWith("%%meta "))
      continue;
    if (trimmed.startsWith(lead)) {
      close();
      current = { directive: trimmed.slice(lead.length).trim(), title: pendingTitle, body: [] };
      pendingTitle = undefined;
      continue;
    }
    if (trimmed.startsWith(RULE_LEAD) || trimmed.startsWith(WORKFLOW_LEAD)) {
      close();
      pendingTitle = undefined;
      continue;
    }
    if (current)
      current.body.push(line);
  }
  close();
  return found;
}
// packages/generator/src/hooks/index.ts
var HOOK_TYPES = [
  "beforeCreate",
  "afterCreate",
  "beforeUpdate",
  "afterUpdate",
  "beforeDelete",
  "afterDelete",
  "beforeRead",
  "afterRead",
  "beforeQuery",
  "afterQuery",
  "beforeList",
  "afterList",
  "customValidate"
];
var HOOK_TYPE_SET = new Set(HOOK_TYPES);
var DIRECTIVE = /^%%+hook\s+(\w+)\s+([A-Za-z_]\w*)\s+on\s+([A-Za-z_]\w*)\s*(\[[^\]]*\])?/;
var DIRECTIVE_LINE = /^%%+hook\b/;
function parseFields(bracket) {
  if (!bracket)
    return [];
  const inner = bracket.slice(1, -1).trim();
  if (!inner)
    return [];
  const fields = [];
  for (const part of inner.split(",")) {
    const match = part.trim().match(/^(?:field:\s*)?(\w+)$/);
    if (match?.[1])
      fields.push(match[1]);
  }
  return fields;
}
function readHookDirectives(source, onWarn = () => {}) {
  const declarations = [];
  for (const rawLine of (source ?? "").split(`
`)) {
    const line = rawLine.trim();
    if (!DIRECTIVE_LINE.test(line))
      continue;
    const match = line.match(DIRECTIVE);
    if (!match) {
      onWarn(`Skipping malformed hook directive: ${line}`);
      continue;
    }
    const [, event, handler, entity, bracket] = match;
    const fields = parseFields(bracket);
    declarations.push({ event, handler, entity, ...fields.length ? { fields } : {} });
  }
  return declarations;
}

// packages/generator/src/parsers/category.parser.ts
function unfold(source) {
  const lines = source.replace(/\r\n/g, `
`).split(`
`);
  const joined = [];
  for (const raw of lines) {
    const line = raw.trim();
    const previous = joined[joined.length - 1];
    if (previous !== undefined && previous.endsWith("\\")) {
      joined[joined.length - 1] = `${previous.slice(0, -1).trimEnd()} ${line.replace(/^%%\s*/, "")}`;
      continue;
    }
    joined.push(line);
  }
  return joined;
}
function parseFields2(body) {
  const fields = new Map;
  for (const segment of body.split(";")) {
    const trimmed = segment.trim();
    if (!trimmed)
      continue;
    const separator = trimmed.indexOf(":");
    if (separator <= 0)
      continue;
    const key = trimmed.slice(0, separator).trim().toLowerCase();
    const value = trimmed.slice(separator + 1).trim();
    if (key)
      fields.set(key, value);
  }
  return fields;
}
function readCategoryDirectives(source) {
  const declarations = [];
  for (const line of unfold(source)) {
    const match = line.match(/^%%\s*category\b\s*(.*)$/i);
    if (!match)
      continue;
    const body = (match[1] ?? "").trim();
    if (!body)
      continue;
    const fields = parseFields2(body);
    const name = fields.get("name")?.trim();
    if (!name)
      continue;
    const code = fields.get("code")?.trim();
    const seq = Number(fields.get("seq"));
    const entities = (fields.get("entities") ?? "").split(",").map((entity) => entity.trim()).filter(Boolean);
    declarations.push({
      name,
      ...code ? { code } : {},
      ...fields.get("description") ? { description: fields.get("description") } : {},
      ...fields.get("icon") ? { icon: fields.get("icon") } : {},
      ...fields.get("color") ? { color: fields.get("color") } : {},
      ...Number.isFinite(seq) ? { seq } : {},
      isDefault: /^(true|yes|1)$/i.test(fields.get("default") ?? ""),
      entities
    });
  }
  return declarations;
}
// packages/core/src/utils/naming.ts
function snakeCase(str) {
  if (!str)
    return "";
  if (/^[A-Z0-9_]+$/.test(str)) {
    return str.toLowerCase();
  }
  return str.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[-\s]+/g, "_").toLowerCase().replace(/_{2,}/g, "_").replace(/^_/, "");
}
// ../../../../../../home/user/cedm-specification/node_modules/.bun/zod@3.25.76/node_modules/zod/v3/external.js
var exports_external = {};
__export(exports_external, {
  void: () => voidType,
  util: () => util,
  unknown: () => unknownType,
  union: () => unionType,
  undefined: () => undefinedType,
  tuple: () => tupleType,
  transformer: () => effectsType,
  symbol: () => symbolType,
  string: () => stringType,
  strictObject: () => strictObjectType,
  setErrorMap: () => setErrorMap,
  set: () => setType,
  record: () => recordType,
  quotelessJson: () => quotelessJson,
  promise: () => promiseType,
  preprocess: () => preprocessType,
  pipeline: () => pipelineType,
  ostring: () => ostring,
  optional: () => optionalType,
  onumber: () => onumber,
  oboolean: () => oboolean,
  objectUtil: () => objectUtil,
  object: () => objectType,
  number: () => numberType,
  nullable: () => nullableType,
  null: () => nullType,
  never: () => neverType,
  nativeEnum: () => nativeEnumType,
  nan: () => nanType,
  map: () => mapType,
  makeIssue: () => makeIssue,
  literal: () => literalType,
  lazy: () => lazyType,
  late: () => late,
  isValid: () => isValid,
  isDirty: () => isDirty,
  isAsync: () => isAsync,
  isAborted: () => isAborted,
  intersection: () => intersectionType,
  instanceof: () => instanceOfType,
  getParsedType: () => getParsedType,
  getErrorMap: () => getErrorMap,
  function: () => functionType,
  enum: () => enumType,
  effect: () => effectsType,
  discriminatedUnion: () => discriminatedUnionType,
  defaultErrorMap: () => en_default,
  datetimeRegex: () => datetimeRegex,
  date: () => dateType,
  custom: () => custom,
  coerce: () => coerce,
  boolean: () => booleanType,
  bigint: () => bigIntType,
  array: () => arrayType,
  any: () => anyType,
  addIssueToContext: () => addIssueToContext,
  ZodVoid: () => ZodVoid,
  ZodUnknown: () => ZodUnknown,
  ZodUnion: () => ZodUnion,
  ZodUndefined: () => ZodUndefined,
  ZodType: () => ZodType,
  ZodTuple: () => ZodTuple,
  ZodTransformer: () => ZodEffects,
  ZodSymbol: () => ZodSymbol,
  ZodString: () => ZodString,
  ZodSet: () => ZodSet,
  ZodSchema: () => ZodType,
  ZodRecord: () => ZodRecord,
  ZodReadonly: () => ZodReadonly,
  ZodPromise: () => ZodPromise,
  ZodPipeline: () => ZodPipeline,
  ZodParsedType: () => ZodParsedType,
  ZodOptional: () => ZodOptional,
  ZodObject: () => ZodObject,
  ZodNumber: () => ZodNumber,
  ZodNullable: () => ZodNullable,
  ZodNull: () => ZodNull,
  ZodNever: () => ZodNever,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNaN: () => ZodNaN,
  ZodMap: () => ZodMap,
  ZodLiteral: () => ZodLiteral,
  ZodLazy: () => ZodLazy,
  ZodIssueCode: () => ZodIssueCode,
  ZodIntersection: () => ZodIntersection,
  ZodFunction: () => ZodFunction,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodError: () => ZodError,
  ZodEnum: () => ZodEnum,
  ZodEffects: () => ZodEffects,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodDefault: () => ZodDefault,
  ZodDate: () => ZodDate,
  ZodCatch: () => ZodCatch,
  ZodBranded: () => ZodBranded,
  ZodBoolean: () => ZodBoolean,
  ZodBigInt: () => ZodBigInt,
  ZodArray: () => ZodArray,
  ZodAny: () => ZodAny,
  Schema: () => ZodType,
  ParseStatus: () => ParseStatus,
  OK: () => OK,
  NEVER: () => NEVER,
  INVALID: () => INVALID,
  EMPTY_PATH: () => EMPTY_PATH,
  DIRTY: () => DIRTY,
  BRAND: () => BRAND
});

// ../../../../../../home/user/cedm-specification/node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {};
  function assertIs(_arg) {}
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error;
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../../../../../home/user/cedm-specification/node_modules/.bun/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../../../../../home/user/cedm-specification/node_modules/.bun/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// ../../../../../../home/user/cedm-specification/node_modules/.bun/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
// ../../../../../../home/user/cedm-specification/node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path2, errorMaps, issueData } = params;
  const fullPath = [...path2, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== undefined) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === en_default ? undefined : en_default
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}

class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
// ../../../../../../home/user/cedm-specification/node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../../../../../home/user/cedm-specification/node_modules/.bun/zod@3.25.76/node_modules/zod/v3/types.js
class ParseInputLazyPath {
  constructor(parent, value, path2, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path2;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus,
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(undefined).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}

class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}

class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};

class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};

class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};

class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};

class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};

class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};

class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};

class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};

class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};

class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : undefined,
          maximum: tooBig ? def.exactLength.value : undefined,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}

class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {} else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== undefined ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = undefined;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [undefined];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [undefined, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};

class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  static create(discriminator, options, params) {
    const optionsMap = new Map;
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}

class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};

class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};

class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}

class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = new Map;
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = new Map;
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};

class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = new Set;
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};

class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}

class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};

class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}

class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
ZodEnum.create = createZodEnum;

class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};

class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};

class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};

class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};

class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};

class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};

class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");

class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}

class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}

class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;
// packages/core/src/types/sys-dictionary.types.ts
var SysTableSchema = exports_external.object({
  sys_table_id: exports_external.string().uuid(),
  table_name: exports_external.string().min(1).max(100),
  name: exports_external.string().min(1).max(100),
  description: exports_external.string().optional(),
  icon: exports_external.string().max(100).optional(),
  access_level: exports_external.enum(["S", "C", "O", "CO", "A"]),
  is_view: exports_external.boolean(),
  is_document: exports_external.boolean(),
  is_high_volume: exports_external.boolean(),
  is_changelog: exports_external.boolean(),
  replication_type: exports_external.string().optional(),
  sys_window_id: exports_external.string().uuid().optional(),
  po_window_id: exports_external.string().uuid().optional(),
  entity_type: exports_external.string(),
  is_active: exports_external.boolean(),
  created_by: exports_external.string(),
  updated_by: exports_external.string(),
  created_at: exports_external.date(),
  updated_at: exports_external.date()
});
var SysColumnSchema = exports_external.object({
  sys_column_id: exports_external.string().uuid(),
  sys_table_id: exports_external.string().uuid(),
  column_name: exports_external.string().min(1).max(100),
  name: exports_external.string().min(1).max(100),
  description: exports_external.string().optional(),
  sys_reference_id: exports_external.number(),
  sys_val_rule_id: exports_external.string().uuid().optional(),
  field_length: exports_external.number().optional(),
  default_value: exports_external.string().optional(),
  value_min: exports_external.string().optional(),
  value_max: exports_external.string().optional(),
  is_key: exports_external.boolean(),
  is_parent: exports_external.boolean(),
  is_mandatory: exports_external.boolean(),
  is_updateable: exports_external.boolean(),
  is_identifier: exports_external.boolean(),
  is_selection_column: exports_external.boolean(),
  is_translated: exports_external.boolean(),
  is_encrypted: exports_external.boolean(),
  is_allow_logging: exports_external.boolean(),
  is_allow_copy: exports_external.boolean(),
  seq_no: exports_external.number(),
  callout: exports_external.string().optional(),
  read_only_logic: exports_external.string().optional(),
  mandatory_logic: exports_external.string().optional(),
  format_pattern: exports_external.string().optional(),
  entity_type: exports_external.string(),
  is_active: exports_external.boolean(),
  created_by: exports_external.string(),
  updated_by: exports_external.string(),
  created_at: exports_external.date(),
  updated_at: exports_external.date()
});
var SysFieldSchema = exports_external.object({
  sys_field_id: exports_external.string().uuid(),
  sys_tab_id: exports_external.string().uuid(),
  sys_column_id: exports_external.string().uuid(),
  sys_field_group_id: exports_external.string().uuid().optional(),
  name: exports_external.string().min(1).max(100),
  description: exports_external.string().optional(),
  help: exports_external.string().optional(),
  seq_no: exports_external.number(),
  seq_no_grid: exports_external.number(),
  display_length: exports_external.number().optional(),
  x_position: exports_external.number().optional(),
  y_position: exports_external.number().optional(),
  column_span: exports_external.number().optional(),
  num_lines: exports_external.number().optional(),
  is_displayed: exports_external.boolean(),
  is_displayed_grid: exports_external.boolean(),
  is_read_only: exports_external.boolean(),
  is_encrypted: exports_external.boolean(),
  is_same_line: exports_external.boolean(),
  is_heading: exports_external.boolean(),
  is_field_only: exports_external.boolean(),
  display_logic: exports_external.string().optional(),
  read_only_logic: exports_external.string().optional(),
  mandatory_logic: exports_external.string().optional(),
  obscure_type: exports_external.string().optional(),
  included_tab_id: exports_external.string().uuid().optional(),
  default_value: exports_external.string().optional(),
  sort_no: exports_external.number().optional(),
  entity_type: exports_external.string(),
  is_active: exports_external.boolean(),
  created_by: exports_external.string(),
  updated_by: exports_external.string(),
  created_at: exports_external.date(),
  updated_at: exports_external.date()
});
var SysWindowSchema = exports_external.object({
  sys_window_id: exports_external.string().uuid(),
  name: exports_external.string().min(1).max(100),
  description: exports_external.string().optional(),
  help: exports_external.string().optional(),
  window_type: exports_external.enum(["M", "T", "Q"]),
  is_sales_transaction: exports_external.boolean(),
  is_default: exports_external.boolean(),
  entity_type: exports_external.string(),
  is_active: exports_external.boolean(),
  created_by: exports_external.string(),
  updated_by: exports_external.string(),
  created_at: exports_external.date(),
  updated_at: exports_external.date()
});
var SysTabSchema = exports_external.object({
  sys_tab_id: exports_external.string().uuid(),
  sys_window_id: exports_external.string().uuid(),
  sys_table_id: exports_external.string().uuid(),
  name: exports_external.string().min(1).max(100),
  description: exports_external.string().optional(),
  help: exports_external.string().optional(),
  tab_level: exports_external.number(),
  seq_no: exports_external.number(),
  is_single_row: exports_external.boolean(),
  has_tree: exports_external.boolean(),
  is_info_tab: exports_external.boolean(),
  is_translation_tab: exports_external.boolean(),
  is_read_only: exports_external.boolean(),
  is_insert_record: exports_external.boolean(),
  is_advanced_tab: exports_external.boolean(),
  parent_column_id: exports_external.string().uuid().optional(),
  link_column_id: exports_external.string().uuid().optional(),
  order_by_clause: exports_external.string().optional(),
  where_clause: exports_external.string().optional(),
  display_logic: exports_external.string().optional(),
  read_only_logic: exports_external.string().optional(),
  commit_warning: exports_external.string().optional(),
  entity_type: exports_external.string(),
  is_active: exports_external.boolean(),
  created_by: exports_external.string(),
  updated_by: exports_external.string(),
  created_at: exports_external.date(),
  updated_at: exports_external.date()
});
var SysUserSchema = exports_external.object({
  sys_user_id: exports_external.string().uuid(),
  name: exports_external.string().min(1).max(100),
  email: exports_external.string().email(),
  password_hash: exports_external.string(),
  description: exports_external.string().optional(),
  is_system_user: exports_external.boolean(),
  is_sales_rep: exports_external.boolean(),
  login_date: exports_external.date().optional(),
  login_failure_count: exports_external.number(),
  is_locked: exports_external.boolean(),
  is_account_verified: exports_external.boolean(),
  notification_type: exports_external.string().optional(),
  supervisor_id: exports_external.string().uuid().optional(),
  default_sys_role_id: exports_external.string().uuid().optional(),
  entity_type: exports_external.string(),
  is_active: exports_external.boolean(),
  created_by: exports_external.string(),
  updated_by: exports_external.string(),
  created_at: exports_external.date(),
  updated_at: exports_external.date()
});
var SysRoleSchema = exports_external.object({
  sys_role_id: exports_external.string().uuid(),
  name: exports_external.string().min(1).max(100),
  description: exports_external.string().optional(),
  user_level: exports_external.string(),
  is_master_role: exports_external.boolean(),
  is_can_export: exports_external.boolean(),
  is_can_report: exports_external.boolean(),
  is_personal_lock: exports_external.boolean(),
  is_personal_access: exports_external.boolean(),
  max_query_records: exports_external.number(),
  connection_profile: exports_external.string().optional(),
  preference_type: exports_external.string().optional(),
  is_show_accounting: exports_external.boolean(),
  entity_type: exports_external.string(),
  is_active: exports_external.boolean(),
  created_by: exports_external.string(),
  updated_by: exports_external.string(),
  created_at: exports_external.date(),
  updated_at: exports_external.date()
});
var SysReferenceSchema = exports_external.object({
  sys_reference_id: exports_external.number(),
  name: exports_external.string().min(1).max(100),
  description: exports_external.string().optional(),
  validation_type: exports_external.enum(["S", "L", "T", "R"]),
  vformat: exports_external.string().optional(),
  entity_type: exports_external.string(),
  is_active: exports_external.boolean(),
  created_by: exports_external.string(),
  updated_by: exports_external.string(),
  created_at: exports_external.date(),
  updated_at: exports_external.date()
});
// packages/generator/src/model/records.ts
var RELATIONSHIP_GLYPHS = {
  "exactly-one": { left: "||", right: "||" },
  "zero-or-one": { left: "|o", right: "o|" },
  "zero-or-more": { left: "}o", right: "o{" },
  "one-or-more": { left: "}|", right: "|{" }
};
var RELATIONSHIP_ENDS = Object.keys(RELATIONSHIP_GLYPHS);
function endFromLeftGlyph(glyph) {
  return RELATIONSHIP_ENDS.find((end) => RELATIONSHIP_GLYPHS[end].left === glyph);
}
function endFromRightGlyph(glyph) {
  return RELATIONSHIP_ENDS.find((end) => RELATIONSHIP_GLYPHS[end].right === glyph);
}
function relationshipOperator(declaration) {
  return `${RELATIONSHIP_GLYPHS[declaration.sourceEnd].left}--${RELATIONSHIP_GLYPHS[declaration.targetEnd].right}`;
}

// packages/generator/src/parsers/language-maps.ts
var EMBEDDED_LANGUAGE_DEFINITION = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://appwithai.dev/language/appwithai-language.json",
  language: {
    id: "appwithai-eml",
    name: "APPWITHAI Modeling Language",
    abbreviation: "EML",
    version: "1.2.0",
    basedOn: "mermaid",
    mermaidCompatibility: "All EML documents are valid, renderable Mermaid. EML is a semantic superset that assigns generator meaning to standard Mermaid constructs (erDiagram, flowchart, stateDiagram-v2) and to `%%`-prefixed directive comments.",
    description: "A single, standalone, Mermaid-based language for describing an application's Entity Relationship Diagram (ERD), its business rules, and its business workflows in one place. EML is the source language read by the APPWITHAI generator to produce full-stack applications (TanStack Start + NestJS, or OpenUI5 + OData V4).",
    fileExtensions: [".eml.mmd", ".erd.mmd", ".flow.mmd", ".rules.mmd", ".mmd"],
    encoding: "utf-8",
    caseSensitivity: {
      entityNames: "significant (PascalCase recommended)",
      attributeNames: "significant (snake_case recommended)",
      keywords: "significant (erDiagram, flowchart, etc.)",
      types: "insensitive (normalized to lower-case before mapping)",
      modifiers: "insensitive (normalized to UPPER-case before mapping)",
      hookTypes: "significant (camelCase, e.g. beforeCreate)"
    },
    purpose: [
      "Describe database structure (entities, attributes, keys, relationships) as an ERD.",
      "Describe declarative business rules (decision logic, pricing, validation, eligibility) as decision flows that compile to GoRules JDM.",
      "Describe imperative business workflows (lifecycle hooks and process orchestration) as flow/state diagrams with hook directives.",
      "Provide one coherent, human- and machine-readable artifact that the generator consumes to emit code."
    ]
  },
  document: {
    description: "An EML document is a text file containing one or more sections. Each section opens with a Mermaid diagram keyword. A single file may contain multiple diagrams separated by blank lines; the generator classifies each by its opening keyword and by directive comments.",
    comments: {
      syntax: "%%",
      description: "Lines beginning with %% are Mermaid comments. Plain comments are ignored by renderers and by the generator. Comments beginning with a reserved directive keyword (%%hook, %%rule, %%meta, %%entity, %%enum, %%index, %%workflow, %%trigger, %%guard) carry semantic meaning to the generator while remaining renderer-safe.",
      plainCommentExample: "%% This is documentation, ignored by the generator",
      directiveCommentExample: "%%hook beforeCreate hashPassword on User"
    },
    sectionClassifier: {
      description: "How the generator decides what a diagram block means.",
      rules: [
        {
          openingKeyword: "erDiagram",
          section: "erd"
        },
        {
          openingKeyword: "flowchart",
          section: "resolved by %%meta section directive; defaults to 'workflow' unless rule-shaped or marked kind: rules"
        },
        {
          openingKeyword: "graph",
          section: "alias of flowchart"
        },
        {
          openingKeyword: "stateDiagram-v2",
          section: "workflow (state-machine form)"
        },
        {
          openingKeyword: "stateDiagram",
          section: "workflow (state-machine form, legacy)"
        }
      ],
      disambiguation: "A flowchart is treated as a business-rules decision flow when it is preceded by `%%meta kind: rules` OR when it contains only decision/expression/function/io node shapes and no %%hook directives. Otherwise it is treated as a workflow."
    }
  },
  sections: {
    erd: {
      title: "Entity Relationship Diagram",
      opensWith: "erDiagram",
      consumedBy: "packages/generator/src/parsers/mermaid.parser.ts (MermaidParser.parse)",
      produces: "Entity[] and Relationship[] used by the code generator (migrations, DTOs, services, controllers, forms, tables).",
      constructs: {
        entityBlock: {
          grammar: "EntityName {\\n  <attribute>*\\n}",
          entityNameRule: "^[a-zA-Z][a-zA-Z0-9_]*$",
          recommendedCase: "PascalCase (Customer, OrderItem). snake_case (order_item) and prefixed names (bus_account, sys_user) are also accepted.",
          tableNameDerivation: "PascalCase/camelCase -> snake_case; ALL_CAPS/snake stays lower-case. Optional bus_/sys_ prefixes are preserved.",
          example: `Customer {
    string id PK
    string email UK
    string first_name
    date created_at
}`
        },
        attribute: {
          grammar: '<type>[(<length>)] <name> [<modifier> ...] ["<description>"]',
          attributeNameRule: "^[a-zA-Z][a-zA-Z0-9_]*$",
          recommendedCase: "snake_case (first_name, company_id).",
          length: "Optional decimal length in parentheses attached to the type, e.g. string(120). Captured as maxLength.",
          notes: [
            "The first token is the type, the second is the name, remaining tokens are modifiers.",
            "A quoted trailing string is treated as the attribute description/comment.",
            "If an entity declares no id/_id attribute, the generator auto-adds `string id PK`.",
            "timestamps (created_at, updated_at) are added by the generator by default (entity.timestamps = true)."
          ],
          examples: [
            "string id PK",
            "string email UK",
            "string(120) display_name",
            "decimal amount OPTIONAL",
            'string company_id FK OPTIONAL "owning company"',
            "boolean is_active"
          ]
        },
        relationship: {
          grammar: '<LeftEntity> <cardinality> <RightEntity> : "<label>"',
          labelOptional: true,
          labelNormalization: "Trimmed, whitespace -> underscore, lower-cased to form the relationship name.",
          foreignKeyDerivation: "snake_case(targetEntity) with any bus_ prefix removed, suffixed with _id (e.g. Company -> company_id).",
          examples: [
            'Company ||--o{ Contact : "employs"',
            'Deal }o--|| DealStage : "in_stage"',
            'Quote ||--o{ QuoteItem : "contains"',
            'User ||--|| Team : "managed_by"'
          ]
        }
      }
    },
    rules: {
      title: "Business Rules (Decision Flows)",
      opensWith: "flowchart TD  (with `%%meta kind: rules`)",
      consumedBy: "packages/web/src/lib/mermaid-flowchart-parser.ts -> packages/web/src/lib/jdm-converter.ts (convertToJdm)",
      produces: "A GoRules JDM decision graph (nodes + edges) used to evaluate declarative business logic (pricing, discounts, eligibility, validation, routing).",
      modelingPrinciple: "A business rule is a directed decision flow. Node *shape* determines its JDM role; edge *labels* carry the branch condition or transition name.",
      constructs: {
        node: {
          grammar: "<NodeId><shapeDelimiters label>",
          nodeIdRule: "^[A-Za-z_][A-Za-z0-9_]*$",
          shapeSemantics: "See ruleNodes map. stadium=input/output, diamond=decision/switch, circle=function, rect=expression/action.",
          inputVsOutput: "A stadium node with no outgoing edges (only incoming) is an outputNode; otherwise it is an inputNode. This lets a single shape mark both Start and End."
        },
        edge: {
          grammar: "<SourceId> -->|<label>| <TargetId>   (label optional)",
          labelMeaning: "For edges leaving a decision (diamond) node, the label is the branch condition (e.g. Yes / No / amount > 1000). For other edges it is an optional transition name.",
          examples: [
            "B -->|Yes| C[Apply Premium Discount 15%]",
            "B -->|No| D{Customer is VIP?}",
            "C --> G(Calculate Final Price)"
          ]
        }
      },
      example: `flowchart TD
    A([Start: Order Received]) --> B{Order Amount > $1000?}
    B -->|Yes| C[Apply Premium Discount 15%]
    B -->|No| D{Customer is VIP?}
    D -->|Yes| E[Apply VIP Discount 10%]
    D -->|No| F[Apply Standard Pricing]
    C --> G(Calculate Final Price)
    E --> G
    F --> G
    G --> H([End: Price Calculated])`
    },
    workflows: {
      title: "Business Workflows (Lifecycle Hooks & Process Orchestration)",
      opensWith: "flowchart TD  or  stateDiagram-v2",
      consumedBy: "packages/web/src/lib/workflow/hook-parser.ts (parseHooksFromFlowchart) and packages/web/src/lib/mermaid-flowchart-parser.ts",
      produces: "HookDefinition[] wired into the generated BaseService lifecycle, plus a visual process flow. Hooks map to entity CRUD lifecycle events at generation time.",
      modelingPrinciple: "A workflow is the visible process (a flow/state diagram) annotated with %%hook directives that bind named handlers to entity lifecycle events, and optional %%guard/%%trigger directives for authorization and event sources.",
      constructs: {
        hookDirective: {
          grammar: "%%hook <hookType> <handlerName> on <EntityName>[<params>]",
          params: "Optional [field: name, field: name] list scoping the hook to specific fields.",
          hookTypeRule: "one of the 13 hook types (see hooks map)",
          handlerNameRule: "^[a-zA-Z_][a-zA-Z0-9_]*$",
          entityRule: "^[a-zA-Z_][a-zA-Z0-9_]*$",
          examples: [
            "%%hook beforeCreate hashPassword on User",
            "%%hook afterCreate sendWelcomeEmail on User",
            "%%hook beforeCreate generateSlug on Post[field: slug]",
            "%%hook customValidate ensureCreditLimit on Order"
          ]
        },
        processNode: {
          description: "Standard flowchart/state nodes represent process steps; the same shape semantics as rules apply for visualization.",
          example: `flowchart TD
    A[Client Request] --> B[Validate Request]
    B --> C[beforeCreate: hashPassword]
    C --> D[Process User]
    D --> E[afterCreate: sendWelcomeEmail]
    E --> F[Response]`
        },
        stateForm: {
          description: "stateDiagram-v2 expresses a long-running/entity status workflow. States map to a status enum; transitions map to allowed status changes and can be guarded.",
          example: `stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted : submit
    Submitted --> Approved : approve
    Submitted --> Rejected : reject
    Approved --> [*]`
        }
      }
    }
  },
  types: {
    description: "Attribute type vocabulary. Aliases are normalized to a canonical type. Canonical types drive TypeScript, Zod, SQL/Kysely, OData EDM, and UI control mapping in the generator.",
    canonical: ["string", "text", "integer", "decimal", "boolean", "date", "datetime", "json"],
    map: {
      string: "string",
      varchar: "string",
      char: "string",
      uuid: "string",
      guid: "string",
      id: "string",
      email: "string",
      url: "string",
      phone: "string",
      password: "string",
      color: "string",
      text: "text",
      longtext: "text",
      int: "integer",
      integer: "integer",
      bigint: "integer",
      smallint: "integer",
      number: "decimal",
      decimal: "decimal",
      float: "decimal",
      double: "decimal",
      money: "decimal",
      amount: "decimal",
      bool: "boolean",
      boolean: "boolean",
      date: "date",
      datetime: "datetime",
      timestamp: "datetime",
      time: "datetime",
      json: "json",
      jsonb: "json",
      object: "json",
      array: "json"
    },
    semanticHints: {
      description: "Aliases that normalize to a base type but carry UI/validation intent the generator may honor via naming or the extended %%meta field directive.",
      email: "string rendered as email input, validated as email",
      url: "string rendered as url input",
      password: "string rendered as password input, min length enforced",
      phone: "string rendered as tel input",
      color: "string rendered as color picker",
      uuid: "string treated as a UUID primary/foreign key"
    },
    default: "string"
  },
  modifiers: {
    description: "Trailing tokens on an ERD attribute. Normalized to UPPER-case. Unknown modifiers are ignored.",
    map: {
      PK: {
        meaning: "Primary key",
        effects: [
          "unique = true",
          "required handled by generator (auto-generated)",
          "sets entity.primaryKey"
        ]
      },
      FK: {
        meaning: "Foreign key",
        effects: ["marks the column as a reference; relationship inference / navigation"]
      },
      UK: {
        meaning: "Unique key",
        effects: ["unique = true"]
      },
      UNIQUE: {
        meaning: "Alias of UK",
        effects: ["unique = true"]
      },
      OPTIONAL: {
        meaning: "Nullable / not required",
        effects: ["required = false"]
      },
      NULL: {
        meaning: "Alias of OPTIONAL",
        effects: ["required = false"]
      }
    },
    defaults: {
      required: "true unless OPTIONAL/NULL or PK",
      unique: "false unless UK/UNIQUE/PK"
    }
  },
  foreignKeys: {
    description: "How an FK column name resolves to the table it points at. The generator derives the target from the column name alone — there is no explicit target syntax on the attribute — so the name has to carry the reference.",
    suffix: "_id",
    resolution: [
      "1. A person-role name (see personRoleColumns) resolves to the model's person entity (User if it exists, then Staff, then Employee).",
      "2. Otherwise <entity>_id resolves to bus_<entity>.",
      "3. A column that resolves to nothing is stored as a plain string: no lookup, no display name, the raw id renders in grids and forms."
    ],
    personRoleColumns: {
      description: "Columns naming a person by the role they played rather than by entity. All resolve to the model's person entity (User > Staff > Employee, whichever exists first).",
      suffixes: ["_by", "_by_id"],
      names: [
        "assigned_to",
        "author_id",
        "lab_manager_id",
        "manager_id",
        "owner_id",
        "pi_id",
        "remediation_owner",
        "remediation_owner_id",
        "user_id"
      ],
      examples: [
        "reported_by_id -> bus_user (or bus_staff when the model has no User entity)",
        "registered_by_id -> bus_user (or bus_staff / bus_employee)",
        "pi_id -> bus_user (a principal investigator is a person, not a bus_pi table)"
      ]
    },
    checkerCodes: {
      EML114: "FK column does not end in _id. Auto-fixable: the fixer appends the suffix, so `reported_by FK` becomes `reported_by_id FK` and starts resolving to the person entity.",
      EML119: "A column named like a reference (_id/_by, resolving to a declared entity) that carries no FK modifier. Both conditions are required for TABLE_DIRECT, and a column that fails either is recorded as a plain String."
    }
  },
  applicationDictionary: {
    description: "The generated application is metadata-driven: it does not hard-code forms. Every table, column, tab, field and lookup is a row in the Application Dictionary (sys_table, sys_column, sys_field, sys_tab, sys_window, sys_category, sys_reference, sys_ref_list), and the running interface reads those rows, which is why a field can be added to a live application without a deployment. Nothing in EML writes dictionary rows: they are derived, one way, from the ERD. There is no %%dictionary directive, and a model that wants a lookup or a dropdown gets one by declaring the column so that the derivation produces it.",
    derivedBy: "packages/core/src/types/bus-entity.types.ts (attributeReferenceId, isForeignKeyColumnName, attributeToBusAttribute)",
    consumedBy: [
      "packages/generator/src/generators/wasm/model-bundle.ts (referenceIdFor)",
      "packages/generator/src/generators/dictionary (sys_table, sys_column, sys_field seeds)",
      "packages/web (the runtime that renders a control per sys_reference_id)"
    ],
    referenceTypes: {
      description: "sys_reference_id decides the control the user gets. Ids below 1000 are the standard references below; a %%enum creates its own List reference at 1000 or above, with one sys_ref_list row per value.",
      standard: {
        "10": "String - plain text box",
        "11": "Integer",
        "12": "Amount - decimal, right aligned",
        "13": "ID - the record key, read-only",
        "14": "Text - memo box",
        "15": "Date",
        "16": "DateTime",
        "17": "List - dropdown fed by sys_ref_list",
        "18": "Table - lookup with an explicit validation rule",
        "19": "Table Direct - lookup on the table the column name resolves to",
        "20": "Yes-No - switch",
        "21": "Location",
        "22": "Locator",
        "23": "Account",
        "24": "URL",
        "25": "Image",
        "26": "File",
        "27": "Color",
        "28": "JSON",
        "29": "Password - masked",
        "30": "Email",
        "31": "Phone"
      }
    },
    derivation: [
      "1. The entity's primary key, or a column named `id`, gets ID (13).",
      "2. A column that is BOTH marked FK and named _id/_by (see foreignKeys.resolution) gets TABLE_DIRECT (19) - the lookup on the parent table.",
      "3. A column bound by `%%field <Entity>.<column> enum: <Enum>` gets that enum's List reference (>= 1000).",
      "4. Otherwise the semantic aliases decide: email/phone/url/password/color map to their own references (30, 31, 24, 29, 27).",
      "5. Otherwise the canonical type decides: text -> Text, boolean -> Yes-No, decimal/money -> Amount, date -> Date, datetime -> DateTime, json -> JSON, integer -> Integer, everything else -> String."
    ],
    silentDowngrades: {
      description: "Two authoring mistakes leave a column at String (10) with a document that is otherwise correct. Both were invisible before EML119 and EML146: the model parses, the relationship line can be present, and the generated application comes back with raw ids in text boxes.",
      unmarkedReference: "`string vendor_id` and `string vendor_id FK` parse into the same column, and only the second becomes TABLE_DIRECT. Reported as EML119.",
      unboundLifecycleColumn: "A %%enum does nothing to a column on its own. Without the %%field binding, a status/state/stage column is free text, and the form accepts values the state machine cannot act on. Reported as EML146."
    },
    displayValue: {
      description: "What a record is called wherever something other than the record shows it: a Table Direct dropdown, and a grid cell holding a foreign key. Stored as sys_column.is_identifier, and the display value is the identifier columns concatenated in seq_no order - the same rule in both stacks.",
      derivation: [
        "1. A column named name, full_name, display_name, title, label or subject - whichever appears first in that order.",
        "2. Otherwise first_name and last_name together, if the entity declares both. This is why the value is a concatenation and not one column.",
        "3. Otherwise code, reference or number - not a name, but what people quote at each other, and better than a uuid.",
        "4. Otherwise, if the entity declares two or more FK columns ending _id/_by, it is a join entity: its first two references are the identifiers, each resolved through the parent's own label. CampaignMember reads as `Spring Promo - Omar Kowalski`.",
        "5. Otherwise the first declared string/text column that is neither the key nor a reference.",
        "6. Otherwise the key, so a lookup still lists something."
      ],
      joinEntities: {
        description: "An entity whose identity is the pair of records it joins - CampaignMember, OrderLine, QuoteLineItem - has no name to give it, and step 5 would pick whatever text column came first: member_status, so every campaign member read `invited`. Two or more references and no name of its own is the shape.",
        depth: "One level only. A parent that is itself a join entity labels itself by its key rather than recursing, because a label assembled from four grandparents is not a name anybody reads.",
        pairOnly: "The first two references in declared order, never more. An entity with three parents labels itself from the first two, which is the only say the modeller has in it - so declare the two that name the record first.",
        separator: "Two names of one record join with a space (`Omar Kowalski`); two records join with an em dash (`Spring Promo - Omar Kowalski`). Sharing one separator turns a person into `Omar - Kowalski`.",
        sqlNote: "A generated key is UUID and a reference to it is VARCHAR(255), because the model declares `string campaign_id FK`. Postgres coerces a text parameter to uuid but refuses to compare the two columns, so the resolving subquery casts both sides."
      },
      primaryKeyIsNotAnIdentifier: "The key is deliberately excluded. It used to be marked, which meant a display value built from the identifier columns began with a uuid, and every consumer had grown its own filter to drop it.",
      modellingAdvice: "Give an entity a name, title or code column if it will be referenced. Without one the fallbacks apply, and a reference to it reads as whatever text column happened to be declared first. A join entity is the exception and needs nothing: it names itself from its parents."
    },
    managedColumns: {
      description: "Columns every generated table carries in both stacks, whether or not the model mentions them. They are the generator's: the key, the optimistic-lock counter, the audit pair and the soft-delete pair.",
      names: [
        "id",
        "version",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "deleted_at",
        "deleted_by"
      ],
      declaringOne: 'Redundant, and it used to be fatal: the column reached CREATE TABLE twice and PostgreSQL refused the statement with `column "created_at" specified more than once`, so the generated application could not open its database. The generator now drops the model\'s definition and keeps its own; EML103 reports the line.',
      checkerCodes: {
        EML103: "A column the generator manages, declared in the model - the declaration is ignored."
      }
    },
    alsoDerived: [
      "Each entity becomes a sys_table with a window and a tab; attributes become fields in declared order (seqNo = (index + 1) * 10).",
      "%%index becomes real indexes; a unique attribute or a `name` column is indexed automatically (mergeIndexes).",
      "%%category becomes the dashboard grouping; a model declaring none gets a single General category holding every entity.",
      "%%field <Entity>.<column> help: and %%entity <Name> help: become sys_column.description and sys_table.description - the help a reader sees under the field and beside the table. %%entity description: is the same key under its other name.",
      "%%entity <Child> parent: <Parent> makes the child a line item: no window and no dashboard card, a tab inside the parent's window instead. See masterDetail.",
      "%%entity <Name> icon: becomes sys_table.icon — the entity's dashboard card, its window heading and its navigation entry all draw it. It is a lucide name, and an administrator may override it afterwards in Table and Column, including by uploading an image; the same column holds both. %%category carries an icon the same way, for its heading.",
      "The remaining %%entity keys (label, prefix, softDelete, audited) are validated but not yet compiled."
    ],
    helpText: {
      description: "The only explanation a generated application has. `%%entity <Name> help:` becomes sys_table.description and opens that entity's section of manual.html; `%%field <Entity>.<column> help:` becomes sys_column.description, the hint under the control, and the column's row in the manual. There is no second source — no hand-written tooltip, no README beside the form, no designer to ask — so a model that skips it produces an application whose manual is a table of dashes.",
      required: "On every entity and every column, without exception, including the ones that feel self-evident. The primary key is the one thing that needs none: it is a generated uuid, read-only on every form, and the only sentence anyone could write about it restates its name.",
      mustBeDomainKnowledge: "Help is where the *business* lands in the model, not where the schema is paraphrased. `Household id for HouseholdMember.` is the column name in a sentence and leaves the reader exactly where they started; `The family this membership is in — listed inside the household's own screen, since a membership away from its household is not something anybody looks up.` is what the field is for. The distinction is not style: help is compiled, so the difference between the two reaches every form, every dictionary row and every page of the manual.",
      whatToSay: [
        "An entity: what this record is for in the business, when one comes into existence, what distinguishes it from the entities it sounds like, and what it must not be confused with.",
        "A column: why the value matters, what is expected in it, what reads it downstream, and what goes wrong when it is wrong.",
        "A reference column: what the reference is *for* — `the ward this bed stands in`, not `the ward id`.",
        "An enum-bound column: what each value means to the business, because the dictionary lists the values and nothing else says what choosing one does.",
        "A lifecycle column: which moves are possible from which state, since the state machine enforces a topology the form cannot show."
      ],
      whenToWriteIt: "While the model is being written, and nowhere else. The moment a model is authored is the only moment anybody knows the answers, and no later pass adds them — which is why this is the most-skipped part of a model and the most expensive to skip.",
      checkerCodes: {
        EML151: "warning — help that restates its own subject: `Unique identifier for X`, the column name in prose (`Status for Client`), or a template sentence (`Address is a business record in the wealth-management platform`). Deliberately narrow: real help that happens to be short is not a restatement and does not fire.",
        EML152: "warning — an entity with no `%%entity ... help:` at all.",
        EML153: "warning — the columns of one entity with no `%%field ... help:`, reported once per entity and naming them. One diagnostic per column would bury every other finding on a model that skipped help entirely, which is the common case."
      }
    },
    masterDetail: {
      description: "A line item is an entity with no life away from its owner - an invoice line, an order line, a prescription item. The ERD cannot tell one from an ordinary reference, because InvoiceLine.invoice_id and Invoice.patient_id are both a foreign key with a relationship behind it. The modeller says which it is.",
      directive: "%%entity <Child> parent: <Parent>",
      effects: [
        "The child gets no sys_window and no dashboard card: it is not somewhere the user navigates to.",
        "The child's sys_tab is created under the parent's window at tab_level 1, sequenced after the master tab.",
        "sys_tab.link_column_id is set to the child's own foreign key back to the parent, and that column is marked sys_column.is_parent.",
        "Opening a parent record lists its children beneath the form, filtered to that record."
      ],
      linkColumn: "The child's existing foreign key to the parent - <parent_snake>_id when present, else the first FK column whose name begins with the parent's snake_case name. Never declared twice: the relationship is already in the ERD.",
      identifyingAChild: [
        "Would a list of these records, away from their owner, be useful to anyone? If not, it is a child.",
        "Does the row's identity depend on the owner - line 1 of invoice 7, rather than line 1? If so, it is a child.",
        "Would deleting the owner make the row meaningless? If so, it is a child.",
        "A reference is the opposite: Invoice.patient_id points at a Patient who exists, and matters, independently."
      ],
      whyItMustBeDeclared: "Nothing derives it, and the default is not an error. A model that never writes the directive produces an application in which every line item carries its own dashboard card and its own screen, and no parent record shows its own lines — an invoice whose lines cannot be read from it, beside a card listing every line ever written. EML149 exists to name the candidates, because a silent default is the one thing a checker can still be useful about.",
      leaveItOutOfCategory: "A %%category is the dashboard's grouping, and a child has no card, so naming a child in one asks for a card the dictionary will not create. Reported as EML150.",
      detection: {
        description: "EML149 is an info rather than an error, because whether a list of these records away from their owner is useful to anyone is a question about the business and not about the document. The checker names the candidate parent and the foreign key the tab would link on; the author answers it either way.",
        shapes: [
          "The entity's name begins with a declared entity's name and it carries a foreign key to that entity — InvoiceLine/Invoice, OrderItem/Order, TeamMember/Team, FinancialPlanAssumption/FinancialPlan. The longest match wins, so a name that begins with two declared entities belongs to the longer one.",
          "The entity's name ends in a line-item noun (Line, LineItem, Item, Detail, Entry, Row, singular or plural) and one of its foreign keys resolves to a declared entity — RecommendationItem under InvestmentRecommendation."
        ],
        quietOn: "An entity that merely references another. Most foreign keys are references, and neither shape fires on one."
      }
    },
    checkerCodes: {
      EML103: "A column the generator already adds (id, version, the audit pair, the soft-delete pair), declared in the model.",
      EML119: "A reference-shaped column with no FK modifier - the lookup is lost.",
      EML146: "A status/state/stage column with no %%field enum binding - the dropdown is lost.",
      EML147: "%%entity ... parent: names an entity that is not declared, or the entity names itself.",
      EML148: "%%entity ... parent: is declared but the child has no foreign key back to the parent, so the detail tab has nothing to link on.",
      EML149: "info — an entity shaped like a line item that declares no parent:. Names the candidate parent and the column a tab would link on. Never an error: identifyingAChild's three questions are about the business, not the document.",
      EML150: "warning — an entity declared parent: is also named in a %%category. The category asks for a dashboard card the directive has taken away.",
      EML151: "warning — entity or column help that restates its own name instead of describing it. See helpText.mustBeDomainKnowledge.",
      EML152: "warning — an entity with no help text at all.",
      EML153: "warning — columns with no help text, reported once per entity.",
      EML154: "warning — a %%category with no `name:` key. category.parser.ts requires one and skips the line without it, so the whole grouping is silently lost and its entities fall into the default General category.",
      EML500: "A `kind: state` workflow bound to an entity with no status/state/stage column at all - the machine has nothing to track."
    },
    reportDesigns: {
      description: "Generated applications include a document report subsystem backed by the AnkaReport library. One default AnkaReport layout is seeded per entity into sys_report_designs at generation time. Administrators can customise any layout at Admin → Report Designs. Users get a Print button on a record's detail view (visible only when a design exists for that table), and can export the rendered report to PDF.",
      table: "sys_report_designs",
      columns: {
        id: "UUID primary key",
        table_name: "Entity table name; UNIQUE — one design per table",
        name: 'Human-readable design name (e.g. "Contact Default Report")',
        layout: "JSONB AnkaReport ILayout object — headerSection, contentSection, footerSection"
      },
      defaultLayout: {
        description: "Generated by packages/generator/templates/common/seeds/report-designs.ts.hbs. Fields in the layout are every non-audit, non-PK column: not id, created_at, updated_at, deleted_at, version.",
        structure: {
          headerSection: 'height 56; entity displayName + " Report" in 20pt bold #0f4c75',
          contentSection: 'binding: "records"; one label+value row per field, 24pt high with 4px gap',
          footerSection: 'height 28; "Generated by APPWITHAI" in 9pt #9ca3af centered'
        }
      },
      adminRoutes: [
        "GET /admin/reports — lists all entity tables with Designed/New badge",
        "GET /admin/reports/:tableName — opens AnkaReport designer pre-loaded with the existing layout"
      ],
      backendEndpoints: [
        "GET /sys/report-designs — list all designs",
        "GET /sys/report-designs/:tableName — get design by table",
        "POST /sys/report-designs — create (admin only)",
        "PUT /sys/report-designs/:tableName — upsert (admin only)",
        "DELETE /sys/report-designs/:tableName — delete (admin only)"
      ],
      printButton: "Appears in the record toolbar (ADToolbar hasPrintReport prop) only when a design exists for the current entity. Clicking opens ReportPrintModal which renders the report via AnkaReport.render() and offers PDF export.",
      authoringNote: "No EML directive controls report designs. The default layout is always seeded automatically from the entity's columns. Customisation is done through the running Admin UI, not through the model."
    }
  },
  cardinalities: {
    description: "Mermaid ER relationship operators and their semantic meaning. Left/right glyphs encode min/max multiplicity; EML maps the pair to a cardinality kind and infers the foreign-key side.",
    glyphReference: {
      "||": "exactly one",
      "|o": "zero or one",
      "o|": "zero or one",
      "}o": "zero or many",
      "o{": "zero or many",
      "}|": "one or many",
      "|{": "one or many"
    },
    map: [
      {
        operator: "||--||",
        kind: "oneToOne",
        example: "User ||--|| Profile : has"
      },
      {
        operator: "||--o{",
        kind: "oneToMany",
        example: "Company ||--o{ Contact : employs"
      },
      {
        operator: "||--|{",
        kind: "oneToMany",
        example: "Order ||--|{ OrderItem : contains"
      },
      {
        operator: "}o--||",
        kind: "manyToOne",
        example: "Deal }o--|| DealStage : in_stage"
      },
      {
        operator: "}|--||",
        kind: "manyToOne",
        example: "OrderItem }|--|| Order : belongs_to"
      },
      {
        operator: "}o--o{",
        kind: "manyToMany",
        example: "Student }o--o{ Course : enrolls"
      },
      {
        operator: "}|--|{",
        kind: "manyToMany",
        example: "Author }|--|{ Book : writes"
      },
      {
        operator: "|o--o|",
        kind: "oneToOne",
        example: "Employee |o--o| ParkingSpot : assigned"
      }
    ]
  },
  hooks: {
    description: "Lifecycle event points a workflow hook may bind to. Each %%hook directive generates a handler function in the generated backend (src/modules/hooks/handlers/<Entity>.ts), registered against the event and run by the bus service around the matching CRUD operation.",
    types: [
      {
        type: "beforeCreate",
        phase: "before",
        op: "create",
        purpose: "Validate/transform an entity before insert (e.g. hash password, generate slug)."
      },
      {
        type: "afterCreate",
        phase: "after",
        op: "create",
        purpose: "Side effects after insert (e.g. send welcome email, emit event)."
      },
      {
        type: "beforeUpdate",
        phase: "before",
        op: "update",
        purpose: "Validate/transform before update."
      },
      {
        type: "afterUpdate",
        phase: "after",
        op: "update",
        purpose: "Side effects after update (e.g. audit, cache invalidation)."
      },
      {
        type: "beforeDelete",
        phase: "before",
        op: "delete",
        purpose: "Guard/validate before delete (e.g. block if referenced)."
      },
      {
        type: "afterDelete",
        phase: "after",
        op: "delete",
        purpose: "Cleanup after delete (e.g. remove files)."
      },
      {
        type: "beforeQuery",
        phase: "before",
        op: "query",
        purpose: "Mutate the query before it runs (e.g. tenant scoping)."
      },
      {
        type: "afterQuery",
        phase: "after",
        op: "query",
        purpose: "Post-process query results."
      },
      {
        type: "customValidate",
        phase: "validate",
        op: "any",
        purpose: "Cross-field/business validation independent of a single CRUD verb."
      },
      {
        type: "beforeRead",
        phase: "before",
        op: "read",
        purpose: "Guard/transform a single-record read."
      },
      {
        type: "afterRead",
        phase: "after",
        op: "read",
        purpose: "Post-process a single record (e.g. redact fields)."
      },
      {
        type: "beforeList",
        phase: "before",
        op: "list",
        purpose: "Adjust list parameters (filter/sort/paginate)."
      },
      {
        type: "afterList",
        phase: "after",
        op: "list",
        purpose: "Post-process a list result set."
      }
    ],
    directive: {
      pattern: "%%hook <type> <handlerName> on <Entity>[<params>]",
      regex: "%%hook\\s+(\\w+)\\s+(\\w+)\\s+on\\s+(\\w+)(\\[(?:field:\\s*\\w+(?:\\s*,\\s*field:\\s*\\w+)*)?\\])?",
      paramForms: ["[field: slug]", "[field: slug, field: title]"]
    }
  },
  ruleNodes: {
    description: "Mapping of Mermaid node shapes to GoRules JDM node roles for business-rule decision flows.",
    map: [
      {
        shape: "stadium",
        delimiters: "([ label ])",
        jdmType: "inputNode | outputNode",
        resolution: "outputNode when the node has only incoming edges; otherwise inputNode.",
        role: "Start / input context, or End / decision output.",
        example: "A([Start: Order Received])"
      },
      {
        shape: "diamond",
        delimiters: "{ label }",
        jdmType: "switchNode",
        role: "Decision / branch. Outgoing edge labels are branch conditions.",
        example: "B{Order Amount > $1000?}"
      },
      {
        shape: "circle",
        delimiters: "(( label ))",
        jdmType: "functionNode",
        role: "Custom function / computation step (JS expression or reusable function).",
        example: "G((Calculate Final Price))"
      },
      {
        shape: "rect",
        delimiters: "[ label ]",
        jdmType: "expressionNode",
        role: "Expression / assignment / action (set output fields, apply a value).",
        example: "C[Apply Premium Discount 15%]"
      },
      {
        shape: "rounded",
        delimiters: "( label )",
        jdmType: "functionNode",
        role: "Rounded rectangle, treated like a function/computation step (used for calculate steps).",
        example: "G(Calculate Final Price)"
      }
    ],
    actions: {
      description: "Side-effecting actions a rule may emit, evaluated by the rules engine after the decision runs. A %%action directive inside a rules section declares one: the `when` expression becomes the decision-table row's condition, and the remaining keys become its outputs. Without this a model-declared rule could only decide, never act — the action vocabulary existed solely in the app's decision-table editor.",
      directive: "%%action <name> <actionType> when: <expr> <key>: <value> ...",
      whenForm: 'A zen expression over the record being written, e.g. `severity == "critical"`. `true` fires on every write. It is the last key parsed before the action\'s own keys, so quote values containing a `key:` sequence.',
      types: [
        {
          name: "trigger-workflow",
          purpose: "Run a workflow definition by name. This is what gates a `kind: saga` workflow declared with `trigger: rule` on a condition.",
          required: ["workflow"],
          optional: ["message"],
          example: '%%action escalate trigger-workflow when: severity == "critical" workflow: CriticalDeviationEscalation'
        },
        {
          name: "validation-error",
          purpose: "Reject the write. The message is returned to the caller.",
          required: ["message"],
          optional: [],
          example: '%%action requireCause validation-error when: status == "closed" and root_cause == null message: A closed deviation needs a root cause'
        },
        {
          name: "transform",
          purpose: "Overwrite a field on the record being written.",
          required: ["field", "value"],
          optional: ["message"],
          example: "%%action stampSeverity transform when: true field: severity value: major"
        }
      ]
    }
  },
  workflowConstructs: {
    description: "Node/edge vocabulary for process workflows and state workflows.",
    flowShapes: {
      stadium: "Start/End terminal ( ([label]) )",
      rect: "Process step ( [label] )",
      diamond: "Gateway/decision ( {label} )",
      circle: "Event/signal ( ((label)) )",
      rounded: "Sub-process/task ( (label) )"
    },
    stateForm: {
      start: "[*] --> FirstState",
      end: "LastState --> [*]",
      transition: "StateA --> StateB : eventName",
      mappingHint: "States are treated as a status enum for the bound entity; transitions define the allowed status changes.",
      enforcement: "The edges are enforced, not merely documented. Every transition a diagram draws is compiled into sys_workflow_transitions, and the generated EntityAccessGuard refuses a write that moves a record to a state with no matching edge from the state it is in — answering 403 and leaving the record where it was. This holds for every caller, the master role included: an edge the diagram never drew is not a permission an administrator lacks, it is a move that does not exist, and allowing it would put the record in a state every rule and workflow downstream was written without. Who may cross an edge that does exist is the separate question %%rbac answers, from sys_transition_access, and that one the master role does bypass. Keep the two apart: enforcing topology only where a role rule happens to cover it leaves every unguarded edge open.",
      readingTheEdges: "GET /api/workflows/transitions returns the stored edges, optionally narrowed by ?table= and ?from=. A screen offering a status change asks this rather than offering every state and letting the save be refused. A table with no state diagram has no rows and nothing is enforced for it."
    },
    workflowKinds: {
      hook: {
        form: "%%workflow <name> entity: <Entity> kind: hook",
        description: "A flowchart whose steps represent operations on a single entity. %%hook directives bind named handlers to the entity's CRUD lifecycle events. Fully parsed by the shipped hook-parser.",
        diagram: "flowchart",
        shipped: true
      },
      state: {
        form: "%%workflow <name> entity: <Entity> kind: state",
        description: "A stateDiagram-v2 whose states map to a status enum for the bound entity. Transitions define the allowed status changes and are enforced as the entity's topology — see stateForm.enforcement. %%rbac directives naming a transition event add the role check on top of that; %%trigger directives declare external event sources. Fully parsed by the shipped hook-parser.",
        diagram: "stateDiagram-v2",
        shipped: true
      },
      saga: {
        form: "%%workflow <name> entity: <Entity> kind: saga [trigger: automatic|rule] [operation: CREATE|UPDATE|DELETE|ALL]",
        description: "A flowchart whose nodes are executable steps. Each node is bound to a step by a %%step directive naming the node id and its step type; the flowchart edges give the running order. Compiles to BPMN service tasks seeded into sys_workflow_definitions and run by the generated workflow executor. This is how a multi-entity, multi-step process — create a row here, update one there, delete a third, passing values between the steps — is expressed in the model rather than drawn by hand in the app.",
        diagram: "flowchart",
        shipped: true,
        trigger: {
          automatic: "Runs on every write to the bound entity that matches the workflow's operation. The default.",
          rule: "Runs only when a business rule emits a trigger-workflow action naming it, so the rule's condition decides. Use this whenever the workflow should not fire on every write."
        },
        ordering: "Steps run in flowchart edge order, walking forward from every node with no incoming edge. A node with a %%step but no edges still runs, after the wired ones, in document order — the canvas implies a step runs even when the connection was left implicit.",
        example: "%%workflow CriticalDeviationEscalation entity: DeviationReport kind: saga trigger: rule operation: CREATE",
        operation: "Which write runs the workflow. Defaults to CREATE. Only consulted for trigger: automatic — a rule-triggered workflow is resolved by name, so the rule decides."
      }
    },
    stepNodes: {
      description: "Executable step types for a `kind: saga` workflow. A %%step directive binds a flowchart node to one of these and supplies its properties; each becomes one bpmn:serviceTask with appwithai:property extension elements. This table is the single source of truth for the checker, the generator, the EML authoring canvas and the generated Workflow Designer.",
      directive: "%%step <nodeId> <stepType> <key>: <value> ...",
      propertyForm: "Space-separated `key: value` pairs. A value runs to the next `<key>:` token or the end of the line, so it may contain spaces. `fields` is JSON and must be the last key on the line.",
      variables: "Steps share a context: the triggering record's columns, plus every variable a previous step published. CreateEntity publishes the new row's id under `as`; Formula publishes under `target`. A later step reads one by naming it in `source` or `targetSource`. This is what lets a workflow reach a row it created earlier.",
      loopMembership: "`in: <loopId>` joins a step to a %%loop declared in the same section. It is read off every step type alike, before the type is consulted at all, so it belongs to no single contract below and is deliberately absent from their `optional` lists. A reader validating step properties must treat it as known for every type — see automations.loops and the %%loop directive.",
      types: [
        {
          name: "UpdateEntity",
          purpose: "Write one column on the triggering record, or on rows of a related entity.",
          required: ["field"],
          oneOf: [["source", "value"]],
          optional: ["entity", "targetField", "targetSource"],
          rowTargeting: "Defaults to the record that triggered the workflow. To reach another entity, set `entity` plus either `targetSource` (a context key holding the row id) or `targetField` (a foreign key column matched against the triggering row). Targeting another entity by `id` with no `targetSource` is refused rather than guessed.",
          example: "%%step D UpdateEntity entity: Capa targetSource: newCapaId field: effectiveness_metric source: resolutionDays"
        },
        {
          name: "CreateEntity",
          purpose: "Insert a row, optionally publishing its id for later steps.",
          required: ["entity", "fields"],
          optional: ["as"],
          notes: [
            "`fields` is a JSON object of column -> context key or literal. A string that names a context key is substituted; anything else is written as-is.",
            "`as` names the variable the new row's id is published under. It defaults to the table name without its bus_ prefix plus `Id`. Without it a workflow can insert a row and then never reach it again."
          ],
          example: '%%step C CreateEntity entity: Capa as: newCapaId fields: {"title":"capaTitle","status":"open"}'
        },
        {
          name: "DeleteEntity",
          purpose: "Delete the triggering record or rows of a related entity.",
          required: [],
          optional: ["entity", "targetField", "targetSource", "hard"],
          notes: [
            "Soft by default: stamps deleted_at, so the audit trail still points at a row that exists. `hard: true` removes it.",
            "Row targeting matches UpdateEntity exactly, including the refusal to touch another entity by `id` with no targetSource."
          ],
          example: "%%step F DeleteEntity entity: Capa targetSource: supersededCapaId"
        },
        {
          name: "Decision",
          purpose: "Evaluate a GoRules decision table and publish the matching row's output columns as variables the following steps read.",
          required: [],
          oneOf: [["decisionTable", "rule"]],
          optional: ["publish"],
          notes: [
            "`decisionTable` is the table itself as JSON — { hitPolicy, inputs, outputs, rules } — for logic only this process cares about. The generator wraps it in the input -> table -> output graph the engine evaluates, so a step never carries that plumbing.",
            "`rule` names a rule declared elsewhere in the model, for when the same table already governs the entity and the process should not fork a second copy of it.",
            "Outputs become variables under their `field` name. `publish` narrows that to a comma-separated allow-list when a table emits more than the process needs.",
            "A table that matches no row publishes nothing. That is how 'leave it alone' is expressed, not an error — later steps that read a variable it would have set skip themselves.",
            "Every row must set every output column: the engine silently discards a row that leaves one unset, and one such row stops the whole table matching."
          ],
          example: "%%step B Decision rule: ClassifySeverity publish: priority, slaDays"
        },
        {
          name: "Formula",
          purpose: "Publish a value into the workflow context for later steps.",
          required: ["target", "operation"],
          operations: {
            multiply: "target = Number(source) * Number(operand)",
            divide: "target = Number(source) / Number(operand)",
            add: "target = Number(source) + Number(operand)",
            subtract: "target = Number(source) - Number(operand)",
            set: "target = value, stored unchanged. The only way to pass text — a status, a title — to a later step.",
            copy: "target = context[source], carried across unchanged."
          },
          perOperation: {
            multiply: {
              required: ["source", "operand"]
            },
            divide: {
              required: ["source", "operand"]
            },
            add: {
              required: ["source", "operand"]
            },
            subtract: {
              required: ["source", "operand"]
            },
            set: {
              required: ["value"]
            },
            copy: {
              required: ["source"]
            }
          },
          example: "%%step B Formula target: resolutionDays source: baseDays operation: multiply operand: 7"
        },
        {
          name: "REST",
          purpose: "Call an external HTTP endpoint.",
          required: ["url"],
          optional: ["method", "bodyTemplate"],
          notes: ["`bodyTemplate` interpolates {{key}} from the workflow context."],
          example: "%%step E REST url: https://hooks.example.com/notify method: POST"
        },
        {
          name: "Agent",
          purpose: "Invoke an AI agent. Placeholder pending Mastra integration — the executor logs and skips.",
          required: ["agentId"],
          shipped: false,
          example: "%%step G Agent agentId: deviation-triage-v1"
        }
      ]
    }
  },
  automations: {
    description: "The automation dialect: the form a workflow takes when it is authored in the automation builder, which is the shipped way to build workflows and business rules in both the generator and generated applications. An automation is one sentence — a trigger, a flat list of conditions that must all pass, and an ordered list of steps. There is deliberately no graph: the executor runs steps in order and stops at the first failure, so a list is the honest representation. It is a constrained profile of `workflowConstructs.stepNodes`, not a second language: it serialises to the same mermaid flowchart with the same %%step directives, so an automation opens in a Mermaid renderer and runs through the existing executor.",
    relationshipToSaga: "The saga form (`%%workflow <Name> entity: <E> kind: saga`, positional `%%step <node> <StepType> <k>: <v>`) is the older, more general surface. The automation form differs in three ways: the workflow is named with `%%workflow name:` and takes its entity from `%%hook`; the step type is a `type:` key rather than a positional token; and conditions are expressed as `%%guard` lines instead of being drawn as decision nodes. Both compile to the same executable steps.",
    interoperability: "Both dialects are read by both sides. The builder's parser reads the saga form (mapping `fields`->`values`, a Formula's `target`/`source`/`operand` onto `as`/`left`/`right`, and `decisionTable` onto an inline table), and the generator reads the automation form (translating back, and unwrapping `{{name}}` references into the bare `source:`/`targetSource:` a saga uses). So a model authored by hand opens in the builder, and an automation built in a running application compiles through the generator. Downstream of that translation only saga vocabulary exists — STEP_CONTRACTS, the checker and the BPMN emitter need no knowledge that a second dialect exists.",
    shipped: true,
    writer: "packages/web/src/lib/automation/model.ts serializeAutomation()",
    reader: "packages/web/src/lib/automation/model.ts parseAutomation()",
    envelope: {
      description: "Every serialised automation opens with these lines, in this order.",
      lines: [
        "flowchart TD",
        "%%meta kind: workflow",
        "%%workflow name: <name>",
        "%%hook <hookName> on <Entity>"
      ],
      note: "The entity is carried by %%hook, not by %%workflow. A reader that cannot find %%hook has no entity binding and falls back to the caller-supplied default."
    },
    triggers: {
      description: "The events an automation can start from. These are the entity lifecycle hooks the generated services already fire, so a trigger is not a new concept — it is the hook, named the way someone describing their business would name it. `%%hook` carries the hook name; the builder shows the event name.",
      directive: "%%hook <hookName> on <Entity>",
      note: "This is the two-token form of %%hook — event and entity, with no handler name. The three-token handler form (`%%hook beforeCreate hashPassword on User`) is the hook-binding directive documented under `hooks` and is a different construct.",
      events: [
        {
          event: "created",
          hook: "afterCreate",
          phase: "after",
          blocking: false,
          purpose: "Runs after the record is written. The record already exists."
        },
        {
          event: "beforeCreated",
          hook: "beforeCreate",
          phase: "before",
          blocking: true,
          purpose: "Runs before the record is written, so it can still block the write."
        },
        {
          event: "updated",
          hook: "afterUpdate",
          phase: "after",
          blocking: false,
          purpose: "Runs after the change is saved."
        },
        {
          event: "beforeUpdated",
          hook: "beforeUpdate",
          phase: "before",
          blocking: true,
          purpose: "Runs before the change is saved, so it can still block it."
        },
        {
          event: "deleted",
          hook: "afterDelete",
          phase: "after",
          blocking: false,
          purpose: "Runs after the record is removed."
        },
        {
          event: "beforeDeleted",
          hook: "beforeDelete",
          phase: "before",
          blocking: true,
          purpose: "Runs before the record is removed, so it can still block it."
        }
      ]
    },
    conditions: {
      description: "A flat list of checks that must ALL pass for the steps to run. There is no OR and no nesting: an author who needs alternatives writes a second automation, which stays readable where a boolean tree does not. Zero conditions means the automation always runs.",
      directive: "%%guard <field> <operator> <jsonValue>",
      valueEncoding: 'JSON.stringify — so a string value is quoted (`"open"`) and a number is bare (`3`). Operators of arity 0 still emit a value token, which readers ignore.',
      resolvedConflict: {
        was: "%%guard once meant both an automation condition and an RBAC role restriction — one keyword, two unrelated meanings.",
        resolution: "The RBAC sense was renamed to %%rbac. That side was renamed rather than the automation side because it had no shipped parser and no stored data: it existed only in this definition and the spec, so the rename costs nothing, while renaming the condition form would have meant rewriting every stored automation.",
        compatibility: 'A model written before the rename may still carry `%%guard role:... on <Entity>.<op>`. The automation reader detects that shape and skips it instead of parsing it as a check on a field called "role:admin" with an operator of "on" — a condition that can never pass, which would silently disable the automation.'
      },
      operators: [
        {
          id: "eq",
          label: "is",
          arity: 1
        },
        {
          id: "neq",
          label: "is not",
          arity: 1
        },
        {
          id: "gt",
          label: "is greater than",
          arity: 1
        },
        {
          id: "gte",
          label: "is greater than or equal to",
          arity: 1
        },
        {
          id: "lt",
          label: "is less than",
          arity: 1
        },
        {
          id: "lte",
          label: "is less than or equal to",
          arity: 1
        },
        {
          id: "contains",
          label: "contains",
          arity: 1
        },
        {
          id: "startsWith",
          label: "starts with",
          arity: 1
        },
        {
          id: "isEmpty",
          label: "is empty",
          arity: 0
        },
        {
          id: "isNotEmpty",
          label: "is not empty",
          arity: 0
        },
        {
          id: "changed",
          label: "changed",
          arity: 0
        }
      ]
    },
    steps: {
      description: "An ordered list. Each step gets a generated node id (`s1`, `s2`, …) and one `type:` line, followed by one line per property. A step may name its result with `as:`, which publishes a reference later steps can read.",
      directives: [
        "%%step <nodeId> type: <StepType> [as: <resultName>]",
        "%%step <nodeId> <propertyKey>: <value>",
        "%%step <nodeId> table: <decisionTableJson>"
      ],
      types: [
        {
          type: "Decision",
          purpose: "Evaluate a rule table and publish its outputs.",
          properties: ["ruleTable", "inputs"],
          example: `%%step s1 type: Decision as: tier
%%step s1 ruleTable: Assay tier`
        },
        {
          type: "CreateEntity",
          purpose: "Create a record on another entity.",
          properties: ["entity", "values"],
          example: `%%step s2 type: CreateEntity as: newId
%%step s2 entity: ChemicalInventory`
        },
        {
          type: "UpdateEntity",
          purpose: "Write a field, by default on the triggering record.",
          properties: ["entity", "field", "value"],
          example: `%%step s3 type: UpdateEntity
%%step s3 field: status
%%step s3 value: {{tier}}`
        },
        {
          type: "DeleteEntity",
          purpose: "Remove a record.",
          properties: ["entity", "target"],
          example: `%%step s4 type: DeleteEntity
%%step s4 entity: Vendor`
        },
        {
          type: "Formula",
          purpose: "Compute a value from two operands and publish it.",
          properties: ["operation", "left", "right"],
          example: `%%step s5 type: Formula as: total
%%step s5 operation: add
%%step s5 left: {{order.subtotal}}
%%step s5 right: 9`
        },
        {
          type: "REST",
          purpose: "Call an external service.",
          properties: ["method", "url", "body"],
          example: `%%step s6 type: REST
%%step s6 method: POST
%%step s6 url: https://lims.example.com/hook`
        }
      ]
    },
    references: {
      description: "What a step can read: fields of the triggering record, and the published results of every step above it. A reference is written in double braces and resolved positionally — a step can only see what precedes it, which is what makes the ladder safe to reorder.",
      form: "{{<name>}}",
      sources: [
        "{{<entity>.<field>}} — a field of the triggering record, entity name lowercased",
        "{{<resultName>}} — the result of an earlier step, named by its `as:`"
      ]
    },
    loops: {
      description: "Repeat while a rule holds. `%%loop <loopId> while: <field> <operator> <value>` declares one, and a step joins it with `%%step <nodeId> in: <loopId>`. The member steps run in order and repeat for as long as the check passes; the loop ends the first time it fails. The check is re-evaluated before every pass against the record as it stands then — a step inside the loop changes the record, and that change is what ends the loop.",
      directives: [
        "%%loop <loopId> while: <field> <operator> <value> max: <n>",
        "%%step <nodeId> in: <loopId>"
      ],
      operators: "The same eleven as automations.conditions — one vocabulary for every check in the language.",
      safety: {
        required: true,
        form: "max: <n>",
        note: "Every loop must declare its own ceiling; there is no default and no engine-wide constant. A while-loop is genuinely unbounded, and an automation runs inside the write that triggered it, so a check that never fails holds a database transaction open until something times out. After `max` passes the loop is abandoned and the run is marked FAILED with the loop and the limit named. This is a backstop, not a second way to spell the count: reaching it means the automation is wrong, so it is reported rather than finishing quietly as though the loop had ended on its own.",
        whyPerLoop: "How many passes is obviously too many is a property of the work, not of the engine. A retry that should give up after 5 and a reconciliation that legitimately runs 800 cannot share one number without the ceiling being meaningless for one of them.",
        minimum: 1,
        maximum: "none — the author owns the number",
        missing: "A loop with no `max` is refused by the builder and warned about by the compiler. An executor meeting one anyway runs a single pass and gives up, because the safe direction for a loop nobody bounded is not to run it."
      },
      staticCheck: "A loop whose check reads a field that no member step writes is refused when the model is compiled: it would read the same every pass, so it either never runs or runs until the safety limit cuts it off. The check is deliberately shallow — only UpdateEntity writes are matched by field name, and every other step type is treated as able to change anything, so it reports only the case it is certain about.",
      nesting: "Not supported. A loop may not contain another loop; a step names at most one `in:`. Flattening nested repeats is what makes the ladder readable and the cost predictable.",
      references: "Steps inside a loop see the same values as steps outside it, plus `{{<loopId>.iteration}}` — the 1-based pass number. A value published by a step inside the loop is overwritten on each pass, so after the loop it holds what the last pass produced.",
      drawnAs: "A Mermaid `subgraph <loopId>[Repeat while <check>]` wrapping the member nodes, so the repetition is visible in any renderer rather than living only in the directives."
    },
    nodes: {
      description: "The drawn flowchart carries no semantics — it exists so the document renders as a diagram. Every node is regenerated from the directives on write, and readers take meaning only from the %% lines.",
      start: "start([<Entity> <trigger label>])",
      guard: "guard{<conditions joined by ' and '}}",
      step: "s<n>[<step summary>]",
      loop: "subgraph <loopId>[Repeat <n> times] … end",
      done: "done([Done])"
    }
  },
  directives: {
    description: "Reserved %% directive comments. All are renderer-safe (ignored by Mermaid) and interpreted by the generator. %%hook, %%step, %%action, %%workflow and %%guard are parsed by the shipped compilers; the remainder are the EML extension surface, documented here as the authoritative language contract.",
    reserved: [
      {
        keyword: "%%meta",
        form: "%%meta <key>: <value>",
        status: "compiled",
        consumedBy: [
          "language/composer.ts (section classification and round-trip)",
          "packages/generator/src/eml (section extraction via composer)"
        ],
        purpose: "Document/section metadata: name, kind (erd|rules|workflow), version, entity binding, description (application summary seeded into sys_system.APP_DESCRIPTION and the generated manual), stack.",
        examples: [
          "%%meta name: CRM Core",
          "%%meta kind: rules",
          "%%meta entity: Order",
          "%%meta version: 1.0.0",
          "%%meta description: This application manages customer relationships, sales pipelines, and support tickets for mid-market B2B companies."
        ]
      },
      {
        keyword: "%%hook",
        form: "%%hook <type> <handler> on <Entity>[<params>]   |   %%hook <type> on <Entity>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/hooks/index.ts (handler form -> lifecycle handler modules)",
          "packages/web/src/lib/automation/model.ts (two-token form -> automation trigger)"
        ],
        purpose: "Bind an entity lifecycle event. The three-token form names a handler to run (SHIPPED, parsed by hook-parser.ts). The two-token form omits the handler and is the automation trigger: it says which event starts the automation and on which entity, with the steps carried by %%step (SHIPPED, parsed by automation/model.ts).",
        examples: [
          "%%hook beforeCreate hashPassword on User",
          "%%hook afterCreate on DeviationReport"
        ]
      },
      {
        keyword: "%%step",
        form: "%%step <nodeId> <stepType> <key>: <value> ...   |   %%step <nodeId> type: <stepType> [as: <name>]",
        status: "compiled",
        consumedBy: ["packages/generator/src/workflows/steps.ts"],
        purpose: "Bind a flowchart node in a `kind: saga` workflow to an executable step. `nodeId` is the node's id in the flowchart; `stepType` is one of workflowConstructs.stepNodes.types. Compiles to a bpmn:serviceTask (SHIPPED, parsed by packages/generator/src/workflows/index.ts).",
        examples: [
          "%%step B Formula target: baseDays operation: set value: 3",
          '%%step C CreateEntity entity: Capa as: newCapaId fields: {"title":"capaTitle","status":"open"}',
          "%%step D UpdateEntity field: status value: escalated",
          "%%step F DeleteEntity entity: Capa targetSource: supersededCapaId"
        ]
      },
      {
        keyword: "%%action",
        form: "%%action <name> <actionType> when: <expr> <key>: <value> ...",
        status: "compiled",
        consumedBy: ["packages/generator/src/rules/index.ts"],
        purpose: "Declare a side-effecting rule action inside a `%%rule` section. A section carrying %%action directives compiles to a GoRules decision table — one row per directive — instead of a node graph, which is the shape the rules engine reads actions from (SHIPPED, parsed by packages/generator/src/rules/index.ts).",
        examples: [
          '%%action escalate trigger-workflow when: severity == "critical" workflow: CriticalDeviationEscalation',
          "%%action requireCause validation-error when: root_cause == null message: A root cause is required"
        ]
      },
      {
        keyword: "%%entity",
        form: "%%entity <Name> <key>: <value>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/parsers/mermaid.parser.ts (help:/description:, icon: and parent: are compiled; prefix:, softDelete:, label: and audited: are validated only)",
          "language/checker.ts (EML160, EML161, EML162)"
        ],
        purpose: "Attach entity-level metadata not expressible in the ERD block: the sentence that explains the entity to whoever opens its screen, the icon that represents it, the parent it is a line item of, plus table prefix (bus/sys), soft delete, label, audited.",
        examples: [
          "%%entity Account help: A company you sell to. One account holds many contacts and every deal you run with them.",
          "%%entity Patient icon: stethoscope",
          "%%entity Order audited: true",
          "%%entity Account prefix: bus",
          "%%entity Session softDelete: false"
        ],
        iconNaming: "`icon:` is a lucide icon name (https://lucide.dev/icons). PascalCase, kebab-case and snake_case all resolve to the same icon - LayoutGrid, layout-grid and layout_grid are one. A name lucide does not have is NOT a diagnostic (the checker does not carry lucide's catalogue) and renders a placeholder instead: `icon: flask` is the common trap, because lucide has `flask-conical` and no `flask`. Compiled to sys_table.icon, which is what the entity's dashboard card, its window heading and the navigation all draw. An administrator can override it afterwards in Table and Column, including by uploading an image - the same column holds both. In the browser (--standalone) stack the value is carried into model.json and served by /model, but that interface draws a text glyph and does not render it."
      },
      {
        keyword: "%%field",
        form: "%%field <Entity>.<attr> <key>: <value>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/parsers/mermaid.parser.ts (the `enum:` and `help:` keys; the other keys are reserved)"
        ],
        purpose: "Extended field metadata: enum reference and help text, both compiled; ui control, default value, min/max and format are reserved.",
        examples: [
          "%%field Order.status enum: OrderStatus",
          "%%field Contact.account_id help: The company this person works for. Leave empty for a personal contact.",
          "%%field Product.price min: 0",
          "%%field User.email unique: true"
        ]
      },
      {
        keyword: "%%enum",
        form: "%%enum <Name>: <value1>, <value2>, ...",
        status: "compiled",
        consumedBy: ["packages/generator/src/parsers/mermaid.parser.ts"],
        purpose: "Declare a named enumeration reusable by fields and by state workflows.",
        examples: ["%%enum OrderStatus: draft, submitted, approved, shipped, cancelled"]
      },
      {
        keyword: "%%category",
        form: "%%category name: <Name>; code: <id>; description: <text>; icon: <LucideIcon>; color: <#hex>; seq: <n>; default: true; entities: <A>, <B>",
        dashboardScope: "A category block appears on the dashboard only when the reader may read at least one entity in it: the entity list is filtered by `%%rbac ... .read` and line items are excluded, because a child is reached through its parent. The Application Dictionary block beside the categories is the admin windows the reader is granted through sys_access, so it differs by role too.",
        iconNaming: "A lucide icon name (https://lucide.dev/icons). PascalCase, kebab-case and snake_case all resolve to the same icon - LayoutGrid, layout-grid and layout_grid are one. A name lucide does not have is NOT a diagnostic (the checker does not carry lucide's catalogue) and renders a placeholder instead: `icon: flask` is the common trap, because lucide has `flask-conical` and no `flask`. Compiled to sys_category.icon and drawn beside the category heading on the dashboard.",
        status: "compiled",
        consumedBy: ["packages/generator/src/parsers/category.parser.ts"],
        purpose: 'Group business entities into a named Application Dictionary category. The dashboard renders one block per category, ordered by name; the admin dictionary maintains them. Only `name` is required; the rest are `;`-separated and may appear in any order. `code` is a stable short identifier, slugified from `name` when omitted — it is the dictionary row\'s key, so setting it explicitly keeps that key stable across a rename. A directive may span several lines by ending each continued line with `\\`. A model that declares none gets a single "General" default holding every entity.',
        examples: [
          "%%category name: Compound Registry; description: Structures and aliases; icon: FlaskConical; color: #6366f1; entities: Compound, CompoundAlias",
          "%%category name: People and Teams; default: true; entities: User, Team"
        ]
      },
      {
        keyword: "%%index",
        form: "%%index <Entity>(<attr>[, <attr>...]) [unique]",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/parsers/mermaid.parser.ts -> entity.indexes -> templates/common/migrations/bus-tables.migration.ts.hbs"
        ],
        purpose: "Declare a database index over one or more attributes.",
        examples: ["%%index Contact(email) unique", "%%index Order(company_id, status)"]
      },
      {
        keyword: "%%rule",
        form: "%%rule <name> on <Entity> event: <lifecycle> priority: <n>",
        status: "validated",
        consumedBy: ["language/checker.ts (rule/workflow cross-reference)"],
        purpose: "Bind a business-rule decision flow (a rules section) to an entity and lifecycle event.",
        examples: ["%%rule pricing on Order event: beforeCreate priority: 10"]
      },
      {
        keyword: "%%guard",
        form: "%%guard <field> <operator> <jsonValue>",
        status: "compiled",
        consumedBy: ["packages/web/src/lib/automation/model.ts"],
        purpose: `Automation condition — a check that must pass for an automation's steps to run (SHIPPED, parsed by automation/model.ts, and the form all stored automations use). This keyword once also meant an RBAC role restriction; that sense is now %%rbac. A reader encountering the old RBAC shape here skips it rather than reading it as a condition on a field called "role:admin".`,
        examples: ['%%guard status eq "open"', "%%guard order.total gt 1000"]
      },
      {
        keyword: "%%loop",
        form: "%%loop <loopId> while: <field> <operator> <value> max: <n>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/workflows/steps.ts",
          "packages/web/src/lib/automation/model.ts"
        ],
        purpose: "Declare a repeat-while-a-rule-holds loop inside an automation (SHIPPED, parsed by automation/model.ts and the generator's saga compiler). Steps join it with `%%step <nodeId> in: <loopId>` and repeat in order for as long as the check passes, ending the first time it fails. The check is re-read before every pass, so a step inside the loop is what ends it. Bounded by the `max:` the author must declare; loops do not nest. See automations.loops.",
        examples: ['%%loop L1 while: status eq "pending" max: 20', "%%step s2 in: L1"]
      },
      {
        keyword: "%%rbac",
        form: "%%rbac <roleExpr> on <Entity>.<op>   where <op> is a CRUD operation (create|read|update|delete|*) or a transition event in <Entity>'s state machine",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/rbac/index.ts (compiles both forms)",
          "packages/generator/src/rbac/roles.ts (derives the roles, one seeded account each, and per-entity visibility)",
          "seeded into sys_operation_access / sys_transition_access",
          "enforced by the generated EntityAccessGuard on /bus CRUD",
          "app-and-report-with-ai-tanstack: common/build/reporting-pack.ts -> one reporting role per declared role, scoped to the tables that role may read"
        ],
        purpose: "Restrict a CRUD operation or a state transition to named roles. It restricts rather than grants: a target no directive mentions is open to any authenticated caller, so a model declaring no %%rbac generates what it always did. A target with one or more directives requires the union of the roles they name. A master role bypasses. That bypass is over access — who may do a thing — and not over the shape of the model: a state machine's topology is enforced for the master role too, because an edge the diagram never drew is a move that does not exist rather than a permission anyone is missing (see workflowConstructs.stateForm.enforcement). Role names are matched case-insensitively, because seeded roles are title-cased (Manager) and directives are written lower-case (role:manager) - an exact match would make such a rule unsatisfiable, locking out exactly the people it was written to admit. Spelled %%guard until that keyword was needed unambiguously for automation conditions.",
        examples: [
          "%%rbac role:admin on Order.delete",
          "%%rbac role:sales|manager on Deal.update",
          "%%rbac role:admin on Customer.*",
          "%%rbac role:sales_manager on Quote.approve",
          "%%rbac role:sales_rep|sales_manager|support_agent on Account.read"
        ],
        notes: {
          operations: "create | read | update | delete, plus * for all four. Aliases are accepted (insert/add, view/select/list, edit/write/modify, remove/destroy).",
          transitions: "A name that is not a CRUD operation is resolved against the entity's stateDiagram-v2 transitions. There is no named-transition endpoint in a generated application - moving a record along an edge is a status update - so the rule is stored as the (from_state, to_state) pair it covers and the guard recognises the move by the states the write crosses. Both ends are kept because one event can sit on several edges and two events can reach the same state. This directive decides *who* may cross an edge; whether the edge exists at all is decided by the state diagram itself and enforced separately, so an edge no %%rbac names is open to any authenticated caller but an edge the diagram omits is refused to everyone.",
          notSysAccess: "A restriction on any operation other than read deliberately does not write sys_access. That is a grant table feeding sys_refresh_dictionary_scope(), where the first row added narrows a window to one role; a restriction on deleting must not become a restriction on looking. read is the one exception, and it is the exception on purpose - see functionalRoles.",
          functionalRoles: "read is the operation that decides which functional role an entity belongs to, and the only one that changes what a role sees. An entity a role may not read is absent from that role's navigation entirely - no menu entry, no dashboard card, no lookup - because a menu full of entries that answer 403 is a worse application than a shorter one. A model is expected to name every entity on at least one `%%rbac ... .read` directive, so that every entity belongs to somebody. Declaring none leaves every entity visible to every signed-in caller, which is what every model did before this rule existed.",
          seededAccounts: "Every role a directive names is created, and one account is seeded holding it, beside the administrator who bypasses everything and a role-less User. An application whose only account is the administrator cannot demonstrate its own access control, because the administrator is exempt from all of it. Both stacks derive the same list from rbac/roles.ts, and both sign-in screens print it with the number of entities each role can see.",
          reportingRoles: "Deployed beside the Enterprise Reporting platform (app-and-report-with-ai-tanstack, ./start.sh), the same directive also shapes that platform's roles: one reporting role per declared role, permitted to read exactly the bus_ tables the role's `read` rules admit. It is a mirror, not a shared system. The two products have separate databases, separate user tables and separate sign-in screens, and a role name means different things on each side: in the application it decides what a user may do to a record, in the reporting platform which tables their queries may read. The accounts differ deliberately - sales.manager@<app>.example.com against sales.manager@<app>.reports.example.com - so neither is mistaken for the other, and the front door at / lists both pairs. Only `read` rules narrow a reporting role; create, update and delete restrictions mean nothing to a reader who cannot write through that product at all."
        }
      },
      {
        keyword: "%%trigger",
        form: "%%trigger <source> -> <handler> on <Entity>",
        status: "validated",
        consumedBy: ["language/checker.ts (EML230-EML233)"],
        purpose: "Declare an event/schedule source that starts a workflow (webhook, cron, message).",
        examples: [
          "%%trigger cron:0 0 * * * -> expireQuotes on Quote",
          "%%trigger webhook:payment -> markPaid on Order"
        ]
      },
      {
        keyword: "%%workflow",
        form: "%%workflow <name> entity: <Entity> kind: <hook|state|saga>   |   %%workflow name: <name>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/workflows/index.ts (saga + state forms)",
          "packages/web/src/lib/automation/model.ts (automation form)"
        ],
        purpose: "Name and classify a workflow section. The positional form binds the entity itself. The `name:` form is what the automation builder writes (SHIPPED): it carries only the name and takes its entity binding from the accompanying %%hook line.",
        examples: [
          "%%workflow OrderFulfillment entity: Order kind: state",
          "%%workflow name: Escalate critical deviations"
        ]
      },
      {
        keyword: "%%report",
        form: "%%report <name> title: <Title> [entity: <Entity>] [chart: bar|line|pie|area x: <col> y: <col>] [help: <why it is asked>] sql: <query>",
        status: "compiled",
        consumedBy: [
          "packages/generator/src/reports/index.ts -> sys_report (NestJS) and model.json reports (browser)",
          "language/cli/src/parser.ts -> model.reports",
          "language/checker.ts (shape only: EML290-EML296)"
        ],
        purpose: "Declare a question the application's users actually ask, as the SQL that answers it. The reporting pack already derives a baseline from structure alone - a register per entity, a breakdown per %%enum-bound column, a lifecycle per state machine, children per oneToMany - and that baseline describes the shape of the data and nothing about the business running on it. Nothing in an ERD says that a dispatcher's first question every morning is which jobs have no engineer assigned. This directive is where that knowledge is written down, so it travels with the model rather than being rebuilt by hand in the reporting tool after every regeneration.",
        examples: [
          "%%report unassigned-jobs title: Jobs with no engineer help: The dispatcher's first question every morning. sql: SELECT reference, scheduled_for FROM bus_job WHERE engineer_id IS NULL AND status = 'scheduled' AND deleted_at IS NULL ORDER BY scheduled_for",
          "%%report pipeline-by-owner title: Pipeline by owner entity: Opportunity chart: bar x: owner y: total help: What each rep is carrying, for the weekly review. sql: SELECT u.first_name AS owner, SUM(o.amount) AS total FROM bus_opportunity o JOIN bus_user u ON u.id = o.owner_id WHERE o.deleted_at IS NULL GROUP BY 1 ORDER BY total DESC"
        ],
        notes: {
          sqlIsLast: "`sql:` takes the rest of the line, because a query contains spaces and colons and would otherwise be shredded by the key scan. Every other key is read from the head, ahead of it.",
          readOnly: "A report may only read, and this is refused three times: by the checker at authoring time (EML293), by the compiler before the query can reach a seed file or model.json, and by each runtime before it executes - because sys_report is an ordinary table and model.json an ordinary file, so neither reader trusts what it is handed. A single trailing semicolon is allowed; a second statement behind it is not. Anything that writes belongs in a rule or a hook.",
          foreignKeysAreUuid: "A foreign key and a primary key are both UUID, in both stacks, so a join is written plainly: ON c.account_id = p.id. Do not cast. `::text` was needed while the browser stack typed a foreign key as VARCHAR; it does not any more, and PostgreSQL has no implicit cast back, so a cast that is no longer needed is now the thing that breaks the query.",
          chartNeedsAxes: "`chart:` without both `x:` and `y:` is an error (EML294) rather than a silent fall back to a table: a chart that cannot say what it plots renders empty, which reads as no data rather than as a missing declaration.",
          namesAreKeys: "The name is the pack key, so a duplicate silently replaces the earlier report. Declared twice is an error (EML292).",
          againstWhichSchema: "The query runs against the *generated application's* database, so it names `bus_` tables. It is not checked against a live schema at author time - the checker has no database - but `check-reporting-pack.ts in the orchestrator` executes every query in the pack against a real generated schema in CI.",
          whereItIsCompiled: "Compiled twice, by two readers, and neither replaces the other. Here, packages/generator/src/reports/index.ts puts each report into the generated application itself: a sys_report row served at /sys/reports and shown under Admin > Analysis in the NestJS stack, and a model.json entry served at /api/reports and shown under Reports in the browser application. Separately, businessappwithai/app-and-report-with-ai-tanstack compiles the same directive with common/build/reporting-pack.ts into a saved query, a report definition and, where chart: is set, a chart, seeded into the Enterprise Reporting platform ahead of the derived baseline. That platform is composed beside a deployed application by docker-compose; it is not in the browser application and not in the downloadable zip."
        }
      }
    ],
    statusVocabulary: {
      compiled: "A shipped compiler reads this directive and it changes the generated application. `consumedBy` names the file that reads it.",
      validated: "No compiler reads it, but `language/checker.ts` enforces its syntax and cross-references, so a malformed one fails validation rather than being silently ignored.",
      reserved: "Documented and renderer-safe, with no reader. Writing one is legal and inert; the keyword is held so a later meaning cannot collide with a plain comment."
    }
  },
  grammar: {
    notation: "EBNF-like; see language/grammar/appwithai.ebnf for the full grammar.",
    topLevel: "document ::= ( comment | directive | erdSection | ruleSection | workflowSection | blankLine )*",
    erdSection: "erdSection ::= 'erDiagram' NEWLINE ( entityBlock | relationship | comment )*",
    entityBlock: "entityBlock ::= IDENT '{' NEWLINE attribute* '}' NEWLINE",
    attribute: "attribute ::= TYPE ['(' NUMBER ')'] IDENT modifier* [ STRING ] NEWLINE",
    relationship: "relationship ::= IDENT cardinality IDENT [ ':' STRING ] NEWLINE",
    ruleSection: "ruleSection ::= ('flowchart'|'graph') direction NEWLINE ( node | edge | actionDirective | comment )*",
    workflowSection: "workflowSection ::= (('flowchart'|'graph') direction | 'stateDiagram-v2') NEWLINE ( node | edge | transition | hookDirective | stepDirective | comment )*",
    stepDirective: "stepDirective ::= '%%step' WS IDENT WS stepType ( WS IDENT ':' WS value )* NEWLINE",
    actionDirective: "actionDirective ::= '%%action' WS IDENT WS actionType WS 'when:' WS expr ( WS IDENT ':' WS value )* NEWLINE"
  },
  generatorContract: {
    description: "How each section feeds the generator pipeline.",
    pipeline: [
      "1. ERD section -> MermaidParser -> Entity[] + Relationship[] -> migrations, DTOs, services, controllers, forms, tables. The same pass reads %%index into entity.indexes and %%enum / %%field enum: into bound enums.",
      "2. %%category directives -> category.parser -> resolveCategories -> Application Dictionary groups on the generated dashboard. A model declaring none gets a single 'General' category holding every entity.",
      "3. Rules section -> flowchart-parser -> jdm-converter -> GoRules JDM graph -> seeded into sys_rule_definitions and evaluated by the rules engine.",
      "4. Rules section carrying %%action directives -> compileRules -> a GoRules decision table whose rows carry action/message/ruleId/workflowName outputs, instead of a node graph. This is how a model-declared rule reaches a model-declared saga: the rule's `when` expression decides, and its trigger-workflow action names the workflow.",
      "5. Workflow section, hook form -> compileHooks -> per-entity handler modules under src/modules/hooks/handlers plus a registry the bus service calls around every CRUD operation.",
      "6. Workflow section, state form -> compileWorkflows -> BPMN seeded into sys_workflow_definitions; the trigger-workflow rules resolve it by name and the run puts a new record into the state machine's starting state. The same pass writes every edge the diagram draws into sys_workflow_transitions, which EntityAccessGuard reads to refuse a status write the model never allowed for, and which GET /api/workflows/transitions exposes so a screen can offer only the moves that exist.",
      "7. Workflow section, saga form -> compileSagaWorkflows -> one bpmn:serviceTask per %%step, ordered by the flowchart edges, seeded into sys_workflow_definitions with source 'model'. A definition declared in the model is owned by the model: the generated Workflow Designer shows it read-only, and regeneration rewrites it. Definitions authored in the app carry source 'designer' and are never touched by regeneration.",
      "8. The whole document -> language/rag.ts -> retrieval chunks (one per entity, rule, workflow and spec section) -> the pgvector model_context index the assistant searches.",
      "9. %%rbac directives -> compileRbac -> per-operation rules in sys_operation_access and per-transition rules in sys_transition_access, enforced by EntityAccessGuard on the generated /bus CRUD routes. Restrictive, not granting: a target no directive names stays open.",
      "10. ERD section -> nestjs-backend.generator -> one default AnkaReport layout per entity seeded into sys_report_designs. The layout renders every non-audit, non-PK field as a two-column (label | value) report. Administrators can customise layouts at Admin → Report Designs. Records get a Print button on their detail view if a design exists for their table.",
      "11. %%enum and %%workflow kind: state -> the generated test suite's harness/model.ts, which carries the declared values and edges into the suites as data. This is the one consumer that reads the model rather than the dictionary compiled from it, and the distinction is the point: a suite that asserts a running application against the dictionary the same generator wrote proves only that the application is self-consistent, and passes just as happily when a value or an edge was dropped on the way. Asserting against the model's own word is what makes a dropped %%enum value or a missing state-machine edge fail a test rather than ship. Read by suite 02c (references) and suite 06b (state machines)."
    ],
    referenceFiles: {
      pipeline: "packages/generator/src/pipeline/generate-application.ts",
      erdParser: "packages/generator/src/parsers/mermaid.parser.ts",
      categoryParser: "packages/generator/src/parsers/category.parser.ts",
      flowchartParser: "packages/generator/src/rules/flowchart-parser.ts",
      jdmConverter: "packages/generator/src/rules/jdm-converter.ts",
      ruleCompiler: "packages/generator/src/rules/index.ts",
      hookCompiler: "packages/generator/src/hooks/index.ts",
      workflowCompiler: "packages/generator/src/workflows/index.ts",
      stepCompiler: "packages/generator/src/workflows/steps.ts",
      composer: "language/composer.ts",
      chunker: "language/rag.ts",
      checker: "language/checker.ts",
      orchestrator: "packages/generator/src/generators/orchestrator.ts",
      rbacCompiler: "packages/generator/src/rbac/index.ts",
      testHarnessModel: "packages/generator/templates/tanstack-start-nestjs/tests/harness/model.ts.hbs"
    },
    authoringSurface: {
      description: "The web app keeps its own parsers for the editors, which run in the browser and cannot import the generator. They read the same syntax, but they do not decide what is generated - when the two disagree, the generator's copy is the language and the web copy is the bug.",
      flowchartParser: "packages/web/src/lib/mermaid-flowchart-parser.ts",
      jdmConverter: "packages/web/src/lib/jdm-converter.ts",
      hookParser: "packages/web/src/lib/workflow/hook-parser.ts",
      automationModel: "packages/web/src/lib/automation/model.ts",
      ruleFlow: "packages/web/src/lib/eml/rule-flow.ts",
      workflowFlow: "packages/web/src/lib/eml/workflow-flow.ts"
    }
  },
  conformance: {
    levels: {
      core: "erDiagram entities, attributes with PK/FK/UK/OPTIONAL/NULL/UNIQUE, and all 8 relationship cardinalities. Plus the directives the same parse pass reads: %%index (real DDL indexes), %%enum and %%field enum: (bound enums), and %%category (dashboard grouping). Fully compiled.",
      rules: "flowchart decision flows converted to JDM by shape semantics, and %%action directives compiled to a GoRules decision table. Fully compiled.",
      workflows: "%%hook directives in both forms (all 13 hook types), stateDiagram-v2 state machines, and %%workflow kind: saga with its %%step and %%loop directives. All three forms are compiled and seeded; the automation dialect is the same saga machinery authored through the builder.",
      help: "%%field <Entity>.<column> help: and %%entity <Name> help: (or description:). Both are compiled: the parser hangs the text on the attribute and the entity, the dictionary generator writes it to sys_column.description and sys_table.description, and the generated application shows it under the field and beside the table. It has a second consumer: packages/generator/src/manual/index.ts renders manual.html from the same parsed model, where this text is the entire 'what it is for' column — a field with no help prints a dash there. Write help on every entity and every column, and write domain knowledge rather than the name again: EML151, EML152 and EML153 report the three ways a model fails to. See applicationDictionary.helpText. Fully compiled.",
      validated: "%%rule and %%trigger, and the %%entity keys other than help:/description:. No compiler reads these yet, but language/checker.ts enforces their syntax and cross-references, so a malformed one fails validation instead of being silently dropped.",
      reserved: "The %%field keys other than enum: and help:. Renderer-safe and documented, with no reader. Writing one is legal and inert.",
      access: "%%rbac, in both its CRUD and state-transition forms. Compiled to sys_operation_access / sys_transition_access and enforced by the generated EntityAccessGuard."
    },
    validationRules: [
      "Every entity name must match ^[a-zA-Z][a-zA-Z0-9_]*$ and be unique within the document.",
      "Every relationship endpoint should reference a declared entity.",
      "A hook directive's entity should reference a declared entity; its type must be one of the 13 hook types.",
      "A rules flow must have at least one input (stadium/start) and one output (stadium/end).",
      "Enum references in %%field must resolve to a declared %%enum.",
      "A %%step's nodeId must name a node that exists in the flowchart it annotates.",
      "A %%step's stepType must be one of workflowConstructs.stepNodes.types.",
      "A %%loop's loopId must be referenced by at least one %%step in: directive, and loops do not nest.",
      "At most one %%category in a document may declare default: true.",
      "A trigger-workflow action must name a workflow the document declares, or a workflow that already exists in the target application.",
      "A %%rbac operation must be a CRUD operation (create/read/update/delete/*) or a transition event declared in the entity's state machine."
    ],
    note: "Levels describe what the shipped generator does, not an aspiration. A directive's own `status` field in `directives.reserved` is authoritative for that directive; these levels group them. When a compiler is added for a reserved directive, its status and this list move together."
  },
  diagnostics: {
    description: "The checker (language/checker.ts) validates a document against this definition and writes a machine-readable <file>.mmd.error beside it. The fixer (language/fixer.ts) reads that file, applies the auto-fixable corrections to the source, and re-runs the checker.",
    severities: {
      error: "The document is wrong and the generator would produce something incorrect or nothing at all. Exit code 1.",
      warning: "Legal, but almost certainly not what the author meant - a dropped modifier, a state with no enum. Exit code 1 only under --strict.",
      info: "An observation worth reading once; never fails a run."
    },
    codeRanges: {
      "EML001-EML099": "Document level: metadata, emptiness, section structure.",
      "EML100-EML119": "Entities and attributes.",
      "EML120-EML129": "Relationships.",
      "EML130-EML199": "Directives attached to the ERD: %%enum, %%field, %%entity, %%index, %%category — including the line-item pair EML149 and EML150.",
      "EML200-EML299": "Hooks, guards, triggers, workflows and rules as declared by directives.",
      "EML300-EML399": "Business-rule flowcharts.",
      "EML400-EML449": "Workflow sections: hook, state and saga.",
      "EML500-EML599": "Cross-section consistency."
    },
    autoFixable: {
      EML001: "Missing %%meta name - inserts one derived from the first entity.",
      EML103: "Column is added by the generator anyway - deletes the declared line.",
      EML112: "Duplicate attribute - deletes the later line, keeping the stronger constraints.",
      EML114: "Foreign key not ending in _id - appends the suffix.",
      EML117: "Entity has no primary key - prepends `string id PK`.",
      EML287: "Rule condition names a camelCase identifier - rewrites it as the snake_case column.",
      EML421: "State workflow has no initial transition - inserts `[*] --> <firstState>`.",
      EML422: "State workflow has no terminal state - appends `<lastState> --> [*]`."
    },
    note: "language/checker.ts AUTO_FIXABLE_CODES and the fixer's dispatch table must list the same codes; a code in one and not the other is either a fix that never runs or a promise the fixer cannot keep."
  }
};
var FALLBACK_TYPE_MAP = {
  string: "string",
  varchar: "string",
  char: "string",
  text: "text",
  longtext: "text",
  int: "integer",
  integer: "integer",
  bigint: "integer",
  smallint: "integer",
  number: "decimal",
  decimal: "decimal",
  float: "decimal",
  double: "decimal",
  money: "decimal",
  amount: "decimal",
  bool: "boolean",
  boolean: "boolean",
  date: "date",
  datetime: "datetime",
  timestamp: "datetime",
  time: "datetime",
  json: "json",
  jsonb: "json",
  object: "json",
  array: "json",
  uuid: "string",
  guid: "string",
  id: "string",
  email: "string",
  url: "string",
  phone: "string",
  password: "string",
  color: "string"
};
var FALLBACK_CARDINALITY_MAP = [
  { operator: "||--||", kind: "oneToOne" },
  { operator: "||--o{", kind: "oneToMany" },
  { operator: "||--|{", kind: "oneToMany" },
  { operator: "}o--||", kind: "manyToOne" },
  { operator: "}|--||", kind: "manyToOne" },
  { operator: "}o--o{", kind: "manyToMany" },
  { operator: "}|--|{", kind: "manyToMany" },
  { operator: "|o--o|", kind: "oneToOne" }
];
var cachedDefinition;
function loadDefinition() {
  if (cachedDefinition !== undefined)
    return cachedDefinition;
  try {
    cachedDefinition = EMBEDDED_LANGUAGE_DEFINITION;
    return cachedDefinition;
  } catch {
    cachedDefinition = null;
    return null;
  }
}
function getTypeMap() {
  const def = loadDefinition();
  if (def?.types?.map && Object.keys(def.types.map).length > 0) {
    return def.types.map;
  }
  return FALLBACK_TYPE_MAP;
}
function getDefaultType() {
  return loadDefinition()?.types?.default ?? "string";
}
function getCardinalityKind(operator) {
  const def = loadDefinition();
  const map = def?.cardinalities?.map?.length ? def.cardinalities.map : FALLBACK_CARDINALITY_MAP;
  return map.find((c) => c.operator === operator)?.kind ?? null;
}

// packages/generator/src/parsers/mermaid.parser.ts
var TYPE_MAP = getTypeMap();
var SEMANTIC_TYPES = new Set(["email", "url", "phone", "password", "color"]);
function mergeDuplicateAttributes(attributes) {
  const byName = new Map;
  for (const attribute of attributes) {
    const existing = byName.get(attribute.name);
    if (!existing) {
      byName.set(attribute.name, { ...attribute });
      continue;
    }
    existing.required = existing.required || attribute.required;
    if (attribute.unique)
      existing.unique = true;
    if (attribute.isForeignKey)
      existing.isForeignKey = true;
    if (existing.maxLength === undefined && attribute.maxLength !== undefined) {
      existing.maxLength = attribute.maxLength;
    }
    if (existing.semanticType === undefined && attribute.semanticType !== undefined) {
      existing.semanticType = attribute.semanticType;
    }
    if (existing.description === undefined && attribute.description !== undefined) {
      existing.description = attribute.description;
    }
  }
  return [...byName.values()];
}
function attributeFromDeclaration(declaration) {
  const rawType = declaration.type.toLowerCase();
  const baseType = rawType.replace(/\(\d+\)$/, "");
  const modifiers = declaration.modifiers.map((m) => m.toUpperCase());
  const type = TYPE_MAP[rawType] || getDefaultType();
  const isPrimaryKey = modifiers.includes("PK");
  const isForeignKey = modifiers.includes("FK");
  const isUnique = modifiers.includes("UK") || modifiers.includes("UNIQUE");
  const isOptional = modifiers.includes("OPTIONAL") || modifiers.includes("NULL");
  const lengthMatch = declaration.type.match(/\((\d+)\)/);
  const maxLength = lengthMatch?.[1] ? parseInt(lengthMatch[1], 10) : undefined;
  return {
    name: declaration.name,
    type,
    required: !isOptional && !isPrimaryKey,
    unique: isUnique || isPrimaryKey,
    maxLength,
    ...isForeignKey && { isForeignKey: true },
    ...SEMANTIC_TYPES.has(baseType) && {
      semanticType: baseType
    }
  };
}
function relationshipFromDeclaration(declaration) {
  const operator = relationshipOperator(declaration);
  const cardinality = getCardinalityKind(operator);
  if (!cardinality) {
    throw new Error(`Relationship ${declaration.source} ${operator} ${declaration.target} uses an operator the language does not define`);
  }
  const label = declaration.label?.trim();
  const name = label ? normalizeRelationshipName(label) : `${declaration.source.toLowerCase()}_${declaration.target.toLowerCase()}`;
  return {
    name,
    sourceEntity: declaration.source,
    targetEntity: declaration.target,
    cardinality,
    foreignKey: generateForeignKey(declaration.source, declaration.target, cardinality)
  };
}
function compileErdRecords(records) {
  const entities = records.entities.map((declaration) => completeEntity(declaration.name, declaration.attributes.map(attributeFromDeclaration)));
  const relationships = records.relationships.map(relationshipFromDeclaration);
  const declaredEnums = new Map;
  for (const declared of records.enums) {
    if (!declaredEnums.has(declared.name))
      declaredEnums.set(declared.name, declared.values);
  }
  const entityHelpText = new Map;
  for (const { entity, help } of records.entityHelp)
    entityHelpText.set(entity, help);
  const entityIcons = new Map;
  for (const { entity, icon } of records.entityIcons)
    entityIcons.set(entity, icon);
  const entityParents = new Map;
  for (const { entity, parent } of records.entityParents)
    entityParents.set(entity, parent);
  attachIndexes(entities, records.indexes);
  attachHelp(entities, records.fieldHelp, entityHelpText);
  for (const [name, icon] of entityIcons) {
    const entity = entities.find((candidate) => candidate.name === name);
    if (entity)
      entity.icon = icon;
  }
  attachParents(entities, entityParents);
  const enums = attachEnums(entities, declaredEnums, records.enumBindings);
  return { entities, relationships, enums };
}
function attachHelp(entities, fieldHelp, entityHelp) {
  for (const [name, help] of entityHelp) {
    const entity = entities.find((candidate) => candidate.name === name);
    if (entity)
      entity.description = help;
  }
  for (const { entity: name, column, help } of fieldHelp) {
    const attribute = entities.find((candidate) => candidate.name === name)?.attributes.find((candidate) => candidate.name === column);
    if (attribute)
      attribute.description = help;
  }
}
function attachParents(entities, parents) {
  for (const [childName, parentName] of parents) {
    const child = entities.find((candidate) => candidate.name === childName);
    const parent = entities.find((candidate) => candidate.name === parentName);
    if (!child || !parent)
      continue;
    const snake = snakeCase(parent.name);
    const link = child.attributes.find((a) => a.isForeignKey && a.name === `${snake}_id`) ?? child.attributes.find((a) => a.isForeignKey && a.name.startsWith(`${snake}_`));
    if (!link)
      continue;
    child.parentEntity = parent.name;
    child.parentLinkColumn = link.name;
  }
}
function attachIndexes(entities, declared) {
  for (const { entity: entityName, columns, unique } of declared) {
    const entity = entities.find((candidate) => candidate.name === entityName);
    if (!entity)
      continue;
    const known = new Set(entity.attributes.map((attribute) => attribute.name));
    if (!columns.every((column) => known.has(column)))
      continue;
    entity.indexes = entity.indexes ?? [];
    entity.indexes.push({ columns: [...columns], unique });
  }
}
function attachEnums(entities, declared, bindings) {
  const used = new Set;
  for (const binding of bindings) {
    if (!declared.has(binding.enumName))
      continue;
    const entity = entities.find((candidate) => candidate.name === binding.entity);
    const attribute = entity?.attributes.find((candidate) => candidate.name === binding.column);
    if (attribute)
      used.add(binding.enumName);
  }
  const referenceIds = new Map;
  let nextId = 1000;
  for (const name of [...used].sort()) {
    referenceIds.set(name, nextId++);
  }
  for (const binding of bindings) {
    const values = declared.get(binding.enumName);
    const referenceId = referenceIds.get(binding.enumName);
    if (!values || !referenceId)
      continue;
    const entity = entities.find((candidate) => candidate.name === binding.entity);
    const attribute = entity?.attributes.find((candidate) => candidate.name === binding.column);
    if (!attribute)
      continue;
    attribute.enumRef = binding.enumName;
    attribute.enumValues = [...values];
    attribute.enumReferenceId = referenceId;
  }
  return [...referenceIds.entries()].map(([name, referenceId]) => ({
    name,
    values: [...declared.get(name) ?? []],
    referenceId
  }));
}
function completeEntity(name, declaredAttributes) {
  if (!name) {
    throw new Error("Entity name is required");
  }
  const attributes = mergeDuplicateAttributes(declaredAttributes);
  const tableName = snakeCase(name);
  const hasIdAttribute = attributes.some((a) => a.name === "id" || a.unique && a.name.endsWith("_id"));
  if (!hasIdAttribute) {
    attributes.unshift({
      name: "id",
      type: "string",
      required: true,
      unique: true
    });
  }
  const pkAttribute = attributes.find((a) => a.unique && a.name === "id");
  const primaryKey = pkAttribute?.name || "id";
  return {
    name,
    tableName,
    description: ``,
    attributes,
    primaryKey,
    timestamps: true
  };
}
function normalizeRelationshipName(name) {
  return name.trim().replace(/\s+/g, "_").toLowerCase();
}
function generateForeignKey(sourceEntity, targetEntity, cardinality) {
  const referenced = cardinality === "oneToMany" ? sourceEntity : targetEntity;
  const cleanName = snakeCase(referenced).replace(/^bus_/, "");
  return `${cleanName}_id`;
}
function emptyErdRecords() {
  return {
    entities: [],
    relationships: [],
    indexes: [],
    enums: [],
    enumBindings: [],
    fieldHelp: [],
    entityHelp: [],
    entityIcons: [],
    entityParents: [],
    entityOptions: [],
    fieldOptions: []
  };
}
var RELATIONSHIP_LINE = /^([a-zA-Z_][a-zA-Z0-9_]*)\s+(\|[|o]|\}[o|])--(o[|{]|\|[|{])\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*"?([^"]*)"?)?$/;

class MermaidParser {
  parse(mermaidSyntax) {
    return compileErdRecords(this.read(mermaidSyntax));
  }
  read(mermaidSyntax) {
    const records = emptyErdRecords();
    const lines = mermaidSyntax.replace(/\r\n/g, `
`).split(`
`);
    let currentEntity = null;
    let currentAttributes = [];
    let inEntityBlock = false;
    for (let i = 0;i < lines.length; i++) {
      const line = lines[i] ?? "";
      const trimmed = line.trim();
      if (!trimmed || trimmed === "erDiagram") {
        continue;
      }
      if (trimmed.startsWith("%%")) {
        this.readDirective(trimmed, records);
        continue;
      }
      const relationship = this.readRelationship(trimmed);
      if (relationship) {
        records.relationships.push(relationship);
        continue;
      }
      const entityStartMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*\{$/);
      if (entityStartMatch?.[1]) {
        if (currentEntity && currentAttributes.length > 0) {
          records.entities.push({ name: currentEntity, attributes: currentAttributes });
        }
        currentEntity = entityStartMatch[1];
        currentAttributes = [];
        inEntityBlock = true;
        continue;
      }
      if (trimmed === "}") {
        if (currentEntity) {
          records.entities.push({ name: currentEntity, attributes: currentAttributes });
          currentEntity = null;
          currentAttributes = [];
        }
        inEntityBlock = false;
        continue;
      }
      if (inEntityBlock && currentEntity) {
        const attribute = this.readAttribute(trimmed);
        if (attribute)
          currentAttributes.push(attribute);
      }
    }
    if (currentEntity && currentAttributes.length > 0) {
      records.entities.push({ name: currentEntity, attributes: currentAttributes });
    }
    return records;
  }
  readDirective(line, records) {
    const index = this.parseIndexDirective(line);
    if (index)
      records.indexes.push(index);
    const declaredEnum = this.parseEnumDirective(line);
    if (declaredEnum)
      records.enums.push(declaredEnum);
    const binding = this.parseFieldEnumDirective(line);
    if (binding)
      records.enumBindings.push(binding);
    const fieldHelp = this.parseFieldHelpDirective(line);
    if (fieldHelp)
      records.fieldHelp.push(fieldHelp);
    const entityHelp = this.parseEntityHelpDirective(line);
    if (entityHelp)
      records.entityHelp.push(entityHelp);
    const entityParent = this.parseEntityParentDirective(line);
    if (entityParent)
      records.entityParents.push(entityParent);
    const entityIcon = this.parseEntityIconDirective(line);
    if (entityIcon)
      records.entityIcons.push(entityIcon);
    const entityOption = this.parseEntityOptionDirective(line);
    if (entityOption)
      records.entityOptions.push(entityOption);
    const fieldOption = this.parseFieldOptionDirective(line);
    if (fieldOption)
      records.fieldOptions.push(fieldOption);
  }
  parseEntityOptionDirective(line) {
    const match = line.match(/^%%entity\s+([A-Za-z_]\w*)\s+(label|prefix|softDelete|audited)\s*:\s*(.+)$/);
    if (!match?.[1] || !match[2] || !match[3])
      return null;
    const value = match[3].trim();
    return value ? { entity: match[1], key: match[2], value } : null;
  }
  parseFieldOptionDirective(line) {
    const match = line.match(/^%%field\s+([A-Za-z_]\w*)\.([A-Za-z_]\w*)\s+(ui|default|min|max|format)\s*:\s*(.+)$/);
    if (!match?.[1] || !match[2] || !match[3] || !match[4])
      return null;
    const value = match[4].trim();
    return value ? { entity: match[1], column: match[2], key: match[3], value } : null;
  }
  parseIndexDirective(line) {
    const match = line.match(/^%%index\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(unique)?\s*$/i);
    if (!match?.[1])
      return null;
    const columns = (match[2] ?? "").split(",").map((column) => column.trim()).filter(Boolean);
    if (columns.length === 0)
      return null;
    return { entity: match[1], columns, unique: Boolean(match[3]) };
  }
  parseEnumDirective(line) {
    const match = line.match(/^%%enum\s+([A-Za-z_]\w*)\s*:\s*(.+)$/);
    if (!match?.[1] || !match[2])
      return null;
    const values = match[2].split(",").map((value) => value.trim()).filter(Boolean);
    return values.length > 0 ? { name: match[1], values } : null;
  }
  parseFieldEnumDirective(line) {
    const match = line.match(/^%%field\s+([A-Za-z_]\w*)\.([A-Za-z_]\w*)\s+enum\s*:\s*([A-Za-z_]\w*)\s*$/);
    if (!match?.[1] || !match[2] || !match[3])
      return null;
    return { entity: match[1], column: match[2], enumName: match[3] };
  }
  parseFieldHelpDirective(line) {
    const match = line.match(/^%%field\s+([A-Za-z_]\w*)\.([A-Za-z_]\w*)\s+help\s*:\s*(.+)$/);
    if (!match?.[1] || !match[2] || !match[3])
      return null;
    const help = match[3].trim();
    return help ? { entity: match[1], column: match[2], help } : null;
  }
  parseEntityHelpDirective(line) {
    const match = line.match(/^%%entity\s+([A-Za-z_]\w*)\s+(?:help|description)\s*:\s*(.+)$/);
    if (!match?.[1] || !match[2])
      return null;
    const help = match[2].trim();
    return help ? { entity: match[1], help } : null;
  }
  parseEntityIconDirective(line) {
    const match = line.match(/^%%entity\s+([A-Za-z_]\w*)\s+icon\s*:\s*([\w.-]+)\s*$/);
    if (!match?.[1] || !match[2])
      return null;
    return { entity: match[1], icon: match[2] };
  }
  parseEntityParentDirective(line) {
    const match = line.match(/^%%entity\s+([A-Za-z_]\w*)\s+parent\s*:\s*([A-Za-z_]\w*)\s*$/);
    if (!match?.[1] || !match[2])
      return null;
    return { entity: match[1], parent: match[2] };
  }
  readRelationship(line) {
    const match = line.match(RELATIONSHIP_LINE);
    if (!match?.[1] || !match[4])
      return null;
    const [, source, left, right, target, rawLabel] = match;
    if (!getCardinalityKind(`${left}--${right}`))
      return null;
    const sourceEnd = endFromLeftGlyph(left);
    const targetEnd = endFromRightGlyph(right);
    if (!sourceEnd || !targetEnd)
      return null;
    const label = rawLabel?.trim();
    return {
      source,
      target,
      sourceEnd,
      targetEnd,
      ...label ? { label } : {}
    };
  }
  readAttribute(line) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2)
      return null;
    const type = parts[0] ?? "";
    const name = parts[1];
    if (!name)
      return null;
    return { type, name, modifiers: parts.slice(2) };
  }
}

// packages/generator/src/rbac/index.ts
var DIRECTIVE2 = /^%%rbac\s+(\S+)\s+on\s+([A-Za-z_]\w*)\.([A-Za-z_*]\w*)\s*$/;
function parseRoleExpression(expression) {
  const roles = [];
  for (const part of expression.split("|")) {
    const name = part.trim().replace(/^role:/i, "").trim();
    if (name)
      roles.push(name);
  }
  return roles;
}
function readRbacDirectives(source, onWarn = () => {}) {
  const declarations = [];
  for (const rawLine of (source ?? "").split(`
`)) {
    const line = rawLine.trim();
    if (!line.startsWith("%%rbac"))
      continue;
    const match = line.match(DIRECTIVE2);
    if (!match) {
      onWarn(`Skipping malformed %%rbac directive: ${line}`);
      continue;
    }
    const [, roleExpr, entity, target] = match;
    declarations.push({ roles: parseRoleExpression(roleExpr), entity, target });
  }
  return declarations;
}

// packages/generator/src/reports/index.ts
var REPORT_CHART_TYPES = ["bar", "line", "pie", "area"];
var CHART_TYPE_SET = new Set(REPORT_CHART_TYPES);
var KEYS = ["title", "entity", "chart", "x", "y", "help"];
function readReportDeclaration(line) {
  const directive = line.trim().match(/^%%+report\s+(.+)$/is);
  if (!directive?.[1])
    return { error: "not a %%report directive" };
  const rest = directive[1];
  const split = rest.match(/^(.*?)\bsql:\s*(.+)$/is);
  if (!split?.[2])
    return { error: "has no sql: clause" };
  const head = split[1] ?? "";
  const sql = split[2].trim();
  const nameMatch = head.match(/^([A-Za-z_][\w-]*)\s*/);
  if (!nameMatch?.[1])
    return { error: "has no name" };
  const name = nameMatch[1];
  const keys = head.slice(nameMatch[0].length);
  const read = (key) => {
    const stop = KEYS.join("|");
    const found = keys.match(new RegExp(`\\b${key}:\\s*(.*?)(?=\\s+(?:${stop}):|$)`, "is"));
    return found?.[1]?.trim() || undefined;
  };
  const declaration = { name, sql };
  for (const key of KEYS) {
    const value = read(key);
    if (value !== undefined)
      declaration[key] = value;
  }
  return declaration;
}
function readReportDirectives(source, warn = () => {}) {
  const declarations = [];
  for (const line of source.split(`
`)) {
    if (!/^\s*%%+report\b/i.test(line))
      continue;
    const declaration = readReportDeclaration(line);
    if ("error" in declaration) {
      warn(`%%report ${declaration.error} — skipped: ${line.trim().slice(0, 120)}`);
      continue;
    }
    declarations.push(declaration);
  }
  return declarations;
}

// packages/generator/src/rules/flowchart-parser.ts
function parseNodeDef(id, rest) {
  let m;
  m = rest.match(/^\(\[(.+?)\]\)/);
  if (m?.[1])
    return { id, label: m[1].trim(), shape: "stadium" };
  m = rest.match(/^\(\((.+?)\)\)/);
  if (m?.[1])
    return { id, label: m[1].trim(), shape: "circle" };
  m = rest.match(/^\{(.+?)\}/);
  if (m?.[1])
    return { id, label: m[1].trim(), shape: "diamond" };
  m = rest.match(/^\[(.+?)\]/);
  if (m?.[1])
    return { id, label: m[1].trim(), shape: "rect" };
  m = rest.match(/^\((.+?)\)/);
  if (m?.[1])
    return { id, label: m[1].trim(), shape: "round" };
  return null;
}
function ensureNode(ast, id, suffix) {
  if (ast.nodes.has(id))
    return;
  if (suffix) {
    const node = parseNodeDef(id, suffix);
    if (node) {
      ast.nodes.set(id, node);
      return;
    }
  }
  ast.nodes.set(id, { id, label: id, shape: "rect" });
}
var NODE_SUFFIX = String.raw`\(\([^)]*\)\)|\(\[[^\]]*\]\)|\{[^}]*\}|\[[^\]]*\]|\([^)]*\)`;
var EDGE_RE = new RegExp(String.raw`^([A-Za-z_][A-Za-z0-9_]*)(${NODE_SUFFIX})?\s*(?:-->|---)\s*(?:\|([^|]*)\|)?\s*([A-Za-z_][A-Za-z0-9_]*)(${NODE_SUFFIX})?`);
function parseMermaidFlowchart(code) {
  const ast = { nodes: new Map, edges: [] };
  for (const rawLine of code.split(`
`)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("flowchart") || line.startsWith("graph") || line.startsWith("%%"))
      continue;
    const em = line.match(EDGE_RE);
    if (em) {
      const [, srcId, srcSuffix, edgeLabel, tgtId, tgtSuffix] = em;
      if (!srcId || !tgtId)
        continue;
      ensureNode(ast, srcId, srcSuffix);
      ensureNode(ast, tgtId, tgtSuffix);
      ast.edges.push({
        source: srcId,
        target: tgtId,
        label: edgeLabel?.trim() || undefined
      });
      continue;
    }
    const nm = line.match(/^([A-Za-z_][A-Za-z0-9_]*)(.+)$/);
    if (nm?.[1] && nm[2]) {
      const node = parseNodeDef(nm[1], nm[2].trim());
      if (node && !ast.nodes.has(nm[1]))
        ast.nodes.set(nm[1], node);
    }
  }
  return ast;
}
// packages/generator/src/rules/index.ts
var ACTION_DIRECTIVE = /^%%action\s+([A-Za-z_][\w-]*)\s+([A-Za-z][\w-]*)\s*(.*)$/;
function parseActionProps(rest) {
  const props = {};
  const trimmed = rest.trim();
  if (!trimmed)
    return props;
  for (const chunk of trimmed.split(/\s+(?=[A-Za-z_]\w*:)/)) {
    const at = chunk.indexOf(":");
    if (at <= 0)
      continue;
    const key = chunk.slice(0, at).trim();
    if (key)
      props[key] = chunk.slice(at + 1).trim();
  }
  return props;
}
function readRuleActions(flowchart) {
  const actions = [];
  for (const rawLine of (flowchart ?? "").split(`
`)) {
    const line = rawLine.trim();
    if (!line.startsWith("%%action"))
      continue;
    const match = line.match(ACTION_DIRECTIVE);
    if (!match)
      continue;
    const [, name, type, rest] = match;
    const props = parseActionProps(rest ?? "");
    const { when, ...others } = props;
    const condition = when?.trim();
    actions.push({ name, type, ...condition ? { when: condition } : {}, props: others });
  }
  return actions;
}
var DECISION_TABLE_DIRECTIVE = "%%decision-table ";
function parseDecisionTableDirective(flowchart) {
  const line = (flowchart ?? "").split(`
`).map((l) => l.trim()).find((l) => l.startsWith(DECISION_TABLE_DIRECTIVE));
  if (!line)
    return null;
  try {
    const parsed = JSON.parse(line.slice(DECISION_TABLE_DIRECTIVE.length));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
function flowchartDirection(flowchart) {
  for (const raw of flowchart.split(`
`)) {
    const line = raw.trim();
    if (!line || line.startsWith("%%"))
      continue;
    return line.match(/^(?:flowchart|graph)\s+([A-Za-z]{2})\b/)?.[1];
  }
  return;
}
function readRuleSection(section) {
  const ast = parseMermaidFlowchart(section.flowchart);
  const decisionTable = parseDecisionTableDirective(section.flowchart);
  const direction = flowchartDirection(section.flowchart);
  return {
    name: section.name,
    ...section.title ? { title: section.title } : {},
    entity: section.entity,
    event: section.event,
    ...section.priority !== undefined ? { priority: section.priority } : {},
    ...direction ? { direction } : {},
    nodes: [...ast.nodes.values()].map(({ id, label, shape }) => ({ id, label, shape })),
    edges: ast.edges.map(({ source, target, label }) => ({
      source,
      target,
      ...label !== undefined ? { label } : {}
    })),
    actions: readRuleActions(section.flowchart),
    ...decisionTable ? { decisionTable } : {}
  };
}

// packages/generator/src/workflows/sagas.ts
var PROP_SPLIT = /\s+(?=[A-Za-z_]\w*:(?!\/\/))/;
function parseStepProperties(rest) {
  const properties = {};
  const trimmed = rest.trim();
  if (!trimmed)
    return properties;
  for (const chunk of trimmed.split(PROP_SPLIT)) {
    const at = chunk.indexOf(":");
    if (at <= 0)
      continue;
    const key = chunk.slice(0, at).trim();
    if (key)
      properties[key] = chunk.slice(at + 1).trim();
  }
  return properties;
}
var WORKFLOW_RE = /^%%workflow\s+(\S+)\s+(.*)$/;
var STEP_RE = /^%%step\s+(\S+)\s+(\S+)\s*(.*)$/;
var META_RE = /^%%meta\s+([A-Za-z][\w-]*)\s*:\s*(.*)$/;
function parseNodeLabels(lines) {
  const labels = new Map;
  const shape = /(^|\s|>)([A-Za-z_]\w*)\s*(\(\[|\[|\{|\(\(|\()([^\]})]*)/g;
  for (const line of lines) {
    if (line.trim().startsWith("%%"))
      continue;
    for (const match of line.matchAll(shape)) {
      const id = match[2];
      const label = match[4].trim();
      if (label && !labels.has(id))
        labels.set(id, label);
    }
  }
  return labels;
}
function parseEdgeOrder(lines) {
  const order = [];
  const seen = new Set;
  const push = (id) => {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("%%"))
      continue;
    if (!trimmed.includes("--") && !trimmed.includes("=="))
      continue;
    const cleaned = trimmed.replace(/\|[^|]*\|/g, " ");
    const parts = cleaned.split(/-{2,}>|-{2,}|={2,}>/);
    for (const part of parts) {
      const id = /^\s*([A-Za-z_]\w*)/.exec(part)?.[1];
      if (id)
        push(id);
    }
  }
  return order;
}
function sagaBlocks(source) {
  const lines = source.split(/\r?\n/);
  const blocks = [];
  const starts = [];
  lines.forEach((line, index) => {
    if (WORKFLOW_RE.test(line.trim()))
      starts.push(index);
  });
  for (const [position, start] of starts.entries()) {
    const end = starts[position + 1] ?? lines.length;
    const block = lines.slice(start, end);
    const header = WORKFLOW_RE.exec(block[0].trim());
    if (!header)
      continue;
    const attrs = parseStepProperties(header[2] ?? "");
    if ((attrs["kind"] ?? "").toLowerCase() !== "saga")
      continue;
    const meta = {};
    for (const line of block) {
      const match = META_RE.exec(line.trim());
      if (match)
        meta[match[1]] = match[2].trim();
    }
    const labels = parseNodeLabels(block);
    const rawSteps = [];
    for (const line of block) {
      const match = STEP_RE.exec(line.trim());
      if (!match)
        continue;
      const [, nodeId, nodeType, rest] = match;
      rawSteps.push({
        id: nodeId,
        type: nodeType,
        label: labels.get(nodeId) ?? nodeId,
        properties: parseStepProperties(rest ?? "")
      });
    }
    blocks.push({
      name: header[1],
      entity: attrs["entity"] ?? "",
      attrs,
      meta,
      labels,
      order: parseEdgeOrder(block),
      rawSteps
    });
  }
  return blocks;
}
function declaredSetting(block, key) {
  return block.attrs[key] ?? block.meta[key];
}
var OPERATION_ALIASES = {
  create: "CREATE",
  insert: "CREATE",
  add: "CREATE",
  update: "UPDATE",
  edit: "UPDATE",
  write: "UPDATE",
  modify: "UPDATE",
  delete: "DELETE",
  remove: "DELETE",
  destroy: "DELETE",
  all: "ALL",
  any: "ALL",
  "*": "ALL"
};
function sagaOperation(declared) {
  if (declared === undefined || declared.trim() === "")
    return "CREATE";
  return OPERATION_ALIASES[declared.trim().toLowerCase()] ?? declared.trim().toUpperCase();
}
function sagaTrigger(declared) {
  if (declared === undefined || declared.trim() === "")
    return "automatic";
  return declared.trim().toLowerCase();
}
function unreachableStep(block, nodeId) {
  if (block.order.includes(nodeId) || block.labels.has(nodeId))
    return null;
  return {
    workflow: block.name,
    nodeId,
    message: `no node "${nodeId}" in the flowchart — the step will never run`
  };
}
function readSagaDirectives(source) {
  const declarations = [];
  const diagnostics = [];
  for (const block of sagaBlocks(source)) {
    const rank = (id) => {
      const index = block.order.indexOf(id);
      return index === -1 ? Number.POSITIVE_INFINITY : index;
    };
    const steps = block.rawSteps.map((step, position) => ({ step, position })).sort((a, b) => rank(a.step.id) - rank(b.step.id) || a.position - b.position).map(({ step }) => step);
    const reported = new Set;
    for (const step of block.rawSteps) {
      if (reported.has(step.id))
        continue;
      reported.add(step.id);
      const diagnostic = unreachableStep(block, step.id);
      if (diagnostic)
        diagnostics.push(diagnostic);
    }
    const operation = declaredSetting(block, "operation");
    const trigger = declaredSetting(block, "trigger");
    declarations.push({
      name: block.name,
      entity: block.entity,
      ...operation !== undefined ? { operation } : {},
      ...trigger !== undefined ? { trigger } : {},
      ...block.meta["description"] !== undefined ? { description: block.meta["description"] } : {},
      steps
    });
  }
  return { declarations, diagnostics };
}

// packages/generator/src/workflows/state-machine.ts
var START_MARKER = "[*]";
var TRANSITION = /^(\[\*\]|[A-Za-z_]\w*)\s*-->\s*(\[\*\]|[A-Za-z_]\w*)\s*(?::\s*(.+))?$/;
function readStateMachines(source) {
  const declarations = [];
  for (const section of extractWorkflowSections(source ?? "")) {
    if (section.kind !== "state")
      continue;
    const states = [];
    const transitions = [];
    const final = [];
    let initial;
    for (const rawLine of (section.diagram ?? "").split(`
`)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("%%"))
        continue;
      const match = line.match(TRANSITION);
      if (!match)
        continue;
      const [, from, to, trigger] = match;
      for (const name of [from, to]) {
        if (name !== START_MARKER && !states.includes(name))
          states.push(name);
      }
      if (from === START_MARKER) {
        initial = to;
        continue;
      }
      if (to === START_MARKER) {
        final.push(from);
        continue;
      }
      const cleaned = trigger?.trim();
      transitions.push({ from, to, ...cleaned !== undefined ? { trigger: cleaned } : {} });
    }
    declarations.push({
      name: section.name,
      ...section.title ? { title: section.title } : {},
      entity: section.entity,
      states,
      ...initial !== undefined ? { initial } : {},
      final,
      transitions
    });
  }
  return declarations;
}

// packages/generator/src/model/read-eml.ts
var SECTION_LEAD = /^%%(?:rule|workflow)\s/;
function headerMeta(source, key) {
  const pattern = new RegExp(`^%%meta\\s+${key}\\s*:\\s*(.+)$`);
  const lines = source.split(`
`).map((raw) => raw.trim());
  for (let index = 0;index < lines.length; index++) {
    const line = lines[index];
    if (SECTION_LEAD.test(line))
      return;
    const value = line.match(pattern)?.[1]?.trim();
    if (!value)
      continue;
    let next = index + 1;
    while (next < lines.length && lines[next].startsWith("%%meta "))
      next++;
    if (!SECTION_LEAD.test(lines[next] ?? ""))
      return value;
  }
  return;
}
function modelDescription(source) {
  for (const rawLine of source.split(`
`)) {
    const match = rawLine.trim().match(/^%%meta\s+description\s*:\s*(.+)$/);
    const text = match?.[1]?.trim();
    if (text)
      return text;
  }
  return;
}
var COMPILED_DIRECTIVE = /^%%+(?:meta|hook|rbac|trigger|report|category|enum|index|entity|field|rule|workflow|step|action|decision-table)\b/;
function uncarriedDirectiveLines(source) {
  const found = [];
  const lines = source.replace(/\r\n/g, `
`).split(`
`);
  let continuing = false;
  lines.forEach((raw, index) => {
    const line = raw.trim();
    const continued = continuing;
    continuing = line.endsWith("\\") && (continued || /^%%\s*category\b/i.test(line));
    if (continued || !line.startsWith("%%"))
      return;
    if (COMPILED_DIRECTIVE.test(line))
      return;
    if (/^%%\s*=+\s*$/.test(line) || /^%%\s*-*\s*$/.test(line))
      return;
    const reserved = /^%%guard\b/.test(line);
    found.push({
      line: index + 1,
      text: line,
      reason: reserved ? "uncompiled-directive" : "comment"
    });
  });
  return found;
}
var GLOBAL_DIRECTIVE_LINE = /^\s*%%+(?:hook|rbac|report|category|enum|index|entity|field|step|trigger|guard)\b/;
function readHookDiagrams(source, sagaNames) {
  return extractWorkflowSections(source).filter((section) => section.kind === "hook" && !sagaNames.has(section.name)).map((section) => {
    const diagram = section.diagram.split(`
`).filter((line) => !GLOBAL_DIRECTIVE_LINE.test(line)).join(`
`).replace(/\n{3,}/g, `

`).trim();
    return {
      name: section.name,
      ...section.title ? { title: section.title } : {},
      entity: section.entity,
      diagram
    };
  });
}
function readSagaDeclarations(source, warn) {
  const titles = new Map(extractWorkflowSections(source).filter((section) => section.title).map((section) => [section.name, section.title]));
  const { declarations, diagnostics } = readSagaDirectives(source);
  for (const diagnostic of diagnostics) {
    const where = diagnostic.nodeId ? `${diagnostic.workflow}.${diagnostic.nodeId}` : diagnostic.workflow;
    warn(`saga ${where}: ${diagnostic.message}`);
  }
  return declarations.map((saga) => {
    const title = titles.get(saga.name);
    return title ? { ...saga, title } : saga;
  });
}
function readTriggerDirectives(source) {
  const triggers = [];
  for (const raw of source.replace(/\r\n/g, `
`).split(`
`)) {
    const match = raw.trim().match(/^%%trigger\s+(.+?)\s*->\s*(\w+)\s+on\s+(\w+)\s*$/);
    if (match) {
      triggers.push({ source: match[1].trim(), handler: match[2], entity: match[3] });
    }
  }
  return triggers;
}
function readEmlModel(source, warn = () => {}) {
  const name = headerMeta(source, "name");
  const version = headerMeta(source, "version");
  const description = modelDescription(source);
  const sagas = readSagaDeclarations(source, warn);
  return {
    ...name ? { name } : {},
    ...version ? { version } : {},
    ...description ? { description } : {},
    erd: new MermaidParser().read(source),
    categories: readCategoryDirectives(source),
    rbac: readRbacDirectives(source, warn),
    triggers: readTriggerDirectives(source),
    hooks: readHookDirectives(source, warn),
    reports: readReportDirectives(source, warn),
    rules: extractRuleSections(source).map(readRuleSection),
    stateMachines: readStateMachines(source),
    sagas,
    hookDiagrams: readHookDiagrams(source, new Set(sagas.map((saga) => saga.name)))
  };
}

// packages/generator/src/model-yaml/document.ts
var EML_YAML_VERSION = "1.0";

// packages/generator/src/model-yaml/convert.ts
var FLAG_MODIFIERS = new Set(["PK", "FK", "UK", "UNIQUE", "OPTIONAL", "NULL"]);
function attributeOf(entity, declaration, issues) {
  const upper = declaration.modifiers.map((token) => token.toUpperCase());
  const attribute = { name: declaration.name, type: declaration.type };
  if (upper.includes("PK"))
    attribute.pk = true;
  if (upper.includes("FK"))
    attribute.fk = true;
  if (upper.includes("UK") || upper.includes("UNIQUE"))
    attribute.unique = true;
  if (upper.includes("OPTIONAL") || upper.includes("NULL"))
    attribute.optional = true;
  const rest = declaration.modifiers.join(" ");
  const quoted = rest.match(/"([^"]*)"/);
  const comment = quoted?.[1]?.trim();
  if (comment)
    attribute.comment = comment;
  const outside = quoted ? rest.replace(quoted[0], " ") : rest;
  for (const token of outside.split(/\s+/).filter(Boolean)) {
    if (FLAG_MODIFIERS.has(token.toUpperCase()))
      continue;
    issues.push({
      construct: `${entity}.${declaration.name}`,
      message: `modifier "${token}" is not part of the language and compiles to nothing`,
      kind: "dropped"
    });
  }
  return attribute;
}
function ruleDocumentOf(rule) {
  return {
    name: rule.name,
    ...rule.title !== undefined && rule.title !== rule.name ? { title: rule.title } : {},
    entity: rule.entity,
    event: rule.event,
    ...rule.priority !== undefined ? { priority: rule.priority } : {},
    ...rule.direction !== undefined && rule.direction !== "TD" ? { direction: rule.direction } : {},
    nodes: rule.nodes.map(({ id, label, shape }) => ({ id, label, shape })),
    edges: rule.edges.map((edge) => ({
      from: edge.source,
      to: edge.target,
      ...edge.label !== undefined ? { label: edge.label } : {}
    })),
    ...rule.actions.length ? {
      actions: rule.actions.map((action) => ({
        name: action.name,
        type: action.type,
        ...action.when !== undefined ? { when: action.when } : {},
        ...Object.keys(action.props).length ? { props: { ...action.props } } : {}
      }))
    } : {},
    ...rule.decisionTable !== undefined ? { decisionTable: rule.decisionTable } : {}
  };
}
function stateMachineDocumentOf(machine) {
  return {
    name: machine.name,
    ...machine.title !== undefined && machine.title !== machine.name ? { title: machine.title } : {},
    entity: machine.entity,
    states: [...machine.states],
    ...machine.initial !== undefined ? { initial: machine.initial } : {},
    ...machine.final.length ? { final: [...machine.final] } : {},
    transitions: machine.transitions.map(({ from, to, trigger }) => ({
      from,
      to,
      ...trigger !== undefined ? { trigger } : {}
    }))
  };
}
function sagaDocumentOf(saga) {
  const operation = sagaOperation(saga.operation);
  const trigger = sagaTrigger(saga.trigger);
  return {
    name: saga.name,
    ...saga.title !== undefined && saga.title !== saga.name ? { title: saga.title } : {},
    entity: saga.entity,
    ...operation !== "CREATE" ? { operation } : {},
    ...trigger !== "automatic" ? { trigger } : {},
    ...saga.description !== undefined ? { description: saga.description } : {},
    steps: saga.steps.map((step) => ({
      id: step.id,
      type: step.type,
      ...step.label !== undefined && step.label !== step.id ? { label: step.label } : {},
      ...Object.keys(step.properties).length ? { properties: { ...step.properties } } : {}
    }))
  };
}
function reportDocumentOf(report) {
  return {
    name: report.name,
    ...report.title !== undefined ? { title: report.title } : {},
    ...report.entity !== undefined ? { entity: report.entity } : {},
    ...report.chart !== undefined ? { chart: report.chart } : {},
    ...report.x !== undefined ? { x: report.x } : {},
    ...report.y !== undefined ? { y: report.y } : {},
    ...report.help !== undefined ? { help: report.help } : {},
    sql: report.sql
  };
}
function entitiesOf(erd, issues) {
  const entities = erd.entities.map((declaration) => ({
    name: declaration.name,
    attributes: declaration.attributes.map((attribute2) => attributeOf(declaration.name, attribute2, issues))
  }));
  const entity = (name) => entities.find((candidate) => candidate.name === name);
  const attribute = (entityName, column) => entity(entityName)?.attributes.find((candidate) => candidate.name === column);
  const drop = (construct, message) => issues.push({ construct, message, kind: "dropped" });
  const resolve = (construct, message) => issues.push({ construct, message, kind: "resolved" });
  const annotate = (key, list) => {
    for (const item of list) {
      const target = entity(item.entity);
      const construct = `%%entity ${item.entity} ${key}`;
      if (!target) {
        drop(construct, `names an entity the model does not declare`);
        continue;
      }
      if (target[key] !== undefined && target[key] !== item[key]) {
        resolve(construct, `declared more than once; the last declaration takes effect`);
      }
      target[key] = item[key];
    }
  };
  annotate("help", erd.entityHelp);
  annotate("icon", erd.entityIcons);
  annotate("parent", erd.entityParents);
  for (const option of erd.entityOptions) {
    const target = entity(option.entity);
    const construct = `%%entity ${option.entity} ${option.key}`;
    if (!target) {
      drop(construct, `names an entity the model does not declare`);
      continue;
    }
    const value = entityOptionValue(option.key, option.value);
    if (value === undefined) {
      drop(construct, `"${option.value}" is not a value this key takes`);
      continue;
    }
    if (target[option.key] !== undefined && target[option.key] !== value) {
      resolve(construct, `declared more than once; the last declaration takes effect`);
    }
    Object.assign(target, { [option.key]: value });
  }
  for (const option of erd.fieldOptions) {
    const target = attribute(option.entity, option.column);
    const construct = `%%field ${option.entity}.${option.column} ${option.key}`;
    if (!target) {
      drop(construct, `names a column the model does not declare`);
      continue;
    }
    const value = fieldOptionValue(option.key, option.value);
    if (target[option.key] !== undefined && target[option.key] !== value) {
      resolve(construct, `declared more than once; the last declaration takes effect`);
    }
    Object.assign(target, { [option.key]: value });
  }
  for (const help of erd.fieldHelp) {
    const target = attribute(help.entity, help.column);
    const construct = `%%field ${help.entity}.${help.column} help`;
    if (!target) {
      drop(construct, `names a column the model does not declare`);
      continue;
    }
    if (target.help !== undefined && target.help !== help.help) {
      resolve(construct, `declared more than once; the last declaration takes effect`);
    }
    target.help = help.help;
  }
  for (const binding of erd.enumBindings) {
    const target = attribute(binding.entity, binding.column);
    const construct = `%%field ${binding.entity}.${binding.column} enum`;
    if (!target) {
      drop(construct, `names a column the model does not declare`);
      continue;
    }
    if (target.enum !== undefined && target.enum !== binding.enumName) {
      resolve(construct, `binds the column to both ${target.enum} and ${binding.enumName}; the last binding takes effect, ` + `but EML still allocated a reference id to ${target.enum}`);
    }
    target.enum = binding.enumName;
  }
  for (const index of erd.indexes) {
    const target = entity(index.entity);
    if (!target) {
      drop(`%%index ${index.entity}(${index.columns.join(", ")})`, "names an unknown entity");
      continue;
    }
    target.indexes = target.indexes ?? [];
    target.indexes.push({
      columns: [...index.columns],
      ...index.unique ? { unique: true } : {}
    });
  }
  return entities.map((document) => ({
    name: document.name,
    ...document.help !== undefined ? { help: document.help } : {},
    ...document.icon !== undefined ? { icon: document.icon } : {},
    ...document.parent !== undefined ? { parent: document.parent } : {},
    ...document.label !== undefined ? { label: document.label } : {},
    ...document.prefix !== undefined ? { prefix: document.prefix } : {},
    ...document.softDelete !== undefined ? { softDelete: document.softDelete } : {},
    ...document.audited !== undefined ? { audited: document.audited } : {},
    attributes: document.attributes.map(orderedAttribute),
    ...document.indexes?.length ? { indexes: document.indexes } : {}
  }));
}
function entityOptionValue(key, value) {
  switch (key) {
    case "audited":
    case "softDelete":
      return value === "true" ? true : value === "false" ? false : undefined;
    case "prefix":
      return value === "bus" || value === "sys" ? value : undefined;
    case "label":
      return value;
  }
}
function fieldOptionValue(key, value) {
  if ((key === "min" || key === "max") && value !== "" && String(Number(value)) === value) {
    return Number(value);
  }
  return value;
}
function orderedAttribute(attribute) {
  return {
    name: attribute.name,
    type: attribute.type,
    ...attribute.pk ? { pk: true } : {},
    ...attribute.fk ? { fk: true } : {},
    ...attribute.unique ? { unique: true } : {},
    ...attribute.optional ? { optional: true } : {},
    ...attribute.enum !== undefined ? { enum: attribute.enum } : {},
    ...attribute.help !== undefined ? { help: attribute.help } : {},
    ...attribute.ui !== undefined ? { ui: attribute.ui } : {},
    ...attribute.default !== undefined ? { default: attribute.default } : {},
    ...attribute.min !== undefined ? { min: attribute.min } : {},
    ...attribute.max !== undefined ? { max: attribute.max } : {},
    ...attribute.format !== undefined ? { format: attribute.format } : {},
    ...attribute.comment !== undefined ? { comment: attribute.comment } : {}
  };
}
function enumsOf(enums, issues) {
  const seen = new Set;
  const kept = [];
  for (const declared of enums) {
    if (seen.has(declared.name)) {
      issues.push({
        construct: `%%enum ${declared.name}`,
        message: "declared more than once; the first declaration takes effect",
        kind: "resolved"
      });
      continue;
    }
    seen.add(declared.name);
    kept.push({ name: declared.name, values: [...declared.values] });
  }
  return kept;
}
function categoryDocumentOf(category) {
  return {
    name: category.name,
    ...category.code !== undefined ? { code: category.code } : {},
    ...category.description !== undefined ? { description: category.description } : {},
    ...category.icon !== undefined ? { icon: category.icon } : {},
    ...category.color !== undefined ? { color: category.color } : {},
    ...category.seq !== undefined ? { seq: category.seq } : {},
    ...category.isDefault ? { default: true } : {},
    ...category.entities.length ? { entities: [...category.entities] } : {}
  };
}
function recordsToDocument(records) {
  const issues = [];
  const rbac = records.rbac.filter((rule) => {
    if (rule.roles.filter(Boolean).length > 0)
      return true;
    issues.push({
      construct: `%%rbac on ${rule.entity}.${rule.target}`,
      message: "names no role, so it compiles to nothing",
      kind: "dropped"
    });
    return false;
  });
  const document = {
    eml: EML_YAML_VERSION,
    ...records.name !== undefined ? { name: records.name } : {},
    ...records.version !== undefined ? { version: records.version } : {},
    ...records.description !== undefined ? { description: records.description } : {},
    ...records.erd.enums.length ? { enums: enumsOf(records.erd.enums, issues) } : {},
    ...records.categories.length ? { categories: records.categories.map(categoryDocumentOf) } : {},
    entities: entitiesOf(records.erd, issues),
    ...records.erd.relationships.length ? {
      relationships: records.erd.relationships.map((relationship) => ({
        from: relationship.source,
        fromCardinality: relationship.sourceEnd,
        to: relationship.target,
        toCardinality: relationship.targetEnd,
        ...relationship.label !== undefined ? { label: relationship.label } : {}
      }))
    } : {},
    ...records.hooks.length ? {
      hooks: records.hooks.map((hook) => ({
        entity: hook.entity,
        event: hook.event,
        handler: hook.handler,
        ...hook.fields?.length ? { fields: [...hook.fields] } : {}
      }))
    } : {},
    ...rbac.length ? {
      rbac: rbac.map((rule) => ({
        entity: rule.entity,
        action: rule.target,
        roles: rule.roles.filter(Boolean)
      }))
    } : {},
    ...records.triggers.length ? {
      triggers: records.triggers.map((trigger) => ({
        entity: trigger.entity,
        source: trigger.source,
        handler: trigger.handler
      }))
    } : {},
    ...records.reports.length ? { reports: records.reports.map(reportDocumentOf) } : {},
    ...records.rules.length ? { rules: records.rules.map(ruleDocumentOf) } : {},
    ...records.stateMachines.length ? { stateMachines: records.stateMachines.map(stateMachineDocumentOf) } : {},
    ...records.sagas.length ? { sagas: records.sagas.map(sagaDocumentOf) } : {},
    ...records.hookDiagrams.length ? {
      hookDiagrams: records.hookDiagrams.map((diagram) => ({
        name: diagram.name,
        ...diagram.title !== undefined && diagram.title !== diagram.name ? { title: diagram.title } : {},
        entity: diagram.entity,
        diagram: diagram.diagram
      }))
    } : {}
  };
  return { document, issues };
}

// .vendor-eml.ts
setLanguageDefinition(appwithai_language_default);
function emlToModelDocument(source) {
  const warnings = [];
  const { document, issues } = recordsToDocument(readEmlModel(source, (message) => warnings.push(message)));
  for (const message of warnings)
    issues.push({ construct: "directive", message, kind: "dropped" });
  issues.push(...sagaDirectiveIssues(source));
  return { document, issues, uncarried: uncarriedDirectiveLines(source) };
}
function sagaDirectiveIssues(source) {
  const issues = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((raw, index) => {
    const header = raw.trim().match(/^%%workflow\s+(\S+)\s+(.*)$/);
    if (!header || !/\bkind:\s*saga\b/i.test(header[2] ?? ""))
      return;
    const name = header[1];
    const onLine = (key) => header[2]?.match(new RegExp(`\\b${key}:\\s*(\\S+)`))?.[1];
    for (let next = index + 1;next < lines.length; next++) {
      const line = lines[next].trim();
      if (/^%%workflow\s/.test(line))
        break;
      const meta = line.match(/^%%meta\s+(trigger|operation)\s*:\s*(\S+)/);
      if (!meta)
        continue;
      const declared = onLine(meta[1]);
      if (declared !== undefined && declared.toLowerCase() !== meta[2].toLowerCase()) {
        issues.push({
          construct: `%%workflow ${name}`,
          message: `declares ${meta[1]}: ${declared} on its %%workflow line and ${meta[2]} in a %%meta ` + "line. The %%workflow line wins; the document states that value.",
          kind: "resolved"
        });
      }
    }
  });
  return issues;
}
export {
  emlToModelDocument
};
