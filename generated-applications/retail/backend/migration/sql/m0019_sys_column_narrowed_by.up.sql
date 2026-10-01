-- `sys_column.narrowed_by` — which other columns of the same record narrow a
-- lookup's choices.
--
-- A state is chosen from the states of the country already chosen; a city from
-- the cities of the state. The column holds the rule as JSON text:
-- `[{"by": "country_id", "on": "country_id"}]` — the lookup lists only the rows
-- whose `on` column equals the record's `by` column, and a write that names a
-- row outside that set is refused. NULL, which is every column of every model
-- that states no narrowing, means what the dictionary meant before this
-- migration: every row is offered.
ALTER TABLE sys_column
    ADD COLUMN IF NOT EXISTS narrowed_by TEXT;
