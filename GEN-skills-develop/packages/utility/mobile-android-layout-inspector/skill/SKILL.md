---
name: mobile-android-layout-inspector
description: Inspect a running Android app with Android Studio Layout Inspector and ADB capture workflows.
---

# Android Layout Inspector

## Overview

Use this skill when the work depends on the current state of a running Android app rather than static code alone. Follow the official Android Studio Layout Inspector workflow for live inspection and exported hierarchy snapshots, and use the bundled ADB helpers when you also need plain PNG screenshots or a simple `uiautomator` dump. When repository tests already emit step screenshots, use those screenshots as the step-synchronization source and let this skill validate or supplement them instead of racing a blind single screencap against test teardown.

On emulators, do not pay a full Gradle or UTP install-uninstall cycle for every capture when the runtime driver is already an Android instrumentation test. Build the APKs once when needed, install them once, then reuse direct `am instrument` execution for repeated state-driving runs so the app stays available between captures and dexopt cost is paid only once.

## Modular Use

This skill is intended to be a reusable helper for other Android-oriented skills.

- Invoke it explicitly as `$mobile-android-layout-inspector` when another skill needs live UI evidence from a running app.
- Use it as the source of truth for screenshot capture, Layout Inspector snapshot registration, and lightweight hierarchy dumps.
- Use it to collect multi-shot evidence for scrollable screens by scrolling and capturing additional screenshots when content extends below the current viewport.
- Pass concrete capture intent when you call it: target screen, package/activity when known, optional device serial, any render delay requirement, and whether the caller already has a test-produced screenshot for the same step.
- Do not duplicate the ADB screenshot workflow in higher-level skills; delegate that work to this skill instead.

## Input Contract

Prefer this explicit contract when another skill calls `$mobile-android-layout-inspector`:

- `screen_name`: logical screen identifier used for artifact folder naming. Required.
- `artifacts_root`: optional base directory for captures. Defaults to `artifacts/layout-inspector`.
- `execution_state_path`: optional shared `execution_state.json` path from an orchestrator such as `android-spec-to-figma`.
- `queue_id`: optional stable runtime-capture queue item ID for the shared ledger.
- `workflow_step_id`: optional workflow step ID for the shared ledger item.
- `canonical_target_id`: optional canonical screen or state ID for the shared ledger item.
- `navigation_hint`: optional navigation hint recorded into the shared ledger item.
- `serial`: optional device serial. Required only when more than one authorized device is connected.
- `delay_seconds`: optional render delay before screenshot capture. Defaults to `2`.
- `max_scrolls`: optional explicit maximum number of additional downward scroll captures after a scrollable container is detected. Defaults to `0`. When omitted, the bundle still inspects the initial UI dump and auto-captures up to `3` extra viewports for scrollable content when possible.
- `scroll_delay_seconds`: optional settle delay after each scroll before capture. Defaults to `1`.
- `scroll_duration_ms`: optional swipe duration for each scroll gesture. Defaults to `300`.
- `post_trigger_delay_seconds`: optional extra settle delay after navigation or test-artifact sync. Defaults to `1`.
- `capture_count`: optional number of fresh screenshot samples to take before selecting the last one. Defaults to `2`.
- `capture_interval_seconds`: optional delay between fresh screenshot samples after the first one. Defaults to `1`.
- `package_name`: optional package to verify before capture.
- `activity_name`: optional activity to launch before capture. Requires `package_name`.
- `wait_activity`: optional foreground activity substring to poll for after launch.
- `expected_top_activity`: optional foreground activity substring that must still be visible when fresh capture starts and ends. Defaults to `wait_activity` when present, otherwise `activity_name` when present.
- `wait_timeout_seconds`: optional activity wait timeout. Defaults to `15`.
- `test_screenshot_local_path`: optional local screenshot path written by a repository test for the same workflow step.
- `test_screenshot_device_path`: optional device-side screenshot path written by a repository test for the same workflow step.
- `test_screenshot_timeout_seconds`: optional wait timeout for a test screenshot path. Defaults to `30`.
- `test_screenshot_stable_seconds`: optional stable-write window before a test screenshot is accepted. Defaults to `1`.
- `prefer_test_screenshot`: optional boolean. When `true`, the copied test screenshot becomes the canonical `screenshot.png`. If `expected_top_activity` is also set, the bundle only promotes the test screenshot after a successful fresh validation capture on that same activity.
- `capture_ui_dump`: optional boolean. Defaults to `true`.
- `allow_ui_dump_during_test_sync`: optional boolean. Defaults to `false`. When omitted and test-screenshot sync is active, the bundle disables `uiautomator dump` automatically to avoid `UiAutomation` collisions with live instrumentation tests.
- `layout_snapshot_path`: optional path to a snapshot exported manually from Android Studio Layout Inspector.

When the test driver is an Android instrumentation test on an emulator, prefer `scripts/run_instrumentation_test.sh` or a direct `adb shell am instrument ...` invocation over repeatedly calling `./gradlew connected...` for each capture step. Use Gradle to build the APKs when needed, not as the default per-step runtime launcher.

