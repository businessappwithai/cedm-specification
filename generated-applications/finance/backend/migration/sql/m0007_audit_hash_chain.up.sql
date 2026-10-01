-- Tamper-evidence for the audit trail (decision D4, option B).
--
-- The TypeScript stack mirrored audit entries into immudb for tamper evidence
-- (`audit_log.immudb_key` above). immudb has no maintained Rust client, so this
-- stack chains entries with SHA-256 instead: each row stores the hash of its
-- predecessor, and any retroactive edit breaks the chain from that point on.
--
-- Additive only — the columns are nullable, so a database created by the
-- TypeScript generator still satisfies this migration and both stacks can serve
-- the same audit table.

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS prev_hash  VARCHAR(64),
  ADD COLUMN IF NOT EXISTS entry_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_audit_entry_hash ON audit_log (entry_hash);

-- Finding the chain's tip is on the path of every business write, inside the
-- advisory lock that serialises appends — so its cost is the write throughput
-- of the whole application. `idx_audit_entry_hash` above does not serve it:
-- the query orders by `created_at DESC, id DESC`, and without a matching index
-- Postgres sequentially scans the entire audit history and sorts it, on every
-- insert, forever. Measured on a table of 50,000 entries that is 35ms per
-- write and still climbing; with this index it is a single-row index scan and
-- does not grow at all.
CREATE INDEX IF NOT EXISTS idx_audit_chain_tip
  ON audit_log (created_at DESC, id DESC)
  WHERE entry_hash IS NOT NULL;
