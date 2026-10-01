
DROP INDEX IF EXISTS idx_workflow_def_model_managed;
ALTER TABLE sys_workflow_definitions DROP CONSTRAINT IF EXISTS sys_workflow_definitions_name_key;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS is_model_managed;
