#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
execution_state_helper="$script_dir/../../android-spec-to-figma/scripts/execution_state.py"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

mock_bin="$tmp_dir/bin"
mkdir -p "$mock_bin"

cat > "$mock_bin/adb" <<'EOF'
#!/usr/bin/env bash

set -euo pipefail

scenario="${ADB_SCENARIO:-success}"
state_dir="${ADB_STATE_DIR:-}"

next_screencap_payload() {
  local counter_file="$state_dir/screencap_count"
  local count=0

  if [[ -n "$state_dir" ]]; then
    mkdir -p "$state_dir"
    if [[ -f "$counter_file" ]]; then
      count="$(cat "$counter_file")"
    fi
    echo $((count + 1)) > "$counter_file"
  fi

  case "$scenario" in
    scroll)
      case "$count" in
        0) printf 'FAKEPNG_INITIAL' ;;
        1) printf 'FAKEPNG_AFTER_SCROLL' ;;
        *) printf 'FAKEPNG_AFTER_SCROLL' ;;
      esac
      ;;
    *)
      printf 'FAKEPNG'
      ;;
  esac
}

window_dump_payload() {
  case "$scenario" in
    scroll)
      printf '<hierarchy rotation="0"><node class="android.widget.FrameLayout" scrollable="false" bounds="[0,0][1080,2400]" /><node class="androidx.core.widget.NestedScrollView" scrollable="true" bounds="[0,320][1080,2280]" resource-id="feed_list" content-desc="Feed list" /></hierarchy>\n'
      ;;
    *)
      printf '<hierarchy rotation="0"><node text="Home" bounds="[0,0][1080,2400]" /></hierarchy>\n'
      ;;
  esac
}

if [[ "${1:-}" == "devices" ]]; then
  case "$scenario" in
    none)
      printf 'List of devices attached\n\n'
      ;;
    unauthorized)
      printf 'List of devices attached\nemulator-5554\tunauthorized\n\n'
      ;;
    multi)
      printf 'List of devices attached\nemulator-5554\tdevice\nemulator-5556\tdevice\n\n'
      ;;
    *)
      printf 'List of devices attached\nemulator-5554\tdevice\n\n'
      ;;
  esac
  exit 0
fi

serial=""
if [[ "${1:-}" == "-s" ]]; then
  serial="$2"
  shift 2
fi

case "${1:-}" in
  shell)
    shift
    command_string="$*"
    case "$command_string" in
      "pm list packages com.example.app")
        printf 'package:com.example.app\n'
        ;;
      "am start -W -n com.example.app/.MainActivity")
        printf 'Starting: Intent { cmp=com.example.app/.MainActivity }\nStatus: ok\n'
        ;;
      "dumpsys window windows")
        case "$scenario" in
          activity_mismatch)
            printf 'mCurrentFocus=Window{42 u0 com.android.launcher/com.android.launcher.Launcher}\n'
            ;;
          *)
            printf 'mCurrentFocus=Window{42 u0 com.example.app/com.example.app.MainActivity}\n'
            ;;
        esac
        ;;
      "wm size")
        printf 'Physical size: 1080x2400\n'
        ;;
      "wm density")
        printf 'Physical density: 420\n'
        ;;
      "settings get system font_scale")
        printf '1.0\n'
        ;;
      "getprop persist.sys.locale")
        printf 'en-US\n'
        ;;
      "getprop ro.product.locale")
        printf 'en-US\n'
        ;;
      "getprop ro.product.model")
        printf 'Pixel 8\n'
        ;;
      "dumpsys uimode")
        printf 'mNightMode=2\n'
        ;;
      "uiautomator dump /sdcard/window_dump.xml")
        printf 'UI hierchary dumped to: /sdcard/window_dump.xml\n'
        ;;
      input\ swipe\ *)
        exit 0
        ;;
      "rm -f /sdcard/window_dump.xml")
        exit 0
        ;;
      *)
        printf 'Unhandled shell command: %s\n' "$command_string" >&2
        exit 1
        ;;
    esac
    ;;
  exec-out)
    shift
    case "$*" in
      "screencap -p")
        printf '\x89PNG\r\n\x1a\n'
        next_screencap_payload
        ;;
      "cat /sdcard/window_dump.xml")
        window_dump_payload
        ;;
      *)
        printf 'Unhandled exec-out command: %s\n' "$*" >&2
        exit 1
        ;;
    esac
    ;;
  *)
    printf 'Unhandled adb invocation: %s %s\n' "${serial:-}" "$*" >&2
    exit 1
    ;;
