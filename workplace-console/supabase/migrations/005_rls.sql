-- 002_rls.sql
-- Row Level Security for the SendWiseWorkplace console.
-- Simplified from SendWiseForensic: no case / warrant / officer scoping.
-- Access is by workplace role (see enum `role` in 004_workplace_schema.sql).
--
-- Policy summary (docs/PLAN.md governance):
--   employee        : no read on incidents
--   hr_partner      : reads incidents assigned_to_role = 'hr'
--   hr_head         : reads incidents assigned_to_role in ('hr','legal','security')
--   posh_ic_member  : reads incidents assigned_to_role = 'posh_ic'
--   posh_ic_chair   : same as posh_ic_member
--   eap             : reads incidents assigned_to_role = 'eap'
--   legal           : reads incidents assigned_to_role in ('legal','security')

CREATE OR REPLACE FUNCTION auth_role() RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM user_roles WHERE auth_user_id = auth.uid() LIMIT 1),
    'employee'
  );
$$;

COMMENT ON FUNCTION auth_role IS
  'Resolves the workplace role for the current authenticated user via user_roles.';

-- ------------------------------------------------------------------
-- incidents RLS
-- ------------------------------------------------------------------
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incidents_hr_read ON incidents;
CREATE POLICY incidents_hr_read ON incidents
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'hr_partner' AND assigned_to_role = 'hr'
  );

DROP POLICY IF EXISTS incidents_hr_head_read ON incidents;
CREATE POLICY incidents_hr_head_read ON incidents
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'hr_head' AND assigned_to_role IN ('hr','legal','security')
  );

DROP POLICY IF EXISTS incidents_posh_read ON incidents;
CREATE POLICY incidents_posh_read ON incidents
  FOR SELECT TO authenticated
  USING (
    auth_role() IN ('posh_ic_member','posh_ic_chair')
    AND assigned_to_role = 'posh_ic'
  );

DROP POLICY IF EXISTS incidents_eap_read ON incidents;
CREATE POLICY incidents_eap_read ON incidents
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'eap' AND assigned_to_role = 'eap'
  );

DROP POLICY IF EXISTS incidents_legal_read ON incidents;
CREATE POLICY incidents_legal_read ON incidents
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'legal' AND assigned_to_role IN ('legal','security')
  );

-- Writes: only service_role (ingest API, cron) inserts incidents.
-- authenticated users cannot INSERT/UPDATE/DELETE directly.
REVOKE INSERT, UPDATE, DELETE ON incidents FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON incidents FROM authenticated';
  END IF;
END $$;

-- ------------------------------------------------------------------
-- category_route: read-only for all authenticated console users.
-- ------------------------------------------------------------------
ALTER TABLE category_route ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS category_route_read ON category_route;
CREATE POLICY category_route_read ON category_route
  FOR SELECT TO authenticated USING (true);

-- ------------------------------------------------------------------
-- user_roles: self-read only. Writes via service_role during onboarding.
-- ------------------------------------------------------------------
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_self_read ON user_roles;
CREATE POLICY user_roles_self_read ON user_roles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
