-- 003_dual_control.sql
-- Two-person approval for de-anonymising an incident (mapping
-- employee_id_hash → real employee identity). Two approvals from DISTINCT
-- roles in (hr_head, posh_ic_chair) are required.

BEGIN;

CREATE TABLE IF NOT EXISTS dual_control_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id    uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action         text NOT NULL CHECK (action IN ('deanonymize')),
  requested_by   uuid REFERENCES auth.users(id),
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  approved_at    timestamptz
);

CREATE INDEX IF NOT EXISTS dual_control_requests_incident_idx
  ON dual_control_requests(incident_id);

CREATE TABLE IF NOT EXISTS dual_control_approvals (
  id            bigserial PRIMARY KEY,
  request_id    uuid NOT NULL REFERENCES dual_control_requests(id) ON DELETE CASCADE,
  incident_id   uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  approver_id   uuid NOT NULL REFERENCES auth.users(id),
  approver_role text NOT NULL CHECK (approver_role IN ('hr_head','posh_ic_chair')),
  ts            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, approver_id),
  UNIQUE (request_id, approver_role)   -- distinct roles required
);

CREATE INDEX IF NOT EXISTS dual_control_approvals_request_idx
  ON dual_control_approvals(request_id);

-- When a second, distinct-role approval lands, flip request to 'approved'.
CREATE OR REPLACE FUNCTION dual_control_check_approved()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_distinct_roles int;
BEGIN
  SELECT COUNT(DISTINCT approver_role) INTO v_distinct_roles
    FROM dual_control_approvals
   WHERE request_id = NEW.request_id;
  IF v_distinct_roles >= 2 THEN
    UPDATE dual_control_requests
       SET status = 'approved', approved_at = now()
     WHERE id = NEW.request_id
       AND status = 'pending';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS dual_control_check_approved_trg ON dual_control_approvals;
CREATE TRIGGER dual_control_check_approved_trg
  AFTER INSERT ON dual_control_approvals
  FOR EACH ROW EXECUTE FUNCTION dual_control_check_approved();

-- RLS: only hr_head and posh_ic_chair can see requests/approvals.
ALTER TABLE dual_control_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dual_control_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dcr_read ON dual_control_requests;
CREATE POLICY dcr_read ON dual_control_requests
  FOR SELECT TO authenticated
  USING (auth_role() IN ('hr_head','posh_ic_chair'));

DROP POLICY IF EXISTS dca_read ON dual_control_approvals;
CREATE POLICY dca_read ON dual_control_approvals
  FOR SELECT TO authenticated
  USING (auth_role() IN ('hr_head','posh_ic_chair'));

COMMIT;
