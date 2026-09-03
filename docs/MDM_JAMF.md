# MDM — Jamf Pro (macOS)

Force-install the SendWiseWorkplace browser extension on managed macOS
devices using Jamf Pro.

## Prerequisites

- Jamf Pro tenant with device enrollment for the pilot fleet.
- Extension ID: `<REPLACE_WITH_EXTENSION_ID_AFTER_PUBLISH>`.
- Google Chrome (or Edge) installed on target devices.

## Configuration Profile — Chrome

1. Jamf Pro → **Computers → Configuration Profiles → New**.
2. General: name `SendWiseWorkplace — Chrome extension`, level **Computer**.
3. Add payload **Application & Custom Settings → External Applications**.
4. Preference domain: `com.google.Chrome`.
5. Upload the following `.plist`:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <plist version="1.0">
   <dict>
     <key>ExtensionInstallForcelist</key>
     <array>
       <string><EXTENSION_ID>;https://clients2.google.com/service/update2/crx</string>
     </array>
     <key>ExtensionSettings</key>
     <dict>
       <key><EXTENSION_ID></key>
       <dict>
         <key>installation_mode</key>
         <string>force_installed</string>
         <key>update_url</key>
         <string>https://clients2.google.com/service/update2/crx</string>
         <key>runtime_allowed_hosts</key>
         <array>
           <string>https://mail.google.com/*</string>
           <string>https://outlook.office.com/*</string>
           <string>https://app.slack.com/*</string>
           <string>https://teams.microsoft.com/*</string>
           <string>https://chat.google.com/*</string>
         </array>
       </dict>
     </dict>
   </dict>
   </plist>
   ```

6. Scope to the pilot smart group.

## Verification

`sudo profiles list` on a client, then open Chrome → `chrome://policy` and
confirm the extension appears with "Installed by enterprise policy."
