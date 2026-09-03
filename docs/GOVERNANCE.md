# Governance — SendWiseWorkplace

## Design principle

Employee-monitoring drift is worse in corporates than colleges — the incentives are stronger (productivity, IP, appraisals). These guardrails are load-bearing, not optional.

## Role separation — the four teams that see data

| Team | Sees | Role |
|---|---|---|
| **PoSH Internal Committee** | Only `sexual_harassment` category events routed to them | Statutory body under PoSH Act; confidentiality-bound under §16 |
| **HR grievance** | `hate_speech_*`, `bullying_persistent`, `harassment_general`, `discrimination` categories | Handles Code of Conduct violations |
| **EAP (Employee Assistance Programme)** | `self_harm` category only; other categories only when employee explicitly opts to route to EAP | Wellbeing support, not disciplinary |
| **Legal / Compliance** | `threats_intimidation`, `hate_speech_race`, `hate_speech_caste_religion` (when severity=high) | Criminal-adjacent handling |

Explicit non-viewers:
- Direct manager of the flagged employee — NEVER sees data.
- Skip-level manager — NEVER sees data.
- Head of business unit — NEVER sees data.
- IT / Security team — sees only technical health metrics, never incident content or per-employee data.
- Performance-management systems — NEVER receive data from this platform.

## Anti-appraisal firewall (critical)

- Written into employment contract addendum: "Data from SendWiseWorkplace is inadmissible in performance appraisal, promotion decisions, PIP (Performance Improvement Plan), or termination-for-cause proceedings unless there is a separately-substantiated PoSH IC finding or HR grievance finding using independent evidence."
- Enforced technically: no API endpoint exposes per-employee data to HRIS / performance systems.
- Audited: quarterly by the platform's Data Protection Officer.

## Confidentiality (PoSH §16 compliance)

PoSH Act §16 mandates strict confidentiality of complainant identity, respondent identity, witnesses, and inquiry proceedings.

Platform implementation:
- Sexual harassment events are stored with pseudonymous IDs even to PoSH IC members initially.
- De-pseudonymisation requires **two-person authorisation** (PoSH IC Presiding Officer + external member) — same dual-control pattern from SendWiseForensic PR #32.
- Every access is audit-logged (hash-chained, reuse SendWiseForensic audit chain).
- Penalty for breach of confidentiality (§17): ₹5,000 as per statute — the platform makes breach detectable, evidence-clean, and reportable.

## Retention (per-category, statutory-aligned)

| Category | Retention | Basis |
|---|---|---|
| `sexual_harassment` — aggregate metadata | 3 years from event | PoSH IC annual report obligation (§21) + limitation period for appeal |
| `sexual_harassment` — incident evidence (once complaint filed) | 7 years from IC final report | Tribunal appeal period + Labour Court limits |
| `threats_intimidation` — aggregate | 3 years | Criminal limitation |
| `hate_speech_*` | 3 years | Code of Conduct + statutory limitation |
| `harassment_general`, `bullying_persistent` | 1 year post-resolution | Code of Conduct grievance policy |
| `self_harm` | Employee-controlled — auto-purged after 30 days unless employee consents to retention | Duty of care + employee autonomy |
| Non-actioned events (nudged, edited before send, no complaint) | 90 days | Minimal necessary |

Cron enforces the purges; not policy-based. Reuse SendWiseForensic auto-expiry pattern.

## Consent and terms of use

For managed devices:
- Login banner at OS boot: "This device is company-provided. SendWiseWorkplace runs to help identify workplace-harassment risk. Content stays on this device unless you send anyway. See <link to policy>."
- Employment contract addendum during onboarding, signed.
- Annual re-consent (not legally required in India but strong governance).

For BYOD:
- Extension install page describes exactly what is monitored (nothing leaves the device by default), what leaves the device (opt-in category metadata), and how to uninstall.
- No employment-conditional consent for personal-device install. Ever.

## Data Protection Officer

- Independent role (not reporting to HR head or business unit head — reports to CEO or board).
- Reads the platform's audit log.
- Reviews every de-pseudonymisation.
- Files annual report to the DPB of India under DPDPA and to any equivalent regulators (ICO, EDPB).
- Publishes anonymised platform-use metrics for internal transparency.

## Data Protection Impact Assessment (DPIA)

Mandatory before rollout:
- DPDPA §17 rules (once notified) will make this explicit; even without, best-practice.
- GDPR Art. 35 for EU-employee coverage — LEGALLY MANDATORY.
- ICO Employment Practices Code for UK — MANDATORY.

Template DPIA in `docs/DPIA_TEMPLATE.md` (to be authored).

## Union / whistleblower exemptions

The platform must exclude these channels by policy:
- Any communication on channels designated as union-organising channels.
- Any communication designated as whistleblower disclosure (protected under PIDA UK, Whistleblowers Act 2014 India, SOX / Dodd-Frank US).
- Any communication with Legal on legal-privilege matters (§126 Bhartiya Sakshya Adhiniyam / attorney-client privilege).

Technical enforcement:
- Configurable Slack channel allowlist (channels with `#union`, `#whistleblower`, or company-designated names are excluded).
- Configurable email-domain allowlist (external counsel email domains excluded).
- On-device classifier defers to these exclusions before firing overlay.

## What we will NOT build

- Productivity metrics (keystrokes/hour, mouse activity, idle time, "focus time").
- Screen recording.
- Ambient audio capture.
- Voice-call transcription or classification.
- Video-call classification.
- Location tracking beyond what MDM already does for device security.
- Detection of criticism of management, complaints about pay, complaints about working conditions.
- Personality profiling, sentiment tracking over time, or "flight risk" scoring.
- Integration with promotion / appraisal / PIP systems.
- Sale of data (aggregate or otherwise) to any third party.
- Research use of employee data without ethics board approval and employee opt-in.

## Escalation path

1. Extension warning overlay in-browser (95% of cases stop here — employee edits and moves on).
2. Repeated same-category events → extension nudges employee toward EAP self-referral link.
3. Positive classification of `sexual_harassment` with confidence ≥ 0.75 → aggregate log entry only, no per-employee alert yet.
4. If a formal complaint is filed with PoSH IC or HR by any channel → the IC/HR can request de-pseudonymisation of related events, subject to dual-control authorisation.
5. Repeated `bullying_persistent` pattern (5+ events same source→same target / week) → HR notified in aggregate; per-employee only on complaint filing.
6. `self_harm` positive classification → in-extension resource card shown; employee can self-initiate EAP contact; NEVER auto-escalated to HR without consent.

## Ethics review

- Before pilot: independent ethics board approval + employee-representative consultation.
- Every 6 months: platform-use audit published to all employees.

## Sunset

- Every 2 years: platform use is re-authorised by the DPO, employee representative body (if any), and board of directors. If not re-authorised, platform goes offline.
- End-of-contract: departing employee's data is purged within 30 days unless a pending PoSH / HR case requires retention.
