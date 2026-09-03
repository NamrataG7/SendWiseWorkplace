# SendWiseWorkplace

**Corporate workplace cyberbullying + harassment prevention — on managed devices, privacy-preserving, category-routed.**

## Status: MVP

An academic-grade MVP is in the tree:

- `workplace-extension/` — Manifest V3 browser extension (Slack web, Teams
  web, Gmail, Outlook, Google Chat). Keyword classifier + Shadow-DOM nudge
  overlay + metadata-only telemetry.
- `workplace-console/` — Next.js console with HR, PoSH IC, and EAP views
  routed by the 11-category taxonomy. Supabase for auth + storage;
  dual-control (hr_head + posh_ic_chair) required for de-anonymisation.
- `docs/` — Extension spec, plan, taxonomy, MDM force-install guides
  (Intune / Jamf / Chrome Enterprise / Android Enterprise), pilot runbook.

## Quickstart

```
git clone <this repo>
cd SendWiseWorkplace/workplace-console
pnpm install    # or: npm install
pnpm dev        # or: npm run dev
# Console at http://localhost:3000
```

Load the extension unpacked:

1. `chrome://extensions` → Developer mode → **Load unpacked**.
2. Select `workplace-extension/`.
3. Open the extension **Options**; point the ingest URL at
   `http://localhost:3000/api/violations`.

Without Supabase env vars the console still boots — API routes log-and-no-op
so you can smoke-test the extension → console POST path locally.

## Architecture (ASCII)

```
+-------------------------------------------------------------+
|  Managed workstation (Slack web / Teams / Gmail / Outlook)  |
|                                                             |
|  Content script (Shadow-DOM nudge)                          |
|      ├── keyword classifier (on-device)                     |
|      └── background service worker                          |
|              │  metadata only                               |
|              ▼                                              |
+-------------------------------------------------------------+
               │  POST /api/violations
               ▼
+-------------------------------------------------------------+
|  workplace-console (Next.js on Vercel / self-host)          |
|      ├── category-routing engine (lib/routing.ts)           |
|      ├── incidents table  (Supabase Postgres)               |
|      ├── audit_log (hash-chained, append-only)              |
|      ├── dual-control approvals (hr_head + posh_ic_chair)   |
|      └── /api/cron/pattern-detect  (weekly, x-cron-secret)  |
|                                                             |
|      Consoles (RLS-gated by user_roles):                    |
|        /hr    HR grievance                                  |
|        /posh  PoSH IC queue with 90-day SLA countdown       |
|        /eap   Self-harm + persistent bullying with consent  |
+-------------------------------------------------------------+
```

## Docs

- `docs/PLAN.md` — full plan, device matrix, 11-category taxonomy, routing.
- `docs/EXTENSION_SPEC.md` — Manifest V3 architecture, host list.
- `docs/TODO.md` — phased implementation checklist.
- `docs/PILOT_RUNBOOK.md` — one-page rollout checklist.
- `docs/MDM_INTUNE.md`, `docs/MDM_JAMF.md`, `docs/MDM_CHROME_ENTERPRISE.md`,
  `docs/MDM_ANDROID_ENTERPRISE.md` — force-install recipes per MDM.
- `docs/LEGAL_FRAMEWORK.md` — PoSH Act, DPDPA, IT Act, BNS mapping.
- `docs/GOVERNANCE.md` — HR vs. PoSH IC vs. EAP separation.

## Concept in one line

Reuse the [SendWise](https://github.com/NamrataG7/SendWise) privacy-preserving
on-device supervision model on **company-owned devices and networks**, detect
Code-of-Conduct-violating behaviour, and route each detected incident to the
**legally correct** authority (PoSH IC, HR grievance, EAP, or Legal) instead of
blending everything into "harassment."

## Why this is defensible

Corporate is the strongest legal ground of the three SendWise variants:

| Question | Answer |
|---|---|
| Whose device? | The employer's. Zero ambiguity. |
| Whose network? | The employer's. |
| What law applies? | Contract law (employment agreement) + DPDPA §7(b) + IT Act §43A. Not surveillance law. |
| Consent problem? | Employment agreement + acceptable-use policy = valid contract-based consent. |

Every enterprise already runs Zscaler / Netskope / Microsoft Defender / Crowdstrike. What SendWiseWorkplace adds is the **behavioural, wellbeing, and harassment angle** these tools ignore — and it does it **on-device**, so message content never leaves the employee's machine unless the employee reports it.

## What this covers — broader than PoSH

PoSH Act 2013 covers only **sexual harassment**. Real workplace cyberbullying is broader. See `docs/PLAN.md` for the full 11-category taxonomy and routing rules.

## What this is NOT

- **Not productivity surveillance.** No keystrokes-per-hour. No idle-time tracking. No screen recording. Refused by design.
- **Not performance-review input.** Data never flows to appraisals. Written into policy, enforced by role separation.
- **Not manager-visible.** Direct managers do not see their reports' data. Only HR / PoSH IC / EAP see incident-level data, and only per the routing table.
- **Not [SendWiseForensic](https://github.com/NamrataG7/SendWiseForensic).** That is a law-enforcement fork that inverts SendWise's privacy model under judicial warrant. SendWiseWorkplace preserves the privacy model — content stays on device.
- **Not for enforcing "tone" or dissent.** Detects harassment / hate / threats / bullying. Does not flag criticism of management, informal language, or protected concerted activity.

## Related repos

- Upstream: https://github.com/NamrataG7/SendWise
- Law-enforcement fork: https://github.com/NamrataG7/SendWiseForensic
- College adaptation: https://github.com/NamrataG7/SendWiseCampus

## Contact

Namrata Gaikwad — namratamgaikwad@gmail.com

## Licence

MIT (inherits from SendWise).
