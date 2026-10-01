-- The last step of m0017: every automation now carries its YAML document, so
-- the mermaid column goes, and the content constraint requires the YAML.
ALTER TABLE sys_workflow_definitions
  DROP CONSTRAINT IF EXISTS sys_workflow_definitions_content;
ALTER TABLE sys_workflow_definitions DROP COLUMN IF EXISTS mermaid_code;
ALTER TABLE sys_workflow_definitions
  ADD CONSTRAINT sys_workflow_definitions_content CHECK (
    (kind = 'bpmn' AND bpmn_xml IS NOT NULL)
    OR (kind = 'automation' AND definition_yaml IS NOT NULL)
  );
