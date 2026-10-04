-- Reverting m0017 removes the column every automation is stored in, so it is
-- refused while an automation exists rather than discarding them; with none,
-- the schema returns to what m0013 made it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sys_workflow_definitions WHERE kind = 'automation') THEN
    RAISE EXCEPTION 'm0017 cannot be reverted while automations exist: they are stored only in definition_yaml';
  END IF;
END
$$;
ALTER TABLE sys_workflow_definitions
  DROP CONSTRAINT IF EXISTS sys_workflow_definitions_content;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS definition_yaml;
