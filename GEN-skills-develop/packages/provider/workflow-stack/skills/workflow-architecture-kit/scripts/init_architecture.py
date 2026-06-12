#!/usr/bin/env python3
"""
init_architecture.py — scaffold implementation-plan.md pre-populated
with requirement IDs extracted from requirements.md. Backend architecture runs
can also scaffold api-contract.md for frontend/mobile handoff.

Usage:
    # Preferred — let the script derive all paths from the run directory:
    python init_architecture.py --workflow-dir .workflows/JIRA-123

    # Explicit paths (backward-compatible):
    python init_architecture.py \
        --requirements .workflows/JIRA-123/requirements.md \
        --output .workflows/JIRA-123/implementation-plan.md

    # Backend architecture handoff:
    python init_architecture.py \
        --workflow-dir .workflows/JIRA-123 \
        --include-api-contract
"""
import argparse
import re
from datetime import datetime
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
SHARED_IMPLEMENTATION_TEMPLATE_RELATIVE = Path("templates/skills/shared/implementation-plan-template.md")
SHARED_API_CONTRACT_TEMPLATE_RELATIVE = Path("templates/skills/shared/api-contract-template.md")

REQ_FILENAME = "requirements.md"
OUT_FILENAME = "implementation-plan.md"
API_CONTRACT_FILENAME = "api-contract.md"
DEFAULT_WF = Path(".workflows")


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


def resolve_shared_template(template_relative: Path, description: str) -> Path:
    candidate = workflow_core_root() / template_relative
    if candidate.exists():
        return candidate
    raise FileNotFoundError(
        f"Unable to locate the shared {description} template. Checked:\n"
        f"- {candidate}"
    )


def resolve_template() -> Path:
    return resolve_shared_template(SHARED_IMPLEMENTATION_TEMPLATE_RELATIVE, "implementation-plan")


def resolve_api_contract_template() -> Path:
    return resolve_shared_template(SHARED_API_CONTRACT_TEMPLATE_RELATIVE, "api-contract")


def extract_requirements(req_path: Path) -> list[tuple[str, str]]:
    """Return list of (REQ-id, title) tuples from requirements.md."""
    text = req_path.read_text(encoding="utf-8")
    pattern = re.compile(r"####\s+(REQ-[\w-]+):\s+(.+)")
    return pattern.findall(text)


def build_matrix_rows(reqs: list[tuple[str, str]]) -> str:
    rows = ["| Requirement | Title | Steps |", "|------------|-------|-------|"]
    for rid, title in reqs:
        rows.append(f"| {rid} | {title} | _TBD_ |")
    return "\n".join(rows)


def build_api_traceability_rows(reqs: list[tuple[str, str]]) -> str:
    rows = [
        "| Requirement | Title | API Operation / Schema | Consumer Notes |",
        "|-------------|-------|------------------------|----------------|",
    ]
    for rid, title in reqs:
        rows.append(f"| {rid} | {title} | _TBD_ | _TBD_ |")
    return "\n".join(rows)


def build_step_stubs(reqs: list[tuple[str, str]]) -> str:
    lines = []
    for i, (rid, title) in enumerate(reqs, start=1):
        lines.append(f"### Step {i}: Implement {title}")
        lines.append(f"- **Requirement:** {rid}")
        lines.append("- **Action:** <!-- CREATE or MODIFY -->")
        lines.append("- **File:** `<!-- full path -->`")
        lines.append("- **Details:** <!-- method signatures, field names -->")
        lines.append("")
    return "\n".join(lines)


def scaffold(
    requirements: Path,
    output: Path,
    *,
    api_contract_output: Path | None = None,
    force: bool = False,
) -> None:
    assert_can_write(output, force)
    if api_contract_output is not None:
        if api_contract_output.resolve() == output.resolve():
            raise SystemExit("api-contract output must be different from implementation-plan output.")
        assert_can_write(api_contract_output, force)
    reqs = extract_requirements(requirements)
    template_path = resolve_template()
    template = template_path.read_text(encoding="utf-8")
    content = (
        template
        .replace("{{DATE}}", datetime.now().strftime("%Y-%m-%d"))
        .replace("{{REQ_FILE}}", str(requirements))
        .replace("{{STEP_COUNT}}", str(len(reqs)))
        .replace("{{STEP_STUBS}}", build_step_stubs(reqs))
        .replace("{{TRACEABILITY_MATRIX}}", build_matrix_rows(reqs))
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")
    print(f"Scaffolded {output}")
    print(f"    Requirements found: {len(reqs)}")
    for rid, title in reqs:
        print(f"      {rid}: {title}")
    print(f"    Template          : {template_path}")

    if api_contract_output is not None:
        api_template_path = resolve_api_contract_template()
        api_template = api_template_path.read_text(encoding="utf-8")
        api_content = (
            api_template
            .replace("{{DATE}}", datetime.now().strftime("%Y-%m-%d"))
            .replace("{{REQ_FILE}}", str(requirements))
            .replace("{{REQ_COUNT}}", str(len(reqs)))
            .replace("{{TRACEABILITY_MATRIX}}", build_api_traceability_rows(reqs))
        )
        api_contract_output.parent.mkdir(parents=True, exist_ok=True)
        api_contract_output.write_text(api_content, encoding="utf-8")
        print(f"Scaffolded {api_contract_output}")
        print(f"    Template          : {api_template_path}")
    print("\nNext step: fill in each step's details using the Architect agent.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scaffold implementation-plan.md")

    parser.add_argument("--workflow-dir", type=Path,
                        help="Run-specific workflow directory (e.g. .workflows/JIRA-123). "
                             f"Derives both --requirements and --output from this directory.")
    parser.add_argument("--requirements", type=Path,
                        help=f"Path to requirements.md (default: <workflow-dir>/{REQ_FILENAME})")
    parser.add_argument("--output", type=Path,
                        help=f"Output file path (default: <workflow-dir>/{OUT_FILENAME})")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite an existing non-empty implementation-plan.md file.")
    parser.add_argument("--include-api-contract", action="store_true",
                        help=f"Also scaffold <workflow-dir>/{API_CONTRACT_FILENAME} for backend API handoff.")
    parser.add_argument("--api-contract-output", type=Path,
                        help="Explicit api-contract.md output path. Implies --include-api-contract.")
    args = parser.parse_args()

    # Resolve workflow dir — explicit or default
    wf_dir = args.workflow_dir if args.workflow_dir else DEFAULT_WF

    req_path = args.requirements if args.requirements else wf_dir / REQ_FILENAME
    out_path = args.output if args.output else wf_dir / OUT_FILENAME

    include_api_contract = args.include_api_contract or args.api_contract_output is not None
    api_contract_path = None
    if include_api_contract:
        api_contract_path = args.api_contract_output if args.api_contract_output else wf_dir / API_CONTRACT_FILENAME

    scaffold(req_path, out_path, api_contract_output=api_contract_path, force=args.force)
