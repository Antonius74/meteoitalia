#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILURES=0

required_paths=(
  "manifest.yaml"
  "README.md"
  "references"
  "schemas"
  "templates"
  "examples"
)

for rel in "${required_paths[@]}"; do
  if [ ! -e "$ROOT/$rel" ]; then
    echo "MISSING: $rel"
    FAILURES=$((FAILURES + 1))
  fi
done

while IFS= read -r rel; do
  [ -z "$rel" ] && continue
  if [ ! -e "$ROOT/$rel" ]; then
    echo "MANIFEST BROKEN PATH: $rel"
    FAILURES=$((FAILURES + 1))
  fi
done < <(sed -n 's/^ *path: //p' "$ROOT/manifest.yaml" | tr -d '"')

while IFS= read -r rel; do
  [ -z "$rel" ] && continue
  if ! grep -q "path: $rel" "$ROOT/manifest.yaml"; then
    echo "MANIFEST MISSING SCHEMA: $rel"
    FAILURES=$((FAILURES + 1))
  fi
done < <(find "$ROOT/schemas" -maxdepth 1 -type f -name '*.schema.json' -print | sed "s#^$ROOT/##" | sort)

if ! python3 - "$ROOT" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
failures = 0

for schema_path in sorted((root / "schemas").glob("*.schema.json")):
    try:
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"INVALID SCHEMA JSON: {schema_path.relative_to(root)}: {exc}")
        failures += 1
        continue

    if not schema.get("$schema"):
        print(f"SCHEMA MISSING $schema: {schema_path.relative_to(root)}")
        failures += 1
    schema_kind = schema.get("schema_kind")
    if schema_kind not in {"workflow-template-contract", "workflow-artifact-contract"}:
        print(f"SCHEMA MISSING CONTRACT KIND: {schema_path.relative_to(root)}")
        failures += 1

    template_path = schema.get("template_path")
    if isinstance(template_path, str):
        template_file = root / template_path
        if not template_file.exists():
            print(f"SCHEMA BROKEN TEMPLATE PATH: {schema_path.relative_to(root)} -> {template_path}")
            failures += 1
            continue
        template_text = template_file.read_text(encoding="utf-8")
    else:
        template_text = ""

    if schema_kind == "workflow-artifact-contract":
        for section in schema.get("required_markdown_sections", []):
            if section not in template_text:
                print(
                    "ARTIFACT SCHEMA SECTION MISSING: "
                    f"{schema_path.relative_to(root)} requires {section!r} in {template_path}"
                )
                failures += 1
        for token in schema.get("required_tokens", []):
            if token not in template_text:
                print(
                    "ARTIFACT SCHEMA TOKEN MISSING: "
                    f"{schema_path.relative_to(root)} requires {token!r} in {template_path}"
                )
                failures += 1

if failures:
    sys.exit(1)
PY
then
  FAILURES=$((FAILURES + 1))
fi

for variant in shared backend frontend mobile-android mobile-ios; do
  if [ ! -d "$ROOT/templates/skills/$variant" ]; then
    echo "MISSING SKILL VARIANT DIR: templates/skills/$variant"
    FAILURES=$((FAILURES + 1))
  fi
done

if [ ! -d "$ROOT/templates/agents/shared" ]; then
  echo "MISSING AGENT TEMPLATE DIR: templates/agents/shared"
  FAILURES=$((FAILURES + 1))
fi

shared_core_templates=(
  "planning.template.md"
  "architecture.template.md"
  "development.template.md"
  "test-design.template.md"
  "orchestration.template.md"
)

shared_validation_templates=(
  "unit-testing.template.md"
  "automation-test-writing.template.md"
  "automation-test-running.template.md"
)

agent_role_templates=(
  "planner.template.toml"
  "architect.template.toml"
  "developer.template.toml"
  "test-designer.template.toml"
  "unit-tester.template.toml"
  "automation-test-writer.template.toml"
  "automation-test-runner.template.toml"
)

for rel in "${shared_core_templates[@]}"; do
  if [ ! -f "$ROOT/templates/skills/shared/$rel" ]; then
    echo "MISSING SHARED CORE TEMPLATE: templates/skills/shared/$rel"
    FAILURES=$((FAILURES + 1))
  fi
done

for rel in "${shared_validation_templates[@]}"; do
  path="$ROOT/templates/skills/shared/$rel"
  if [ ! -f "$path" ]; then
    echo "MISSING SHARED VALIDATION TEMPLATE: templates/skills/shared/$rel"
    FAILURES=$((FAILURES + 1))
    continue
  fi
  for token in "[PROGRESS]" "[DONE]"; do
    if ! grep -Fq "$token" "$path"; then
      echo "VALIDATION TEMPLATE MISSING PROGRESS TOKEN: templates/skills/shared/$rel requires $token"
      FAILURES=$((FAILURES + 1))
    fi
  done
done

for variant in backend frontend mobile-android mobile-ios; do
  count=$(find "$ROOT/templates/skills/$variant" -type f -name '*.template.md' | wc -l | tr -d ' ')
  min_count=${#shared_core_templates[@]}
  if [ "$count" -lt "$min_count" ]; then
    echo "INSUFFICIENT VARIANT TEMPLATES: $variant has $count"
    FAILURES=$((FAILURES + 1))
  fi
  for rel in "${shared_core_templates[@]}"; do
    if [ ! -f "$ROOT/templates/skills/$variant/$rel" ]; then
      echo "MISSING VARIANT CORE TEMPLATE: templates/skills/$variant/$rel"
      FAILURES=$((FAILURES + 1))
    fi
  done
done

for rel in "${agent_role_templates[@]}"; do
  path="$ROOT/templates/agents/shared/$rel"
  if [ ! -f "$path" ]; then
    echo "MISSING SHARED AGENT TEMPLATE: templates/agents/shared/$rel"
    FAILURES=$((FAILURES + 1))
    continue
  fi
  for token in "[PROGRESS]" "[DONE]"; do
    if ! grep -Fq "$token" "$path"; then
      echo "SHARED AGENT TEMPLATE MISSING PROGRESS TOKEN: templates/agents/shared/$rel requires $token"
      FAILURES=$((FAILURES + 1))
    fi
  done
done

for variant in backend frontend mobile-android mobile-ios; do
  if [ ! -d "$ROOT/templates/agents/$variant" ]; then
    echo "MISSING AGENT VARIANT DIR: templates/agents/$variant"
    FAILURES=$((FAILURES + 1))
    continue
  fi
  for rel in "${agent_role_templates[@]}"; do
    if [ ! -f "$ROOT/templates/agents/$variant/$rel" ]; then
      echo "MISSING VARIANT AGENT TEMPLATE: templates/agents/$variant/$rel"
      FAILURES=$((FAILURES + 1))
    fi
  done
done

if [ "$FAILURES" -gt 0 ]; then
  echo "Validation failed with $FAILURES issue(s)."
  exit 1
fi

echo "Validation passed."
