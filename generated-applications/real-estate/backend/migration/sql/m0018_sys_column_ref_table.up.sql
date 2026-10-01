-- `sys_column.ref_table_name` — the table a lookup points at, where its name
-- does not say.
--
-- A lookup's target has always been derived from the column's name:
-- `compound_id` → `bus_compound`, `reported_by_id` → `bus_user`. A model written
-- in CEDM names its targets outright — `deliveryLocation → Location` — and the
-- column that holds that reference, `delivery_location_id`, would derive a
-- `bus_delivery_location` nothing declares, so the form would show a raw id.
--
-- The column is written only where the stated target and the derived one
-- differ; every resolver reads it first and falls back to the name. NULL, which
-- is every row of every model without such a reference, means exactly what the
-- dictionary meant before this migration.
ALTER TABLE sys_column
    ADD COLUMN IF NOT EXISTS ref_table_name VARCHAR(255);
