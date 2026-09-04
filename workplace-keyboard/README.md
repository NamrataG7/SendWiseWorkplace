# SendWiseWorkplace Keyboard

SendWiseWorkplace Android IME (Input Method Editor) with on-device Random Forest content moderation, forked from SafeKeyboardApp for enterprise/workplace deployment.

## Build

```bash
./gradlew assembleDebug
```

Output APK: `app/build/outputs/apk/debug/app-debug.apk`

## Deployment

Force-installed via Android Enterprise / Managed Google Play. See `docs/MDM_ANDROID_ENTERPRISE.md` in the parent repo.

## Package

- `applicationId`: `com.sendwise.workplace.keyboard`
- Internal Kotlin package paths remain `com.safekeyboard.*` (academic MVP — not renamed to avoid churn).

## Assets

- `app/src/main/assets/workplace_slurs.json` — workplace-specific slur/harassment lexicon by category.
