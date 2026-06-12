#!/usr/bin/env python3
from __future__ import annotations

"""
init_test_design.py — scaffold test-cases.md pre-populated with
requirement stubs extracted from requirements.md.

Usage:
    # Preferred — let the script derive all paths from the run directory:
    python init_test_design.py --workflow-dir .workflows/JIRA-123

    # Explicit paths (backward-compatible):
    python init_test_design.py \
        --requirements .workflows/JIRA-123/requirements.md \
        --output .workflows/JIRA-123/test-cases.md
"""
import argparse
import re
from datetime import datetime
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
SHARED_TEMPLATE_RELATIVE = Path("templates/skills/shared/test-cases-template.md")
VARIANT_TEMPLATE_NAME = "test-cases-template.md"
VARIANT_SECTIONS_TOKEN = "{{VARIANT_TEST_CASE_SECTIONS}}"
VARIANT_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

REQ_FILENAME = "requirements.md"
OUT_FILENAME = "test-cases.md"
DEFAULT_WF   = Path(".workflows")


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


def workflow_core_roots() -> list[Path]:
    return [workflow_core_root()]


def normalize_variant(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if not normalized:
        return None
    if VARIANT_SLUG_RE.fullmatch(normalized) is None:
        raise SystemExit(
            "Invalid --variant value: "
            f"{value}. variant must be kebab-case, for example frontend or frontend-react."
        )
    return normalized


def variant_resolution_chain(variant: str) -> tuple[str, ...]:
    segments = variant.split("-")
    return tuple("-".join(segments[:index]) for index in range(len(segments), 0, -1))


def resolve_template(relative_path: Path, label: str) -> Path:
    candidates = [root / relative_path for root in workflow_core_roots()]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    searched = "\n".join(f"- {candidate}" for candidate in candidates)
    raise FileNotFoundError(
        f"Unable to locate the {label}. Checked:\n"
        f"{searched}"
    )


def resolve_variant_templates(variant: str | None) -> list[Path]:
    normalized = normalize_variant(variant)
    if normalized is None:
        return []

    selected: list[Path] = []
    for candidate_name in reversed(variant_resolution_chain(normalized)):
        relative_path = Path("templates") / "skills" / candidate_name / VARIANT_TEMPLATE_NAME
        for root in workflow_core_roots():
            candidate = root / relative_path
            if candidate.exists():
                selected.append(candidate)
                break
    return selected


def render_variant_sections(variant: str | None) -> str:
    sections = [
        template.read_text(encoding="utf-8").strip()
        for template in resolve_variant_templates(variant)
    ]
    if not sections:
        return ""
    return "\n\n---\n\n".join(sections) + "\n"


def extract_requirements(req_path: Path) -> list[tuple[str, str]]:
    text = req_path.read_text(encoding="utf-8")
    return re.compile(r"####\s+(REQ-[\w-]+):\s+(.+)").findall(text)


def build_unit_stubs(reqs: list[tuple[str, str]]) -> str:
    lines = []
    counter = 1
    for rid, title in reqs:
        tc_id = f"TC-U-{counter:03d}"
        lines += [
            f"### {tc_id}: {title} - Core Behavior",
            f"- **Requirement:** {rid}",
            "- **Priority:** `<!-- P0 | P1 | P2 -->`",
            f"- **Development order:** {counter}",
            "- **Depends on:** `none`",
            "- **Public interface / entry point:** `<!-- e.g. AuthService.register(), POST /api/auth/register, CheckoutScreen.submit() -->`",
            "- **Observable behavior:** <!-- what user/caller can observe -->",
            "- **Preconditions / state:** <!-- required state before the action -->",
            "- **Input / action:** <!-- public input or user action -->",
            "- **Expected result:** <!-- return value, state, rendered output, response, or error -->",
            "- **Boundary doubles:** `<!-- none | external API | clock | filesystem | device | persistence | other true boundary -->`",
            "- **Notes:** <!-- edge cases such as null, empty, boundary, duplicate, conflict -->",
            "",
        ]
        counter += 1
    return "\n".join(lines)


def build_e2e_stubs(reqs: list[tuple[str, str]]) -> str:
    lines = []
    counter = 1
    for rid, title in reqs:
        tc_id = f"TC-E2E-{counter:03d}"
        lines += [
            f"### {tc_id}: {title} - End-to-end flow",
            f"- **Requirement:** {rid}",
            "- **Execution mode:** `<!-- fully_automated | blocked_by_dependency -->`",
            "- **Automation channel:** `<!-- api_e2e | browser_e2e | mobile_e2e | cli_e2e | other -->`",
            "- **Required services:** <!-- backend API, auth provider, database seed, device, third-party system, etc. -->",
            "- **Can run now:** `<!-- yes | no -->`",
            "- **If blocked:** <!-- missing dependency and substitute validation evidence -->",
            "- **Action / Request / Flow:** <!-- HTTP call, UI interaction, device gesture, or manual tester flow -->",
            "- **Preconditions:** <!-- system state required before the test runs -->",
            "- **Test data:**",
            "  - <!-- N user accounts needed: role, status, specific attributes -->",
            "  - <!-- entity records or fixtures required -->",
            "  - <!-- configuration values or feature flags -->",
            "- **Expected outcome:** <!-- status code · screen state · response fields -->",
            "- **Assertions:** <!-- specific checks the test runner must perform -->",
            "- **Evidence to capture:** <!-- logs, screenshots, report, trace, exported artifact -->",
            "- **Log assertion:** No unexpected ERROR entries in application logs for this action",
            "",
        ]
        counter += 1
    return "\n".join(lines)


def build_manual_stubs(reqs: list[tuple[str, str]]) -> str:
    lines = []
    counter = 1
    for rid, title in reqs:
        tc_id = f"TC-M-{counter:03d}"
        lines += [
            f"### {tc_id}: {title} - Manual validation",
            f"- **Requirement:** {rid}",
            "- **Scope:** <!-- manual smoke, exploratory validation, accessibility check, device/browser check, business sign-off, etc. -->",
            "- **Tester prerequisites:** <!-- app/service state, accounts, devices, credentials, data setup -->",
            "- **Test data:** <!-- users, roles, entity records, fixtures, feature flags, locale, device/browser -->",
            "- **Steps:**",
            "  1. <!-- tester action -->",
            "  2. <!-- tester action -->",
            "  3. <!-- tester action -->",
            "- **Expected result:** <!-- observable outcome a tester can confirm -->",
            "- **Evidence to capture:** <!-- screenshot, recording, exported report, logs, notes -->",
            "- **Blocked by:** `<!-- none | missing environment/data/device/credential/design approval/other -->`",
            "",
        ]
        counter += 1
    return "\n".join(lines)


def build_matrix(reqs: list[tuple[str, str]]) -> str:
    rows = ["| Requirement | Title | Unit / Behavior Cases | End-to-End Flows | Manual Cases |",
            "|------------|-------|-----------------------|------------------|--------------|"]
    for i, (rid, title) in enumerate(reqs, start=1):
        rows.append(
            f"| {rid} | {title} | TC-U-{i:03d} | TC-E2E-{i:03d} | TC-M-{i:03d} |"
        )
    return "\n".join(rows)


def scaffold(requirements: Path, output: Path, *, force: bool = False, variant: str | None = None) -> None:
    assert_can_write(output, force)
    reqs = extract_requirements(requirements)
    template_path = resolve_template(SHARED_TEMPLATE_RELATIVE, "shared test-cases template")
    template = template_path.read_text(encoding="utf-8")
    content = (
        template
        .replace("{{DATE}}", datetime.now().strftime("%Y-%m-%d"))
        .replace("{{REQ_FILE}}", str(requirements))
        .replace("{{UNIT_STUBS}}", build_unit_stubs(reqs))
        .replace("{{E2E_STUBS}}", build_e2e_stubs(reqs))
        .replace("{{MANUAL_STUBS}}", build_manual_stubs(reqs))
        .replace(VARIANT_SECTIONS_TOKEN, render_variant_sections(variant))
        .replace("{{TRACEABILITY_MATRIX}}", build_matrix(reqs))
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")
    print(
        f"Scaffolded {output}  "
        f"({len(reqs)} requirements -> {len(reqs)} TC-U + {len(reqs)} TC-E2E + {len(reqs)} TC-M stubs)"
    )
    print(f"    Template: {template_path}")
    print("\nNext step: fill in each test case using the Test-Designer agent.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scaffold test-cases.md")

    parser.add_argument("--workflow-dir", type=Path,
                        help="Run-specific workflow directory (e.g. .workflows/JIRA-123). "
                             "Derives both --requirements and --output from this directory.")
    parser.add_argument("--requirements", type=Path,
                        help=f"Path to requirements.md (default: <workflow-dir>/{REQ_FILENAME})")
    parser.add_argument("--output", type=Path,
                        help=f"Output file path (default: <workflow-dir>/{OUT_FILENAME})")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite an existing non-empty test-cases.md file.")
    parser.add_argument("--variant",
                        help="Optional workflow variant used to append output-template overlays "
                             "(for example frontend or frontend-react).")
    args = parser.parse_args()

    wf_dir = args.workflow_dir if args.workflow_dir else DEFAULT_WF

    req_path = args.requirements if args.requirements else wf_dir / REQ_FILENAME
    out_path = args.output       if args.output       else wf_dir / OUT_FILENAME

    scaffold(req_path, out_path, force=args.force, variant=args.variant)
