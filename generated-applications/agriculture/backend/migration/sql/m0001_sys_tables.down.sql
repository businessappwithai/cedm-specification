-- Extracted verbatim from sys-tables.migration.ts.hbs (down).
-- Both stacks must emit the same schema; see docs/MIGRATION-LOCO-ASTRYX.md §6.14.
-- Regenerate with scripts/extract-sys-ddl.ts — do not hand-edit.

DROP TABLE IF EXISTS sys_element CASCADE;

DROP TABLE IF EXISTS sys_rule_definitions CASCADE;

DROP TABLE IF EXISTS sys_session CASCADE;

DROP TABLE IF EXISTS sys_change_log CASCADE;

DROP TABLE IF EXISTS sys_access CASCADE;

DROP TABLE IF EXISTS sys_user_roles CASCADE;

DROP TABLE IF EXISTS sys_user CASCADE;

DROP TABLE IF EXISTS sys_role CASCADE;

DROP TABLE IF EXISTS sys_field CASCADE;

DROP TABLE IF EXISTS sys_tab CASCADE;

DROP TABLE IF EXISTS sys_field_group CASCADE;

DROP TABLE IF EXISTS sys_window CASCADE;

DROP TABLE IF EXISTS sys_ref_table CASCADE;

DROP TABLE IF EXISTS sys_column CASCADE;

DROP TABLE IF EXISTS sys_table CASCADE;

DROP TABLE IF EXISTS sys_val_rule CASCADE;

DROP TABLE IF EXISTS sys_ref_list CASCADE;

DROP TABLE IF EXISTS sys_reference CASCADE;
