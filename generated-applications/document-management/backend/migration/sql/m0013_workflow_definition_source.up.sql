-- What starts a workflow, where it came from, and what shape it is in.
--
-- An ALTER rather than an edit to m0004: a database generated before this exists
-- has m0004 recorded as applied and would never see a change made there.
--
--   trigger_type  automatic — run on every write matching entity + operation
--                 rule      — run only when a rule's trigger-workflow action
--                             names it, so the rule's condition decides
--   source        model     — declared by the model's `sagas`; the seed
--                             rewrites it and the designer shows it read-only
--                 designer  — built in the app; regeneration never touches it
--   kind          bpmn      — a diagram, in `bpmn_xml`
--                 automation — a YAML document, in `definition_yaml` (m0017)
--
-- `bpmn_xml` becomes nullable because an automation has none. It was NOT NULL,
-- so the automation builder could not save a single row into a generated app.
-- The constraint tying each kind to its content is m0017's, because the column
-- an automation's content lives in is m0017's.
ALTER TABLE sys_workflow_definitions
  ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(20) NOT NULL DEFAULT 'automatic';
ALTER TABLE sys_workflow_definitions
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'designer';
ALTER TABLE sys_workflow_definitions
  ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'bpmn';
ALTER TABLE sys_workflow_definitions
  ALTER COLUMN bpmn_xml DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_def_trigger
  ON sys_workflow_definitions (entity_name, trigger_type, is_active);
