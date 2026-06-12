#!/usr/bin/env bash

fail() {
  echo "$*" >&2
  exit 1
}

require_command() {
  local command_name="$1"
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is not installed or not available in PATH"
}

require_adb() {
  require_command adb
}

collect_adb_devices() {
  adb devices | awk 'NR > 1 && $1 != "" { print $1 "\t" $2 }'
}

resolve_serial() {
  local requested="${1:-${ANDROID_SERIAL:-}}"
  local -a lines=()
  local -a authorized=()
  local -a unauthorized=()
  local -a offline=()
  local found_state=""
  local line=""
  local serial=""
  local state=""

  require_adb
  while IFS= read -r line; do
    lines+=("$line")
  done < <(collect_adb_devices)

  for line in "${lines[@]}"; do
    IFS=$'\t' read -r serial state <<<"$line"
    case "$state" in
      device) authorized+=("$serial") ;;
      unauthorized) unauthorized+=("$serial") ;;
      offline) offline+=("$serial") ;;
    esac
  done

  if [[ -n "$requested" ]]; then
    for line in "${lines[@]}"; do
      IFS=$'\t' read -r serial state <<<"$line"
      if [[ "$serial" == "$requested" ]]; then
        found_state="$state"
        break
      fi
    done

    case "$found_state" in
      device)
        echo "$requested"
        return 0
        ;;
      unauthorized)
        fail "Device '$requested' is connected but unauthorized. Unlock it and accept the RSA prompt."
        ;;
      offline)
        fail "Device '$requested' is connected but offline."
        ;;
      "")
        fail "Device '$requested' is not listed by adb devices."
        ;;
      *)
        fail "Device '$requested' is present but not ready (state: $found_state)."
        ;;
    esac
  fi

  if [[ "${#authorized[@]}" -eq 1 ]]; then
    echo "${authorized[0]}"
    return 0
  fi

  if [[ "${#authorized[@]}" -gt 1 ]]; then
    {
      echo "Multiple authorized devices detected. Use --serial or set ANDROID_SERIAL."
      printf '  %s\n' "${authorized[@]}"
    } >&2
    exit 1
  fi

  if [[ "${#unauthorized[@]}" -gt 0 ]]; then
    {
      echo "No authorized Android devices found. Unauthorized devices:"
      printf '  %s\n' "${unauthorized[@]}"
    } >&2
    exit 1
  fi

  if [[ "${#offline[@]}" -gt 0 ]]; then
    {
      echo "No ready Android devices found. Offline devices:"
      printf '  %s\n' "${offline[@]}"
    } >&2
    exit 1
  fi

  fail "No Android devices found."
}

adb_with_serial() {
  local serial="$1"
  shift
  adb -s "$serial" "$@"
}

validate_non_negative_number() {
  local label="$1"
  local value="$2"
  [[ "$value" =~ ^[0-9]+([.][0-9]+)?$ ]] || fail "$label must be a non-negative number"
}

validate_non_negative_integer() {
  local label="$1"
  local value="$2"
  [[ "$value" =~ ^[0-9]+$ ]] || fail "$label must be a non-negative integer"
}

sleep_if_positive() {
  local delay="$1"
  validate_non_negative_number "sleep delay" "$delay"
  if [[ "$delay" == "0" || "$delay" == "0.0" || "$delay" == "0.00" ]]; then
    return 0
  fi
  sleep "$delay"
}

file_size_bytes() {
  local path="$1"
  if stat -f%z "$path" >/dev/null 2>&1; then
    stat -f%z "$path"
  else
    stat -c %s "$path"
  fi
}

wait_for_local_file_stable() {
  local path="$1"
  local timeout_seconds="$2"
  local stable_seconds="$3"
  local elapsed=0
  local first_size=""
  local second_size=""

  validate_non_negative_integer "wait timeout" "$timeout_seconds"
  validate_non_negative_number "stable seconds" "$stable_seconds"

  while (( elapsed <= timeout_seconds )); do
    if [[ -s "$path" ]]; then
      if [[ "$stable_seconds" == "0" || "$stable_seconds" == "0.0" || "$stable_seconds" == "0.00" ]]; then
        return 0
      fi

      first_size="$(file_size_bytes "$path")"
      sleep_if_positive "$stable_seconds"
      if [[ -s "$path" ]]; then
        second_size="$(file_size_bytes "$path")"
        if [[ "$first_size" == "$second_size" ]]; then
          return 0
        fi
      fi
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  fail "Timed out waiting for local file '$path'."
}

timestamp_utc() {
  date -u +"%Y%m%dT%H%M%SZ"
}

absolute_path() {
  local target="$1"
  if [[ -d "$target" ]]; then
    (cd "$target" && pwd)
  else
    local target_dir
    target_dir="$(cd "$(dirname "$target")" && pwd)"
    echo "$target_dir/$(basename "$target")"
  fi
}

slugify_name() {
  local input="$1"
  printf '%s' "$input" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g'
}

