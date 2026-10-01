-- `sys_system` — configuration an operator can change without a redeploy.
--
-- The app already has a configuration surface: Loco's `settings` block in
-- `config/*.yaml`, resolved from the environment at boot. That is the right
-- place for values a deployment fixes, and the wrong place for values an
-- operator needs to change while the app is running: turning the AI add-on on
-- means editing a YAML file on the host and restarting, which in a container
-- means a redeploy to change a URL.
--
-- This table is the layer above it. `services::system_config` resolves a key as
-- DB row (active, non-empty) -> settings block -> compiled default, so a row
-- here overrides the deployment and its absence changes nothing. Values needed
-- *before* the database is reachable — the connection string itself, the
-- listen address, the environment name — deliberately have no row here and
-- stay in configuration where they can be read without a query.
--
-- Rows are served through the generic dictionary route (`/api/sys/system`), so
-- there is no bespoke controller: reads are open like the rest of `sys`, writes
-- need a token.
CREATE TABLE IF NOT EXISTS sys_system (
    sys_system_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(200) NOT NULL,
    config_value TEXT,
    -- What the value means to a reader: string, text, number or boolean. The
    -- column stays TEXT whatever this says — a typed column per kind would
    -- make adding a setting a migration.
    data_type VARCHAR(20) NOT NULL DEFAULT 'string',
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    description TEXT,
    -- Masked wherever the value is displayed. It does not encrypt anything:
    -- an operator with database access can read the row, and an API key that
    -- has to be usable cannot be hashed.
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    -- An inactive row is ignored by the resolver, which falls through to the
    -- settings block. That is how a setting is reverted to the deployment's
    -- value without deleting the row and losing its description.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(200),
    updated_by VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- The key is the identity: the resolver looks a setting up by name, and two
    -- rows of one name would make which value wins an ordering accident.
    CONSTRAINT uq_sys_system_config_key UNIQUE (config_key)
);

-- The admin screen lists by category, then key.
CREATE INDEX IF NOT EXISTS idx_sys_system_category
    ON sys_system (category, config_key);
