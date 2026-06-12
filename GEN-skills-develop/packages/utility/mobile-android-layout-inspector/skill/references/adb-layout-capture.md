# ADB Layout Capture Reference

Use this reference when the task needs concrete ADB commands, troubleshooting, or a quick reminder of the tradeoffs between Android Studio Layout Inspector and the ADB fallback.

## Quick Start

1. Capture a standard bundle:

```bash
../scripts/capture_bundle.sh \
  --screen home \
  --package com.example.app \
  --activity .MainActivity
```

This creates:

- `screenshot.png`
- `fresh-screenshot.png`
- `ui-dump.xml`
- `metadata.json`

under `artifacts/layout-inspector/<timestamp>/home/`.

2. Check connected devices:

```bash
adb devices
```

3. Capture only a screenshot:

```bash
../scripts/capture_screenshot.sh artifacts/layout-inspector/home.png
```

The helper waits 2 seconds before capture by default so the app has time to render. Override it when needed:

```bash
../scripts/capture_screenshot.sh artifacts/layout-inspector/home.png --delay 4
```

4. Capture the current UI hierarchy:

```bash
../scripts/capture_ui_dump.sh artifacts/layout-inspector/home.xml
```

## When To Prefer Which Path

- Prefer Android Studio Layout Inspector when the task needs live hierarchy, attributes, Compose inspection, or exported inspector snapshots.
- Prefer `capture_bundle.sh` when another skill needs a stable, machine-readable capture contract.
- Prefer `capture_screenshot.sh` for deterministic screenshot capture from automation.
- Add `capture_ui_dump.sh` when a screenshot alone is not enough to identify visible elements or confirm state.
- When repository tests already capture each workflow step, pass those artifacts into `capture_bundle.sh` and let the bundle wait for them before attempting any supplemental fresh screenshot.
- On emulators, do not rerun `./gradlew connected...` for every capture step once the APKs already exist. Install once, then rerun the instrumentation class directly with `../scripts/run_instrumentation_test.sh` or `adb shell am instrument ...`.

## Common Commands

Wake and unlock the device if needed:

```bash
adb shell input keyevent KEYCODE_WAKEUP
adb shell wm dismiss-keyguard
```

Launch an activity:

```bash
adb shell am start -n com.example.app/.MainActivity
```

Run an instrumentation test directly on an emulator after the APKs are already built:

```bash
../scripts/run_instrumentation_test.sh \
  --serial emulator-5554 \
  --app-apk /path/to/app-debug.apk \
  --test-apk /path/to/app-debug-androidTest.apk \
  --app-package it.icbpi.mobile \
  --test-package it.icbpi.mobile.test \
  --runner androidx.test.runner.AndroidJUnitRunner \
  --class it.icbpi.mobile.feature.carbon_service.PlanetCareFlowsTest#planetCareWrongCvvShowsSnackbar
```

Record the top activity:

```bash
adb shell dumpsys activity top | sed -n '1,80p'
```

Launch a specific activity before capture:

```bash
../scripts/capture_bundle.sh \
  --screen dashboard \
  --package com.example.app \
  --activity .DashboardActivity \
  --wait-activity DashboardActivity
```

Prefer a test-produced screenshot for a fast workflow step and keep a fresh capture as supplemental evidence:

```bash
../scripts/capture_bundle.sh \
  --screen consent \
  --package com.example.app \
  --wait-activity ConsentActivity \
  --expected-top-activity ConsentActivity \
  --test-screenshot-local-path /tmp/consent_step.png \
  --prefer-test-screenshot

When `--expected-top-activity` is set, the bundle only accepts that test screenshot if the fresh validation capture still confirms the same activity. If fresh validation reports that the app already moved on, treat the step as uncaptured and re-drive it.
```

Let the bundle auto-detect scrollable content from the initial `ui-dump.xml` and capture extra viewports:

```bash
../scripts/capture_bundle.sh \
  --screen feed \
  --package com.example.app \
  --wait-activity FeedActivity
```

The bundle now inspects the first UI dump for a primary scrollable container and, when found, captures up to three additional bounded-swipe screenshots automatically. Use `--max-scrolls <count>` when you need an explicit override for that budget.

## Limitations

- `FLAG_SECURE` screens usually cannot be captured.
- `uiautomator dump` does not expose the same detail as Android Studio's Layout Inspector.
- Compose-heavy screens may expose less useful structure than classic view hierarchies.
- A screenshot can be stale if the app is still animating or loading when it is taken.
- The bundle now samples more than one fresh screenshot by default. Keep that behavior for fast transitions instead of dropping back to a single immediate screencap.
- Automatic scroll capture depends on the first `ui-dump.xml`. If UI-dump capture is disabled or unavailable, the bundle records that limitation and cannot safely inspect below-the-fold content.
- `--prefer-test-screenshot` is not a bypass for failed fresh validation when the expected activity is known.
- If a live instrumentation test already uses `UiAutomation` screenshots, do not run `uiautomator dump` in parallel unless you intentionally override the bundle safeguard.
- Device-side screenshots under `/sdcard/Android/data/<package>/files/...` are not durable by default when the test runner uninstalls the app after completion. Prefer a host artifact, `additionalTestOutputDir`, or a live copy during the test window.

## Troubleshooting

If `adb devices` shows `unauthorized`:
- unlock the device
- accept the RSA dialog
- rerun the command

If more than one device is connected:
- pass `--serial <serial>`
- or export `ANDROID_SERIAL=<serial>`

If the screenshot is black or blank:
- check for `FLAG_SECURE`
- retry after the screen is fully visible
- confirm the device is awake and on the expected app screen

If another skill needs a stable handoff:
- call `capture_bundle.sh`
- read `metadata.json`
- use `capture_status` and `failure_reason` instead of inferring success from shell output

If test screenshot sync keeps timing out on an emulator:
- check whether the path lives under app external storage and the test runner uninstalls after test
- prefer `run_instrumentation_test.sh` over repeated UTP runs so the packages stay installed between captures
- if the test emits artifacts through `additionalTestOutputDir`, sync that path instead of `externalFilesDir(...)`
