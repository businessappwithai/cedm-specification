-- `sys_note` — what a person wanted to say about a record.
--
-- Kept apart from `audit_log` deliberately. The trail records what the system
-- observed and must not be editable; a note is somebody's sentence about the
-- same record. Storing them in one table would make the history writable, which
-- is the one thing an audit trail may not be.
--
-- Notes are append-only: there is no update path and no delete path. A note that
-- can be quietly rewritten is worth about as much as a conversation nobody
-- remembers.
CREATE TABLE IF NOT EXISTS sys_note (
    sys_note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    note TEXT NOT NULL,
    -- VARCHAR, not UUID: the id a session carries is not guaranteed to be a
    -- uuid, and a UUID column rejects every insert with 22P02 when it is not.
    -- `audit_log` stores the same id as VARCHAR for the same reason.
    user_id VARCHAR(200),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Every read is "the notes on this record", newest first.
CREATE INDEX IF NOT EXISTS idx_sys_note_record
    ON sys_note (table_name, record_id, created_at DESC);
