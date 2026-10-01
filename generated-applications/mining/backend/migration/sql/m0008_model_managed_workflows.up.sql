
-- Model-declared workflows (EML `kind: saga`).
--
-- Two things the seed needs that the original table did not offer.
--
-- `name` becomes unique because the seed upserts by it: a workflow declared in
-- the model has one definition, and regenerating must update that row rather
-- than accumulate a duplicate on every run.
--
-- `is_model_managed` marks a definition as belonging to the model. The
-- Workflow Designer presents those read-only. Without the flag, regenerating
-- would silently overwrite whatever someone had edited in the UI under the same
-- name — losing their work with no warning, which is the worst outcome
-- available. A workflow drawn in the designer is unmarked and untouched by
-- generation.

ALTER TABLE sys_workflow_definitions
  ADD COLUMN IF NOT EXISTS is_model_managed BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing rows may already hold duplicates, so the constraint is added only
-- when the data allows it; a duplicate name is reported rather than the whole
-- migration failing on a database that predates this rule.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sys_workflow_definitions GROUP BY name HAVING COUNT(*) > 1) THEN
    RAISE WARNING 'sys_workflow_definitions has duplicate names; skipping the unique constraint. Deduplicate, then re-run this migration.';
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'sys_workflow_definitions_name_key'
    ) THEN
      ALTER TABLE sys_workflow_definitions
        ADD CONSTRAINT sys_workflow_definitions_name_key UNIQUE (name);
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workflow_def_model_managed
  ON sys_workflow_definitions (is_model_managed) WHERE is_model_managed;