esac
EOF

chmod +x "$mock_bin/adb"

assert_fails() {
  local description="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "Validation failed: $description should have failed" >&2
    exit 1
  fi
}

echo "[1/9] help output"
PATH="$mock_bin:$PATH" "$script_dir/capture_bundle.sh" --help >/dev/null

echo "[2/9] invalid delay rejected"
assert_fails "invalid screenshot delay" env PATH="$mock_bin:$PATH" "$script_dir/capture_screenshot.sh" "$tmp_dir/out.png" --delay nope

echo "[3/9] no device detected"
assert_fails "no-device bundle capture" env PATH="$mock_bin:$PATH" ADB_SCENARIO=none "$script_dir/capture_bundle.sh" --screen home --artifacts-root "$tmp_dir/artifacts"

echo "[4/9] multiple devices detected"
assert_fails "multi-device bundle capture" env PATH="$mock_bin:$PATH" ADB_SCENARIO=multi "$script_dir/capture_bundle.sh" --screen home --artifacts-root "$tmp_dir/artifacts"

echo "[5/9] initialize shared execution state"
state_json="$(python3 "$execution_state_helper" init \
  --artifacts-root "$tmp_dir/flow-artifacts" \
  --request-summary "Capture Android runtime evidence for Home" \
  --destination "android-runtime-validator:home")"
state_path="$(python3 - "$state_json" <<'PY'
import json
import sys
print(json.loads(sys.argv[1])["statePath"])
PY
)"

echo "[6/9] successful bundle capture updates the shared ledger"
bundle_json="$(env PATH="$mock_bin:$PATH" ADB_SCENARIO=success "$script_dir/capture_bundle.sh" --screen home --artifacts-root "$tmp_dir/artifacts" --package com.example.app --activity .MainActivity --wait-activity com.example.app --execution-state "$state_path" --queue-id workflow-home --workflow-step-id workflow.home --canonical-target-id screen.home --navigation-hint 'Open app and land on Home')"

python3 - "$bundle_json" "$state_path" <<'PY'
import json
import os
import sys

data = json.loads(sys.argv[1])
with open(sys.argv[2], "r", encoding="utf-8") as handle:
    state = json.load(handle)

assert data["capture_status"] == "success", data
assert data["device_serial"] == "emulator-5554", data
assert data["display_size"] == "1080x2400", data
assert data["display_density"] == "420", data
assert data["font_scale"] == "1.0", data
assert data["device_locale"] == "en-US", data
assert data["night_mode"] == "yes", data
assert data["device_model"] == "Pixel 8", data
assert data["capture_count"] == "2", data
assert data["fresh_capture_status"] == "captured", data
assert data["screenshot_source"] == "fresh_capture", data
assert data["ui_dump_captured"] is True, data
assert os.path.isfile(data["screenshot_path"]), data
assert os.path.isfile(data["fresh_screenshot_path"]), data
assert os.path.isfile(data["ui_dump_path"]), data
assert os.path.isfile(data["metadata_path"]), data
assert len(data["fresh_screenshot_sequence_paths"]) == 2, data
assert data["screenshot_paths"][0] == data["fresh_screenshot_path"], data
assert data["ui_dump_paths"][0] == data["ui_dump_path"], data
assert all(os.path.isfile(path) for path in data["fresh_screenshot_sequence_paths"]), data
queue = state["runtimeCapture"]["pendingQueue"]
assert len(queue) == 1, state
assert queue[0]["queueId"] == "workflow-home", state
assert queue[0]["status"] == "captured", state
assert queue[0]["workflowStepId"] == "workflow.home", state
assert queue[0]["canonicalTargetId"] == "screen.home", state
assert queue[0]["attemptCount"] == 1, state
assert len(queue[0]["screenshotPaths"]) >= 2, state
assert [os.path.realpath(path) for path in queue[0]["uiDumpPaths"]] == [os.path.realpath(data["ui_dump_path"])], state
PY

echo "[7/9] test screenshot sync prefers stable workflow evidence"
printf '\x89PNG\r\n\x1a\nTESTPNG' > "$tmp_dir/test-step.png"
test_bundle_json="$(env PATH="$mock_bin:$PATH" ADB_SCENARIO=success "$script_dir/capture_bundle.sh" --screen consent --artifacts-root "$tmp_dir/artifacts" --package com.example.app --wait-activity com.example.app --expected-top-activity com.example.app --test-screenshot-local-path "$tmp_dir/test-step.png" --prefer-test-screenshot)"

