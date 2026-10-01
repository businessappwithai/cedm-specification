DROP INDEX IF EXISTS idx_workflow_def_trigger;
ALTER TABLE sys_workflow_definitions DROP CONSTRAINT IF EXISTS sys_workflow_definitions_content;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS mermaid_code;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS kind;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS source;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS trigger_type;
