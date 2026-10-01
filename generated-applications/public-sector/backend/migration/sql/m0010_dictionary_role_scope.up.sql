-- Dictionary role scoping — the column `controllers/electric.rs` already reads.
--
-- The Application Dictionary is synced to each client over ElectricSQL. An
-- Electric shape filters with a single-table `where` clause and cannot join, so
-- the role grants held in `sys_access` are denormalised onto every dictionary
-- table as `allowed_roles TEXT[]`. A shape then narrows to one role with
-- `allowed_roles @> ARRAY['<role>']`, which the GIN indexes below answer
-- directly instead of scanning the dictionary on every request.
--
-- `shape_where` in `controllers/electric.rs` has emitted exactly that filter
-- since the controller was written, against a column no migration ever created:
-- every role-scoped shape request failed with `column "allowed_roles" does not
-- exist`. This is that column.
--
-- `allowed_roles IS NULL` means "visible to every role", which is the correct
-- reading for `sys_reference` and `sys_ref_list`: they are the shared type
-- vocabulary, carry no business data, and every window needs them to render a
-- field at all. They are therefore not scoped here.
--
-- The column is derived state and is never hand-edited. It is recomputed by
-- `sys_refresh_dictionary_scope()`, which a trigger on `sys_access` keeps
-- current, so granting a role a window immediately widens what that role syncs.

ALTER TABLE sys_window ADD COLUMN IF NOT EXISTS allowed_roles TEXT[];
ALTER TABLE sys_table  ADD COLUMN IF NOT EXISTS allowed_roles TEXT[];
ALTER TABLE sys_tab    ADD COLUMN IF NOT EXISTS allowed_roles TEXT[];
ALTER TABLE sys_column ADD COLUMN IF NOT EXISTS allowed_roles TEXT[];
ALTER TABLE sys_field  ADD COLUMN IF NOT EXISTS allowed_roles TEXT[];

CREATE INDEX IF NOT EXISTS idx_sys_window_allowed_roles ON sys_window USING GIN (allowed_roles);
CREATE INDEX IF NOT EXISTS idx_sys_table_allowed_roles  ON sys_table  USING GIN (allowed_roles);
CREATE INDEX IF NOT EXISTS idx_sys_tab_allowed_roles    ON sys_tab    USING GIN (allowed_roles);
CREATE INDEX IF NOT EXISTS idx_sys_column_allowed_roles ON sys_column USING GIN (allowed_roles);
CREATE INDEX IF NOT EXISTS idx_sys_field_allowed_roles  ON sys_field  USING GIN (allowed_roles);

-- Recompute the whole dictionary scope from `sys_access`.
--
-- Grants flow down the dictionary the way the UI reads it:
--   sys_access -> sys_window -> sys_tab -> sys_field
--   sys_access -> sys_table  -> sys_column
--
-- `is_exclude` rows are grants withheld, so they are filtered out here rather
-- than subtracted afterwards: a role excluded from a window simply never
-- contributes to that window's array.
CREATE OR REPLACE FUNCTION sys_refresh_dictionary_scope() RETURNS void AS $$
BEGIN
  UPDATE sys_window w
  SET allowed_roles = COALESCE((
    SELECT array_agg(DISTINCT r.name)
    FROM sys_access a
    JOIN sys_role r ON r.sys_role_id = a.sys_role_id
    WHERE a.sys_window_id = w.sys_window_id
      AND a.is_active AND NOT a.is_exclude AND r.is_active
  ), ARRAY[]::TEXT[]);

  UPDATE sys_table t
  SET allowed_roles = COALESCE((
    SELECT array_agg(DISTINCT r.name)
    FROM sys_access a
    JOIN sys_role r ON r.sys_role_id = a.sys_role_id
    WHERE a.sys_table_id = t.sys_table_id
      AND a.is_active AND NOT a.is_exclude AND r.is_active
  ), ARRAY[]::TEXT[]);

  UPDATE sys_tab tb
  SET allowed_roles = w.allowed_roles
  FROM sys_window w
  WHERE w.sys_window_id = tb.sys_window_id;

  UPDATE sys_column c
  SET allowed_roles = t.allowed_roles
  FROM sys_table t
  WHERE t.sys_table_id = c.sys_table_id;

  UPDATE sys_field f
  SET allowed_roles = tb.allowed_roles
  FROM sys_tab tb
  WHERE tb.sys_tab_id = f.sys_tab_id;
END;
$$ LANGUAGE plpgsql;

-- Statement-level, not row-level: one recompute per statement, so seeding a few
-- hundred grants does not run the refresh a few hundred times.
CREATE OR REPLACE FUNCTION sys_access_scope_trigger() RETURNS trigger AS $$
BEGIN
  PERFORM sys_refresh_dictionary_scope();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sys_access_scope ON sys_access;
CREATE TRIGGER trg_sys_access_scope
AFTER INSERT OR UPDATE OR DELETE ON sys_access
FOR EACH STATEMENT
EXECUTE FUNCTION sys_access_scope_trigger();

-- Seed the column for rows that already exist.
SELECT sys_refresh_dictionary_scope();
