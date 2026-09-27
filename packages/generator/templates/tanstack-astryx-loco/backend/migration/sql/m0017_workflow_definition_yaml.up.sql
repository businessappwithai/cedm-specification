-- An automation built in the application is stored as YAML, and only as YAML.
--
-- Automations used to be written as mermaid with `%%` directives into
-- `mermaid_code`. The modelling language has no mermaid any more: a model is a
-- YAML document, and an automation is its own YAML document in
-- `definition_yaml`. This migration runs in three steps and the Rust half of it
-- (`m0017_workflow_definition_yaml.rs`) does the middle one:
--
--   1. this file adds `definition_yaml`;
--   2. every automation that still holds mermaid is converted to its YAML
--      document, once;
--   3. `m0017_workflow_definition_yaml.finish.sql` drops `mermaid_code` and
--      requires every automation to carry its YAML.
--
-- An ALTER rather than an edit to m0013, for the reason m0013 gives: a database
-- that has already applied m0013 would never see a change made there.
ALTER TABLE sys_workflow_definitions
  ADD COLUMN IF NOT EXISTS definition_yaml TEXT;
