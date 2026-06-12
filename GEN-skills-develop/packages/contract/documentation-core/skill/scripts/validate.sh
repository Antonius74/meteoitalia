#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILURES=0

required_paths=(
  "SKILL.md"
  "templates/architecture/repo.template.md"
  "templates/design/local.template.md"
  "templates/design/repo.template.md"
  "templates/plan/execution-plan.template.md"
  "templates/plan/plan.template.md"
  "templates/readme/local.template.md"
  "templates/readme/repo.template.md"
  "templates/workflow/local-workflow.template.md"
  "templates/workflow/repo-workflow.template.md"
)

for rel in "${required_paths[@]}"; do
  if [ ! -f "$ROOT/$rel" ]; then
    echo "MISSING: $rel"
    FAILURES=$((FAILURES + 1))
  fi
done

for rel in schemas standards partials adapters package.toml; do
  if [ -e "$ROOT/$rel" ]; then
    echo "FORBIDDEN PATH: $rel"
    FAILURES=$((FAILURES + 1))
  fi
done

while IFS= read -r file; do
  rel="${file#$ROOT/}"

  if ! grep -q '<!-- template-id:' "$file"; then
    echo "MISSING TEMPLATE ID: $rel"
    FAILURES=$((FAILURES + 1))
  fi

  if grep -q 'template-schema\|\.\./\.\./schemas\|\.\./\.\./standards\|\.\./\.\./partials' "$file"; then
    echo "FORBIDDEN TEMPLATE REFERENCE: $rel"
    FAILURES=$((FAILURES + 1))
  fi
done < <(find "$ROOT/templates" -type f -name '*.template.md' | sort)

if [ "$FAILURES" -gt 0 ]; then
  echo "Validation failed with $FAILURES issue(s)."
  exit 1
fi

echo "Validation passed."
