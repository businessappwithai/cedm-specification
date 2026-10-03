# EML — Access Rules, Reports and Triggers

## Access rules — `rbac`

```yaml
rbac:
  - { entity: Account, action: read, roles: [sales_rep, sales_manager, support_agent] }
  - { entity: Opportunity, action: read, roles: [sales_rep, sales_manager] }
  - { entity: Opportunity, action: delete, roles: [sales_manager] }
  - { entity: Quote, action: approve, roles: [sales_manager] }
```

| Key | Meaning |
|---|---|
| **`entity`** | The entity the rule is about (`EML213` when undeclared). |
| **`action`** | A CRUD operation, `*` for all four, or a transition's `trigger` (`EML214` when it is neither). |
| **`roles`** | The roles that may perform it. |

Compiled by `packages/generator/src/rbac/` into `seed/access.sql` and enforced
by the generated backend's `services/authz.rs` on every `/api/bus/*` request.
An access rule that does not compile is an **error**, never a warning: it is a
restriction its author believes is in place and is not.

### It restricts; it does not grant

A target no rule mentions is **open** to any authenticated caller. One or more
rules close it to the union of the roles they name. A model that says nothing
about permissions belongs to an author who has not got to them yet, not to one
who wants everything forbidden — the opposite reading would lock every user out
of every existing model on its next regeneration.

A **master role** (`sys_role.is_master_role`) bypasses every access rule — but
not a state machine's topology, which binds everyone ([03](03-workflows.md#what-it-generates)).
Role names are matched **case-insensitively**: seeded roles are title-cased
(`Sales Manager`) and rules are written the model's way (`sales_manager`), and
an exact match would make such a rule unsatisfiable, locking out precisely the
people it was written to admit.

### CRUD operations and transitions

**CRUD**: `create`, `read`, `update`, `delete`, or `*` for all four. Aliases are
accepted: `insert`/`add`, `view`/`select`/`list`, `edit`/`write`/`modify`,
`remove`/`destroy`.

**Transitions**: any other action is resolved against the `trigger`s of the
entity's state machine. A generated application has no named-transition endpoint
— moving a record along an edge is an ordinary status update — so the rule is
stored as the `(from_state, to_state)` pairs its trigger covers, and the guard
recognises the move by the states a write crosses. Both ends are kept because one
trigger can sit on several edges and two triggers can reach the same state:
restricting `approve` must not incidentally restrict a different trigger that
lands on `approved`.

```yaml
stateMachines:
  - name: QuoteLifecycle
    entity: Quote
    states: [draft, pending, approved]
    transitions:
      - { from: draft, to: pending, trigger: submit }
      - { from: pending, to: approved, trigger: approve }

rbac:
  - { entity: Quote, action: approve, roles: [sales_manager] }
```

### `read` decides whose an entity is

Every other operation only refuses a write. `read` is the one that changes what a
role *sees*: an entity a role may not read is absent from that role's navigation
— no menu entry, no dashboard card, no lookup — because a menu full of entries
that answer 403 is a worse application than a shorter one. One `read` rule per
entity is how a model says who the entity belongs to, and a model is expected to
name **every** entity in at least one. Declaring none leaves every entity visible
to every signed-in caller: the fallback, not the target.

Three things follow, and each has caught a model out:

- **A role that may act on an entity must also be able to read it.** A rule
  letting `sales_manager` `approve` a quote is useless if the quote's `read` rule
  does not name `sales_manager`.
- **Overlap is normal.** An `Account` belongs to sales, marketing and support in
  most businesses; name all three. Two rules on one target merge.
- **Do not reach for `*` to express ownership.** It restricts creating, updating
  and deleting to the same list, and it *merges with* rather than overrides the
  narrower rules on the same entity — widening them.

### One account per role

Every role a rule names is created, and one account is seeded holding it,
beside the administrator — who bypasses everything — and a role-less user. An
application whose only account is the administrator is one whose access control
cannot be looked at. The role accounts share `ROLE_ACCOUNT_PASSWORD` (default
`admin`), and a re-run of the seed does not reset them. Both generators derive
the list the same way (`packages/generator/src/rbac/roles.ts`,
`crates/appwithai-gen/src/rbac.rs`).

### What it compiles to

| | |
|---|---|
| CRUD rules | `sys_operation_access` (table, operation, role) |
| Transition rules | `sys_transition_access` (table, trigger, status column, from, to, role) |
| Roles | every role named, in `sys_role`, each granted the business windows in `sys_access` |
| `read` rules | additionally narrow the dashboard and the navigation to the roles named |
| Enforcement | `services/authz.rs`: `sys_access`, then the operation rules, then the transition rules |

Rows seeded from the model are **model-managed**: regeneration replaces what the
model owns without discarding what an administrator added in the running
application. Every gate denies when it cannot read its rules — a restriction that
disappears under load is not a restriction.

## Reports

```yaml
reports:
  - name: unassigned-jobs
    title: Jobs with no engineer
    entity: Job
    help: The dispatcher's first question every morning.
    sql: |
      SELECT reference, scheduled_for
        FROM bus_job
       WHERE engineer_id IS NULL
       ORDER BY scheduled_for
  - name: orders_by_status
    title: Orders by status
    entity: Order
    chart: bar
    x: status
    y: count
    sql: SELECT status, count(*) AS count FROM bus_order GROUP BY status
```

| Key | Meaning |
|---|---|
| **`name`** | The report's key, unique (`EML292`: a duplicate would silently replace the earlier one). |
| `title`, `help` | What the reports list shows. |
| `entity` | The entity it is mainly about; groups it in the list (`EML295` when undeclared). |
| `chart` | `bar`, `line`, `pie` or `area`; requires `x` and `y`, the result columns it plots. |
| **`sql`** | One `SELECT` or `WITH` statement, as a block scalar when it spans lines. |

A report is a question the application's users actually ask, written down as the
SQL that answers it. Structure alone yields a register per entity and a breakdown
per enum; nothing in an entity list says that a dispatcher's first question is
which jobs have no engineer. A report is where that knowledge lives, so it
travels with the model.

Compiled to `sys_report` (`packages/generator/src/reports/`, and
`crates/appwithai-gen/src/reports.rs`) and served at `/api/reports`, capped at
5,000 rows by an outer `LIMIT` over the query, so the model's own ordering still
decides which rows.

**A report may only read**, and that is refused three times: by the schema and
checker at authoring time (`EML293`), by the compiler before the query can reach
a seed file, and by the generated controller before it runs — `sys_report` is an
ordinary table, so the reader does not trust what it is handed. The check tracks
quoting rather than scanning for a keyword: `SELECT 1; DROP TABLE bus_user` opens
with a `SELECT`. A single trailing semicolon is allowed; a second statement is
not. Anything that writes belongs in a rule or a hook.

The query runs against the generated application's database, so it names `bus_`
tables, and joins keys plainly — primary and foreign keys are both UUIDs, so
`ON c.account_id = a.id` needs no cast.

## Triggers

```yaml
triggers:
  - { entity: Quote, source: "cron:0 0 * * *", handler: expireQuotes }
  - { entity: Order, source: "webhook:payment", handler: markPaid }
  - { entity: Shipment, source: "message:carrier-updates", handler: recordScan }
```

An external event or schedule that calls `handler` on `entity`. `source` is
`cron:<5 or 6 fields>` (`EML231` otherwise), `webhook:<name>` or
`message:<topic>`; quote it, since a cron expression contains spaces and a
`:`. Triggers are **validated** — the schema and checker enforce their shape and
their entity (`EML232`) — and the `eml` CLI's generators compile them; the
TanStack/Loco application generators do not yet.
