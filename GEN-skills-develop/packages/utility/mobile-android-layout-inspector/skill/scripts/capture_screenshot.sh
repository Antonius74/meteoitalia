#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$script_dir/common.sh"

usage() {
  cat <<'EOF'
Usage:
  capture_screenshot.sh <output.png> [--serial <device-serial>] [--delay <seconds>]

Notes:
  - The script waits 2 seconds before capture by default to let the app render.
  - If --serial is omitted, ANDROID_SERIAL is used when set.
  - If neither is set, the script requires exactly one connected device.
EOF
}

serial="${ANDROID_SERIAL:-}"
output=""
delay="2"

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
    --delay)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --delay" >&2
        exit 1
      fi
      delay="$2"
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
validate_non_negative_number "delay" "$delay"
serial="$(resolve_serial "$serial")"
mkdir -p "$(dirname "$output")"

sleep "$delay"
adb_with_serial "$serial" exec-out screencap -p > "$output"

if [[ ! -s "$output" ]]; then
  fail "Screenshot capture failed or produced an empty file"
fi

abs_dir="$(cd "$(dirname "$output")" && pwd)"
echo "$abs_dir/$(basename "$output")"
