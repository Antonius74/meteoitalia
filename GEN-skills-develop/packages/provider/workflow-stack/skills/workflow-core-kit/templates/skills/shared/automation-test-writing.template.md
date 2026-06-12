# Automation Test Writing Template (Shared)

## Purpose
Turn approved `TC-E2E-xxx` flows into executable automation where the
environment is ready, preserve `TC-M-xxx` manual coverage as handoff items, and
record automation data requirements for the runner.

## Inputs
- `<run_dir>/workflow-state.yml`
- `test-cases.md`
- `implementation-plan.md`
- `api-contract.md` when present
- repository automation conventions from `README.md` and local workflow docs

## Output
- automation source files for runnable `TC-E2E-xxx` flows
- `automation-test-data.md` at `artifacts.automation_test_data`
- completion summary listing automated, manual, and blocked flows separately

## Progress Reporting
Emit progress messages exactly in the orchestration protocol format:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Send one `[PROGRESS]` message after each numbered step below. Send `[DONE]`
only after the automation files and data artifact are complete or a blocker is
recorded.

## Step-by-Step Process

### 1. Read Workflow State And Acceptance Backlog
Read `<run_dir>/workflow-state.yml` and identify:
- `artifacts.test_cases`
- `artifacts.implementation_plan`
- `artifacts.api_contract` when present
- `artifacts.automation_test_data`

Read `test-cases.md` and preserve its execution-mode classification.

### 2. Select Runnable Automation Scope
Implement only `TC-E2E-xxx` cases whose execution mode is `fully_automated` and
whose required services, devices, credentials, data, and feature flags are
available or can be parameterized safely.

Do not convert `TC-M-xxx` manual cases or blocked `TC-E2E-xxx` cases into
automation by assumption. Carry them into handoff sections.

### 3. Write Automation Files
Create or modify automation files following the repository's existing test
framework, naming conventions, fixture style, and environment handling.

Keep secrets and environment-specific values parameterized. Do not hard-code
credentials, service URLs, device identifiers, or production data.

### 4. Write Automation Test Data Artifact
Write `artifacts.automation_test_data` with:
- automated `TC-E2E-xxx` IDs and commands
- required services and readiness assumptions
- fixture and seed data requirements
- required environment variables and feature flags
- `TC-M-xxx` manual handoff cases with tester-ready steps
- blocked `TC-E2E-xxx` / `TC-M-xxx` cases with owner, missing dependency, substitute evidence, and risk

### 5. Run Authoring Validation
Run the smallest available validation for the automation files, such as format,
lint, typecheck, dry-run discovery, or focused smoke execution.

If validation cannot run because the environment is unavailable, record the
blocker in `automation-test-data.md`.

### 6. Report Completion
Report:
- automation files created or modified
- automated `TC-E2E-xxx` IDs
- manual handoff `TC-M-xxx` IDs
- blocked `TC-E2E-xxx` / `TC-M-xxx` IDs and blockers
- validation command and result

## Exit Criteria
- Runnable `fully_automated` `TC-E2E-xxx` flows have automation or an explicit
  blocker.
- Manual and blocked flows remain represented for Gate 4 review.
- `artifacts.automation_test_data` is written.
- Authoring validation passed or the inability to run it is explicitly recorded.
- `[DONE]` was emitted with the automation authoring status.
