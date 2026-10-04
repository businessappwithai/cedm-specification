-- The last step of m0017: a definition must carry the content its kind implies,
-- or the executor loads a row it cannot run and only finds out at the first step.
ALTER TABLE sys_workflow_definitions
  DROP CONSTRAINT IF EXISTS sys_workflow_definitions_content;
ALTER TABLE sys_workflow_definitions
  ADD CONSTRAINT sys_workflow_definitions_content CHECK (
    (kind = 'bpmn' AND bpmn_xml IS NOT NULL)
    OR (kind = 'automation' AND definition_yaml IS NOT NULL)
  );
