-- Extracted verbatim from 006_create_audit_log.ts.hbs (up).
-- Both stacks must emit the same schema; see docs/MIGRATION-LOCO-ASTRYX.md §6.14.
-- Regenerate with scripts/extract-sys-ddl.ts — do not hand-edit.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS audit_log (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Key of the matching immudb entry, when an immudb server is configured.
    immudb_key        VARCHAR(200),

    timestamp         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Actor
    user_id           VARCHAR(200),
    user_name         VARCHAR(200),
    user_email        VARCHAR(200),
    session_id        VARCHAR(200),

    -- What happened
    action            VARCHAR(100) NOT NULL,
    entity_type       VARCHAR(100),
    entity_id         VARCHAR(200),
    before_value      JSONB,
    after_value       JSONB,
    changed_fields    TEXT[]       NOT NULL DEFAULT '{}',

    -- Request context
    ip_address        VARCHAR(45),
    user_agent        TEXT,
    source            VARCHAR(50)  NOT NULL DEFAULT 'WEB_UI',
    request_id        VARCHAR(200),
    correlation_id    VARCHAR(200),

    -- Outcome
    success           BOOLEAN      NOT NULL DEFAULT TRUE,
    error_message     TEXT,

    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

CREATE INDEX IF NOT EXISTS idx_audit_timestamp   ON audit_log (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_user_id     ON audit_log (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_action      ON audit_log (action);

CREATE INDEX IF NOT EXISTS idx_audit_entity_type ON audit_log (entity_type);

CREATE INDEX IF NOT EXISTS idx_audit_entity_id   ON audit_log (entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_success     ON audit_log (success);
