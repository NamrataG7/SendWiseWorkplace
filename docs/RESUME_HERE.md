# Resume Here

Cold-pickup checklist for the next time you (or an AI) come back to this repo.

## Current state

Planning only. No code. Five docs:

1. `README.md` — what this is / not, reuse map, related repos
2. `docs/PLAN.md` — the plan, device matrix, taxonomy, MVP scope, timeline
3. `docs/EXTENSION_SPEC.md` — Manifest V3 browser extension architecture, host list, privacy properties
4. `docs/LEGAL_FRAMEWORK.md` — PoSH + DPDPA + IT Act + BNS + US Title VII + UK Equality Act + EU GDPR mapping
5. `docs/GOVERNANCE.md` — role separation, anti-appraisal firewall, retention, DPIA, escalation, sunset

## First 30 minutes when you come back

1. **Skim `README.md`.** Confirm scope (company-owned devices + corporate networks; BYOD voluntary).
2. **Read `docs/PLAN.md`.** Note the taxonomy — 11 categories with per-category routing.
3. **Read `docs/LEGAL_FRAMEWORK.md`.** Confirm you understand PoSH ≠ general bullying and the four-team routing model.
4. **Decide what to build first.** Recommended: browser extension MVP with tier-1 hosts (Slack web, Teams, Gmail, Outlook, Google Chat).
5. **Clone the three related repos side-by-side** so you can copy classifier / dashboard / audit-chain code:
   ```
   git clone https://github.com/NamrataG7/SendWise.git ../SendWise
   git clone https://github.com/NamrataG7/SendWiseForensic.git ../SendWiseForensic
   git clone https://github.com/NamrataG7/SendWiseCampus.git ../SendWiseCampus
   ```

## Suggested first coding session

Extension skeleton in this order:

1. `manifest.json` (MV3) with permissions `activeTab`, `scripting`, `storage`, `alarms` and host permissions for tier-1 hosts in `docs/EXTENSION_SPEC.md`.
2. `content-script.ts` hooks `input` events on `<textarea>` and `contenteditable`.
3. Port the SendWise Random Forest classifier to JS (the JSON output of `SendWise/model_training/export_to_kotlin_json.py` is what you want).
4. Extend the classifier with an initial workplace-corpus corpus split (start with the upstream categories, add `sexual_harassment` and `hate_speech_caste_religion`).
5. Shadow-DOM warning overlay — same flow as SendWise (Edit / Send anyway / Cancel).
6. Options page: on/off, per-category preference, telemetry counter.
7. Bg-worker POST to a placeholder endpoint.

Server, routing engine, PoSH IC console, HR console, MDM guide — later sessions.

## Reuse pointers

| Need | Where in upstream |
|---|---|
| Classifier weights + slur list | `SendWise/model_training/` + `SendWise/SafeKeyboardApp/app/src/main/assets/` |
| Warning-overlay copy pattern | `SendWise/SafeKeyboardApp/app/src/main/res/values/strings.xml` |
| Metadata schema | `SendWise/parental-dashboard/lib/schema.ts` (ViolationIngestSchema) |
| Manifest V3 extension architecture (planning) | `SendWiseCampus/docs/EXTENSION_SPEC.md` |
| Audit chain (Postgres hash chain) | `SendWiseForensic/supabase/migrations/20260831110905_audit_log.sql` |
| Dual-control admin flow | `SendWiseForensic/supabase/migrations/20260902000200_scoped_admin_and_coapproval.sql` + `forensic-console/app/api/admin/officers/coapprove/route.ts` |
| RLS pattern | `SendWiseForensic/supabase/migrations/20260831110906_rls_and_query_gates.sql` and `20260902000000_officer_self_read_rls.sql` |
| Landing / login pattern | `SendWiseForensic/forensic-console/app/page.tsx` + `app/login/` + `app/admin/login/` |
| Multi-role gating example | `SendWiseForensic/forensic-console/app/admin/page.tsx` (role lookup by auth_user_id) |
| Category-routing (net-new — no upstream) | You'll build this |
| Pattern detector for `bullying_persistent` (net-new) | You'll build this |

## Key decisions already made (don't relitigate)

- Manifest V3 Chromium-first; Firefox tier-2; Safari deferred.
- Only company-owned devices are mandated; BYOD is voluntary.
- Broader detection taxonomy than PoSH alone — Code of Conduct is the ground.
- Per-category routing to 4 teams (PoSH IC / HR / EAP / Legal), never blended.
- Anti-appraisal firewall — data never flows to performance systems, contractually and technically.
- Dual-control de-pseudonymisation.
- Category-specific statutory-aligned retention.
- India-first legal framework; US + UK adapters after PoC.

## Open questions to answer during first coding session

1. Model runtime: TF.js or ONNX.js or custom RF loader? Pick smallest binary.
2. Backend host: reuse an existing Supabase project or spin new one per corporate deployment?
3. Which corporate is the pilot partner? Their internal HR / PoSH IC processes shape the routing.
4. What's the corporate corpus for training? Enron corpus baseline + partner-provided anonymised historic Slack / email data.
5. Does the pilot corporate have a data-residency constraint (India-resident infrastructure only)?

## Related work that might overlap

- SendWiseForensic has a working admin console with dual-control that lifts almost verbatim for the PoSH IC de-pseudonymisation flow.
- SendWiseForensic's audit chain migration is directly reusable — the workplace tribunal defensibility problem is analogous to court admissibility.
- SendWiseCampus's browser extension spec is 80% the same code; the delta is host list + category taxonomy + routing endpoint.
- SendWise's parental-dashboard aggregate views are ~60% reusable for the HR aggregate dashboard.

## Timebox for MVP

Three months per `PLAN.md`. Browser extension alone (without PoSH IC console) is usable in ~4 weeks if you route everything to a single HR mailbox for pilot.

## Anti-pattern warnings

- Do NOT start with the PoSH IC console. Start with the extension. If the extension is bad, everything downstream is worse.
- Do NOT lower the confidence threshold on `sexual_harassment` to catch more cases. False PoSH complaints are damaging beyond the platform's remediation.
- Do NOT ship without a DPIA. GDPR Art. 35 makes this mandatory for EU coverage; UK ICO ties enforcement to DPIA quality.
- Do NOT let the corporate ask you to add "productivity" or "engagement" metrics. Refuse. This is the drift point.
- Do NOT integrate with the corporate's performance-management system, ever. Not even read-only.
