-- Credential store for Loco's native JWT auth (decision D1, option A).
--
-- This REPLACES the Better Auth tables (`user`, `session`, `account`,
-- `verification`) the TypeScript stack created — Better Auth is a Node library
-- with no Rust port. It is the one deliberate break in the schema contract;
-- see docs/MIGRATION-LOCO-ASTRYX.md §6.8.
--
-- `sys_user` and the `sys_user_roles` RBAC join are NOT touched: they are
-- created by m0001 exactly as before. Only the credential store changes, and
-- the link between the two is the `sys_user_id` column below.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    pid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    reset_sent_at TIMESTAMPTZ,
    email_verification_token VARCHAR(255),
    email_verification_sent_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    magic_link_token VARCHAR(255),
    magic_link_expiration TIMESTAMPTZ,
    sys_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_pid ON users (pid);

CREATE INDEX IF NOT EXISTS idx_users_sys_user ON users (sys_user_id);
