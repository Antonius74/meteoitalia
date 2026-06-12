#!/usr/bin/env python3
"""
init_orchestration.py — initialise workflow state and print the execution plan.

Usage:
    python init_orchestration.py \\
        --issues PROJ-101 PROJ-102 \\
        --branch feature/xyz \\
        --run PROJ-101-102_state_machine

The --run value becomes the leaf folder name inside .workflows/.
All agent-produced Markdown artefacts for this workflow run are stored there.
workflow-state.yml is also written into this directory.
Example run dir: .workflows/PROJ-101-102_state_machine/

Naming convention for --run:
    <JIRA-KEYS>_<short-slug>   e.g. PROJ-101-102_user-auth   or  PROJ-205_checkout-flow
"""

import argparse
from datetime import datetime
from pathlib import Path
import re

SKILL_DIR = Path(__file__).resolve().parent.parent
SHARED_TEMPLATE_RELATIVE = Path("templates/skills/shared/workflow-state-template.yml")

# Base artefact directory — never write directly here; use the run subdir.
BASE_WF_DIR = Path(".workflows")

# Phases that run in parallel with the immediately preceding phase
PARALLEL_PHASES = {"3b-test-design", "7b-automation-test-writing"}

# Human gate phases
GATE_PHASES = {
    "2-requirements-review",
    "4-design-review",
    "6-code-review",
    "8-pre-deploy-review",
}


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
        "Unable to locate the shared workflow-state template. Checked:\n"
        f"- {candidate}"
    )


def yaml_single_quoted(value: str) -> str:
    # YAML single quotes escape by doubling the quote character.
    return "'" + value.replace("'", "''") + "'"


def render_jira_issues(issues: list[str]) -> str:
    if not issues:
        return "[]"
    return "[" + ", ".join(yaml_single_quoted(issue) for issue in issues) + "]"


def extract_phases(template_text: str) -> list[str]:
    return re.findall(r"^  ([^:#][^:]*):\s+pending(?:\s+#.*)?$", template_text, re.MULTILINE)


def render_state(template_text: str, issues: list[str], branch: str, run: str, workflow_dir: Path) -> str:
    wf = str(workflow_dir)
    replacements = {
        "{{STARTED_AT}}": datetime.now().isoformat(),
        "{{BRANCH}}": branch,
        "{{JIRA_ISSUES}}": render_jira_issues(issues),
        "{{RUN}}": run,
        "{{RUN_DIR}}": wf,
        "{{ART_REQUIREMENTS}}": f"{wf}/requirements.md",
        "{{ART_IMPLEMENTATION_PLAN}}": f"{wf}/implementation-plan.md",
        "{{ART_API_CONTRACT}}": f"{wf}/api-contract.md",
        "{{ART_TEST_CASES}}": f"{wf}/test-cases.md",
        "{{ART_AUTOMATION_TEST_DATA}}": f"{wf}/automation-test-data.md",
        "{{ART_AUTOMATION_REPORT}}": f"{wf}/automation-test-report.md",
    }

    content = template_text
    for key, value in replacements.items():
        content = content.replace(key, value)
    return content


def scaffold(issues: list[str], branch: str, run: str, *, force: bool = False) -> None:
    workflow_dir = BASE_WF_DIR / run
    state_path = workflow_dir / "workflow-state.yml"
    assert_can_write(state_path, force)

    # ------------------------------------------------------------------ #
    # 1. Create run-specific workflow directory                          #
    # ------------------------------------------------------------------ #
    workflow_dir.mkdir(parents=True, exist_ok=True)
    print(f"Run directory created : {workflow_dir}/")
    print("    This is the canonical folder for ALL agent-produced Markdown")
    print("    artefacts for this workflow run. Pass it to every subagent.")
    print("    Agents must NEVER write workflow Markdown to the project root")
    print("    or to the base .workflows/ folder directly.")

    # ------------------------------------------------------------------ #
    # 2. Write workflow state                                            #
    # ------------------------------------------------------------------ #
    template_path = resolve_template()
    template_text = template_path.read_text(encoding="utf-8")
    phases = extract_phases(template_text)
    if not phases:
        raise ValueError(f"workflow-state template has no phases: {template_path}")

    state_content = render_state(template_text, issues, branch, run, workflow_dir)
    state_path.write_text(state_content, encoding="utf-8")

    print()
    print(f"Workflow state initialised: {state_path}")
    print(f"   Run    : {run}")
    print(f"   Issues : {', '.join(issues)}")
    print(f"   Branch : {branch}")
    print(f"   Template: {template_path}")

    # ------------------------------------------------------------------ #
    # 3. Print execution plan                                            #
    # ------------------------------------------------------------------ #
    print()
    print("Execution Plan:")
    for phase in phases:
        gate = " ← HUMAN GATE" if phase in GATE_PHASES else ""
        parallel = " [parallel with prev]" if phase in PARALLEL_PHASES else ""
        print(f"   {phase}{parallel}{gate}")

    # ------------------------------------------------------------------ #
    # 4. Print next-step guidance for the orchestrator                  #
    # ------------------------------------------------------------------ #
    wf = workflow_dir
    print()
    print(f"Run artefact dir: {wf}/")
    print("    Pass --workflow-dir to each skill's init script, OR pass")
    print("    the full artefact path (e.g. requirements, plan, test-cases)")
    print("    to each subagent's handoff message.  Paths are recorded in")
    print(f"    {state_path} under 'artifacts' for reference.")
    print()
    print("Next step: run the Planner agent to start Phase 1.")
    planning_skill = SKILL_DIR.parent / "workflow-planning-kit" / "SKILL.md"
    planning_script = SKILL_DIR.parent / "workflow-planning-kit" / "scripts" / "init_planning.py"
    if planning_skill.exists():
        print(f"  Skill : {planning_skill}")
    else:
        print("  Skill : workflow-planning-kit")
    print(f"  Init  : python {planning_script} \\")
    print(f"            --workflow-dir {wf} \\")
    print(f"            --issues {' '.join(issues)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialise workflow state")
    parser.add_argument("--issues", nargs="+", required=True,
                        metavar="KEY", help="Jira issue keys")
    parser.add_argument("--branch", default="feature/ai-workflow",
                        help="Git branch name")
    parser.add_argument("--run", required=True,
                        help="Leaf folder name for this workflow run "
                             "(e.g. PROJ-101-102_state-machine). "
                             "Created as .workflows/<run>/")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite an existing non-empty workflow-state.yml file.")
    args = parser.parse_args()
    scaffold(args.issues, args.branch, args.run, force=args.force)