python3 - "$test_bundle_json" "$tmp_dir/test-step.png" <<'PY'
import json
import os
import sys

data = json.loads(sys.argv[1])
source_path = os.path.abspath(sys.argv[2])

assert data["capture_status"] == "success", data
assert data["screenshot_source"] == "test_screenshot", data
assert data["test_screenshot_source"] == "local_path", data
assert data["test_screenshot_local_path"] == source_path, data
assert data["ui_dump_captured"] is False, data
assert data["ui_dump_skip_reason"] == "disabled_during_test_screenshot_sync_to_avoid_uiautomation_conflict", data
assert data["fresh_capture_status"] == "captured", data
assert os.path.isfile(data["screenshot_path"]), data
assert os.path.isfile(data["test_screenshot_path"]), data
assert os.path.isfile(data["fresh_screenshot_path"]), data
assert len(data["fresh_screenshot_sequence_paths"]) == 2, data
print("Validation passed")
PY

echo "[8/9] preferred test screenshot is rejected without fresh validation"
set +e
invalid_bundle_json="$(env PATH="$mock_bin:$PATH" ADB_SCENARIO=activity_mismatch "$script_dir/capture_bundle.sh" --screen consent --artifacts-root "$tmp_dir/artifacts" --package com.example.app --expected-top-activity com.example.app --test-screenshot-local-path "$tmp_dir/test-step.png" --prefer-test-screenshot 2>/dev/null)"
invalid_bundle_status=$?
set -e

if [[ "$invalid_bundle_status" -eq 0 ]]; then
  echo "Validation failed: preferred test screenshot should have been rejected without fresh validation" >&2
  exit 1
fi

python3 - "$invalid_bundle_json" <<'PY'
import json
import os
import sys

data = json.loads(sys.argv[1])

assert data["capture_status"] == "failed", data
assert data["fresh_capture_status"] == "activity_mismatch", data
assert data["failure_reason"] == "preferred_test_screenshot_requires_fresh_validated_capture", data
assert data["test_screenshot_source"] == "local_path", data
assert data["screenshot_path"] is None, data
assert os.path.isfile(data["test_screenshot_path"]), data
print("Validation passed")
PY

echo "[9/9] scroll capture auto-detects scrollable content, captures extra viewports, and stops when the viewport stabilizes"
scroll_json="$(env PATH="$mock_bin:$PATH" ADB_SCENARIO=scroll ADB_STATE_DIR="$tmp_dir/scroll-state" "$script_dir/capture_bundle.sh" --screen feed --artifacts-root "$tmp_dir/artifacts" --capture-count 1 --execution-state "$state_path" --queue-id workflow-feed)"

python3 - "$scroll_json" "$state_path" <<'PY'
import json
import os
import sys

data = json.loads(sys.argv[1])
with open(sys.argv[2], "r", encoding="utf-8") as handle:
    state = json.load(handle)

assert data["capture_status"] == "success", data
assert data["scrollable_detected"] is True, data
assert data["scroll_detection_status"] == "scrollable_node_detected", data
assert data["scroll_capture_mode"] == "auto", data
assert data["scroll_capture_budget"] == "3", data
assert data["scroll_boundary_reached"] is True, data
assert data["scrolls_performed"] == "1", data
assert data["max_scrolls"] == "0", data
assert data["scrollable_bounds"] == "[0,320][1080,2280]", data
assert "NestedScrollView" in data["scrollable_class"], data
assert len(data["screenshot_paths"]) == 2, data
assert len(data["ui_dump_paths"]) == 2, data
assert data["screenshot_paths"][0] == data["fresh_screenshot_path"], data
assert os.path.isfile(data["screenshot_paths"][1]), data
assert not os.path.exists(os.path.join(data["artifact_dir"], "screenshot-02.png")), data
queue = next(item for item in state["runtimeCapture"]["pendingQueue"] if item["queueId"] == "workflow-feed")
assert os.path.realpath(queue["uiDumpPath"]) == os.path.realpath(data["ui_dump_paths"][0]), queue
assert [os.path.realpath(path) for path in queue["uiDumpPaths"]] == [os.path.realpath(path) for path in data["ui_dump_paths"]], queue
print("Scroll validation passed")
PY
