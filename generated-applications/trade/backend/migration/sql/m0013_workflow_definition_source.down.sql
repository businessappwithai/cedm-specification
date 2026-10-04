DROP INDEX IF EXISTS idx_workflow_def_trigger;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS kind;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS source;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS trigger_type;
