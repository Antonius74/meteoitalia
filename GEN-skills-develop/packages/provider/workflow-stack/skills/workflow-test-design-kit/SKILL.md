---
name: workflow-test-design-kit
description: Produce requirement-traceable unit, end-to-end, and manual test backlogs.
---

# Test-Design Skill - Requirements -> TDD-Ready Test Backlog

## Purpose
Produce a comprehensive, traceable `test-cases.md` artifact that is ready for
three downstream uses:

- `TC-U-xxx` unit/behavior cases drive the Developer's TDD red-green-refactor cycles.
- `TC-E2E-xxx` end-to-end flows provide automated validation or blocked-flow tracking.
- `TC-M-xxx` manual cases provide tester-ready or high-level human validation handoff.

Apply the installed `tdd` skill principles when designing `TC-U-xxx` cases.
This skill creates prioritized test-design backlogs, not executable test files.

## Quickstart
The orchestrator provides `--workflow-dir` as the run-specific directory. Scaffold the file:
```bash
python ./scripts/init_test_design.py \
    --workflow-dir <run_dir>
```
When a workflow variant is active, pass it too so variant output-template
sections are included:
```bash
python ./scripts/init_test_design.py \
    --workflow-dir <run_dir> \
    --variant <variant>
```

## Progress Reporting
When this skill is run by the workflow orchestrator, emit progress messages
exactly in this format after each numbered step:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Use `M = 8` for this skill's Step-by-Step Process. Emit `[DONE]` only after
`test-cases.md` is written to `artifacts.test_cases` and coverage traceability
has been checked.

## Variant Overlays

Use the shared test-design process as the base, then apply exactly one matching
runtime variant overlay when the installed runtime variant is known.

| Runtime variant | Test-design overlay | Output scaffold overlay |
|-----------------|---------------------|--------------------------|
| `frontend` or `frontend-react` | `../workflow-core-kit/templates/skills/frontend/test-design.template.md` | `../workflow-core-kit/templates/skills/frontend/test-cases-template.md` |
| `backend` or `backend-java` | `../workflow-core-kit/templates/skills/backend/test-design.template.md` | none |
| `mobile-android` | `../workflow-core-kit/templates/skills/mobile-android/test-design.template.md` | none |
| `mobile-ios` | `../workflow-core-kit/templates/skills/mobile-ios/test-design.template.md` | none |

For frontend React runs, scaffold with `--variant frontend-react` so the shared
output template includes the frontend test-case sections. The scaffold resolver
falls back from `frontend-react` to the generic `frontend` overlay.

## Step-by-Step Process

### 1 - Read Workflow State, README.md, and TDD Guidance
Read `<run_dir>/workflow-state.yml` and note `workflow.run_dir`, `artifacts.requirements`,
and `artifacts.test_cases`. All file paths use these values.

Read the repository README.md to understand the project's domain, test tool,
and any testing conventions already established.

Read and apply the installed `tdd` skill guidance:
- Design tests around observable behavior through public interfaces.
- Avoid implementation-detail cases that assert private methods, call order, or internal collaborators.
- Mock or stub only true system boundaries such as external APIs, time, randomness,
  filesystem, devices, or costly infrastructure.

### 2 - Choose Suite Execution Strategy
Set one suite-level execution strategy:

| Strategy | Meaning |
|----------|---------|
| `fully_automated` | `TC-E2E-xxx` flows are expected to run automatically; `TC-M-xxx` still records manual smoke/sign-off intent. |
| `manual_only` | E2E automation is not planned for this run; `TC-E2E-xxx` entries are blocked or deferred and `TC-M-xxx` carries executable tester handoff. |
| `mixed` | Some `TC-E2E-xxx` flows are automated, some are blocked/deferred, and `TC-M-xxx` manual coverage remains explicit. |
| `blocked` | E2E/manual coverage cannot run yet because required dependencies are unavailable; record blocked cases and substitute evidence. |

Do not leave generated sections empty. When a coverage type cannot run now,
create a blocked or high-level case with substitute evidence instead.

### 3 - Categorize Test Types
| Type | Scope | ID Prefix |
|------|-------|-----------|
| Unit / Behavior | Fast test through the smallest stable public interface available. Used by development as the TDD backlog. | `TC-U-` |
| End-to-End | End-to-end user, API, screen, device, CLI, or service flow. Used after development as automated validation or blocked-flow tracking. | `TC-E2E-` |
| Manual | Human-executed validation, smoke, exploratory, device/browser, accessibility, or business sign-off case. Can be high-level when details are not yet available. | `TC-M-` |

