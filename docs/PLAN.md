# Plan — SendWiseWorkplace

## Goal

Reduce workplace cyberbullying, harassment, and Code-of-Conduct violations at corporate employers via a privacy-preserving on-device nudge system deployed only on company-owned devices and corporate networks. Category-routed to the correct authority (PoSH IC / HR / EAP / Legal). No productivity monitoring. No manager visibility.

## Device / network matrix

| Layer | Tool | Enforcement | Notes |
|---|---|---|---|
| Company laptop (Windows / macOS / Linux) | Browser extension | Force-install via corporate MDM (Intune / Jamf / Kandji / Google Admin) | Slack web, Teams web, Gmail, Outlook — covers ~80% of workplace messaging |
| Company Chromebook | Browser extension | Chrome Enterprise policy | Chromebooks are 100% browser — total coverage |
| Company Android phone | SendWise IME + browser extension in Chrome | Android Enterprise / Managed Google Play | For roles that get company phones — WhatsApp Business, native Slack app |
| Company iPhone | Safari Web Extension + Chrome extension for mobile Chrome | Apple Business Manager + Managed App Config | Limited — iOS restricts extension capability. MDM policy compensates. |
| Corporate WiFi / VPN | DNS + category filter at gateway | Existing enterprise stack | Baseline; SendWiseWorkplace does not build this — integrates with existing |
| Slack / Teams / Zoom desktop apps | **NOT covered by browser extension** — need Slack DLP APIs, Teams Graph API, or OS-level hook | Separate work | Deferred; browser web versions cover initial MVP |
| BYOD (personal device) | Voluntary install only | User install; nothing forced | Same privacy-preserving mode as upstream SendWise |

## Detection taxonomy (broader than SendWise upstream)

Upstream SendWise categories, plus new corporate-specific ones:

| Category | Upstream / new | Routes to |
|---|---|---|
| `sexual_harassment` | Refined from upstream `sexual_content` | PoSH Internal Committee |
| `hate_speech_caste_religion` | Split from upstream `hate_speech` | HR + Legal |
| `hate_speech_gender_lgbtq` | Split from upstream `hate_speech` | HR grievance |
| `hate_speech_disability` | New | HR + Compliance |
| `hate_speech_race` | Split from upstream `hate_speech` | HR + Legal (if extreme) |
| `threats_intimidation` | Refined from upstream `threats` | HR + Security + Legal |
| `harassment_general` | Upstream `harassment` | HR grievance |
| `bullying_persistent` | New — pattern-based, not per-message | HR grievance / EAP |
| `power_abuse` | New — manager-to-report markers | HR grievance + Skip-level (very hard, do later) |
| `self_harm` | Upstream | EAP + counselling (with employee consent) |
| `psychological_safety_erosion` | Research territory | Deferred |

Each event carries `category + severity + confidence + timestamp + anonymous_user_hash + platform (Slack/Teams/Gmail/...)`.

## Routing rules — per-category, deterministic

- Sexual harassment → PoSH IC (India) / EEO complaint (US) / Equality Act channel (UK). Statutory timelines apply.
- Hate speech (caste, race, religion) → HR + Legal.
- Threats → HR + Security + Legal, potentially criminal referral.
- Discrimination (LGBTQ, disability) → HR grievance + D&I office.
- General bullying → HR grievance / EAP.
- Persistent pattern (5+ hostile messages to same recipient / week) → HR grievance.
- Self-harm → EAP + duty-of-care escalation (with consent).

## Reuse table

| From | Reuse as-is | Modify | Discard |
|---|---|---|---|
| SendWise `SafeKeyboardApp/` | RF classifier, warning overlay, metadata schema, slur list | Rename to `SendWiseWorkplace-Keyboard`; MDM enrollment; add corporate corpus | Parental pairing UX |
| SendWise `parental-dashboard/` | Next.js + Supabase + Redis stack; middleware | Parent → HR partner; child → employee; add category-routing config UI | Insights page (rewrite for HR use) |
| SendWiseCampus `docs/EXTENSION_SPEC.md` | Manifest V3 spec, Shadow DOM overlay pattern, privacy properties | Host list — add corporate messaging apps; add routing endpoint | — |
| SendWiseForensic RLS + audit chain | migrations 05 + 06 | Simplify — no warrants; keep hash chain and role gating | Warrant/scope columns |
| SendWiseForensic dual-control admin | PR #32 pattern | HR head + PoSH IC chair must both approve any de-anonymisation | Officer / judicial roles |
| SendWiseForensic jurisdiction adapters | `packages/legal-framework/` | Rewrite adapters for corporate law (PoSH, Title VII, Equality Act, GDPR employment) | Warrant-issuance concept |

## New work (net-new to any repo)

1. **Category-routing engine** — takes an event, looks up per-category / per-jurisdiction routing rule, emits notification to the right team.
2. **Pattern detector** — server-side, not on-device. Detects `bullying_persistent` from events over time.
3. **Category-specific classifiers** — retrain the RF on labelled workplace data. Add caste-slur list (Indian corpora), disability-slur list, LGBTQ-slur list.
4. **PoSH IC console** — dedicated view for the statutory PoSH IC members. Statutory-timeline countdown, evidence chain (using SendWiseForensic audit pattern), digital case management.
5. **HR grievance console** — separate from PoSH.
6. **EAP handoff** — self-harm and persistent bullying escalations, with employee-consent flow.

## MVP scope

1. Browser extension (Manifest V3) with the taxonomy above, covering Slack web + Teams web + Gmail + Outlook + Google Chat.
2. Server-side aggregate dashboard + category-routing engine.
3. PoSH IC console (India-only for MVP).
4. HR grievance console.
5. Corporate MDM deployment guide (Intune, Jamf, Kandji, Google Admin, Android Enterprise, Chrome Enterprise).
6. Governance + terms of use + Code of Conduct integration guide.

## Deferred

- Slack / Teams native desktop app coverage (needs Slack DLP APIs or OS hooks).
- Zoom chat coverage.
- Voice / video call coverage (very hard, ethically fraught).
- iOS full coverage (Safari Web Extension limitations).
- Cross-jurisdiction full support (start India-only; US + UK adapters after PoC).

## Anti-goals

- No productivity monitoring.
- No screen recording.
- No keystroke logging in raw form.
- No manager-level visibility.
- No performance-review integration.
- No detection of "unprofessional tone," criticism of management, or protected concerted activity (labour-law risk).
- No permanent retention. Statutory-timeline-aligned purge.

## Timeline (indicative, one developer, 3-month MVP)

| Month | Deliverable |
|---|---|
| 1 | Extension skeleton + classifier port to JS + retrain on corporate corpus |
| 2 | Server + category-routing engine + PoSH IC console + HR console |
| 3 | MDM deployment guide + governance docs + pilot with one company |

## Success metrics

- % of nudged messages that were edited before send.
- Time from detected incident to PoSH IC / HR / EAP contact.
- Employee-trust survey — does the tool feel supportive or surveillant?
- PoSH IC time-to-first-hearing improvement (baseline vs. platform-assisted cases).
- Rate of false-positive routing to PoSH IC (must be near zero — false PoSH complaints are damaging).
