-- `sys_report` — the questions the model declared with `%%report`.
--
-- Not to be confused with `sys_report_designs` (m0011), which holds one
-- printable document layout per entity: the thing the Print button renders for
-- a single record. This table holds analytical queries over the whole database
-- — the questions the model's author said were worth asking, each with the SQL
-- that answers it.
--
-- `sql_text` stores the query rather than a reference to one, because the query
-- has no life of its own here: it *is* the report. That makes this column the
-- one place in the application where text authored in a document becomes a
-- statement, and it is guarded three times. The checker refuses a write at
-- authoring time (EML293); the generator refuses one before it can reach
-- `seed/reports.sql`; and `controllers::report` refuses one again before it
-- runs. The third is not redundant, and it is the reason the column is not
-- simply trusted: this is an ordinary table, so a later migration, a restored
-- backup, or anyone with database access could put a statement here that the
-- backend would otherwise run with its own credentials.
CREATE TABLE IF NOT EXISTS sys_report (
    sys_report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The model's own identifier for the question, and how it is addressed:
    -- GET /api/reports/{name}. Unique, because two rows under one name would
    -- make whichever the seed wrote last the only one anybody could open.
    name VARCHAR(120) NOT NULL,
    title VARCHAR(255) NOT NULL,
    -- The entity the question is mainly about, when it is about one, and the
    -- table that entity became. Resolved by the generator rather than here:
    -- it is the only place holding both the model's names and the schema's.
    entity_name VARCHAR(100),
    table_name VARCHAR(100),
    -- Absent means a table of rows; present means a chart of this type beside
    -- it, plotting x_axis against y_axis. Both axes are required when it is
    -- set — a chart with one renders nothing and reports no error.
    chart VARCHAR(20),
    x_axis VARCHAR(100),
    y_axis VARCHAR(100),
    -- Who asks this question and why, in the author's own words.
    help TEXT,
    sql_text TEXT NOT NULL,
    -- Declaration order: the order the author wrote the questions in, and the
    -- only ordering the model expresses.
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sys_report_name UNIQUE (name)
);

-- The list is grouped by table and ordered within each group, which is the only
-- access pattern the reports screen has.
CREATE INDEX IF NOT EXISTS idx_sys_report_table_name
    ON sys_report (table_name, sort_order);