Treat `test_screenshot_device_path` as durable only when the test writes to a path that survives teardown, such as a host-copied artifact or an instrumentation `additionalTestOutputDir` that you can pull before uninstall. Do not assume screenshots under `/sdcard/Android/data/<package>/files/...` remain available after a UTP-backed run with `uninstall_after_test`.

Canonical CLI entrypoint:

`scripts/capture_bundle.sh --screen <screen-name> [options]`

When `execution_state_path` is provided, `capture_bundle.sh` must update the shared ledger before capture starts and after the result is known.

## Output Contract

`capture_bundle.sh` writes artifacts to:

- `artifacts/layout-inspector/<timestamp>/<screen-slug>/` by default

It always writes `metadata.json` and prints that JSON payload to stdout. The payload contains:

- `capture_status`: `success`, `partial`, or `failed`
- `failure_reason`: empty on success, otherwise a machine-readable reason
- `artifact_dir`
- `screenshot_path`
- `screenshot_paths`
- `screenshot_source`
- `fresh_screenshot_path`
- `fresh_screenshot_sequence_paths`
- `fresh_capture_status`
- `fresh_capture_failure_reason`
- `test_screenshot_path`
- `test_screenshot_source`
- `ui_dump_captured`
- `ui_dump_path`
- `ui_dump_paths`
- `ui_dump_skip_reason`
- `layout_snapshot_path`
- `device_serial`
- `display_size`
- `display_density`
- `font_scale`
- `device_locale`
- `night_mode`
- `device_model`
- `max_scrolls`
- `scroll_capture_budget`
- `scroll_capture_mode`
- `scroll_capture_skipped_reason`
- `scrolls_performed`
- `scroll_boundary_reached`
- `scroll_detection_status`
- `scrollable_detected`
- `scrollable_bounds`
- `scrollable_class`
- `scrollable_resource_id`
- `top_activity`
- `top_activity_before_capture`
- `top_activity_after_capture`
- `launched_component`
- `captured_at_utc`

When `--execution-state` is provided, it also updates the matching queue item in `execution_state.json` with:

- queue-item status
- attempt count
- artifact directory
- screenshot paths
- UI dump paths
- failure reason when present

## When To Use

- Capture a screenshot from a connected emulator or device.
- Capture a long or scrollable screen by taking a sequence of screenshots while scrolling through the content.
- Open Android Studio Layout Inspector against a running debuggable process.
- Confirm what screen is actually visible during a bug reproduction.
- Collect a UI hierarchy dump alongside a screenshot for inspection.
- Export a shareable Layout Inspector snapshot for later review.
- Inspect Compose or hybrid View/Compose screens.
- Compare a live Android screen with a Figma mockup, QA report, or Jira ticket.
- Document before-and-after UI states while verifying a flow.

## Preconditions

- `adb` must be installed and reachable in `PATH`.
- At least one emulator or device must be connected and authorized.
- The target app should be running as a debuggable process when using Android Studio Layout Inspector.
- If more than one device is connected, set `ANDROID_SERIAL` or pass `--serial` to the helper scripts.
- The app should already be installed and, when possible, navigated to the target screen before capture.

## Workflow

1. Use `scripts/capture_bundle.sh` as the default entrypoint for automated capture.
2. When a shared `execution_state.json` is provided, pass it through `--execution-state` together with the queue identifiers so capture progress is persisted by the script itself.
3. Verify or resolve the device target with `adb devices`. If more than one authorized device is connected, pass `--serial`.
4. If the caller provides `--package` and `--activity`, the bundle script verifies the package is installed and launches the target activity before capture.
5. If the caller provides `--wait-activity`, the bundle script polls foreground activity until the expected screen is active or the timeout is reached.
6. If the runtime driver is an Android instrumentation test on an emulator, prefer building once and then rerunning the test via `scripts/run_instrumentation_test.sh` or `adb shell am instrument ...` instead of rerunning Gradle or UTP for each capture step.
7. If a repository test already writes per-step screenshots to a durable location, pass that path through `--test-screenshot-local-path` or `--test-screenshot-device-path` so the bundle waits for the file, confirms the write has stabilized, and registers it in the artifact bundle. Avoid app-external storage paths that are deleted when the runner uninstalls the app after test completion.
8. The bundle script applies a render delay before the first fresh screenshot, then a second settle delay after navigation or test-artifact sync, and finally takes multiple fresh screenshot samples by default before choosing the last one as the fresh-capture candidate.
9. When `--expected-top-activity` is set, the bundle checks foreground activity both before and after fresh capture. If the app already tore down to another surface, the fresh capture is downgraded and a preferred test screenshot is rejected instead of silently promoting the wrong screen.
10. If test-screenshot sync is active, the bundle disables `uiautomator dump` by default unless `--allow-ui-dump-during-test-sync` is set explicitly. This avoids colliding with instrumentation tests that already use `UiAutomation` for their own screenshot helper.
11. The bundle script captures:
- canonical `screenshot.png`
- `fresh-screenshot.png` plus sampled `fresh-screenshot-*.png` files when fresh capture succeeds
- `test-screenshot.png` when a repository test screenshot was provided
- `ui-dump.xml` unless UI-dump capture was skipped
- `metadata.json` on every run
12. The bundle inspects the first `ui-dump.xml` for a primary scrollable container. When one is found, it captures additional bounded swipe screenshots automatically and stops early when scrolling no longer exposes new visible content.
13. Pass `--max-scrolls <count>` when you want an explicit override for the additional scroll budget instead of the auto-detected default.
14. If Android Studio Layout Inspector is available, use it in parallel for live hierarchy, attributes, Deep Inspect, Compose-aware inspection, and optional snapshot export.
15. If a Layout Inspector snapshot was exported manually, pass its path with `--layout-snapshot-path` so it is registered in the metadata bundle.

