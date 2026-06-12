#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$script_dir/common.sh"

usage() {
  cat <<'EOF'
Usage:
  capture_ui_dump.sh <output.xml> [--serial <device-serial>]

Notes:
  - Dumps the current screen hierarchy via uiautomator.
  - If --serial is omitted, ANDROID_SERIAL is used when set.
  - If neither is set, the script requires exactly one connected device.
EOF
}

serial="${ANDROID_SERIAL:-}"
output=""
remote_path="/sdcard/window_dump.xml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --serial)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --serial" >&2
        exit 1
      fi
      serial="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -n "$output" ]]; then
        echo "Unexpected argument: $1" >&2
        usage >&2
        exit 1
      fi
      output="$1"
      shift
      ;;
  esac
done

if [[ -z "$output" ]]; then
  usage >&2
  exit 1
fi

require_adb
serial="$(resolve_serial "$serial")"
mkdir -p "$(dirname "$output")"

adb_with_serial "$serial" shell uiautomator dump "$remote_path" >/dev/null
adb_with_serial "$serial" exec-out cat "$remote_path" > "$output"

if ! grep -q "<hierarchy" "$output"; then
  fail "UI hierarchy dump was captured but does not look like valid XML"
fi

adb_with_serial "$serial" shell rm -f "$remote_path" >/dev/null 2>&1 || true

abs_dir="$(cd "$(dirname "$output")" && pwd)"
echo "$abs_dir/$(basename "$output")"
