# Pilot Runbook — SendWiseWorkplace

One-page rollout checklist for a first-company pilot. Assumes the pilot
covers ~50 employees on managed devices for two weeks.

## Pre-flight (T-7 days)

- [ ] Legal sign-off on **acceptable-use policy** covering on-device
      classification and metadata telemetry. Reference `docs/PLAN.md`
      "Anti-goals" section explicitly.
- [ ] HR + PoSH IC + EAP briefed on the routing table and their console access.
- [ ] Employee-communication drafted: what the tool does, what it does NOT do
      (no productivity monitoring, no manager access, no content storage).
- [ ] Extension published to the Chrome Web Store (unlisted) or hosted as a
      signed CRX for enterprise force-install.

## Deploy the console (T-2 days)

- [ ] Provision a Postgres database (Supabase project, or self-hosted).
- [ ] Run migrations in order:
      ```
      001_audit_log.sql
      004_workplace_schema.sql
      005_rls.sql
      006_dual_control.sql
      ```
- [ ] Populate `user_roles` for the HR / PoSH IC / EAP / Legal users.
- [ ] Deploy `workplace-console/` to Vercel (or equivalent). Set env vars:
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `REDIS_URL` (optional).
- [ ] Smoke-test each console page while logged in as a user with each role.

## Force-install the extension (T-1 day)

- [ ] MDM push per the appropriate guide:
      `docs/MDM_INTUNE.md`, `docs/MDM_JAMF.md`, `docs/MDM_CHROME_ENTERPRISE.md`,
      `docs/MDM_ANDROID_ENTERPRISE.md`.
- [ ] Set `chrome.storage.local.ingest_url` via managed configuration to point
      at the console's `/api/violations` endpoint.
- [ ] Verify on one machine per platform that `chrome://policy` lists the
      extension as force-installed.

## Go-live (T = 0)

- [ ] Send the employee-communication email.
- [ ] Confirm first ingest event lands in `incidents` (send a test slur to a
      throwaway compose window).
- [ ] Confirm routing: PoSH-category test lands in `/posh`, HR-category in `/hr`.

## Weekly cron (T + 7 days)

- [ ] Configure a Vercel Cron (or external scheduler) to hit
      `GET /api/cron/pattern-detect` weekly with the `x-cron-secret` header.
- [ ] Verify a `bullying_persistent` incident is emitted for any employee
      hash with 5+ hostile events in the last 7 days.

## Pilot close (T + 14 days)

- [ ] Aggregate anonymised metrics: total nudges, edit-rate, sent-anyway rate,
      cancel rate, category breakdown, PoSH-IC / HR / EAP volumes.
- [ ] Run employee-trust survey.
- [ ] Legal + PoSH IC + HR retrospective. Decide roll-forward or pause.
