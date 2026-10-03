-- Per-operation and per-transition access, and the edges a state machine draws.
--
-- Three tables, one migration, because they answer three halves of the same
-- question and the guard reads all of them on the same request.
--
-- `sys_access` is deliberately not reused for any of this. That is a *grant*
-- table: a dictionary table with no `sys_access` rows is visible to every role,
-- and the first row added narrows it to that role alone. Writing
-- "only admins may delete an Order" there would hide the Order window from
-- everybody else — a restriction on deleting silently becoming a restriction on
-- looking.

-- What a role may do to a table.
--
-- A (table_name, operation) pair with no row here is UNRESTRICTED. Rows close a
-- pair to the roles they name. That is what makes the access rules additive: a model
-- declaring none behaves exactly as it did before this table existed. Denying
-- by default would lock every user out of every existing model on the next
-- regeneration.
CREATE TABLE IF NOT EXISTS sys_operation_access (
    sys_operation_access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    -- The role's *name*, not a foreign key onto sys_role. The guard is handed
    -- role names by the session, seeding is then order-independent, and a rule
    -- naming a role nobody holds yet is inert rather than a broken reference.
    role_name VARCHAR(100) NOT NULL,
    is_model_managed BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sys_operation_access_unique UNIQUE (table_name, operation, role_name),
    CONSTRAINT sys_operation_access_operation CHECK (operation IN ('create', 'read', 'update', 'delete'))
);

CREATE INDEX IF NOT EXISTS idx_sys_operation_access_lookup
    ON sys_operation_access (table_name, operation) WHERE is_active;

-- Which moves exist.
--
-- One row per edge a state machine declares. The guard
-- refuses a status write with no matching edge — for every caller, the master
-- role included: an edge the diagram never drew is a move that does not exist,
-- not a permission an administrator lacks.
CREATE TABLE IF NOT EXISTS sys_workflow_transitions (
    sys_workflow_transition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    status_field VARCHAR(100) NOT NULL DEFAULT 'status',
    from_state VARCHAR(100) NOT NULL,
    to_state VARCHAR(100) NOT NULL,
    transition_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sys_workflow_transitions_unique
        UNIQUE (table_name, status_field, from_state, to_state)
);

CREATE INDEX IF NOT EXISTS idx_sys_wf_transitions_lookup
    ON sys_workflow_transitions (table_name, status_field, from_state) WHERE is_active;

-- Who may cross an edge.
--
-- Separate from the table above, and the separation is the point: whether an
-- edge exists is decided by the diagram and enforced for everyone; who may
-- cross it is decided here and bypassed by the master role. Merging the two is
-- how topology enforcement came to run only on edges that happened to carry a
-- role rule.
--
-- Both ends of the edge are stored because one transition name can sit on
-- several edges, and two names can reach the same state.
CREATE TABLE IF NOT EXISTS sys_transition_access (
    sys_transition_access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    transition VARCHAR(100) NOT NULL,
    status_field VARCHAR(100) NOT NULL DEFAULT 'status',
    from_state VARCHAR(100) NOT NULL,
    to_state VARCHAR(100) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    is_model_managed BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sys_transition_access_unique
        UNIQUE (table_name, status_field, from_state, to_state, role_name)
);

CREATE INDEX IF NOT EXISTS idx_sys_transition_access_lookup
    ON sys_transition_access (table_name, status_field, from_state, to_state) WHERE is_active;
