# SendWiseWorkplace — Implementation TODO

Academic project. **Reuse-first**: copy from `SendWise` (parental-dashboard, SafeKeyboardApp, model_training) and, only when needed, from `SendWiseForensic` (audit chain, dual-control, RLS, jurisdiction adapters). Minimize net-new code.

All commits: author `namratamgaikwad@gmail.com`.

---

## Phase 0 — Repo bootstrap (0.5 day)

- [ ] `git config user.email namratamgaikwad@gmail.com` in this repo.
- [ ] Add MIT LICENSE (inherit from SendWise).
- [ ] Root `package.json` workspaces: `workplace-console/`, `workplace-extension/`, `workplace-keyboard/` (optional), `packages/*`.
- [ ] `.gitignore` (node_modules, .next, .env*, build artifacts).

## Phase 1 — Reuse import (copy, don't rewrite) (1 day)

- [ ] Copy `SendWise/parental-dashboard/` → `workplace-console/`. Keep Next.js + Supabase + Tailwind + middleware as-is.
- [ ] Copy `SendWise/SafeKeyboardApp/` → `workplace-keyboard/` (rename package; defer heavy changes).
- [ ] Copy `SendWise/model_training/` → `model_training/` (RF classifier + `export_to_kotlin_json.py`).
- [ ] Copy Forensic migrations 05 (audit chain) + 06 (RLS) + `20260902000200_scoped_admin_and_coapproval.sql` into `workplace-console/supabase/migrations/` (rename timestamps, drop warrant columns).
- [ ] Copy Forensic `packages/legal-framework/` → `packages/legal-framework/` (keep only IN adapter for MVP; stub US/UK).
- [ ] Global search/replace: `parental` → `workplace`, `child`/`student` → `employee`, `parent` → `hr_partner`, `forensic`/`officer` → `hr_officer`/`posh_ic`.

## Phase 2 — Data model & routing (2 days, net-new minimal)

- [ ] Extend `ViolationIngestSchema` in `workplace-console/lib/schema.ts`: add `category` enum (11 values from PLAN.md), `severity`, `platform`, `anonymous_user_hash`.
- [ ] New migration `add_category_routing.sql`: `category_route(category, jurisdiction, route_to enum[posh_ic|hr|eap|legal|security], sla_days)`. Seed India rows per PLAN.md routing table.
- [ ] Simplify Forensic audit chain: keep `prev_hash`, `payload_hash`, `actor_id`, drop `warrant_id`/`scope`.
- [ ] Dual-control table adapt: `dual_control_approvals(request_id, approver_role in [hr_head, posh_ic_chair], approved_at)`.
- [ ] RLS policies: employee = no read; HR partner = aggregate only; PoSH IC = PoSH-category rows only; EAP = self-harm/bullying rows only.

## Phase 3 — Browser extension MVP (3-4 days, mostly reuse EXTENSION_SPEC.md)

- [ ] `workplace-extension/manifest.json` (MV3): permissions `activeTab`, `scripting`, `storage`, `alarms`; host_permissions for Slack web, Teams web, Gmail, Outlook, Google Chat (per EXTENSION_SPEC.md).
- [ ] `content-script.ts`: hook `input` events on `<textarea>` + `[contenteditable]`. Debounce 250ms.
- [ ] Port RF classifier from `model_training/` JSON export → `classifier.ts` (reuse JS loader from SendWiseCampus spec).
- [ ] Slur lists: reuse SendWise base + add caste/religion/disability/LGBTQ lists to `assets/slurs-workplace.json`.
- [ ] Shadow-DOM warning overlay: port from SafeKeyboardApp `strings.xml` copy (Edit / Send anyway / Cancel).
- [ ] Options page: on/off toggle, per-category preference, telemetry counter (reuse SendWise options page HTML).
- [ ] Background service worker: POST `{category, severity, confidence, platform, anon_hash, ts}` to console `/api/ingest`.
- [ ] Local build test on Chrome; load unpacked; verify overlay on Gmail compose.

## Phase 4 — Console (HR + PoSH IC + EAP views) (3 days, reuse dashboard)

