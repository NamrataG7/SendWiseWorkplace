-- 001_audit_log.sql
-- Append-only, hash-chained audit log for the SendWiseWorkplace console.
-- Simplified from SendWiseForensic: no warrant / scope / officer concepts.
-- Actors are workplace roles (see enum `role` in 004_workplace_schema.sql).

-- The `role` and `audit_action` enums are defined in migration 004 to keep
-- workplace-specific vocabulary in one place. This migration only creates
-- the audit table itself, guarded so it can run before or after 004.

CREATE TABLE IF NOT EXISTS audit_log (
  id            bigserial PRIMARY KEY,
  prev_hash     text,               -- hex sha256; NULL only for the first row
  actor_id      uuid,               -- auth.users.id, or NULL for SYSTEM
  actor_role    text NOT NULL,      -- one of `role` enum values (workplace roles)
  action        text NOT NULL,      -- free-form action tag (e.g. 'incident.route')
  target_type   text,
  target_id     text,
  payload_hash  text,               -- optional sha256 of external payload
  context       jsonb NOT NULL DEFAULT '{}'::jsonb,
  ts            timestamptz NOT NULL DEFAULT now(),
  hash          text NOT NULL       -- sha256(prev_hash || canonical payload)
);

CREATE INDEX IF NOT EXISTS audit_log_actor_idx  ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_target_idx ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS audit_log_ts_idx     ON audit_log(ts);

-- ------------------------------------------------------------------
-- Hash computation trigger
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_log_compute_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_prev_hash text;
  v_payload   text;
BEGIN
  SELECT hash INTO v_prev_hash FROM audit_log ORDER BY id DESC LIMIT 1;
  NEW.prev_hash := v_prev_hash;
  v_payload := concat_ws('|',
    COALESCE(v_prev_hash, ''),
    COALESCE(NEW.actor_id::text, ''),
    NEW.actor_role,
    NEW.action,
    COALESCE(NEW.target_type, ''),
    COALESCE(NEW.target_id, ''),
    COALESCE(NEW.payload_hash, ''),
    COALESCE(NEW.context::text, '{}'),
    NEW.ts::text
  );
  NEW.hash := encode(extensions.digest(v_payload, 'sha256'), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_log_compute_hash_trg ON audit_log;
CREATE TRIGGER audit_log_compute_hash_trg
  BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_compute_hash();

-- ------------------------------------------------------------------
-- Append-only enforcement
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_log_reject_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only; % is forbidden', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_reject_mutation();

DROP TRIGGER IF EXISTS audit_log_no_delete ON audit_log;
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_reject_mutation();

REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE UPDATE, DELETE, INSERT ON audit_log FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE UPDATE, DELETE ON audit_log FROM authenticated';
    -- authenticated retains INSERT via the p_append_audit function only.
    EXECUTE 'REVOKE INSERT ON audit_log FROM authenticated';
  END IF;
END $$;

-- ------------------------------------------------------------------
-- Sanctioned write path
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION p_append_audit(
  p_actor_id     uuid,
  p_actor_role   text,
  p_action       text,
  p_target_type  text  DEFAULT NULL,
  p_target_id    text  DEFAULT NULL,
  p_payload_hash text  DEFAULT NULL,
  p_context      jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id bigint;
BEGIN
  INSERT INTO audit_log (actor_id, actor_role, action, target_type, target_id, payload_hash, context)
  VALUES (p_actor_id, p_actor_role, p_action, p_target_type, p_target_id, p_payload_hash, p_context)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION p_append_audit IS
  'Only sanctioned write path for audit_log. SECURITY DEFINER — callers append without direct INSERT.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION p_append_audit(uuid, text, text, text, text, text, jsonb) TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION p_append_audit(uuid, text, text, text, text, text, jsonb) TO service_role';
  END IF;
END $$;
