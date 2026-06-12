#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$script_dir/common.sh"

usage() {
  cat <<'EOF'
Usage:
  capture_bundle.sh --screen <screen-name> [options]

Options:
  --screen <name>                      Logical screen name for the artifact folder.
  --artifacts-root <dir>               Base artifacts folder. Default: artifacts/layout-inspector
  --execution-state <path>             Optional execution_state.json to update before and after capture.
  --queue-id <id>                      Optional stable runtime-capture queue item ID.
  --workflow-step-id <id>              Optional workflow step ID for the queue item.
  --canonical-target-id <id>           Optional canonical screen/state ID for the queue item.
  --navigation-hint <text>             Optional navigation hint for resuming the queue item.
  --serial <device-serial>             Device serial. Falls back to ANDROID_SERIAL.
  --delay <seconds>                    Render delay before the first fresh screenshot. Default: 2
  --max-scrolls <count>                Explicit maximum additional downward scroll captures after scrollable
                                       content is detected. Default explicit override: 0; the bundle still
                                       auto-detects and captures up to 3 extra viewports when possible.
  --scroll-delay <seconds>             Delay after each scroll before capture. Default: 1
  --scroll-duration-ms <ms>            Swipe duration used for scrolling. Default: 300
  --post-trigger-delay <seconds>       Extra settle delay after activity or test trigger sync. Default: 1
  --capture-count <count>              Number of fresh screenshots to sample before picking the last one. Default: 2
  --capture-interval <seconds>         Delay between fresh screenshot samples after the first one. Default: 1
  --package <package-name>             Package to verify before capture.
  --activity <activity-name>           Activity to launch before capture. Requires --package.
  --wait-activity <substring>          Foreground activity substring to wait for.
  --expected-top-activity <substring>  Foreground activity substring that must still be visible at capture time.
  --wait-timeout <seconds>             Wait timeout for --wait-activity. Default: 15
  --test-screenshot-local-path <path>  Local step screenshot to wait for and register as evidence.
  --test-screenshot-device-path <path> Device-side step screenshot to wait for and pull into the bundle.
  --test-screenshot-timeout <seconds>  Wait timeout for a test screenshot path. Default: 30
  --test-screenshot-stable-seconds <s> Stable-write window before using a test screenshot. Default: 1
  --prefer-test-screenshot             Make the pulled or local test screenshot the canonical screenshot.png.
                                       When --expected-top-activity is set, this also requires a successful fresh validated capture.
  --allow-ui-dump-during-test-sync     Keep ui-dump capture enabled even when test screenshot sync is active.
  --no-ui-dump                         Skip the uiautomator XML dump.
  --layout-snapshot-path <path>        Optional existing Layout Inspector snapshot to register.
  -h, --help                           Show this help message.

Outputs:
  Writes artifacts to <artifacts-root>/<timestamp>/<screen-slug>/ and prints metadata.json to stdout.
EOF
}

screen_name=""
artifacts_root="artifacts/layout-inspector"
serial="${ANDROID_SERIAL:-}"
delay_seconds="2"
max_scrolls="0"
scroll_delay_seconds="1"
scroll_duration_ms="300"
post_trigger_delay_seconds="1"
capture_count="2"
capture_interval_seconds="1"
package_name=""
activity_name=""
wait_activity=""
expected_top_activity=""
wait_timeout_seconds="15"
capture_ui_dump="true"
allow_ui_dump_during_test_sync="false"
layout_snapshot_path=""
test_screenshot_local_path=""
test_screenshot_device_path=""
test_screenshot_timeout_seconds="30"
test_screenshot_stable_seconds="1"
prefer_test_screenshot="false"
artifact_dir=""
screenshot_path=""
fresh_screenshot_path=""
test_screenshot_path=""
ui_dump_path=""
metadata_path=""
captured_at_utc=""
top_activity=""
top_activity_before_capture=""
top_activity_after_capture=""
launched_component=""
capture_status="failed"
failure_reason="capture_not_started"
ui_dump_captured="false"
ui_dump_skip_reason=""
display_size=""
display_density=""
font_scale=""
device_locale=""
night_mode=""
device_model=""
scroll_boundary_reached="false"
scrolls_performed="0"
default_auto_scrolls="3"
scroll_capture_budget="0"
scroll_capture_mode="disabled"
scroll_capture_skipped_reason=""
scroll_detection_status="not_checked"
scrollable_detected="false"
scrollable_bounds=""
scrollable_class=""
scrollable_resource_id=""
scrollable_content_desc=""
scrollable_left=""
scrollable_top=""
scrollable_right=""
scrollable_bottom=""
execution_state_path=""
queue_id=""
workflow_step_id=""
canonical_target_id=""
navigation_hint=""
execution_state_helper="$script_dir/../../android-spec-to-figma/scripts/execution_state.py"
screenshot_source="fresh_capture"
fresh_capture_status="not_started"
fresh_capture_failure_reason=""
test_screenshot_source=""

