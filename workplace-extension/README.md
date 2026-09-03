# workplace-extension

Manifest V3 browser extension for **SendWiseWorkplace** — a privacy-preserving
on-device nudge system for workplace messaging (Slack web, Teams web, Gmail,
Outlook web, Google Chat).

This directory is an **academic MVP**: plain JavaScript, no bundler, no build
step. Load unpacked into any Chromium-based browser (Chrome, Edge, Brave, ...).

See `../docs/EXTENSION_SPEC.md` for full architecture, and `../docs/PLAN.md`
for the 11-category detection taxonomy.

## What it does

1. Content script attaches `input` listeners to every `<textarea>` and
   `[contenteditable="true"]` element on supported hosts (including
   dynamically inserted ones — a `MutationObserver` handles SPA re-renders).
2. On input (300 ms debounce) the text is passed to a small keyword
   classifier (`classifier.js`).
3. If a category with severity **≥ medium** matches, a Shadow-DOM warning
   banner appears at the top of the viewport with three actions:
   - **Edit** — dismisses the banner and returns focus to the field.
   - **Send anyway** — dismisses the banner, message text is left intact.
   - **Cancel** — clears the field.
4. All three actions emit a metadata-only telemetry event to the background
   service worker, which hashes a random per-install `user_id` (SHA-256) and
   POSTs to the configured ingest URL. Message text never leaves the device.

## Load unpacked

1. Open `chrome://extensions` (or `edge://extensions`).
2. Toggle **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select this directory (`workplace-extension/`).
5. Pin the extension to the toolbar so you can open the options page.

## Configure ingest URL

Open the extension's **Options** page (right-click the extension icon → Options,
or `chrome://extensions` → Details → Extension options). Fields:

- **Enabled** — master on/off toggle.
- **Categories** — per-category enable checkboxes (all on by default).
- **Ingest URL** — where the background worker POSTs telemetry.
  Default: `http://localhost:3000/api/violations`.
- **Telemetry counters** — running totals of detected / edited / sent-anyway
  / cancelled events. **Reset counters** clears them.

If the ingest endpoint is unreachable, the worker silently drops the request
(offline mode); counters still update locally.

## Expected behaviour (smoke test)

1. Open Gmail / Outlook web / Slack / Teams / Google Chat.
2. In any compose field, type a phrase from `classifier.js` — e.g. `you are a moron`.
3. A dark banner appears at the top of the viewport with the category label
   ("harassment general", amber for medium / red for high) and three buttons.
4. Click **Cancel** — the field is cleared. Click **Send anyway** or **Edit** —
   the banner dismisses without touching the text.
5. Open the Options page — the corresponding counter has incremented.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest (permissions, host matches, entry points) |
| `content.js` | Input hook, debounce, Shadow-DOM overlay |
| `classifier.js` | Keyword classifier (`window.SWClassifier.classify`) |
| `background.js` | Service worker: hashing, telemetry POST, counters |
| `options.html` / `options.js` | Options page |
| `overlay.css` | Reference copy of Shadow-DOM overlay styles (runtime source is inlined in `content.js`) |
| `icon16.png` / `icon48.png` / `icon128.png` | Placeholder icons |

## Not in scope for this MVP

- The real Random Forest classifier from `../model_training/` — this MVP uses
  a short keyword list. Swap in the JSON export when the trained model is
  available.
- Slack / Teams **desktop** app coverage (needs OS hooks or vendor DLP APIs).
- MDM force-install policy templates — see `../docs/EXTENSION_SPEC.md`.
- Server-side category-routing engine, PoSH IC console, HR console.