package_is_installed() {
  local serial="$1"
  local package_name="$2"
  adb_with_serial "$serial" shell pm list packages "$package_name" \
    | tr -d '\r' \
    | grep -Fx "package:$package_name" >/dev/null
}

launch_activity() {
  local serial="$1"
  local package_name="$2"
  local activity_name="$3"
  local component="$package_name/$activity_name"

  adb_with_serial "$serial" shell am start -W -n "$component" >/dev/null
  echo "$component"
}

current_focus_component() {
  local serial="$1"
  local output=""
  local component=""

  output="$(adb_with_serial "$serial" shell dumpsys window windows 2>/dev/null | tr -d '\r' || true)"
  component="$(printf '%s\n' "$output" | sed -n -E 's/.*mCurrentFocus=.* ([^ ]+\/[^ }]+).*/\1/p' | head -n 1)"

  if [[ -z "$component" ]]; then
    component="$(printf '%s\n' "$output" | sed -n -E 's/.*mFocusedApp=.* ([^ ]+\/[^ }]+).*/\1/p' | head -n 1)"
  fi

  printf '%s' "$component"
}

wait_for_activity() {
  local serial="$1"
  local expected="$2"
  local timeout_seconds="$3"
  local current=""
  local elapsed=0

  validate_non_negative_integer "wait timeout" "$timeout_seconds"

  while (( elapsed <= timeout_seconds )); do
    current="$(current_focus_component "$serial")"
    if [[ -n "$current" && "$current" == *"$expected"* ]]; then
      printf '%s' "$current"
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done

  fail "Timed out waiting for foreground activity matching '$expected'."
}

file_sha256() {
  local path="$1"
  python3 - "$path" <<'PY'
import hashlib
import sys

digest = hashlib.sha256()
with open(sys.argv[1], "rb") as handle:
    for chunk in iter(lambda: handle.read(65536), b""):
        digest.update(chunk)
print(digest.hexdigest())
PY
}

device_display_size() {
  local serial="$1"
  local output=""
  local size=""

  output="$(adb_with_serial "$serial" shell wm size 2>/dev/null | tr -d '\r' || true)"
  size="$(printf '%s\n' "$output" | sed -n -E 's/.*Physical size: *([0-9]+x[0-9]+).*/\1/p' | head -n 1)"

  if [[ -z "$size" ]]; then
    size="$(printf '%s\n' "$output" | sed -n -E 's/.*Override size: *([0-9]+x[0-9]+).*/\1/p' | head -n 1)"
  fi

  [[ -n "$size" ]] || fail "Unable to determine device display size."
  printf '%s' "$size"
}

best_effort_device_display_size() {
  local serial="$1"
  local output=""
  local size=""

  output="$(adb_with_serial "$serial" shell wm size 2>/dev/null | tr -d '\r' || true)"
  size="$(printf '%s\n' "$output" | sed -n -E 's/.*Physical size: *([0-9]+x[0-9]+).*/\1/p' | head -n 1)"

  if [[ -z "$size" ]]; then
    size="$(printf '%s\n' "$output" | sed -n -E 's/.*Override size: *([0-9]+x[0-9]+).*/\1/p' | head -n 1)"
  fi

  printf '%s' "$size"
}

device_display_density() {
  local serial="$1"
  local output=""
  local density=""

  output="$(adb_with_serial "$serial" shell wm density 2>/dev/null | tr -d '\r' || true)"
  density="$(printf '%s\n' "$output" | sed -n -E 's/.*Physical density: *([0-9]+).*/\1/p' | head -n 1)"

  if [[ -z "$density" ]]; then
    density="$(printf '%s\n' "$output" | sed -n -E 's/.*Override density: *([0-9]+).*/\1/p' | head -n 1)"
  fi

  if [[ -z "$density" ]]; then
    density="$(adb_with_serial "$serial" shell getprop ro.sf.lcd_density 2>/dev/null | tr -d '\r' || true)"
  fi

  printf '%s' "$density"
}

device_font_scale() {
  local serial="$1"
  local font_scale=""

  font_scale="$(adb_with_serial "$serial" shell settings get system font_scale 2>/dev/null | tr -d '\r' || true)"
  if [[ -z "$font_scale" || "$font_scale" == "null" ]]; then
    font_scale="1.0"
  fi

  printf '%s' "$font_scale"
}

device_locale() {
  local serial="$1"
  local locale=""

  locale="$(adb_with_serial "$serial" shell getprop persist.sys.locale 2>/dev/null | tr -d '\r' || true)"
  if [[ -z "$locale" ]]; then
    locale="$(adb_with_serial "$serial" shell getprop ro.product.locale 2>/dev/null | tr -d '\r' || true)"
  fi

  printf '%s' "$locale"
}

device_model() {
  local serial="$1"
  local model=""

  model="$(adb_with_serial "$serial" shell getprop ro.product.model 2>/dev/null | tr -d '\r' || true)"
  printf '%s' "$model"
}

