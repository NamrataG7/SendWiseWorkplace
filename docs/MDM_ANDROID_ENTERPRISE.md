# MDM — Android Enterprise (Managed Google Play)

Deploy the SendWiseWorkplace mobile stack on company-issued Android phones
via Android Enterprise + Managed Google Play. Two components are pushed:

1. The SendWiseWorkplace **Keyboard** IME (Phase 5 deliverable — deferred in
   the MVP; guide included here for completeness).
2. Managed Chrome + the browser extension for in-Chrome coverage of Gmail,
   Outlook web, Slack web, Teams web, and Google Chat.

## Prerequisites

- Android Enterprise enrolment (fully managed device — device owner mode).
- Managed Google Play iframe integrated with your EMM (Intune, Workspace ONE,
  Google Endpoint Management, Jamf, Kandji, etc.).
- Extension ID: `<REPLACE_WITH_EXTENSION_ID_AFTER_PUBLISH>`.

## Push managed Chrome with a force-installed extension

1. Add **Managed Chrome** (`com.android.chrome`) to Managed Google Play with
   the **Approved** flag for the pilot users.
2. In the app config for Chrome, set the following managed configuration keys:

   ```json
   {
     "ExtensionInstallForcelist": [
       "<EXTENSION_ID>;https://clients2.google.com/service/update2/crx"
     ],
     "ExtensionSettings": {
       "<EXTENSION_ID>": {
         "installation_mode": "force_installed",
         "update_url": "https://clients2.google.com/service/update2/crx"
       }
     }
   }
   ```

3. Assign to the pilot user / device group.
4. On next Play sync (~15 min) devices pull Chrome and the extension.

## Push the SendWiseWorkplace keyboard (deferred, Phase 5)

1. Approve the private app `com.sendwise.workplace.keyboard` in Managed
   Google Play (private app upload).
2. Assign to the pilot group with **Install type = Force installed**.
3. Provide the ingest URL via managed configuration
   (`sendwise_ingest_url = https://console.example.com/api/violations`).
4. Set the app as the default IME using the `SetDefaultInputMethod` policy
   (device-owner devices only).

## Verification

On device: `Settings → Apps → Chrome → Extensions` shows the extension with
"Installed by your administrator." The IME appears at
`Settings → System → Languages & input → On-screen keyboard` and cannot be
disabled by the user.
