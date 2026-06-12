#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$script_dir/common.sh"

usage() {
  cat <<'EOF'
Usage:
  run_instrumentation_test.sh --serial <serial> --app-apk <path> --test-apk <path> \
    --app-package <package> --test-package <package> --runner <runner-class> \
    --class <fully.qualified.Test#method> [options]

Options:
  --serial <serial>            Target device serial. Falls back to ANDROID_SERIAL when omitted.
  --app-apk <path>             Application APK to install when the app package is missing.
  --test-apk <path>            androidTest APK to install when the test package is missing.
  --app-package <package>      Installed application package name.
  --test-package <package>     Installed androidTest package name.
  --runner <runner-class>      Instrumentation runner class name.
  --class <test#method>        Instrumentation class or test method selector.
  --force-reinstall            Reinstall the APKs even when the packages are already present.
  --no-install                 Fail instead of installing missing APKs.
  -h, --help                   Show this help.

Notes:
  This helper exists for emulator workflows where repeatedly invoking Gradle or UTP for
  each runtime capture is too slow. It reuses installed packages and falls back to a
  push + pm install path when installation is needed.
EOF
}

serial="${ANDROID_SERIAL:-}"
app_apk=""
test_apk=""
app_package=""
test_package=""
runner=""
test_class=""
force_reinstall="false"
allow_install="true"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --serial)
      serial="$2"
      shift 2
      ;;
    --app-apk)
      app_apk="$2"
      shift 2
      ;;
    --test-apk)
      test_apk="$2"
      shift 2
      ;;
    --app-package)
      app_package="$2"
      shift 2
      ;;
    --test-package)
      test_package="$2"
      shift 2
      ;;
    --runner)
      runner="$2"
      shift 2
      ;;
    --class)
      test_class="$2"
      shift 2
      ;;
    --force-reinstall)
      force_reinstall="true"
      shift
      ;;
    --no-install)
      allow_install="false"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

[[ -n "$app_package" ]] || fail "--app-package is required"
[[ -n "$test_package" ]] || fail "--test-package is required"
[[ -n "$runner" ]] || fail "--runner is required"
[[ -n "$test_class" ]] || fail "--class is required"

serial="$(resolve_serial "$serial")"

install_apk_via_tmp() {
  local apk_path="$1"
  local install_args="$2"
  local remote_path="/data/local/tmp/$(basename "$apk_path")"

  [[ -f "$apk_path" ]] || fail "APK not found: $apk_path"
  adb_with_serial "$serial" push "$apk_path" "$remote_path" >/dev/null
  adb_with_serial "$serial" shell pm install $install_args "$remote_path" >/dev/null
}

ensure_installed() {
  local package_name="$1"
  local apk_path="$2"
  local install_args="$3"

  if [[ "$force_reinstall" != "true" ]] && package_is_installed "$serial" "$package_name"; then
    return 0
  fi

  [[ "$allow_install" == "true" ]] || fail "Package '$package_name' is missing and --no-install was set."
  install_apk_via_tmp "$apk_path" "$install_args"
  package_is_installed "$serial" "$package_name" || fail "Package '$package_name' did not register after install."
}

ensure_installed "$app_package" "$app_apk" "-r"
ensure_installed "$test_package" "$test_apk" "-r -t"

adb_with_serial "$serial" shell am instrument -w -r -e class "$test_class" "$test_package/$runner"
