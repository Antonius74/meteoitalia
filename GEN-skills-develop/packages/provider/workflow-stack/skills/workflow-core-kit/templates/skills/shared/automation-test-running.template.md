# Automation Test Running Template (Shared)

## Purpose
Execute runnable automated `TC-E2E-xxx` flows, capture acceptance evidence,
report `TC-M-xxx` manual and blocked flows separately, and route structured fix
requests when runtime failures require production changes.

## Inputs
- `<run_dir>/workflow-state.yml`
- `test-cases.md`
- `automation-test-data.md`
- automation source files and repository run commands
- required services, devices, credentials, fixtures, and feature flags

## Output
- `automation-test-report.md` at `artifacts.automation_report`
- structured fix request to the developer when executable acceptance behavior fails
- final acceptance status separated into passed, failed, manual, and blocked cases

## Progress Reporting
Emit progress messages exactly in the orchestration protocol format:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Send one `[PROGRESS]` message after each numbered step below. Send `[DONE]`
only after `artifacts.automation_report` is written.

## Step-by-Step Process

### 1. Read Workflow State And Runner Inputs
Read `<run_dir>/workflow-state.yml` and identify:
- `artifacts.test_cases`
- `artifacts.automation_test_data`
- `artifacts.automation_report`

Read the automation data artifact before preparing the environment.

### 2. Prepare Runtime Dependencies
Prepare only the services, fixtures, devices, credentials, and feature flags
declared in `automation-test-data.md`.

If a required dependency is missing, mark the affected `TC-E2E-xxx` or
`TC-M-xxx` as blocked and record substitute validation evidence. Do not silently
pass blocked flows.

### 3. Run Executable TC-E2E Flows
Run the automated queue using repository-approved commands.

Capture for each runnable `TC-E2E-xxx`:
- command
- environment or device target
- status
- assertion result
- log or trace evidence
- screenshot, report, or artifact path when applicable

### 4. Diagnose Failures
For failed executable flows, decide whether the failure is:
- product behavior requiring a developer fix
- automation defect requiring test repair
- environment or dependency blocker

Do not send production fix requests for automation defects or environment
blockers.

### 5. Write Automation Test Report
Write `artifacts.automation_report` using this structure:

```markdown
# Automation Test Report

## Summary
- **Automated passed:** <count>
- **Automated failed:** <count>
- **Manual handoff:** <count>
- **Blocked:** <count>

## Executed TC-E2E Results
| TC-E2E | Requirement | Command | Status | Evidence |
|------|-------------|---------|--------|----------|

## Manual Handoff
| TC-M | Requirement | Tester Steps Source | Evidence Needed |
|------|-------------|---------------------|-----------------|

## Blocked Flows
| Case | Missing Dependency | Substitute Evidence | Risk |
|------|--------------------|---------------------|------|

## Fix Requests
<!-- Include one structured fix request per production behavior failure. -->
```

### 6. Produce Fix Requests When Needed
For production behavior failures, include this format in the report and send it
to the developer:

```markdown
## Fix Request
- **Source phase:** automation-test-running
- **Requirement:** REQ-xxx
- **Test case:** TC-E2E-xxx
- **Failing command:** `<command>`
- **Failure summary:** <what failed>
- **Expected behavior:** <approved expected behavior>
- **Observed behavior:** <actual behavior>
- **Environment:** <service/device/browser/app target>
- **Evidence:** <short log excerpt or artifact path>
```

### 7. Report Completion
Report the report path, pass/fail/manual/blocked counts, and whether fix
requests were created.

## Exit Criteria
- Every runnable `TC-E2E-xxx` was executed or explicitly blocked.
- Manual cases are handed off with evidence expectations.
- Blocked cases name missing dependencies and substitute evidence.
- `artifacts.automation_report` is written.
- Production behavior failures have structured fix requests.
- `[DONE]` was emitted with the report path and final status.
