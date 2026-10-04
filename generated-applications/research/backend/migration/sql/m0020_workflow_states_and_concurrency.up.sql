-- The states a state machine declares, and how each entity reconciles two
-- people editing one record.
--
-- `sys_workflow_transitions` (m0009) holds the moves a machine draws; this
-- table holds its states, so the backend can tell a completed transaction from
-- one still in flight. A record whose status column holds a state marked
-- `is_final` is closed: every update is refused with 409 RECORD_FINAL, for
-- every caller, the master role included. A table with no rows here has no
-- machine, and nothing is closed.
--
-- `seq_no` keeps the order the machine lists its states in, which is the order
-- a screen draws them.
CREATE TABLE IF NOT EXISTS sys_workflow_states (
    sys_workflow_state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    status_field VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    is_initial BOOLEAN NOT NULL DEFAULT FALSE,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    seq_no INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sys_workflow_states_unique UNIQUE (table_name, status_field, state)
);

CREATE INDEX IF NOT EXISTS idx_sys_wf_states_final
    ON sys_workflow_states (table_name) WHERE is_final AND is_active;

-- `optimistic` (the default): an update names the version it was read at in
-- If-Match, a stale one is refused with 409 VERSION_CONFLICT, and one that
-- names none is refused with 428 — a client that never read the record cannot
-- overwrite it blind. `last-write-wins`: an update with no If-Match is
-- accepted. Every existing row becomes optimistic, which is what the
-- generated frontend already does: it sends If-Match on every save.
ALTER TABLE sys_table
    ADD COLUMN IF NOT EXISTS concurrency_mode VARCHAR(20) NOT NULL DEFAULT 'optimistic';
ALTER TABLE sys_table
    DROP CONSTRAINT IF EXISTS sys_table_concurrency_mode_check;
ALTER TABLE sys_table
    ADD CONSTRAINT sys_table_concurrency_mode_check
    CHECK (concurrency_mode IN ('optimistic', 'last-write-wins'));