## Output Expectations

When using this skill, always return:
- the `capture_status`
- the `artifact_dir`
- the screenshot path
- the ordered screenshot paths when scroll capture was enabled
- the scroll-detection verdict, detected container bounds, and whether the bundle used auto or explicit scroll budget
- the screenshot source and whether the canonical image came from fresh capture or a test artifact
- the fresh screenshot sequence that was sampled before the canonical image was chosen
- the Layout Inspector snapshot path, if one was exported
- the device or emulator serial used
- the device model, display size, display density, locale, font scale, and night mode when available
- whether a hierarchy dump was also captured
- the ordered UI dump paths when scroll capture was enabled
- the screen, flow step, or package/activity if known
- any blocker such as `FLAG_SECURE`, multiple devices, or an unauthorized device

## Guardrails

- Do not use destructive ADB commands unless the user explicitly asks.
- Screens protected with `FLAG_SECURE` cannot be captured with normal screenshot methods.
- `uiautomator dump` is useful but incomplete for some Compose-heavy screens.
- Do not run `uiautomator dump` against a live instrumentation test that is already using `UiAutomation` screenshot APIs unless you explicitly accept the conflict risk.
- Layout Inspector works against the running debuggable app process; it is not a generic screenshot API.
- Android Studio can auto-enable `debug_view_attributes`, which may restart the current foreground activity.
- The old 3D mode described in older materials has been deprecated and removed starting in Android Studio Panda 2.
- Prefer timestamped filenames for repeated captures so earlier evidence is not overwritten.
- If the app is sensitive to timing, prefer the bundle defaults of a second settle window plus multi-shot capture. Do not rely on a single immediate screencap for test-driven states.
- On emulators, do not repeatedly invoke Gradle or UTP connected-test tasks for every runtime capture step when the app and test APKs are already built. Reuse installed packages and rerun the instrumentation class directly.
- When repository tests already capture each workflow step, prefer those screenshots as the canonical step evidence and use the fresh capture only as supplemental validation.
- Do not assume device-side screenshots under app external storage survive a UTP-backed test run. If the runner uninstalls after test, those files can disappear before sync completes.
- Do not accept a preferred test screenshot as canonical evidence when fresh validation already shows the app left the expected activity. Re-drive the state and capture again.
- For scrollable pages, prefer `--max-scrolls` over ad hoc manual swipe commands so metadata stays ordered and machine-readable.
- Treat `capture_bundle.sh` as the stable integration point. Keep direct calls to lower-level helpers for debugging or specialized workflows only.

## Bundled Resources

- [scripts/capture_bundle.sh](scripts/capture_bundle.sh): canonical entrypoint that creates a full capture bundle and prints structured metadata.
- [scripts/capture_screenshot.sh](scripts/capture_screenshot.sh): capture a PNG from the chosen Android device.
- [scripts/capture_ui_dump.sh](scripts/capture_ui_dump.sh): capture a `uiautomator` XML dump for the current screen.
- [scripts/run_instrumentation_test.sh](scripts/run_instrumentation_test.sh): install app and androidTest APKs once and rerun an instrumentation test directly through `am instrument`, which is the preferred repeat-run path on emulators.
- [scripts/common.sh](scripts/common.sh): shared device resolution, activity inspection, and JSON helpers.
- [scripts/validate.sh](scripts/validate.sh): shell-based smoke checks using a mocked `adb`.
- [references/layout-inspector-workflow.md](references/layout-inspector-workflow.md): official Layout Inspector workflow notes and caveats.
- [references/adb-layout-capture.md](references/adb-layout-capture.md): command recipes, troubleshooting, and capture limitations.

## References

Read [references/layout-inspector-workflow.md](references/layout-inspector-workflow.md) first for the official Android Studio workflow.
Read [references/adb-layout-capture.md](references/adb-layout-capture.md) when you need ADB command examples, troubleshooting steps, or a reminder of what the fallback can and cannot inspect.
