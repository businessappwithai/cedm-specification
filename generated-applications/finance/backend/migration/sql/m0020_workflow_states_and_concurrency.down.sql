ALTER TABLE sys_table
    DROP CONSTRAINT IF EXISTS sys_table_concurrency_mode_check;
ALTER TABLE sys_table
    DROP COLUMN IF EXISTS concurrency_mode;
DROP TABLE IF EXISTS sys_workflow_states;
