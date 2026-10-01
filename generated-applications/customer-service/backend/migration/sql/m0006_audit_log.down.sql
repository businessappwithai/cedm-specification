-- Extracted verbatim from 006_create_audit_log.ts.hbs (down).
-- Both stacks must emit the same schema; see docs/MIGRATION-LOCO-ASTRYX.md §6.14.
-- Regenerate with scripts/extract-sys-ddl.ts — do not hand-edit.

DROP TABLE IF EXISTS audit_log;
