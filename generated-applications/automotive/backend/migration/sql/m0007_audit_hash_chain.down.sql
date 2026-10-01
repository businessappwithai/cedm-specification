DROP INDEX IF EXISTS idx_audit_entry_hash;

ALTER TABLE audit_log
  DROP COLUMN IF EXISTS prev_hash,
  DROP COLUMN IF EXISTS entry_hash;

DROP INDEX IF EXISTS idx_audit_chain_tip;
