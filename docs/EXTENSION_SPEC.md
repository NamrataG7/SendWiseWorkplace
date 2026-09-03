# Extension Spec — SendWiseWorkplace browser extension

## Target

Chrome + Edge + all Chromium-based browsers. Manifest V3.

Firefox second-tier. Safari deferred (limited Web Extension capability + Apple Store friction).

## Architecture (adapted from SendWiseCampus)

```
Workplace messaging surface (Slack web, Teams web, Gmail, Outlook, Google Chat, ...)
   ↓ content script hook (input events on <input>, <textarea>, contenteditable)
On-device classifier (TF.js or ONNX.js, model shipped with extension)
   ↓ if risk detected
Warning overlay (Shadow DOM injection, page CSS cannot break it)
   ↓ user action: Edit / Send anyway / Cancel
Background service worker
   ↓ metadata only (category, severity, action_taken, anonymous_user_hash, platform)
SendWiseWorkplace backend
   ↓ category-routing engine
Correct authority console (PoSH IC / HR / EAP / Legal)
```

## Key differences vs. SendWiseCampus extension

| Concern | SendWiseCampus | SendWiseWorkplace |
|---|---|---|
| Target audience | Students | Employees |
| Enforcement basis | Acceptable use policy + college terms | Employment contract + Code of Conduct + acceptable use policy |
| Legal statute triggers | None (Code of Conduct only) | PoSH (statutory) + BNS + IT Act + Code of Conduct |
| Routing complexity | One team (wellbeing) | 4 teams — PoSH IC, HR, EAP, Legal — category-routed |
| Retention | Semester | Statutory (PoSH = years); per-category retention |
| Cross-jurisdiction | Single-college | Multinational (IN / US / UK adapters) |
| Categories | Same as SendWise upstream | Expanded taxonomy — see `PLAN.md` |

## Host coverage (workplace messaging)

Priority tier 1 (must have for MVP):
- app.slack.com
- teams.microsoft.com
- outlook.office.com / outlook.office365.com
- mail.google.com (Google Workspace mail)
- chat.google.com
- Outlook on the web

Priority tier 2:
- workplace.com (Meta Workplace)
- workspace.com (Google Chat spaces)
- zoom.us (chat, not video)
- basecamp.com
- monday.com
- clickup.com
- notion.so (comments)
- github.com (PR comments — because harassment happens there)
- gitlab.com

Priority tier 3:
- discord.com (if used at work)
- reddit.com (internal subreddits)
- linkedin.com/messaging

Escape hatch: any host with `contenteditable` gets classified silently but no overlay unless matched.

## Manifest V3 details

Permissions:
- `activeTab`, `scripting`, `storage`
- Host permissions for the tier-1 hosts.
- `alarms` for background batch upload timer.

Chrome Enterprise policies for force-install:
- `ExtensionInstallForcelist`
- `ExtensionSettings.<id>.installation_mode = force_installed`
- `ExtensionSettings.<id>.runtime_allowed_hosts` = tier-1 + tier-2 hosts
- `runtime_blocked_hosts` = internal-only sensitive intranets (per company request)

## Privacy properties (must be maintained)

Same as SendWiseCampus, plus:

- **No content in telemetry** — enforced client + server. Defence in depth.
- **Category confidence must be ≥ threshold** (e.g., 0.75) before overlay fires — false-positive PoSH routing is damaging.
- **User can see every telemetry event** the extension has sent — options page shows a real-time counter and category breakdown.
- **User can dispute a classification** — options page has a "This wasn't harassment" button that logs a labelled example for classifier retraining without exposing content to humans (it's stored locally until user chooses to export).
- **No manager access, ever.** Enforced by role gating on the server.

## Classifier corpus notes

Retrain (do not reuse verbatim) on:
- Corporate email corpora with harassment labels — Enron corpus (public, labelled subsets exist for harassment research).
- Public Slack / Discord community moderation logs (where consented / public).
- Indian caste-slur lists (see BNS §299 + SC/ST Atrocities Act references).
- Ableist / disability-slur lists.
- LGBTQ-slur lists (context-sensitive — reclaimed vs. targeted).

Every classifier version ships with a `MODEL_CARD.md` documenting training data, bias evaluation, and known blind spots. This is a compliance requirement, not a nice-to-have — HR/Legal will ask.

## Testing

- Playwright / Puppeteer per host in tier 1.
- Golden tests per category — messages that MUST fire (positive) and messages that MUST NOT fire (negative — includes tricky cases like criticism of management, informal joking, sarcasm).
- Manual E2E on managed Windows / macOS / Chromebook.
- False-positive audit — target < 5% for `harassment_general`, < 1% for `sexual_harassment`, < 1% for `hate_speech_*`.

## Distribution

- Chrome Web Store — private / unlisted during pilot.
- Edge Add-ons — mirror.
- Enterprise CRX signing for direct MDM push (bypasses store install).
- Self-hosted enterprise store for airgapped clients.
