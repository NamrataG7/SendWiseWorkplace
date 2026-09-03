-- 004_workplace_schema.sql
-- Core SendWiseWorkplace schema: enums, incidents, category_route, user_roles.
-- See docs/PLAN.md for taxonomy and routing rationale.

BEGIN;

-- ------------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE incident_category AS ENUM (
    'sexual_harassment',
    'hate_speech_caste_religion',
    'hate_speech_gender_lgbtq',
    'hate_speech_disability',
    'hate_speech_race',
    'threats_intimidation',
    'harassment_general',
    'bullying_persistent',
    'power_abuse',
    'self_harm',
    'psychological_safety_erosion'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE platform AS ENUM (
    'slack','teams','gmail','outlook','google_chat','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE route_target AS ENUM (
    'posh_ic','hr','eap','legal','security'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE role AS ENUM (
    'employee','hr_partner','hr_head',
    'posh_ic_member','posh_ic_chair',
    'eap','legal'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------------
-- Incidents
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id_hash   text NOT NULL,                       -- SHA-256 hex
  timestamp          timestamptz NOT NULL,
  category           incident_category NOT NULL,
  severity           text NOT NULL CHECK (severity IN ('low','medium','high')),
  action             text NOT NULL CHECK (action IN ('detected','edited','sent_anyway','cancelled')),
  platform           platform NOT NULL DEFAULT 'other',
  session_id         text NOT NULL,
  assigned_to_role   route_target NOT NULL,
  sla_deadline       timestamptz NOT NULL,
  status             text NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','in_review','closed')),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS incidents_employee_idx ON incidents(employee_id_hash);
CREATE INDEX IF NOT EXISTS incidents_assigned_idx ON incidents(assigned_to_role);
CREATE INDEX IF NOT EXISTS incidents_category_idx ON incidents(category);
CREATE INDEX IF NOT EXISTS incidents_timestamp_idx ON incidents(timestamp);

-- ------------------------------------------------------------------
-- Category routing table + IN seed rows (mirrors lib/routing.ts fallback)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS category_route (
  category      incident_category NOT NULL,
  jurisdiction  text NOT NULL DEFAULT 'IN',
  route_to      route_target NOT NULL,
  sla_days      int NOT NULL,
  PRIMARY KEY (category, jurisdiction)
);

INSERT INTO category_route (category, jurisdiction, route_to, sla_days) VALUES
  ('sexual_harassment',            'IN', 'posh_ic', 90),
  ('hate_speech_caste_religion',   'IN', 'legal',   30),
  ('hate_speech_gender_lgbtq',     'IN', 'hr',      30),
  ('hate_speech_disability',       'IN', 'hr',      30),
  ('hate_speech_race',             'IN', 'legal',   30),
  ('threats_intimidation',         'IN', 'security', 7),
  ('harassment_general',           'IN', 'hr',      30),
  ('bullying_persistent',          'IN', 'hr',      30),
  ('power_abuse',                  'IN', 'hr',      30),
  ('self_harm',                    'IN', 'eap',      3),
  ('psychological_safety_erosion', 'IN', 'hr',      60)
ON CONFLICT (category, jurisdiction) DO NOTHING;

-- ------------------------------------------------------------------
-- User → role mapping (Supabase auth users → workplace role)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  auth_user_id  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          role NOT NULL DEFAULT 'employee',
  granted_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role);

COMMIT;
