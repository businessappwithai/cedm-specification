# EML — Workflows

A workflow describes *process*: code that runs around an entity's lifecycle
events, the states a record moves through, and multi-step work that crosses
entities. A model declares four kinds:

| Key | What it is | Compiled to |
|---|---|---|
| `hooks` | A handler bound to one entity's lifecycle event | `src/hooks/` in the generated backend |
| `hookFlows` | The order an entity's hooks run in, drawn | nothing — the model viewer draws it |
| `stateMachines` | The lifecycle an entity's status column moves through | `sys_workflow_transitions`, enforced |
| `sagas` | A multi-step process of executable steps | BPMN in `sys_workflow_definitions` |

Automations — the form the automation builder writes — are the fifth, and are
not part of a model: see [Automations](#automations).

## Hooks

```yaml
hooks:
  - { entity: User, event: beforeCreate, handler: hashPassword, fields: [password] }
  - { entity: User, event: customValidate, handler: ensureUniqueEmail, fields: [email] }
  - { entity: User, event: afterCreate, handler: sendWelcomeEmail }
```

| Key | Meaning |
|---|---|
| **`entity`** | The entity the handler runs for (`EML202` when undeclared). |
| **`event`** | One of the 13 lifecycle events below. |
| **`handler`** | The generated function's name, `^[A-Za-z_][A-Za-z0-9_]*$`. One handler per event per entity (`EML204` for a duplicate). |
| `fields` | The columns the hook concerns, in order; the handler is scoped to the first. Each must be declared (`EML203`). |

### What a hook generates

```
backend/src/hooks/
├── mod.rs                  # the registry: 13 dispatch functions, rewritten on every generation
└── handlers/
    └── user.rs             # one function per hook declared for User — written once, never overwritten
```

The asymmetry is the design. The registry is rewritten on every run, so a newly
declared hook is always picked up. A handler module is **written once and never
touched again** — its bodies are the developer's application logic — and a hook
added to the model later is appended to it. The generic bus controller calls the
dispatchers around every CRUD operation, so a hook fires however the entity is
reached: `bus_user`, `user` and `User` all reach the same handlers.

| Event | Receives | Returns | Runs |
|---|---|---|---|
| `beforeCreate` | the payload, mutable | — | before the insert; change `data` to change what is written |
| `afterCreate` | the stored row | — | after the insert; side effects only |
| `beforeUpdate` | the id and the payload, mutable | — | before the update |
| `afterUpdate` | the stored row | — | after the update |
| `beforeDelete` | the id | `bool` | before the delete; `false` refuses it — a guard, not an error |
| `afterDelete` | the row as it was | — | after the delete; clean up related state |
| `beforeRead` | the id | — | before a single record is fetched; an error refuses |
| `afterRead` | the record, mutable | — | shapes a single record in the response |
| `beforeQuery` | the list parameters, mutable | — | scopes or filters the list query |
| `afterQuery` | the rows, mutable | — | post-processes the rows the query returned |
| `beforeList` | the list parameters | — | after `beforeQuery`; an error refuses |
| `afterList` | the page, mutable | — | the page about to be returned |
| `customValidate` | the payload | — | on create and update; an `AppError::Validation` refuses with 400 |

The order inside a write is fixed: `customValidate` runs before
`beforeCreate`/`beforeUpdate`, so validation sees what the caller sent rather
than what a transform left behind; `after*` hooks run after the audit entry and
cannot undo the write.

## Hook flows

```yaml
hookFlows:
  - name: CompoundRegistration
    entity: Compound
    nodes:
      - { id: A, label: Client request }
      - { id: C, event: customValidate, handler: validateSmilesFormat }
      - { id: D, event: beforeCreate, handler: generateInchiKey }
      - { id: F, label: Process compound }
      - { id: G, event: afterCreate, handler: indexForSearch }
    edges:
      - { from: A, to: C }
      - { from: C, to: D }
      - { from: D, to: F }
      - { from: F, to: G }
```

A hook flow draws the order an entity's hooks run in around a write. A node is
either a hook the model declares (`event` and `handler`) or a step shown for
context (`label`). Nothing compiles a flow — the model viewer draws it — but the
checker holds it to the hooks it names: an entity with no hooks (`EML410`), a
hook the entity does not declare (`EML411`), a node declared twice (`EML412`),
an edge to a node the flow lacks (`EML413`). `direction` lays it out: `down`
(default), `up`, `right`, `left`.

## State machines

```yaml
enums:
  - { name: OrderStatus, values: [draft, submitted, approved, shipped, cancelled] }

stateMachines:
  - name: OrderFulfilment
    entity: Order
    states: [draft, submitted, approved, shipped, cancelled]
    initial: draft
    final: [shipped, cancelled]
    transitions:
      - { from: draft, to: submitted, trigger: submit }
      - { from: submitted, to: approved, trigger: approve }
      - { from: submitted, to: cancelled, trigger: reject }
      - { from: approved, to: shipped, trigger: ship }
      - { from: approved, to: cancelled, trigger: cancel }
```

| Key | Meaning |
|---|---|
| **`name`**, `title` | The machine's name; unique among state machines, sagas and hook flows (`EML505`). |
| **`entity`** | The entity whose status column moves (`EML400`). It must have a `status`, `state` or `stage` column (`EML500`). |
| **`states`** | The states, in order. |
| `initial` | Where a new record starts; the first state when omitted (`EML421`, auto-fixable). |
| `final` | The states with no way out (`EML422`, auto-fixable). |
| **`transitions`** | `{ from, to, trigger? }` — the only moves that exist. A `trigger` is an identifier (`EML425`) that access rules may name. |

**Bind the status column to an enum carrying exactly these states.** A machine
whose states are not an enum's values (`EML426`), an enum with values the
machine lacks (`EML427`), and a machine with no matching enum at all (`EML428`)
all leave the form accepting values the machine cannot act on.

The checker also asks that every state be reachable from `initial` (`EML423`),
that every state have a path to a final state (`EML424`), and that the machine
have transitions at all (`EML420`).

### What it generates

Every transition is seeded into `sys_workflow_transitions`, and the generated
backend (`services/authz.rs`, `require_transition`) refuses a write that moves a
record to a state with no edge from the state it is in — 400, and the record
stays where it was. **This binds every caller, the master role included.** An
edge the model never declared is not a permission an administrator lacks; it is
a move that does not exist.

Two questions are asked separately:

| Question | Answered from | Master role |
|---|---|---|
| Does this edge exist? | `sys_workflow_transitions`, from `stateMachines` | bound by it |
| Who may cross it? | `sys_transition_access`, from `rbac` | bypasses it |

So an edge no access rule names is open to any authenticated caller, while an
edge the machine omits is refused to everyone. `GET /api/workflows/transitions`
returns the stored edges (narrowed by `?table=` and `?from=`), so a screen can
offer only the moves that exist. A table with no machine has no rows, and
nothing is enforced for it.

## Sagas

A saga is a process that takes several steps, touches more than one entity, and
carries values from one step to the next: escalate a deviation and open a CAPA,
convert a qualified lead, admit a patient.

```yaml
sagas:
  - name: CriticalDeviationEscalation
    entity: DeviationReport
    trigger: rule
    steps:
      - id: B
        type: Formula
        label: Stage base days
        properties: { target: baseDays, operation: set, value: "3" }
      - id: C
        type: Formula
        label: Compute resolution days
        properties: { target: resolutionDays, source: baseDays, operation: multiply, operand: "7" }
      - id: D
        type: CreateEntity
        label: Open a CAPA
        properties:
          entity: Capa
          as: newCapaId
          fields: '{"title":"CAPA for deviation {{id}}","status":"open","deviation_report_id":"{{id}}"}'
      - id: E
        type: UpdateEntity
        label: Escalate the deviation
        properties: { field: status, value: escalated }
      - id: F
        type: UpdateEntity
        label: Carry the window onto the CAPA
        properties: { entity: Capa, targetSource: newCapaId, field: effectiveness_metric, source: resolutionDays }
```

| Key | Meaning |
|---|---|
| **`name`**, `title`, `description` | What the saga is. |
| **`entity`** | The entity whose writes start it. |
| `trigger` | `automatic` (default) or `rule`. |
| `operation` | `CREATE` (default), `UPDATE`, `DELETE` or `ALL` — which write starts it, for `trigger: automatic`. |
| **`steps`** | `{ id, type, label?, properties? }`, run in the order listed (`EML430` when empty). `id` is unique in the saga (`EML270`); every property value is a string. |

### The trigger

| `trigger` | Runs |
|---|---|
| `automatic` | on every write to the entity that matches `operation` |
| `rule` | only when a rule's `trigger-workflow` action names it — the rule's `when` decides |

Choose `rule` whenever the saga should not run on every write: it is what makes
a condition load-bearing. A rule-triggered saga that no action names can never
run (`EML286`).

The generated Loco backend currently starts a saga only through a rule's
`trigger-workflow` action or `POST /api/workflow/{id}/execute`. `trigger:
automatic` is recorded on the definition (`sys_workflow_definitions.trigger_type`)
and not yet acted on by that backend.

### Passing values between steps

Steps share one context: the triggering record's columns, plus every variable an
earlier step published. `CreateEntity` publishes the new row's id under `as`;
`Formula` under `target`; `Decision` one variable per output column of the row
that matched. A later step reads one by naming it in `source` or `targetSource`,
or as `{{name}}` inside `fields`. A step reading a variable no earlier step
publishes is `EML264`. Without this a saga could insert a row and never reach it
again.

### Step types

The single source of truth is `workflowConstructs.stepNodes` in the language
definition; the checker, both generators, the modelling tool and the generated
Workflow Designer all read it.

| Type | Requires | Optional | Does |
|---|---|---|---|
| `UpdateEntity` | `field`, and `source` or `value` | `entity`, `targetField`, `targetSource` | writes one column |
| `CreateEntity` | `entity`, `fields` | `as` | inserts a row, publishing its id |
| `DeleteEntity` | — | `entity`, `targetField`, `targetSource`, `hard` | soft-deletes (stamps `deleted_at`); `hard: "true"` removes the row |
| `Decision` | `decisionTable` or `rule` | `publish` | evaluates a decision table and publishes its outputs |
| `Formula` | `target`, `operation` | per operation | publishes a value into the context |
| `REST` | `url` | `method`, `bodyTemplate` | calls an external endpoint; `bodyTemplate` interpolates `{{key}}` |
| `Agent` | `agentId` | — | not shipped: the executor logs and skips it |

An unknown type is `EML261`, a missing property `EML262`, an unknown one
`EML268`, and a step naming an undeclared entity `EML266`.

**`fields`** (`CreateEntity`) is a JSON object of column → context key or
literal, written as a YAML string; a string naming a context key is substituted
(`EML267` when it is not a JSON object).

**`Formula`** operations: `multiply`, `divide`, `add`, `subtract` need `source`
and `operand`, both read as numbers; `set` needs `value`, stored unchanged — the
only way to pass text to a later step; `copy` needs `source`, carried across
unchanged.

**`Decision`** puts a decision table inside the process. `decisionTable` is the
table itself as JSON — `{ hitPolicy, inputs, outputs, rules }` — for logic only
this process needs; `rule` names a rule declared elsewhere in the model
(`EML273` when it is not), when the same table already governs the entity.
`publish` narrows what is published to a comma-separated list. A table that
matches no row publishes nothing — that is how "leave it alone" is said, and the
steps that would have read its variables skip themselves. **Every row must set
every output column**: the engine discards a row that leaves one unset, and one
such row stops the whole table matching (`EML272`; `EML271` for a table that is
not valid JSON).

**Row targeting** (`UpdateEntity`, `DeleteEntity`): with no `entity` the step
acts on the triggering record. To reach another entity, set `entity` and either
`targetSource` (a context key holding the row id) or `targetField` (a foreign key
matched against the triggering row). Targeting another entity with neither is
refused rather than guessed (`EML265`) — updating the wrong row is bad, deleting
it is worse.

### What a saga generates

One row in `sys_workflow_definitions`, holding BPMN with one `bpmn:serviceTask`
per step in the order listed, and `trigger_type` from `trigger`. Definitions
from the model carry `source: 'model'`: **the model owns them** — regeneration
rewrites them, and the generated Workflow Designer shows them read-only.
Workflows authored in the application carry `source: 'designer'` and are never
touched by regeneration, so the two cannot overwrite each other.

### Compensation

A saga that needs rollback pairs each forward step with a compensating one — a
`DeleteEntity` undoing a `CreateEntity`, an `UpdateEntity` restoring a prior
value. The executor runs a linear chain, so compensation is written as explicit
steps; automatic compensating-transaction orchestration is not part of the
language.

## Automations

An automation is the form a workflow takes when it is built in the automation
builder — in the modelling tool and in a generated application. It is one
sentence:

> When a `DeviationReport` **is created**, only if `severity` **is** `critical`,
> look up the escalation tier, create a CAPA, and write the tier back.

A trigger, a flat list of conditions that must all pass, and an ordered list of
steps. There is deliberately no graph: the executor runs steps in order and stops
at the first failure, so a list is the honest representation. It is a profile of
the saga's step machinery, not a second language.

Each automation is its own YAML document, stored in
`sys_workflow_definitions.definition_yaml` (and, in the modelling tool, in the
project's history under `model/automations/`). The backend refuses a document of
any other shape.

```yaml
automation: "1.0"
name: Escalate critical deviations
kind: automation
trigger:
  entity: DeviationReport
  event: created
conditions:
  - { id: c1, field: severity, operator: eq, value: critical }
loops: []
steps:
  - id: s1
    type: Decision
    resultName: tier
    props: { ruleTable: Escalation tier }
  - id: s2
    type: CreateEntity
    resultName: capaId
    props: { entity: CAPA }
  - id: s3
    type: UpdateEntity
    resultName: ""
    props: { field: status, value: "{{tier}}" }
hooks: []
status: live
```

| Key | Meaning |
|---|---|
| `automation` | The document version, `"1.0"`. |
| `name`, `description` | What it is called. |
| `kind` | `automation`, `hook` (a hook workflow: its rungs are hooks) or `saga`. |
| `trigger` | `{ entity, event }`. |
| `sagaTrigger`, `sagaOperation` | For `kind: saga`: as a saga's `trigger` and `operation`. |
| `conditions` | `{ id, field, operator, value }`, all of which must pass. |
| `loops` | `{ id, condition, maxPasses }`. |
| `steps` | `{ id, type, resultName, props, loopId?, table? }`, in order. |
| `hooks` | For `kind: hook`: `{ id, event, handler, field? }`. |
| `status` | `draft`, `live` or `paused`. |

Keys are written in a fixed order and nothing that belongs to the screen is
stored, so saving an automation twice writes the same bytes. The same reader and
writer (`lib/automation/yaml.ts`) ship in the modelling tool and in every
generated application, byte for byte.

### Triggers

The events are the lifecycle hooks the generated services already fire, named
the way someone describing their business would name them:

| `event` | Hook | Can still block the write |
|---|---|---|
| `created` | `afterCreate` | no |
| `beforeCreated` | `beforeCreate` | yes |
| `updated` | `afterUpdate` | no |
| `beforeUpdated` | `beforeUpdate` | yes |
| `deleted` | `afterDelete` | no |
| `beforeDeleted` | `beforeDelete` | yes |

### Conditions

All must pass; there is no OR and no nesting — an author who needs alternatives
writes a second automation, which stays readable where a boolean tree does not.
No conditions means the automation always runs. Operators: `eq`, `neq`, `gt`,
`gte`, `lt`, `lte`, `contains`, `startsWith`, `isEmpty`, `isNotEmpty`,
`changed`; the last three take no value.

### Steps and references

| Type | Properties | Does |
|---|---|---|
| `Decision` | `ruleTable`, `inputs` | evaluates a rule table and publishes its outputs |
| `CreateEntity` | `entity`, `values` | creates a record on another entity |
| `UpdateEntity` | `entity`, `field`, `value` | writes a field, by default on the triggering record |
| `DeleteEntity` | `entity`, `target` | removes a record |
| `Formula` | `operation`, `left`, `right` | computes a value and publishes it |
| `REST` | `method`, `url`, `body` | calls an external service |

A step reads, in double braces, a field of the triggering record
(`{{deviationreport.severity}}`, the entity name lower-cased) or the published
result of an earlier step (`{{tier}}`, by its `resultName`). Resolution is
positional — a step sees only what precedes it — which is what makes the list
safe to reorder.

A saga-kind automation composes into the model when the project is generated:
its steps become a `sagas` entry, translated at that one edge (`values` →
`fields`, a Formula's `left`/`right` → `source`/`operand`, `{{name}}` → a bare
`source`). A plain automation runs in the generated application from its
automations screen and is not a model construct.

### Loops

```yaml
loops:
  - id: L1
    condition: { id: lc1, field: retry_count, operator: lt, value: "5" }
    maxPasses: "10"
steps:
  - { id: s1, type: REST, resultName: "", props: { method: POST, url: https://lims.example.com/sync }, loopId: L1 }
  - { id: s2, type: UpdateEntity, resultName: "", props: { field: retry_count, value: "{{L1.iteration}}" }, loopId: L1 }
```

The steps carrying a loop's id run in order and repeat for as long as its
condition holds; the loop ends the first time it fails. **The condition is
re-read before every pass**, against the record as it stands then — a step inside
the loop changes the record, and that change is what ends it. It uses the same
eleven operators as conditions.

**`maxPasses` is required.** A while-loop is genuinely unbounded, and an
automation runs inside the write that triggered it: a condition that never fails
holds a database transaction open until something times out. There is no default
and no engine-wide constant — a retry that should give up after 5 and a
reconciliation that legitimately runs 800 cannot share one number. After
`maxPasses` passes the loop is abandoned and the run marked `FAILED`, naming the
loop and the limit. A loop with none is refused by the builder and warned about
by the compiler; an executor meeting one anyway runs a single pass.

**The condition must be able to change.** A loop whose condition reads a field no
member step writes is refused when the model compiles — it would read the same on
every pass. The check matches `UpdateEntity` writes by field name and treats every
other step type as able to change anything, so it reports only what it is sure
of.

Loops do not nest: a step carries at most one `loopId`. Inside a loop a step also
sees `{{<loopId>.iteration}}`, the 1-based pass number; a value published inside
the loop holds what the last pass left.

## Combining them

One entity can carry all of it: columns and relationships (structure), `rules`
(declarative logic), `hooks` (imperative side effects), a state machine (its
lifecycle), `rbac` (who may do what) and sagas (the processes it starts). Keeping
them in one document makes the entity's whole behaviour reviewable in one place,
and the model viewer draws each of them from that document. See
[`../yaml/examples/crm.eml.yaml`](../yaml/examples/crm.eml.yaml) for a model that
uses every construct.
