-- Schema-equivalent to 004_create_workflow_definitions.ts.hbs (up).
-- That migration uses Kysely's schema builder rather than a raw `sql` literal,
-- so this file is transcribed by hand rather than extracted. Column names,
-- types, nullability, defaults and the index must match exactly; see
-- docs/MIGRATION-LOCO-ASTRYX.md §6.14.

CREATE TABLE IF NOT EXISTS sys_workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL DEFAULT 'ALL',
    bpmn_xml TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

CREATE INDEX IF NOT EXISTS idx_workflow_def_entity_op ON sys_workflow_definitions (entity_name, operation, is_active);
