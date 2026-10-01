-- Administrator-designed document layouts, one per business table.
--
-- `layout` holds the report designer's own JSON. It is opaque to the backend:
-- the server stores and returns it, and the designer in the front end is the
-- only thing that reads its shape. Keeping it that way is deliberate — a layout
-- format the API validates is a layout format the API has to be redeployed to
-- change, which is the opposite of the promise the dictionary makes.
CREATE TABLE IF NOT EXISTS sys_report_designs (
    sys_report_design_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Default Report',
    layout JSONB,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sys_report_designs_table_name_unique UNIQUE (table_name)
);
