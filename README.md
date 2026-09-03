# SendWiseWorkplace

**Corporate workplace cyberbullying + harassment prevention — on managed devices, privacy-preserving, category-routed.**

> **Status: planning repo.** No code yet. This repo captures the design so implementation can resume later without context loss. See `docs/PLAN.md` for the full plan and `docs/RESUME_HERE.md` for the pickup checklist.

## Concept in one line

Reuse the [SendWise](https://github.com/NamrataG7/SendWise) privacy-preserving on-device supervision model on **company-owned devices and networks**, detect Code-of-Conduct-violating behaviour, and route each detected incident to the **legally correct** authority (PoSH IC, HR grievance, EAP, or Legal) instead of blending everything into "harassment."

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

PoSH Act 2013 covers only **sexual harassment**. Real workplace cyberbullying is broader:

| Behaviour category | Legal / policy anchor | Routes to |
|---|---|---|
| Sexual harassment (sexually coloured remarks, advances) | PoSH Act 2013 | **PoSH Internal Committee** (statutory, 90-day timeline) |
| Casteist / religious slurs | SC/ST Act, BNS §299 | HR + Legal |
| Threats, intimidation | BNS §351 | HR + Security + Legal |
| Homophobic / transphobic language | NALSA judgement, company D&I policy | HR grievance |
| Ableist language / disability harassment | RPWD Act 2016 | HR + Compliance |
| Racist language | Constitution Art. 15, company D&I | HR + Legal (if extreme) |
| General bullying (insults, aggression, mockery) | **Code of Conduct** | HR grievance / EAP |
| Persistent exclusion / power abuse | Code of Conduct + Industrial Disputes Act | HR + Skip-level |
| Self-harm ideation | Duty of care | EAP + counselling (with consent) |

The classifier tags each detected event with `category + severity + confidence`. Routing is deterministic per category. Detection ≠ blame — the tool is a nudge, and the routed team decides what to do.

## Scope — what devices / networks are covered

| Layer | Tool |
|---|---|
| Company laptop / desktop (Windows / macOS / Linux) | Browser extension force-installed via corporate MDM (Intune, Jamf, Kandji, Google Admin) |
| Company Chromebook | Browser extension force-installed via Chrome Enterprise |
| Company-issued Android phone (banking, consulting, execs) | SendWise IME force-installed as system keyboard via Android Enterprise + browser extension inside Chrome |
| Company-issued iPhone | Safari Web Extension (limited); rely on MDM policy + browser extension in mobile Chrome where possible |
| Corporate WiFi / VPN | DNS + category filter at gateway (already exists at most enterprises) |
| Employee-owned device (BYOD) | Voluntary install only. No mandate. |

## What this is NOT

- **Not productivity surveillance.** No keystrokes-per-hour. No idle-time tracking. No screen recording. Refused by design.
- **Not performance-review input.** Data never flows to appraisals. Written into policy, enforced by role separation.
- **Not manager-visible.** Direct managers do not see their reports' data. Only HR / PoSH IC / EAP see incident-level data, and only per the routing table.
- **Not [SendWiseForensic](https://github.com/NamrataG7/SendWiseForensic).** That is a law-enforcement fork that inverts SendWise's privacy model under judicial warrant. SendWiseWorkplace preserves the privacy model — content stays on device.
- **Not for enforcing "tone" or dissent.** Detects harassment / hate / threats / bullying. Does not flag criticism of management, informal language, or protected concerted activity.

## Reuse map — what we already have vs. what is new

| Component | Source | Modification |
|---|---|---|
| Android IME + on-device Random Forest classifier | [SendWise](https://github.com/NamrataG7/SendWise) `SafeKeyboardApp/` | Fork, rename to `SendWiseWorkplace-Keyboard`; MDM-based enrollment; add corporate categories |
| Parental dashboard (Next.js + Supabase) | [SendWise](https://github.com/NamrataG7/SendWise) `parental-dashboard/` | Fork, rename to `SendWiseWorkplace-Console`; parent→HR partner; child→employee; add category-routing UI |
| Anonymised metadata schema | SendWise | Extend with `category` covering the broader taxonomy above |
| Browser extension (Manifest V3) | [SendWiseCampus](https://github.com/NamrataG7/SendWiseCampus) `docs/EXTENSION_SPEC.md` | Reuse spec; retrain classifier on workplace corpus; add Slack / Teams / Outlook host list |
| RLS + hash-chained audit log | [SendWiseForensic](https://github.com/NamrataG7/SendWiseForensic) migrations 05 + 06 | Reuse verbatim — the audit chain is **more useful** here for PoSH tribunal defensibility |
| Dual-control admin flow (two-person approval) | [SendWiseForensic](https://github.com/NamrataG7/SendWiseForensic) PR #32 | HR head + PoSH IC chair must both approve any de-anonymisation |
| Jurisdiction adapter pattern (IN / US / UK) | [SendWiseForensic](https://github.com/NamrataG7/SendWiseForensic) `packages/legal-framework/` | Directly useful for multinational rollouts |

## Docs

- `docs/PLAN.md` — full plan, device matrix, MVP scope, timeline.
- `docs/EXTENSION_SPEC.md` — Manifest V3 architecture, host list (Slack / Teams / Gmail / Outlook / etc.), category-routing.
- `docs/LEGAL_FRAMEWORK.md` — PoSH Act, DPDPA, IT Act, BNS, cross-jurisdiction (US Title VII, UK Equality Act, GDPR) mapping.
- `docs/GOVERNANCE.md` — HR vs. PoSH IC vs. EAP separation, no productivity monitoring, retention aligned to statutory timelines.
- `docs/RESUME_HERE.md` — one-page cold-pickup checklist.

## Related repos

- Upstream: https://github.com/NamrataG7/SendWise
- Law-enforcement fork: https://github.com/NamrataG7/SendWiseForensic
- College adaptation: https://github.com/NamrataG7/SendWiseCampus

## Contact

Namrata Gaikwad — namratamgaikwad@gmail.com

## Licence

TBD — will inherit MIT from SendWise on first code commit.