device_night_mode() {
  local serial="$1"
  local output=""

  output="$(adb_with_serial "$serial" shell dumpsys uimode 2>/dev/null | tr -d '\r' || true)"

  if printf '%s\n' "$output" | grep -q 'mNightMode=2'; then
    printf 'yes'
    return 0
  fi

  if printf '%s\n' "$output" | grep -q 'mNightMode=1'; then
    printf 'no'
    return 0
  fi

  if printf '%s\n' "$output" | grep -q 'mNightMode=0'; then
    printf 'auto'
    return 0
  fi

  printf 'unknown'
}

perform_vertical_swipe() {
  local serial="$1"
  local duration_ms="$2"
  local size=""
  local width=""
  local height=""
  local x=""
  local start_y=""
  local end_y=""

  validate_non_negative_integer "scroll duration" "$duration_ms"
  size="$(device_display_size "$serial")"
  IFS='x' read -r width height <<<"$size"

  [[ -n "$width" && -n "$height" ]] || fail "Unable to parse device display size '$size'."

  x=$((width / 2))
  start_y=$(((height * 80) / 100))
  end_y=$(((height * 25) / 100))

  adb_with_serial "$serial" shell input swipe "$x" "$start_y" "$x" "$end_y" "$duration_ms" >/dev/null
}

perform_vertical_swipe_in_bounds() {
  local serial="$1"
  local duration_ms="$2"
  local left="$3"
  local top="$4"
  local right="$5"
  local bottom="$6"
  local width=""
  local height=""
  local x=""
  local vertical_margin=""
  local start_y=""
  local end_y=""

  validate_non_negative_integer "scroll duration" "$duration_ms"
  validate_non_negative_integer "scrollable left" "$left"
  validate_non_negative_integer "scrollable top" "$top"
  validate_non_negative_integer "scrollable right" "$right"
  validate_non_negative_integer "scrollable bottom" "$bottom"

  width=$((right - left))
  height=$((bottom - top))
  if (( width <= 0 || height <= 0 )); then
    perform_vertical_swipe "$serial" "$duration_ms"
    return 0
  fi

  x=$((left + (width / 2)))
  vertical_margin=$((height / 10))
  if (( vertical_margin < 40 )); then
    vertical_margin=40
  fi
  if (( vertical_margin * 2 >= height )); then
    vertical_margin=$((height / 4))
  fi
  if (( vertical_margin <= 0 )); then
    perform_vertical_swipe "$serial" "$duration_ms"
    return 0
  fi

  start_y=$((bottom - vertical_margin))
  end_y=$((top + vertical_margin))
  if (( end_y >= start_y )); then
    perform_vertical_swipe "$serial" "$duration_ms"
    return 0
  fi

  adb_with_serial "$serial" shell input swipe "$x" "$start_y" "$x" "$end_y" "$duration_ms" >/dev/null
}

detect_primary_scrollable_node() {
  local ui_dump_path="$1"
  [[ -f "$ui_dump_path" ]] || return 0

  python3 - "$ui_dump_path" <<'PY'
import re
import sys
import xml.etree.ElementTree as ET

path = sys.argv[1]
preferred_classes = [
    "RecyclerView",
    "NestedScrollView",
    "ScrollView",
    "ListView",
    "WebView",
]
bounds_re = re.compile(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")

try:
    root = ET.parse(path).getroot()
except Exception:
    sys.exit(0)

candidates = []
for node in root.iter("node"):
    if node.attrib.get("scrollable") != "true":
        continue
    bounds = node.attrib.get("bounds", "")
    match = bounds_re.fullmatch(bounds)
    if not match:
        continue
    left, top, right, bottom = map(int, match.groups())
    width = max(0, right - left)
    height = max(0, bottom - top)
    area = width * height
    if area == 0:
        continue
    class_name = node.attrib.get("class", "")
    resource_id = node.attrib.get("resource-id", "")
    content_desc = node.attrib.get("content-desc", "")
    priority = 0
    lower_class = class_name.lower()
    for index, token in enumerate(preferred_classes):
        if token.lower() in lower_class:
            priority = 100 - (index * 10)
            break
    if height >= width:
        priority += 15
    candidates.append(
        (
            priority,
            area,
            height,
            width,
            bounds,
            str(left),
            str(top),
            str(right),
            str(bottom),
            class_name,
            resource_id,
            content_desc,
        )
    )

if not candidates:
    sys.exit(0)

candidates.sort(reverse=True)
best = candidates[0]
print("\t".join(best[4:]))
PY
}

write_json_file() {
  local output_path="$1"
  shift
  python3 - "$output_path" "$@" <<'PY'
import json
import sys

path = sys.argv[1]
data = {}

for item in sys.argv[2:]:
    key, value = item.split("=", 1)
    if value == "__BOOL_TRUE__":
        parsed = True
    elif value == "__BOOL_FALSE__":
        parsed = False
    elif value == "__NULL__":
        parsed = None
    elif value.startswith("__JSON__"):
        parsed = json.loads(value[len("__JSON__"):])
    else:
        parsed = value
    data[key] = parsed

with open(path, "w", encoding="utf-8") as handle:
    json.dump(data, handle, indent=2, sort_keys=True)
    handle.write("\n")
PY
}
