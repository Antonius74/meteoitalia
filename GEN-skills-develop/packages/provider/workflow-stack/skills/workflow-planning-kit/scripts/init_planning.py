#!/usr/bin/env python3
"""
init_planning.py — scaffold an empty requirements.md from template.

Usage:
    # Preferred — let the script derive the output path from the run directory:
    python init_planning.py --workflow-dir .workflows/JIRA-123 --issues PROJ-101 PROJ-102

    # Explicit full path (backward-compatible):
    python init_planning.py --output .workflows/JIRA-123/requirements.md --issues PROJ-101
"""
import argparse
from datetime import datetime
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
SHARED_TEMPLATE_RELATIVE = Path("templates/skills/shared/requirements-template.md")

OUTPUT_FILENAME = "requirements.md"


def assert_can_write(output: Path, force: bool) -> None:
    if not output.exists():
        return
    if output.is_file() and output.stat().st_size == 0:
        return
    if force:
        return
    raise SystemExit(
        f"Refusing to overwrite existing non-empty file: {output}\n"
        "Use --force to regenerate it."
    )


def workflow_core_root() -> Path:
    candidate = SKILL_DIR.parent / "workflow-core-kit"
    if candidate.exists():
        return candidate
    raise FileNotFoundError(
        "Unable to locate workflow-core-kit next to this workflow-stack skill. "
        f"Expected: {candidate}"
    )


def resolve_template() -> Path:
    candidate = workflow_core_root() / SHARED_TEMPLATE_RELATIVE
    if candidate.exists():
        return candidate
    raise FileNotFoundError(
        "Unable to locate the shared requirements template. Checked:\n"
        f"- {candidate}"
    )


def build_issue_table(keys: list[str]) -> str:
    rows = ["| Key | Title | Status |", "|-----|-------|--------|"]
    for k in keys:
        rows.append(f"| {k} | _to be fetched_ | _open_ |")
    return "\n".join(rows)


def scaffold(output: Path, issues: list[str], *, force: bool = False) -> None:
    assert_can_write(output, force)
    template_path = resolve_template()
    template = template_path.read_text(encoding="utf-8")
    content = (
        template
        .replace("{{DATE}}", datetime.now().strftime("%Y-%m-%d"))
        .replace("{{ISSUE_TABLE}}", build_issue_table(issues))
        .replace("{{ISSUE_KEYS}}", ", ".join(issues))
        .replace("{{REQ_COUNT}}", "0")
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")
    print(f"Scaffolded {output}")
    print(f"    Issues   : {', '.join(issues)}")
    print(f"    Template : {template_path}")
    print("\nNext step: fill in requirements by running the Planner agent.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scaffold requirements.md")

    # --workflow-dir is the preferred way; --output allows an explicit full path
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--workflow-dir", type=Path,
                       help="Run-specific workflow directory (e.g. .workflows/JIRA-123). "
                            f"Output will be <workflow-dir>/{OUTPUT_FILENAME}")
    group.add_argument("--output", type=Path,
                       help="Explicit output file path (overrides --workflow-dir). "
                            f"Default: .workflows/{OUTPUT_FILENAME}")

    parser.add_argument("--issues", nargs="+", required=True,
                        metavar="KEY", help="Jira issue keys (e.g. PROJ-101)")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite an existing non-empty requirements.md file.")
    args = parser.parse_args()

    if args.workflow_dir:
        output_path = args.workflow_dir / OUTPUT_FILENAME
    elif args.output:
        output_path = args.output
    else:
        output_path = Path(f".workflows/{OUTPUT_FILENAME}")

    scaffold(output_path, args.issues, force=args.force)
