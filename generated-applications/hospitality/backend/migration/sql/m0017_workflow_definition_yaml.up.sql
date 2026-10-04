-- An automation built in the application is stored as YAML: its own document,
-- in `definition_yaml`. This migration runs in two steps, with the Rust half
-- (`m0017_workflow_definition_yaml.rs`) between them:
--
--   1. this file adds `definition_yaml`;
--   2. the Rust half refuses a database holding an automation with no YAML
--      document — one saved by a release older than this column, which must be
--      upgraded with that release first;
--   3. `m0017_workflow_definition_yaml.finish.sql` requires every definition to
--      carry the content its kind implies.
--
-- An ALTER rather than an edit to m0013, for the reason m0013 gives: a database
-- that has already applied m0013 would never see a change made there.
ALTER TABLE sys_workflow_definitions
  ADD COLUMN IF NOT EXISTS definition_yaml TEXT;
