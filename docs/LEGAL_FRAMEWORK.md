# Legal Framework — SendWiseWorkplace

## Purpose

Every routing decision the platform makes must be traceable to a statute or policy. This document is the canonical mapping.

## India (primary)

### Statutory grounds for the platform itself

| Law | Section | What it allows |
|---|---|---|
| Digital Personal Data Protection Act 2023 | §7(b) — legitimate use for performance of contract | Monitoring on company-owned devices under employment contract |
| Information Technology Act 2000 | §43A — reasonable security practices | Company duty to protect employee data on its systems |
| Information Technology Act 2000 | §72 — breach of confidentiality by persons securing access | Cited in HR/PoSH member terms |
| Indian Contract Act 1872 | §10 (valid contract) | Employment contract + Code of Conduct binding |

### Behavioural / harassment law

| Behaviour | Statute | Committee / route |
|---|---|---|
| Sexual harassment at workplace | **PoSH Act 2013** — §2(n) definition, §3 prohibition, §4 Internal Committee | PoSH Internal Committee; 90-day statutory timeline (§13(4)); mandatory annual report (§21) |
| Casteist slurs | SC/ST (Prevention of Atrocities) Act 1989; BNS §299 (words uttered with deliberate intent to insult religion) | HR + Legal (criminal-adjacent) |
| Religious hate speech | BNS §299, §302 | HR + Legal |
| Threats, criminal intimidation | BNS §351 (was IPC §506) | HR + Security + Legal (potentially criminal referral) |
| Insulting a woman's modesty electronically | BNS §75 + IT Act §66E | PoSH IC OR HR + Legal depending on medium |
| Publishing obscene material electronically | IT Act §67 | Legal (criminal) |
| Cyberstalking, publishing private images | IT Act §67A | Legal (criminal) |
| Disability discrimination | Rights of Persons with Disabilities Act 2016, §3–§5 | HR + Compliance |
| Discrimination generally at workplace | Constitution Art. 14, 15, 16 (state actors); no dedicated private-sector statute — HR grievance policy applies | HR grievance |

### Notes on PoSH specifically

- **Only sexual harassment.** Not general bullying.
- **Only women complainants under the statute.** Many companies voluntarily extend the same procedure to men and non-binary employees under Code of Conduct — that is contractual, not statutory.
- **Internal Committee (IC) mandatory** for workplaces with 10+ employees.
- **IC composition (§4):** Presiding Officer (woman employee at senior level), 2+ employees committed to women's cause, one external member from NGO or legal background.
- **90-day timeline** from complaint to inquiry report (§13(4)).
- **Confidentiality mandatory** (§16) — this is why platform data must be strictly RBAC-scoped.

### General bullying — no dedicated statute

Indian law has no dedicated workplace-bullying statute. Coverage comes from:
- **Employment contract** — Code of Conduct violation is a contractual breach.
- **Industrial Disputes Act 1947** — for unionised employees, misconduct proceedings.
- **Tort law** — defamation, intentional infliction of emotional distress (limited traction in India).
- **Duty of care** — employer common-law obligation to provide safe workplace (physical + psychological).

Because there is no statute, general bullying goes to **HR grievance / EAP**, not to a statutory committee.

## United States (secondary, for multinational)

| Behaviour | Statute | Route |
|---|---|---|
| Sexual harassment | Title VII of Civil Rights Act 1964 (Meritor v. Vinson 1986; Faragher / Ellerth 1998) | EEO complaint; internal EEO office |
| Racial harassment | Title VII | EEO office |
| Age harassment | ADEA 1967 | EEO office |
| Disability harassment | ADA 1990 + ADAAA 2008 | HR + Compliance |
| Retaliation | Title VII §704(a) | EEO office |
| State-law wiretap (electronic monitoring of communications) | Varies — two-party consent in CA, FL, MA, WA and 8 more | Employee notice required |
| National Labor Relations Act §7 — protected concerted activity | 29 U.S.C. §157 | Platform must NOT surveil this — labour law risk |
| Employee monitoring generally | ECPA §2511(2)(d) business exception | Notice-based consent |

## United Kingdom (secondary, for multinational)

| Behaviour | Statute | Route |
|---|---|---|
| Harassment based on protected characteristics | Equality Act 2010 — §26 harassment; §40 third-party harassment | Employer duty |
| Racial / religious harassment | Equality Act 2010 §26 + Public Order Act 1986 (if extreme) | HR + Legal |
| Sexual harassment | Equality Act 2010 §26(2) | HR + Legal |
| Bullying (non-discriminatory) | No dedicated statute; Employment Rights Act 1996 §95 constructive dismissal; Protection from Harassment Act 1997 §1 (course of conduct) | HR grievance |
| Data protection on monitoring | UK GDPR + Data Protection Act 2018 Part 2; ICO Employment Practices Code | Data Protection Impact Assessment required |
| Whistleblower protection | Public Interest Disclosure Act 1998 | Whistleblower channel |

## European Union (for EU entities, informative)

| Concern | Instrument |
|---|---|
| Employee monitoring | GDPR Art. 6(1)(f) legitimate interest + Recital 155 + Art. 88 (Member State employment provisions) |
| Sexual harassment | EU Directive 2006/54/EC + Member State transpositions |
| DPIA | GDPR Art. 35 — MANDATORY for employee monitoring |

## Constitutional / rights foundation

- **India: Article 21** — right to life includes privacy (Puttaswamy 2017). Applies to state actors; private employers bound indirectly via DPDPA and constitutional rights transmission.
- **India: Article 15** — no discrimination on grounds of religion, race, caste, sex, place of birth (public actors).
- **India: Article 19(1)(a)** — free speech; the tool must not target protected political/religious expression or criticism of management.
- **US: First Amendment** — private employers not bound; but state law and NLRB rules apply.
- **UK / EU: Article 8 ECHR** — right to private life; applies indirectly to private employers via Human Rights Act 1998.

## What the platform deliberately does NOT do

- **Does not surveil protected concerted activity** (union organising, collective concerns) — NLRA §7 (US), Trade Union Act (India), various EU protections.
- **Does not flag criticism of management** — free speech (India Art. 19), NLRA §7 (US), whistleblower protection (UK PIDA).
- **Does not flag whistleblower disclosures** — protected under PIDA (UK), Whistleblowers Protection Act 2014 (India), Dodd-Frank / SOX (US).
- **Does not process special category data** (health, religion, sexual orientation) beyond what the classifier needs on-device — GDPR Art. 9, DPDPA §2(x).
- **Does not export data outside data-residency requirements** — India DPDPA restricted transfers.

## Data Protection Impact Assessment (DPIA)

Under GDPR Art. 35 and DPDPA §17, employee-monitoring platforms require a DPIA before deployment. Template DPIA should be part of the platform onboarding package.

## Open legal questions to resolve before pilot

1. Interaction between DPDPA §17 exemption for employers and the general legitimate-use provisions in §7 — pending MeitY clarifications.
2. Whether classification metadata (category, severity) constitutes "personal data" under DPDPA when linked to an anonymous_user_hash — likely yes.
3. Cross-border data transfer if the corporate deploys on non-Indian infrastructure — DPDPA has restrictions.
4. Whether a positive classification of "sexual_harassment" that turns out to be false constitutes defamation risk if surfaced to PoSH IC — hence the confidence threshold.
5. Trade-union monitoring exemption under Trade Union Act 1926 — the platform must exclude union-related channels by policy.
