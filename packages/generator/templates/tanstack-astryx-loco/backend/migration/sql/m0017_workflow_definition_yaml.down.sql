-- Reverting m0017 cannot give an automation its mermaid back: nothing in this
-- application writes mermaid any more. It is refused while an automation
-- exists, rather than leaving rows the reverted schema calls invalid; with none,
-- the schema returns to what m0013 made it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sys_workflow_definitions WHERE kind = 'automation') THEN
    RAISE EXCEPTION 'm0017 cannot be reverted while automations exist: they are stored only as YAML';
  END IF;
END
$$;
ALTER TABLE sys_workflow_definitions
  DROP CONSTRAINT IF EXISTS sys_workflow_definitions_content;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS definition_yaml;
ALTER TABLE sys_workflow_definitions
  ADD COLUMN IF NOT EXISTS mermaid_code TEXT;
ALTER TABLE sys_workflow_definitions
  ADD CONSTRAINT sys_workflow_definitions_content CHECK (
    (kind = 'bpmn' AND bpmn_xml IS NOT NULL)
    OR (kind = 'automation' AND mermaid_code IS NOT NULL)
  );
