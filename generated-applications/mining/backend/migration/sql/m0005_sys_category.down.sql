-- Extracted verbatim from 005_create_sys_category.ts.hbs (down).
-- Both stacks must emit the same schema; see docs/MIGRATION-LOCO-ASTRYX.md §6.14.
-- Regenerate with scripts/extract-sys-ddl.ts — do not hand-edit.

DROP INDEX IF EXISTS idx_sys_table_category;

ALTER TABLE sys_table DROP COLUMN IF EXISTS sys_category_id;

DROP INDEX IF EXISTS idx_sys_category_single_default;

DROP INDEX IF EXISTS idx_sys_category_name;

DROP TABLE IF EXISTS sys_category;