- [ ] Reuse `workplace-console/app/api/ingest/route.ts` from parental-dashboard, extend to write `category` and enqueue routing.
- [ ] Category-routing engine `lib/routing.ts`: on ingest → lookup `category_route` → insert into `incidents` with `assigned_to_role`.
- [ ] Pattern detector cron (`app/api/cron/pattern-detect/route.ts`): SQL group by (sender_hash, recipient_hash) over 7d ≥ 5 hostile → emit `bullying_persistent`.
- [ ] `app/hr/page.tsx`: aggregate dashboard (reuse parental-dashboard insights page; strip child-specific fields).
- [ ] `app/posh/page.tsx`: PoSH IC queue — 90-day countdown per case, evidence chain view (reuse Forensic case detail component).
- [ ] `app/eap/page.tsx`: self-harm/persistent-bullying queue with consent-flow button.
- [ ] `app/admin/coapprove/route.ts`: dual-control de-anonymisation (adapt from Forensic PR#32 pattern).
- [ ] Auth: reuse Supabase auth + role gating from Forensic `app/admin/page.tsx` (roles: `employee`, `hr_partner`, `hr_head`, `posh_ic_member`, `posh_ic_chair`, `eap`, `legal`).

## Phase 5 — Keyboard (optional, defer if time-tight) (2 days)

- [ ] Rename package `com.sendwise.workplace.keyboard`.
- [ ] Reuse RF classifier assets unchanged.
- [ ] Add corporate slur lists to `assets/`.
- [ ] Strip parental-pairing UX; replace with MDM-provisioned server URL.
- [ ] Point ingest URL at workplace-console.

## Phase 6 — Deployment docs (1 day, docs only)

- [ ] `docs/MDM_INTUNE.md`, `docs/MDM_JAMF.md`, `docs/MDM_CHROME_ENTERPRISE.md`, `docs/MDM_ANDROID_ENTERPRISE.md` — short "force-install extension ID X" recipes.
- [ ] `docs/PILOT_RUNBOOK.md` — one-page rollout checklist.
- [ ] Update `README.md`: replace "planning repo" banner with "MVP" + quickstart.

## Phase 7 — Verification (1 day)

- [ ] Manual: type slur in Gmail → overlay fires → click "Send anyway" → row appears in HR dashboard with correct category.
- [ ] Manual: PoSH-category event → routes to PoSH queue, not HR queue.
- [ ] Manual: dual-control de-anonymisation requires two role approvals.
- [ ] Manual: pattern detector cron catches 5+ hostile messages in a week.
- [ ] `pnpm build` in `workplace-console/` passes.
- [ ] Extension loads unpacked without console errors.

---

## Reuse ledger (source → dest, one-line each)

| Source | Dest | Change |
|---|---|---|
| `SendWise/parental-dashboard/*` | `workplace-console/` | rename terms, add category |
| `SendWise/SafeKeyboardApp/*` | `workplace-keyboard/` | strip parental UX |
| `SendWise/model_training/*` | `model_training/` | as-is |
| `SendWiseForensic/supabase/migrations/2026...05_audit_log.sql` | `workplace-console/supabase/migrations/` | drop warrant cols |
| `SendWiseForensic/supabase/migrations/2026...06_rls*.sql` | same | adapt roles |
| `SendWiseForensic/.../scoped_admin_and_coapproval.sql` | same | rename roles |
| `SendWiseForensic/packages/legal-framework/` | `packages/legal-framework/` | keep IN adapter |
| `SendWiseForensic/forensic-console/app/admin/officers/coapprove/` | `workplace-console/app/api/admin/coapprove/` | rename actors |
| `docs/EXTENSION_SPEC.md` (this repo) | `workplace-extension/` implementation | direct spec |

## Anti-goals (do NOT build)

- Productivity metrics, keystroke logging, screen recording, manager-visible views, appraisal integrations.
- Slack/Teams native desktop hooks (deferred).
- Voice/video capture.
- US/UK adapters beyond stubs (deferred post-MVP).

## Estimated total: ~2 weeks solo, reuse-heavy. Academic-grade demo achievable in 1 week if Phase 5 (keyboard) is skipped.
