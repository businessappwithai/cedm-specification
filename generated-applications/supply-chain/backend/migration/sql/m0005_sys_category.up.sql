-- Extracted verbatim from 005_create_sys_category.ts.hbs (up).
-- Both stacks must emit the same schema; see docs/MIGRATION-LOCO-ASTRYX.md §6.14.
-- Regenerate with scripts/extract-sys-ddl.ts — do not hand-edit.

CREATE TABLE IF NOT EXISTS sys_category (
    sys_category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,

    -- Presentation: the dashboard uses these to render the category header
    icon VARCHAR(50),
    color VARCHAR(20),

    -- Ordering. The dashboard sorts by name, but seq_no lets an administrator
    -- pin important categories to the top of admin listings.
    seq_no INTEGER NOT NULL DEFAULT 0,

    -- Exactly one category may be the fallback for uncategorised entities.
    is_default BOOLEAN NOT NULL DEFAULT false,

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system'
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_category_single_default
    ON sys_category ((is_default)) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_sys_category_name ON sys_category (name);

ALTER TABLE sys_table
    ADD COLUMN IF NOT EXISTS sys_category_id UUID
    REFERENCES sys_category(sys_category_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sys_table_category ON sys_table (sys_category_id);
