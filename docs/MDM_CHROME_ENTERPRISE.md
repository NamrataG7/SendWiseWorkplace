# MDM — Chrome Enterprise / Google Admin

Force-install the SendWiseWorkplace browser extension on Chromebooks and
managed Chrome browser installs via the Google Admin console (Chrome Enterprise).

## Prerequisites

- Chrome Enterprise Upgrade licences for the pilot Chromebook fleet, or
  Chrome Browser Cloud Management enrollment for Windows / macOS / Linux Chrome.
- Extension ID: `<REPLACE_WITH_EXTENSION_ID_AFTER_PUBLISH>`.

## Force-install policy

1. Google Admin console → **Devices → Chrome → Apps & extensions**.
2. Choose scope: **Users & browsers** (managed browser installs) or
   **Managed guest sessions** / **Kiosks** as appropriate.
3. Select the pilot organizational unit (OU).
4. Click **+ → Add from Chrome Web Store**, paste the extension ID
   `<EXTENSION_ID>`, click **Select**.
5. In the right pane set:
   - **Installation policy**: `Force install`
   - **Update URL**: (leave default — Chrome Web Store)
   - **Runtime hosts** (allowed): the messaging surfaces —
     ```
     https://mail.google.com/*
     https://outlook.office.com/*
     https://outlook.office365.com/*
     https://outlook.live.com/*
     https://app.slack.com/*
     https://*.slack.com/*
     https://teams.microsoft.com/*
     https://teams.live.com/*
     https://chat.google.com/*
     ```
   - **Runtime hosts blocked**: any internal-only intranets that must never
     see extension activity.
6. Save. Devices in the OU pick up the policy on next sync (~90s on
   Chromebooks; ~1 h on managed Chrome browser).

## Verification

On a Chromebook: `chrome://policy` shows `ExtensionInstallForcelist` including
the ID. `chrome://extensions` shows the extension with "Installed by your administrator."

## Rollback

Set **Installation policy** back to `Allow install` or `Block`. Force-installed
extensions are removed on next policy sync.
