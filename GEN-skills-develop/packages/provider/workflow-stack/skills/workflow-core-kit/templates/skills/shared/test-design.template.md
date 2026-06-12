# Test Design Template (Shared)

## Purpose
Derive TDD-ready unit/behavior cases, end-to-end validation flows, and manual
tester handoff cases from requirements while keeping full requirement-to-test
traceability.

## Inputs
- `requirements.md`
- repository testing conventions and tooling
- installed `tdd` skill principles

## Output
- `test-cases.md` with `TC-U-xxx`, `TC-E2E-xxx`, and `TC-M-xxx` coverage

## Progress Reporting
Emit progress messages exactly in the orchestration protocol format:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Send one `[PROGRESS]` message after each numbered step below. Send `[DONE]`
only after `test-cases.md` is written to the artifact path and coverage
traceability has been checked.

## Step-by-Step Process

### 1. Read Workflow State And Test Conventions
Identify the run-specific artifact paths from `<run_dir>/workflow-state.yml`.

Read repository documentation to confirm:
- fast test framework
- automation or manual validation tooling
- naming conventions
- environment assumptions
- external services, devices, fixtures, or credentials needed for acceptance flows

### 2. Select Suite Execution Strategy
Set the top-level suite strategy before listing cases:
- `fully_automated`
- `manual_only`
- `mixed`
- `blocked`

Every strategy still records all three coverage intents. Use the strategy to
classify whether E2E and manual cases are runnable now, tester-ready, or blocked.

### 3. Categorize Test Types
Use these categories:
- `TC-U-xxx` for unit/behavior tests through the smallest stable public interface.
  These cases drive development TDD cycles.
- `TC-E2E-xxx` for end-to-end user, API, screen, device, CLI, or service flows.
  These cases run after development when dependencies are available, or remain
  blocked with substitute evidence.
- `TC-M-xxx` for manual validation, smoke, exploratory, accessibility,
  device/browser, or business sign-off cases. These can be high-level when
  detailed steps are not yet available.

### 4. Design TC-U Unit / Behavior Cases Per Requirement
For each `REQ-xxx`, define at least one `TC-U-xxx` case for observable behavior.

Each case must include:
- priority (`P0`, `P1`, or `P2`)
- development order
- dependencies on earlier `TC-U-xxx` cases
- public interface or entry point
- observable behavior
- preconditions/state
- input/action
- expected result
- boundary doubles limited to true system boundaries

Do not specify private methods, call order, or internal collaborator mocks.

### 5. Design TC-E2E Flows Per Requirement
For each `REQ-xxx`, define at least one `TC-E2E-xxx` case, even when the flow is
blocked by missing dependencies.

Each `TC-E2E-xxx` should capture:
- execution mode: `fully_automated` or `blocked_by_dependency`
- automation channel
- required services and environment dependencies
- whether the flow can run now
- substitute validation evidence when blocked
- action/request/flow steps
- preconditions
- required test data
- expected outcome
- explicit assertions
- log or error expectations where relevant
- evidence to capture

Blocked cases must name the missing dependency and what evidence can be
collected until the dependency exists.

### 6. Design TC-M Manual Cases Per Requirement
For each `REQ-xxx`, define at least one `TC-M-xxx` manual case.

Each `TC-M-xxx` should capture:
- manual scope
- tester prerequisites
- required test data
- step-by-step tester actions, or high-level validation steps when detail is not yet available
- expected result
- evidence to capture
- blockers, or `none`

### 7. Add Negative E2E And Manual Scenarios
For each meaningful flow, include failure-oriented cases such as:
- unauthenticated access
- insufficient permissions
- malformed input
- missing resources
- unavailable backend/service/device dependencies
- degraded upstream behavior where relevant

### 8. Build The Traceability Matrix
Map each `REQ-xxx` to the corresponding `TC-U-xxx`, `TC-E2E-xxx`, and `TC-M-xxx` IDs.

No requirement should be left without unit, end-to-end, and manual coverage intent.

### 9. Fill The Canonical Output Template
Write the final test-case document using:
- `templates/skills/shared/test-cases-template.md`

Write the output to the run-specific artifact path recorded in `<run_dir>/workflow-state.yml`.

## Verification Checklist
- [ ] Suite execution strategy is declared
- [ ] Every `REQ-xxx` has at least one planned `TC-U-xxx` unit/behavior case
- [ ] Every `TC-U-xxx` has priority, dependency order, public interface, and observable behavior
- [ ] `TC-U-xxx` cases avoid implementation-detail assertions
- [ ] Every `REQ-xxx` has at least one `TC-E2E-xxx` end-to-end flow or explicit blocked flow
- [ ] `TC-E2E-xxx` cases include execution mode, automation channel, services, data, expected result, assertions, and evidence
- [ ] Every `REQ-xxx` has at least one `TC-M-xxx` manual case
- [ ] Manual suites include tester-ready or explicitly high-level handoff steps
- [ ] Blocked flows include missing dependency and substitute validation evidence
- [ ] Negative E2E and manual scenarios were included for meaningful risks
- [ ] Test IDs are unique and stable
- [ ] The traceability matrix is complete
