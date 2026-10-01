DROP TRIGGER IF EXISTS trg_sys_access_scope ON sys_access;
DROP FUNCTION IF EXISTS sys_access_scope_trigger();
DROP FUNCTION IF EXISTS sys_refresh_dictionary_scope();

DROP INDEX IF EXISTS idx_sys_field_allowed_roles;
DROP INDEX IF EXISTS idx_sys_column_allowed_roles;
DROP INDEX IF EXISTS idx_sys_tab_allowed_roles;
DROP INDEX IF EXISTS idx_sys_table_allowed_roles;
DROP INDEX IF EXISTS idx_sys_window_allowed_roles;

ALTER TABLE sys_field  DROP COLUMN IF EXISTS allowed_roles;
ALTER TABLE sys_column DROP COLUMN IF EXISTS allowed_roles;
ALTER TABLE sys_tab    DROP COLUMN IF EXISTS allowed_roles;
ALTER TABLE sys_table  DROP COLUMN IF EXISTS allowed_roles;
ALTER TABLE sys_window DROP COLUMN IF EXISTS allowed_roles;
