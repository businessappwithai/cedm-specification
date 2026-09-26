-- An automation built in the application is stored as YAML.
--
-- Automations were written as mermaid with `%%` directives into `mermaid_code`,
-- the syntax the modelling language has since moved away from: a model is YAML
-- and its mermaid is only a view. `definition_yaml` holds an automation's own
-- document now; `mermaid_code` stays so a row written before this still loads.
--
-- An ALTER rather than an edit to m0013, for the reason m0013 gives: a database
-- that has already applied m0013 would never see a change made there.
ALTER TABLE sys_workflow_definitions
  ADD COLUMN IF NOT EXISTS definition_yaml TEXT;

ALTER TABLE sys_workflow_definitions
  DROP CONSTRAINT IF EXISTS sys_workflow_definitions_content;
ALTER TABLE sys_workflow_definitions
  ADD CONSTRAINT sys_workflow_definitions_content CHECK (
    (kind = 'bpmn' AND bpmn_xml IS NOT NULL)
    OR (kind = 'automation' AND (definition_yaml IS NOT NULL OR mermaid_code IS NOT NULL))
  );