### 4 - Design TC-U Unit / Behavior Cases Per Requirement
For each `REQ-xxx`, define at least one `TC-U-xxx` case that covers the core observable behavior.

Each `TC-U-xxx` must include:
- Requirement ID
- Priority: `P0`, `P1`, or `P2`
- Development order
- Dependencies on earlier `TC-U-xxx` cases, or `none`
- Public interface or entry point
- Observable behavior being verified
- Preconditions or state
- Input/action
- Expected result
- Boundary doubles, limited to true system boundaries

Cover happy paths, boundary values, empty/null input, duplicate/conflict cases,
and negative/rejection cases where they materially affect the requirement.

### 5 - Design TC-E2E End-to-End Flows Per Requirement
For each `REQ-xxx`, define at least one `TC-E2E-xxx` case, even when it is high
level or blocked by missing services, devices, seeded data, credentials, or
third-party systems.

Each `TC-E2E-xxx` must include:
- Requirement ID
- Execution mode: `fully_automated` or `blocked_by_dependency`
- Automation channel: `api_e2e`, `browser_e2e`, `mobile_e2e`, `cli_e2e`, or project-specific equivalent
- Required services and environment dependencies
- Whether the flow can run now
- Substitute validation evidence when blocked
- Action/request/flow steps
- Preconditions
- Test data, including users, roles, entity records, fixtures, configuration,
  feature flags, devices, or external stubs
- Expected outcome
- Assertions
- Log/error assertion
- Evidence to capture

For blocked cases, name the blocker and the substitute evidence that can be used
until dependencies are available.

### 6 - Design TC-M Manual Cases Per Requirement
For each `REQ-xxx`, define at least one `TC-M-xxx` manual case. Keep it
tester-ready when enough information exists; otherwise keep it high-level but
still explicit about scope, prerequisites, expected result, and evidence.

Each `TC-M-xxx` must include:
- Requirement ID
- Manual scope
- Tester prerequisites
- Test data
- Step-by-step actions, or high-level validation steps when detail is not yet available
- Expected result
- Evidence to capture
- Blocker, or `none`

### 7 - Add Negative E2E And Manual Scenarios
For every meaningful flow, include failure-oriented cases such as:
- unauthenticated access
- insufficient permissions
- malformed or missing input
- missing resources
- unavailable backend/service/device dependency
- degraded upstream behavior where relevant

### 8 - Build Traceability Matrix
Map every `REQ-xxx` to its `TC-U-xxx`, `TC-E2E-xxx`, and `TC-M-xxx` IDs.

No requirement should be left without planned unit, end-to-end, and manual
coverage intent. If a requirement has no executable E2E flow because
dependencies are missing, record the blocked `TC-E2E-xxx` and the substitute
validation evidence.

## Output Template
Use `../workflow-core-kit/templates/skills/shared/test-cases-template.md`. When the
active variant has a matching output overlay, append that overlay through the
scaffold command's `--variant` option.
See `examples/example-test-cases.md` for a complete filled-in reference.

## Verification Checklist
Run through every item before handing off to Gate 2 approval:

- [ ] `--workflow-dir` was received from the orchestrator and `artifacts.*` paths are confirmed
- [ ] Suite execution strategy is set to `fully_automated`, `manual_only`, `mixed`, or `blocked`
- [ ] Every `REQ-xxx` has at least one `TC-U-xxx` unit/behavior case
- [ ] Every `TC-U-xxx` has priority, dependency order, public interface, and observable behavior
- [ ] `TC-U-xxx` cases avoid implementation-detail assertions and internal collaborator mocks
- [ ] Every `REQ-xxx` has at least one `TC-E2E-xxx` end-to-end flow or an explicit blocked flow
- [ ] Every `TC-E2E-xxx` has execution mode, automation channel, required services, test data, expected outcome, assertions, and evidence
- [ ] Every `REQ-xxx` has at least one `TC-M-xxx` manual case, even if high-level
- [ ] Manual-only and mixed suites include tester-ready or explicitly high-level Manual Test Handoff entries
- [ ] Blocked flows name the missing dependency and substitute validation evidence
- [ ] Negative E2E and manual scenarios are defined for meaningful requirement/flow risks
- [ ] TC IDs are unique and sequential within each prefix
- [ ] Traceability matrix is complete with no `REQ-xxx` left unmapped