fresh_screenshot_sequence_paths=()
screenshot_paths=()
ui_dump_paths=()

normalize_reason() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/_/g; s/^_+//; s/_+$//; s/_{2,}/_/g'
}

fail() {
  local message="$1"
  capture_status="failed"
  if [[ "$failure_reason" == "capture_not_started" || "$failure_reason" == "in_progress" ]]; then
    failure_reason="$(normalize_reason "$message")"
  fi
  echo "$message" >&2
  exit 1
}

mark_partial_if_clean() {
  local reason="$1"
  capture_status="partial"
  if [[ -z "$failure_reason" || "$failure_reason" == "in_progress" ]]; then
    failure_reason="$reason"
  fi
}

json_array_from_args() {
  python3 - "$@" <<'PY'
import json
import sys

print(json.dumps(sys.argv[1:]))
PY
}

shell_single_quote() {
  local value="$1"
  printf "'%s'" "${value//\'/\'\\\'\'}"
}

device_file_size_bytes() {
  local serial_value="$1"
  local remote_path="$2"
  local package_value="${3:-}"
  local quoted_path=""
  local output=""

  quoted_path="$(shell_single_quote "$remote_path")"
  if [[ -n "$package_value" ]]; then
    output="$(adb_with_serial "$serial_value" shell run-as "$package_value" sh -c "wc -c < $quoted_path" 2>/dev/null | tr -d '\r[:space:]' || true)"
  else
    output="$(adb_with_serial "$serial_value" shell sh -c "wc -c < $quoted_path" 2>/dev/null | tr -d '\r[:space:]' || true)"
  fi

  if [[ "$output" =~ ^[0-9]+$ ]]; then
    printf '%s' "$output"
  fi
}

