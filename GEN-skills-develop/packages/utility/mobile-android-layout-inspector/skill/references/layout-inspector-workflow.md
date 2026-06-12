# Android Studio Layout Inspector Workflow

Primary source: [Debug your layout with Layout Inspector](https://developer.android.com/studio/debug/layout-inspector)

Use this reference when the task is about the official Android Studio Layout Inspector rather than ADB-only capture.

## What Layout Inspector Is Good For

- Inspecting the live component tree and view attributes of a running app
- Inspecting Compose, View, or hybrid layouts
- Using Deep Inspect to select views directly from the rendered layout
- Exporting and importing Layout Inspector snapshots for later review
- Comparing the running UI to a reference bitmap overlay

## Official Start Flow

1. Run the app.
2. Open the Running Devices window in Android Studio.
3. Click Toggle Layout Inspector.
4. Let Layout Inspector connect to the foreground debuggable process on the selected device.

## Practical Notes

- Leave a short delay after navigation before capturing screenshots so the rendered page is stable.
- Layout Inspector may require an activity restart to access detailed attributes.
- Android Studio can enable `debug_view_attributes` automatically.
- The related device setting is:

```bash
adb shell settings put global debug_view_attributes 1
```

- To disable it again:

```bash
adb shell settings delete global debug_view_attributes
```

## Snapshots

Use Layout Inspector snapshot export when the user needs a shareable hierarchy artifact, not just a PNG image.

- Export from Snapshot Export/Import > Export Snapshot
- Reopen later with Import Snapshot
- If you are also using `scripts/capture_bundle.sh`, register the exported snapshot with `--layout-snapshot-path <path>` so the artifact bundle includes it in `metadata.json`.

According to the Android docs, snapshots include the component tree and detailed attributes, and they can cover View, Compose, or hybrid layouts.

## Important Limitations

- Layout Inspector is primarily an Android Studio inspection tool, not a standalone screenshot mechanism.
- For plain screen images, use ADB screenshot capture alongside Layout Inspector.
- The older 3D mode mentioned in historical material has been deprecated and removed starting in Android Studio Panda 2.
- This skill does not automate Android Studio UI interactions. Snapshot export is still a manual Layout Inspector step.
