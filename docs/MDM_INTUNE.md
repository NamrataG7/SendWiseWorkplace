# MDM — Microsoft Intune

Force-install the SendWiseWorkplace browser extension on Windows / macOS
company laptops via Microsoft Intune.

## Prerequisites

- Microsoft Intune tenant with a Windows or macOS device-configuration profile
  targeted at the pilot user group.
- The extension is published either to the Chrome Web Store (private / unlisted)
  or hosted on a self-signed CRX URL.
- Extension ID (published):
  `<REPLACE_WITH_EXTENSION_ID_AFTER_PUBLISH>`
- Chrome ADMX / ADML templates imported into Intune (Windows only) — see
  <https://support.google.com/chrome/a/answer/9037717>.

## Windows — Chrome

1. Intune admin center → **Devices → Configuration profiles → Create**.
2. Platform: **Windows 10 and later**. Profile type: **Templates → Administrative Templates**.
3. Search: `Extensions`. Locate **Configure the list of force-installed apps and extensions**.
4. Enable and add:
   `<EXTENSION_ID>;https://clients2.google.com/service/update2/crx`
5. (Recommended) Enable **Runtime hosts blocked** and add any sensitive internal
   URLs on which the extension should be blocked.
6. Assign to the pilot group. Devices pick up the policy on next sync (~1 h).

## macOS — Chrome

1. Intune admin center → **Devices → Configuration profiles → Create**.
2. Platform: **macOS**. Profile type: **Templates → Preference file**.
3. Preference domain: `com.google.Chrome`.
4. Upload a `.plist` containing:

   ```xml
   <key>ExtensionInstallForcelist</key>
   <array>
     <string><EXTENSION_ID>;https://clients2.google.com/service/update2/crx</string>
   </array>
   ```
5. Assign to the pilot device group.

## Microsoft Edge

Same procedure using the **Microsoft Edge — Administrative Templates**
category, setting **Control which extensions are installed silently**.

## Verification

On a target device: open `chrome://policy`, refresh, confirm
`ExtensionInstallForcelist` shows the extension ID. Open
`chrome://extensions` — the extension appears with "Installed by enterprise policy."