looks_like_app_external_storage_path() {
  local remote_path="$1"
  [[ "$remote_path" == /sdcard/Android/data/*/files/* || "$remote_path" == /storage/emulated/0/Android/data/*/files/* ]]
}

test_screenshot_timeout_message() {
  local remote_path="$1"
  if looks_like_app_external_storage_path "$remote_path"; then
    printf "%s" "Timed out waiting for device file '$remote_path'. If this screenshot comes from an instrumentation test run through Gradle or UTP, app external storage may have been deleted by uninstall_after_test before sync completed. Prefer a host artifact, additionalTestOutputDir, or a direct am instrument rerun that keeps the packages installed."
    return 0
  fi
  printf "%s" "Timed out waiting for device file '$remote_path'."
}

wait_for_device_file_stable() {
  local serial_value="$1"
  local remote_path="$2"
  local timeout_seconds="$3"
  local stable_seconds="$4"
  local package_value="${5:-}"
  local elapsed=0
  local first_size=""
  local second_size=""

  validate_non_negative_integer "test screenshot timeout" "$timeout_seconds"
  validate_non_negative_number "test screenshot stable seconds" "$stable_seconds"

  while (( elapsed <= timeout_seconds )); do
    first_size="$(device_file_size_bytes "$serial_value" "$remote_path" "$package_value")"
    if [[ "$first_size" =~ ^[0-9]+$ && "$first_size" -gt 0 ]]; then
      if [[ "$stable_seconds" == "0" || "$stable_seconds" == "0.0" || "$stable_seconds" == "0.00" ]]; then
        return 0
      fi

      sleep_if_positive "$stable_seconds"
      second_size="$(device_file_size_bytes "$serial_value" "$remote_path" "$package_value")"
      if [[ "$second_size" =~ ^[0-9]+$ && "$second_size" -eq "$first_size" ]]; then
        return 0
      fi
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  fail "$(test_screenshot_timeout_message "$remote_path")"
}

copy_device_file_to_local() {
  local serial_value="$1"
  local remote_path="$2"
  local output_path="$3"
  local package_value="${4:-}"

  mkdir -p "$(dirname "$output_path")"
  if [[ -n "$package_value" ]]; then
    adb_with_serial "$serial_value" exec-out run-as "$package_value" cat "$remote_path" > "$output_path" || return 1
  else
    adb_with_serial "$serial_value" exec-out cat "$remote_path" > "$output_path" || return 1
  fi

  [[ -s "$output_path" ]]
}

prepare_test_screenshot() {
  if [[ -n "$test_screenshot_local_path" && -n "$test_screenshot_device_path" ]]; then
    fail "Pass only one of --test-screenshot-local-path or --test-screenshot-device-path."
  fi

  if [[ -n "$test_screenshot_local_path" ]]; then
    wait_for_local_file_stable "$test_screenshot_local_path" "$test_screenshot_timeout_seconds" "$test_screenshot_stable_seconds"
    cp "$test_screenshot_local_path" "$test_screenshot_path"
    [[ -s "$test_screenshot_path" ]] || fail "Failed to copy local test screenshot '$test_screenshot_local_path'."
    test_screenshot_source="local_path"
    test_screenshot_local_path="$(absolute_path "$test_screenshot_local_path")"
    test_screenshot_path="$(absolute_path "$test_screenshot_path")"
    return 0
  fi

  if [[ -n "$test_screenshot_device_path" ]]; then
    wait_for_device_file_stable "$serial" "$test_screenshot_device_path" "$test_screenshot_timeout_seconds" "$test_screenshot_stable_seconds" "$package_name"
    if ! copy_device_file_to_local "$serial" "$test_screenshot_device_path" "$test_screenshot_path" "$package_name"; then
      rm -f "$test_screenshot_path"
      fail "Failed to pull device test screenshot '$test_screenshot_device_path'."
    fi
    test_screenshot_source="device_path"
    test_screenshot_path="$(absolute_path "$test_screenshot_path")"
  fi
}

activity_matches_expectation() {
  local current_activity="$1"
  [[ -z "$expected_top_activity" ]] && return 0
  [[ -n "$current_activity" && "$current_activity" == *"$expected_top_activity"* ]]
}

preferred_test_screenshot_requires_fresh_validation() {
  [[ "$prefer_test_screenshot" == "true" && -n "$expected_top_activity" ]]
}

capture_fresh_screenshots() {
  local index=0
  local capture_delay="$delay_seconds"
  local candidate_path=""
  local last_candidate_path=""

  fresh_capture_status="in_progress"
  top_activity_before_capture="$(current_focus_component "$serial")"
  if ! activity_matches_expectation "$top_activity_before_capture"; then
    fresh_capture_status="activity_mismatch"
    fresh_capture_failure_reason="foreground_activity_mismatch_before_capture"
    return 1
  fi

  for ((index = 1; index <= capture_count; index++)); do
    candidate_path="$artifact_dir/fresh-screenshot-$(printf '%02d' "$index").png"
    if ! "$script_dir/capture_screenshot.sh" "$candidate_path" --serial "$serial" --delay "$capture_delay" >/dev/null; then
      rm -f "$candidate_path"
      fresh_capture_status="failed"
      fresh_capture_failure_reason="fresh_screenshot_capture_failed"
      return 1
    fi

    candidate_path="$(absolute_path "$candidate_path")"
    fresh_screenshot_sequence_paths+=("$candidate_path")
    last_candidate_path="$candidate_path"
    capture_delay="$capture_interval_seconds"
  done

  top_activity_after_capture="$(current_focus_component "$serial")"
  top_activity="$top_activity_after_capture"
  if ! activity_matches_expectation "$top_activity_after_capture"; then
    fresh_capture_status="activity_mismatch"
    fresh_capture_failure_reason="foreground_activity_mismatch_after_capture"
    return 1
  fi

  cp "$last_candidate_path" "$fresh_screenshot_path"
  [[ -s "$fresh_screenshot_path" ]] || fail "Failed to persist fresh screenshot sample."
  fresh_screenshot_path="$(absolute_path "$fresh_screenshot_path")"
  fresh_capture_status="captured"
  fresh_capture_failure_reason=""
  return 0
}

capture_scroll_sequence() {
  local scroll_budget=0
  local scrollable_line=""
  local previous_screenshot_digest=""
  local current_screenshot_digest=""
  local scroll_index=0
  local scroll_screenshot_path=""
  local scroll_ui_dump_path=""

  if [[ "$fresh_capture_status" != "captured" || ! -f "$fresh_screenshot_path" ]]; then
    scroll_detection_status="fresh_capture_unavailable"
    scroll_capture_skipped_reason="fresh_capture_unavailable"
    return 0
  fi

  if [[ "$ui_dump_captured" != "true" || ! -f "$ui_dump_path" ]]; then
    scroll_detection_status="ui_dump_unavailable"
    scroll_capture_skipped_reason="ui_dump_unavailable"
    if (( max_scrolls > 0 )); then
      mark_partial_if_clean "scroll_detection_requires_ui_dump"
    fi
    return 0
  fi

  scrollable_line="$(detect_primary_scrollable_node "$ui_dump_path" || true)"
  if [[ -z "$scrollable_line" ]]; then
    scroll_detection_status="no_scrollable_node"
    scroll_capture_mode="not_scrollable"
    scroll_capture_skipped_reason="no_scrollable_node"
    return 0
  fi

  IFS=$'\t' read -r scrollable_bounds scrollable_left scrollable_top scrollable_right scrollable_bottom scrollable_class scrollable_resource_id scrollable_content_desc <<<"$scrollable_line"
  scrollable_detected="true"
  scroll_detection_status="scrollable_node_detected"
  scroll_capture_skipped_reason=""

  if (( max_scrolls > 0 )); then
    scroll_budget="$max_scrolls"
    scroll_capture_mode="explicit"
  else
    scroll_budget="$default_auto_scrolls"
    scroll_capture_mode="auto"
  fi
  scroll_capture_budget="$scroll_budget"

  if (( scroll_budget <= 0 )); then
    scroll_capture_skipped_reason="scroll_budget_zero"
    return 0
  fi

  previous_screenshot_digest="$(file_sha256 "$fresh_screenshot_path")"

  for ((scroll_index = 1; scroll_index <= scroll_budget; scroll_index++)); do
    scroll_screenshot_path="$artifact_dir/screenshot-$(printf '%02d' "$scroll_index").png"
    scroll_ui_dump_path="$artifact_dir/ui-dump-$(printf '%02d' "$scroll_index").xml"

    perform_vertical_swipe_in_bounds \
      "$serial" \
      "$scroll_duration_ms" \
      "$scrollable_left" \
      "$scrollable_top" \
      "$scrollable_right" \
      "$scrollable_bottom"
    sleep_if_positive "$scroll_delay_seconds"

    if ! "$script_dir/capture_screenshot.sh" "$scroll_screenshot_path" --serial "$serial" --delay 0 >/dev/null; then
      rm -f "$scroll_screenshot_path"
      mark_partial_if_clean "scroll_capture_failed"
      break
    fi

    current_screenshot_digest="$(file_sha256 "$scroll_screenshot_path")"
    if [[ "$current_screenshot_digest" == "$previous_screenshot_digest" ]]; then
      rm -f "$scroll_screenshot_path" "$scroll_ui_dump_path"
      scroll_boundary_reached="true"
      break
    fi

    scroll_screenshot_path="$(absolute_path "$scroll_screenshot_path")"
    screenshot_paths+=("$scroll_screenshot_path")
    previous_screenshot_digest="$current_screenshot_digest"
    scrolls_performed="$scroll_index"

    if [[ "$capture_ui_dump" == "true" ]]; then
      if "$script_dir/capture_ui_dump.sh" "$scroll_ui_dump_path" --serial "$serial" >/dev/null; then
        ui_dump_paths+=("$(absolute_path "$scroll_ui_dump_path")")
      else
        rm -f "$scroll_ui_dump_path"
        mark_partial_if_clean "scroll_ui_dump_failed"
      fi
    fi
  done
}

select_canonical_screenshot() {
  local selected_source=""
  local selected_path=""

  if [[ "$prefer_test_screenshot" == "true" && -f "$test_screenshot_path" ]]; then
    if preferred_test_screenshot_requires_fresh_validation && [[ "$fresh_capture_status" != "captured" ]]; then
      failure_reason="preferred_test_screenshot_requires_fresh_validated_capture"
      fail "Preferred test screenshot for '$screen_name' is not backed by a fresh validated capture."
    fi
    selected_source="test_screenshot"
    selected_path="$test_screenshot_path"
  elif [[ -f "$fresh_screenshot_path" ]]; then
    selected_source="fresh_capture"
    selected_path="$fresh_screenshot_path"
  elif [[ -f "$test_screenshot_path" ]]; then
    selected_source="test_screenshot"
    selected_path="$test_screenshot_path"
  else
    fail "No screenshot evidence was captured."
  fi

  cp "$selected_path" "$screenshot_path"
  [[ -s "$screenshot_path" ]] || fail "Failed to prepare canonical screenshot."
  screenshot_path="$(absolute_path "$screenshot_path")"
  screenshot_source="$selected_source"
}

write_metadata() {
  [[ -n "$metadata_path" ]] || return 0

  local snapshot_value="__NULL__"
  local fresh_screenshot_value="__NULL__"
  local test_screenshot_value="__NULL__"
  local expected_activity_value="__NULL__"
  local wait_activity_value="__NULL__"
  local pre_capture_value="__NULL__"
  local post_capture_value="__NULL__"
  local ui_dump_skip_value="__NULL__"
  local test_screenshot_source_value="__NULL__"
  local test_screenshot_local_value="__NULL__"
  local test_screenshot_device_value="__NULL__"
  local fresh_failure_value="__NULL__"
  local scroll_bounds_value="__NULL__"
  local scroll_class_value="__NULL__"
  local scroll_resource_value="__NULL__"
  local scroll_content_desc_value="__NULL__"
  local scroll_detection_value="__NULL__"
  local scroll_capture_mode_value="__NULL__"
  local scroll_capture_skip_value="__NULL__"
  local screenshot_source_value="__NULL__"
  local screenshot_value="__NULL__"
  local sequence_json="[]"
  local screenshot_paths_json="[]"
  local ui_dump_paths_json="[]"

  if [[ -n "$layout_snapshot_path" ]]; then
    snapshot_value="$layout_snapshot_path"
  fi
  if [[ -f "$fresh_screenshot_path" ]]; then
    fresh_screenshot_value="$fresh_screenshot_path"
  fi
  if [[ -f "$test_screenshot_path" ]]; then
    test_screenshot_value="$test_screenshot_path"
  fi
  if [[ -n "$expected_top_activity" ]]; then
    expected_activity_value="$expected_top_activity"
  fi
  if [[ -n "$wait_activity" ]]; then
    wait_activity_value="$wait_activity"
  fi
  if [[ -n "$top_activity_before_capture" ]]; then
    pre_capture_value="$top_activity_before_capture"
  fi
  if [[ -n "$top_activity_after_capture" ]]; then
    post_capture_value="$top_activity_after_capture"
  fi
  if [[ -n "$ui_dump_skip_reason" ]]; then
    ui_dump_skip_value="$ui_dump_skip_reason"
  fi
  if [[ -n "$test_screenshot_source" ]]; then
    test_screenshot_source_value="$test_screenshot_source"
  fi
  if [[ -n "$test_screenshot_local_path" ]]; then
    test_screenshot_local_value="$test_screenshot_local_path"
  fi
  if [[ -n "$test_screenshot_device_path" ]]; then
    test_screenshot_device_value="$test_screenshot_device_path"
  fi
  if [[ -n "$fresh_capture_failure_reason" ]]; then
    fresh_failure_value="$fresh_capture_failure_reason"
  fi
  if [[ -n "$scrollable_bounds" ]]; then
    scroll_bounds_value="$scrollable_bounds"
  fi
  if [[ -n "$scrollable_class" ]]; then
    scroll_class_value="$scrollable_class"
  fi
  if [[ -n "$scrollable_resource_id" ]]; then
    scroll_resource_value="$scrollable_resource_id"
  fi
  if [[ -n "$scrollable_content_desc" ]]; then
    scroll_content_desc_value="$scrollable_content_desc"
  fi
  if [[ -n "$scroll_detection_status" ]]; then
    scroll_detection_value="$scroll_detection_status"
  fi
  if [[ -n "$scroll_capture_mode" ]]; then
    scroll_capture_mode_value="$scroll_capture_mode"
  fi
  if [[ -n "$scroll_capture_skipped_reason" ]]; then
    scroll_capture_skip_value="$scroll_capture_skipped_reason"
  fi
  if [[ -f "$screenshot_path" ]]; then
    screenshot_value="$screenshot_path"
  fi
  if [[ -n "$screenshot_source" && -f "$screenshot_path" ]]; then
    screenshot_source_value="$screenshot_source"
  fi
  if [[ "${#fresh_screenshot_sequence_paths[@]}" -gt 0 ]]; then
    sequence_json="$(json_array_from_args "${fresh_screenshot_sequence_paths[@]}")"
  fi
  if [[ "${#screenshot_paths[@]}" -gt 0 ]]; then
    screenshot_paths_json="$(json_array_from_args "${screenshot_paths[@]}")"
  fi
  if [[ "${#ui_dump_paths[@]}" -gt 0 ]]; then
    ui_dump_paths_json="$(json_array_from_args "${ui_dump_paths[@]}")"
  fi

  write_json_file "$metadata_path" \
    "artifact_dir=$artifact_dir" \
    "capture_count=$capture_count" \
    "capture_interval_seconds=$capture_interval_seconds" \
    "capture_status=$capture_status" \
    "captured_at_utc=$captured_at_utc" \
    "delay_seconds=$delay_seconds" \
    "device_locale=$( [[ -n "$device_locale" ]] && echo "$device_locale" || echo __NULL__ )" \
    "device_model=$( [[ -n "$device_model" ]] && echo "$device_model" || echo __NULL__ )" \
    "device_serial=$serial" \
    "display_density=$( [[ -n "$display_density" ]] && echo "$display_density" || echo __NULL__ )" \
    "display_size=$( [[ -n "$display_size" ]] && echo "$display_size" || echo __NULL__ )" \
    "expected_top_activity=$expected_activity_value" \
    "failure_reason=$failure_reason" \
    "font_scale=$( [[ -n "$font_scale" ]] && echo "$font_scale" || echo __NULL__ )" \
    "fresh_capture_failure_reason=$fresh_failure_value" \
    "fresh_capture_status=$fresh_capture_status" \
    "fresh_screenshot_path=$fresh_screenshot_value" \
    "fresh_screenshot_sequence_paths=__JSON__$sequence_json" \
    "launched_component=${launched_component:-}" \
    "layout_snapshot_path=$snapshot_value" \
    "max_scrolls=$max_scrolls" \
    "metadata_path=$metadata_path" \
    "night_mode=$( [[ -n "$night_mode" ]] && echo "$night_mode" || echo __NULL__ )" \
    "package_name=${package_name:-}" \
    "post_trigger_delay_seconds=$post_trigger_delay_seconds" \
    "screen_name=$screen_name" \
    "screenshot_path=$screenshot_value" \
    "screenshot_paths=__JSON__$screenshot_paths_json" \
    "screenshot_source=$screenshot_source_value" \
    "scroll_capture_budget=$scroll_capture_budget" \
    "scroll_capture_mode=$scroll_capture_mode_value" \
    "scroll_capture_skipped_reason=$scroll_capture_skip_value" \
    "scroll_boundary_reached=$( [[ "$scroll_boundary_reached" == "true" ]] && echo __BOOL_TRUE__ || echo __BOOL_FALSE__ )" \
    "scroll_delay_seconds=$scroll_delay_seconds" \
    "scroll_detection_status=$scroll_detection_value" \
    "scroll_duration_ms=$scroll_duration_ms" \
    "scrolls_performed=$scrolls_performed" \
    "scrollable_bounds=$scroll_bounds_value" \
    "scrollable_class=$scroll_class_value" \
    "scrollable_content_desc=$scroll_content_desc_value" \
    "scrollable_detected=$( [[ "$scrollable_detected" == "true" ]] && echo __BOOL_TRUE__ || echo __BOOL_FALSE__ )" \
    "scrollable_resource_id=$scroll_resource_value" \
    "test_screenshot_device_path=$test_screenshot_device_value" \
    "test_screenshot_local_path=$test_screenshot_local_value" \
    "test_screenshot_path=$test_screenshot_value" \
    "test_screenshot_source=$test_screenshot_source_value" \
    "top_activity=${top_activity:-}" \
    "top_activity_after_capture=$post_capture_value" \
    "top_activity_before_capture=$pre_capture_value" \
    "ui_dump_captured=$( [[ "$ui_dump_captured" == "true" ]] && echo __BOOL_TRUE__ || echo __BOOL_FALSE__ )" \
    "ui_dump_path=$( [[ "$ui_dump_captured" == "true" ]] && echo "$ui_dump_path" || echo __NULL__ )" \
    "ui_dump_paths=__JSON__$ui_dump_paths_json" \
    "ui_dump_skip_reason=$ui_dump_skip_value" \
    "wait_activity=$wait_activity_value"
}

cleanup_and_report() {
  if [[ -n "$metadata_path" ]]; then
    write_metadata
    update_execution_state_finish
    cat "$metadata_path"
  fi
}

trap cleanup_and_report EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --screen)
      [[ $# -ge 2 ]] || fail "Missing value for --screen"
      screen_name="$2"
      shift 2
      ;;
    --artifacts-root)
      [[ $# -ge 2 ]] || fail "Missing value for --artifacts-root"
      artifacts_root="$2"
      shift 2
      ;;
    --execution-state)
      [[ $# -ge 2 ]] || fail "Missing value for --execution-state"
      execution_state_path="$2"
      shift 2
      ;;
    --queue-id)
      [[ $# -ge 2 ]] || fail "Missing value for --queue-id"
      queue_id="$2"
      shift 2
      ;;
    --workflow-step-id)
      [[ $# -ge 2 ]] || fail "Missing value for --workflow-step-id"
      workflow_step_id="$2"
      shift 2
      ;;
    --canonical-target-id)
      [[ $# -ge 2 ]] || fail "Missing value for --canonical-target-id"
      canonical_target_id="$2"
      shift 2
      ;;
    --navigation-hint)
      [[ $# -ge 2 ]] || fail "Missing value for --navigation-hint"
      navigation_hint="$2"
      shift 2
      ;;
    --serial)
      [[ $# -ge 2 ]] || fail "Missing value for --serial"
      serial="$2"
      shift 2
      ;;
    --delay)
      [[ $# -ge 2 ]] || fail "Missing value for --delay"
      delay_seconds="$2"
      shift 2
      ;;
    --max-scrolls)
      [[ $# -ge 2 ]] || fail "Missing value for --max-scrolls"
      max_scrolls="$2"
      shift 2
      ;;
    --scroll-delay)
      [[ $# -ge 2 ]] || fail "Missing value for --scroll-delay"
      scroll_delay_seconds="$2"
      shift 2
      ;;
    --scroll-duration-ms)
      [[ $# -ge 2 ]] || fail "Missing value for --scroll-duration-ms"
      scroll_duration_ms="$2"
      shift 2
      ;;
    --post-trigger-delay)
      [[ $# -ge 2 ]] || fail "Missing value for --post-trigger-delay"
      post_trigger_delay_seconds="$2"
      shift 2
      ;;
    --capture-count)
      [[ $# -ge 2 ]] || fail "Missing value for --capture-count"
      capture_count="$2"
      shift 2
      ;;
    --capture-interval)
      [[ $# -ge 2 ]] || fail "Missing value for --capture-interval"
      capture_interval_seconds="$2"
      shift 2
      ;;
    --package)
      [[ $# -ge 2 ]] || fail "Missing value for --package"
      package_name="$2"
      shift 2
      ;;
    --activity)
      [[ $# -ge 2 ]] || fail "Missing value for --activity"
      activity_name="$2"
      shift 2
      ;;
    --wait-activity)
      [[ $# -ge 2 ]] || fail "Missing value for --wait-activity"
      wait_activity="$2"
      shift 2
      ;;
    --expected-top-activity)
      [[ $# -ge 2 ]] || fail "Missing value for --expected-top-activity"
      expected_top_activity="$2"
      shift 2
      ;;
    --wait-timeout)
      [[ $# -ge 2 ]] || fail "Missing value for --wait-timeout"
      wait_timeout_seconds="$2"
      shift 2
      ;;
    --test-screenshot-local-path)
      [[ $# -ge 2 ]] || fail "Missing value for --test-screenshot-local-path"
      test_screenshot_local_path="$2"
      shift 2
      ;;
    --test-screenshot-device-path)
      [[ $# -ge 2 ]] || fail "Missing value for --test-screenshot-device-path"
      test_screenshot_device_path="$2"
      shift 2
      ;;
    --test-screenshot-timeout)
      [[ $# -ge 2 ]] || fail "Missing value for --test-screenshot-timeout"
      test_screenshot_timeout_seconds="$2"
      shift 2
      ;;
    --test-screenshot-stable-seconds)
      [[ $# -ge 2 ]] || fail "Missing value for --test-screenshot-stable-seconds"
      test_screenshot_stable_seconds="$2"
      shift 2
      ;;
    --prefer-test-screenshot)
      prefer_test_screenshot="true"
      shift
      ;;
    --allow-ui-dump-during-test-sync)
      allow_ui_dump_during_test_sync="true"
      shift
      ;;
    --no-ui-dump)
      capture_ui_dump="false"
      shift
      ;;
    --layout-snapshot-path)
      [[ $# -ge 2 ]] || fail "Missing value for --layout-snapshot-path"
      layout_snapshot_path="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unexpected argument: $1"
      ;;
  esac
done

[[ -n "$screen_name" ]] || fail "--screen is required"
[[ -n "$package_name" || -z "$activity_name" ]] || fail "--activity requires --package"
validate_non_negative_number "delay" "$delay_seconds"
validate_non_negative_integer "max scrolls" "$max_scrolls"
validate_non_negative_number "scroll delay" "$scroll_delay_seconds"
validate_non_negative_integer "scroll duration" "$scroll_duration_ms"
validate_non_negative_number "post trigger delay" "$post_trigger_delay_seconds"
validate_non_negative_integer "capture count" "$capture_count"
validate_non_negative_number "capture interval" "$capture_interval_seconds"
validate_non_negative_integer "wait timeout" "$wait_timeout_seconds"
validate_non_negative_integer "test screenshot timeout" "$test_screenshot_timeout_seconds"
validate_non_negative_number "test screenshot stable seconds" "$test_screenshot_stable_seconds"
[[ "$capture_count" -ge 1 ]] || fail "capture count must be at least 1"

if [[ -z "$expected_top_activity" ]]; then
  if [[ -n "$wait_activity" ]]; then
    expected_top_activity="$wait_activity"
  elif [[ -n "$activity_name" ]]; then
    expected_top_activity="$activity_name"
  fi
fi

if [[ -n "$test_screenshot_local_path" || -n "$test_screenshot_device_path" ]]; then
  if [[ "$capture_ui_dump" == "true" && "$allow_ui_dump_during_test_sync" != "true" ]]; then
    capture_ui_dump="false"
    ui_dump_skip_reason="disabled_during_test_screenshot_sync_to_avoid_uiautomation_conflict"
  fi
fi

captured_at_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
artifact_dir="${artifacts_root%/}/$(timestamp_utc)/$(slugify_name "$screen_name")"
[[ "$artifact_dir" != */ ]] || fail "Computed artifact directory is invalid"
mkdir -p "$artifact_dir"
artifact_dir="$(absolute_path "$artifact_dir")"

screenshot_path="$artifact_dir/screenshot.png"
fresh_screenshot_path="$artifact_dir/fresh-screenshot.png"
test_screenshot_path="$artifact_dir/test-screenshot.png"
ui_dump_path="$artifact_dir/ui-dump.xml"
metadata_path="$artifact_dir/metadata.json"
failure_reason="in_progress"

update_execution_state_start() {
  [[ -n "$execution_state_path" ]] || return 0

  local -a helper_args=(
    "$execution_state_helper" runtime-start
    --state "$execution_state_path"
    --queue-id "$queue_id"
    --screen-name "$screen_name"
    --artifact-dir "$artifact_dir"
    --next-step "capture_runtime_evidence:$queue_id"
    --resume-instructions "Resume Android runtime capture from queue item '$queue_id'."
  )

  [[ -n "$workflow_step_id" ]] && helper_args+=(--workflow-step-id "$workflow_step_id")
  [[ -n "$canonical_target_id" ]] && helper_args+=(--canonical-target-id "$canonical_target_id")
  [[ -n "$navigation_hint" ]] && helper_args+=(--navigation-hint "$navigation_hint")

  python3 "${helper_args[@]}" >/dev/null || fail "Failed to update execution_state.json before capture."
}

update_execution_state_finish() {
  [[ -n "$execution_state_path" ]] || return 0

  local queue_status="needs_retry"
  local -a helper_args=()

  if [[ "$capture_status" == "success" || "$capture_status" == "partial" ]]; then
    queue_status="captured"
  fi

  helper_args=(
    "$execution_state_helper" runtime-finish
    --state "$execution_state_path"
    --queue-id "$queue_id"
    --status "$queue_status"
    --artifact-dir "$artifact_dir"
    --last-completed-step "android_layout_capture:$queue_id"
    --next-step "review_runtime_capture:$queue_id"
    --resume-instructions "Review the most recent Android runtime capture result before continuing."
  )

  if [[ -f "$screenshot_path" ]]; then
    helper_args+=(--screenshot-path "$screenshot_path")
  fi
  if [[ -f "$fresh_screenshot_path" ]]; then
    helper_args+=(--screenshot-path "$fresh_screenshot_path")
  fi
  if [[ -f "$test_screenshot_path" ]]; then
    helper_args+=(--screenshot-path "$test_screenshot_path")
  fi
  for path in "${screenshot_paths[@]-}"; do
    [[ -f "$path" ]] && helper_args+=(--screenshot-path "$path")
  done
  for path in "${ui_dump_paths[@]-}"; do
    [[ -f "$path" ]] && helper_args+=(--ui-dump-path "$path")
  done
  if [[ "${#ui_dump_paths[@]}" -eq 0 && "$ui_dump_captured" == "true" && -f "$ui_dump_path" ]]; then
    helper_args+=(--ui-dump-path "$ui_dump_path")
  fi
  if [[ -n "$layout_snapshot_path" ]]; then
    helper_args+=(--layout-snapshot-path "$layout_snapshot_path")
  fi
  if [[ -n "$failure_reason" ]]; then
    helper_args+=(--failure-reason "$failure_reason")
  fi

  python3 "${helper_args[@]}" >/dev/null || echo "Warning: failed to update execution_state.json after capture." >&2
}

if [[ -n "$execution_state_path" ]]; then
  execution_state_path="$(absolute_path "$execution_state_path")"
  [[ -f "$execution_state_path" ]] || fail "execution_state.json not found: $execution_state_path"
  [[ -f "$execution_state_helper" ]] || fail "Execution-state helper not found: $execution_state_helper"
  queue_id="${queue_id:-$(slugify_name "${workflow_step_id:-${canonical_target_id:-$screen_name}}")}"
  update_execution_state_start
fi

serial="$(resolve_serial "$serial")"
display_size="$(best_effort_device_display_size "$serial")"
display_density="$(device_display_density "$serial")"
font_scale="$(device_font_scale "$serial")"
device_locale="$(device_locale "$serial")"
night_mode="$(device_night_mode "$serial")"
device_model="$(device_model "$serial")"

if [[ -n "$package_name" ]] && ! package_is_installed "$serial" "$package_name"; then
  fail "Package '$package_name' is not installed on device '$serial'."
fi

if [[ -n "$activity_name" ]]; then
  launched_component="$(launch_activity "$serial" "$package_name" "$activity_name")"
fi

if [[ -n "$wait_activity" ]]; then
  top_activity="$(wait_for_activity "$serial" "$wait_activity" "$wait_timeout_seconds")"
else
  top_activity="$(current_focus_component "$serial")"
fi

prepare_test_screenshot
sleep_if_positive "$post_trigger_delay_seconds"

if capture_fresh_screenshots; then
  :
else
  if [[ -f "$test_screenshot_path" ]]; then
    mark_partial_if_clean "${fresh_capture_failure_reason:-fresh_capture_failed}"
  else
    failure_reason="${fresh_capture_failure_reason:-fresh_capture_failed}"
    fail "Fresh screenshot capture failed: ${fresh_capture_failure_reason:-fresh_capture_failed}."
  fi
fi

select_canonical_screenshot

if [[ "$capture_ui_dump" == "true" ]]; then
  if "$script_dir/capture_ui_dump.sh" "$ui_dump_path" --serial "$serial" >/dev/null; then
    ui_dump_captured="true"
  else
    ui_dump_captured="false"
    if [[ "$capture_status" != "partial" ]]; then
      capture_status="partial"
      failure_reason="ui_dump_failed"
    fi
    rm -f "$ui_dump_path"
  fi
fi

if [[ "$fresh_capture_status" == "captured" && -f "$fresh_screenshot_path" ]]; then
  screenshot_paths+=("$fresh_screenshot_path")
elif [[ -f "$screenshot_path" ]]; then
  screenshot_paths+=("$screenshot_path")
fi

if [[ "$ui_dump_captured" == "true" && -f "$ui_dump_path" ]]; then
  ui_dump_paths+=("$(absolute_path "$ui_dump_path")")
fi

capture_scroll_sequence

if [[ -n "$layout_snapshot_path" ]]; then
  if [[ -f "$layout_snapshot_path" ]]; then
    layout_snapshot_path="$(absolute_path "$layout_snapshot_path")"
  else
    if [[ "$capture_status" != "partial" ]]; then
      capture_status="partial"
      failure_reason="layout_snapshot_path_missing"
    fi
    layout_snapshot_path=""
  fi
fi

if [[ -z "$top_activity" ]]; then
  top_activity="$(current_focus_component "$serial")"
fi

if [[ "$capture_status" != "partial" ]]; then
  capture_status="success"
  failure_reason=""
fi
