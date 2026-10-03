# EML — Business Rules

A business rule is declarative logic bound to one entity and one lifecycle event:
pricing, discounts, eligibility, validation, approval routing, scoring. Each
entry of `rules` compiles to a GoRules JDM decision, seeded into
`sys_rule_definitions` and evaluated by the generated application's rules engine
on every matching write (`packages/generator/src/rules/`, and its Rust mirror
`crates/appwithai-gen/src/rules.rs`).

```yaml
rules:
  - name: quoteDiscountPolicy
    title: Quote discount policy
    entity: Quote
    event: beforeUpdate
    priority: 10
    nodes: [...]
    edges: [...]
    actions: [...]
```

| Key | Meaning |
|---|---|
| **`name`** | An identifier, unique among the rules. |
| `title` | What the screens call it. |
| **`entity`** | The entity it is bound to (`EML307` when undeclared). |
| **`event`** | The lifecycle event it runs on — `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `customValidate`, … |
| `priority` | Lower runs first; default 100. |
| `direction` | How the graph is laid out when drawn: `down` (default), `up`, `right`, `left`. Layout only. |
| **`nodes`**, **`edges`** | The decision graph. |
| `actions` | Side effects the rule emits. |
| `decisionTable` | A decision table authored in the rules editor. |

## What a rule compiles from

A rule decides in one of three ways, and the compiler takes the first it finds:

1. its **`decisionTable`**, authored in the rules editor;
2. its **`actions`**, compiled to a decision table whose rows carry them —
   the only JDM shape the rules engine reads actions out of;
3. its **decision graph**, `nodes` and `edges`, compiled node by node.

Every rule declares a graph, whichever of the three it compiles from: it is
what the model viewer draws and what a reader follows. A rule that acts through
`actions` still draws the decision it makes.

## The decision graph

```yaml
nodes:
  - { id: A, label: "Start: Submit requested", type: start }
  - { id: B, label: Status == draft?, type: decision }
  - { id: X1, label: "Reject: not in draft", type: expression }
  - { id: C, label: "Set status: submitted", type: expression }
  - { id: Z, label: End, type: end }
edges:
  - { from: A, to: B }
  - { from: B, to: X1, label: No }
  - { from: B, to: C, label: Yes }
  - { from: X1, to: Z }
  - { from: C, to: Z }
```

A node's `type` is the JDM node it compiles to:

| `type` | JDM node | Role |
|---|---|---|
| `start` | `inputNode` | Where the rule receives the record being written. Exactly one. |
| `end` | `outputNode` | The rule's outcome. At least one. |
| `decision` | `switchNode` | A branch. The label is the condition; each outgoing edge's label is the branch it takes (`Yes`, `No`, a value). |
| `expression` | `expressionNode` | Set or compute an output value. |
| `function` | `functionNode` | A reusable computation step. |

An edge is `{ from, to, label? }`. A label is required on every edge leaving a
decision and optional elsewhere.

| Code | Fires when |
|---|---|
| `EML300` / `EML301` | no `start` node, or more than one |
| `EML302` | no `end` node |
| `EML303` | a decision with fewer than two ways out |
| `EML304` | an edge out of a decision has no label |
| `EML305` | a node cannot be reached from the start |
| `EML306` | the rule has no graph at all |
| `EML308` | a node id declared twice |
| `EML309` | an edge names a node the rule does not declare |

## Actions — what a rule does

A graph can only decide. To let a rule **act** — refuse a write, stamp a field,
start a saga — declare `actions`:

```yaml
actions:
  - name: escalateDiscount
    type: trigger-workflow
    when: discount_percent > 15
    props:
      workflow: QuoteApprovalEscalation
      message: Discount above rep authority — holding the quote for approval
  - name: refuseDiscount
    type: validation-error
    when: discount_percent > 40
    props:
      message: Discounts above 40 percent cannot be approved by anyone — reprice the quote
```

Each action becomes one row of a decision table with hit policy `collect`, so
more than one can fire on a single write. `when` becomes the row's condition and
`props` its outputs.

| Key | Meaning |
|---|---|
| **`name`** | An identifier, unique within the rule. |
| **`type`** | One of the action types below (`EML281` otherwise). |
| `when` | A zen expression over the record being written. Absent, the action fires on every write — which `EML282` points out, because it is rarely meant. Quote it in YAML when it contains `:` or starts with a quote. |
| `props` | The action's properties (`EML283` when a required one is missing, `EML285` for one the type does not have). |

| Type | Does | Requires | Optional |
|---|---|---|---|
| `validation-error` | Refuses the write; the message is returned to the caller. | `message` | — |
| `transform` | Overwrites a field on the record being written. | `field`, `value` | `message` |
| `trigger-workflow` | Runs a saga by name. | `workflow` | `message` |

`when` names columns as the table does, in `snake_case`. A condition over a
camelCase identifier (`discountPercent`) tests something no column is called and
never fires: `EML287`, auto-fixable — the fixer rewrites it as the column.

`trigger-workflow` is how a rule reaches a saga declared with `trigger: rule`:
the rule's `when` decides, and the action names the saga. The saga must be
declared in the model (`EML284`), and a rule-triggered saga no action names can
never run (`EML286`). See [03](03-workflows.md#sagas).

## Decision tables

```yaml
decisionTable:
  hitPolicy: first
  inputs:
    - { id: i1, name: Score, field: score }
  outputs:
    - { id: o1, name: Tier, field: account_tier }
  rules:
    - { _id: strategic, i1: ">= 85", o1: "'strategic'" }
    - { _id: enterprise, i1: ">= 70", o1: "'enterprise'" }
    - { _id: rest, i1: "", o1: "'smb'" }
```

A table the rules editor wrote: `inputs` and `outputs` are columns
(`{ id, name?, field? }`), each row maps column ids to cells — zen expressions
for inputs, zen literals for outputs — and `hitPolicy` is `first` (the first
matching row wins, top to bottom) or `collect` (every matching row). An empty
input cell matches anything, so a last row of empty inputs is the "otherwise".

A table takes precedence over the rule's actions and graph. The editor opens a
rule declared with `actions` as the table they compile to and writes it back as
actions, so an unedited rule round-trips unchanged; a rule declared as a graph
only is edited in the YAML, and drawn by the model viewer.

## Authoring guidance

- Bind each rule to the event where it can still act: validation belongs on a
  `before*` event, where refusing the write means the record never changes.
- Keep decision labels short and testable (`Yes`/`No`, or a comparison), and
  label every edge out of a decision.
- Prefer `expression` nodes for "set/apply" and `function` nodes for "compute" —
  the distinction is the JDM node each becomes.
- Give every action a `when`. An action that fires on every write is almost
  always a condition someone forgot to write.
- Use `priority` when two rules on one event depend on each other's outcome.
